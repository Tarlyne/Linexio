import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Leistungsnachweis, NoteMapEntry } from '../../context/types';

interface ExportBerichteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGeneratePreview: (options: { includeNotenspiegel: boolean }) => void;
}

const ExportBerichteModal: React.FC<ExportBerichteModalProps> = ({
    isOpen,
    onClose,
    onGeneratePreview,
}) => {
    const [includeNotenspiegel, setIncludeNotenspiegel] = useState(true);

    const handleGenerate = () => {
        onGeneratePreview({ includeNotenspiegel });
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Berichte exportieren">
            <div className="space-y-6">
                <div>
                    <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Einzelberichte für SchülerInnen</h3>
                    <p className="text-sm text-[var(--color-text-tertiary)] mt-1">
                        Generiert eine PDF-Datei mit individuellen Feedback-Zetteln für jede(n) SchülerIn, optimiert zum Ausdrucken und Ausschneiden.
                    </p>
                </div>

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
                            Fügt jedem Bericht den Notenspiegel der gesamten Klasse hinzu. Deaktivieren Sie dies, falls Sie den Notenspiegel nicht abbilden möchten.
                        </p>
                    </div>
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