import React, { useState, useEffect, useMemo } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { useNotenContext } from '../../context/NotenContext';
import { useUIContext } from '../../context/UIContext';
import { useModalContext } from '../../context/ModalContext';
import { TrashIcon } from '../icons';

const EditKlausuraufgabeModal: React.FC = () => {
  const notenContext = useNotenContext();
  const modalContext = useModalContext();
  const uiContext = useUIContext();

  const { handleUpdateKlausuraufgabe, leistungsnachweise } = notenContext;
  const { selectedLeistungsnachweisId } = uiContext;
  const { 
    klausuraufgabeToEdit: aufgabe, 
    closeEditKlausuraufgabeModal, 
    openConfirmDeleteKlausuraufgabeModal,
  } = modalContext;

  const selectedLeistungsnachweis = useMemo(() => 
    leistungsnachweise.find(ln => ln.id === selectedLeistungsnachweisId),
    [leistungsnachweise, selectedLeistungsnachweisId]
  );

  const [name, setName] = useState('');
  const [maxPunkte, setMaxPunkte] = useState('1');
  const [inhalt, setInhalt] = useState('');
  
  const isOpen = !!aufgabe;

  useEffect(() => {
    if (aufgabe) {
      setName(aufgabe.name);
      setMaxPunkte(String(aufgabe.maxPunkte));
      setInhalt(aufgabe.inhalt || '');
    }
  }, [aufgabe]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (aufgabe && selectedLeistungsnachweis && name.trim()) {
      handleUpdateKlausuraufgabe(selectedLeistungsnachweis.id, { 
          ...aufgabe, 
          name: name.trim(), 
          maxPunkte: parseInt(maxPunkte, 10) || 1,
          inhalt: inhalt.trim() || undefined
      });
      closeEditKlausuraufgabeModal();
    }
  };
  
  const handleDelete = () => {
      if (aufgabe) {
          openConfirmDeleteKlausuraufgabeModal(aufgabe);
          closeEditKlausuraufgabeModal();
      }
  };
  
  if (!aufgabe || !selectedLeistungsnachweis) return null;
  
  const hasChanges = name.trim() !== aufgabe.name || 
                     (parseInt(maxPunkte, 10) || 0) !== aufgabe.maxPunkte ||
                     inhalt.trim() !== (aufgabe.inhalt || '');
                     
  const isFormValid = name.trim() && maxPunkte.trim();

  return (
    <Modal isOpen={isOpen} onClose={closeEditKlausuraufgabeModal} title="Aufgabe bearbeiten">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Bezeichnung"
          id="ka-name-edit"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        
        <Input
            label="Inhalt / Thema (Optional)"
            id="ka-inhalt-edit"
            value={inhalt}
            onChange={(e) => setInhalt(e.target.value)}
            placeholder="z.B. Grammatik, Vokabeln..."
        />

        <Input
          label="Zu erreichende Punkte"
          id="ka-maxPunkte-edit"
          type="number"
          min="1"
          step="1"
          value={maxPunkte}
          onChange={(e) => setMaxPunkte(e.target.value)}
          required
        />
        <div className="flex w-full flex-wrap items-center gap-3 pt-4">
          <Button type="button" variant="danger" onClick={handleDelete} className="mr-auto">
            <TrashIcon />
            <span>Löschen</span>
          </Button>
          <Button type="button" variant="secondary" onClick={closeEditKlausuraufgabeModal}>
            Abbrechen
          </Button>
          <Button type="submit" disabled={!isFormValid || !hasChanges}>
            Speichern
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditKlausuraufgabeModal;