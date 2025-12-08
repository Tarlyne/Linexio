import React, { useState, useEffect } from 'react';
import { useLerngruppenContext } from '../../context/LerngruppenContext';
import { Lerngruppe } from '../../context/types';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';

interface CopyLerngruppeModalProps {
    lerngruppeToCopy: Lerngruppe | null;
    onClose: () => void;
}

const CopyLerngruppeModal: React.FC<CopyLerngruppeModalProps> = ({ lerngruppeToCopy, onClose }) => {
    const { handleCopyLerngruppe } = useLerngruppenContext();

    const [newName, setNewName] = useState('');
    const [newFach, setNewFach] = useState('');
    
    const isOpen = !!lerngruppeToCopy;

    useEffect(() => {
        if (lerngruppeToCopy) {
            const suggestedName = lerngruppeToCopy.name.replace(/(\d+)/, (num) => String(parseInt(num, 10) + 1));
            setNewName(suggestedName);
            setNewFach(lerngruppeToCopy.fach);
        }
    }, [lerngruppeToCopy]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (lerngruppeToCopy && newName.trim() && newFach.trim()) {
            handleCopyLerngruppe(lerngruppeToCopy, newName.trim(), newFach.trim());
            onClose(); // Close modal after copying
        }
    };

    if (!lerngruppeToCopy) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`"${lerngruppeToCopy.name}" übernehmen`}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-[var(--color-text-secondary)] text-sm">
                    Eine Kopie dieser Lerngruppe und aller zugehörigen SchülerInnen wird für das aktuelle Schuljahr erstellt. Bitte geben Sie den neuen Namen an.
                </p>
                <Input
                    label="Neuer Name der Lerngruppe"
                    id="lg-copy-name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="z.B. Klasse 6c"
                    required
                />
                <Input
                    label="Fach"
                    id="lg-copy-fach"
                    value={newFach}
                    onChange={(e) => setNewFach(e.target.value)}
                    placeholder="z.B. Mathematik"
                    required
                />
                <div className="flex justify-end space-x-3 pt-2">
                    <Button type="button" variant="secondary" onClick={onClose}>
                        Abbrechen
                    </Button>
                    <Button type="submit" disabled={!newName.trim() || !newFach.trim()}>
                        Kopieren & Übernehmen
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default CopyLerngruppeModal;