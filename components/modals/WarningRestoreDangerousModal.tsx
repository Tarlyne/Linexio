import React from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { ExclamationCircleIcon } from '../icons';

interface WarningRestoreDangerousModalProps {
  isOpen: boolean;
  onClose: () => void;
  backupVersion: string;
}

const WarningRestoreDangerousModal: React.FC<WarningRestoreDangerousModalProps> = ({ isOpen, onClose, backupVersion }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Wiederherstellung blockiert">
        <div className="space-y-4 text-center">
            <ExclamationCircleIcon className="w-16 h-16 text-[var(--color-danger-text)] mx-auto" />
            <h3 className="text-xl font-bold text-[var(--color-text-primary)]">Inkompatible Version</h3>
            <p className="text-[var(--color-text-secondary)]">
                Dieses Backup wurde mit einer neueren App-Version ({backupVersion}) erstellt. Ein Import in die aktuell installierte, ältere Version würde Ihre Daten beschädigen.
            </p>
            <div className="text-sm bg-[var(--color-ui-secondary)] p-3 rounded-md border border-[var(--color-border)] text-left">
                <p className="font-bold text-[var(--color-text-primary)]">Empfohlene Vorgehensweise:</p>
                <p className="text-[var(--color-text-tertiary)] mt-1">
                    Bitte aktualisieren Sie zuerst die Linexio-App auf die neueste Version und versuchen Sie die Wiederherstellung anschließend erneut.
                </p>
            </div>
            <div className="flex justify-end pt-4">
                <Button type="button" onClick={onClose}>
                    Verstanden
                </Button>
            </div>
        </div>
    </Modal>
  );
};

export default WarningRestoreDangerousModal;
