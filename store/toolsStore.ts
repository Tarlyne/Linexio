import { v4 as uuidv4 } from 'uuid';
import {
    Checkliste, ChecklistenEintrag, ChecklistenStatusValue, Sitzplan, SchuelerPlatzierung, Lerngruppe, Schueler, NotizKategorie, Notiz, GruppenEinteilung, Gruppe
} from '../context/types';
import { db } from './db';
import { PICKED_SCHUELER_KEY, CHECKLISTEN_KEY, CHECKLISTEN_EINTRAEGE_KEY, CHECKLISTEN_STATI_KEY, SITZPLAENE_KEY, NOTIZEN_KEY, NOTIZ_KATEGORIEN_KEY, GRUPPEN_EINTEILUNGEN_KEY } from './keys';

// --- State & Listener Setup ---

interface ToolsState {
    pickedSchuelerIds: { [key: string]: string[] };
    checklisten: Checkliste[];
    checklistenEintraege: ChecklistenEintrag[];
    checklistenStati: { [eintragId: string]: { [schuelerId: string]: ChecklistenStatusValue } };
    sitzplaene: Sitzplan[];
    gruppenEinteilungen: GruppenEinteilung[];
    notizKategorien: NotizKategorie[];
    notizen: Notiz[];
}

let state: ToolsState = {
    pickedSchuelerIds: {},
    checklisten: [],
    checklistenEintraege: [],
    checklistenStati: {},
    sitzplaene: [],
    gruppenEinteilungen: [],
    notizKategorien: [],
    notizen: [],
};

const listeners = new Set<() => void>();

const notify = () => {
    listeners.forEach(listener => listener());
};

const persistState = async () => {
    await db.set(PICKED_SCHUELER_KEY, state.pickedSchuelerIds);
    await db.set(CHECKLISTEN_KEY, state.checklisten);
    await db.set(CHECKLISTEN_EINTRAEGE_KEY, state.checklistenEintraege);
    await db.set(CHECKLISTEN_STATI_KEY, state.checklistenStati);
    await db.set(SITZPLAENE_KEY, state.sitzplaene);
    await db.set(GRUPPEN_EINTEILUNGEN_KEY, state.gruppenEinteilungen);
    await db.set(NOTIZ_KATEGORIEN_KEY, state.notizKategorien);
    await db.set(NOTIZEN_KEY, state.notizen);
};

// --- Actions (interne Logik) ---

const markSchuelerAsPicked = async (lerngruppeId: string, schuelerId: string) => {
    const newList = [...(state.pickedSchuelerIds[lerngruppeId] || []), schuelerId];
    state = { ...state, pickedSchuelerIds: { ...state.pickedSchuelerIds, [lerngruppeId]: newList } };
    await persistState();
    notify();
};

const resetPickedList = async (lerngruppeId: string) => {
    const newPicked = { ...state.pickedSchuelerIds };
    delete newPicked[lerngruppeId];
    state = { ...state, pickedSchuelerIds: newPicked };
    await persistState();
    notify();
};

const addCheckliste = async (name: string, lerngruppeId: string): Promise<Checkliste> => {
    const newCheckliste: Checkliste = { id: uuidv4(), lerngruppeId, name, order: state.checklisten.length };
    state = { ...state, checklisten: [...state.checklisten, newCheckliste] };
    await persistState();
    notify();
    return newCheckliste;
};

const updateCheckliste = async (id: string, newName: string) => {
    state = { ...state, checklisten: state.checklisten.map((c: Checkliste) => c.id === id ? { ...c, name: newName } : c) };
    await persistState();
    notify();
};

const deleteCheckliste = async (id: string) => {
    const eintraegeToDeleteIds = state.checklistenEintraege.filter((e: ChecklistenEintrag) => e.checklisteId === id).map((e: ChecklistenEintrag) => e.id);
    const newStati = { ...state.checklistenStati };
    eintraegeToDeleteIds.forEach((id: string) => delete newStati[id]);

    state = {
        ...state,
        checklistenStati: newStati,
        checklistenEintraege: state.checklistenEintraege.filter((e: ChecklistenEintrag) => e.checklisteId !== id),
        checklisten: state.checklisten.filter((c: Checkliste) => c.id !== id),
    };
    await persistState();
    notify();
};

const addChecklistenEintrag = async (name: string, checklisteId: string, defaultStatus: ChecklistenStatusValue, schuelerInGruppe: Schueler[], faelligkeitsdatum?: string) => {
    const newEintrag: ChecklistenEintrag = { 
        id: uuidv4(), 
        checklisteId, 
        name, 
        order: state.checklistenEintraege.filter((e: ChecklistenEintrag) => e.checklisteId === checklisteId).length,
        faelligkeitsdatum: faelligkeitsdatum || undefined,
    };
    let newStati = state.checklistenStati;
    if (defaultStatus !== 'offen') {
        const statiForEintrag: { [key: string]: ChecklistenStatusValue } = {};
        schuelerInGruppe.forEach((s: Schueler) => { statiForEintrag[s.id] = defaultStatus; });
        newStati = { ...state.checklistenStati, [newEintrag.id]: statiForEintrag };
    }
    state = { ...state, checklistenEintraege: [...state.checklistenEintraege, newEintrag], checklistenStati: newStati };
    await persistState();
    notify();
};

const updateChecklistenEintrag = async (id: string, newName: string, newFaelligkeitsdatum?: string) => {
    state = { ...state, checklistenEintraege: state.checklistenEintraege.map((e: ChecklistenEintrag) => e.id === id ? { ...e, name: newName, faelligkeitsdatum: newFaelligkeitsdatum || undefined } : e) };
    await persistState();
    notify();
};

const deleteChecklistenEintrag = async (id: string) => {
    const newStati = { ...state.checklistenStati };
    delete newStati[id];
    state = {
        ...state,
        checklistenStati: newStati,
        checklistenEintraege: state.checklistenEintraege.filter((e: ChecklistenEintrag) => e.id !== id)
    };
    await persistState();
    notify();
};

const toggleChecklistenStatus = async (eintragId: string, schuelerId: string) => {
    const current = state.checklistenStati[eintragId]?.[schuelerId] || 'offen';
    const order: ChecklistenStatusValue[] = ['offen', 'erledigt', 'nicht-erledigt'];
    const next = order[(order.indexOf(current) + 1) % order.length];
    
    const newStati = JSON.parse(JSON.stringify(state.checklistenStati)); // Deep copy
    if (!newStati[eintragId]) newStati[eintragId] = {};
    newStati[eintragId][schuelerId] = next;
    
    state = { ...state, checklistenStati: newStati };
    await persistState();
    notify();
};

const updateSitzplan = async (sitzplan: Sitzplan) => {
    state = { ...state, sitzplaene: state.sitzplaene.map((sp: Sitzplan) => sp.id === sitzplan.id ? sitzplan : sp) };
    await persistState();
    notify();
};

const createDefaultSitzplaene = async (lerngruppen: Lerngruppe[]) => {
    const sitzplaeneIds = new Set(state.sitzplaene.map((sp: Sitzplan) => sp.lerngruppeId));
    const newSitzplaene: Sitzplan[] = [];
    lerngruppen.forEach((lg: Lerngruppe) => {
        if (!sitzplaeneIds.has(lg.id)) {
            newSitzplaene.push({ id: lg.id, lerngruppeId: lg.id, rows: 7, cols: 8, layout: Array(7).fill(null).map(() => Array(8).fill('aisle')), schuelerPlacements: {} });
        }
    });
    if (newSitzplaene.length > 0) {
        state = { ...state, sitzplaene: [...state.sitzplaene, ...newSitzplaene] };
        await persistState();
        notify();
    }
};

const cleanupOrphanedData = async (lerngruppen: Lerngruppe[]) => {
    const lerngruppenIds = new Set(lerngruppen.map(lg => lg.id));
    let hasChanged = false;

    const relevantSitzplaene = state.sitzplaene.filter(sp => lerngruppenIds.has(sp.lerngruppeId));
    if (relevantSitzplaene.length !== state.sitzplaene.length) hasChanged = true;
    
    const relevantGruppenEinteilungen = state.gruppenEinteilungen.filter(ge => lerngruppenIds.has(ge.lerngruppeId));
    if (relevantGruppenEinteilungen.length !== state.gruppenEinteilungen.length) hasChanged = true;

    const relevantChecklisten = state.checklisten.filter(c => lerngruppenIds.has(c.lerngruppeId));
    if (relevantChecklisten.length !== state.checklisten.length) hasChanged = true;

    const relevantChecklistenIds = new Set(relevantChecklisten.map(c => c.id));
    const relevantEintraege = state.checklistenEintraege.filter(ce => relevantChecklistenIds.has(ce.checklisteId));
    if (relevantEintraege.length !== state.checklistenEintraege.length) hasChanged = true;

    const relevantEintraegeIds = new Set(relevantEintraege.map(e => e.id));
    const relevantStati = Object.fromEntries(Object.entries(state.checklistenStati).filter(([eintragId]) => relevantEintraegeIds.has(eintragId)));
    if (Object.keys(relevantStati).length !== Object.keys(state.checklistenStati).length) hasChanged = true;
    
    const relevantPicked = Object.fromEntries(Object.entries(state.pickedSchuelerIds).filter(([lerngruppeId]) => lerngruppenIds.has(lerngruppeId)));
    if (Object.keys(relevantPicked).length !== Object.keys(state.pickedSchuelerIds).length) hasChanged = true;

    if (hasChanged) {
        state = {
            ...state,
            sitzplaene: relevantSitzplaene,
            gruppenEinteilungen: relevantGruppenEinteilungen,
            checklisten: relevantChecklisten,
            checklistenEintraege: relevantEintraege,
            checklistenStati: relevantStati,
            pickedSchuelerIds: relevantPicked,
        };
        await persistState();
        notify();
    }
};

// --- Gruppen Actions ---

