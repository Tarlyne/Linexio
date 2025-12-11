import React, { createContext, useCallback, ReactNode, useContext, useEffect, useSyncExternalStore, useMemo } from 'react';
import {
    Notenkategorie, Leistungsnachweis, EinzelLeistung, EinzelLeistungsNote,
    KlausuraufgabePunkte, NotenschluesselMap,
    Klausuraufgabe, DEFAULT_NOTENSCHLUESSEL_MAP, NotenKategorieTyp, Lerngruppe, Schueler, PREDEFINED_NOTENSYSTEME, Notensystem, NoteMapEntry, ColumnDef, ManuelleNote, ManuelleNoteZiel, SchuelerLeistungsnachweisFeedback
} from './types';
import { useLerngruppenContext } from './LerngruppenContext';
import { notenStore } from '../store/notenStore';

interface NotenContextState {
    notenkategorien: Notenkategorie[];
    leistungsnachweise: Leistungsnachweis[];
    einzelLeistungen: EinzelLeistung[];
    einzelLeistungsNoten: EinzelLeistungsNote[];
    klausuraufgabePunkte: KlausuraufgabePunkte[];
    notenschluesselMap: NotenschluesselMap;
    manuelleNoten: any[]; // Assuming any for now
    schuelerLeistungsnachweisFeedback: SchuelerLeistungsnachweisFeedback[];
    onUpdateNotenschluesselMap: (map: NotenschluesselMap) => Promise<void>;
    handleUpdateNotenkategorie: (updatedKategorie: Notenkategorie) => Promise<void>;
    handleAddLeistungsnachweis: (data: { bezeichnung: string; gewichtung: number; typ: 'sammelnote' | 'klausur'; inhalt?: string; context: { lerngruppeId: string; halbjahr: 1 | 2; typ: NotenKategorieTyp; }; }) => Promise<void>;
    handleUpdateLeistungsnachweis: (updatedLeistungsnachweis: Leistungsnachweis) => Promise<void>;
    handleDeleteLeistungsnachweis: (id: string) => Promise<void>;
    handleAddEinzelLeistung: (leistungsnachweisId: string, name: string, gewichtung: number) => Promise<EinzelLeistung | undefined>;
    handleUpdateEinzelLeistung: (updatedLeistung: EinzelLeistung) => Promise<void>;
    handleDeleteEinzelLeistung: (id: string) => Promise<void>;
    handleNumpadSave: (schuelerId: string, einzelLeistungId: string, note: string, bemerkung?: string) => Promise<void>;
    saveBulkEinzelLeistungsNoten: (entries: { schuelerId: string; note: string }[], einzelLeistungId: string) => Promise<void>; // NEW action
    handleAddKlausuraufgabe: (leistungsnachweisId: string, name: string, maxPunkte: number, inhalt?: string) => Promise<void>;
    handleUpdateKlausuraufgabe: (leistungsnachweisId: string, aufgabe: Klausuraufgabe) => Promise<void>;
    handleDeleteKlausuraufgabe: (leistungsnachweisId: string, aufgabeId: string) => Promise<void>;
    handlePunkteNumpadSave: (schuelerId: string, aufgabeId: string, punkte: number | null) => Promise<void>;
    onSetManuelleNote: (schuelerId: string, lerngruppeId: string, ziel: ManuelleNoteZiel, note: string) => Promise<void>;
    onDeleteManuelleNote: (schuelerId: string, lerngruppeId: string, ziel: ManuelleNoteZiel) => Promise<void>;
    onUpdateSchuelerLeistungsnachweisFeedback: (schuelerId: string, leistungsnachweisId: string, feedbackText: string) => Promise<void>;
    uebertrageNotenstruktur: (sourceLerngruppeId: string, targetLerngruppeIds: string[], scope: 'gesamt' | 'hj1' | 'hj2') => Promise<void>;
    
    // NEW calculated properties
    notensystemForLerngruppe: Notensystem | undefined;
    columns: ColumnDef[];
    schuelerLeistungsnachweisNotenMap: Map<string, NoteMapEntry>;
    schuelerKategorieNotenMap: Map<string, NoteMapEntry>;
    schuelerHalbjahresNotenMap: Map<string, NoteMapEntry>;
    schuelerGesamtNotenMap: Map<string, NoteMapEntry>;
}

export const NotenContext = createContext<NotenContextState | undefined>(undefined);

export const useNotenContext = () => {
    const context = useContext(NotenContext);
    if (context === undefined) {
        throw new Error('useNotenContext must be used within a NotenContextProvider');
    }
    return context;
};

