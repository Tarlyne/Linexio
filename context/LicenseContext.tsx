import React, { createContext, ReactNode, useContext, useSyncExternalStore, useCallback } from 'react';
import { licenseStore, LicenseStatus } from '../store/licenseStore';

interface LicenseContextState {
    licenseStatus: LicenseStatus;
    licenseeName?: string;
    validateAndApplyKey: (key: string) => Promise<{ success: boolean; message?: string }>;
}

const LicenseContext = createContext<LicenseContextState | undefined>(undefined);

export const useLicenseContext = () => {
    const context = useContext(LicenseContext);
    if (context === undefined) {
        throw new Error('useLicenseContext must be used within a LicenseContextProvider');
    }
    return context;
};

export const LicenseContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { licenseStatus, licenseeName } = useSyncExternalStore(licenseStore.subscribe, licenseStore.getState);

    const validateAndApplyKey = useCallback((key: string) => {
        return licenseStore.actions.validateAndApplyKey(key);
    }, []);

    const value: LicenseContextState = {
        licenseStatus,
        licenseeName,
        validateAndApplyKey,
    };

    return <LicenseContext.Provider value={value}>{children}</LicenseContext.Provider>;
};