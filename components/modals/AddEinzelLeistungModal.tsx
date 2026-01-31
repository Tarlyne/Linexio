import React, { useState, useRef, useEffect } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { useNotenContext } from '../../context/NotenContext';
import { useModalContext } from '../../context/ModalContext';

const AddEinzelLeistungModal: React.FC = () => {
  const notenContext = useNotenContext();
  const modalContext = useModalContext();

  const { handleAddEinzelLeistung } = notenContext;
  const { addEinzelLeistungContext, closeAddEinzelLeistungModal } = modalContext;

  const [name, setName] = useState('');
  const [gewichtung, setGewichtung] = useState('1');
  const nameInputRef = useRef<HTMLInputElement>(null);
  
  const isOpen = !!addEinzelLeistungContext;

  useEffect(() => {
    if (isOpen) {
      setName('');
      setGewichtung('1');
      setTimeout(() => nameInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && addEinzelLeistungContext) {
      handleAddEinzelLeistung(addEinzelLeistungContext.leistungsnachweisId, name.trim(), parseInt(gewichtung, 10) || 1);
      closeAddEinzelLeistungModal();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={closeAddEinzelLeistungModal} title="Neue Notenspalte hinzufügen">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          ref={nameInputRef}
          label="Bezeichnung"
          id="el-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="z.B. KW 42, Vokabeltest"
          required
        />
        <Input
          label="Gewichtung"
          id="el-gewichtung"
          type="number"
          min="1"
          step="1"
          value={gewichtung}
          onChange={(e) => setGewichtung(e.target.value)}
          required
        />
        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="secondary" onClick={closeAddEinzelLeistungModal}>
            Abbrechen
          </Button>
          <Button type="submit" disabled={!name.trim() || !gewichtung.trim()}>
            Hinzufügen
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddEinzelLeistungModal;