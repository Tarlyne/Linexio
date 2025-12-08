import { v4 as uuidv4 } from 'uuid';
import { 
    Schueler, 
    Lerngruppe, 
} from '../context/types';
import { getSystemSchoolYear } from '../context/utils';
import { db } from './db';
import { LERGRUPPEN_KEY, SCHUELER_KEY } from './keys';

// --- State & Listener Setup ---

interface LerngruppenState {
  lerngruppen: Lerngruppe[];
  allSchueler: Schueler[];
}

let state: LerngruppenState = {
  lerngruppen: [],
  allSchueler: [],
};

const listeners = new Set<() => void>();

const notify = () => {
  listeners.forEach(listener => listener());
};

const persistState = async () => {
  await db.set(LERGRUPPEN_KEY, state.lerngruppen);
  await db.set(SCHUELER_KEY, state.allSchueler);
};

// --- Actions (interne Logik) ---

const addLerngruppe = async (gruppe: { name: string; fach: string; notensystemId: string; }, schuljahr: string) => {
    const newLerngruppe: Lerngruppe = { ...gruppe, id: uuidv4(), schuljahr, order: state.lerngruppen.length, gewichtungHj1: 1, gewichtungHj2: 1, schuelerIds: [] };
    state = { ...state, lerngruppen: [...state.lerngruppen, newLerngruppe] };
    await persistState();
    notify();
};

const updateLerngruppe = async (updatedLerngruppe: Lerngruppe): Promise<Lerngruppe> => {
    state = { ...state, lerngruppen: state.lerngruppen.map((lg: Lerngruppe) => lg.id === updatedLerngruppe.id ? updatedLerngruppe : lg) };
    await persistState();
    notify();
    return updatedLerngruppe;
};

const deleteLerngruppe = async (id: string) => {
    const lerngruppeToDelete = state.lerngruppen.find(lg => lg.id === id);
    if (!lerngruppeToDelete) return;

    const schuelerIdsInGroup = lerngruppeToDelete.schuelerIds;
    const remainingLerngruppen = state.lerngruppen.filter(lg => lg.id !== id);
    const allRemainingSchuelerIds = new Set(remainingLerngruppen.flatMap(lg => lg.schuelerIds));

    const schuelerIdsToDelete = schuelerIdsInGroup.filter(sId => !allRemainingSchuelerIds.has(sId));
    
    state = {
        allSchueler: state.allSchueler.filter(s => !schuelerIdsToDelete.includes(s.id)),
        lerngruppen: remainingLerngruppen
    };
    await persistState();
    notify();
};

const deleteSchoolYear = async (schuljahr: string) => {
    // 1. Identify groups to delete
    const groupsToDelete = state.lerngruppen.filter(lg => lg.schuljahr === schuljahr);
    if (groupsToDelete.length === 0) return;

    // 2. Keep remaining groups
    const remainingGroups = state.lerngruppen.filter(lg => lg.schuljahr !== schuljahr);

    // 3. Identify students referenced in remaining groups
    const remainingStudentIds = new Set(remainingGroups.flatMap(lg => lg.schuelerIds));

    // 4. Filter students: Keep those who are in remainingStudentIds
    // (Students only in the deleted year will be filtered out)
    const remainingStudents = state.allSchueler.filter(s => remainingStudentIds.has(s.id));

    state = {
        lerngruppen: remainingGroups,
        allSchueler: remainingStudents
    };
    await persistState();
    notify();
};

const removeImagesFromYear = async (schuljahr: string) => {
    const groupsInYear = state.lerngruppen.filter(lg => lg.schuljahr === schuljahr);
    const studentIdsInYear = new Set(groupsInYear.flatMap(lg => lg.schuelerIds));

    // Update students: remove profilePicture if they belong to the year
    const updatedSchueler = state.allSchueler.map(s => {
        if (studentIdsInYear.has(s.id)) {
            // Remove profilePicture property
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { profilePicture, ...rest } = s;
            return rest as Schueler;
        }
        return s;
    });

    state = { ...state, allSchueler: updatedSchueler };
    await persistState();
    notify();
};

const copyLerngruppe = async (lerngruppeToCopy: Lerngruppe, newName: string, newFach: string, systemSchoolYear: string): Promise<string> => {
    const schuelerToCopy = state.allSchueler.filter((s: Schueler) => lerngruppeToCopy.schuelerIds.includes(s.id));
    
    const newSchueler: Schueler[] = schuelerToCopy.map((s: Schueler) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, profilePicture, notes, ...restOfSchueler } = s;
        return {
            ...restOfSchueler,
            id: uuidv4(),
        };
    });

    const newLerngruppe: Lerngruppe = {
        id: uuidv4(),
        name: newName,
        fach: newFach,
        schuljahr: systemSchoolYear,
        notensystemId: lerngruppeToCopy.notensystemId,
        order: state.lerngruppen.length,
        gewichtungHj1: lerngruppeToCopy.gewichtungHj1 ?? 1,
        gewichtungHj2: lerngruppeToCopy.gewichtungHj2 ?? 1,
        schuelerIds: newSchueler.map(s => s.id),
    };

    state = {
        lerngruppen: [...state.lerngruppen, newLerngruppe],
        allSchueler: [...state.allSchueler, ...newSchueler]
    };
    await persistState();
    notify();
    return newLerngruppe.id;
};

