import React from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

interface ConfirmDeleteChecklistenEintragModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  eintragName: string;
}

const ConfirmDeleteChecklistenEintragModal: React.FC<ConfirmDeleteChecklistenEintragModalProps> = ({ isOpen, onClose, onConfirm, eintragName }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Eintrag löschen bestätigen">
      <div className="space-y-4">
        <p className="text-[var(--color-text-secondary)]">
          Sind Sie sicher, dass Sie den Eintrag <strong className="text-[var(--color-text-primary)]">{eintragName}</strong> und alle zugehörigen Status-Daten dauerhaft löschen möchten?
        </p>
         <p className="text-[var(--color-danger-text)] text-sm">
          Diese Aktion kann nicht rückgängig gemacht werden.
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

export default ConfirmDeleteChecklistenEintragModal;