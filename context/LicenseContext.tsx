import React, { createContext, ReactNode, useContext, useSyncExternalStore } from 'react';
import { licenseStore, LicenseStatus } from '../store/licenseStore';

interface LicenseContextState {
    licenseStatus: LicenseStatus;
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
    const { licenseStatus } = useSyncExternalStore(licenseStore.subscribe, licenseStore.getState);

    const value: LicenseContextState = {
        licenseStatus,
    };

    return <LicenseContext.Provider value={value}>{children}</LicenseContext.Provider>;
};