const updateGruppenEinteilung = async (lerngruppeId: string, gruppen: Gruppe[]) => {
    const existingIndex = state.gruppenEinteilungen.findIndex(ge => ge.lerngruppeId === lerngruppeId);
    let newEinteilungen = [...state.gruppenEinteilungen];
    
    if (existingIndex > -1) {
        newEinteilungen[existingIndex] = { ...newEinteilungen[existingIndex], gruppen };
    } else {
        newEinteilungen.push({ id: uuidv4(), lerngruppeId, gruppen });
    }
    
    state = { ...state, gruppenEinteilungen: newEinteilungen };
    await persistState();
    notify();
};

const resetGruppenEinteilung = async (lerngruppeId: string) => {
    state = {
        ...state,
        gruppenEinteilungen: state.gruppenEinteilungen.filter(ge => ge.lerngruppeId !== lerngruppeId)
    };
    await persistState();
    notify();
};


// --- Notizen Actions ---
const addNotizKategorie = async (name: string, icon: string): Promise<NotizKategorie> => {
    const newKategorie: NotizKategorie = { id: uuidv4(), name, icon, order: state.notizKategorien.length };
    state = { ...state, notizKategorien: [...state.notizKategorien, newKategorie] };
    await persistState();
    notify();
    return newKategorie;
};

const updateNotizKategorie = async (id: string, name: string, icon: string) => {
    state = { ...state, notizKategorien: state.notizKategorien.map((k: NotizKategorie) => k.id === id ? { ...k, name, icon } : k) };
    await persistState();
    notify();
};

const deleteNotizKategorie = async (kategorieId: string) => {
    state = {
        ...state,
        notizen: state.notizen.filter((n: Notiz) => n.kategorieId !== kategorieId),
        notizKategorien: state.notizKategorien.filter((k: NotizKategorie) => k.id !== kategorieId),
    };
    await persistState();
    notify();
};

const addNotiz = async (kategorieId: string, title: string, content: string) => {
    const now = new Date().toISOString();
    const newNotiz: Notiz = { id: uuidv4(), kategorieId, title, content, createdAt: now, updatedAt: now };
    state = { ...state, notizen: [newNotiz, ...state.notizen] };
    await persistState();
    notify();
};

const updateNotiz = async (id: string, title: string, content: string) => {
    const now = new Date().toISOString();
    state = { ...state, notizen: state.notizen.map((n: Notiz) => n.id === id ? { ...n, title, content, updatedAt: now } : n) };
    await persistState();
    notify();
};

const deleteNotiz = async (id: string) => {
    state = { ...state, notizen: state.notizen.filter((n: Notiz) => n.id !== id) };
    await persistState();
    notify();
};


// --- Initialization Logic ---

export async function initToolsStore() {
    const loadedSitzplaene = await db.get<Sitzplan[]>(SITZPLAENE_KEY) || [];
    // Migration/cleanup for potentially broken sitzplan data
    const cleanedSitzplaene = loadedSitzplaene.map((sp: Sitzplan) => {
        if (!sp.schuelerPlacements) {
            return { ...sp, schuelerPlacements: {} };
        }
        const cleanedPlacements = Object.entries(sp.schuelerPlacements)
            .filter(([, placement]) => !!placement)
            .reduce((acc, [schuelerId, placement]) => {
                acc[schuelerId] = placement as SchuelerPlatzierung;
                return acc;
            }, {} as { [schuelerId: string]: SchuelerPlatzierung });

        return { ...sp, schuelerPlacements: cleanedPlacements };
    });

    state = {
        pickedSchuelerIds: await db.get<{[key: string]: string[]}>(PICKED_SCHUELER_KEY) || {},
        checklisten: await db.get<Checkliste[]>(CHECKLISTEN_KEY) || [],
        checklistenEintraege: await db.get<ChecklistenEintrag[]>(CHECKLISTEN_EINTRAEGE_KEY) || [],
        checklistenStati: await db.get<{[eintragId: string]: { [schuelerId: string]: ChecklistenStatusValue }}>(CHECKLISTEN_STATI_KEY) || {},
        sitzplaene: cleanedSitzplaene,
        gruppenEinteilungen: await db.get<GruppenEinteilung[]>(GRUPPEN_EINTEILUNGEN_KEY) || [],
        notizKategorien: await db.get<NotizKategorie[]>(NOTIZ_KATEGORIEN_KEY) || [],
        notizen: await db.get<Notiz[]>(NOTIZEN_KEY) || [],
    };
    notify();
}


// --- Public Store Interface ---

export const toolsStore = {
    subscribe: (listener: () => void): (() => void) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
    },
    getState: (): ToolsState => state,
    actions: {
        markSchuelerAsPicked,
        resetPickedList,
        addCheckliste,
        updateCheckliste,
        deleteCheckliste,
        addChecklistenEintrag,
        updateChecklistenEintrag,
        deleteChecklistenEintrag,
        toggleChecklistenStatus,
        updateSitzplan,
        createDefaultSitzplaene,
        cleanupOrphanedData,
        // Gruppen
        updateGruppenEinteilung,
        resetGruppenEinteilung,
        // Notizen
        addNotizKategorie,
        updateNotizKategorie,
        deleteNotizKategorie,
        addNotiz,
        updateNotiz,
        deleteNotiz,
    },
};