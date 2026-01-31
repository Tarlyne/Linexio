import { v4 as uuidv4 } from 'uuid';
import { Termin } from '../context/types';
import { db } from './db';
import { TERMINE_KEY } from './keys';

interface TermineState {
    termine: Termin[];
}

let state: TermineState = {
    termine: [],
};

const listeners = new Set<() => void>();

const notify = () => {
    listeners.forEach(listener => listener());
};

const persistState = async () => {
    await db.set(TERMINE_KEY, state.termine);
};

// --- Actions ---

const addTermin = async (terminData: Omit<Termin, 'id'>) => {
    const newTermin: Termin = { ...terminData, id: uuidv4() };
    state = { ...state, termine: [...state.termine, newTermin] };
    await persistState();
    notify();
};

const updateTermin = async (id: string, updates: Partial<Termin>) => {
    state = {
        ...state,
        termine: state.termine.map(t => t.id === id ? { ...t, ...updates } : t)
    };
    await persistState();
    notify();
};

const deleteTermin = async (id: string) => {
    state = {
        ...state,
        termine: state.termine.filter(t => t.id !== id)
    };
    await persistState();
    notify();
};

// --- Initialization ---

export async function initTermineStore() {
    const loadedTermine = await db.get<Termin[]>(TERMINE_KEY);
    state = { termine: loadedTermine || [] };
    notify();
}

// --- Interface ---

export const termineStore = {
    subscribe: (listener: () => void): (() => void) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
    },
    getState: (): TermineState => state,
    actions: {
        addTermin,
        updateTermin,
        deleteTermin,
    },
};
