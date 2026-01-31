import { describe, it, expect } from 'vitest';
import { berechneSammelnoteDurchschnitt, berechneKlausurNote } from './NotenberechnungService';
import {
    Schueler,
    EinzelLeistung,
    EinzelLeistungsNote,
    Notensystem,
    Lerngruppe,
    Leistungsnachweis,
    Klausuraufgabe,
    KlausuraufgabePunkte,
    NotenschluesselMap,
    PREDEFINED_NOTENSYSTEME,
    DEFAULT_NOTENSCHLUESSEL_MAP
} from '../context/types';

// --- Mock Data ---

const notensystemPunkte: Notensystem = PREDEFINED_NOTENSYSTEME.find(ns => ns.id === 'punkte_15_0')!;
const notensystemNoten: Notensystem = PREDEFINED_NOTENSYSTEME.find(ns => ns.id === 'noten_1_6_mit_tendenz')!;

const schueler1: Schueler = { id: 's1', firstName: 'Max', lastName: 'Mustermann', gender: 'm' };
const schueler2: Schueler = { id: 's2', firstName: 'Erika', lastName: 'Musterfrau', gender: 'w' };
const schueler3: Schueler = { id: 's3', firstName: 'Ohne', lastName: 'Note', gender: 'd' };

const lerngruppePunkte: Lerngruppe = {
    id: 'lg1', name: 'Test', fach: 'Test', schuljahr: '23/24', schuelerIds: ['s1', 's2', 's3'],
    notensystemId: 'punkte_15_0', order: 0, gewichtungHj1: 1, gewichtungHj2: 1
};

const lerngruppeNoten: Lerngruppe = {
    ...lerngruppePunkte,
    notensystemId: 'noten_1_6_mit_tendenz'
};

// --- Tests for berechneSammelnoteDurchschnitt ---

describe('berechneSammelnoteDurchschnitt', () => {
    const einzelLeistungen: EinzelLeistung[] = [
        { id: 'el1', leistungsnachweisId: 'ln1', name: 'Test 1', gewichtung: 1, order: 0 },
        { id: 'el2', leistungsnachweisId: 'ln1', name: 'Test 2', gewichtung: 2, order: 1 }
    ];

    const notenMap: Map<string, EinzelLeistungsNote> = new Map([
        ['s1-el1', { id: 'n1', schuelerId: 's1', einzelLeistungId: 'el1', note: '12' }], // s1 hat 12 Pkt (x1)
        ['s1-el2', { id: 'n2', schuelerId: 's1', einzelLeistungId: 'el2', note: '9' }],  // und 9 Pkt (x2) -> (12*1 + 9*2) / 3 = 30 / 3 = 10 Pkt
        ['s2-el1', { id: 'n3', schuelerId: 's2', einzelLeistungId: 'el1', note: '15' }], // s2 hat 15 Pkt (x1)
    ]);

    it('sollte den gewichteten Notendurchschnitt korrekt berechnen (Punktesystem)', () => {
        const result = berechneSammelnoteDurchschnitt([schueler1], einzelLeistungen, notenMap, notensystemPunkte, lerngruppePunkte);
        const s1Note = result.get('s1');
        expect(s1Note).toBeDefined();
        expect(s1Note?.finalGrade).toBe('10');
        expect(s1Note?.averagePoints).toBeCloseTo(10);
    });

    it('sollte den Durchschnitt für einen Schüler mit nur einer Note berechnen', () => {
        const result = berechneSammelnoteDurchschnitt([schueler2], einzelLeistungen, notenMap, notensystemPunkte, lerngruppePunkte);
        const s2Note = result.get('s2');
        expect(s2Note).toBeDefined();
        expect(s2Note?.finalGrade).toBe('15');
        expect(s2Note?.averagePoints).toBe(15);
    });

    it('sollte keinen Eintrag für Schüler ohne Noten zurückgeben', () => {
        const result = berechneSammelnoteDurchschnitt([schueler3], einzelLeistungen, notenMap, notensystemPunkte, lerngruppePunkte);
        expect(result.has('s3')).toBe(false);
    });

    it('sollte den Notendurchschnitt im Notensystem 1-6 korrekt berechnen', () => {
        const notenMapNoten: Map<string, EinzelLeistungsNote> = new Map([
            ['s1-el1', { id: 'n1', schuelerId: 's1', einzelLeistungId: 'el1', note: '2+' }], // 12 Pkt
            ['s1-el2', { id: 'n2', schuelerId: 's1', einzelLeistungId: 'el2', note: '3' }],  // 8 Pkt -> (12*1 + 8*2) / 3 = 28/3 = 9.33 Pkt -> gerundet 9 Pkt -> 3+
        ]);
        const result = berechneSammelnoteDurchschnitt([schueler1], einzelLeistungen, notenMapNoten, notensystemNoten, lerngruppeNoten);
        const s1Note = result.get('s1');
        expect(s1Note).toBeDefined();
        expect(s1Note?.finalGrade).toBe('3+');
        expect(s1Note?.averagePoints).toBeCloseTo(9.333);
        expect(s1Note?.displayDecimal).toContain('2,56');
    });
});

// --- Tests for berechneKlausurNote ---

describe('berechneKlausurNote', () => {
    const aufgaben: Klausuraufgabe[] = [
        { id: 'a1', name: 'A1', maxPunkte: 10, order: 0 },
        { id: 'a2', name: 'A2', maxPunkte: 20, order: 1 } // Total 30 Pkt
    ];
    const leistungsnachweis: Leistungsnachweis = {
        id: 'ln-klausur', notenkategorieId: 'nk1', name: 'Klausur 1', typ: 'klausur', datum: '', gewichtung: 1, order: 0, aufgaben
    };
    const notenschluesselMap: NotenschluesselMap = DEFAULT_NOTENSCHLUESSEL_MAP;

    it('sollte die korrekte Note basierend auf dem globalen Notenschlüssel berechnen', () => {
        // s1 erreicht 25.5/30 Punkten -> 85% -> 13 Pkt
        const punkteMap = new Map<string, number | null>([
            ['s1-a1', 8.5],
            ['s1-a2', 17],
        ]);
        const result = berechneKlausurNote([schueler1], aufgaben, punkteMap, leistungsnachweis, notensystemPunkte, lerngruppePunkte, notenschluesselMap);
        const s1Note = result.get('s1');
        expect(s1Note).toBeDefined();
        expect(s1Note?.finalGrade).toBe('13');
        expect(s1Note?.totalPunkte).toBe(25.5);
        expect(s1Note?.prozent).toBe(85);
    });

    it('sollte die Note 0 Punkte bei 0 erreichten Punkten vergeben', () => {
        const punkteMap = new Map<string, number | null>([
            ['s1-a1', 0],
            ['s1-a2', 0],
        ]);
        const result = berechneKlausurNote([schueler1], aufgaben, punkteMap, leistungsnachweis, notensystemPunkte, lerngruppePunkte, notenschluesselMap);
        const s1Note = result.get('s1');
        expect(s1Note).toBeDefined();
        expect(s1Note?.finalGrade).toBe('0');
        expect(s1Note?.totalPunkte).toBe(0);
        expect(s1Note?.prozent).toBe(0);
    });

    it('sollte einen klausurspezifischen Notenschlüssel verwenden, wenn vorhanden', () => {
        // s1 erreicht 21/30 Punkten -> 70%
        // Global: 70% -> 10 Pkt. Custom: 70% -> 11 Pkt
        const customSchluessel = [...notenschluesselMap.punkte_15_0];
        customSchluessel[4] = { pointValue: 11, prozentAb: 70 }; // Change 75% -> 70% for 11 points
        const lnWithCustom: Leistungsnachweis = { ...leistungsnachweis, notenschluessel: customSchluessel };
        const punkteMap = new Map<string, number | null>([
            ['s1-a1', 7],
            ['s1-a2', 14],
        ]);
        const result = berechneKlausurNote([schueler1], aufgaben, punkteMap, lnWithCustom, notensystemPunkte, lerngruppePunkte, notenschluesselMap);
        const s1Note = result.get('s1');
        expect(s1Note).toBeDefined();
        expect(s1Note?.finalGrade).toBe('11');
    });

    it('sollte keinen Eintrag für Schüler ohne Punkte zurückgeben', () => {
        const punkteMap = new Map<string, number | null>(); // Empty map
        const result = berechneKlausurNote([schueler1, schueler2], aufgaben, punkteMap, leistungsnachweis, notensystemPunkte, lerngruppePunkte, notenschluesselMap);
        expect(result.size).toBe(0);
    });

    it('sollte korrekt mit einer Klausur ohne Aufgaben umgehen', () => {
        const leereAufgaben: Klausuraufgabe[] = [];
        const punkteMap = new Map<string, number | null>();
        const result = berechneKlausurNote([schueler1], leereAufgaben, punkteMap, leistungsnachweis, notensystemPunkte, lerngruppePunkte, notenschluesselMap);
        const s1Note = result.get('s1');
        expect(s1Note).toBeDefined();
        expect(s1Note?.finalGrade).toBe('0'); // 0/0 results in 0% -> 0 points.
    });

    describe('Edge Cases & Robustheit', () => {
        it('sollte null-Punkte in der PunkteMap als 0 werten (Klausur)', () => {
            const punkteMap = new Map<string, number | null>([
                ['s1-a1', null],
                ['s1-a2', 15],
            ]);
            const result = berechneKlausurNote([schueler1], aufgaben, punkteMap, leistungsnachweis, notensystemPunkte, lerngruppePunkte, notenschluesselMap);
            const s1Note = result.get('s1');
            expect(s1Note?.totalPunkte).toBe(15);
            expect(s1Note?.prozent).toBe(50);
        });

        it('sollte mit EinzelLeistungen der Gewichtung 0 umgehen (Sammelnote)', () => {
            const elGewichtung0: EinzelLeistung[] = [
                { id: 'el1', leistungsnachweisId: 'ln1', name: 'T1', gewichtung: 0, order: 0 },
                { id: 'el2', leistungsnachweisId: 'ln1', name: 'T2', gewichtung: 1, order: 1 }
            ];
            const notenMap: Map<string, EinzelLeistungsNote> = new Map([
                ['s1-el1', { id: 'n1', schuelerId: 's1', einzelLeistungId: 'el1', note: '15' }],
                ['s1-el2', { id: 'n2', schuelerId: 's1', einzelLeistungId: 'el2', note: '10' }],
            ]);
            const result = berechneSammelnoteDurchschnitt([schueler1], elGewichtung0, notenMap, notensystemPunkte, lerngruppePunkte);
            expect(result.get('s1')?.averagePoints).toBe(10);
        });

        it('sollte keine Note berechnen, wenn die Gesamtgewichtung 0 ist', () => {
            const elGewichtung0: EinzelLeistung[] = [
                { id: 'el1', leistungsnachweisId: 'ln1', name: 'T1', gewichtung: 0, order: 0 }
            ];
            const notenMap: Map<string, EinzelLeistungsNote> = new Map([
                ['s1-el1', { id: 'n1', schuelerId: 's1', einzelLeistungId: 'el1', note: '15' }]
            ]);
            const result = berechneSammelnoteDurchschnitt([schueler1], elGewichtung0, notenMap, notensystemPunkte, lerngruppePunkte);
            expect(result.has('s1')).toBe(false);
        });
    });
});
