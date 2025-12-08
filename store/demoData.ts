import { v4 as uuidv4 } from 'uuid';
import {
    Schueler, Lerngruppe, Gender, Notenkategorie, Leistungsnachweis,
    EinzelLeistung, EinzelLeistungsNote, Klausuraufgabe, KlausuraufgabePunkte,
    PREDEFINED_NOTENSYSTEME, Checkliste, ChecklistenEintrag, ChecklistenStatusValue
} from '../context/types';
import { getSystemSchoolYear } from '../context/utils';

export const seedDemoData = () => {
    const DEMO_LERNGUPPE_ID = uuidv4();
    const DEMO_SCHULJAHR = getSystemSchoolYear();

    const schuelerNamen = [
        "Anton Ameise", "Berta Biber", "Carla Chamäleon", "David Dachs", "Emil Elefant", "Frida Frosch",
        "Gustav Gorilla", "Hanna Hase", "Ida Igel", "Jakob Jaguar", "Klara Katze", "Leo Languste",
        "Marta Maus", "Nils Nashorn", "Olga Otter", "Paul Pinguin", "Quentin Qualle", "Rosa Robbe",
        "Simon Storch", "Tina Tiger", "Uwe Uhu", "Vera Viper", "Walter Wal", "Xenia Xenops",
        "Yasmin Yak", "Zacharias Zebra", "Anna Aal", "Ben Bär", "Clara Clownfisch", "Daniel Delfin"
    ];

    const femaleFirstNames = new Set([
        'Berta', 'Carla', 'Frida', 'Hanna', 'Ida', 'Klara', 'Marta', 'Olga', 'Rosa', 'Tina', 'Vera', 'Xenia', 'Yasmin', 'Anna', 'Clara'
    ]);

    const schueler: Schueler[] = schuelerNamen.map((name, index) => {
        const [firstName, lastName] = name.split(' ');
        const gender: Gender = femaleFirstNames.has(firstName) ? 'w' : 'm';
        const birthYear = new Date().getFullYear() - 11; // Assuming 5th grade
        const birthMonth = (index % 12); // 0-11
        const birthDay = (index % 28) + 1;
        const birthday = new Date(birthYear, birthMonth, birthDay).toISOString().split('T')[0];
        
        return { 
            id: uuidv4(), 
            firstName, 
            lastName, 
            gender, 
            birthday,
            paedagogischeMerkmale: index % 5 === 0 ? ['sehr ruhig'] : (index % 3 === 0 ? ['hilfsbereit', 'meldet sich oft'] : [])
        };
    });

    const lerngruppen: Lerngruppe[] = [{
        id: DEMO_LERNGUPPE_ID,
        name: 'Beispielklasse 5c',
        fach: 'Tierkunde',
        schuljahr: DEMO_SCHULJAHR,
        notensystemId: 'noten_1_6_mit_tendenz',
        order: 0,
        gewichtungHj1: 1,
        gewichtungHj2: 2,
        schuelerIds: schueler.map(s => s.id),
    }];

    // --- Noten-Setup ---
    const notenkategorien: Notenkategorie[] = [];
    const leistungsnachweise: Leistungsnachweis[] = [];
    const einzelLeistungen: EinzelLeistung[] = [];
    const einzelLeistungsNoten: EinzelLeistungsNote[] = [];
    const klausuraufgabePunkte: KlausuraufgabePunkte[] = [];

    // Halbjahr 1 Kategorien
    const hj1m_kat_id = uuidv4();
    const hj1s_kat_id = uuidv4();
    notenkategorien.push({ id: hj1m_kat_id, lerngruppeId: DEMO_LERNGUPPE_ID, name: "Mündlich", typ: 'mündlich', halbjahr: 1, gewichtung: 1, order: 0 });
    notenkategorien.push({ id: hj1s_kat_id, lerngruppeId: DEMO_LERNGUPPE_ID, name: "Schriftlich", typ: 'schriftlich', halbjahr: 1, gewichtung: 2, order: 1 });

    // Halbjahr 2 Kategorien
    const hj2m_kat_id = uuidv4();
    const hj2s_kat_id = uuidv4();
    notenkategorien.push({ id: hj2m_kat_id, lerngruppeId: DEMO_LERNGUPPE_ID, name: "Mündlich", typ: 'mündlich', halbjahr: 2, gewichtung: 1, order: 2 });
    notenkategorien.push({ id: hj2s_kat_id, lerngruppeId: DEMO_LERNGUPPE_ID, name: "Schriftlich", typ: 'schriftlich', halbjahr: 2, gewichtung: 2, order: 3 });

    // Leistungsnachweise für HJ1
    const epo1_id = uuidv4();
    leistungsnachweise.push({ id: epo1_id, notenkategorieId: hj1m_kat_id, name: 'Mitarbeit HJ1', datum: new Date().toISOString().split('T')[0], typ: 'sammelnote', gewichtung: 1, order: 0 });
    const epo1_el_id = uuidv4();
    einzelLeistungen.push({ id: epo1_el_id, leistungsnachweisId: epo1_id, name: 'Note', gewichtung: 1, order: 0 });

    const ka1_id = uuidv4();
    const ka1_aufgaben: Klausuraufgabe[] = [
        { id: uuidv4(), name: 'Aufg. 1', maxPunkte: 12, order: 0 },
        { id: uuidv4(), name: 'Aufg. 2', maxPunkte: 18, order: 1 }
    ];
    leistungsnachweise.push({ id: ka1_id, notenkategorieId: hj1s_kat_id, name: '1. Klausur', datum: new Date().toISOString().split('T')[0], typ: 'klausur', gewichtung: 1, order: 0, aufgaben: ka1_aufgaben });

    // Leistungsnachweise für HJ2
    const epo2_id = uuidv4();
    leistungsnachweise.push({ id: epo2_id, notenkategorieId: hj2m_kat_id, name: 'Mitarbeit HJ2', datum: new Date().toISOString().split('T')[0], typ: 'sammelnote', gewichtung: 1, order: 1 });
    const epo2_el_id = uuidv4();
    einzelLeistungen.push({ id: epo2_el_id, leistungsnachweisId: epo2_id, name: 'Note', gewichtung: 1, order: 0 });

    const ka2_id = uuidv4();
    const ka2_aufgaben: Klausuraufgabe[] = [
        { id: uuidv4(), name: 'Verständnis', maxPunkte: 20, order: 0 },
        { id: uuidv4(), name: 'Anwendung', maxPunkte: 15, order: 1 }
    ];
    leistungsnachweise.push({ id: ka2_id, notenkategorieId: hj2s_kat_id, name: '2. Klausur', datum: new Date().toISOString().split('T')[0], typ: 'klausur', gewichtung: 1, order: 1, aufgaben: ka2_aufgaben });


    // Noten-Daten statisch erstellen
    const notenPool = ['1', '1-', '2+', '2', '2-', '3+', '3', '3-', '4+', '4', '4-', '5+', '5', '6'];
    schueler.forEach((s, index) => {
        // HJ1 Noten
        const note1 = notenPool[index % notenPool.length];
        einzelLeistungsNoten.push({ id: uuidv4(), schuelerId: s.id, einzelLeistungId: epo1_el_id, note: note1 });

        ka1_aufgaben.forEach(aufg => {
            const baseRatio = (index % 4 === 0) ? 0.45 : (0.6 + (index % 10) * 0.04);
            let punkte = Math.round(aufg.maxPunkte * baseRatio * 2) / 2;
            punkte = Math.min(aufg.maxPunkte, punkte);
            klausuraufgabePunkte.push({ id: uuidv4(), schuelerId: s.id, aufgabeId: aufg.id, punkte });
        });

        // HJ2 Noten
        const note2 = notenPool[(index + 5) % notenPool.length]; // Offset for variation
        einzelLeistungsNoten.push({ id: uuidv4(), schuelerId: s.id, einzelLeistungId: epo2_el_id, note: note2 });

        ka2_aufgaben.forEach(aufg => {
            const baseRatio = (index % 6 === 0) ? 0.5 : (0.7 + (index % 8) * 0.03);
            let punkte = Math.round(aufg.maxPunkte * baseRatio * 2) / 2;
            punkte = Math.min(aufg.maxPunkte, punkte);
            klausuraufgabePunkte.push({ id: uuidv4(), schuelerId: s.id, aufgabeId: aufg.id, punkte });
        });
    });
    
    // --- Checklisten-Setup ---
    const checklisten: Checkliste[] = [];
    const checklistenEintraege: ChecklistenEintrag[] = [];
    const checklistenStati: { [eintragId: string]: { [schuelerId: string]: ChecklistenStatusValue } } = {};

    const ha_checkliste_id = uuidv4();
    checklisten.push({ id: ha_checkliste_id, lerngruppeId: DEMO_LERNGUPPE_ID, name: 'Hausaufgaben', order: 0 });

    const ha1_id = uuidv4();
    const ha2_id = uuidv4();
    checklistenEintraege.push({ id: ha1_id, checklisteId: ha_checkliste_id, name: 'HA vom 15.10.', order: 0 });
    checklistenEintraege.push({ id: ha2_id, checklisteId: ha_checkliste_id, name: 'HA vom 22.10.', order: 1 });

    checklistenStati[ha1_id] = {};
    checklistenStati[ha2_id] = {};
    schueler.forEach((s, index) => {
        if (index < 18) checklistenStati[ha1_id][s.id] = 'erledigt';
        else if (index < 22) checklistenStati[ha1_id][s.id] = 'nicht-erledigt';
        // rest 'offen'

        if (index % 3 === 0) checklistenStati[ha2_id][s.id] = 'nicht-erledigt';
        else if (index % 3 === 1) checklistenStati[ha2_id][s.id] = 'erledigt';
        // rest 'offen'
    });


    return {
        lerngruppen,
        schueler,
        notenkategorien,
        leistungsnachweise,
        einzelLeistungen,
        einzelLeistungsNoten,
        klausuraufgabePunkte,
        checklisten,
        checklistenEintraege,
        checklistenStati,
    };
};
