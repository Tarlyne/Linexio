import React, { useState, useEffect, useRef } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { NotenKategorieTyp } from '../../context/types';

export interface AddLeistungsnachweisModalContext {
  halbjahr: 1 | 2;
  typ: NotenKategorieTyp;
}

interface AddLeistungsnachweisModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: { bezeichnung: string; gewichtung: number; typ: 'sammelnote' | 'klausur'; inhalt?: string; context: AddLeistungsnachweisModalContext }) => void;
  context: AddLeistungsnachweisModalContext | null;
}

const AddLeistungsnachweisModal: React.FC<AddLeistungsnachweisModalProps> = ({ isOpen, onClose, onAdd, context }) => {
  const [bezeichnung, setBezeichnung] = useState('');
  const [gewichtung, setGewichtung] = useState('1');
  const [isKlausur, setIsKlausur] = useState(false);
  const [inhalt, setInhalt] = useState('');
  const bezeichnungInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        bezeichnungInputRef.current?.focus();
      }, 100);
    } else {
      // Reset form when modal is closed
      setBezeichnung('');
      setGewichtung('1');
      setIsKlausur(false);
      setInhalt('');
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (bezeichnung.trim() && context) {
      const typ = isKlausur ? 'klausur' : 'sammelnote';
      onAdd({
        bezeichnung: bezeichnung.trim(),
        gewichtung: parseInt(gewichtung, 10) || 1,
        typ,
        inhalt: isKlausur ? inhalt.trim() : undefined,
        context,
      });
      onClose(); // Close after adding
    }
  };

  const subtitle = context ? `Für: ${context.halbjahr}. Halbjahr, ${context.typ === 'mündlich' ? 'Mündlich' : 'Schriftlich'}` : '';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Neuen Leistungsnachweis erstellen">
      <form onSubmit={handleSubmit} className="space-y-6">
        <p className="text-sm text-[var(--color-accent-text)] -mt-2">{subtitle}</p>
        <Input
          ref={bezeichnungInputRef}
          label="Bezeichnung"
          id="ln-bezeichnung"
          value={bezeichnung}
          onChange={(e) => setBezeichnung(e.target.value)}
          placeholder="z.B. Mitarbeit, Vokabeltest, 1. Klausur..."
          required
        />
        
        <div className="flex items-start pt-2">
            <div className="flex items-center h-5">
                <input
                    id="is-klausur-checkbox"
                    name="is-klausur-checkbox"
                    type="checkbox"
                    checked={isKlausur}
                    onChange={(e) => setIsKlausur(e.target.checked)}
                    className="h-4 w-4 accent-[var(--color-accent-primary)] rounded border-[var(--color-border)] focus:ring-[var(--color-accent-border-focus)]"
                />
            </div>
            <div className="ml-3 text-sm">
                <label htmlFor="is-klausur-checkbox" className="font-medium text-[var(--color-text-primary)] cursor-pointer">
                    Dies ist eine Klausur mit Rohpunkten.
                </label>
                <p className="text-[var(--color-text-tertiary)]">Aktivieren, um Punkte statt Noten einzugeben und einen Notenschlüssel anzuwenden.</p>
            </div>
        </div>

        {isKlausur && (
            <Input
                label="Inhalt / Thema (Optional)"
                id="ln-inhalt"
                value={inhalt}
                onChange={(e) => setInhalt(e.target.value)}
                placeholder="z.B. Lineare Funktionen"
            />
        )}

        <Input
          label="Gewichtung"
          id="ln-gewichtung"
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
          <Button type="submit" disabled={!bezeichnung.trim() || !gewichtung.trim()}>
            Erstellen
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddLeistungsnachweisModal;
