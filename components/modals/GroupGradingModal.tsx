import React, { useState, useMemo, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Select from '../ui/Select';
import Input from '../ui/Input';
import { useLerngruppenContext } from '../../context/LerngruppenContext';
import { useNotenContext } from '../../context/NotenContext';
import { useToolsContext } from '../../context/ToolsContext';
import { Gruppe, Leistungsnachweis, Notenkategorie, EinzelLeistung, Schueler, EinzelLeistungsNote, PREDEFINED_NOTENSYSTEME, Note } from '../../context/types';
import { ChevronRightIcon, ChevronLeftIcon, CheckCircleIcon, PlusIcon } from '../icons';
import { v4 as uuidv4 } from 'uuid';
import { useToastContext } from '../../context/ToastContext';

interface GroupGradingModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const GroupGradingModal: React.FC<GroupGradingModalProps> = ({ isOpen, onClose }) => {
    const { selectedLerngruppe, allSchueler } = useLerngruppenContext();
    const {
        notenkategorien,
        leistungsnachweise,
        einzelLeistungen,
        handleAddEinzelLeistung,
        saveBulkEinzelLeistungsNoten,
        einzelLeistungsNoten
    } = useNotenContext();
    const { gruppenEinteilungen } = useToolsContext();
    const { showToast } = useToastContext();

    const [step, setStep] = useState<1 | 2>(1);
    
    // Step 1 State
    const [selectedLNId, setSelectedLNId] = useState('');
    const [selectedELId, setSelectedELId] = useState(''); // 'new' or UUID
    const [newELName, setNewELName] = useState('Gruppenarbeit');
    const [newELWeight, setNewELWeight] = useState('1');

    // Step 2 State
    const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
    const [groupGrades, setGroupGrades] = useState<{ [groupId: string]: string }>({});
    const [isSaving, setIsSaving] = useState(false);

    // Derived Data
    const relevantKategorien = useMemo(() =>
        notenkategorien.filter(nk => nk.lerngruppeId === selectedLerngruppe?.id),
        [notenkategorien, selectedLerngruppe?.id]
    );

    const relevantLNs = useMemo(() => {
        const catIds = new Set(relevantKategorien.map(nk => nk.id));
        return leistungsnachweise
            .filter(ln => catIds.has(ln.notenkategorieId) && ln.typ === 'sammelnote')
            .sort((a, b) => a.datum.localeCompare(b.datum));
    }, [leistungsnachweise, relevantKategorien]);

    const relevantELs = useMemo(() => {
        if (!selectedLNId) return [];
        return einzelLeistungen.filter(el => el.leistungsnachweisId === selectedLNId).sort((a, b) => a.order - b.order);
    }, [einzelLeistungen, selectedLNId]);

    const currentGroups = useMemo(() => {
        if (!selectedLerngruppe) return [];
        return gruppenEinteilungen.find(ge => ge.lerngruppeId === selectedLerngruppe.id)?.gruppen || [];
    }, [gruppenEinteilungen, selectedLerngruppe]);

    const notensystem = useMemo(() => 
        PREDEFINED_NOTENSYSTEME.find(ns => ns.id === selectedLerngruppe?.notensystemId),
    [selectedLerngruppe?.notensystemId]);

    const sortedNotes = useMemo(() => {
        if (!notensystem) return [];
        return [...notensystem.noten].sort((a, b) => b.pointValue - a.pointValue);
    }, [notensystem]);

    // Reset state on open
    useEffect(() => {
        if (isOpen) {
            setStep(1);
            // Preselect first LN if available
            if (relevantLNs.length > 0) setSelectedLNId(relevantLNs[0].id);
            setSelectedELId('');
            setNewELName('Gruppenarbeit');
            setNewELWeight('1');
            setGroupGrades({});
            setIsSaving(false);
            if (currentGroups.length > 0) setActiveGroupId(currentGroups[0].id);
        }
    }, [isOpen, relevantLNs, currentGroups]);

    // Reset EL selection when LN changes
    useEffect(() => {
        setSelectedELId('');
    }, [selectedLNId]);

    // Hydration Effect: Load existing grades when entering Step 2 with an existing column
    useEffect(() => {
        if (step === 2 && selectedELId && selectedELId !== 'new') {
            const loadedGrades: { [groupId: string]: string } = {};

            currentGroups.forEach(group => {
                // Find any student in this group that already has a grade for this column
                // We assume consistent group grading, so finding one is enough to pre-fill
                const existingNoteEntry = einzelLeistungsNoten.find(note => 
                    note.einzelLeistungId === selectedELId && 
                    group.schuelerIds.includes(note.schuelerId)
                );

                if (existingNoteEntry) {
                    loadedGrades[group.id] = existingNoteEntry.note;
                }
            });

            setGroupGrades(loadedGrades);
        } else if (step === 2 && selectedELId === 'new') {
             // Ensure clear state for new column
             setGroupGrades({});
        }
    }, [step, selectedELId, currentGroups, einzelLeistungsNoten]);


    // Step 2 Logic
    const handleGroupClick = (groupId: string) => {
        setActiveGroupId(groupId);
    };

    const handleNoteClick = (noteDisplayValue: string) => {
        if (activeGroupId) {
            setGroupGrades(prev => ({ ...prev, [activeGroupId]: noteDisplayValue }));
            
            // Auto-advance
            const currentIndex = currentGroups.findIndex(g => g.id === activeGroupId);
            if (currentIndex < currentGroups.length - 1) {
                setActiveGroupId(currentGroups[currentIndex + 1].id);
            }
        }
    };

    const handleSave = async () => {
        if (!selectedLerngruppe) return;
        setIsSaving(true);

        try {
            let targetELId = selectedELId;

            // 1. Create new column if needed
            if (selectedELId === 'new') {
                const newEL = await handleAddEinzelLeistung(selectedLNId, newELName, parseInt(newELWeight) || 1);
                
                if (newEL) {
                    targetELId = newEL.id;
                } else {
                    throw new Error("Konnte neue Spalte nicht erstellen.");
                }
            }

            // 2. Prepare bulk entries
            const entries: { schuelerId: string, note: string }[] = [];
            
            for (const [groupId, gradeValue] of Object.entries(groupGrades)) {
                // Explicitly cast to string to avoid TS "unknown" errors in some configs
                const grade = gradeValue as string; 
                if (!grade) continue;
                const group = currentGroups.find(g => g.id === groupId);
                if (group) {
                    group.schuelerIds.forEach(sId => {
                        entries.push({ schuelerId: sId, note: grade });
                    });
                }
            }

            // 3. Save
            if (entries.length > 0) {
                // FIXED: Removed extra arguments. The context wrapper injects lerngruppe/schueler automatically.
                await saveBulkEinzelLeistungsNoten(entries, targetELId);
                showToast(`Noten für ${entries.length} SchülerInnen gespeichert.`, 'success');
            } else {
                showToast('Keine Noten vergeben.', 'error');
            }
            
            onClose();

        } catch (e) {
            console.error(e);
            showToast('Fehler beim Speichern.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const isStep1Valid = selectedLNId && (selectedELId === 'new' ? (newELName.trim() && newELWeight) : selectedELId);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Gruppen bewerten" size="lg">
            {step === 1 && (
                <div className="space-y-6">
                    <Select
                        label="Leistungsnachweis wählen"
                        id="ln-select"
                        value={selectedLNId}
                        onChange={(e) => setSelectedLNId(e.target.value)}
                        options={relevantLNs.map(ln => ({ value: ln.id, label: ln.name }))}
                    />
                    
                    {selectedLNId && (
                        <>
                            <Select
                                label="Notenspalte wählen"
                                id="el-select"
                                value={selectedELId}
                                onChange={(e) => setSelectedELId(e.target.value)}
                                options={[
                                    { value: '', label: 'Bitte wählen...' },
                                    { value: 'new', label: '+ Neue Spalte erstellen' },
                                    ...relevantELs.map(el => ({ value: el.id, label: el.name }))
                                ]}
                            />
                            
                            {selectedELId === 'new' && (
                                <div className="grid grid-cols-3 gap-4 bg-[var(--color-ui-secondary)] p-4 rounded-lg border border-[var(--color-border)] animate-fade-in">
                                    <div className="col-span-2">
                                        <Input
                                            label="Bezeichnung"
                                            id="new-el-name"
                                            value={newELName}
                                            onChange={(e) => setNewELName(e.target.value)}
                                            placeholder="z.B. Gruppenarbeit"
                                        />
                                    </div>
                                    <div>
                                        <Input
                                            label="Gewichtung"
                                            id="new-el-weight"
                                            type="number"
                                            min="1"
                                            value={newELWeight}
                                            onChange={(e) => setNewELWeight(e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    <div className="flex justify-end pt-4">
                        <Button onClick={() => setStep(2)} disabled={!isStep1Valid}>
                            Weiter
                            <ChevronRightIcon className="w-5 h-5 ml-1" />
                        </Button>
                    </div>
                </div>
            )}

            {step === 2 && notensystem && (
                <div className="h-[60vh] flex flex-col">
                    <div className="flex-1 flex gap-4 min-h-0">
                        {/* Left: Group List */}
                        <div className="w-1/2 flex flex-col bg-[var(--color-ui-secondary)] rounded-lg border border-[var(--color-border)] overflow-hidden">
                            <div className="p-3 bg-[var(--color-ui-primary)] border-b border-[var(--color-border)] font-bold text-[var(--color-text-tertiary)] text-xs uppercase tracking-wide">
                                Gruppen
                            </div>
                            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                                {currentGroups.map(group => {
                                    const isActive = activeGroupId === group.id;
                                    const grade = groupGrades[group.id];
                                    const members = group.schuelerIds.map(id => allSchueler.find(s => s.id === id)?.firstName).join(', ');
                                    
                                    // Check if grade is bad
                                    const gradePointValue = grade ? notensystem.noten.find(n => n.displayValue === grade)?.pointValue : undefined;
                                    const isBadGrade = gradePointValue !== undefined && gradePointValue <= 3;

                                    return (
                                        <button
                                            key={group.id}
                                            onClick={() => handleGroupClick(group.id)}
                                            className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                                                isActive 
                                                    ? 'border-[var(--color-accent-primary)] bg-[var(--color-accent-secondary-transparent-50)]' 
                                                    : 'border-transparent bg-[var(--color-ui-primary)] hover:border-[var(--color-border)]'
                                            }`}
                                        >
                                            <div className="flex justify-between items-center">
                                                <span className={`font-bold ${isActive ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)]'}`}>
                                                    {group.name}
                                                </span>
                                                {grade ? (
                                                    <span className={`px-2 py-0.5 rounded text-sm font-bold ${isBadGrade ? 'bg-[var(--color-danger-background-transparent)] text-[var(--color-danger-text)]' : 'bg-[var(--color-accent-primary)] text-[var(--color-text-primary)]'}`}>
                                                        {grade}
                                                    </span>
                                                ) : (
                                                    <span className="text-[var(--color-text-tertiary)] text-sm">-</span>
                                                )}
                                            </div>
                                            <div className="text-xs text-[var(--color-text-tertiary)] truncate mt-1">
                                                {members}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Right: Numpad */}
                        <div className="w-1/2 flex flex-col">
                            <div className="flex-1 overflow-y-auto pr-1">
                                <div className="grid grid-cols-3 gap-2">
                                    {sortedNotes.map(note => {
                                        const isBadGrade = note.pointValue <= 3;
                                        const currentGrade = activeGroupId ? groupGrades[activeGroupId] : null;
                                        const isSelected = currentGrade === note.displayValue;
                                        const textColorClass = !isSelected && isBadGrade ? 'text-[var(--color-danger-text)]' : 'text-[var(--color-text-primary)]';
                                        
                                        return (
                                            <button
                                                key={note.pointValue}
                                                onClick={() => handleNoteClick(note.displayValue)}
                                                disabled={!activeGroupId}
                                                className={`h-12 rounded-lg text-lg font-bold transition-all duration-150 focus:outline-none 
                                                  ${isSelected
                                                    ? 'bg-[var(--color-accent-primary)] text-[var(--color-text-primary)] ring-2 ring-[var(--color-accent-border-focus)] scale-105'
                                                    : `bg-[var(--color-ui-secondary)] ${textColorClass} hover:bg-[var(--color-ui-tertiary)] active:scale-95`
                                                  }
                                                  disabled:opacity-50 disabled:cursor-not-allowed
                                                `}
                                            >
                                                {note.displayValue}
                                            </button>
                                        );
                                    })}
                                    {/* Clear Button */}
                                    <button
                                        onClick={() => { if(activeGroupId) setGroupGrades(prev => ({...prev, [activeGroupId]: ''})) }}
                                        disabled={!activeGroupId}
                                        className="h-12 col-span-3 rounded-lg text-sm font-medium bg-[var(--color-ui-secondary)] text-[var(--color-text-tertiary)] hover:bg-[var(--color-danger-background-transparent)] hover:text-[var(--color-danger-text)] transition-colors disabled:opacity-50"
                                    >
                                        Note löschen
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between items-center pt-6 border-t border-[var(--color-border)] mt-4">
                        <Button variant="secondary" onClick={() => setStep(1)}>
                            <ChevronLeftIcon className="w-5 h-5 mr-1" />
                            Zurück
                        </Button>
                        <div className="text-sm text-[var(--color-text-tertiary)]">
                            {Object.keys(groupGrades).filter(k => !!groupGrades[k]).length} von {currentGroups.length} bewertet
                        </div>
                        <Button onClick={handleSave} disabled={isSaving}>
                            {isSaving ? 'Speichere...' : (
                                <>
                                    <CheckCircleIcon className="w-5 h-5 mr-2" />
                                    Speichern
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            )}
        </Modal>
    );
};

export default GroupGradingModal;