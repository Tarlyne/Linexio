import {
    Schueler,
    EinzelLeistung,
    EinzelLeistungsNote,
    Notensystem,
    Lerngruppe,
    Klausuraufgabe,
    Leistungsnachweis,
    NotenschluesselMap,
    Note,
    NotenschluesselEintrag,
    NoteMapEntry,
    KlausurNoteMapEntry
} from '../context/types';

// Helper to get note-to-point mapping
const getNoteToPointsMap = (notensystem: Notensystem): Map<string, number> => {
    return new Map(notensystem.noten.map((n: Note) => [n.displayValue, n.pointValue]));
};

// Helper to get point-to-note mapping
export const getPointsToNoteMap = (notensystem: Notensystem): Map<number, string> => {
    return new Map(notensystem.noten.map((n: Note) => [n.pointValue, n.displayValue]));
};

/**
 * Calculates the overall grade for each student for a "Sammelnote" type assessment.
 */
export const berechneSammelnoteDurchschnitt = (
    schuelerListe: Schueler[],
    einzelLeistungen: EinzelLeistung[],
    notenMap: Map<string, EinzelLeistungsNote>,
    notensystem: Notensystem,
    lerngruppe: Lerngruppe
): Map<string, NoteMapEntry> => {
    const noteToPoints = getNoteToPointsMap(notensystem);
    const pointsToNote = getPointsToNoteMap(notensystem);
    const resultMap = new Map<string, NoteMapEntry>();

    schuelerListe.forEach((schueler: Schueler) => {
        let totalWeightedPoints = 0;
        let totalWeight = 0;

        einzelLeistungen.forEach((el: EinzelLeistung) => {
            const noteRecord = notenMap.get(`${schueler.id}-${el.id}`);
            const noteValue = noteRecord?.note;
            if (noteValue) {
                const pointValue = noteToPoints.get(noteValue);
                if (pointValue !== undefined) {
                    totalWeightedPoints += pointValue * el.gewichtung;
                    totalWeight += el.gewichtung;
                }
            }
        });

        if (totalWeight > 0) {
            const averagePoints = totalWeightedPoints / totalWeight;
            const roundedPoints = Math.round(averagePoints);
            const finalGrade = pointsToNote.get(roundedPoints) || '?';
            let displayDecimalValue: number;
            let decimalSuffix = '';

            if (lerngruppe.notensystemId === 'noten_1_6_mit_tendenz') {
                displayDecimalValue = (17 - averagePoints) / 3;
            } else {
                displayDecimalValue = averagePoints;
                decimalSuffix = ' P.';
            }

            resultMap.set(schueler.id, {
                finalGrade,
                displayDecimal: `${displayDecimalValue.toFixed(2).replace('.', ',')}${decimalSuffix}`,
                averagePoints
            });
        }
    });
    return resultMap;
};


/**
 * Calculates the overall grade for each student for a "Klausur" type assessment.
 * Returns KlausurNoteMapEntry which extends NoteMapEntry.
 */
export const berechneKlausurNote = (
    schuelerListe: Schueler[],
    aufgaben: Klausuraufgabe[],
    punkteMap: Map<string, number | null>,
    leistungsnachweis: Leistungsnachweis,
    notensystem: Notensystem,
    lerngruppe: Lerngruppe,
    notenschluesselMap: NotenschluesselMap
): Map<string, KlausurNoteMapEntry> => {
    
    const notenschluessel = leistungsnachweis.notenschluessel || notenschluesselMap[lerngruppe.notensystemId] || [];
    const pointsToNote = getPointsToNoteMap(notensystem);

    const getPointValueFromProzent = (prozent: number): number => {
        // Sort descending by percentage to find the correct bracket
        const sortedSchluessel = [...notenschluessel].sort((a: NotenschluesselEintrag, b: NotenschluesselEintrag) => Number(b.prozentAb) - Number(a.prozentAb));
        for (const eintrag of sortedSchluessel) {
            if (prozent >= Number(eintrag.prozentAb)) return eintrag.pointValue;
        }
        return 0;
    };

    const maxPunkteGesamt = aufgaben.reduce((sum, aufg: Klausuraufgabe) => sum + aufg.maxPunkte, 0);
    const resultMap = new Map<string, KlausurNoteMapEntry>();

    schuelerListe.forEach((s: Schueler) => {
        const hatPunkteEintraege = aufgaben.some(aufg => punkteMap.has(`${s.id}-${aufg.id}`));
        
        // Only calculate a grade if at least one point value has been entered for this student.
        if (!hatPunkteEintraege) {
            return; // Skip this student
        }
        
        const totalPunkte = aufgaben.reduce((sum, aufg: Klausuraufgabe) => sum + (punkteMap.get(`${s.id}-${aufg.id}`) ?? 0), 0);
        
        let finalGrade = '?';
        let prozent = 0;
        let averagePoints = 0;

        if (maxPunkteGesamt > 0) {
            prozent = (totalPunkte / maxPunkteGesamt) * 100;
            averagePoints = getPointValueFromProzent(prozent);
            finalGrade = pointsToNote.get(averagePoints) || '?';
        } else {
             // Fallback for 0 max points (avoid division by zero)
             finalGrade = pointsToNote.get(0) || '?';
        }

        // Calculate displayDecimal to comply with NoteMapEntry interface
        let displayDecimalValue: number;
        let decimalSuffix = '';
        if (lerngruppe.notensystemId === 'noten_1_6_mit_tendenz') {
            displayDecimalValue = (17 - averagePoints) / 3;
        } else {
            displayDecimalValue = averagePoints;
            decimalSuffix = ' P.';
        }

        resultMap.set(s.id, { 
            finalGrade, 
            totalPunkte, 
            prozent, 
            averagePoints,
            displayDecimal: `${displayDecimalValue.toFixed(2).replace('.', ',')}${decimalSuffix}`
        });
    });

    return resultMap;
};