import React, { createContext, useCallback, ReactNode, useContext, useEffect, useMemo, useSyncExternalStore } from 'react';
import { GoogleGenAI } from '@google/genai';
import {
    Checkliste, ChecklistenEintrag, ChecklistenStatusValue, Sitzplan, SchuelerPlatzierung, Lerngruppe, Schueler, NotizKategorie, Notiz, GruppenEinteilung, Gruppe
} from './types';
import { useLerngruppenContext } from './LerngruppenContext';
import { toolsStore } from '../store/toolsStore';

interface ToolsContextState {
    ai: GoogleGenAI;
    pickedSchuelerIds: { [key: string]: string[] };
    onMarkSchuelerAsPicked: (lerngruppeId: string, schuelerId: string) => Promise<void>;
    onResetPickedList: (lerngruppeId: string) => Promise<void>;
    checklisten: Checkliste[];
    checklistenEintraege: ChecklistenEintrag[];
    checklistenStati: { [eintragId: string]: { [schuelerId: string]: ChecklistenStatusValue } };
    onAddCheckliste: (name: string, lerngruppeId: string) => Promise<Checkliste>;
    onUpdateCheckliste: (id: string, newName: string) => Promise<void>;
    onDeleteCheckliste: (id: string) => Promise<void>;
    onAddChecklistenEintrag: (name: string, checklisteId: string, defaultStatus: ChecklistenStatusValue, faelligkeitsdatum?: string) => Promise<void>;
    onUpdateChecklistenEintrag: (id: string, newName: string, newFaelligkeitsdatum?: string) => Promise<void>;
    onDeleteChecklistenEintrag: (id: string) => Promise<void>;
    onToggleChecklistenStatus: (eintragId: string, schuelerId: string) => Promise<void>;
    sitzplaene: Sitzplan[];
    onUpdateSitzplan: (sitzplan: Sitzplan) => Promise<void>;
    gruppenEinteilungen: GruppenEinteilung[];
    onUpdateGruppenEinteilung: (lerngruppeId: string, gruppen: Gruppe[]) => Promise<void>;
    onResetGruppenEinteilung: (lerngruppeId: string) => Promise<void>;
    notizKategorien: NotizKategorie[];
    notizen: Notiz[];
    onAddNotizKategorie: (name: string, icon: string) => Promise<NotizKategorie>;
    onUpdateNotizKategorie: (id: string, name: string, icon: string) => Promise<void>;
    onDeleteNotizKategorie: (id: string) => Promise<void>;
    onAddNotiz: (kategorieId: string, title: string, content: string) => Promise<void>;
    onUpdateNotiz: (id: string, title: string, content: string) => Promise<void>;
    onDeleteNotiz: (id: string) => Promise<void>;
}

// FIX: Export ToolsContext to allow its use in test files for providing mock values.
export const ToolsContext = createContext<ToolsContextState | undefined>(undefined);

export const useToolsContext = () => {
    const context = useContext(ToolsContext);
    if (context === undefined) {
        throw new Error('useToolsContext must be used within a ToolsContextProvider');
    }
    return context;
};

export const ToolsContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { lerngruppen, allSchueler } = useLerngruppenContext();
    
    const toolsState = useSyncExternalStore(toolsStore.subscribe, toolsStore.getState);
    
    // Robuste Initialisierung: Falls der Key fehlt (z.B. im Build), nutze einen Platzhalter,
    // damit die App nicht abstürzt. Die KI-Funktionen werden dann fehlschlagen, aber die App läuft.
    const ai = useMemo(() => {
        const apiKey = process.env.API_KEY || 'MISSING_API_KEY_PLACEHOLDER';
        try {
            return new GoogleGenAI({ apiKey });
        } catch (e) {
            console.error("Failed to initialize GoogleGenAI. AI features will be disabled.", e);
            // Return a dummy object or a valid instance with a placeholder key to prevent crash
            // The SDK might throw in constructor if key is missing, so we catch it.
            // We return a new instance with the placeholder, which should pass constructor check 
            // but fail on actual API calls.
            return new GoogleGenAI({ apiKey: 'MISSING_API_KEY_PLACEHOLDER' });
        }
    }, []);

    useEffect(() => {
        if (lerngruppen.length > 0) {
            toolsStore.actions.createDefaultSitzplaene(lerngruppen);
        }
    }, [lerngruppen]);

    useEffect(() => {
        toolsStore.actions.cleanupOrphanedData(lerngruppen);
    }, [lerngruppen]);
    
    const onAddChecklistenEintrag = useCallback(async (name: string, checklisteId: string, defaultStatus: ChecklistenStatusValue, faelligkeitsdatum?: string) => {
        const checkliste = toolsState.checklisten.find(c => c.id === checklisteId);
        if (checkliste) {
            const lerngruppe = lerngruppen.find(lg => lg.id === checkliste.lerngruppeId);
            const schuelerIdsInGruppe = lerngruppe?.schuelerIds || [];
            const schuelerInGruppe = allSchueler.filter(s => schuelerIdsInGruppe.includes(s.id));
            await toolsStore.actions.addChecklistenEintrag(name, checklisteId, defaultStatus, schuelerInGruppe, faelligkeitsdatum);
        }
    }, [allSchueler, toolsState.checklisten, lerngruppen]);

    const value: ToolsContextState = {
        ai,
        ...toolsState,
        onMarkSchuelerAsPicked: toolsStore.actions.markSchuelerAsPicked,
        onResetPickedList: toolsStore.actions.resetPickedList,
        onAddCheckliste: toolsStore.actions.addCheckliste,
        onUpdateCheckliste: toolsStore.actions.updateCheckliste,
        onDeleteCheckliste: toolsStore.actions.deleteCheckliste,
        onAddChecklistenEintrag,
        onUpdateChecklistenEintrag: toolsStore.actions.updateChecklistenEintrag,
        onDeleteChecklistenEintrag: toolsStore.actions.deleteChecklistenEintrag,
        onToggleChecklistenStatus: toolsStore.actions.toggleChecklistenStatus,
        onUpdateSitzplan: toolsStore.actions.updateSitzplan,
        onUpdateGruppenEinteilung: toolsStore.actions.updateGruppenEinteilung,
        onResetGruppenEinteilung: toolsStore.actions.resetGruppenEinteilung,
        onAddNotizKategorie: toolsStore.actions.addNotizKategorie,
        onUpdateNotizKategorie: toolsStore.actions.updateNotizKategorie,
        onDeleteNotizKategorie: toolsStore.actions.deleteNotizKategorie,
        onAddNotiz: toolsStore.actions.addNotiz,
        onUpdateNotiz: toolsStore.actions.updateNotiz,
        onDeleteNotiz: toolsStore.actions.deleteNotiz,
    };

    return <ToolsContext.Provider value={value}>{children}</ToolsContext.Provider>;
};