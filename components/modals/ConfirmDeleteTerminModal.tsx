import React from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Termin } from '../../context/types';

interface ConfirmDeleteTerminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  termin: Termin | null;
}

const ConfirmDeleteTerminModal: React.FC<ConfirmDeleteTerminModalProps> = ({ isOpen, onClose, onConfirm, termin }) => {
  if (!termin) return null;

  const dateFormatted = new Date(termin.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Termin löschen">
      <div className="space-y-4">
        <p className="text-[var(--color-text-secondary)]">
          Sind Sie sicher, dass Sie den Termin <strong className="text-[var(--color-text-primary)]">{termin.title}</strong> am {dateFormatted} unwiderruflich löschen möchten?
        </p>
        
        <div className="flex justify-end space-x-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Abbrechen
          </Button>
          <Button 
            type="button" 
            variant="danger"
            onClick={onConfirm}
          >
            Endgültig löschen
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDeleteTerminModal;