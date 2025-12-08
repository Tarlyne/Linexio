import React, { useMemo } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { useLerngruppenContext } from '../../context/LerngruppenContext';
import { Lerngruppe } from '../../context/types';

interface ConfirmDeleteLerngruppeModalProps {
  lerngruppeToDelete: Lerngruppe | null;
  onClose: () => void;
}

const ConfirmDeleteLerngruppeModal: React.FC<ConfirmDeleteLerngruppeModalProps> = ({ lerngruppeToDelete, onClose }) => {
  const { lerngruppen, handleDeleteLerngruppe } = useLerngruppenContext();

  const isOpen = !!lerngruppeToDelete;
  if (!lerngruppeToDelete) return null;
  
  const schuelerCountInGroup = lerngruppeToDelete.schuelerIds.length;

  const schuelerToDeleteCount = useMemo(() => {
    if (!lerngruppeToDelete) return 0;

    const remainingLerngruppen = lerngruppen.filter(lg => lg.id !== lerngruppeToDelete.id);
    const allRemainingSchuelerIds = new Set(remainingLerngruppen.flatMap(lg => lg.schuelerIds));

    return lerngruppeToDelete.schuelerIds.filter(sId => !allRemainingSchuelerIds.has(sId)).length;
  }, [lerngruppeToDelete, lerngruppen]);

  const handleConfirm = () => {
    handleDeleteLerngruppe(lerngruppeToDelete.id);
    onClose();
  }

  const schuelerToKeepCount = schuelerCountInGroup - schuelerToDeleteCount;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Löschen bestätigen">
      <div className="space-y-4">
        <p className="text-[var(--color-text-secondary)]">
          Sind Sie sicher, dass Sie die Lerngruppe <strong className="text-[var(--color-text-primary)]">{lerngruppeToDelete.name}</strong> dauerhaft löschen möchten?
        </p>
        <div className="text-[var(--color-warning-text)] text-sm bg-[var(--color-warning-secondary-transparent)] p-3 rounded-md border border-[var(--color-border)]">
          <p>
            Diese Gruppe enthält <strong className="text-[var(--color-text-primary)]">{schuelerCountInGroup}</strong> SchülerInnen.
          </p>
          {schuelerToDeleteCount > 0 && (
            <p className="mt-2 text-[var(--color-danger-text)]">
              <strong className="font-bold">{schuelerToDeleteCount}</strong> davon werden <strong className="font-bold">endgültig gelöscht</strong>, da sie in keiner anderen Lerngruppe sind.
            </p>
          )}
          {schuelerToKeepCount > 0 && (
            <p className="mt-2 text-[var(--color-text-secondary)]">
              <strong className="text-[var(--color-text-primary)]">{schuelerToKeepCount}</strong> SchülerIn{schuelerToKeepCount !== 1 && 'nen'} bleiben erhalten, da sie noch in anderen Lerngruppen eingetragen sind.
            </p>
          )}
        </div>
        <div className="flex justify-end space-x-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Abbrechen
          </Button>
          <Button 
            type="button" 
            variant="danger"
            onClick={handleConfirm}
          >
            Endgültig löschen
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDeleteLerngruppeModal;