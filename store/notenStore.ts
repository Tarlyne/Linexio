import { v4 as uuidv4 } from 'uuid';
import {
    Notenkategorie, Leistungsnachweis, EinzelLeistung, EinzelLeistungsNote,
    KlausuraufgabePunkte, NotenschluesselMap,
    Klausuraufgabe, DEFAULT_NOTENSCHLUESSEL_MAP, NotenKategorieTyp, Lerngruppe, Schueler, PREDEFINED_NOTENSYSTEME, Notensystem, NoteMapEntry, ColumnDef, ManuelleNote, ManuelleNoteZiel, SchuelerLeistungsnachweisFeedback
} from '../context/types';
import { berechneSammelnoteDurchschnitt, berechneKlausurNote, getPointsToNoteMap } from '../services/NotenberechnungService';
import { db } from './db';
import { NOTENKATEGORIEN_KEY, LEISTUNGSNACHWEISE_KEY, EINZELLEISTUNGEN_KEY, EINZELLEISTUNGSNOTEN_KEY, KLAUSURAUFGABENPUNKTE_KEY, NOTENSCHLUESSEL_MAP_KEY, MANUELLE_NOTEN_KEY, SCHUELER_LN_FEEDBACK_KEY } from './keys';

// --- State & Listener Setup ---

interface NotenState {
    notenkategorien: Notenkategorie[];
    leistungsnachweise: Leistungsnachweis[];
    einzelLeistungen: EinzelLeistung[];
    einzelLeistungsNoten: EinzelLeistungsNote[];
    klausuraufgabePunkte: KlausuraufgabePunkte[];
    notenschluesselMap: NotenschluesselMap;
    manuelleNoten: ManuelleNote[];
    schuelerLeistungsnachweisFeedback: SchuelerLeistungsnachweisFeedback[];
    // Calculated data
    columns: ColumnDef[];
    schuelerLeistungsnachweisNotenMap: Map<string, NoteMapEntry>;
    schuelerKategorieNotenMap: Map<string, NoteMapEntry>;
    schuelerHalbjahresNotenMap: Map<string, NoteMapEntry>;
    schuelerGesamtNotenMap: Map<string, NoteMapEntry>;
}

let state: NotenState = {
    notenkategorien: [],
    leistungsnachweise: [],
    einzelLeistungen: [],
    einzelLeistungsNoten: [],
    klausuraufgabePunkte: [],
    notenschluesselMap: DEFAULT_NOTENSCHLUESSEL_MAP,
    manuelleNoten: [],
    schuelerLeistungsnachweisFeedback: [],
    // Calculated data
    columns: [],
    schuelerLeistungsnachweisNotenMap: new Map(),
    schuelerKategorieNotenMap: new Map(),
    schuelerHalbjahresNotenMap: new Map(),
    schuelerGesamtNotenMap: new Map(),
};

const listeners = new Set<() => void>();

const notify = () => {
  listeners.forEach(listener => listener());
};

const persistState = async () => {
  await db.set(NOTENKATEGORIEN_KEY, state.notenkategorien);
  await db.set(LEISTUNGSNACHWEISE_KEY, state.leistungsnachweise);
  await db.set(EINZELLEISTUNGEN_KEY, state.einzelLeistungen);
  await db.set(EINZELLEISTUNGSNOTEN_KEY, state.einzelLeistungsNoten);
  await db.set(KLAUSURAUFGABENPUNKTE_KEY, state.klausuraufgabePunkte);
  await db.set(NOTENSCHLUESSEL_MAP_KEY, state.notenschluesselMap);
  await db.set(MANUELLE_NOTEN_KEY, state.manuelleNoten);
  await db.set(SCHUELER_LN_FEEDBACK_KEY, state.schuelerLeistungsnachweisFeedback);
};

// --- Recalculation Engine ---

const recalculateNotenForLerngruppe = (
    lerngruppe: Lerngruppe | null,
    schuelerInLerngruppe: Schueler[],
    isTargetedUpdate: boolean = false
) => {
    if (!lerngruppe || schuelerInLerngruppe.length === 0) {
        if (!isTargetedUpdate) { // Only clear if it's a full update for an empty group
             state = { ...state, columns: [], schuelerLeistungsnachweisNotenMap: new Map(), schuelerKategorieNotenMap: new Map(), schuelerHalbjahresNotenMap: new Map(), schuelerGesamtNotenMap: new Map() };
             notify(); // Notify components about the cleared state
        }
        return;
    }

    const notensystem = PREDEFINED_NOTENSYSTEME.find(ns => ns.id === lerngruppe.notensystemId);
    if (!notensystem) return;
    
    // --- Phase 1: Column structure (only for full updates) ---
    let columns = state.columns;
    if (!isTargetedUpdate || columns.length === 0) {
        const lerngruppeNotenkategorien = state.notenkategorien.filter(nk => nk.lerngruppeId === lerngruppe.id);
        const finalColumns: ColumnDef[] = [];
        finalColumns.push({ id: 'gesamt_avg', type: 'gesamt_avg', halbjahr: null, label: 'Gesamt', isAverage: true });
        for (const halbjahr of [1, 2] as const) {
            finalColumns.push({ id: `h${halbjahr}_avg`, type: 'halbjahr_avg', halbjahr, label: `${halbjahr}. Hj Ø`, isAverage: true });
            for (const typ of ['mündlich', 'schriftlich'] as const) {
                const kategorie = lerngruppeNotenkategorien.find(k => k.halbjahr === halbjahr && k.typ === typ);
                if (kategorie) {
                    const ln_fuer_kategorie = state.leistungsnachweise.filter(ln => ln.notenkategorieId === kategorie.id).sort((a,b) => a.datum.localeCompare(b.datum));
                    finalColumns.push({ id: `${kategorie.id}_avg`, type: 'kategorie_avg', halbjahr, kategorieTyp: typ, label: `${kategorie.name} Ø`, gewichtung: kategorie.gewichtung, data: kategorie, isAverage: true });
                    ln_fuer_kategorie.forEach(ln => finalColumns.push({ id: ln.id, type: 'leistungsnachweis', halbjahr, kategorieTyp: typ, label: ln.name, gewichtung: ln.gewichtung, data: ln, isAverage: false }));
                    if (ln_fuer_kategorie.length === 0) finalColumns.push({ id: `${kategorie.id}_placeholder`, type: 'kategorie_placeholder', halbjahr, kategorieTyp: typ, label: '', isAverage: false });
                } else {
                    const katTypName = typ.charAt(0).toUpperCase() + typ.slice(1);
                    const baseId = `placeholder_${halbjahr}_${typ}`;
                    finalColumns.push({ id: `${baseId}_avg`, type: 'kategorie_avg', halbjahr, kategorieTyp: typ, label: `${katTypName} Ø`, gewichtung: 1, isAverage: true });
                    finalColumns.push({ id: `${baseId}_data`, type: 'kategorie_placeholder', halbjahr, kategorieTyp: typ, label: '', isAverage: false });
                }
            }
        }
        columns = finalColumns;
    }
    
    // --- Phase 2: Note Maps Calculation (for specified students) ---
    const manuelleNotenMap = new Map(state.manuelleNoten.filter(mn => mn.lerngruppeId === lerngruppe.id).map(mn => [`${mn.schuelerId}-${mn.ziel}`, mn]));
    const noteToPoints = new Map(notensystem.noten.map(n => [n.displayValue, n.pointValue]));
    const pointsToNote = getPointsToNoteMap(notensystem);

    const newSchuelerLNMap = new Map(state.schuelerLeistungsnachweisNotenMap);
    const newSchuelerKatMap = new Map(state.schuelerKategorieNotenMap);
    const newSchuelerHjMap = new Map(state.schuelerHalbjahresNotenMap);
    const newSchuelerGesamtMap = new Map(state.schuelerGesamtNotenMap);
    
    const notenMapForSammelnoten = new Map<string, EinzelLeistungsNote>();
    state.einzelLeistungsNoten.forEach(note => { notenMapForSammelnoten.set(`${note.schuelerId}-${note.einzelLeistungId}`, note); });
    
    const punkteMapForKlausuren = new Map<string, number | null>();
    state.klausuraufgabePunkte.forEach(p => { punkteMapForKlausuren.set(`${p.schuelerId}-${p.aufgabeId}`, p.punkte); });
    
    // Iterate only over the students that need recalculation
    for (const schueler of schuelerInLerngruppe) {
        // Calculate Leistungsnachweis-level notes
        columns.filter(c => c.type === 'leistungsnachweis').forEach(lnCol => {
            const ln = lnCol.data as Leistungsnachweis;
            if (ln.typ === 'sammelnote') {
                const lnEinzelLeistungen = state.einzelLeistungen.filter(el => el.leistungsnachweisId === ln.id);
                const ergebnis = berechneSammelnoteDurchschnitt([schueler], lnEinzelLeistungen, notenMapForSammelnoten, notensystem, lerngruppe);
                if (ergebnis.has(schueler.id)) newSchuelerLNMap.set(`${schueler.id}-${ln.id}`, ergebnis.get(schueler.id)!); else newSchuelerLNMap.delete(`${schueler.id}-${ln.id}`);
            } else if (ln.typ === 'klausur') {
                const ergebnis = berechneKlausurNote([schueler], ln.aufgaben || [], punkteMapForKlausuren, ln, notensystem, lerngruppe, state.notenschluesselMap);
                if (ergebnis.has(schueler.id)) {
                    const { finalGrade, averagePoints } = ergebnis.get(schueler.id)!;
                    let displayDecimalValue: number;
                    let decimalSuffix = '';
                    if (lerngruppe.notensystemId === 'noten_1_6_mit_tendenz') { displayDecimalValue = (17 - averagePoints) / 3; } else { displayDecimalValue = averagePoints; decimalSuffix = ' P.'; }
                    newSchuelerLNMap.set(`${schueler.id}-${ln.id}`, { finalGrade, displayDecimal: `${displayDecimalValue.toFixed(2).replace('.', ',')}${decimalSuffix}`, averagePoints });
                } else {
                    newSchuelerLNMap.delete(`${schueler.id}-${ln.id}`);
                }
            }
        });
        
        // Calculate Kategorie-level notes
        columns.filter(c => c.type === 'kategorie_avg' && c.data).forEach(katCol => {
            const kategorie = katCol.data as Notenkategorie;
            const zugehoerigeLNs = columns.filter(c => c.type === 'leistungsnachweis' && c.halbjahr === kategorie.halbjahr && c.kategorieTyp === kategorie.typ);
            let totalWeightedPoints = 0;
            let totalWeight = 0;
            zugehoerigeLNs.forEach(lnCol => {
                const ln = lnCol.data as Leistungsnachweis;
                const noteData = newSchuelerLNMap.get(`${schueler.id}-${ln.id}`);
                if (noteData && typeof noteData.averagePoints === 'number') { totalWeightedPoints += noteData.averagePoints * ln.gewichtung; totalWeight += ln.gewichtung; }
            });
            if (totalWeight > 0) {
                const averagePoints = totalWeightedPoints / totalWeight;
                const finalGrade = pointsToNote.get(Math.round(averagePoints)) || '?';
                let displayDecimalValue: number;
                let decimalSuffix = '';
                if (lerngruppe.notensystemId === 'noten_1_6_mit_tendenz') { displayDecimalValue = (17 - averagePoints) / 3; } else { displayDecimalValue = averagePoints; decimalSuffix = ' P.'; }
                newSchuelerKatMap.set(`${schueler.id}-${katCol.id}`, { finalGrade, displayDecimal: `${displayDecimalValue.toFixed(2).replace('.', ',')}${decimalSuffix}`, averagePoints });
            } else { newSchuelerKatMap.delete(`${schueler.id}-${katCol.id}`); }
        });

        // Calculate Halbjahr-level notes
        columns.filter(c => c.type === 'halbjahr_avg').forEach(hjCol => {
            const halbjahr = hjCol.halbjahr as 1 | 2;
            const manuelleNote = manuelleNotenMap.get(`${schueler.id}-${halbjahr === 1 ? 'hj1' : 'hj2'}`);
            if (manuelleNote) {
                const pointValue = noteToPoints.get(manuelleNote.note);
                if (pointValue !== undefined) {
                    let displayDecimalValue: number;
                    let decimalSuffix = '';
                    if (lerngruppe.notensystemId === 'noten_1_6_mit_tendenz') { displayDecimalValue = (17 - pointValue) / 3; } else { displayDecimalValue = pointValue; decimalSuffix = ' P.'; }
                    newSchuelerHjMap.set(`${schueler.id}-${hjCol.id}`, { finalGrade: manuelleNote.note, displayDecimal: `${displayDecimalValue.toFixed(2).replace('.', ',')}${decimalSuffix}`, averagePoints: pointValue, isManual: true });
                }
            } else {
                const muendlichKatCol = columns.find(c => c.type === 'kategorie_avg' && c.halbjahr === halbjahr && c.kategorieTyp === 'mündlich' && c.data);
                const schriftlichKatCol = columns.find(c => c.type === 'kategorie_avg' && c.halbjahr === halbjahr && c.kategorieTyp === 'schriftlich' && c.data);
                const muendlichData = muendlichKatCol ? newSchuelerKatMap.get(`${schueler.id}-${muendlichKatCol.id}`) : undefined;
                const schriftlichData = schriftlichKatCol ? newSchuelerKatMap.get(`${schueler.id}-${schriftlichKatCol.id}`) : undefined;
                const muendlichGewichtung = (muendlichKatCol?.data as Notenkategorie)?.gewichtung ?? 1;
                const schriftlichGewichtung = (schriftlichKatCol?.data as Notenkategorie)?.gewichtung ?? 1;
                let totalWeightedPoints = 0;
                let totalWeight = 0;
                if (muendlichData?.averagePoints !== undefined) { totalWeightedPoints += muendlichData.averagePoints * muendlichGewichtung; totalWeight += muendlichGewichtung; }
                if (schriftlichData?.averagePoints !== undefined) { totalWeightedPoints += schriftlichData.averagePoints * schriftlichGewichtung; totalWeight += schriftlichGewichtung; }
                if (totalWeight > 0) {
                    const averagePoints = totalWeightedPoints / totalWeight;
                    const finalGrade = pointsToNote.get(Math.round(averagePoints)) || '?';
                    let displayDecimalValue: number;
                    let decimalSuffix = '';
                    if (lerngruppe.notensystemId === 'noten_1_6_mit_tendenz') { displayDecimalValue = (17 - averagePoints) / 3; } else { displayDecimalValue = averagePoints; decimalSuffix = ' P.'; }
                    newSchuelerHjMap.set(`${schueler.id}-${hjCol.id}`, { finalGrade, displayDecimal: `${displayDecimalValue.toFixed(2).replace('.', ',')}${decimalSuffix}`, averagePoints });
                } else { newSchuelerHjMap.delete(`${schueler.id}-${hjCol.id}`); }
            }
        });

        // Calculate Gesamt-level note
        const gesamtAvgCol = columns.find(c => c.type === 'gesamt_avg');
        if(gesamtAvgCol) {
            const manuelleNote = manuelleNotenMap.get(`${schueler.id}-gesamt`);
            if (manuelleNote) {
                 const pointValue = noteToPoints.get(manuelleNote.note);
                 if (pointValue !== undefined) {
                    let displayDecimalValue: number;
                    let decimalSuffix = '';
                    if (lerngruppe.notensystemId === 'noten_1_6_mit_tendenz') { displayDecimalValue = (17 - pointValue) / 3; } else { displayDecimalValue = pointValue; decimalSuffix = ' P.'; }
                    newSchuelerGesamtMap.set(`${schueler.id}-${gesamtAvgCol.id}`, { finalGrade: manuelleNote.note, displayDecimal: `${displayDecimalValue.toFixed(2).replace('.', ',')}${decimalSuffix}`, averagePoints: pointValue, isManual: true });
                 }
            } else {
                const hj1AvgCol = columns.find(c => c.type === 'halbjahr_avg' && c.halbjahr === 1);
                const hj2AvgCol = columns.find(c => c.type === 'halbjahr_avg' && c.halbjahr === 2);
                const hj1Data = hj1AvgCol ? newSchuelerHjMap.get(`${schueler.id}-${hj1AvgCol.id}`) : undefined;
                const hj2Data = hj2AvgCol ? newSchuelerHjMap.get(`${schueler.id}-${hj2AvgCol.id}`) : undefined;
                let totalWeightedPoints = 0;
                let totalWeight = 0;
                if (hj1Data?.averagePoints !== undefined) { totalWeightedPoints += hj1Data.averagePoints * (lerngruppe.gewichtungHj1 ?? 1); totalWeight += (lerngruppe.gewichtungHj1 ?? 1); }
                if (hj2Data?.averagePoints !== undefined) { totalWeightedPoints += hj2Data.averagePoints * (lerngruppe.gewichtungHj2 ?? 1); totalWeight += (lerngruppe.gewichtungHj2 ?? 1); }
                if (totalWeight > 0) {
                    const averagePoints = totalWeightedPoints / totalWeight;
                    const finalGrade = pointsToNote.get(Math.round(averagePoints)) || '?';
                    let displayDecimalValue: number;
                    let decimalSuffix = '';
                    if (lerngruppe.notensystemId === 'noten_1_6_mit_tendenz') { displayDecimalValue = (17 - averagePoints) / 3; } else { displayDecimalValue = averagePoints; decimalSuffix = ' P.'; }
                    newSchuelerGesamtMap.set(`${schueler.id}-${gesamtAvgCol.id}`, { finalGrade, displayDecimal: `${displayDecimalValue.toFixed(2).replace('.', ',')}${decimalSuffix}`, averagePoints });
                } else { newSchuelerGesamtMap.delete(`${schueler.id}-${gesamtAvgCol.id}`); }
            }
        }
    }
    
    state = { ...state, columns, schuelerLeistungsnachweisNotenMap: newSchuelerLNMap, schuelerKategorieNotenMap: newSchuelerKatMap, schuelerHalbjahresNotenMap: newSchuelerHjMap, schuelerGesamtNotenMap: newSchuelerGesamtMap };
    notify();
};

