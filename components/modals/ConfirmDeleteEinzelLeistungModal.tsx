import React from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { EinzelLeistung } from '../../context/types';

interface ConfirmDeleteEinzelLeistungModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (id: string) => void;
  einzelLeistung: EinzelLeistung | null;
}

const ConfirmDeleteEinzelLeistungModal: React.FC<ConfirmDeleteEinzelLeistungModalProps> = ({ isOpen, onClose, onConfirm, einzelLeistung }) => {
  if (!einzelLeistung) return null;

  const handleConfirmClick = () => {
    onConfirm(einzelLeistung.id);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Löschen bestätigen">
      <div className="space-y-4">
        <p className="text-[var(--color-text-secondary)]">
          Sind Sie sicher, dass Sie die Notenspalte <strong className="text-[var(--color-text-primary)]">{einzelLeistung.name}</strong> dauerhaft löschen möchten?
        </p>
        <p className="text-[var(--color-danger-text)] text-sm bg-[var(--color-danger-background-transparent)] p-3 rounded-md border border-[var(--color-danger-border)]">
          <strong>Achtung:</strong> Alle in dieser Spalte eingetragenen Noten werden ebenfalls unwiderruflich gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.
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

export default ConfirmDeleteEinzelLeistungModal;