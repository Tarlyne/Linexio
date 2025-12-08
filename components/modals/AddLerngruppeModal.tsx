import React, { useState, useEffect, useRef } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Select from '../ui/Select';
import { useLerngruppenContext } from '../../context/LerngruppenContext';
import { PREDEFINED_NOTENSYSTEME } from '../../context/types';

interface AddLerngruppeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddLerngruppeModal: React.FC<AddLerngruppeModalProps> = ({ isOpen, onClose }) => {
  const { handleAddLerngruppe } = useLerngruppenContext();

  const [name, setName] = useState('');
  const [fach, setFach] = useState('');
  const [notensystemId, setNotensystemId] = useState(PREDEFINED_NOTENSYSTEME[0]?.id || '');
  
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setFach('');
      setNotensystemId(PREDEFINED_NOTENSYSTEME[0]?.id || '');
      setTimeout(() => nameInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && fach.trim() && notensystemId) {
      handleAddLerngruppe({ name, fach, notensystemId });
      onClose();
    }
  };

  const notensystemOptions = PREDEFINED_NOTENSYSTEME.map(system => ({
      value: system.id,
      label: system.name,
  }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Neue Lerngruppe erstellen">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          ref={nameInputRef}
          label="Name der Lerngruppe"
          id="lg-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="z.B. Mathe 10a"
          required
        />
        <Input
          label="Fach"
          id="lg-fach"
          value={fach}
          onChange={(e) => setFach(e.target.value)}
          placeholder="z.B. Mathematik"
          required
        />
        <Select
          label="Notensystem"
          id="lg-notensystem"
          value={notensystemId}
          onChange={(e) => setNotensystemId(e.target.value)}
          options={notensystemOptions}
          required
        />
        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Abbrechen
          </Button>
          <Button type="submit" disabled={!name.trim() || !fach.trim() || !notensystemId}>
            Erstellen
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddLerngruppeModal;