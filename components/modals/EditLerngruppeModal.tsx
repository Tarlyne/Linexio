import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Select from '../ui/Select';
import { useLerngruppenContext } from '../../context/LerngruppenContext';
import { PREDEFINED_NOTENSYSTEME, Lerngruppe } from '../../context/types';
import { TrashIcon } from '../icons';

interface EditLerngruppeModalProps {
  lerngruppeToEdit: Lerngruppe | null;
  onClose: () => void;
  onDeleteRequest: (lerngruppe: Lerngruppe) => void;
}

const EditLerngruppeModal: React.FC<EditLerngruppeModalProps> = ({ lerngruppeToEdit, onClose, onDeleteRequest }) => {
  const { handleUpdateLerngruppe } = useLerngruppenContext();

  const [name, setName] = useState('');
  const [fach, setFach] = useState('');
  const [notensystemId, setNotensystemId] = useState('');
  
  const isOpen = !!lerngruppeToEdit;

  useEffect(() => {
    if (lerngruppeToEdit) {
      setName(lerngruppeToEdit.name);
      setFach(lerngruppeToEdit.fach);
      setNotensystemId(lerngruppeToEdit.notensystemId);
    }
  }, [lerngruppeToEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (lerngruppeToEdit && name.trim() && fach.trim() && notensystemId) {
      handleUpdateLerngruppe({ ...lerngruppeToEdit, name: name.trim(), fach: fach.trim(), notensystemId });
      onClose();
    }
  };

  const notensystemOptions = PREDEFINED_NOTENSYSTEME.map(system => ({
      value: system.id,
      label: system.name,
  }));
  
  if (!lerngruppeToEdit) return null;

  const hasChanges = name.trim() !== lerngruppeToEdit.name || fach.trim() !== lerngruppeToEdit.fach || notensystemId !== lerngruppeToEdit.notensystemId;
  const isFormValid = !!(name.trim() && fach.trim() && notensystemId);
  const isSaveDisabled = !isFormValid || !hasChanges;

  const handleDeleteClick = () => {
    onClose();
    onDeleteRequest(lerngruppeToEdit);
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Lerngruppe bearbeiten">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Name der Lerngruppe"
          id="lg-name-edit"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="z.B. Mathe 10a"
          required
        />
        <Input
          label="Fach"
          id="lg-fach-edit"
          value={fach}
          onChange={(e) => setFach(e.target.value)}
          placeholder="z.B. Mathematik"
          required
        />
        <Select
          label="Notensystem"
          id="lg-notensystem-edit"
          value={notensystemId}
          onChange={(e) => setNotensystemId(e.target.value)}
          options={notensystemOptions}
          required
        />
        <div className="flex items-center justify-between pt-4">
          <Button 
            type="button" 
            variant="danger" 
            onClick={handleDeleteClick}
          >
            <TrashIcon />
            <span>Löschen</span>
          </Button>
          <div className="flex space-x-3">
            <Button type="button" variant="secondary" onClick={onClose}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={isSaveDisabled}>
              Speichern
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default EditLerngruppeModal;