import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { Checkliste } from '../../context/types';
import { TrashIcon } from '../icons';

interface EditChecklisteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (newName: string) => void;
  onDelete: () => void;
  checkliste: Checkliste;
}

const EditChecklisteModal: React.FC<EditChecklisteModalProps> = ({ isOpen, onClose, onUpdate, onDelete, checkliste }) => {
  const [name, setName] = useState('');

  useEffect(() => {
    if (checkliste) {
      setName(checkliste.name);
    }
  }, [checkliste, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onUpdate(name.trim());
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Register bearbeiten">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Name des Registers"
          id="cl-name-edit"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="z.B. Hausaufgaben"
          required
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
          <div className="flex space-x-3">
            <Button type="button" variant="secondary" onClick={onClose}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={!name.trim() || name.trim() === checkliste.name}>
              Speichern
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default EditChecklisteModal;