const _triggerGlobalRecalculation = (lerngruppe: Lerngruppe, schuelerInLerngruppe: Schueler[]) => {
    recalculateNotenForLerngruppe(lerngruppe, schuelerInLerngruppe, false);
};

const _triggerTargetedRecalculation = (schuelerId: string, lerngruppe: Lerngruppe, schuelerInLerngruppe: Schueler[]) => {
    const schuelerToUpdate = schuelerInLerngruppe.filter(s => s.id === schuelerId);
    if (schuelerToUpdate.length > 0) {
        recalculateNotenForLerngruppe(lerngruppe, schuelerToUpdate, true);
    }
};

// --- Actions (Public Interface) ---

const createDefaultKategorien = async (lerngruppen: Lerngruppe[]) => {
    const lerngruppeIds = new Set(state.notenkategorien.map(nk => nk.lerngruppeId));
    const newKategorien: Notenkategorie[] = [];

    lerngruppen.forEach(lg => {
        if (!lerngruppeIds.has(lg.id)) {
            newKategorien.push({ id: uuidv4(), lerngruppeId: lg.id, name: "Mündlich", typ: 'mündlich', halbjahr: 1, gewichtung: 1, order: 0 });
            newKategorien.push({ id: uuidv4(), lerngruppeId: lg.id, name: "Schriftlich", typ: 'schriftlich', halbjahr: 1, gewichtung: 2, order: 1 });
            newKategorien.push({ id: uuidv4(), lerngruppeId: lg.id, name: "Mündlich", typ: 'mündlich', halbjahr: 2, gewichtung: 1, order: 2 });
            newKategorien.push({ id: uuidv4(), lerngruppeId: lg.id, name: "Schriftlich", typ: 'schriftlich', halbjahr: 2, gewichtung: 1, order: 3 });
        }
    });

    if (newKategorien.length > 0) {
        state = { ...state, notenkategorien: [...state.notenkategorien, ...newKategorien] };
        await persistState();
        notify();
    }
};

