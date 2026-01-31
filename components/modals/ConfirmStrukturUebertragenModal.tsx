import React from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { useLerngruppenContext } from '../../context/LerngruppenContext';

interface TransferData {
    scope: 'gesamt' | 'hj1' | 'hj2';
    targetIds: string[];
}

interface ConfirmStrukturUebertragenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  transferData: TransferData;
}

const ConfirmStrukturUebertragenModal: React.FC<ConfirmStrukturUebertragenModalProps> = ({ isOpen, onClose, onConfirm, transferData }) => {
    const { lerngruppen } = useLerngruppenContext();

    const targetNames = transferData.targetIds.map(id => 
        lerngruppen.find(lg => lg.id === id)?.name || 'Unbekannt'
    );

    const scopeText = {
        gesamt: 'das gesamte Schuljahr',
        hj1: 'das 1. Halbjahr',
        hj2: 'das 2. Halbjahr'
    }[transferData.scope];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Übertragung endgültig bestätigen">
            <div className="space-y-4">
                <p className="text-[var(--color-text-secondary)]">
                    Sie sind dabei, die Notenstruktur für <strong className="text-[var(--color-text-primary)]">{scopeText}</strong> auf die folgende(n) Lerngruppe(n) zu übertragen:
                </p>
                <ul className="list-disc list-inside bg-[var(--color-ui-secondary)] p-3 rounded-lg text-sm text-[var(--color-text-secondary)]">
                    {targetNames.map(name => <li key={name}><strong className="text-[var(--color-text-primary)]">{name}</strong></li>)}
                </ul>
                <div className="text-[var(--color-danger-text)] text-sm bg-[var(--color-danger-background-transparent)] p-3 rounded-md border border-[var(--color-danger-border)]">
                    <p className="font-bold">Letzte Warnung:</p>
                    <p>Alle bestehenden Noten-Daten des ausgewählten Zeitraums in den Ziel-Lerngruppen werden unwiderruflich gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.</p>
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                    <Button type="button" variant="secondary" onClick={onClose}>
                        Abbrechen
                    </Button>
                    <Button 
                        type="button" 
                        variant="danger"
                        onClick={onConfirm}
                    >
                        Ja, Struktur übertragen
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default ConfirmStrukturUebertragenModal;
