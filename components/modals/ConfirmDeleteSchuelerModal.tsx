import React, { useMemo } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { useLerngruppenContext } from '../../context/LerngruppenContext';
import { Schueler } from '../../context/types';

interface ConfirmDeleteSchuelerModalProps {
  schuelerToDelete: Schueler | null;
  onClose: () => void;
  lerngruppeId: string;
}

const ConfirmDeleteSchuelerModal: React.FC<ConfirmDeleteSchuelerModalProps> = ({ schuelerToDelete, onClose, lerngruppeId }) => {
  const { handleRemoveSchuelerFromLerngruppe, isSchuelerInOtherLerngruppen } = useLerngruppenContext();

  const isOpen = !!schuelerToDelete;

  const isLastGroup = useMemo(() => {
    if (!schuelerToDelete) return false;
    return !isSchuelerInOtherLerngruppen(schuelerToDelete.id, lerngruppeId);
  }, [schuelerToDelete, lerngruppeId, isSchuelerInOtherLerngruppen]);

  if (!schuelerToDelete) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isLastGroup ? "Endgültig löschen?" : "Entfernen bestätigen"}>
      <div className="space-y-4">
        <p className="text-[var(--color-text-secondary)]">
          Sind Sie sicher, dass Sie <strong className="text-[var(--color-text-primary)]">{schuelerToDelete.firstName} {schuelerToDelete.lastName}</strong> {isLastGroup ? 'endgültig löschen' : 'aus dieser Lerngruppe entfernen'} möchten?
        </p>
        
        {isLastGroup ? (
          <p className="text-sm text-[var(--color-danger-text)] bg-[var(--color-danger-background-transparent)] p-3 rounded-md border border-[var(--color-danger-border)]">
            <strong>Achtung:</strong> Dies ist die letzte Lerngruppe für diese/n SchülerIn. Die Aktion löscht den Datensatz <strong>endgültig</strong> aus der App.
          </p>
        ) : (
          <p className="text-sm text-[var(--color-text-tertiary)] bg-[var(--color-ui-secondary)] p-3 rounded-md">
            Der Schüler / die Schülerin wird nur aus dieser Lerngruppe entfernt - seine / ihre Daten bleiben in anderen Lerngruppen erhalten.
          </p>
        )}
        
        <div className="flex justify-end space-x-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Abbrechen
          </Button>
          <Button 
            type="button" 
            variant="danger"
            onClick={() => {
              handleRemoveSchuelerFromLerngruppe(schuelerToDelete.id, lerngruppeId);
              onClose();
            }}
          >
            {isLastGroup ? 'Endgültig löschen' : 'Aus Lerngruppe entfernen'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDeleteSchuelerModal;