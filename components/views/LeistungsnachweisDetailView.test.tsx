import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';

import LeistungsnachweisDetailView from './LeistungsnachweisDetailView';
import { LerngruppenContext } from '../../context/LerngruppenContext';
import { NotenContext } from '../../context/NotenContext';
import { UIContext } from '../../context/UIContext';
import { ModalContext } from '../../context/ModalContext';
import { Schueler, Lerngruppe, Leistungsnachweis, EinzelLeistung, Klausuraufgabe, PREDEFINED_NOTENSYSTEME, NoteMapEntry } from '../../context/types';

// Mocks
const mockSchueler: Schueler[] = [
    { id: 's1', firstName: 'Max', lastName: 'Mustermann', gender: 'm' },
];
const mockLerngruppe: Lerngruppe = {
    id: 'lg1', name: 'Testklasse', fach: 'Test', schuljahr: '23/24', schuelerIds: ['s1'],
    notensystemId: 'noten_1_6_mit_tendenz', order: 0, gewichtungHj1: 1, gewichtungHj2: 1
};
const notensystem = PREDEFINED_NOTENSYSTEME.find(ns => ns.id === 'noten_1_6_mit_tendenz')!;

// Mock Sammelnote
const mockSammelnote: Leistungsnachweis = {
    id: 'ln1', notenkategorieId: 'nk1', name: 'Mitarbeit', datum: '2024-01-01',
    typ: 'sammelnote', gewichtung: 1, order: 0
};
const mockEinzelLeistung: EinzelLeistung = {
    id: 'el1', leistungsnachweisId: 'ln1', name: 'Note 1', gewichtung: 1, order: 0
};

// Mock Klausur
const mockKlausurAufgabe: Klausuraufgabe = { id: 'ka1', name: 'Aufg. 1', maxPunkte: 10, order: 0 };
const mockKlausur: Leistungsnachweis = {
    id: 'ln2', notenkategorieId: 'nk2', name: '1. Klausur', datum: '2024-02-01',
    typ: 'klausur', gewichtung: 2, order: 1, aufgaben: [mockKlausurAufgabe]
};

// Mock context providers' functions
const mockSetHeaderConfig = vi.fn();
const mockOpenNumpadModal = vi.fn();
const mockOpenPunkteNumpadModal = vi.fn();
const mockOpenAddEinzelLeistungModal = vi.fn();
const mockOpenAddKlausuraufgabeModal = vi.fn();

const renderWithProviders = (leistungsnachweis: Leistungsnachweis) => {
    // A simplified map for testing rendering, real calculation is not needed here
    const mockSchuelerGesamtNotenMap = new Map<string, NoteMapEntry>();
    mockSchuelerGesamtNotenMap.set('s1', { finalGrade: '2+', displayDecimal: '12,00', averagePoints: 12 });
    
    const mockSchuelerKlausurNotenMap = new Map<string, any>();
    mockSchuelerKlausurNotenMap.set('s1', { finalGrade: '1', totalPunkte: 28, prozent: 95, averagePoints: 14 });

    return render(
        <UIContext.Provider value={{
            setHeaderConfig: mockSetHeaderConfig,
            selectedLeistungsnachweisId: leistungsnachweis.id,
            onBackToNotenuebersicht: vi.fn(),
            handleNavigate: vi.fn(),
            focusedSchuelerId: null,
            onToggleFocusSchueler: vi.fn(),
        } as any}>
            <LerngruppenContext.Provider value={{
                selectedLerngruppe: mockLerngruppe,
                schuelerInSelectedLerngruppe: mockSchueler,
            } as any}>
                <NotenContext.Provider value={{
                    leistungsnachweise: [leistungsnachweis],
                    notensystemForLerngruppe: notensystem,
                    einzelLeistungen: leistungsnachweis.typ === 'sammelnote' ? [mockEinzelLeistung] : [],
                    einzelLeistungsNoten: [],
                    klausuraufgabePunkte: [],
                    notenschluesselMap: {},
                    schuelerGesamtNotenMap: mockSchuelerGesamtNotenMap,
                    schuelerKlausurNotenMap: mockSchuelerKlausurNotenMap,
                    handleDeleteEinzelLeistung: vi.fn(),
                    handleDeleteKlausuraufgabe: vi.fn(),
                } as any}>
                    <ModalContext.Provider value={{
                        openAddEinzelLeistungModal: mockOpenAddEinzelLeistungModal,
                        openNumpadModal: mockOpenNumpadModal,
                        openAddKlausuraufgabeModal: mockOpenAddKlausuraufgabeModal,
                        openPunkteNumpadModal: mockOpenPunkteNumpadModal,
                    } as any}>
                        <LeistungsnachweisDetailView />
                    </ModalContext.Provider>
                </NotenContext.Provider>
            </LerngruppenContext.Provider>
        </UIContext.Provider>
    );
};

describe('LeistungsnachweisDetailView', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Sammelnote', () => {
        it('Testfall: Sammelnote - Korrektes Rendern', () => {
            renderWithProviders(mockSammelnote);
            // Header
            expect(mockSetHeaderConfig).toHaveBeenCalledWith(expect.objectContaining({ title: 'Mitarbeit' }));
            // Student
            expect(screen.getByText('Mustermann,')).toBeInTheDocument();
            // EinzelLeistung column
            expect(screen.getByText('Note 1')).toBeInTheDocument();
            // Gesamt column
            expect(screen.getByText('Gesamt Ø')).toBeInTheDocument();
            // Add column button
            const addButton = screen.getByRole('button', { name: "Neue Notenspalte hinzufügen" });
            expect(addButton).toBeInTheDocument();
            fireEvent.click(addButton);
            expect(mockOpenAddEinzelLeistungModal).toHaveBeenCalledWith(mockSammelnote.id);
        });

        it('Testfall: Sammelnote - Noteneingabe auslösen', () => {
            renderWithProviders(mockSammelnote);
            // The note cell is a button with no text initially
            const noteCell = screen.getAllByRole('button').find(btn => btn.className.includes('relative h-8 w-12'));
            expect(noteCell).toBeInTheDocument();
            
            fireEvent.click(noteCell!);
            
            expect(mockOpenNumpadModal).toHaveBeenCalledOnce();
            expect(mockOpenNumpadModal).toHaveBeenCalledWith(expect.objectContaining({
                schueler: mockSchueler[0],
                einzelLeistungId: mockEinzelLeistung.id,
            }));
        });
    });

    describe('Klausur', () => {
        it('Testfall: Klausur - Korrektes Rendern', () => {
            renderWithProviders(mockKlausur);
            // Header
            expect(mockSetHeaderConfig).toHaveBeenCalledWith(expect.objectContaining({ title: '1. Klausur' }));
            // Student
            expect(screen.getByText('Mustermann,')).toBeInTheDocument();
            // Aufgabe column
            expect(screen.getByText('Aufg. 1')).toBeInTheDocument();
            // Note and Punkte columns
            expect(screen.getByText('Note')).toBeInTheDocument();
            expect(screen.getByText('Punkte')).toBeInTheDocument();
             // Add column button
            const addButton = screen.getByRole('button', { name: "Neue Aufgabe hinzufügen" });
            expect(addButton).toBeInTheDocument();
            fireEvent.click(addButton);
            expect(mockOpenAddKlausuraufgabeModal).toHaveBeenCalledWith(mockKlausur.id);
        });

        it('Testfall: Klausur - Punkteeingabe auslösen', () => {
            renderWithProviders(mockKlausur);
            // The punkte cell is a button with no text initially
            const punkteCell = screen.getAllByRole('button').find(btn => btn.className.includes('h-8 w-12'));
             expect(punkteCell).toBeInTheDocument();

            fireEvent.click(punkteCell!);

            expect(mockOpenPunkteNumpadModal).toHaveBeenCalledOnce();
            expect(mockOpenPunkteNumpadModal).toHaveBeenCalledWith(expect.objectContaining({
                schueler: mockSchueler[0],
                aufgabeId: mockKlausurAufgabe.id,
            }));
        });
    });
});
