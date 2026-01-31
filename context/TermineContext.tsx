import React, { createContext, useCallback, ReactNode, useContext, useSyncExternalStore, useMemo } from 'react';
import { Termin, Schueler, TerminKategorie } from './types';
import { termineStore } from '../store/termineStore';
import { useLerngruppenContext } from './LerngruppenContext';
import { useUIContext } from './UIContext';
import { getFeiertage } from '../utils/feiertage';

interface TermineContextState {
    termine: Termin[];
    onAddTermin: (terminData: Omit<Termin, 'id'>) => Promise<void>;
    onUpdateTermin: (id: string, updates: Partial<Termin>) => Promise<void>;
    onDeleteTermin: (id: string) => Promise<void>;
    getUpcomingTermine: (days?: number) => Termin[];
    checkNtaForTermin: (lerngruppeId: string) => Schueler[];
}

export const TermineContext = createContext<TermineContextState | undefined>(undefined);

export const useTermineContext = () => {
    const context = useContext(TermineContext);
    if (context === undefined) {
        throw new Error('useTermineContext must be used within a TermineContextProvider');
    }
    return context;
};

export const TermineContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { termine } = useSyncExternalStore(termineStore.subscribe, termineStore.getState);
    const { allSchueler, lerngruppen } = useLerngruppenContext();
    const { currentDate, currentSchoolYear, bundesland } = useUIContext();

    const currentTermine = useMemo(() => 
        termine.filter(t => t.schuljahr === currentSchoolYear).sort((a, b) => {
             const dateA = new Date(`${a.date}T${a.startTime}`);
             const dateB = new Date(`${b.date}T${b.startTime}`);
             return dateA.getTime() - dateB.getTime();
        }),
    [termine, currentSchoolYear]);

    const onAddTermin = useCallback(async (terminData: Omit<Termin, 'id'>) => {
        await termineStore.actions.addTermin(terminData);
    }, []);

    const onUpdateTermin = useCallback(async (id: string, updates: Partial<Termin>) => {
        await termineStore.actions.updateTermin(id, updates);
    }, []);

    const onDeleteTermin = useCallback(async (id: string) => {
        await termineStore.actions.deleteTermin(id);
    }, []);

    const getUpcomingTermine = useCallback((days = 14) => {
        const today = new Date(currentDate);
        today.setHours(0, 0, 0, 0);
        const futureDate = new Date(today);
        futureDate.setDate(today.getDate() + days);

        // 1. Get DB Termine
        const dbTermine = currentTermine.filter(t => {
            const tDate = new Date(t.date);
            tDate.setHours(0, 0, 0, 0);
            return tDate >= today && tDate <= futureDate;
        });

        // 2. Calculate Feiertage for the relevant years
        const startYear = today.getFullYear();
        const endYear = futureDate.getFullYear();
        let feiertage: Termin[] = getFeiertage(startYear, bundesland);
        if (endYear > startYear) {
            feiertage = [...feiertage, ...getFeiertage(endYear, bundesland)];
        }

        // 3. Filter Feiertage by date range
        const relevantFeiertage = feiertage.filter(t => {
            const tDate = new Date(t.date);
            tDate.setHours(0, 0, 0, 0);
            return tDate >= today && tDate <= futureDate;
        });

        // 4. Merge and Sort
        return [...dbTermine, ...relevantFeiertage].sort((a, b) => {
             const dateA = new Date(a.date);
             const dateB = new Date(b.date);
             if (dateA.getTime() !== dateB.getTime()) return dateA.getTime() - dateB.getTime();
             return a.startTime.localeCompare(b.startTime);
        });
    }, [currentTermine, currentDate, bundesland]);

    const checkNtaForTermin = useCallback((lerngruppeId: string): Schueler[] => {
        const lerngruppe = lerngruppen.find(lg => lg.id === lerngruppeId);
        if (!lerngruppe) return [];
        
        const schuelerInGroup = allSchueler.filter(s => lerngruppe.schuelerIds.includes(s.id));
        return schuelerInGroup.filter(s => s.hasNachteilsausgleich);
    }, [lerngruppen, allSchueler]);

    const value: TermineContextState = {
        termine: currentTermine,
        onAddTermin,
        onUpdateTermin,
        onDeleteTermin,
        getUpcomingTermine,
        checkNtaForTermin,
    };

    return <TermineContext.Provider value={value}>{children}</TermineContext.Provider>;
};