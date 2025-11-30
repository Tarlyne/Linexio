import { db } from './db';
import { LICENSE_STATUS_KEY } from './keys';

// --- Types ---
export type LicenseStatus = 'FREEMIUM' | 'PRO' | 'ALPHA_TESTER';

interface LicenseState {
  licenseStatus: LicenseStatus;
}

// --- State & Listener Setup ---

let state: LicenseState = {
  licenseStatus: 'FREEMIUM',
};

const listeners = new Set<() => void>();

const notify = () => {
  listeners.forEach(listener => listener());
};

const persistState = async () => {
  await db.set(LICENSE_STATUS_KEY, state.licenseStatus);
};

// --- Actions ---

const setLicenseStatus = async (status: LicenseStatus) => {
    state = { ...state, licenseStatus: status };
    await persistState();
    notify();
};

// --- Initialization Logic ---

export async function initLicenseStore() {
  const storedStatus = await db.get<LicenseStatus>(LICENSE_STATUS_KEY);
  state = { licenseStatus: storedStatus || 'FREEMIUM' };
  notify();
}

// --- Public Store Interface ---

export const licenseStore = {
  subscribe: (listener: () => void): (() => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getState: (): LicenseState => state,
  actions: {
    setLicenseStatus,
  },
};