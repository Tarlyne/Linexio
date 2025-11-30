import React, { useState, useRef, useEffect } from 'react';
import { useSecurityContext } from '../context/SecurityContext';
import Input from './ui/Input';
import Button from './ui/Button';
import { LinexioLogoIcon, LockClosedIcon, FingerPrintIcon } from './icons';
import { validateNewPassword } from '../utils/validation';

const SetPasswordForm: React.FC = () => {
    const { setPassword: setMasterPassword } = useSecurityContext();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const passwordInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setTimeout(() => passwordInputRef.current?.focus(), 100);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const validationError = validateNewPassword(password, confirmPassword);
        if (validationError) {
            setError(validationError);
            return;
        }
        
        setError(null);
        setIsLoading(true);
        await setMasterPassword(password);
        // No need to setIsLoading(false) as the component will unmount on success
    };

    return (
        <form onSubmit={handleSubmit} className="w-full space-y-4">
            <h2 className="text-xl font-bold text-center text-[var(--color-text-primary)]">Passwort festlegen</h2>
            <p className="text-sm text-center text-[var(--color-text-tertiary)] pb-2">
                Dieses Passwort schützt Ihre Daten auf diesem Gerät. Sichern Sie es gut. Eine Wiederherstellung ist nur mit einer Phrase möglich, die Sie in den Einstellungen einrichten können.
            </p>
            <Input
                ref={passwordInputRef}
                label="Neues Passwort"
                id="new-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
            />
            <Input
                label="Passwort bestätigen"
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
            />
            {error && <p className="text-sm text-center text-[var(--color-danger-text)]">{error}</p>}
            <div className="pt-4">
                <Button type="submit" className="w-full !py-3" disabled={isLoading}>
                    {isLoading ? 'Speichere...' : 'Passwort setzen & App starten'}
                </Button>
            </div>
        </form>
    );
};

const UnlockForm: React.FC = () => {
    const { unlock, error: contextError, onStartRecovery, isBiometricsSupported, isBiometricsEnabled, switchToBiometricUnlock } = useSecurityContext();
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const passwordInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setTimeout(() => passwordInputRef.current?.focus(), 100);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        const success = await unlock(password);
        if (!success) {
            setIsLoading(false);
            setPassword(''); // Clear password on failure
        }
    };

    return (
        <div className="w-full">
            <h2 className="text-xl font-bold text-center text-[var(--color-text-primary)] mb-4">Linexio entsperren</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    ref={passwordInputRef}
                    label="Passwort"
                    id="unlock-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                {contextError && <p className="text-sm text-center text-[var(--color-danger-text)]">{contextError}</p>}
                <div className="pt-4">
                    <Button type="submit" className="w-full !py-3" disabled={isLoading}>
                        {isLoading ? 'Prüfe...' : 'Entsperren'}
                    </Button>
                </div>
            </form>
             <div className="text-center pt-4 space-y-2">
                {isBiometricsSupported && isBiometricsEnabled && (
                    <button type="button" onClick={switchToBiometricUnlock} className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-accent-text)] hover:underline">
                        <FingerPrintIcon className="w-5 h-5" />
                        Mit Biometrie entsperren
                    </button>
                )}
                <button type="button" onClick={onStartRecovery} className="block w-full text-sm text-[var(--color-text-tertiary)] hover:text-[var(--color-accent-text)] transition-colors">
                    Passwort vergessen?
                </button>
            </div>
        </div>
    );
};

const UnlockScreen: React.FC = () => {
    const { isPasswordSet } = useSecurityContext();

    return (
        <div className="aurora-container relative isolate overflow-hidden h-screen w-full">
            <div className="stars-layer-2"></div>
            <div className="relative z-10 flex h-full w-full items-center justify-center p-4">
                <div className="w-full max-w-sm mx-auto bg-[var(--color-ui-primary)]/70 backdrop-blur-xl p-8 rounded-xl shadow-2xl shadow-[0_0_50px_5px_var(--color-shadow)] border border-[var(--color-border)]/50">
                    <div className="flex justify-center items-center mb-6 space-x-3">
                        <LinexioLogoIcon secondaryColor="var(--color-accent-text)" />
                        <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Linexio</h1>
                    </div>
                    {isPasswordSet ? <UnlockForm /> : <SetPasswordForm />}
                </div>
            </div>
        </div>
    );
};

export default UnlockScreen;