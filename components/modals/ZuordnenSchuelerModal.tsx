import React, { useState, useMemo, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { useLerngruppenContext } from '../../context/LerngruppenContext';
import { Schueler, Lerngruppe } from '../../context/types';
import { ChevronLeftIcon } from '../icons';

interface ZuordnenSchuelerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const getInitials = (firstName: string, lastName: string) => {
    const first = firstName ? firstName[0] : '';
    const last = lastName ? lastName[0] : '';
    return `${first}${last}`.toUpperCase();
};

const ZuordnenSchuelerModal: React.FC<ZuordnenSchuelerModalProps> = ({ isOpen, onClose }) => {
    const { lerngruppen, allSchueler, selectedLerngruppe, addSchuelerToLerngruppe } = useLerngruppenContext();
    
    const [sourceGroupId, setSourceGroupId] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (isOpen) {
            setSourceGroupId(null);
            setSelectedIds(new Set());
        }
    }, [isOpen]);

    const sourceLerngruppen = useMemo(() => {
        if (!selectedLerngruppe) return [];
        return lerngruppen.filter((lg: Lerngruppe) => lg.id !== selectedLerngruppe.id && lg.schuelerIds.length > 0);
    }, [lerngruppen, selectedLerngruppe]);

    const schuelerInSourceGroup = useMemo(() => {
        if (!sourceGroupId) return [];
        const sourceGroup = lerngruppen.find((lg: Lerngruppe) => lg.id === sourceGroupId);
        if (!sourceGroup) return [];
        const schuelerIdSet = new Set(sourceGroup.schuelerIds);
        return allSchueler.filter((s: Schueler) => schuelerIdSet.has(s.id)).sort((a,b) => a.lastName.localeCompare(b.lastName));
    }, [allSchueler, lerngruppen, sourceGroupId]);

    const handleToggleSelect = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const handleToggleSelectAll = () => {
        if (selectedIds.size === schuelerInSourceGroup.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(schuelerInSourceGroup.map((s: Schueler) => s.id)));
        }
    };
    
    const handleSubmit = async () => {
        if (selectedLerngruppe && selectedIds.size > 0) {
            await addSchuelerToLerngruppe(selectedLerngruppe.id, Array.from(selectedIds));
        }
        onClose();
    };
    
    if (!selectedLerngruppe) return null;

    const renderGroupSelection = () => (
        <div className="space-y-2">
             <p className="text-sm text-[var(--color-text-secondary)] -mt-2 mb-4">Wählen Sie die Lerngruppe aus, aus der Sie SchülerInnen importieren möchten.</p>
             <div className="max-h-80 overflow-y-auto bg-[var(--color-ui-secondary)] rounded-lg p-2 border border-[var(--color-border)]">
                {sourceLerngruppen.length > 0 ? (
                    sourceLerngruppen.map((lg: Lerngruppe) => (
                        <button key={lg.id} onClick={() => setSourceGroupId(lg.id)} className="w-full text-left p-3 rounded-md hover:bg-[var(--color-ui-tertiary)]">
                            <p className="font-semibold text-[var(--color-text-primary)]">{lg.name}</p>
                            <p className="text-sm text-[var(--color-text-secondary)]">{lg.fach} ({lg.schuelerIds.length} SchülerInnen)</p>
                        </button>
                    ))
                ) : (
                    <div className="text-center p-4 text-sm text-[var(--color-text-tertiary)]">
                        Keine anderen Lerngruppen mit SchülerInnen vorhanden.
                    </div>
                )}
             </div>
        </div>
    );

    const renderSchuelerSelection = () => {
        const sourceGroup = lerngruppen.find(lg => lg.id === sourceGroupId);
        if (!sourceGroup) return null;

        return (
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <button onClick={() => setSourceGroupId(null)} className="flex items-center text-sm font-semibold text-[var(--color-accent-text)] hover:underline">
                        <ChevronLeftIcon className="w-5 h-5 mr-1" />
                        Andere Lerngruppe wählen
                    </button>
                    <button onClick={handleToggleSelectAll} className="text-sm font-semibold text-[var(--color-accent-text)] hover:underline">
                        {selectedIds.size === schuelerInSourceGroup.length ? 'Alle abwählen' : 'Alle auswählen'}
                    </button>
                </div>
                
                <div className="max-h-80 overflow-y-auto bg-[var(--color-ui-secondary)] rounded-lg p-2 border border-[var(--color-border)]">
                    {schuelerInSourceGroup.map((s: Schueler) => (
                        <label key={s.id} className="flex items-center p-2 rounded-md hover:bg-[var(--color-ui-tertiary)] cursor-pointer space-x-4">
                            <input
                                type="checkbox"
                                checked={selectedIds.has(s.id)}
                                onChange={() => handleToggleSelect(s.id)}
                                className="h-5 w-5 accent-[var(--color-accent-primary)] rounded border-[var(--color-border)] focus:ring-[var(--color-accent-border-focus)]"
                            />
                            <div className="w-9 h-9 bg-gradient-to-br from-[var(--color-accent-primary-hover)] to-[var(--color-accent-primary)] text-[var(--color-accent-text-inverted)] rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0">
                                {getInitials(s.firstName, s.lastName)}
                            </div>
                            <div className="font-medium text-[var(--color-text-primary)]">
                                {s.lastName}, {s.firstName}
                            </div>
                        </label>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="SchülerInnen zuordnen" size="lg">
            {sourceGroupId ? renderSchuelerSelection() : renderGroupSelection()}
            <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="secondary" onClick={onClose}>
                    Abbrechen
                </Button>
                <Button type="button" onClick={handleSubmit} disabled={selectedIds.size === 0}>
                    {selectedIds.size > 0 ? `${selectedIds.size} SchülerInnen übernehmen` : 'Übernehmen'}
                </Button>
            </div>
        </Modal>
    );
};

export default ZuordnenSchuelerModal;