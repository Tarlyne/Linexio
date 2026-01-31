import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { ExclamationCircleIcon } from '../icons';

interface ConfirmSchoolYearAdvanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (deleteImages: boolean) => void;
  currentYear: string;
  nextYear: string;
}

const ConfirmSchoolYearAdvanceModal: React.FC<ConfirmSchoolYearAdvanceModalProps> = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    currentYear, 
    nextYear 
}) => {
  const [deleteImages, setDeleteImages] = useState(true);

  const handleConfirm = () => {
      onConfirm(deleteImages);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Schuljahr abschließen">
      <div className="space-y-4">
        <div className="flex items-start space-x-3 bg-[var(--color-ui-secondary)] p-4 rounded-lg border border-[var(--color-border)]">
            <ExclamationCircleIcon className="w-6 h-6 text-[var(--color-accent-text)] flex-shrink-0 mt-0.5" />
            <div>
                <p className="text-[var(--color-text-primary)] font-bold mb-1">
                    Wechsel von {currentYear} nach {nextYear}
                </p>
                <p className="text-sm text-[var(--color-text-secondary)]">
                    Sie sind dabei, das aktuelle Schuljahr ({currentYear}) abzuschließen. Es wird automatisch ins Archiv verschoben.
                </p>
            </div>
        </div>

        <p className="text-[var(--color-text-secondary)]">
            Alle bestehenden Lerngruppen und Noten bleiben im Archiv erhalten und können weiterhin eingesehen, aber nicht mehr bearbeitet werden.
        </p>
        
        {/* Checkbox for image deletion */}
        <label className="flex items-start space-x-3 p-3 rounded-md hover:bg-[var(--color-ui-secondary)] cursor-pointer border border-transparent hover:border-[var(--color-border)] transition-colors">
            <input 
                type="checkbox" 
                checked={deleteImages} 
                onChange={(e) => setDeleteImages(e.target.checked)} 
                className="mt-1 h-5 w-5 accent-[var(--color-accent-primary)] rounded border-[var(--color-border)] focus:ring-[var(--color-accent-border-focus)]"
            />
            <div className="flex-1">
                <span className="block text-sm font-bold text-[var(--color-text-primary)]">Schülerbilder aus diesem Jahr löschen</span>
                <span className="block text-xs text-[var(--color-text-tertiary)] mt-1">
                    Empfohlen, um Speicherplatz zu sparen. Profilbilder verbrauchen viel Speicher und sind in alten Schuljahren meist nicht mehr relevant. Die restlichen Daten (Namen, Noten) bleiben erhalten.
                </span>
            </div>
        </label>
        
        <p className="text-[var(--color-text-secondary)] font-medium pt-2">
            Möchten Sie das neue Schuljahr <strong>{nextYear}</strong> jetzt starten?
        </p>

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Abbrechen
          </Button>
          <Button 
            type="button" 
            onClick={handleConfirm}
          >
            Ja, Schuljahr abschließen
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmSchoolYearAdvanceModal;