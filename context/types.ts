import React from 'react';

// --- Basis-Typen ---

export type Gender = 'm' | 'w' | 'd';

export interface Schueler {
  id: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  birthday?: string;
  profilePicture?: string; // base64 string
  notes?: string;
  contactGuardian1?: string;
  contactGuardian2?: string;
  hasNachteilsausgleich?: boolean;
  nachteilsausgleichDetails?: string;
  paedagogischeMerkmale?: string[];
}

export interface Lerngruppe {
  id: string;
  name: string;
  fach: string;
  schuljahr: string;
  schuelerIds: string[];
  notensystemId: string;
  order: number;
  gewichtungHj1: number;
  gewichtungHj2: number;
}

// --- Termine ---
export type TerminKategorie = 'KLAUSUR' | 'KONFERENZ' | 'ELTERNGESPRAECH' | 'SONSTIGES';

export interface Termin {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime?: string; // HH:MM
  kategorie: TerminKategorie;
  lerngruppeId?: string; // Optional link to a class (for Klausur)
  schuelerId?: string; // Optional link to a student (for Elterngespraeche)
  notiz?: string;
  schuljahr: string;
  isFeiertag?: boolean; // NEW: Flag for generated holidays
}


// --- Notensystem & Notenschlüssel ---

export interface Note {
  displayValue: string;
  pointValue: number;
}

export interface Notensystem {
  id: string;
  name: string;
  noten: Note[];
}

export const PREDEFINED_NOTENSYSTEME: Notensystem[] = [
    {
        id: 'noten_1_6_mit_tendenz',
        name: 'Noten 1-6 mit Tendenzen',
        noten: [
            { displayValue: '1+', pointValue: 15 }, { displayValue: '1', pointValue: 14 }, { displayValue: '1-', pointValue: 13 },
            { displayValue: '2+', pointValue: 12 }, { displayValue: '2', pointValue: 11 }, { displayValue: '2-', pointValue: 10 },
            { displayValue: '3+', pointValue: 9 }, { displayValue: '3', pointValue: 8 }, { displayValue: '3-', pointValue: 7 },
            { displayValue: '4+', pointValue: 6 }, { displayValue: '4', pointValue: 5 }, { displayValue: '4-', pointValue: 4 },
            { displayValue: '5+', pointValue: 3 }, { displayValue: '5', pointValue: 2 }, { displayValue: '5-', pointValue: 1 },
            { displayValue: '6', pointValue: 0 }
        ]
    },
    {
        id: 'punkte_15_0',
        name: 'Punktesystem (15-0)',
        noten: [
            { displayValue: '15', pointValue: 15 }, { displayValue: '14', pointValue: 14 }, { displayValue: '13', pointValue: 13 },
            { displayValue: '12', pointValue: 12 }, { displayValue: '11', pointValue: 11 }, { displayValue: '10', pointValue: 10 },
            { displayValue: '9', pointValue: 9 }, { displayValue: '8', pointValue: 8 }, { displayValue: '7', pointValue: 7 },
            { displayValue: '6', pointValue: 6 }, { displayValue: '5', pointValue: 5 }, { displayValue: '4', pointValue: 4 },
            { displayValue: '3', pointValue: 3 }, { displayValue: '2', pointValue: 2 }, { displayValue: '1', pointValue: 1 },
            { displayValue: '0', pointValue: 0 }
        ]
    }
];

export interface NotenschluesselEintrag {
  pointValue: number;
  prozentAb: number | '';
}

export type NotenschluesselMap = {
  [notensystemId: string]: NotenschluesselEintrag[];
};

export const DEFAULT_NOTENSCHLUESSEL_MAP: NotenschluesselMap = {
    'punkte_15_0': [
        { pointValue: 15, prozentAb: 95 }, { pointValue: 14, prozentAb: 90 }, { pointValue: 13, prozentAb: 85 },
        { pointValue: 12, prozentAb: 80 }, { pointValue: 11, prozentAb: 75 }, { pointValue: 10, prozentAb: 70 },
        { pointValue: 9, prozentAb: 65 }, { pointValue: 8, prozentAb: 60 }, { pointValue: 7, prozentAb: 55 },
        { pointValue: 6, prozentAb: 50 }, { pointValue: 5, prozentAb: 45 }, { pointValue: 4, prozentAb: 40 },
        { pointValue: 3, prozentAb: 33 }, { pointValue: 2, prozentAb: 27 }, { pointValue: 1, prozentAb: 20 },
        { pointValue: 0, prozentAb: 0 }
    ],
    'noten_1_6_mit_tendenz': [
        { pointValue: 15, prozentAb: 95 }, { pointValue: 14, prozentAb: 90 }, { pointValue: 13, prozentAb: 85 },
        { pointValue: 12, prozentAb: 80 }, { pointValue: 11, prozentAb: 75 }, { pointValue: 10, prozentAb: 70 },
        { pointValue: 9, prozentAb: 65 }, { pointValue: 8, prozentAb: 60 }, { pointValue: 7, prozentAb: 55 },
        { pointValue: 6, prozentAb: 50 }, { pointValue: 5, prozentAb: 45 }, { pointValue: 4, prozentAb: 40 },
        { pointValue: 3, prozentAb: 33 }, { pointValue: 2, prozentAb: 27 }, { pointValue: 1, prozentAb: 20 },
        { pointValue: 0, prozentAb: 0 }
    ]
};


// --- Noten-Struktur ---

export type NotenKategorieTyp = 'mündlich' | 'schriftlich';

export interface Notenkategorie {
    id: string;
    lerngruppeId: string;
    name: string;
    typ: NotenKategorieTyp;
    halbjahr: 1 | 2;
    gewichtung: number;
    order: number;
}

export interface Klausuraufgabe {
    id: string;
    name: string;
    maxPunkte: number;
    order: number;
    inhalt?: string; // Optional content description (e.g., "Grammatik")
}

export interface Leistungsnachweis {
    id: string;
    notenkategorieId: string;
    name: string;
    datum: string; // YYYY-MM-DD
    typ: 'sammelnote' | 'klausur';
    gewichtung: number;
    order: number;
    // For Klausur
    aufgaben?: Klausuraufgabe[];
    notenschluessel?: NotenschluesselEintrag[];
    inhalt?: string; // Optional content description (e.g., "Thema: Lineare Funktionen")
}

export interface EinzelLeistung {
    id: string;
    leistungsnachweisId: string;
    name: string;
    gewichtung: number;
    order: number;
}


// --- Noten-Daten ---

export interface EinzelLeistungsNote {
    id: string;
    schuelerId: string;
    einzelLeistungId: string;
    note: string;
    bemerkung?: string;
}

export interface KlausuraufgabePunkte {
    id: string;
    schuelerId: string;
    aufgabeId: string;
    punkte: number;
}

/**
 * Universelle Struktur für einen berechneten Noten-Eintrag.
 * Wird verwendet für: Einzelne Leistungsnachweise, Kategorien, Halbjahre und Gesamtnoten.
 */
export interface NoteMapEntry {
    finalGrade: string;      // Die Endnote als String (z.B. "2+" oder "11")
    displayDecimal: string;  // Die Dezimaldarstellung für die Anzeige (z.B. "11,50 P." oder "2,3")
    averagePoints: number;   // Der rohe numerische Durchschnittswert (0-15)
    isManual?: boolean;      // Ob dieser Wert manuell überschrieben wurde
}

/**
 * Erweiterter Typ für Klausuren, die zusätzliche Metadaten haben.
 */
export interface KlausurNoteMapEntry extends NoteMapEntry {
    totalPunkte: number;     // Summe der erreichten Rohpunkte
    prozent: number;         // Erreichter Prozentsatz
}

export type ManuelleNoteZiel = 'hj1' | 'hj2' | 'gesamt';

