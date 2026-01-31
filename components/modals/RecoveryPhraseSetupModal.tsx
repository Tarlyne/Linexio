import React, { useState, useEffect, useMemo } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { useSecurityContext } from '../../context/SecurityContext';
import { ShieldCheckIcon, InformationCircleIcon, ExclamationCircleIcon, CheckCircleIcon } from '../icons';

interface RecoveryPhraseSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'intro' | 'warning' | 'display' | 'verify' | 'done';

const RecoveryPhraseSetupModal: React.FC<RecoveryPhraseSetupModalProps> = ({ isOpen, onClose }) => {
    const { hasRecoveryPhrase, setupRecovery, verifyRecoveryPhraseForSetup } = useSecurityContext();
    const [step, setStep] = useState<Step>('intro');
    const [phrase, setPhrase] = useState<string[]>([]);
    const [verificationWords, setVerificationWords] = useState<string[]>([]);
    const [verificationIndices, setVerificationIndices] = useState<number[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Function to generate unique random indices for verification
    const getVerificationIndices = () => {
        const indices = new Set<number>();
        while (indices.size < 3) {
            indices.add(Math.floor(Math.random() * 12));
        }
        return Array.from(indices).sort((a, b) => a - b);
    };

    useEffect(() => {
        if (isOpen) {
            setStep(hasRecoveryPhrase ? 'warning' : 'intro');
            setPhrase([]);
            setVerificationWords(Array(3).fill(''));
            setError(null);
        }
    }, [isOpen, hasRecoveryPhrase]);

    const handleGeneratePhrase = async () => {
        const newPhrase = await setupRecovery();
        setPhrase(newPhrase);
        const indices = getVerificationIndices();
        setVerificationIndices(indices);
        setStep('display');
    };
    
    const handleVerificationInputChange = (index: number, value: string) => {
        const newWords = [...verificationWords];
        newWords[index] = value.toLowerCase().trim();
        setVerificationWords(newWords);
    };

    const handleVerify = async () => {
        setError(null);
        const phraseToVerify = verificationIndices.map((vi, index) => ({ index: vi, word: phrase[vi] }));
        
        let isValid = true;
        for (let i = 0; i < phraseToVerify.length; i++) {
            if (verificationWords[i] !== phraseToVerify[i].word) {
                isValid = false;
                break;
            }
        }
        
        if (isValid) {
            setStep('done');
        } else {
            setError('Eines oder mehrere Wörter sind nicht korrekt. Bitte überprüfen Sie Ihre Notizen.');
        }
    };
    
    const renderContent = () => {
        switch (step) {
            case 'intro':
                return (
                    <div className="space-y-4 text-center">
                        <ShieldCheckIcon className="w-16 h-16 text-[var(--color-accent-text)] mx-auto" />
                        <h3 className="text-xl font-bold">Notfall-Wiederherstellung einrichten</h3>
                        <p className="text-[var(--color-text-secondary)]">Erstellen Sie eine 12-Wörter-Wiederherstellungsphrase. Dies ist die <strong className="text-[var(--color-text-primary)]">einzige Möglichkeit</strong>, Ihr Passwort zurückzusetzen, falls Sie es vergessen.</p>
                        <div className="text-[var(--color-danger-text)] text-sm bg-[var(--color-danger-background-transparent)] p-3 rounded-md border border-[var(--color-danger-border)] text-left">
                            <p className="font-bold">Bewahren Sie diese Phrase an einem sicheren, geheimen Ort auf. Jeder, der Zugriff auf diese Phrase hat, hat vollen Zugriff auf Ihre Daten.</p>
                        </div>
                        <div className="pt-4">
                            <Button onClick={handleGeneratePhrase} className="w-full">Phrase jetzt erstellen</Button>
                        </div>
                    </div>
                );
            case 'warning':
                return (
                     <div className="space-y-4 text-center">
                        <ExclamationCircleIcon className="w-16 h-16 text-[var(--color-warning-text)] mx-auto" />
                        <h3 className="text-xl font-bold">Achtung: Bestehende Phrase</h3>
                        <p className="text-[var(--color-text-secondary)]">Sie haben bereits eine Wiederherstellungsphrase eingerichtet. Das erneute Anzeigen der alten Phrase ist aus Sicherheitsgründen nicht möglich.</p>
                        <div className="text-[var(--color-danger-text)] text-sm bg-[var(--color-danger-background-transparent)] p-3 rounded-md border border-[var(--color-danger-border)] text-left">
                            <p className="font-bold">Wenn Sie fortfahren, wird eine neue 12-Wörter-Phrase erstellt. Ihre alte Phrase wird dadurch ungültig!</p>
                        </div>
                        <div className="flex justify-end space-x-3 pt-4">
                            <Button variant="secondary" onClick={onClose}>Abbrechen</Button>
                            <Button variant="danger" onClick={handleGeneratePhrase}>Ja, neue Phrase erstellen</Button>
                        </div>
                    </div>
                );
            case 'display':
                return (
                    <div className="space-y-4">
                        <div className="bg-[var(--color-warning-secondary-transparent)] p-3 rounded-md text-center">
                            <p className="text-[var(--color-warning-text)] text-sm font-semibold">Schreiben Sie diese 12 Wörter in der exakten Reihenfolge auf und bewahren Sie sie sicher auf.</p>
                        </div>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-3 p-4 bg-[var(--color-ui-secondary)] rounded-lg border border-[var(--color-border)]">
                            {phrase.map((word, index) => (
                                <div key={index} className="flex font-mono">
                                    <span className="text-[var(--color-text-tertiary)] w-6">{index + 1}.</span>
                                    <span className="font-semibold text-[var(--color-text-primary)]">{word}</span>
                                </div>
                            ))}
                        </div>
                        <div className="pt-2">
                            <Button onClick={() => setStep('verify')} className="w-full">Weiter zur Bestätigung</Button>
                        </div>
                    </div>
                );
            case 'verify':
                return (
                    <div className="space-y-4">
                        <p className="text-[var(--color-text-secondary)]">Bitte geben Sie die angeforderten Wörter Ihrer Phrase ein, um zu bestätigen, dass Sie sie korrekt notiert haben.</p>
                        <div className="space-y-3">
                            {verificationIndices.map((vi, index) => (
                                <div key={vi}>
                                    <label htmlFor={`word-${vi}`} className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                                        Wort Nr. {vi + 1}
                                    </label>
                                    <input
                                        id={`word-${vi}`}
                                        type="text"
                                        value={verificationWords[index]}
                                        onChange={(e) => handleVerificationInputChange(index, e.target.value)}
                                        className="h-9 w-full px-2 bg-[var(--color-ui-secondary)] border border-[var(--color-border)] rounded-md text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-border-focus)] transition-colors"
                                        autoCapitalize="none" autoCorrect="off"
                                    />
                                </div>
                            ))}
                        </div>
                        {error && <p className="text-sm text-center text-[var(--color-danger-text)]">{error}</p>}
                        <div className="pt-2">
                            <Button onClick={handleVerify} className="w-full" disabled={verificationWords.some(w => w === '')}>
                                Phrase bestätigen
                            </Button>
                        </div>
                    </div>
                );
            case 'done':
                 return (
                    <div className="space-y-4 text-center">
                        <CheckCircleIcon className="w-16 h-16 text-[var(--color-success-text)] mx-auto" />
                        <h3 className="text-xl font-bold">Einrichtung erfolgreich!</h3>
                        <p className="text-[var(--color-text-secondary)]">Ihre Notfall-Wiederherstellungsphrase ist jetzt aktiv. Bewahren Sie Ihre Notizen an einem sicheren Ort auf.</p>
                        <div className="pt-4">
                            <Button onClick={onClose} className="w-full">Fertig</Button>
                        </div>
                    </div>
                );
        }
        return null;
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Wiederherstellungsphrase">
            {renderContent()}
        </Modal>
    );
};

export default RecoveryPhraseSetupModal;