import React from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { InformationCircleIcon } from '../icons';

interface DownloadAnleitungModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const DownloadAnleitungModal: React.FC<DownloadAnleitungModalProps> = ({ isOpen, onClose, onConfirm }) => {
  
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Anleitung zum Speichern">
      <div className="space-y-4 text-center">
        <InformationCircleIcon className="w-16 h-16 text-[var(--color-accent-text)] mx-auto" />
        <p className="text-[var(--color-text-secondary)]">
          Ihre Datei wird gleich geöffnet. Um sie zu speichern, tippen Sie anschließend in der Vorschau auf das <strong className="text-[var(--color-text-primary)]">Teilen-Symbol</strong> (Quadrat mit Pfeil) und sichern Sie die Datei an einem gewünschten Ort.
        </p>
        <div className="flex justify-end pt-4">
          <Button type="button" onClick={handleConfirm}>
            Verstanden & Fortfahren
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default DownloadAnleitungModal;