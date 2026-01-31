import React, { useState, useRef, useEffect } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { useSecurityContext } from '../../context/SecurityContext';
import { useToastContext } from '../../context/ToastContext';
import { validateNewPassword } from '../../utils/validation';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
    const { changePassword, logout } = useSecurityContext();
    const { showToast } = useToastContext();
    
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    
    const currentPasswordInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setError(null);
            setTimeout(() => currentPasswordInputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const validationError = validateNewPassword(newPassword, confirmPassword);
        if (validationError) {
            setError(validationError);
            return;
        }
        
        setError(null);
        setIsLoading(true);
        try {
            await changePassword(currentPassword, newPassword);
            // Success path
            showToast('Passwort erfolgreich geändert. Sie wurden abgemeldet.', 'success');
            onClose();
            // Short delay to allow modal to close before locking app for smoother UX
            setTimeout(() => logout(), 50);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setIsLoading(false);
        }
    };
    
    const isFormValid = currentPassword && newPassword && confirmPassword;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Passwort ändern">
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    ref={currentPasswordInputRef}
                    label="Aktuelles Passwort"
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                />
                <Input
                    label="Neues Passwort"
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                />
                <Input
                    label="Neues Passwort bestätigen"
                    id="confirm-new-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                />
                
                {error && <p className="text-sm text-center text-[var(--color-danger-text)]">{error}</p>}

                <div className="flex justify-end space-x-3 pt-4">
                    <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
                        Abbrechen
                    </Button>
                    <Button type="submit" disabled={!isFormValid || isLoading}>
                        {isLoading ? 'Speichere...' : 'Passwort speichern'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default ChangePasswordModal;