const cleanupOrphanedData = async (lerngruppen: Lerngruppe[]) => {
    const lerngruppeIds = new Set(lerngruppen.map(lg => lg.id));
    let hasChanged = false;

    const relevantKategorien = state.notenkategorien.filter(nk => lerngruppeIds.has(nk.lerngruppeId));
    if (relevantKategorien.length !== state.notenkategorien.length) hasChanged = true;

    const relevantKategorieIds = new Set(relevantKategorien.map(nk => nk.id));
    const relevantLeistungsnachweise = state.leistungsnachweise.filter(ln => relevantKategorieIds.has(ln.notenkategorieId));
    if (relevantLeistungsnachweise.length !== state.leistungsnachweise.length) hasChanged = true;

    const relevantLNIds = new Set(relevantLeistungsnachweise.map(ln => ln.id));
    const relevantEinzelLeistungen = state.einzelLeistungen.filter(el => relevantLNIds.has(el.leistungsnachweisId));
    if (relevantEinzelLeistungen.length !== state.einzelLeistungen.length) hasChanged = true;

    const relevantELIds = new Set(relevantEinzelLeistungen.map(el => el.id));
    const relevantNoten = state.einzelLeistungsNoten.filter(n => relevantELIds.has(n.einzelLeistungId));
    if (relevantNoten.length !== state.einzelLeistungsNoten.length) hasChanged = true;
    
    const klausurAufgabenIds = new Set(relevantLeistungsnachweise.flatMap(ln => ln.aufgaben?.map(a => a.id) || []));
    const relevantPunkte = state.klausuraufgabePunkte.filter(p => klausurAufgabenIds.has(p.aufgabeId));
    if (relevantPunkte.length !== state.klausuraufgabePunkte.length) hasChanged = true;
    
    const relevantManuelleNoten = state.manuelleNoten.filter(mn => lerngruppeIds.has(mn.lerngruppeId));
    if (relevantManuelleNoten.length !== state.manuelleNoten.length) hasChanged = true;

    const relevantFeedback = state.schuelerLeistungsnachweisFeedback.filter(f => relevantLNIds.has(f.leistungsnachweisId));
    if (relevantFeedback.length !== state.schuelerLeistungsnachweisFeedback.length) hasChanged = true;

    if (hasChanged) {
        state = {
            ...state,
            notenkategorien: relevantKategorien,
            leistungsnachweise: relevantLeistungsnachweise,
            einzelLeistungen: relevantEinzelLeistungen,
            einzelLeistungsNoten: relevantNoten,
            klausuraufgabePunkte: relevantPunkte,
            manuelleNoten: relevantManuelleNoten,
            schuelerLeistungsnachweisFeedback: relevantFeedback,
        };
        await persistState();
        notify();
    }
};

const updateNotenschluesselMap = async (map: NotenschluesselMap) => {
    state = { ...state, notenschluesselMap: map };
    await persistState();
    notify();
};

const updateNotenkategorie = async (updatedKategorie: Notenkategorie, lerngruppe: Lerngruppe, schuelerInLerngruppe: Schueler[]) => {
    state = { ...state, notenkategorien: state.notenkategorien.map(nk => nk.id === updatedKategorie.id ? updatedKategorie : nk) };
    await persistState();
    _triggerGlobalRecalculation(lerngruppe, schuelerInLerngruppe);
};

const addLeistungsnachweis = async (data: { bezeichnung: string; gewichtung: number; typ: 'sammelnote' | 'klausur'; inhalt?: string; context: { lerngruppeId: string; halbjahr: 1 | 2; typ: NotenKategorieTyp; }; }, lerngruppe: Lerngruppe, schuelerInLerngruppe: Schueler[]) => {
    const { bezeichnung, gewichtung, typ, inhalt, context } = data;
    
    let kategorie = state.notenkategorien.find(
        nk => nk.lerngruppeId === context.lerngruppeId && nk.halbjahr === context.halbjahr && nk.typ === context.typ
    );

    // If kategorie doesn't exist, create it
    if (!kategorie) {
        const neueKategorie: Notenkategorie = {
            id: uuidv4(),
            lerngruppeId: context.lerngruppeId,
            name: context.typ === 'mündlich' ? 'Mündlich' : 'Schriftlich',
            typ: context.typ,
            halbjahr: context.halbjahr,
            gewichtung: 1, // Default weight
            order: state.notenkategorien.filter(nk => nk.lerngruppeId === context.lerngruppeId).length
        };
        state = { ...state, notenkategorien: [...state.notenkategorien, neueKategorie] };
        kategorie = neueKategorie;
    }

    const newLeistungsnachweis: Leistungsnachweis = {
        id: uuidv4(),
        notenkategorieId: kategorie.id,
        name: bezeichnung,
        datum: new Date().toISOString().split('T')[0],
        typ,
        gewichtung,
        order: state.leistungsnachweise.filter(ln => ln.notenkategorieId === kategorie!.id).length,
        inhalt // Save optional content
    };

    state = { ...state, leistungsnachweise: [...state.leistungsnachweise, newLeistungsnachweis] };
    await persistState();
    _triggerGlobalRecalculation(lerngruppe, schuelerInLerngruppe);
};

const updateLeistungsnachweis = async (updatedLeistungsnachweis: Leistungsnachweis, lerngruppe: Lerngruppe, schuelerInLerngruppe: Schueler[]) => {
    state = { ...state, leistungsnachweise: state.leistungsnachweise.map(ln => ln.id === updatedLeistungsnachweis.id ? updatedLeistungsnachweis : ln) };
    await persistState();
    _triggerGlobalRecalculation(lerngruppe, schuelerInLerngruppe);
};

const deleteLeistungsnachweis = async (id: string, lerngruppe: Lerngruppe, schuelerInLerngruppe: Schueler[]) => {
    const leistungsnachweisToDelete = state.leistungsnachweise.find(ln => ln.id === id);
    if (!leistungsnachweisToDelete) return;

    let newEinzelLeistungen = state.einzelLeistungen;
    let newEinzelLeistungsNoten = state.einzelLeistungsNoten;
    let newKlausuraufgabePunkte = state.klausuraufgabePunkte;

    // Delete dependent data
    if (leistungsnachweisToDelete.typ === 'sammelnote') {
        const einzelLeistungenIds = state.einzelLeistungen
            .filter(el => el.leistungsnachweisId === id)
            .map(el => el.id);
        
        newEinzelLeistungsNoten = state.einzelLeistungsNoten.filter(note => !einzelLeistungenIds.includes(note.einzelLeistungId));
        newEinzelLeistungen = state.einzelLeistungen.filter(el => el.leistungsnachweisId !== id);
    } else if (leistungsnachweisToDelete.typ === 'klausur' && leistungsnachweisToDelete.aufgaben) {
        const aufgabenIds = leistungsnachweisToDelete.aufgaben.map(aufg => aufg.id);
        newKlausuraufgabePunkte = state.klausuraufgabePunkte.filter(p => !aufgabenIds.includes(p.aufgabeId));
    }

    const newLeistungsnachweise = state.leistungsnachweise.filter(ln => ln.id !== id);
    const newFeedback = state.schuelerLeistungsnachweisFeedback.filter(f => f.leistungsnachweisId !== id);
    
    state = {
        ...state,
        leistungsnachweise: newLeistungsnachweise,
        einzelLeistungen: newEinzelLeistungen,
        einzelLeistungsNoten: newEinzelLeistungsNoten,
        klausuraufgabePunkte: newKlausuraufgabePunkte,
        schuelerLeistungsnachweisFeedback: newFeedback,
    };

    await persistState();
    _triggerGlobalRecalculation(lerngruppe, schuelerInLerngruppe);
};