export interface ManuelleNote {
    id: string; // combination of schuelerId, lerngruppeId, and ziel
    schuelerId: string;
    lerngruppeId: string;
    ziel: ManuelleNoteZiel;
    note: string;
}

export interface SchuelerLeistungsnachweisFeedback {
    id: string; // combination of schuelerId and leistungsnachweisId
    schuelerId: string;
    leistungsnachweisId: string;
    feedbackText: string;
}


// --- Tools ---

export interface Checkliste {
    id: string;
    lerngruppeId: string;
    name: string;
    order: number;
}

export interface ChecklistenEintrag {
    id: string;
    checklisteId: string;
    name: string;
    order: number;
    faelligkeitsdatum?: string;
}

export type ChecklistenStatusValue = 'erledigt' | 'nicht-erledigt' | 'offen';

export type CellType = 'seat' | 'aisle' | 'desk';

export interface SchuelerPlatzierung {
    row: number;
    col: number;
    isPinned: boolean;
}

export interface Sitzplan {
    id: string;
    lerngruppeId: string;
    rows: number;
    cols: number;
    layout: CellType[][];
    schuelerPlacements: { [schuelerId: string]: SchuelerPlatzierung };
    aiPrompt?: string;
}

// NEU: Gruppeneinteilung
export interface Gruppe {
    id: string;
    name: string;
    schuelerIds: string[];
}

export interface GruppenEinteilung {
    id: string; // uuid, usually linked to lerngruppeId or unique
    lerngruppeId: string;
    gruppen: Gruppe[];
    // Wir speichern "nicht zugeordnet" nicht explizit, da dies dynamisch berechnet wird.
}

export interface NotizKategorie {
    id: string;
    name: string;
    icon: string;
    order: number;
}

export interface Notiz {
    id: string;
    kategorieId: string;
    title: string;
    content: string;
    createdAt: string; // ISO String
    updatedAt: string; // ISO String
}


// --- Modal Contexts & UI-Helfer ---

export interface AddLeistungsnachweisModalContext {
    halbjahr: 1 | 2;
    typ: NotenKategorieTyp;
}

export type EditModalItem = (Leistungsnachweis & { _type: 'leistungsnachweis' }) | (Notenkategorie & { _type: 'notenkategorie' }) | { id: 'hj1' | 'hj2', name: string, gewichtung: number, _type: 'halbjahr' };

export interface EditModalContext {
    item: EditModalItem;
    title: string;
    isNameEditable: boolean;
}

export interface ManuelleNoteModalContext {
    schueler: Schueler;
    lerngruppeId: string;
    ziel: ManuelleNoteZiel;
    berechneteNote?: string;
    berechneteDezimalNote?: string;
}

export interface ColumnDef {
    id: string;
    type: 'gesamt_avg' | 'halbjahr_avg' | 'kategorie_avg' | 'leistungsnachweis' | 'kategorie_placeholder';
    halbjahr: 1 | 2 | null;
    kategorieTyp?: NotenKategorieTyp;
    label: string;
    gewichtung?: number;
    data?: Leistungsnachweis | Notenkategorie;
    isAverage: boolean;
}

export interface HeaderCell {
    id: string;
    text: string;
    style: React.CSSProperties;
    className?: string;
    gewichtung?: number;
    colDef?: ColumnDef;
}

// --- Feedback System ---

export interface FeedbackMetadata {
    activeView: string;
    activeTool?: string | null;
    selectedLerngruppeId?: string;
    selectedSchuelerId?: string;
    sidebarContext: string;
    currentSchoolYear: string;
    theme: string;
    userAgent: string;
    screenResolution: string;
    appVersion: string;
}

export interface FeedbackPayload {
    text: string;
    metadata: FeedbackMetadata;
    screenshot?: string; // base64
    email?: string;
}

// --- Changelog ---
export interface ChangelogVersion {
  version: string;
  date: string;
  changes: string[];
}

export interface ChangelogData {
  _comment?: string;
  versions: ChangelogVersion[];
}