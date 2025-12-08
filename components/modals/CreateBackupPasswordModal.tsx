import React, { useState, useRef, useEffect } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { SpinnerIcon } from '../icons';
import { validateNewPassword } from '../../utils/validation';

interface CreateBackupPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (password: string) => Promise<void>;
  isCreating: boolean;
}

const CreateBackupPasswordModal: React.FC<CreateBackupPasswordModalProps> = ({ isOpen, onClose, onConfirm, isCreating }) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const passwordInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setPassword('');
            setConfirmPassword('');
            setError(null);
            setTimeout(() => passwordInputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const validationError = validateNewPassword(password, confirmPassword);
        if (validationError) {
            setError(validationError);
            return;
        }
        
        setError(null);
        await onConfirm(password);
        onClose();
    };
    
    const isFormValid = password && confirmPassword;

    return (
        <Modal isOpen={isOpen} onClose={isCreating ? () => {} : onClose} title="Backup mit Passwort schützen">
            <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-sm text-[var(--color-text-secondary)] -mt-2">
                    Legen Sie ein Passwort fest, um diese Backup-Datei zu verschlüsseln. Sie benötigen dieses Passwort, um die Daten wiederherzustellen.
                </p>
                <Input
                    ref={passwordInputRef}
                    label="Backup-Passwort"
                    id="backup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <Input
                    label="Passwort bestätigen"
                    id="backup-confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                />
                
                {error && <p className="text-sm text-center text-[var(--color-danger-text)]">{error}</p>}

                <div className="flex justify-end space-x-3 pt-4">
                    <Button type="button" variant="secondary" onClick={onClose} disabled={isCreating}>
                        Abbrechen
                    </Button>
                    <Button type="submit" disabled={!isFormValid || isCreating}>
                        {isCreating && <SpinnerIcon />}
                        <span>{isCreating ? 'Erstelle...' : 'Backup erstellen'}</span>
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default CreateBackupPasswordModal;