const addEinzelLeistung = async (leistungsnachweisId: string, name: string, gewichtung: number, lerngruppe: Lerngruppe, schuelerInLerngruppe: Schueler[]): Promise<EinzelLeistung> => {
    const order = state.einzelLeistungen.filter(el => el.leistungsnachweisId === leistungsnachweisId).length;
    const newEinzelLeistung: EinzelLeistung = { id: uuidv4(), leistungsnachweisId, name, gewichtung, order };
    state = { ...state, einzelLeistungen: [...state.einzelLeistungen, newEinzelLeistung] };
    await persistState();
    _triggerGlobalRecalculation(lerngruppe, schuelerInLerngruppe);
    return newEinzelLeistung;
};

const updateEinzelLeistung = async (updated: EinzelLeistung, lerngruppe: Lerngruppe, schuelerInLerngruppe: Schueler[]) => {
    state = { ...state, einzelLeistungen: state.einzelLeistungen.map(el => el.id === updated.id ? updated : el) };
    await persistState();
    _triggerGlobalRecalculation(lerngruppe, schuelerInLerngruppe);
};

const deleteEinzelLeistung = async (id: string, lerngruppe: Lerngruppe, schuelerInLerngruppe: Schueler[]) => {
    state = {
        ...state,
        einzelLeistungsNoten: state.einzelLeistungsNoten.filter(n => n.einzelLeistungId !== id),
        einzelLeistungen: state.einzelLeistungen.filter(el => el.id !== id)
    };
    await persistState();
    _triggerGlobalRecalculation(lerngruppe, schuelerInLerngruppe);
};

const saveEinzelLeistungsNote = async (schuelerId: string, einzelLeistungId: string, note: string, bemerkung: string | undefined, lerngruppe: Lerngruppe, schuelerInLerngruppe: Schueler[]) => {
    const index = state.einzelLeistungsNoten.findIndex(n => n.schuelerId === schuelerId && n.einzelLeistungId === einzelLeistungId);
    let newNoten = [...state.einzelLeistungsNoten];
    if (note || (bemerkung && bemerkung.trim())) {
        if (index > -1) { newNoten[index] = { ...newNoten[index], note, bemerkung }; } 
        else { newNoten.push({ id: uuidv4(), schuelerId, einzelLeistungId, note, bemerkung }); }
    } else {
        if (index > -1) { newNoten = newNoten.filter((_, i) => i !== index); }
    }
    state = { ...state, einzelLeistungsNoten: newNoten };
    await persistState();
    _triggerTargetedRecalculation(schuelerId, lerngruppe, schuelerInLerngruppe);
};

// --- NEW ACTION: Bulk Save ---
const saveBulkEinzelLeistungsNoten = async (entries: { schuelerId: string; note: string }[], einzelLeistungId: string, lerngruppe: Lerngruppe, schuelerInLerngruppe: Schueler[]) => {
    let newNoten = [...state.einzelLeistungsNoten];
    
    entries.forEach(({ schuelerId, note }) => {
        const index = newNoten.findIndex(n => n.schuelerId === schuelerId && n.einzelLeistungId === einzelLeistungId);
        if (note) {
            if (index > -1) {
                newNoten[index] = { ...newNoten[index], note }; // Keep existing bemerkung
            } else {
                newNoten.push({ id: uuidv4(), schuelerId, einzelLeistungId, note });
            }
        } else {
            // Usually bulk updates are for setting grades, but if note is empty we remove it
            if (index > -1) {
                newNoten = newNoten.filter((_, i) => i !== index);
            }
        }
    });

    state = { ...state, einzelLeistungsNoten: newNoten };
    await persistState();
    // For bulk updates, it's safer to trigger a global recalculation for the group to ensure all stats are updated
    _triggerGlobalRecalculation(lerngruppe, schuelerInLerngruppe);
};


const addKlausuraufgabe = async (leistungsnachweisId: string, name: string, maxPunkte: number, lerngruppe: Lerngruppe, schuelerInLerngruppe: Schueler[], inhalt?: string) => {
    const updatedLeistungsnachweise = state.leistungsnachweise.map(ln => {
        if (ln.id === leistungsnachweisId) {
            const newAufgabe: Klausuraufgabe = {
                id: uuidv4(),
                name,
                maxPunkte,
                order: ln.aufgaben?.length || 0,
                inhalt // Add optional content
            };
            return {
                ...ln,
                aufgaben: [...(ln.aufgaben || []), newAufgabe]
            };
        }
        return ln;
    });

    state = { ...state, leistungsnachweise: updatedLeistungsnachweise };
    await persistState();
    _triggerGlobalRecalculation(lerngruppe, schuelerInLerngruppe);
};

const updateKlausuraufgabe = async (lnId: string, aufgabe: Klausuraufgabe, lerngruppe: Lerngruppe, schuelerInLerngruppe: Schueler[]) => {
    const updatedLeistungsnachweise = state.leistungsnachweise.map(ln => {
        if (ln.id === lnId) {
            return {
                ...ln,
                aufgaben: (ln.aufgaben || []).map(a => a.id === aufgabe.id ? aufgabe : a)
            };
        }
        return ln;
    });

    state = { ...state, leistungsnachweise: updatedLeistungsnachweise };
    await persistState();
    _triggerGlobalRecalculation(lerngruppe, schuelerInLerngruppe);
};

