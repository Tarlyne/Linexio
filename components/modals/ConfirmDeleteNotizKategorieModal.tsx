import React from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { NotizKategorie } from '../../context/types';
import { useToolsContext } from '../../context/ToolsContext';

interface ConfirmDeleteNotizKategorieModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  kategorieToDelete: NotizKategorie | null;
}

const ConfirmDeleteNotizKategorieModal: React.FC<ConfirmDeleteNotizKategorieModalProps> = ({ isOpen, onClose, onConfirm, kategorieToDelete }) => {
  const { onDeleteNotizKategorie } = useToolsContext();

  if (!kategorieToDelete) return null;

  const handleConfirmClick = async () => {
    await onDeleteNotizKategorie(kategorieToDelete.id);
    onConfirm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Kategorie löschen bestätigen">
      <div className="space-y-4">
        <p className="text-[var(--color-text-secondary)]">
          Sind Sie sicher, dass Sie die Kategorie <strong className="text-[var(--color-text-primary)]">{kategorieToDelete.name}</strong> dauerhaft löschen möchten?
        </p>
        <div className="text-[var(--color-danger-text)] text-sm bg-[var(--color-danger-background-transparent)] p-3 rounded-md border border-[var(--color-danger-border)]">
          <p className="font-bold">Achtung: Alle in dieser Kategorie enthaltenen Notizen werden ebenfalls unwiderruflich gelöscht.</p>
        </div>
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

export default ConfirmDeleteNotizKategorieModal;
