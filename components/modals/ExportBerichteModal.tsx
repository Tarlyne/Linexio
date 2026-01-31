import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Select from '../ui/Select';
import { Leistungsnachweis } from '../../context/types';

interface ExportBerichteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGeneratePreview: (options: { includeNotenspiegel: boolean; showDetails: boolean; showSignatures: boolean; additionalLeistungsnachweisId?: string }) => void;
    type?: 'klausur' | 'sammelnote';
    availableLeistungsnachweise?: Leistungsnachweis[]; // For the dropdown
}

const ExportBerichteModal: React.FC<ExportBerichteModalProps> = ({
    isOpen,
    onClose,
    onGeneratePreview,
    type = 'klausur',
    availableLeistungsnachweise = [],
}) => {
    const [includeNotenspiegel, setIncludeNotenspiegel] = useState(true);
    const [showDetails, setShowDetails] = useState(true);
    const [showSignatures, setShowSignatures] = useState(true);
    const [additionalLeistungsnachweisId, setAdditionalLeistungsnachweisId] = useState<string>('');

    useEffect(() => {
        if (isOpen) {
            // Reset to defaults based on type
            if (type === 'klausur') {
                setIncludeNotenspiegel(true);
                setShowDetails(true);
                setShowSignatures(false); // Default false because usually we put it on the combined report or users prefer simple lists
            } else {
                setIncludeNotenspiegel(false);
                setShowDetails(true);
                setShowSignatures(true);
            }
            setAdditionalLeistungsnachweisId('');
        }
    }, [isOpen, type]);

    const handleGenerate = () => {
        onGeneratePreview({ 
            includeNotenspiegel: type === 'klausur' ? includeNotenspiegel : false,
            showDetails,
            showSignatures: type === 'sammelnote' ? showSignatures : (additionalLeistungsnachweisId ? false : showSignatures), // If combined, primary usually has no signature
            additionalLeistungsnachweisId: additionalLeistungsnachweisId || undefined
        });
        onClose();
    };

    const secondaryOptions = [
        { value: '', label: 'Keinen (Standard)' },
        ...availableLeistungsnachweise.map(ln => ({ value: ln.id, label: ln.name }))
    ];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Berichte exportieren">
            <div className="space-y-6">
                <div>
                    <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Einzelberichte für SchülerInnen</h3>
                    <p className="text-sm text-[var(--color-text-tertiary)] mt-1">
                        Generiert eine PDF-Datei mit individuellen Feedback-Zetteln.
                    </p>
                </div>

                <div className="space-y-4">
                    {type === 'klausur' && (
                        <>
                            <div className="space-y-3">
                                <div className="flex items-start">
                                    <div className="flex items-center h-5">
                                        <input
                                            id="include-notenspiegel"
                                            name="include-notenspiegel"
                                            type="checkbox"
                                            checked={includeNotenspiegel}
                                            onChange={(e) => setIncludeNotenspiegel(e.target.checked)}
                                            className="h-4 w-4 accent-[var(--color-accent-primary)] rounded border-[var(--color-border)] focus:ring-[var(--color-accent-border-focus)]"
                                        />
                                    </div>
                                    <div className="ml-3 text-sm">
                                        <label htmlFor="include-notenspiegel" className="font-medium text-[var(--color-text-primary)] cursor-pointer">
                                            Notenspiegel anzeigen
                                        </label>
                                        <p className="text-[var(--color-text-tertiary)]">
                                            Fügt dem Klausurbericht den Notenspiegel der Klasse hinzu.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2 border-t border-[var(--color-border)]">
                                <h4 className="text-sm font-medium text-[var(--color-text-primary)] mb-2">Kombinierter Bericht (Optional)</h4>
                                <Select
                                    label="Zweiten Leistungsnachweis hinzufügen (z.B. Mündlich)"
                                    id="secondary-ln"
                                    value={additionalLeistungsnachweisId}
                                    onChange={(e) => setAdditionalLeistungsnachweisId(e.target.value)}
                                    options={secondaryOptions}
                                />
                                <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                                    Wird eine Auswahl getroffen, erscheint dieser Nachweis auf der unteren Hälfte des Blattes (1 Schüler pro Seite).
                                </p>
                            </div>
                        </>
                    )}

                    {type === 'sammelnote' && (
                        <div className="space-y-3">
                            <div className="flex items-start">
                                <div className="flex items-center h-5">
                                    <input
                                        id="show-details"
                                        name="show-details"
                                        type="checkbox"
                                        checked={showDetails}
                                        onChange={(e) => setShowDetails(e.target.checked)}
                                        className="h-4 w-4 accent-[var(--color-accent-primary)] rounded border-[var(--color-border)] focus:ring-[var(--color-accent-border-focus)]"
                                    />
                                </div>
                                <div className="ml-3 text-sm">
                                    <label htmlFor="show-details" className="font-medium text-[var(--color-text-primary)] cursor-pointer">
                                        Einzelnoten auflisten
                                    </label>
                                    <p className="text-[var(--color-text-tertiary)]">
                                        Listet alle Teilleistungen (z.B. Tests, Heft) mit Note und Gewichtung auf.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start">
                                <div className="flex items-center h-5">
                                    <input
                                        id="show-signatures"
                                        name="show-signatures"
                                        type="checkbox"
                                        checked={showSignatures}
                                        onChange={(e) => setShowSignatures(e.target.checked)}
                                        className="h-4 w-4 accent-[var(--color-accent-primary)] rounded border-[var(--color-border)] focus:ring-[var(--color-accent-border-focus)]"
                                    />
                                </div>
                                <div className="ml-3 text-sm">
                                    <label htmlFor="show-signatures" className="font-medium text-[var(--color-text-primary)] cursor-pointer">
                                        Unterschriftenfelder anzeigen
                                    </label>
                                    <p className="text-[var(--color-text-tertiary)]">
                                        Fügt Linien für Lehrkraft und Erziehungsberechtigte hinzu.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-end items-center space-x-3 pt-4">
                    <Button type="button" variant="secondary" onClick={onClose}>
                        Abbrechen
                    </Button>
                    <Button type="button" onClick={handleGenerate}>
                        Vorschau generieren
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default ExportBerichteModal;