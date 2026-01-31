import React, { useState, useEffect, useRef } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { Leistungsnachweis, Notenkategorie, EditModalItem, EditModalContext } from '../../context/types';

interface EditPropertiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedItem: EditModalItem) => void;
  context: EditModalContext | null;
}

const EditLeistungsnachweisModal: React.FC<EditPropertiesModalProps> = ({ isOpen, onClose, onUpdate, context }) => {
  const [bezeichnung, setBezeichnung] = useState('');
  const [gewichtung, setGewichtung] = useState('1');
  const [inhalt, setInhalt] = useState('');
  const bezeichnungInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && context) {
      setBezeichnung(context.item.name);
      setGewichtung(String(context.item.gewichtung));
      
      if (context.item._type === 'leistungsnachweis') {
          setInhalt((context.item as Leistungsnachweis).inhalt || '');
      }
      
      setTimeout(() => {
        bezeichnungInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, context]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (context && bezeichnung.trim()) {
      const updatedItem: EditModalItem = {
        ...context.item,
        name: bezeichnung.trim(),
        gewichtung: parseInt(gewichtung, 10) || 1,
      };

      if (context.item._type === 'leistungsnachweis' && (context.item as Leistungsnachweis).typ === 'klausur') {
         (updatedItem as Leistungsnachweis).inhalt = inhalt.trim();
      }

      onUpdate(updatedItem);
      onClose();
    }
  };

  if (!context) return null;

  const isKlausur = context.item._type === 'leistungsnachweis' && (context.item as Leistungsnachweis).typ === 'klausur';

  const hasChanges = bezeichnung.trim() !== context.item.name || 
                     (parseInt(gewichtung, 10) || 0) !== context.item.gewichtung ||
                     (isKlausur && inhalt.trim() !== ((context.item as Leistungsnachweis).inhalt || ''));
                     
  const isSaveDisabled = !bezeichnung.trim() || !gewichtung.trim() || !hasChanges;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={context.title || 'Bearbeiten'}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          ref={bezeichnungInputRef}
          label={context.isNameEditable ? 'Bezeichnung' : 'Kategorie'}
          id="item-edit-bezeichnung"
          value={bezeichnung}
          onChange={(e) => setBezeichnung(e.target.value)}
          required
          disabled={!context.isNameEditable}
        />
        
        {isKlausur && (
            <Input
                label="Inhalt / Thema (Optional)"
                id="item-edit-inhalt"
                value={inhalt}
                onChange={(e) => setInhalt(e.target.value)}
                placeholder="z.B. Lineare Funktionen"
            />
        )}

        <Input
          label="Gewichtung"
          id="item-edit-gewichtung"
          type="number"
          min="1"
          step="1"
          value={gewichtung}
          onChange={(e) => setGewichtung(e.target.value)}
          required
        />
        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Abbrechen
          </Button>
          <Button type="submit" disabled={isSaveDisabled}>
            Speichern
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditLeistungsnachweisModal;
