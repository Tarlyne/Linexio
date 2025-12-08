import React, { createContext, useState, useCallback, ReactNode, useContext } from 'react';
import { Schueler, Leistungsnachweis, EinzelLeistung, Klausuraufgabe, NotenKategorieTyp, EditModalItem, ManuelleNoteZiel, AddLeistungsnachweisModalContext, EditModalContext, ManuelleNoteModalContext } from './types';

export interface AddEinzelLeistungModalContext { leistungsnachweisId: string; }
export interface AddKlausuraufgabeModalContext { leistungsnachweisId: string; }
export interface NumpadContext { schueler: Schueler; einzelLeistungId: string; currentNote: string; currentBemerkung?: string; sortedSchuelerIds: string[]; }
export interface PunkteNumpadContext { 
    schueler: Schueler; 
    aufgabeId: string;
    aufgabeName: string; 
    maxPunkte: number; 
    currentPunkte: number | null; 
    sortedSchuelerIds: string[]; 
    leistungsnachweisId: string;
    sortedAufgabenIds: string[];
}


interface ModalContextState {
    addEinzelLeistungContext: AddEinzelLeistungModalContext | null;
    isAddEinzelLeistungModalOpen: boolean;
    openAddEinzelLeistungModal: (leistungsnachweisId: string) => void;
    closeAddEinzelLeistungModal: () => void;
    einzelLeistungToEdit: EinzelLeistung | null;
    isEditEinzelLeistungModalOpen: boolean;
    openEditEinzelLeistungModal: (leistung: EinzelLeistung) => void;
    closeEditEinzelLeistungModal: () => void;
    einzelLeistungToDelete: EinzelLeistung | null;
    isConfirmDeleteEinzelLeistungModalOpen: boolean;
    openConfirmDeleteEinzelLeistungModal: (el: EinzelLeistung) => void;
    closeConfirmDeleteEinzelLeistungModal: () => void;
    numpadContext: NumpadContext | null;
    isLastStudentForNumpad: boolean;
    openNumpadModal: (context: NumpadContext) => void;
    closeNumpadModal: () => void;
    addKlausuraufgabeContext: AddKlausuraufgabeModalContext | null;
    isAddKlausuraufgabeModalOpen: boolean;
    openAddKlausuraufgabeModal: (leistungsnachweisId: string) => void;
    closeAddKlausuraufgabeModal: () => void;
    klausuraufgabeToEdit: Klausuraufgabe | null;
    isEditKlausuraufgabeModalOpen: boolean;
    openEditKlausuraufgabeModal: (aufgabe: Klausuraufgabe) => void;
    closeEditKlausuraufgabeModal: () => void;
    klausuraufgabeToDelete: Klausuraufgabe | null;
    isConfirmDeleteKlausuraufgabeModalOpen: boolean;
    openConfirmDeleteKlausuraufgabeModal: (aufgabe: Klausuraufgabe) => void;
    closeConfirmDeleteKlausuraufgabeModal: () => void;
    punkteNumpadContext: PunkteNumpadContext | null;
    isLastInSequenceForPunkteNumpad: boolean;
    openPunkteNumpadModal: (context: PunkteNumpadContext) => void;
    closePunkteNumpadModal: () => void;
}

export const ModalContext = createContext<ModalContextState | undefined>(undefined);

export const useModalContext = () => {
    const context = useContext(ModalContext);
    if (context === undefined) {
        throw new Error('useModalContext must be used within a ModalContextProvider');
    }
    return context;
};

export const ModalContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [addEinzelLeistungContext, setAddEinzelLeistungContext] = useState<AddEinzelLeistungModalContext | null>(null);
    const [einzelLeistungToEdit, setEinzelLeistungToEdit] = useState<EinzelLeistung | null>(null);
    const [einzelLeistungToDelete, setEinzelLeistungToDelete] = useState<EinzelLeistung | null>(null);
    const [numpadContext, setNumpadContext] = useState<NumpadContext | null>(null);
    const [addKlausuraufgabeContext, setAddKlausuraufgabeContext] = useState<AddKlausuraufgabeModalContext | null>(null);
    const [klausuraufgabeToEdit, setKlausuraufgabeToEdit] = useState<Klausuraufgabe | null>(null);
    const [klausuraufgabeToDelete, setKlausuraufgabeToDelete] = useState<Klausuraufgabe | null>(null);
    const [punkteNumpadContext, setPunkteNumpadContext] = useState<PunkteNumpadContext | null>(null);

    const openAddEinzelLeistungModal = useCallback((leistungsnachweisId: string) => setAddEinzelLeistungContext({ leistungsnachweisId }), []);
    const closeAddEinzelLeistungModal = useCallback(() => setAddEinzelLeistungContext(null), []);
    const openEditEinzelLeistungModal = useCallback((leistung: EinzelLeistung) => setEinzelLeistungToEdit(leistung), []);
    const closeEditEinzelLeistungModal = useCallback(() => setEinzelLeistungToEdit(null), []);
    const openConfirmDeleteEinzelLeistungModal = useCallback((el: EinzelLeistung) => setEinzelLeistungToDelete(el), []);
    const closeConfirmDeleteEinzelLeistungModal = useCallback(() => setEinzelLeistungToDelete(null), []);
    
    const openNumpadModal = useCallback((context: NumpadContext) => setNumpadContext(context), []);
    const closeNumpadModal = useCallback(() => setNumpadContext(null), []);
    
    const openAddKlausuraufgabeModal = useCallback((leistungsnachweisId: string) => setAddKlausuraufgabeContext({ leistungsnachweisId }), []);
    const closeAddKlausuraufgabeModal = useCallback(() => setAddKlausuraufgabeContext(null), []);
    const openEditKlausuraufgabeModal = useCallback((aufgabe: Klausuraufgabe) => setKlausuraufgabeToEdit(aufgabe), []);
    const closeEditKlausuraufgabeModal = useCallback(() => setKlausuraufgabeToEdit(null), []);
    const openConfirmDeleteKlausuraufgabeModal = useCallback((aufgabe: Klausuraufgabe) => setKlausuraufgabeToDelete(aufgabe), []);
    const closeConfirmDeleteKlausuraufgabeModal = useCallback(() => setKlausuraufgabeToDelete(null), []);

    const openPunkteNumpadModal = useCallback((context: PunkteNumpadContext) => setPunkteNumpadContext(context), []);
    const closePunkteNumpadModal = useCallback(() => setPunkteNumpadContext(null), []);
    
    const isLastStudentForNumpad = numpadContext ? numpadContext.sortedSchuelerIds.indexOf(numpadContext.schueler.id) === numpadContext.sortedSchuelerIds.length - 1 : false;
    const isLastInSequenceForPunkteNumpad = punkteNumpadContext ? punkteNumpadContext.sortedAufgabenIds.indexOf(punkteNumpadContext.aufgabeId) === punkteNumpadContext.sortedAufgabenIds.length - 1 : false;

    const value: ModalContextState = {
        addEinzelLeistungContext, isAddEinzelLeistungModalOpen: !!addEinzelLeistungContext,
        openAddEinzelLeistungModal, closeAddEinzelLeistungModal,
        einzelLeistungToEdit, isEditEinzelLeistungModalOpen: !!einzelLeistungToEdit,
        openEditEinzelLeistungModal, closeEditEinzelLeistungModal,
        einzelLeistungToDelete, isConfirmDeleteEinzelLeistungModalOpen: !!einzelLeistungToDelete,
        openConfirmDeleteEinzelLeistungModal, closeConfirmDeleteEinzelLeistungModal,
        numpadContext, isLastStudentForNumpad, openNumpadModal, closeNumpadModal,
        addKlausuraufgabeContext, isAddKlausuraufgabeModalOpen: !!addKlausuraufgabeContext,
        openAddKlausuraufgabeModal, closeAddKlausuraufgabeModal,
        klausuraufgabeToEdit, isEditKlausuraufgabeModalOpen: !!klausuraufgabeToEdit,
        openEditKlausuraufgabeModal, closeEditKlausuraufgabeModal,
        klausuraufgabeToDelete, isConfirmDeleteKlausuraufgabeModalOpen: !!klausuraufgabeToDelete,
        openConfirmDeleteKlausuraufgabeModal, closeConfirmDeleteKlausuraufgabeModal,
        punkteNumpadContext, isLastInSequenceForPunkteNumpad,
        openPunkteNumpadModal, closePunkteNumpadModal,
    };

    return <ModalContext.Provider value={value}>{children}</ModalContext.Provider>;
};
