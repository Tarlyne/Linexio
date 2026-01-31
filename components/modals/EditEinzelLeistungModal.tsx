import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { useNotenContext } from '../../context/NotenContext';
import { useModalContext } from '../../context/ModalContext';
import { TrashIcon } from '../icons';

const EditEinzelLeistungModal: React.FC = () => {
  const notenContext = useNotenContext();
  const modalContext = useModalContext();

  const { handleUpdateEinzelLeistung } = notenContext;
  const { 
    einzelLeistungToEdit, 
    closeEditEinzelLeistungModal,
    openConfirmDeleteEinzelLeistungModal 
  } = modalContext;

  const [name, setName] = useState('');
  const [gewichtung, setGewichtung] = useState('1');
  
  const isOpen = !!einzelLeistungToEdit;

  useEffect(() => {
    if (einzelLeistungToEdit) {
      setName(einzelLeistungToEdit.name);
      setGewichtung(String(einzelLeistungToEdit.gewichtung));
    }
  }, [einzelLeistungToEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (einzelLeistungToEdit && name.trim()) {
      handleUpdateEinzelLeistung({ ...einzelLeistungToEdit, name: name.trim(), gewichtung: parseInt(gewichtung, 10) || 1 });
      closeEditEinzelLeistungModal();
    }
  };
  
  const handleDelete = () => {
    if (einzelLeistungToEdit) {
      openConfirmDeleteEinzelLeistungModal(einzelLeistungToEdit);
      closeEditEinzelLeistungModal();
    }
  }

  if (!einzelLeistungToEdit) return null;
  
  const hasChanges = name.trim() !== einzelLeistungToEdit.name || (parseInt(gewichtung, 10) || 0) !== einzelLeistungToEdit.gewichtung;
  const isFormValid = name.trim() && gewichtung.trim();

  return (
    <Modal isOpen={isOpen} onClose={closeEditEinzelLeistungModal} title="Notenspalte bearbeiten">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Bezeichnung"
          id="el-name-edit"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Input
          label="Gewichtung"
          id="el-gewichtung-edit"
          type="number"
          min="1"
          step="1"
          value={gewichtung}
          onChange={(e) => setGewichtung(e.target.value)}
          required
        />
        <div className="flex items-center justify-between pt-4">
          <Button type="button" variant="danger" onClick={handleDelete}>
            <TrashIcon />
            <span>Spalte löschen</span>
          </Button>
          <div className="flex space-x-3">
            <Button type="button" variant="secondary" onClick={closeEditEinzelLeistungModal}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={!isFormValid || !hasChanges}>
              Speichern
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default EditEinzelLeistungModal;