import React, { useState, useRef, useEffect } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { useNotenContext } from '../../context/NotenContext';
import { useModalContext } from '../../context/ModalContext';

const AddKlausuraufgabeModal: React.FC = () => {
  const notenContext = useNotenContext();
  const modalContext = useModalContext();

  const { handleAddKlausuraufgabe } = notenContext;
  const { addKlausuraufgabeContext, closeAddKlausuraufgabeModal } = modalContext;

  const [name, setName] = useState('');
  const [maxPunkte, setMaxPunkte] = useState('10');
  const [inhalt, setInhalt] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);
  
  const isOpen = !!addKlausuraufgabeContext;

  useEffect(() => {
    if (isOpen) {
      setName('');
      setMaxPunkte('10');
      setInhalt('');
      setTimeout(() => nameInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && addKlausuraufgabeContext) {
      handleAddKlausuraufgabe(
          addKlausuraufgabeContext.leistungsnachweisId, 
          name.trim(), 
          parseInt(maxPunkte, 10) || 1,
          inhalt.trim() || undefined
      );
      closeAddKlausuraufgabeModal();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={closeAddKlausuraufgabeModal} title="Neue Aufgabe hinzufügen">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          ref={nameInputRef}
          label="Bezeichnung"
          id="ka-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="z.B. Aufgabe 1, Rechtschreibung"
          required
        />
        
        <Input
            label="Inhalt / Thema (Optional)"
            id="ka-inhalt"
            value={inhalt}
            onChange={(e) => setInhalt(e.target.value)}
            placeholder="z.B. Grammatik, Vokabeln..."
        />

        <Input
          label="Zu erreichende Punkte"
          id="ka-maxPunkte"
          type="number"
          min="1"
          step="1"
          value={maxPunkte}
          onChange={(e) => setMaxPunkte(e.target.value)}
          required
        />
        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="secondary" onClick={closeAddKlausuraufgabeModal}>
            Abbrechen
          </Button>
          <Button type="submit" disabled={!name.trim() || !maxPunkte.trim()}>
            Hinzufügen
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddKlausuraufgabeModal;