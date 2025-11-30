// store/lerngruppenStore.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { lerngruppenStore, initLerngruppenStore } from './lerngruppenStore';
import { db } from './db';
import { LERGRUPPEN_KEY, SCHUELER_KEY } from './keys';
import { Schueler, Lerngruppe } from '../context/types';

// Mock the db module to prevent actual database writes
vi.mock('./db', () => ({
  db: {
    get: vi.fn(),
    set: vi.fn(),
  },
}));

// --- Test Data Setup ---
let schueler1: Schueler, schueler2: Schueler, schueler3: Schueler;
let lerngruppe1: Lerngruppe, lerngruppe2: Lerngruppe;

const setupTestData = () => {
    schueler1 = { id: 's1', firstName: 'Anna', lastName: 'Allein', gender: 'w' };
    schueler2 = { id: 's2', firstName: 'Bernd', lastName: 'Beidseitig', gender: 'm' };
    schueler3 = { id: 's3', firstName: 'Carla', lastName: 'Core', gender: 'w' };

    lerngruppe1 = {
        id: 'lg1', name: 'Klasse A', fach: 'Mathe', schuljahr: '23/24', notensystemId: 'punkte_15_0',
        order: 0, gewichtungHj1: 1, gewichtungHj2: 1, schuelerIds: ['s1', 's2']
    };

    lerngruppe2 = {
        id: 'lg2', name: 'Klasse B', fach: 'Deutsch', schuljahr: '23/24', notensystemId: 'punkte_15_0',
        order: 1, gewichtungHj1: 1, gewichtungHj2: 1, schuelerIds: ['s2', 's3']
    };
};


describe('lerngruppenStore', () => {

    beforeEach(async () => {
        // Reset test data
        setupTestData();
        
        // Mock db.get to return fresh test data for each test
        (db.get as any).mockImplementation((key: string) => {
            if (key === LERGRUPPEN_KEY) return Promise.resolve([lerngruppe1, lerngruppe2]);
            if (key === SCHUELER_KEY) return Promise.resolve([schueler1, schueler2, schueler3]);
            return Promise.resolve(null);
        });

        // Re-initialize the store with mocked data
        await initLerngruppenStore();
    });

    describe('removeSchuelerFromLerngruppe', () => {
        it('Szenario A: sollte einen Schüler nur aus einer Lerngruppe entfernen, aber behalten, wenn er in anderen ist', async () => {
            // Act: Remove schueler2 (who is in lg1 and lg2) from lg1
            await lerngruppenStore.actions.removeSchuelerFromLerngruppe('s2', 'lg1');

            const state = lerngruppenStore.getState();
            const updatedLg1 = state.lerngruppen.find((lg: Lerngruppe) => lg.id === 'lg1');
            const updatedLg2 = state.lerngruppen.find((lg: Lerngruppe) => lg.id === 'lg2');
            
            // Assert: schueler2 is no longer in lg1
            expect(updatedLg1?.schuelerIds).not.toContain('s2');
            
            // Assert: schueler2 is still in lg2
            expect(updatedLg2?.schuelerIds).toContain('s2');
            
            // Assert: schueler2 still exists in the global list
            expect(state.allSchueler.some((s: Schueler) => s.id === 's2')).toBe(true);
        });

        it('Szenario B: sollte einen Schüler endgültig löschen, wenn er aus seiner letzten Lerngruppe entfernt wird', async () => {
            // Act: Remove schueler1 (who is only in lg1) from lg1
            await lerngruppenStore.actions.removeSchuelerFromLerngruppe('s1', 'lg1');
            
            const state = lerngruppenStore.getState();
            const updatedLg1 = state.lerngruppen.find((lg: Lerngruppe) => lg.id === 'lg1');
            
            // Assert: schueler1 is no longer in lg1
            expect(updatedLg1?.schuelerIds).not.toContain('s1');
            
            // Assert: schueler1 no longer exists in the global list
            expect(state.allSchueler.some((s: Schueler) => s.id === 's1')).toBe(false);
        });
    });

    describe('deleteLerngruppe', () => {
        it('Szenario A: sollte eine Lerngruppe löschen und nur die Schüler löschen, die exklusiv in dieser Gruppe waren', async () => {
            // Act: Delete lg1, which contains s1 (exclusive) and s2 (shared with lg2)
            await lerngruppenStore.actions.deleteLerngruppe('lg1');
            
            const state = lerngruppenStore.getState();
            
            // Assert: lg1 is deleted
            expect(state.lerngruppen.some((lg: Lerngruppe) => lg.id === 'lg1')).toBe(false);
            
            // Assert: s1 (exclusive) is deleted from global list
            expect(state.allSchueler.some((s: Schueler) => s.id === 's1')).toBe(false);
            
            // Assert: s2 (shared) is NOT deleted from global list
            expect(state.allSchueler.some((s: Schueler) => s.id === 's2')).toBe(true);

            // Assert: lg2 still exists and contains s2
            const updatedLg2 = state.lerngruppen.find((lg: Lerngruppe) => lg.id === 'lg2');
            expect(updatedLg2).toBeDefined();
            expect(updatedLg2?.schuelerIds).toContain('s2');
        });

        it('Szenario B: sollte eine Lerngruppe und alle ihre exklusiven Schüler löschen', async () => {
             // Create a new group with only exclusive students
            const exclusiveSchueler = { id: 's4', firstName: 'Exklusiv', lastName: 'Egon', gender: 'm' };
            const exclusiveGruppe: Lerngruppe = {
                id: 'lg3', name: 'Exklusiv-Kurs', fach: 'Solo', schuljahr: '23/24', notensystemId: 'punkte_15_0',
                order: 2, gewichtungHj1: 1, gewichtungHj2: 1, schuelerIds: ['s4']
            };
            
            // Manually add to current state for this test
            (db.get as any).mockImplementation((key: string) => {
                if (key === LERGRUPPEN_KEY) return Promise.resolve([lerngruppe1, lerngruppe2, exclusiveGruppe]);
                if (key === SCHUELER_KEY) return Promise.resolve([schueler1, schueler2, schueler3, exclusiveSchueler]);
                return Promise.resolve(null);
            });
            await initLerngruppenStore();

            // Act: Delete the exclusive group
            await lerngruppenStore.actions.deleteLerngruppe('lg3');

            const state = lerngruppenStore.getState();

            // Assert: lg3 is deleted
            expect(state.lerngruppen.some((lg: Lerngruppe) => lg.id === 'lg3')).toBe(false);
            // Assert: s4 is also deleted
            expect(state.allSchueler.some((s: Schueler) => s.id === 's4')).toBe(false);
        });
    });
});
