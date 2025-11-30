import React, { useState, useEffect, useMemo } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { useNotenContext } from '../../context/NotenContext';
import { ManuelleNoteModalContext, Note, Notensystem } from '../../context/types';

interface ManuelleNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  context: ManuelleNoteModalContext | null;
}

const NoteButton: React.FC<{ note: Note, isSelected: boolean, onClick: () => void }> = ({ note, isSelected, onClick }) => {
    const isBadGrade = note.pointValue <= 3;
    const textColorClass = !isSelected && isBadGrade ? 'text-[var(--color-danger-text)]' : 'text-[var(--color-text-primary)]';
    
    return (
        <button
            onClick={onClick}
            className={`h-14 rounded-lg text-xl font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--color-ui-primary)] focus:ring-[var(--color-accent-border-focus)]
              ${isSelected
                ? 'bg-[var(--color-accent-primary)] text-[var(--color-text-primary)] ring-2 ring-[var(--color-accent-border-focus)]'
                : `bg-[var(--color-ui-secondary)] ${textColorClass} hover:bg-[var(--color-ui-tertiary)]`
              }
            `}
        >
            {note.displayValue}
        </button>
    );
};

const ManuelleNoteModal: React.FC<ManuelleNoteModalProps> = ({ isOpen, onClose, context }) => {
  const { notensystemForLerngruppe, onSetManuelleNote, onDeleteManuelleNote, manuelleNoten } = useNotenContext();
  const [selectedNote, setSelectedNote] = useState<string | null>(null);

  const aktuelleManuelleNote = useMemo(() => {
    if (!context) return null;
    return manuelleNoten.find(mn => 
      mn.schuelerId === context.schueler.id && 
      mn.lerngruppeId === context.lerngruppeId && 
      mn.ziel === context.ziel
    )?.note || null;
  }, [manuelleNoten, context]);

  useEffect(() => {
    if (isOpen) {
        setSelectedNote(aktuelleManuelleNote);
    }
  }, [isOpen, aktuelleManuelleNote]);

  if (!context || !notensystemForLerngruppe) return null;

  const { schueler, lerngruppeId, ziel, berechneteNote, berechneteDezimalNote } = context;

  const zielText = {
    hj1: '1. Halbjahr',
    hj2: '2. Halbjahr',
    gesamt: 'Gesamtnote'
  }[ziel];

  const sortedNotes = [...notensystemForLerngruppe.noten].sort((a, b) => b.pointValue - a.pointValue);

  const handleSave = () => {
    if (selectedNote) {
      onSetManuelleNote(schueler.id, lerngruppeId, ziel, selectedNote);
    }
    onClose();
  };

  const handleReset = () => {
    onDeleteManuelleNote(schueler.id, lerngruppeId, ziel);
    onClose();
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Manuelle Note für ${zielText}`} size="compact">
      <div className="space-y-4">
        <p className="text-center text-[var(--color-text-secondary)]">
          SchülerIn: <strong className="text-[var(--color-text-primary)]">{schueler.lastName}, {schueler.firstName}</strong>
        </p>
        <div className="text-center bg-[var(--color-ui-secondary)]/50 p-3 rounded-lg">
            <p className="text-sm text-[var(--color-text-secondary)]">
                Berechnete Note: <span className="font-bold text-lg text-[var(--color-text-primary)]">{berechneteNote || 'N/A'}</span>
            </p>
            {berechneteDezimalNote && (
                <p className="text-xs text-[var(--color-text-tertiary)] -mt-1">{berechneteDezimalNote}</p>
            )}
        </div>
        
        <div className="grid grid-cols-3 gap-1.5 pt-2">
            {sortedNotes.map(note => 
                <NoteButton 
                    key={note.pointValue} 
                    note={note} 
                    isSelected={selectedNote === note.displayValue}
                    onClick={() => setSelectedNote(note.displayValue)}
                />
            )}
        </div>
        
        <div className="space-y-2 pt-4">
            <div className="grid grid-cols-2 gap-2">
                <Button type="button" variant="secondary" onClick={onClose}>
                  Abbrechen
                </Button>
                <Button type="button" onClick={handleSave} disabled={selectedNote === aktuelleManuelleNote}>
                  Speichern
                </Button>
            </div>
            <Button
                type="button"
                variant="secondary"
                className="w-full !bg-transparent !text-[var(--color-danger-text)] !shadow-none hover:!bg-[var(--color-danger-background-transparent)]"
                onClick={handleReset}
                disabled={!aktuelleManuelleNote}
            >
                Manuelle Note entfernen
            </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ManuelleNoteModal;