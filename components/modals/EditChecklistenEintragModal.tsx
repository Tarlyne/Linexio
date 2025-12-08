import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { ChecklistenEintrag } from '../../context/types';
import { TrashIcon } from '../icons';

interface EditChecklistenEintragModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (newName: string, newFaelligkeitsdatum?: string) => void;
  onDelete: () => void;
  eintrag: ChecklistenEintrag;
}

const EditChecklistenEintragModal: React.FC<EditChecklistenEintragModalProps> = ({ isOpen, onClose, onUpdate, onDelete, eintrag }) => {
  const [name, setName] = useState('');
  const [faelligkeitsdatum, setFaelligkeitsdatum] = useState('');

  useEffect(() => {
    if (eintrag) {
      setName(eintrag.name);
      setFaelligkeitsdatum(eintrag.faelligkeitsdatum || '');
    }
  }, [eintrag, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onUpdate(name.trim(), faelligkeitsdatum);
      onClose();
    }
  };

  const hasChanges = name.trim() !== eintrag.name || faelligkeitsdatum !== (eintrag.faelligkeitsdatum || '');

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Eintrag bearbeiten">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Name des Eintrags"
          id="cle-name-edit"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="z.B. HA 25.10."
          required
        />
        <Input
            label="Fälligkeitsdatum (optional)"
            id="cle-faelligkeitsdatum-edit"
            type="date"
            value={faelligkeitsdatum}
            onChange={(e) => setFaelligkeitsdatum(e.target.value)}
        />
        <div className="flex items-center justify-between pt-4">
          <Button 
            type="button" 
            variant="danger" 
            onClick={onDelete}
          >
            <TrashIcon />
            <span>Löschen</span>
          </Button>
          <div className="flex-grow flex justify-end space-x-3">
            <Button type="button" variant="secondary" onClick={onClose}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={!name.trim() || !hasChanges}>
              Speichern
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default EditChecklistenEintragModal;