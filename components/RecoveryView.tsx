import React, { useState, useRef, useEffect } from 'react';
import { useSecurityContext } from '../context/SecurityContext';
import Button from './ui/Button';
import { LinexioLogoIcon, ChevronLeftIcon, LockClosedIcon } from './icons';
import Input from './ui/Input';
import { validateNewPassword } from '../utils/validation';

interface RecoveryViewProps {
    onBack: () => void;
}

type Step = 'enterPhrase' | 'resetPassword';

const RecoveryView: React.FC<RecoveryViewProps> = ({ onBack }) => {
    const { verifyRecoveryPhraseForReset, resetPassword, error } = useSecurityContext();
    const [step, setStep] = useState<Step>('enterPhrase');
    const [phrase, setPhrase] = useState<string[]>(Array(12).fill(''));
    const [isLoading, setIsLoading] = useState(false);
    
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [resetError, setResetError] = useState<string | null>(null);

    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        inputRefs.current = inputRefs.current.slice(0, 12);
        inputRefs.current[0]?.focus();
    }, []);

    const handleInputChange = (index: number, value: string) => {
        const newPhrase = [...phrase];
        const words = value.split(/\s+/);
        
        if (words.length > 1 && index < 11) {
            // Paste logic
            for (let i = 0; i < words.length && index + i < 12; i++) {
                newPhrase[index + i] = words[i].toLowerCase().trim();
            }
            const nextIndex = Math.min(11, index + words.length);
            inputRefs.current[nextIndex]?.focus();
        } else {
            // Single word logic
            newPhrase[index] = value.toLowerCase().trim();
            if (value.includes(' ') && index < 11) {
                inputRefs.current[index + 1]?.focus();
            }
        }
        setPhrase(newPhrase);
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'ArrowDown' && index < 11) {
            inputRefs.current[index + 1]?.focus();
        } else if (e.key === 'ArrowUp' && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };
    
    const handleVerify = async () => {
        setIsLoading(true);
        const success = await verifyRecoveryPhraseForReset(phrase);
        if (success) {
            setStep('resetPassword');
        }
        setIsLoading(false);
    };

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        const validationError = validateNewPassword(newPassword, confirmPassword);
        if (validationError) {
            setResetError(validationError);
            return;
        }

        setResetError(null);
        setIsLoading(true);
        await resetPassword(newPassword);
        // On success, the app will transition to the UnlockScreen automatically
    };

    const isPhraseComplete = phrase.every(word => word.trim().length > 0);

    return (
        <div className="flex h-screen w-full items-center justify-center bg-[var(--color-background)] p-4">
            <div className="w-full max-w-4xl mx-auto bg-[var(--color-ui-primary)] p-8 rounded-xl shadow-2xl border border-[var(--color-border)]">
                <button onClick={onBack} className="absolute top-4 left-4 p-2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors">
                    <ChevronLeftIcon />
                </button>
                <div className="flex justify-center items-center mb-6 space-x-3">
                    <LinexioLogoIcon />
                    <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Passwort zurücksetzen</h1>
                </div>

                {step === 'enterPhrase' && (
                    <div className="space-y-6">
                        <p className="text-center text-[var(--color-text-secondary)]">
                            Geben Sie Ihre 12-Wörter-Wiederherstellungsphrase in der korrekten Reihenfolge ein.
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
                            {phrase.map((word, index) => (
                                <div key={index} className="flex items-center space-x-2">
                                    <span className="text-sm font-mono text-[var(--color-text-tertiary)] w-8 text-right">{index + 1}.</span>
                                    <input
                                        // FIX: Use a ref callback with a void return type to correctly assign the element to the ref array.
                                        ref={el => { inputRefs.current[index] = el; }}
                                        type="text"
                                        value={word}
                                        onChange={(e) => handleInputChange(index, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(index, e)}
                                        className="h-9 flex-1 px-2 bg-[var(--color-ui-secondary)] border border-[var(--color-border)] rounded-md text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-border-focus)] transition-colors"
                                        autoCapitalize="none"
                                        autoCorrect="off"
                                    />
                                </div>
                            ))}
                        </div>
                        {error && <p className="text-sm text-center text-[var(--color-danger-text)]">{error}</p>}
                        <Button onClick={handleVerify} className="w-full !py-3" disabled={!isPhraseComplete || isLoading}>
                            {isLoading ? 'Prüfe...' : 'Phrase bestätigen'}
                        </Button>
                    </div>
                )}
                
                {step === 'resetPassword' && (
                     <form onSubmit={handleReset} className="w-full space-y-4 animate-fade-in">
                        <p className="text-sm text-center text-[var(--color-success-text)] pb-2">
                            Wiederherstellungsphrase korrekt! Bitte legen Sie jetzt ein neues Passwort fest.
                        </p>
                        <Input
                            label="Neues Passwort"
                            id="reset-new-password"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            autoFocus
                        />
                        <Input
                            label="Neues Passwort bestätigen"
                            id="reset-confirm-password"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                        {resetError && <p className="text-sm text-center text-[var(--color-danger-text)]">{resetError}</p>}
                        <div className="pt-4">
                            <Button type="submit" className="w-full !py-3" disabled={isLoading}>
                                {isLoading ? 'Speichere...' : 'Neues Passwort setzen & entsperren'}
                            </Button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default RecoveryView;
