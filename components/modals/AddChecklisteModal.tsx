import React, { useState, useRef, useEffect } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';

interface AddChecklisteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (name: string) => void;
}

const AddChecklisteModal: React.FC<AddChecklisteModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [name, setName] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => nameInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onAdd(name.trim());
      setName('');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Neues Checklisten-Register erstellen">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          ref={nameInputRef}
          label="Name des Registers"
          id="cl-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="z.B. Hausaufgaben, Material..."
          required
        />
        <div className="flex justify-end space-x-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Abbrechen
          </Button>
          <Button type="submit" disabled={!name.trim()}>
            Erstellen
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddChecklisteModal;
