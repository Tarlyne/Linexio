import React from 'react';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';

import GruppeneinteilungView from '../components/views/GruppeneinteilungView';
import SitzplanView from '../components/views/SitzplanView';
import SchuelerAuswertungView from '../components/views/SchuelerAuswertungView';

import { LerngruppenContext } from '../context/LerngruppenContext';
import { ToolsContext } from '../context/ToolsContext';
import { UIContext } from '../context/UIContext';
import { NotenContext } from '../context/NotenContext';

import { Schueler, Lerngruppe, Sitzplan, Leistungsnachweis, PREDEFINED_NOTENSYSTEME, DEFAULT_NOTENSCHLUESSEL_MAP } from '../context/types';
import { GoogleGenAI } from '@google/genai';

// --- Mocking ---

// Mock the GenAI module to intercept API calls
const generateContentMock = vi.fn();
vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn(() => ({
    models: {
      generateContent: generateContentMock,
    },
  })),
}));

// --- Mock Data ---
const mockSchueler: Schueler[] = [
    { id: 's0', firstName: 'Anton', lastName: 'Ameise', gender: 'm', paedagogischeMerkmale: ['ruhig'] },
    { id: 's1', firstName: 'Berta', lastName: 'Biber', gender: 'w' },
    { id: 's2', firstName: 'Carla', lastName: 'Chamäleon', gender: 'w' },
];

const mockLerngruppe: Lerngruppe = {
    id: 'lg1', name: 'Testklasse', fach: 'Sicherheit', schuljahr: '23/24', schuelerIds: ['s0', 's1', 's2'],
    notensystemId: 'punkte_15_0', order: 0, gewichtungHj1: 1, gewichtungHj2: 1
};

const mockSitzplan: Sitzplan = {
    id: 'sp1', lerngruppeId: 'lg1', rows: 5, cols: 5,
    layout: Array(5).fill(Array(5).fill('seat')),
    schuelerPlacements: {},
};

const mockKlausur: Leistungsnachweis = {
    id: 'ln-klausur', notenkategorieId: 'nk1', name: 'Test Klausur', typ: 'klausur',
    datum: '2024-01-01', gewichtung: 1, order: 0,
    aufgaben: [{ id: 'aufg1', name: 'Aufgabe 1', maxPunkte: 10, order: 0 }],
};

const mockSetHeaderConfig = vi.fn();
const mockAiInstance = new GoogleGenAI({ apiKey: 'mock-key' });

// A helper to render the component with all necessary contexts
const renderWithProviders = (
    component: React.ReactElement,
    { uiContext = {}, lerngruppenContext = {}, toolsContext = {}, notenContext = {} } = {}
) => {
    const finalUiContext = {
        setHeaderConfig: mockSetHeaderConfig,
        onBackToLerngruppeDetail: vi.fn(),
        onBackToNotenuebersicht: vi.fn(),
        handleNavigate: vi.fn(),
        currentSchoolYear: '23/24',
        systemSchoolYear: '23/24',
        onSetCurrentSchoolYear: vi.fn(),
        selectedLerngruppeId: mockLerngruppe.id,
        ...uiContext,
    };
    const finalLerngruppenContext = {
        selectedLerngruppe: mockLerngruppe,
        schuelerInSelectedLerngruppe: mockSchueler,
        allSchueler: mockSchueler,
        ...lerngruppenContext,
    };
    const finalToolsContext = {
        ai: mockAiInstance,
        sitzplaene: [mockSitzplan],
        ...toolsContext,
    };
    const finalNotenContext = {
        leistungsnachweise: [mockKlausur],
        notensystemForLerngruppe: PREDEFINED_NOTENSYSTEME[0],
        klausuraufgabePunkte: [],
        notenschluesselMap: DEFAULT_NOTENSCHLUESSEL_MAP,
        schuelerLeistungsnachweisFeedback: [],
        onUpdateSchuelerLeistungsnachweisFeedback: vi.fn(),
        ...notenContext,
    };

    return render(
        <UIContext.Provider value={finalUiContext as any}>
            <LerngruppenContext.Provider value={finalLerngruppenContext as any}>
                <ToolsContext.Provider value={finalToolsContext as any}>
                    <NotenContext.Provider value={finalNotenContext as any}>
                        {component}
                    </NotenContext.Provider>
                </ToolsContext.Provider>
            </LerngruppenContext.Provider>
        </UIContext.Provider>
    );
};


// --- Test Suite ---

describe('AI Anonymization Security Tests ("Wachhund")', () => {

    beforeEach(() => {
        // Reset mocks before each test
        vi.clearAllMocks();
        generateContentMock.mockResolvedValue({
            text: JSON.stringify({ groups: [['s_0', 's_1'], ['s_2']], placements: [] })
        });
    });

    afterEach(() => {
        cleanup();
    });

    it('Testfall 1 (Gruppeneinteilung): sollte KEINE Echtnamen an die API senden', async () => {
        renderWithProviders(<GruppeneinteilungView />);
        
        fireEvent.click(screen.getByRole('button', { name: /Intelligent/i }));
        fireEvent.click(screen.getByRole('button', { name: /Intelligente Einteilung/i }));

        const textarea = await screen.findByPlaceholderText(/leistungsstarke mit schwächeren/i);
        await act(async () => {
            fireEvent.change(textarea, { target: { value: 'Anton Ameise und Berta Biber zusammen in eine Gruppe.' } });
        });

        const generateButton = screen.getByRole('button', { name: /Gruppen generieren/i });
        await act(async () => { fireEvent.click(generateButton); });
        
        expect(generateContentMock).toHaveBeenCalledOnce();
        
        const promptSentToApi = generateContentMock.mock.calls[0][0].contents;
        
        // --- THE CRITICAL SECURITY CHECK ---
        expect(promptSentToApi).not.toContain('Anton');
        expect(promptSentToApi).not.toContain('Ameise');
        expect(promptSentToApi).not.toContain('Berta');
        
        // Verify anonymization
        expect(promptSentToApi).toContain('s_0 und s_1 zusammen in eine Gruppe.');
        expect(promptSentToApi).toContain('"id":"s_0"');
        expect(promptSentToApi).not.toContain('firstName');
    });

    it('Testfall 2 (Sitzplan): sollte KEINE Echtnamen an die API senden', async () => {
        renderWithProviders(<SitzplanView />);

        fireEvent.click(screen.getByRole('button', { name: /Sitzplan-Steuerung öffnen/i }));
        fireEvent.click(await screen.findByRole('menuitem', { name: /Intelligente Zuweisung/i }));

        const textarea = await screen.findByPlaceholderText(/Setze Leo und Frida/i);
        await act(async () => {
            fireEvent.change(textarea, { target: { value: 'Setze Berta Biber nach vorne.' } });
        });
        
        const generateButton = screen.getByRole('button', { name: /Sitzplan generieren/i });
        await act(async () => { fireEvent.click(generateButton); });

        expect(generateContentMock).toHaveBeenCalledOnce();
        const promptSentToApi = generateContentMock.mock.calls[0][0].contents;
        
        // --- THE CRITICAL SECURITY CHECK ---
        expect(promptSentToApi).not.toContain('Berta');
        expect(promptSentToApi).not.toContain('Biber');

        // Verify anonymization
        expect(promptSentToApi).toContain('Setze s_1 nach vorne');
        expect(promptSentToApi).toContain('"id":"s_1"');
        expect(promptSentToApi).not.toContain('firstName');
    });

    it('Testfall 3 (Schülerauswertung): sollte KEINE Echtnamen an die API senden', async () => {
        renderWithProviders(<SchuelerAuswertungView />, {
            uiContext: { selectedSchuelerId: 's0', selectedLeistungsnachweisId: 'ln-klausur' },
        });

        fireEvent.click(screen.getByRole('button', { name: /KI-Vorschlag für Feedback/i }));
        
        const textarea = await screen.findByPlaceholderText(/Gib ein konstruktives Feedback/i);
        await act(async () => {
            fireEvent.change(textarea, { target: { value: 'Fasse dich kurz.' } });
        });
        
        const generateButton = screen.getByRole('button', { name: /Feedback generieren/i });
        await act(async () => { fireEvent.click(generateButton); });

        expect(generateContentMock).toHaveBeenCalledOnce();
        const promptSentToApi = generateContentMock.mock.calls[0][0].contents;
        
        // --- THE CRITICAL SECURITY CHECK ---
        // Verify that the prompt sent to the AI does not contain any real names.
        expect(promptSentToApi).not.toContain('Anton');
        expect(promptSentToApi).not.toContain('Ameise');
        
        // Verify that the student data object within the prompt is anonymized.
        // It should contain 'merkmale', but not 'firstName' or 'lastName'.
        expect(promptSentToApi).toContain('"merkmale":["ruhig"]');
        expect(promptSentToApi).not.toContain('firstName');
        expect(promptSentToApi).not.toContain('lastName');

        // It should use the placeholder [SCHUELER]
        expect(promptSentToApi).toContain('Generiere nun das Feedback für [SCHUELER]');
    });
});