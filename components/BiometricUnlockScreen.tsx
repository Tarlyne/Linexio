import React, { useEffect } from 'react';
import { useSecurityContext } from '../context/SecurityContext';
import { LinexioLogoIcon, FingerPrintIcon } from './icons';

const BiometricUnlockScreen: React.FC = () => {
    const { tryBiometricUnlock, fallbackToPassword } = useSecurityContext();

    useEffect(() => {
        // Automatically trigger the biometric prompt on component mount.
        tryBiometricUnlock();
    }, [tryBiometricUnlock]);

    return (
        <div className="flex h-screen w-full items-center justify-center bg-[var(--color-background)] p-4">
            <div className="w-full max-w-sm mx-auto text-center">
                <div className="flex justify-center items-center mb-6 space-x-3">
                    <LinexioLogoIcon />
                    <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Linexio</h1>
                </div>
                
                <div className="animate-pulse flex flex-col items-center space-y-4">
                    <FingerPrintIcon className="w-16 h-16 text-[var(--color-accent-text)]" />
                    <p className="text-lg font-semibold text-[var(--color-text-secondary)]">
                        Mit Biometrie entsperren...
                    </p>
                </div>

                <div className="mt-8">
                    <button 
                        onClick={fallbackToPassword} 
                        className="text-sm text-[var(--color-text-tertiary)] hover:text-[var(--color-accent-text)] transition-colors"
                    >
                        Manuell mit Passwort entsperren
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BiometricUnlockScreen;