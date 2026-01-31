import React, { useState, useRef, useEffect } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { SpinnerIcon } from '../icons';

interface PasswordConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (password: string) => Promise<{ success: boolean; error?: string }>;
  onSuccess: () => void;
  title: string;
  description: string;
}

const PasswordConfirmModal: React.FC<PasswordConfirmModalProps> = ({ isOpen, onClose, onConfirm, onSuccess, title, description }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const passwordInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setPassword('');
            setError(null);
            setIsLoading(false);
            setTimeout(() => passwordInputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!password) return;

        setError(null);
        setIsLoading(true);
        
        const result = await onConfirm(password);
        
        if (result.success) {
            onSuccess();
        } else {
            setError(result.error || 'Ein unbekannter Fehler ist aufgetreten.');
            setPassword('');
            // Keep modal open and focus input for retry
            passwordInputRef.current?.focus();
        }
        
        setIsLoading(false);
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-sm text-[var(--color-text-secondary)] -mt-2">
                    {description}
                </p>
                <Input
                    ref={passwordInputRef}
                    label="Aktuelles Passwort"
                    id="confirm-action-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                
                {error && <p className="text-sm text-center text-[var(--color-danger-text)]">{error}</p>}

                <div className="flex justify-end space-x-3 pt-4">
                    <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
                        Abbrechen
                    </Button>
                    <Button type="submit" disabled={!password || isLoading}>
                        {isLoading && <SpinnerIcon />}
                        <span>Bestätigen</span>
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default PasswordConfirmModal;