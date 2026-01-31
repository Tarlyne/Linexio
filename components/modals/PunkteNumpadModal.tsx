import React, { useState, useEffect, useRef } from 'react';
import { TrashIcon, ChevronRightIcon, BackspaceIcon } from '../icons';
import Button from '../ui/Button';
import { useNotenContext } from '../../context/NotenContext';
import { useModalContext } from '../../context/ModalContext';

interface PunkteNumpadModalProps {
  onSaveAndNext: (punkte: number | null) => void;
}

const PunkteNumpadModal: React.FC<PunkteNumpadModalProps> = ({ onSaveAndNext }) => {
  const notenContext = useNotenContext();
  const modalContext = useModalContext();

  const { handlePunkteNumpadSave } = notenContext;
  const {
    punkteNumpadContext,
    closePunkteNumpadModal,
    isLastInSequenceForPunkteNumpad,
  } = modalContext;

  const [currentValue, setCurrentValue] = useState<string>('');
  const deleteButtonRef = useRef<HTMLButtonElement>(null);

  const isOpen = !!punkteNumpadContext;
  const schueler = punkteNumpadContext?.schueler;
  
  useEffect(() => {
    if (punkteNumpadContext) {
      setCurrentValue(punkteNumpadContext.currentPunkte !== null ? String(punkteNumpadContext.currentPunkte) : '');
    }
  }, [punkteNumpadContext]);
  
  const handleNumberClick = (num: string) => {
    const valueToAppend = num === ',' ? '.' : num;
    if (valueToAppend === '.' && currentValue.includes('.')) return;
    setCurrentValue(prev => prev + valueToAppend);
  };
  
  const handleBackspace = () => {
    setCurrentValue(prev => prev.slice(0, -1));
  };
  
  const getPunkte = (): number | null => {
    if (currentValue === '') return null;
    const val = parseFloat(currentValue);
    return isNaN(val) ? null : val;
  }

  const handleDelete = () => {
    setCurrentValue('');
    deleteButtonRef.current?.blur();
  };

  const handleSave = () => {
      if(punkteNumpadContext) {
        handlePunkteNumpadSave(punkteNumpadContext.schueler.id, punkteNumpadContext.aufgabeId, getPunkte());
      }
      closePunkteNumpadModal();
  };
  const handleNext = () => onSaveAndNext(getPunkte());
  
  const numpadKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', ',', '0'];

  if (!isOpen || !schueler || !punkteNumpadContext) return null;
  
  const { maxPunkte, aufgabeName } = punkteNumpadContext;

  const isValidFormat = (value: string): boolean => {
    if (value === '') return true;
    const num = parseFloat(value);
    return !isNaN(num) && Number.isInteger(num * 2);
  };

  const displayPunkte = getPunkte();
  const isFormatInvalid = !isValidFormat(currentValue);
  const isBonus = displayPunkte !== null && displayPunkte > maxPunkte;

  const hasError = isFormatInvalid || isBonus;
  const isSaveDisabled = isFormatInvalid;
  const isNextDisabled = isLastInSequenceForPunkteNumpad || isFormatInvalid;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4" onClick={closePunkteNumpadModal}>
      <div className="bg-[var(--color-ui-primary)] rounded-xl shadow-2xl w-full max-w-[260px] border border-[var(--color-border)] animate-fade-in flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-[var(--color-border)]">
            <p className="text-center text-lg font-bold text-[var(--color-accent-text)] truncate">{schueler.firstName} {schueler.lastName}</p>
            <p className="text-center text-sm text-[var(--color-text-tertiary)] -mt-1 mb-1 font-semibold">{aufgabeName} ({maxPunkte} P.)</p>
            <div className={`flex flex-col items-center justify-center transition-colors relative rounded-lg ${hasError ? 'bg-[var(--color-danger-background-transparent)]' : ''}`}>
                <div className="h-20 flex items-center justify-center">
                    <span className={`text-5xl font-bold ${hasError ? 'text-[var(--color-danger-text)]' : 'text-[var(--color-text-primary)]'}`}>{currentValue.replace('.', ',') || <span className="text-[var(--color-ui-tertiary)]">-</span>}</span>
                </div>
                {isFormatInvalid && (
                    <p className="text-xs text-[var(--color-danger-text)] pb-2 -mt-2">
                        Nur ganze Zahlen oder ,5-Schritte erlaubt.
                    </p>
                )}
            </div>
        </div>
        
        <div className="p-2 space-y-1.5">
            <div className="grid grid-cols-3 gap-1.5">
                {numpadKeys.map(key => (
                    <button key={key} onClick={() => handleNumberClick(key)} className="h-14 rounded-lg text-xl font-semibold transition-colors bg-[var(--color-ui-secondary)] text-[var(--color-text-primary)] hover:bg-[var(--color-ui-tertiary)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--color-ui-primary)] focus:ring-[var(--color-accent-border-focus)]">
                        {key}
                    </button>
                ))}
                <button onClick={handleBackspace} className="h-14 rounded-lg flex items-center justify-center bg-[var(--color-ui-secondary)] hover:bg-[var(--color-ui-tertiary)] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--color-ui-primary)] focus:ring-[var(--color-accent-border-focus)]">
                    <BackspaceIcon className="w-6 h-6 text-[var(--color-text-primary)]"/>
                </button>
            </div>
             <div className="grid grid-cols-3 gap-1.5">
                 <button 
                    ref={deleteButtonRef}
                    onClick={handleDelete} 
                    className="h-14 rounded-lg flex items-center justify-center bg-[var(--color-ui-secondary)] hover:bg-[var(--color-ui-tertiary)] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--color-ui-primary)] focus:ring-[var(--color-accent-border-focus)]" 
                    aria-label="Eingabe löschen"
                >
                    <TrashIcon className="w-6 h-6 text-[var(--color-danger-text)]"/>
                </button>

                {/* Placeholder for consistent 3-column layout */}
                <div />
               
                <button 
                    onClick={handleNext} 
                    disabled={isNextDisabled}
                    className="h-14 rounded-lg flex items-center justify-center bg-[var(--color-ui-secondary)] hover:bg-[var(--color-ui-tertiary)] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--color-ui-primary)] focus:ring-[var(--color-accent-border-focus)] disabled:opacity-50 disabled:cursor-not-allowed" 
                    aria-label="Speichern & Nächste Aufgabe"
                >
                    <ChevronRightIcon className="w-6 h-6 text-[var(--color-success-text)]"/>
                </button>
            </div>
        </div>

        <div className="p-2 border-t border-[var(--color-border)]">
            <Button onClick={handleSave} disabled={isSaveDisabled} className="w-full !py-3 !text-base">
                Speichern & Schließen
            </Button>
        </div>
      </div>
    </div>
  );
};

export default PunkteNumpadModal;