export const NotenContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { lerngruppen, selectedLerngruppe, schuelerInSelectedLerngruppe } = useLerngruppenContext();

    const notenState = useSyncExternalStore(notenStore.subscribe, notenStore.getState);

    // Initial data loading and cleanup effects
    useEffect(() => {
        if (lerngruppen.length > 0) {
            notenStore.actions.createDefaultKategorien(lerngruppen);
        }
    }, [lerngruppen]);

    useEffect(() => {
        notenStore.actions.cleanupOrphanedData(lerngruppen);
    }, [lerngruppen]);
    
    // Calculation trigger for the currently viewed Lerngruppe
    useEffect(() => {
        if (selectedLerngruppe) {
            // This will now trigger for groups with 0 students as well.
            // The logic inside recalculateNotenForLerngruppe handles the clearing of state.
            notenStore.actions.recalculateNotenForLerngruppe(selectedLerngruppe, schuelerInSelectedLerngruppe);
        } else {
            // Also explicitly clear state if no Lerngruppe is selected at all.
            notenStore.actions.recalculateNotenForLerngruppe(null, []);
        }
    }, [selectedLerngruppe, schuelerInSelectedLerngruppe]);

    const notensystemForLerngruppe = useMemo(() => 
        PREDEFINED_NOTENSYSTEME.find(ns => ns.id === selectedLerngruppe?.notensystemId),
    [selectedLerngruppe?.notensystemId]);
    
    // --- New Handler Functions ---
    // These handlers wrap the store actions, providing the necessary context (Lerngruppe, Schuelerliste)
    // to enable intelligent, granular recalculations within the store.

    const handleUpdateNotenschluesselMap = useCallback(async (map: NotenschluesselMap) => {
        // Step 1: Always save the new map. This is the main fix.
        await notenStore.actions.updateNotenschluesselMap(map);
        
        // Step 2: If a Lerngruppe is currently selected (e.g., in Notenuebersicht),
        // trigger a recalculation for it. This doesn't happen in settings, which is fine.
        if (selectedLerngruppe) {
            notenStore.actions.recalculateNotenForLerngruppe(selectedLerngruppe, schuelerInSelectedLerngruppe);
        }
    }, [selectedLerngruppe, schuelerInSelectedLerngruppe]);
    
    const handleUpdateNotenkategorie = useCallback(async (updatedKategorie: Notenkategorie) => {
        if (selectedLerngruppe) {
            await notenStore.actions.updateNotenkategorie(updatedKategorie, selectedLerngruppe, schuelerInSelectedLerngruppe);
        }
    }, [selectedLerngruppe, schuelerInSelectedLerngruppe]);

    const handleAddLeistungsnachweis = useCallback(async (data: { bezeichnung: string; gewichtung: number; typ: 'sammelnote' | 'klausur'; inhalt?: string; context: { lerngruppeId: string; halbjahr: 1 | 2; typ: NotenKategorieTyp; }; }) => {
        if (selectedLerngruppe) {
            await notenStore.actions.addLeistungsnachweis(data, selectedLerngruppe, schuelerInSelectedLerngruppe);
        }
    }, [selectedLerngruppe, schuelerInSelectedLerngruppe]);

    const handleUpdateLeistungsnachweis = useCallback(async (updatedLeistungsnachweis: Leistungsnachweis) => {
        if (selectedLerngruppe) {
            await notenStore.actions.updateLeistungsnachweis(updatedLeistungsnachweis, selectedLerngruppe, schuelerInSelectedLerngruppe);
        }
    }, [selectedLerngruppe, schuelerInSelectedLerngruppe]);

    const handleDeleteLeistungsnachweis = useCallback(async (id: string) => {
        if (selectedLerngruppe) {
            await notenStore.actions.deleteLeistungsnachweis(id, selectedLerngruppe, schuelerInSelectedLerngruppe);
        }
    }, [selectedLerngruppe, schuelerInSelectedLerngruppe]);

    const handleAddEinzelLeistung = useCallback(async (leistungsnachweisId: string, name: string, gewichtung: number) => {
        if (selectedLerngruppe) {
            return await notenStore.actions.addEinzelLeistung(leistungsnachweisId, name, gewichtung, selectedLerngruppe, schuelerInSelectedLerngruppe);
        }
    }, [selectedLerngruppe, schuelerInSelectedLerngruppe]);

    const handleUpdateEinzelLeistung = useCallback(async (updatedLeistung: EinzelLeistung) => {
        if (selectedLerngruppe) {
            await notenStore.actions.updateEinzelLeistung(updatedLeistung, selectedLerngruppe, schuelerInSelectedLerngruppe);
        }
    }, [selectedLerngruppe, schuelerInSelectedLerngruppe]);

    const handleDeleteEinzelLeistung = useCallback(async (id: string) => {
        if (selectedLerngruppe) {
            await notenStore.actions.deleteEinzelLeistung(id, selectedLerngruppe, schuelerInSelectedLerngruppe);
        }
    }, [selectedLerngruppe, schuelerInSelectedLerngruppe]);

    const handleNumpadSave = useCallback(async (schuelerId: string, einzelLeistungId: string, note: string, bemerkung?: string) => {
        if (selectedLerngruppe) {
            await notenStore.actions.saveEinzelLeistungsNote(schuelerId, einzelLeistungId, note, bemerkung, selectedLerngruppe, schuelerInSelectedLerngruppe);
        }
    }, [selectedLerngruppe, schuelerInSelectedLerngruppe]);

    const saveBulkEinzelLeistungsNoten = useCallback(async (entries: { schuelerId: string; note: string }[], einzelLeistungId: string) => {
        if (selectedLerngruppe) {
            await notenStore.actions.saveBulkEinzelLeistungsNoten(entries, einzelLeistungId, selectedLerngruppe, schuelerInSelectedLerngruppe);
        }
    }, [selectedLerngruppe, schuelerInSelectedLerngruppe]);
    
    const handleAddKlausuraufgabe = useCallback(async (leistungsnachweisId: string, name: string, maxPunkte: number, inhalt?: string) => {
        if (selectedLerngruppe) {
            await notenStore.actions.addKlausuraufgabe(leistungsnachweisId, name, maxPunkte, selectedLerngruppe, schuelerInSelectedLerngruppe, inhalt);
        }
    }, [selectedLerngruppe, schuelerInSelectedLerngruppe]);
    
    const handleUpdateKlausuraufgabe = useCallback(async (leistungsnachweisId: string, aufgabe: Klausuraufgabe) => {
        if (selectedLerngruppe) {
            await notenStore.actions.updateKlausuraufgabe(leistungsnachweisId, aufgabe, selectedLerngruppe, schuelerInSelectedLerngruppe);
        }
    }, [selectedLerngruppe, schuelerInSelectedLerngruppe]);

    const handleDeleteKlausuraufgabe = useCallback(async (leistungsnachweisId: string, aufgabeId: string) => {
        if (selectedLerngruppe) {
            await notenStore.actions.deleteKlausuraufgabe(leistungsnachweisId, aufgabeId, selectedLerngruppe, schuelerInSelectedLerngruppe);
        }
    }, [selectedLerngruppe, schuelerInSelectedLerngruppe]);
    
    const handlePunkteNumpadSave = useCallback(async (schuelerId: string, aufgabeId: string, punkte: number | null) => {
        if (selectedLerngruppe) {
            await notenStore.actions.saveKlausuraufgabePunkte(schuelerId, aufgabeId, punkte, selectedLerngruppe, schuelerInSelectedLerngruppe);
        }
    }, [selectedLerngruppe, schuelerInSelectedLerngruppe]);
    
    const onSetManuelleNote = useCallback(async (schuelerId: string, lerngruppeId: string, ziel: ManuelleNoteZiel, note: string) => {
        if (selectedLerngruppe) {
            await notenStore.actions.setManuelleNote(schuelerId, lerngruppeId, ziel, note, selectedLerngruppe, schuelerInSelectedLerngruppe);
        }
    }, [selectedLerngruppe, schuelerInSelectedLerngruppe]);

    const onDeleteManuelleNote = useCallback(async (schuelerId: string, lerngruppeId: string, ziel: ManuelleNoteZiel) => {
        if (selectedLerngruppe) {
            await notenStore.actions.deleteManuelleNote(schuelerId, lerngruppeId, ziel, selectedLerngruppe, schuelerInSelectedLerngruppe);
        }
    }, [selectedLerngruppe, schuelerInSelectedLerngruppe]);

    const uebertrageNotenstruktur = useCallback(async (sourceLerngruppeId: string, targetLerngruppeIds: string[], scope: 'gesamt' | 'hj1' | 'hj2') => {
        await notenStore.actions.uebertrageNotenstruktur(sourceLerngruppeId, targetLerngruppeIds, scope);
        if (selectedLerngruppe) {
            // Trigger a recalc for the current view if it was affected
             notenStore.actions.recalculateNotenForLerngruppe(selectedLerngruppe, schuelerInSelectedLerngruppe);
        }
    }, [selectedLerngruppe, schuelerInSelectedLerngruppe]);


    const value: NotenContextState = {
        ...notenState,
        onUpdateNotenschluesselMap: handleUpdateNotenschluesselMap,
        handleUpdateNotenkategorie,
        handleAddLeistungsnachweis,
        handleUpdateLeistungsnachweis,
        handleDeleteLeistungsnachweis,
        handleAddEinzelLeistung,
        handleUpdateEinzelLeistung,
        handleDeleteEinzelLeistung,
        handleNumpadSave,
        saveBulkEinzelLeistungsNoten,
        handleAddKlausuraufgabe,
        handleUpdateKlausuraufgabe,
        handleDeleteKlausuraufgabe,
        handlePunkteNumpadSave,
        onSetManuelleNote,
        onDeleteManuelleNote,
        onUpdateSchuelerLeistungsnachweisFeedback: notenStore.actions.updateSchuelerLeistungsnachweisFeedback, // No recalc needed
        uebertrageNotenstruktur,
        // Calculated properties
        notensystemForLerngruppe,
    };

    return <NotenContext.Provider value={value}>{children}</NotenContext.Provider>;
};