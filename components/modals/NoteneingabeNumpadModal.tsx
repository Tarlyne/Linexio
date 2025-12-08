import React, { useState, useEffect, useMemo, useRef } from 'react';
import { TrashIcon, ArrowDownIcon, ChatBubbleBottomCenterTextIcon } from '../icons';
import Button from '../ui/Button';
import { useLerngruppenContext } from '../../context/LerngruppenContext';
import { useNotenContext } from '../../context/NotenContext';
import { useModalContext } from '../../context/ModalContext';
import { PREDEFINED_NOTENSYSTEME, Note } from '../../context/types';

interface NoteneingabeNumpadModalProps {
  onSaveAndNext: (note: string, bemerkung?: string) => void;
}

const NoteneingabeNumpadModal: React.FC<NoteneingabeNumpadModalProps> = ({ onSaveAndNext }) => {
  const lerngruppenContext = useLerngruppenContext();
  const notenContext = useNotenContext();
  const modalContext = useModalContext();

  const { selectedLerngruppe } = lerngruppenContext;
  const { handleNumpadSave } = notenContext;
  const { 
    numpadContext, 
    closeNumpadModal, 
    isLastStudentForNumpad, 
  } = modalContext;

  const [currentValue, setCurrentValue] = useState('');
  const [bemerkung, setBemerkung] = useState('');
  const [isBemerkungOpen, setIsBemerkungOpen] = useState(false);
  const deleteButtonRef = useRef<HTMLButtonElement>(null);
  
  const isOpen = !!numpadContext;
  const lerngruppe = selectedLerngruppe;
  const schueler = numpadContext?.schueler;

  const notensystem = useMemo(() => 
    lerngruppe ? PREDEFINED_NOTENSYSTEME.find(ns => ns.id === lerngruppe.notensystemId) || PREDEFINED_NOTENSYSTEME[0] : null,
    [lerngruppe]
  );
  
  const sortedNotes = useMemo(() => {
    if (!notensystem) return [];
    return [...notensystem.noten].sort((a, b) => b.pointValue - a.pointValue);
  }, [notensystem]);

  const worstNote = useMemo(() => sortedNotes[sortedNotes.length - 1], [sortedNotes]);
  const notesForGrid = useMemo(() => worstNote ? sortedNotes.slice(0, -1) : sortedNotes, [sortedNotes, worstNote]);

  useEffect(() => {
    if (numpadContext) {
      setCurrentValue(numpadContext.currentNote);
      const hasBemerkung = !!numpadContext.currentBemerkung;
      setBemerkung(numpadContext.currentBemerkung || '');
      setIsBemerkungOpen(hasBemerkung);
    }
  }, [numpadContext]);
  
  const handleNoteClick = (note: string) => {
    setCurrentValue(note);
  };
  
  const handleSave = () => {
      if(numpadContext){
        handleNumpadSave(numpadContext.schueler.id, numpadContext.einzelLeistungId, currentValue, bemerkung);
      }
      closeNumpadModal();
  };

  const handleDelete = () => {
    setCurrentValue('');
    setBemerkung('');
    deleteButtonRef.current?.blur();
  }

  const handleNextStudent = () => {
    onSaveAndNext(currentValue, bemerkung);
  }
  
  if (!isOpen || !lerngruppe || !schueler || !notensystem) return null;
  
  const NoteButton: React.FC<{ noteValue: string }> = ({ noteValue }) => {
    const note = notensystem.noten.find(n => n.displayValue === noteValue);
    if (!note) return null;

    const isBadGrade = note.pointValue <= 3;
    const isSelected = currentValue === note.displayValue;
    const textColorClass = !isSelected && isBadGrade ? 'text-[var(--color-danger-text)]' : 'text-[var(--color-text-primary)]';
    
    return (
        <button
            onClick={() => handleNoteClick(note.displayValue)}
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

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
      aria-modal="true" role="dialog"
      onClick={closeNumpadModal}
    >
      <div 
        className="bg-[var(--color-ui-primary)] rounded-xl shadow-2xl w-full max-w-[260px] border border-[var(--color-border)] animate-fade-in flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-[var(--color-border)] relative">
            <p className="text-center text-lg font-bold text-[var(--color-accent-text)] truncate">{schueler.firstName} {schueler.lastName}</p>
            <div className="h-20 flex items-center justify-center">
                <span className="text-5xl font-bold text-[var(--color-text-primary)]">{currentValue}</span>
            </div>
            <button 
                onClick={() => setIsBemerkungOpen(p => !p)} 
                className="absolute bottom-2 right-2 p-2 rounded-full hover:bg-[var(--color-ui-secondary)] transition-colors"
                aria-label="Bemerkung ein-/ausblenden"
            >
                <ChatBubbleBottomCenterTextIcon className={`w-6 h-6 transition-colors ${bemerkung ? 'text-[var(--color-accent-text)]' : 'text-[var(--color-text-tertiary)]'}`} />
            </button>
        </div>
        
        {isBemerkungOpen && (
            <div className="p-2 border-b border-[var(--color-border)] animate-fade-in">
                <textarea
                    value={bemerkung}
                    onChange={(e) => setBemerkung(e.target.value)}
                    placeholder="Bemerkung hinzufügen..."
                    className="w-full h-24 p-2 bg-[var(--color-ui-secondary)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-border-focus)] focus:border-[var(--color-accent-border-focus)] transition-colors resize-none"
                    autoFocus
                />
            </div>
        )}

        <div className="p-2 space-y-1.5">
            <div className="grid grid-cols-3 gap-1.5">
                {notesForGrid.map(note => <NoteButton key={note.displayValue} noteValue={note.displayValue} />)}
            </div>
            <div className="grid grid-cols-3 gap-1.5">
                <button 
                    ref={deleteButtonRef}
                    onClick={handleDelete} 
                    className="h-14 rounded-lg flex items-center justify-center bg-[var(--color-ui-secondary)] hover:bg-[var(--color-ui-tertiary)] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--color-ui-primary)] focus:ring-[var(--color-accent-border-focus)]" 
                    aria-label="Note löschen"
                >
                    <TrashIcon className="w-6 h-6 text-[var(--color-danger-text)]"/>
                </button>
                
                {worstNote && <NoteButton noteValue={worstNote.displayValue} />}
               
                <button 
                    onClick={handleNextStudent} 
                    disabled={isLastStudentForNumpad}
                    className="h-14 rounded-lg flex items-center justify-center bg-[var(--color-ui-secondary)] hover:bg-[var(--color-ui-tertiary)] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--color-ui-primary)] focus:ring-[var(--color-accent-border-focus)] disabled:opacity-50 disabled:cursor-not-allowed" 
                    aria-label="Speichern & Nächste/r SchülerIn"
                >
                    <ArrowDownIcon className="w-6 h-6 text-[var(--color-success-text)]"/>
                </button>
            </div>
        </div>
        
        <div className="p-2 border-t border-[var(--color-border)]">
            <Button onClick={handleSave} className="w-full !py-3 !text-base">
                Speichern & Schließen
            </Button>
        </div>
      </div>
    </div>
  );
};

export default NoteneingabeNumpadModal;