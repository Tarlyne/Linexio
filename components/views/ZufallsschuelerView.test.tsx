import React from 'react';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';

import ZufallsschuelerView from './ZufallsschuelerView';
import { LerngruppenContext } from '../../context/LerngruppenContext';
import { ToolsContext } from '../../context/ToolsContext';
import { UIContext } from '../../context/UIContext';
import { Schueler, Lerngruppe } from '../../context/types';

// Mock data
const mockSchueler: Schueler[] = [
    { id: 's1', firstName: 'Anton', lastName: 'Ameise', gender: 'm' },
    { id: 's2', firstName: 'Berta', lastName: 'Biber', gender: 'w' },
    { id: 's3', firstName: 'Carla', lastName: 'Chamäleon', gender: 'w' },
];

const mockLerngruppe: Lerngruppe = {
    id: 'lg1',
    name: 'Testklasse',
    fach: 'Testfach',
    schuljahr: '23/24',
    schuelerIds: ['s1', 's2', 's3'],
    notensystemId: 'punkte_15_0',
    order: 0,
    gewichtungHj1: 1,
    gewichtungHj2: 1,
};

// Mock context providers
let mockPickedSchuelerIds: { [key: string]: string[] } = {};
const mockOnMarkSchuelerAsPicked = vi.fn((lerngruppeId: string, schuelerId: string) => {
    mockPickedSchuelerIds[lerngruppeId] = [...(mockPickedSchuelerIds[lerngruppeId] || []), schuelerId];
});
const mockOnResetPickedList = vi.fn((lerngruppeId: string) => {
    delete mockPickedSchuelerIds[lerngruppeId];
});
const mockSetHeaderConfig = vi.fn();

const renderWithProviders = () => {
    return render(
        <UIContext.Provider value={{
            setHeaderConfig: mockSetHeaderConfig,
            onBackToLerngruppeDetail: vi.fn(),
            currentSchoolYear: '23/24',
            systemSchoolYear: '23/24',
            onSetCurrentSchoolYear: vi.fn(),
        } as any}>
            <LerngruppenContext.Provider value={{
                selectedLerngruppe: mockLerngruppe,
                schuelerInSelectedLerngruppe: mockSchueler,
            } as any}>
                <ToolsContext.Provider value={{
                    pickedSchuelerIds: mockPickedSchuelerIds,
                    onMarkSchuelerAsPicked: mockOnMarkSchuelerAsPicked,
                    onResetPickedList: mockOnResetPickedList,
                } as any}>
                    <ZufallsschuelerView />
                </ToolsContext.Provider>
            </LerngruppenContext.Provider>
        </UIContext.Provider>
    );
};

describe('ZufallsschuelerView', () => {

    beforeEach(() => {
        mockPickedSchuelerIds = {};
        mockOnMarkSchuelerAsPicked.mockClear();
        mockOnResetPickedList.mockClear();
        mockSetHeaderConfig.mockClear();
        vi.useFakeTimers();
         // Mock getBoundingClientRect for spotlight animation which is used in the tests
        Element.prototype.getBoundingClientRect = vi.fn(() => ({
            width: 120, height: 90, top: 150, left: 150, right: 270, bottom: 240, x: 150, y: 150, toJSON: () => {}
        }));
    });

    afterEach(() => {
        vi.useRealTimers();
        cleanup();
        vi.restoreAllMocks();
    });

    it('Testfall: Initialzustand', () => {
        renderWithProviders();
        expect(screen.getByText('Anton')).toBeInTheDocument();
        expect(screen.getByText('Berta')).toBeInTheDocument();
        expect(screen.getByText('Carla')).toBeInTheDocument();

        // All cards should be available (i.e., not have opacity classes for other states)
        mockSchueler.forEach((s: Schueler) => {
            const card = screen.getByText(s.firstName).closest('button');
            expect(card).not.toHaveClass('opacity-40'); // excluded
            expect(card).not.toHaveClass('opacity-20'); // drawn
        });

        expect(screen.getByRole('button', { name: /Zufallswahl/i })).toBeEnabled();
        expect(screen.getByRole('button', { name: /Zurücksetzen/i })).toBeDisabled();
    });

    it('Testfall: "Schüler manuell ausschließen & wieder einschließen"', () => {
        renderWithProviders();
        const bertaCard = screen.getByText('Berta').closest('button');
        expect(bertaCard).not.toBeNull();
        expect(bertaCard).not.toHaveClass('opacity-40');
        
        // Exclude
        fireEvent.click(bertaCard!);
        expect(bertaCard).toHaveClass('opacity-40');

        // Include again
        fireEvent.click(bertaCard!);
        expect(bertaCard).not.toHaveClass('opacity-40');
    });
    
    it('Testfall: "Zufallswahl durchführen"', async () => {
        renderWithProviders();
        const zufallButton = screen.getByRole('button', { name: /Zufallswahl/i });
        fireEvent.click(zufallButton);

        // Animation phase
        act(() => { vi.advanceTimersByTime(2500); });
        
        // Spotlight delay phase
        await act(async () => { vi.advanceTimersByTime(500); });
        
        // Assertions after selection
        expect(mockOnMarkSchuelerAsPicked).toHaveBeenCalledOnce();
        const drawnSchuelerId = mockOnMarkSchuelerAsPicked.mock.calls[0][1];
        const drawnSchueler = mockSchueler.find((s: Schueler) => s.id === drawnSchuelerId)!;

        // Spotlight card should be visible
        expect(await screen.findByText(drawnSchueler.firstName)).toBeInTheDocument();

        // Fast-forward through spotlight display and return animation
        await act(async () => { vi.advanceTimersByTime(3000 + 500); }); // 3s display + 500ms return transition
        
        // After transition, spotlight should be gone
        expect(screen.queryByText(drawnSchueler.firstName, { selector: '.fixed .text-3xl' })).not.toBeInTheDocument();
        
        // The original card should now be in the 'drawn' state
        // Re-render with the new state to check final class
        mockPickedSchuelerIds = { [mockLerngruppe.id]: [drawnSchuelerId] };
        cleanup();
        renderWithProviders();
        
        const finalDrawnCard = screen.getByText(drawnSchueler.firstName).closest('button');
        expect(finalDrawnCard).toHaveClass('opacity-20');
    });


    it('Testfall: "Zurücksetzen-Funktion"', () => {
        // Setup: One student is drawn
        mockPickedSchuelerIds = { [mockLerngruppe.id]: ['s1'] }; 
        renderWithProviders();
        
        const bertaCard = screen.getByText('Berta').closest('button')!;
        fireEvent.click(bertaCard); // Exclude Berta

        // Verify initial states
        expect(screen.getByText('Anton').closest('button')).toHaveClass('opacity-20');
        expect(bertaCard).toHaveClass('opacity-40');
        
        const resetButton = screen.getByRole('button', { name: /Zurücksetzen/i });
        expect(resetButton).toBeEnabled();
        fireEvent.click(resetButton);

        // Verify reset call and state
        expect(mockOnResetPickedList).toHaveBeenCalledWith(mockLerngruppe.id);
        
        // In a real app, the context would re-render. Here we simulate it by clearing the mock.
        mockPickedSchuelerIds = {};
        cleanup();
        renderWithProviders();

        // All cards should be available again
        expect(screen.getByText('Anton').closest('button')).not.toHaveClass('opacity-20');
        expect(screen.getByText('Berta').closest('button')).not.toHaveClass('opacity-40');
        expect(screen.getByRole('button', { name: /Zurücksetzen/i })).toBeDisabled();
    });
    
    it('Testfall: Deaktivierter Button bei keiner Auswahlmöglichkeit', () => {
        // All students are drawn
        mockPickedSchuelerIds = { [mockLerngruppe.id]: ['s1', 's2', 's3'] };
        renderWithProviders();
        
        expect(screen.getByRole('button', { name: /Zufallswahl/i })).toBeDisabled();
    });
});