const deleteKlausuraufgabe = async (lnId: string, aufgabeId: string, lerngruppe: Lerngruppe, schuelerInLerngruppe: Schueler[]) => {
    const updatedLeistungsnachweise = state.leistungsnachweise.map(ln => {
        if (ln.id === lnId) {
            return {
                ...ln,
                aufgaben: (ln.aufgaben || []).filter(a => a.id !== aufgabeId)
            };
        }
        return ln;
    });

    const updatedPunkte = state.klausuraufgabePunkte.filter(p => p.aufgabeId !== aufgabeId);

    state = {
        ...state,
        leistungsnachweise: updatedLeistungsnachweise,
        klausuraufgabePunkte: updatedPunkte
    };
    await persistState();
    _triggerGlobalRecalculation(lerngruppe, schuelerInLerngruppe);
};

const saveKlausuraufgabePunkte = async (schuelerId: string, aufgabeId: string, punkte: number | null, lerngruppe: Lerngruppe, schuelerInLerngruppe: Schueler[]) => {
    const index = state.klausuraufgabePunkte.findIndex(p => p.schuelerId === schuelerId && p.aufgabeId === aufgabeId);
    let newPunkte = [...state.klausuraufgabePunkte];
    if (punkte !== null) {
        if (index > -1) { newPunkte[index].punkte = punkte; } 
        else { newPunkte.push({ id: uuidv4(), schuelerId, aufgabeId, punkte }); }
    } else { newPunkte = newPunkte.filter((_, i) => i !== index); }
    state = { ...state, klausuraufgabePunkte: newPunkte };
    await persistState();
    _triggerTargetedRecalculation(schuelerId, lerngruppe, schuelerInLerngruppe);
};

const setManuelleNote = async (schuelerId: string, lerngruppeId: string, ziel: ManuelleNoteZiel, note: string, lerngruppe: Lerngruppe, schuelerInLerngruppe: Schueler[]) => {
    const manuelleNoten = [...state.manuelleNoten];
    const existingIndex = manuelleNoten.findIndex(mn => mn.schuelerId === schuelerId && mn.lerngruppeId === lerngruppeId && mn.ziel === ziel);
    if (existingIndex > -1) {
        manuelleNoten[existingIndex] = { ...manuelleNoten[existingIndex], note };
    } else {
        manuelleNoten.push({ id: uuidv4(), schuelerId, lerngruppeId, ziel, note });
    }
    state = { ...state, manuelleNoten };
    await persistState();
    _triggerTargetedRecalculation(schuelerId, lerngruppe, schuelerInLerngruppe);
};

const deleteManuelleNote = async (schuelerId: string, lerngruppeId: string, ziel: ManuelleNoteZiel, lerngruppe: Lerngruppe, schuelerInLerngruppe: Schueler[]) => {
    const manuelleNoten = state.manuelleNoten.filter(mn => !(mn.schuelerId === schuelerId && mn.lerngruppeId === lerngruppeId && mn.ziel === ziel));
    state = { ...state, manuelleNoten };
    await persistState();
    _triggerTargetedRecalculation(schuelerId, lerngruppe, schuelerInLerngruppe);
};

const updateSchuelerLeistungsnachweisFeedback = async (schuelerId: string, leistungsnachweisId: string, feedbackText: string) => {
    const recordId = `${schuelerId}-${leistungsnachweisId}`;
    const existingIndex = state.schuelerLeistungsnachweisFeedback.findIndex(f => f.id === recordId);
    let updatedFeedbackList = [...state.schuelerLeistungsnachweisFeedback];

    if (feedbackText.trim()) {
        // Update or add new feedback
        if (existingIndex > -1) {
            updatedFeedbackList[existingIndex] = { ...updatedFeedbackList[existingIndex], feedbackText };
        } else {
            updatedFeedbackList.push({ id: recordId, schuelerId, leistungsnachweisId, feedbackText });
        }
    } else {
        // Remove feedback if text is empty
        if (existingIndex > -1) {
            updatedFeedbackList.splice(existingIndex, 1);
        }
    }

    state = { ...state, schuelerLeistungsnachweisFeedback: updatedFeedbackList };
    await persistState();
    notify();
};

