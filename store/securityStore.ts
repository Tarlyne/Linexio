import { db } from './db';
import { generateSalt, deriveKey, encrypt, decrypt, generateMnemonic, mnemonicToHash, toBase64, fromBase64 } from './crypto';
import { BIOMETRICS_ENABLED_KEY } from './keys';

let masterKey: CryptoKey | null = null;
let listeners = new Set<() => void>();
let state = {
    isInitialized: false,
    isPasswordSet: false,
    hasRecoveryPhrase: false,
    isBiometricsEnabled: false,
};

function notify() {
    listeners.forEach(l => l());
}

async function init() {
    const salt = await db.get<string>('master_key_salt');
    const recoveryHash = await db.get<string>('recovery_hash');
    const biometricsEnabled = await db.get<boolean>(BIOMETRICS_ENABLED_KEY);
    state = { ...state, isPasswordSet: !!salt, hasRecoveryPhrase: !!recoveryHash, isBiometricsEnabled: !!biometricsEnabled, isInitialized: true };
    notify();
}

async function setPassword(password: string): Promise<void> {
    const salt = generateSalt();
    const key = await deriveKey(password, salt);
    masterKey = key;

    await db.set('master_key_salt', toBase64(salt));

    // Encrypt a check value to verify password later
    const checkValue = 'LinexioDataCheck';
    const { iv, encryptedData } = await encrypt(checkValue, key);
    await db.set('encryption_check', { iv, encryptedData });

    state = { ...state, isPasswordSet: true };
    notify();
}

async function verifyPassword(password: string): Promise<boolean> {
    try {
        const saltString = await db.get<string>('master_key_salt');
        if (!saltString) return false;

        const salt = fromBase64(saltString);
        const key = await deriveKey(password, salt);

        const checkData = await db.get<{ iv: string, encryptedData: string }>('encryption_check');
        if (!checkData) {
            const checkValue = 'LinexioDataCheck';
            const { iv, encryptedData } = await encrypt(checkValue, key);
            await db.set('encryption_check', { iv, encryptedData });
            masterKey = key;
            return true;
        }
        
        const decrypted = await decrypt(checkData.encryptedData, checkData.iv, key);

        if (decrypted === 'LinexioDataCheck') {
            masterKey = key;
            return true;
        }

        return false;
    } catch (e) {
        console.error("Fehler während der Passwort-Verifizierung:", e);
        return false;
    }
}

async function changePassword(oldPassword: string, newPassword: string): Promise<void> {
    const isOldPasswordValid = await verifyPassword(oldPassword);
    if (!isOldPasswordValid) {
        throw new Error('Das aktuelle Passwort ist falsch.');
    }
    // Set new password, which also clears the old master key implicitly
    await setPassword(newPassword);
    // Explicitly clear the key from memory to force re-login
    clearMasterKey();
}

async function setupRecovery(): Promise<string[]> {
    const mnemonic = generateMnemonic();
    const hash = await mnemonicToHash(mnemonic);
    await db.set('recovery_hash', hash);
    state = { ...state, hasRecoveryPhrase: true };
    notify();
    return mnemonic;
}

async function verifyRecoveryPhraseForSetup(phrase: string[]): Promise<boolean> {
    const storedHash = await db.get<string>('recovery_hash');
    if (!storedHash) return false;
    const currentHash = await mnemonicToHash(phrase);
    return storedHash === currentHash;
}

async function verifyRecoveryPhraseForReset(phrase: string[]): Promise<boolean> {
    return verifyRecoveryPhraseForSetup(phrase); // Same logic
}

async function resetPassword(newPassword: string): Promise<void> {
    // If we're resetting, we don't know the old password.
    // We just create a new salt and a new encrypted check value.
    await setPassword(newPassword);
    clearMasterKey(); // Ensure the user has to log in again.
}

async function setBiometricsEnabled(enabled: boolean) {
    if (enabled) {
        await db.set(BIOMETRICS_ENABLED_KEY, true);
    } else {
        // To be safe, also clear any potential stored credential info if we had some.
        // For now, just removing the flag is sufficient.
        await db.set(BIOMETRICS_ENABLED_KEY, false);
    }
    state = { ...state, isBiometricsEnabled: enabled };
    notify();
}


function clearMasterKey() {
    masterKey = null;
}

export const securityStore = {
    init,
    setPassword,
    verifyPassword,
    changePassword,
    setupRecovery,
    verifyRecoveryPhraseForSetup,
    verifyRecoveryPhraseForReset,
    resetPassword,
    setBiometricsEnabled,
    getMasterKey: () => masterKey,
    clearMasterKey,
    getState: () => state,
    subscribe: (listener: () => void): (() => void) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
    },
};