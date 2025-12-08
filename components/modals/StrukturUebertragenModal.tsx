import React, { useState, useMemo } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { useLerngruppenContext } from '../../context/LerngruppenContext';
import { useUIContext } from '../../context/UIContext';
import { Lerngruppe } from '../../context/types';
import SegmentedControl, { SegmentedControlOption } from '../ui/SegmentedControl';

interface StrukturUebertragenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: (data: { scope: 'gesamt' | 'hj1' | 'hj2', targetIds: string[] }) => void;
}

type Scope = 'gesamt' | 'hj1' | 'hj2';

const StrukturUebertragenModal: React.FC<StrukturUebertragenModalProps> = ({ isOpen, onClose, onContinue }) => {
    const { lerngruppen, selectedLerngruppe } = useLerngruppenContext();
    const { currentSchoolYear } = useUIContext();

    const [scope, setScope] = useState<Scope>('gesamt');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const targetLerngruppen = useMemo(() => 
        lerngruppen.filter((lg: Lerngruppe) => lg.schuljahr === currentSchoolYear && lg.id !== selectedLerngruppe?.id)
    , [lerngruppen, currentSchoolYear, selectedLerngruppe]);

    const handleToggle = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    const handleContinue = () => {
        onContinue({ scope, targetIds: Array.from(selectedIds) });
    };

    const scopeText = {
        gesamt: 'des gesamten Schuljahres',
        hj1: 'des 1. Halbjahres',
        hj2: 'des 2. Halbjahres'
    }[scope];
    
    const scopeOptions: SegmentedControlOption<Scope>[] = [
      { value: 'gesamt', label: 'Gesamtes Schuljahr' },
      { value: 'hj1', label: 'Nur 1. Halbjahr' },
      { value: 'hj2', label: 'Nur 2. Halbjahr' },
    ];

    if (!selectedLerngruppe) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Notenstruktur übertragen" size="lg">
            <div className="space-y-6">
                <div>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                        Übertragen Sie die Notenstruktur (Kategorien, Leistungsnachweise, Aufgaben) von <strong className="text-[var(--color-text-primary)]">{selectedLerngruppe.name}</strong> auf andere Lerngruppen.
                    </p>
                </div>
                {/* Scope Selection */}
                <div>
                    <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-2">Umfang der Übertragung</h3>
                    <SegmentedControl
                      name="Umfang der Übertragung"
                      options={scopeOptions}
                      value={scope}
                      // FIX: Wrap state setter in an arrow function to match the expected signature `(value: T) => void`.
                      onChange={(value) => setScope(value)}
                    />
                </div>

                {/* Target Selection */}
                <div>
                    <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-2">Ziel-Lerngruppen auswählen</h3>
                    <div className="max-h-60 overflow-y-auto bg-[var(--color-ui-secondary)] rounded-lg p-2 border border-[var(--color-border)]">
                        {targetLerngruppen.length > 0 ? (
                            targetLerngruppen.map((lg: Lerngruppe) => (
                                <label key={lg.id} className="flex items-center p-3 rounded-md hover:bg-[var(--color-ui-tertiary)] cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.has(lg.id)}
                                        onChange={() => handleToggle(lg.id)}
                                        className="h-5 w-5 accent-[var(--color-accent-primary)] rounded border-[var(--color-border)] focus:ring-[var(--color-accent-border-focus)]"
                                    />
                                    <span className="ml-3 font-medium text-[var(--color-text-primary)]">{lg.name} <span className="text-sm text-[var(--color-text-tertiary)]">({lg.fach})</span></span>
                                </label>
                            ))
                        ) : (
                            <div className="text-center p-4 text-sm text-[var(--color-text-tertiary)]">
                                Keine weiteren Lerngruppen für die Übertragung verfügbar.
                            </div>
                        )}
                    </div>
                </div>

                {/* Warning */}
                {selectedIds.size > 0 && (
                    <div className="text-[var(--color-danger-text)] text-sm bg-[var(--color-danger-background-transparent)] p-3 rounded-md border border-[var(--color-danger-border)]">
                        <p className="font-bold">ACHTUNG:</p>
                        <p>Eventuell vorhandene Leistungsnachweise und Noten <strong className="font-bold">{scopeText}</strong> in den ausgewählten Ziel-Lerngruppen werden unwiderruflich gelöscht, um die neue Struktur zu übernehmen.</p>
                    </div>
                )}

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-4">
                    <Button type="button" variant="secondary" onClick={onClose}>
                        Abbrechen
                    </Button>
                    <Button type="button" onClick={handleContinue} disabled={selectedIds.size === 0}>
                        Weiter
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default StrukturUebertragenModal;
