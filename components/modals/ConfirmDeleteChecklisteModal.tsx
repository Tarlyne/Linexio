import React from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

interface ConfirmDeleteChecklisteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  checklisteName: string;
}

const ConfirmDeleteChecklisteModal: React.FC<ConfirmDeleteChecklisteModalProps> = ({ isOpen, onClose, onConfirm, checklisteName }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Register löschen bestätigen">
      <div className="space-y-4">
        <p className="text-[var(--color-text-secondary)]">
          Sind Sie sicher, dass Sie das Register <strong className="text-[var(--color-text-primary)]">{checklisteName}</strong> dauerhaft löschen möchten?
        </p>
         <p className="text-[var(--color-danger-text)] text-sm bg-[var(--color-danger-background-transparent)] p-3 rounded-md border border-[var(--color-danger-border)]">
          <strong>Achtung:</strong> Alle zugehörigen Spalten und Status-Daten werden ebenfalls unwiderruflich gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.
        </p>
        <div className="flex justify-end space-x-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Abbrechen
          </Button>
          <Button 
            type="button" 
            variant="danger"
            onClick={() => {
                onConfirm();
                onClose();
            }}
          >
            Endgültig löschen
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDeleteChecklisteModal;