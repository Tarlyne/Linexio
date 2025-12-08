import React, { createContext, useMemo, useCallback, ReactNode, useContext, useSyncExternalStore } from 'react';
import { useUIContext } from './UIContext';
import { Schueler, Lerngruppe } from './types';
import { lerngruppenStore } from '../store/lerngruppenStore';

interface LerngruppenContextState {
    lerngruppen: Lerngruppe[];
    allSchueler: Schueler[];
    schoolYears: string[];
    selectedLerngruppe: Lerngruppe | null;
    selectedSchueler: Schueler | null;
    schuelerInSelectedLerngruppe: Schueler[];
    handleAddLerngruppe: (gruppe: { name: string; fach: string; notensystemId: string; }) => Promise<void>;
    handleUpdateLerngruppe: (lerngruppe: Lerngruppe) => Promise<Lerngruppe>;
    handleDeleteLerngruppe: (id: string) => Promise<void>;
    handleDeleteSchoolYear: (schuljahr: string) => Promise<void>;
    handleRemoveImagesFromYear: (schuljahr: string) => Promise<void>;
    handleCopyLerngruppe: (lerngruppeToCopy: Lerngruppe, newName: string, newFach: string) => Promise<void>;
    onReorderLerngruppe: (id: string, direction: 'up' | 'down') => Promise<void>;
    handleAddSchueler: (schuelerData: Omit<Schueler, 'id'>, lerngruppeId: string) => Promise<void>;
    handleAddSchuelerBulk: (schuelerListe: Omit<Schueler, 'id'>[], lerngruppeId: string) => Promise<void>;
    addSchuelerToLerngruppe: (lerngruppeId: string, schuelerIds: string[]) => Promise<void>;
    onUpdateSchueler: (schueler: Schueler) => Promise<void>;
    handleRemoveSchuelerFromLerngruppe: (schuelerId: string, lerngruppeId: string) => Promise<void>;
    isSchuelerInOtherLerngruppen: (schuelerId: string, currentLerngruppeId: string) => boolean;
}

// FIX: Export LerngruppenContext to allow its use in test files for providing mock values.
export const LerngruppenContext = createContext<LerngruppenContextState | undefined>(undefined);

export const useLerngruppenContext = () => {
    const context = useContext(LerngruppenContext);
    if (context === undefined) {
        throw new Error('useLerngruppenContext must be used within a LerngruppenContextProvider');
    }
    return context;
};

export const LerngruppenContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { currentSchoolYear, selectedLerngruppeId, selectedSchuelerId, handleNavigate, systemSchoolYear } = useUIContext();

    const { lerngruppen, allSchueler } = useSyncExternalStore(lerngruppenStore.subscribe, lerngruppenStore.getState);

    const schoolYears = useMemo(() => {
        const years = new Set(lerngruppen.map((lg: Lerngruppe) => lg.schuljahr));
        years.add(systemSchoolYear);
        return Array.from(years).sort().reverse();
    }, [lerngruppen, systemSchoolYear]);

    const selectedLerngruppe = useMemo(() => lerngruppen.find((lg: Lerngruppe) => lg.id === selectedLerngruppeId) ?? null, [lerngruppen, selectedLerngruppeId]);
    const selectedSchueler = useMemo(() => allSchueler.find((s: Schueler) => s.id === selectedSchuelerId) ?? null, [allSchueler, selectedSchuelerId]);
    
    const schuelerInSelectedLerngruppe = useMemo(() => {
        if (!selectedLerngruppe) return [];
        const schuelerIdSet = new Set(selectedLerngruppe.schuelerIds);
        return allSchueler.filter((s: Schueler) => schuelerIdSet.has(s.id));
    }, [allSchueler, selectedLerngruppe]);
    
    const isSchuelerInOtherLerngruppen = useCallback((schuelerId: string, currentLerngruppeId: string): boolean => {
        return lerngruppen.some(lg => lg.id !== currentLerngruppeId && lg.schuelerIds.includes(schuelerId));
    }, [lerngruppen]);

    const handleAddLerngruppe = useCallback(async (gruppe: { name: string; fach: string; notensystemId: string; }) => {
        await lerngruppenStore.actions.addLerngruppe(gruppe, currentSchoolYear);
    }, [currentSchoolYear]);

    const handleDeleteLerngruppe = useCallback(async (id: string) => {
        await lerngruppenStore.actions.deleteLerngruppe(id);
        handleNavigate('lerngruppen', undefined, undefined);
    }, [handleNavigate]);
    
    const handleDeleteSchoolYear = useCallback(async (schuljahr: string) => {
        await lerngruppenStore.actions.deleteSchoolYear(schuljahr);
    }, []);

    const handleRemoveImagesFromYear = useCallback(async (schuljahr: string) => {
        await lerngruppenStore.actions.removeImagesFromYear(schuljahr);
    }, []);
    
    const handleCopyLerngruppe = useCallback(async (lerngruppeToCopy: Lerngruppe, newName: string, newFach: string) => {
        const newLerngruppeId = await lerngruppenStore.actions.copyLerngruppe(lerngruppeToCopy, newName, newFach, systemSchoolYear);
        handleNavigate('lerngruppeDetail', newLerngruppeId);
    }, [systemSchoolYear, handleNavigate]);
    
    const handleAddSchueler = useCallback(async (schuelerData: Omit<Schueler, 'id'>, lerngruppeId: string) => {
        await lerngruppenStore.actions.addSchueler(schuelerData, lerngruppeId);
    }, []);

    const handleAddSchuelerBulk = useCallback(async (schuelerListe: Omit<Schueler, 'id'>[], lerngruppeId: string) => {
        await lerngruppenStore.actions.addSchuelerBulk(schuelerListe, lerngruppeId);
    }, []);

    const value = {
        lerngruppen,
        allSchueler,
        schoolYears,
        selectedLerngruppe,
        selectedSchueler,
        schuelerInSelectedLerngruppe,
        handleAddLerngruppe,
        handleUpdateLerngruppe: lerngruppenStore.actions.updateLerngruppe,
        handleDeleteLerngruppe,
        handleDeleteSchoolYear,
        handleRemoveImagesFromYear,
        handleCopyLerngruppe,
        onReorderLerngruppe: lerngruppenStore.actions.reorderLerngruppe,
        handleAddSchueler,
        handleAddSchuelerBulk,
        addSchuelerToLerngruppe: lerngruppenStore.actions.addSchuelerToLerngruppe,
        onUpdateSchueler: lerngruppenStore.actions.updateSchueler,
        handleRemoveSchuelerFromLerngruppe: lerngruppenStore.actions.removeSchuelerFromLerngruppe,
        isSchuelerInOtherLerngruppen,
    };

    return <LerngruppenContext.Provider value={value}>{children}</LerngruppenContext.Provider>;
};