const reorderLerngruppe = async (id: string, direction: 'up' | 'down') => {
    const index = state.lerngruppen.findIndex((lg: Lerngruppe) => lg.id === id);
    if (index === -1) return;
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= state.lerngruppen.length) return;
    const reordered = [...state.lerngruppen];
    const [movedItem] = reordered.splice(index, 1);
    reordered.splice(newIndex, 0, movedItem);
    state = { ...state, lerngruppen: reordered.map((lg: Lerngruppe, i: number) => ({ ...lg, order: i })) };
    await persistState();
    notify();
};

const addSchueler = async (schuelerData: Omit<Schueler, 'id'>, lerngruppeId: string) => {
    const newSchueler: Schueler = { ...schuelerData, id: uuidv4() };
    const updatedLerngruppen = state.lerngruppen.map(lg => {
        if (lg.id === lerngruppeId) {
            return { ...lg, schuelerIds: [...lg.schuelerIds, newSchueler.id] };
        }
        return lg;
    });

    state = { 
        ...state, 
        allSchueler: [...state.allSchueler, newSchueler],
        lerngruppen: updatedLerngruppen,
    };
    await persistState();
    notify();
};

const addSchuelerBulk = async (schuelerListe: Omit<Schueler, 'id'>[], lerngruppeId: string) => {
    const newSchuelerListe: Schueler[] = schuelerListe.map(s => ({ ...s, id: uuidv4() }));
    const newSchuelerIds = newSchuelerListe.map(s => s.id);

    const updatedLerngruppen = state.lerngruppen.map(lg => {
        if (lg.id === lerngruppeId) {
            return { ...lg, schuelerIds: [...lg.schuelerIds, ...newSchuelerIds] };
        }
        return lg;
    });

    state = { 
        ...state, 
        allSchueler: [...state.allSchueler, ...newSchuelerListe],
        lerngruppen: updatedLerngruppen,
    };
    await persistState();
    notify();
};

const addSchuelerToLerngruppe = async (lerngruppeId: string, schuelerIds: string[]) => {
    const updatedLerngruppen = state.lerngruppen.map(lg => {
        if (lg.id === lerngruppeId) {
            const existingIds = new Set(lg.schuelerIds);
            schuelerIds.forEach(id => existingIds.add(id));
            return { ...lg, schuelerIds: Array.from(existingIds) };
        }
        return lg;
    });

    state = { ...state, lerngruppen: updatedLerngruppen };
    await persistState();
    notify();
};

const updateSchueler = async (schueler: Schueler) => {
    state = { ...state, allSchueler: state.allSchueler.map((s: Schueler) => s.id === schueler.id ? schueler : s) };
    await persistState();
    notify();
};

const removeSchuelerFromLerngruppe = async (schuelerId: string, lerngruppeId: string) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let schuelerWirdGeloescht = false;
    
    // 1. Remove student from the specific group
    const updatedLerngruppen = state.lerngruppen.map(lg => {
        if (lg.id === lerngruppeId) {
            return { ...lg, schuelerIds: lg.schuelerIds.filter(sId => sId !== schuelerId) };
        }
        return lg;
    });

    // 2. Check if the student is in any other group
    const isSchuelerStillInAnyGroup = updatedLerngruppen.some(lg => lg.schuelerIds.includes(schuelerId));

    let updatedAllSchueler = state.allSchueler;

    // 3. If not, remove the student from the global list
    if (!isSchuelerStillInAnyGroup) {
        updatedAllSchueler = state.allSchueler.filter(s => s.id !== schuelerId);
        schuelerWirdGeloescht = true;
    }
    
    state = { 
        ...state, 
        lerngruppen: updatedLerngruppen,
        allSchueler: updatedAllSchueler,
    };
    await persistState();
    notify();
};

// --- Initialization Logic ---

export async function initLerngruppenStore() {
  // `initAndSeedDatabase` from `db.ts` is now responsible for seeding.
  // The new migration system in `migration.ts` handles data structure changes.
  // This function just loads what's in the DB.

  const lerngruppen = await db.get<Lerngruppe[]>(LERGRUPPEN_KEY);
  const allSchueler = await db.get<Schueler[]>(SCHUELER_KEY);

  state = { lerngruppen: lerngruppen || [], allSchueler: allSchueler || [] };
  notify();
}

// --- Public Store Interface ---

export const lerngruppenStore = {
  subscribe: (listener: () => void): (() => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getState: (): LerngruppenState => state,
  actions: {
    addLerngruppe,
    updateLerngruppe,
    deleteLerngruppe,
    deleteSchoolYear,
    removeImagesFromYear,
    copyLerngruppe,
    reorderLerngruppe,
    addSchueler,
    addSchuelerBulk,
    addSchuelerToLerngruppe,
    updateSchueler,
    removeSchuelerFromLerngruppe,
  },
};