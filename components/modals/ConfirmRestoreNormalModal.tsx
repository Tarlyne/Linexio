import React from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

interface ConfirmRestoreNormalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  backupVersion: string;
}

const ConfirmRestoreNormalModal: React.FC<ConfirmRestoreNormalModalProps> = ({ isOpen, onClose, onConfirm, backupVersion }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Hinweis zur Version">
      <div className="space-y-4">
        <p className="text-[var(--color-text-secondary)]">
          Das Backup wurde mit einer älteren App-Version ({backupVersion}) erstellt.
        </p>
        <div className="text-sm bg-[var(--color-ui-secondary)] p-3 rounded-md border border-[var(--color-border)]">
          <p className="font-bold text-[var(--color-text-primary)]">Dies ist ein normaler und sicherer Vorgang.</p>
          <p className="text-[var(--color-text-tertiary)] mt-1">
            Ihre Daten werden jetzt wiederhergestellt. Die App-Struktur wird dabei automatisch auf den neuesten Stand gebracht.
          </p>
        </div>
        <div className="flex justify-end space-x-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Abbrechen
          </Button>
          <Button 
            type="button" 
            variant="primary"
            onClick={onConfirm}
          >
            Fortfahren
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmRestoreNormalModal;