const uebertrageNotenstruktur = async (sourceLerngruppeId: string, targetLerngruppeIds: string[], scope: 'gesamt' | 'hj1' | 'hj2') => {
    if (targetLerngruppeIds.length === 0) return;

    // --- 1. CLEANUP ---
    const kategorienToDeleteIds = new Set(
        state.notenkategorien
            .filter(nk =>
                targetLerngruppeIds.includes(nk.lerngruppeId) &&
                (scope === 'gesamt' || nk.halbjahr === (scope === 'hj1' ? 1 : 2))
            )
            .map(nk => nk.id)
    );

    const lnsToDelete = state.leistungsnachweise.filter(ln => kategorienToDeleteIds.has(ln.notenkategorieId));
    const lnsToDeleteIds = new Set(lnsToDelete.map(ln => ln.id));

    const einzelLeistungenToDeleteIds = new Set(
        state.einzelLeistungen.filter(el => lnsToDeleteIds.has(el.leistungsnachweisId)).map(el => el.id)
    );
    const klausuraufgabenToDeleteIds = new Set(
        lnsToDelete.flatMap(ln => ln.aufgaben?.map(a => a.id) || [])
    );

    let notenkategorien = state.notenkategorien.filter(nk => !kategorienToDeleteIds.has(nk.id));
    let leistungsnachweise = state.leistungsnachweise.filter(ln => !lnsToDeleteIds.has(ln.id));
    let einzelLeistungen = state.einzelLeistungen.filter(el => !einzelLeistungenToDeleteIds.has(el.id));
    let einzelLeistungsNoten = state.einzelLeistungsNoten.filter(note => !einzelLeistungenToDeleteIds.has(note.einzelLeistungId));
    let klausuraufgabePunkte = state.klausuraufgabePunkte.filter(p => !klausuraufgabenToDeleteIds.has(p.aufgabeId));
    
    // --- 2. GATHER ---
    const sourceKategorien = state.notenkategorien.filter(nk =>
        nk.lerngruppeId === sourceLerngruppeId &&
        (scope === 'gesamt' || nk.halbjahr === (scope === 'hj1' ? 1 : 2))
    );

    const sourceStruktur = sourceKategorien.map(sk => {
        const sourceLeistungsnachweise = state.leistungsnachweise.filter(ln => ln.notenkategorieId === sk.id);
        const leistungsnachweiseMitDetails = sourceLeistungsnachweise.map(sln => {
            if (sln.typ === 'sammelnote') {
                const sourceEinzelLeistungen = state.einzelLeistungen.filter(el => el.leistungsnachweisId === sln.id);
                return { ...sln, tempEinzelLeistungen: sourceEinzelLeistungen };
            }
            return sln;
        });
        return { ...sk, tempLeistungsnachweise: leistungsnachweiseMitDetails };
    });

    // --- 3. COPY & CREATE ---
    const neuErstellteKategorien: Notenkategorie[] = [];
    const neuErstellteLeistungsnachweise: Leistungsnachweis[] = [];
    const neuErstellteEinzelLeistungen: EinzelLeistung[] = [];

    targetLerngruppeIds.forEach(targetId => {
        sourceStruktur.forEach(sourceKat => {
            const neueKategorieId = uuidv4();
            const { tempLeistungsnachweise, ...restOfKat } = sourceKat;
            neuErstellteKategorien.push({ ...restOfKat, id: neueKategorieId, lerngruppeId: targetId });

            tempLeistungsnachweise.forEach(sourceLN => {
                const neueLeistungsnachweisId = uuidv4();
                
                const { tempEinzelLeistungen, ...restOfLN } = sourceLN as any;

                let neueAufgaben: Klausuraufgabe[] | undefined = undefined;
                if (restOfLN.typ === 'klausur' && restOfLN.aufgaben) {
                    neueAufgaben = restOfLN.aufgaben.map((aufg: Klausuraufgabe) => ({ ...aufg, id: uuidv4() }));
                }

                const neueLN: Leistungsnachweis = {
                    ...restOfLN,
                    id: neueLeistungsnachweisId,
                    notenkategorieId: neueKategorieId,
                    aufgaben: neueAufgaben,
                };
                neuErstellteLeistungsnachweise.push(neueLN);

                if (restOfLN.typ === 'sammelnote' && tempEinzelLeistungen) {
                    tempEinzelLeistungen.forEach((sourceEL: EinzelLeistung) => {
                        neuErstellteEinzelLeistungen.push({
                            ...sourceEL,
                            id: uuidv4(),
                            leistungsnachweisId: neueLeistungsnachweisId,
                        });
                    });
                }
            });
        });
    });

    // --- 4. UPDATE STATE ---
    state = {
        ...state,
        notenkategorien: [...notenkategorien, ...neuErstellteKategorien],
        leistungsnachweise: [...leistungsnachweise, ...neuErstellteLeistungsnachweise],
        einzelLeistungen: [...einzelLeistungen, ...neuErstellteEinzelLeistungen],
        einzelLeistungsNoten,
        klausuraufgabePunkte,
    };
    await persistState();
    notify(); 
};

// --- Initialization Logic ---

export async function initNotenStore() {
    state = {
        ...state,
        notenkategorien: await db.get<Notenkategorie[]>(NOTENKATEGORIEN_KEY) || [],
        leistungsnachweise: await db.get<Leistungsnachweis[]>(LEISTUNGSNACHWEISE_KEY) || [],
        einzelLeistungen: await db.get<EinzelLeistung[]>(EINZELLEISTUNGEN_KEY) || [],
        einzelLeistungsNoten: await db.get<EinzelLeistungsNote[]>(EINZELLEISTUNGSNOTEN_KEY) || [],
        klausuraufgabePunkte: await db.get<KlausuraufgabePunkte[]>(KLAUSURAUFGABENPUNKTE_KEY) || [],
        notenschluesselMap: await db.get<NotenschluesselMap>(NOTENSCHLUESSEL_MAP_KEY) || DEFAULT_NOTENSCHLUESSEL_MAP,
        manuelleNoten: await db.get<ManuelleNote[]>(MANUELLE_NOTEN_KEY) || [],
        schuelerLeistungsnachweisFeedback: await db.get<SchuelerLeistungsnachweisFeedback[]>(SCHUELER_LN_FEEDBACK_KEY) || [],
    };
    notify();
}

// --- Public Store Interface ---

export const notenStore = {
  subscribe: (listener: () => void): (() => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getState: (): NotenState => state,
  actions: {
    recalculateNotenForLerngruppe, // Expose for initial load
    createDefaultKategorien,
    cleanupOrphanedData,
    updateNotenschluesselMap,
    updateNotenkategorie,
    addLeistungsnachweis,
    updateLeistungsnachweis,
    deleteLeistungsnachweis,
    addEinzelLeistung,
    updateEinzelLeistung,
    deleteEinzelLeistung,
    saveEinzelLeistungsNote,
    saveBulkEinzelLeistungsNoten, // NEW action
    addKlausuraufgabe,
    updateKlausuraufgabe,
    deleteKlausuraufgabe,
    saveKlausuraufgabePunkte,
    setManuelleNote,
    deleteManuelleNote,
    updateSchuelerLeistungsnachweisFeedback,
    uebertrageNotenstruktur,
  },
};