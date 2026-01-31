import React from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { SpinnerIcon } from '../icons';

interface ConfirmRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  fileName: string;
}

const ConfirmRestoreModal: React.FC<ConfirmRestoreModalProps> = ({ isOpen, onClose, onConfirm, fileName }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Wiederherstellung bestätigen">
      <div className="space-y-4">
        <p className="text-[var(--color-text-secondary)]">
          Sie sind im Begriff, alle Daten in Linexio aus der Datei <strong className="text-[var(--color-text-primary)]">{fileName}</strong> wiederherzustellen.
        </p>
        <div className="text-[var(--color-danger-text)] text-sm bg-[var(--color-danger-background-transparent)] p-3 rounded-md border border-[var(--color-danger-border)]">
          <p className="font-bold">WARNUNG: Diese Aktion kann nicht rückgängig gemacht werden.</p>
          <p>Alle Ihre aktuellen Lerngruppen, SchülerInnen, Noten und Einstellungen werden unwiderruflich mit den Daten aus dem Backup überschrieben.</p>
        </div>
        <p className="text-[var(--color-text-secondary)]">
          Stellen Sie sicher, dass Sie das richtige Backup ausgewählt haben.
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
            Weiter zur Passworteingabe
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmRestoreModal;