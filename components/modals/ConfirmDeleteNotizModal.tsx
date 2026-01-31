import React from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Notiz } from '../../context/types';
import { useToolsContext } from '../../context/ToolsContext';

interface ConfirmDeleteNotizModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  notizToDelete: Notiz | null;
}

const ConfirmDeleteNotizModal: React.FC<ConfirmDeleteNotizModalProps> = ({ isOpen, onClose, onConfirm, notizToDelete }) => {
  const { onDeleteNotiz } = useToolsContext();

  if (!notizToDelete) return null;

  const handleConfirmClick = async () => {
    await onDeleteNotiz(notizToDelete.id);
    onConfirm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Notiz löschen bestätigen">
      <div className="space-y-4">
        <p className="text-[var(--color-text-secondary)]">
          Sind Sie sicher, dass Sie die Notiz <strong className="text-[var(--color-text-primary)]">{notizToDelete.title}</strong> dauerhaft löschen möchten?
        </p>
        <p className="text-sm text-[var(--color-danger-text)]">
          Diese Aktion kann nicht rückgängig gemacht werden.
        </p>
        <div className="flex justify-end space-x-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Abbrechen
          </Button>
          <Button type="button" variant="danger" onClick={handleConfirmClick}>
            Endgültig löschen
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDeleteNotizModal;
