import { db } from './db';
import { LICENSE_STATUS_KEY, LICENSE_OWNER_KEY } from './keys';

// --- Types ---
export type LicenseStatus = 'FREEMIUM' | 'PRO' | 'ALPHA_TESTER';

interface LicenseState {
  licenseStatus: LicenseStatus;
  licenseeName?: string;
}

// --- Constants ---
const LICENSE_SALT = 'Linexio-Secure-Salt-V1-2025-Secret';

// --- State & Listener Setup ---

let state: LicenseState = {
  licenseStatus: 'FREEMIUM',
  licenseeName: undefined,
};

const listeners = new Set<() => void>();

const notify = () => {
  listeners.forEach(listener => listener());
};

const persistState = async () => {
  await db.set(LICENSE_STATUS_KEY, state.licenseStatus);
  if (state.licenseeName) {
      await db.set(LICENSE_OWNER_KEY, state.licenseeName);
  }
};

// --- Helpers ---

async function computeSignature(payload: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(payload + LICENSE_SALT);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// --- Actions ---

const setLicenseStatus = async (status: LicenseStatus, name?: string) => {
    state = { ...state, licenseStatus: status, licenseeName: name };
    await persistState();
    notify();
};

const validateAndApplyKey = async (keyInput: string): Promise<{ success: boolean; message?: string }> => {
    try {
        const parts = keyInput.trim().split('.');
        if (parts.length !== 2) {
            return { success: false, message: 'Ungültiges Lizenzformat.' };
        }
        
        const [payloadB64, signature] = parts;
        
        const calculatedSignature = await computeSignature(payloadB64);

        if (calculatedSignature !== signature) {
            return { success: false, message: 'Ungültiger Lizenzschlüssel.' };
        }

        // Decode payload to check specific data
        try {
            const payloadStr = atob(payloadB64);
            const payload = JSON.parse(payloadStr);
            
            if (payload.type === 'PRO') {
                await setLicenseStatus('PRO', payload.name);
                return { success: true };
            } else {
                 return { success: false, message: 'Unbekannter Lizenztyp.' };
            }
        } catch (e) {
             return { success: false, message: 'Lizenzdaten beschädigt.' };
        }

    } catch (e) {
        console.error(e);
        return { success: false, message: 'Fehler bei der Validierung.' };
    }
};

// --- Initialization Logic ---

export async function initLicenseStore() {
  const storedStatus = await db.get<LicenseStatus>(LICENSE_STATUS_KEY);
  const storedName = await db.get<string>(LICENSE_OWNER_KEY);
  state = { 
      licenseStatus: storedStatus || 'FREEMIUM',
      licenseeName: storedName || undefined
  };
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
    validateAndApplyKey,
  },
};