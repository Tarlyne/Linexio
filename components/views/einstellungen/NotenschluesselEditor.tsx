import React, { useState, useEffect } from 'react';
import { Notensystem, NotenschluesselEintrag } from '../../../context/types';
import Button from '../../ui/Button';
import { RefreshIcon } from '../../icons';

interface NotenschluesselEditorProps {
    notensystem: Notensystem;
    schluessel: NotenschluesselEintrag[];
    defaultSchluessel: NotenschluesselEintrag[];
    onUpdate: (newSchluessel: NotenschluesselEintrag[]) => Promise<void>;
}

const NotenschluesselEditor: React.FC<NotenschluesselEditorProps> = ({ notensystem, schluessel, defaultSchluessel, onUpdate }) => {
    const [localSchluessel, setLocalSchluessel] = useState<NotenschluesselEintrag[]>([]);

    useEffect(() => {
        setLocalSchluessel(schluessel);
    }, [schluessel]);

    const handleProzentChange = (pointValue: number, newProzentString: string) => {
        const updatedSchluessel = localSchluessel.map(e => {
            if (e.pointValue === pointValue) {
                // FIX: Explicitly declare the type of the new value to guide TypeScript's inference.
                // This prevents the type of `prozentAb` from being incorrectly widened to a generic `string`
                // when set to `''`, which would cause a type mismatch with the state `NotenschluesselEintrag[]`.
                let newProzentAb: number | '' = e.prozentAb;
                if (newProzentString === '') {
                    newProzentAb = '';
                } else {
                    const newProzent = parseInt(newProzentString, 10);
                    if (!isNaN(newProzent)) {
                        newProzentAb = Math.max(0, Math.min(100, newProzent));
                    }
                }
                 // Only return a new object if the value has actually changed.
                if (newProzentAb !== e.prozentAb) {
                    return { ...e, prozentAb: newProzentAb };
                }
            }
            return e;
        });
        setLocalSchluessel(updatedSchluessel);
    };

    const handleSave = () => {
        // Filter out entries with empty strings before saving
        const validSchluessel = localSchluessel.filter(e => e.prozentAb !== '').map(e => ({...e, prozentAb: Number(e.prozentAb)}));
        // The button is disabled if any field is invalid, making the original `if` condition redundant and the likely source of this bug.
        onUpdate(validSchluessel);
    };

    const handleReset = () => {
        setLocalSchluessel(defaultSchluessel);
        onUpdate(defaultSchluessel);
    };
    
    const hasChanges = JSON.stringify(localSchluessel) !== JSON.stringify(schluessel);
    const isInvalid = localSchluessel.some(e => e.prozentAb === '');

    return (
        <div className="space-y-4 max-w-sm animate-fade-in">
            <div className="border border-[var(--color-border)] rounded-lg overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center p-3 bg-[var(--color-ui-secondary)]/50 border-b border-[var(--color-border)]">
                    <h4 className="font-bold text-sm text-[var(--color-text-tertiary)] uppercase tracking-wider">Note</h4>
                    <h4 className="font-bold text-sm text-[var(--color-text-tertiary)] uppercase tracking-wider">Prozentwert (ab)</h4>
                </div>

                {/* Rows */}
                <div>
                    {notensystem.noten.map((note, index) => {
                        const eintrag = localSchluessel.find(e => e.pointValue === note.pointValue);
                        if (!eintrag) return null;

                        return (
                            <div key={note.pointValue} className={`flex justify-between items-center gap-4 p-2 px-3 hover:bg-[var(--color-ui-highlight)] ${index !== 0 ? 'border-t border-[var(--color-border)]' : ''}`}>
                                <label htmlFor={`prozent-${note.pointValue}`} className="font-semibold text-[var(--color-text-primary)]">
                                    {note.displayValue}
                                </label>
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="number"
                                        id={`prozent-${note.pointValue}`}
                                        value={eintrag.prozentAb}
                                        onChange={(e) => handleProzentChange(note.pointValue, e.target.value)}
                                        className="h-9 w-24 px-2 bg-[var(--color-ui-secondary)] border border-[var(--color-border)] rounded-md text-[var(--color-text-primary)] text-right"
                                        min="0"
                                        max="100"
                                    />
                                    <span className="text-[var(--color-text-tertiary)]">%</span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
            <div className="flex justify-end items-center space-x-4">
                 <Button variant="secondary" onClick={handleReset}>
                    <RefreshIcon />
                    <span>Auf Standard zurücksetzen</span>
                </Button>
                <Button onClick={handleSave} disabled={!hasChanges || isInvalid}>
                    Änderungen speichern
                </Button>
            </div>
        </div>
    );
};

export default NotenschluesselEditor;