import React from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { SparklesIcon } from '../icons';
import { useUIContext } from '../../context/UIContext';

interface SupporterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SupporterModal: React.FC<SupporterModalProps> = ({ isOpen, onClose }) => {
  const { handleNavigate } = useUIContext();

  const handleSupportClick = () => {
    onClose();
    // Navigate to Settings -> Info tab where the donation info is
    handleNavigate('einstellungen', undefined, undefined, undefined, 'info');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Supporter Feature">
      <div className="text-center space-y-6">
        <div className="flex justify-center">
            <div className="bg-[var(--color-accent-secondary-transparent-50)] p-4 rounded-full">
                <SparklesIcon className="w-12 h-12 text-[var(--color-accent-text)]" />
            </div>
        </div>
        
        <div>
            <h3 className="text-lg font-bold text-[var(--color-text-primary)]">Exklusiv für Unterstützer</h3>
            <p className="text-[var(--color-text-secondary)] mt-2">
                Diese KI-Funktion verursacht laufende Serverkosten. Um das Projekt am Leben zu halten, ist dieses Feature als Dankeschön für unsere Unterstützer reserviert.
            </p>
        </div>

        <div className="bg-[var(--color-ui-secondary)] p-4 rounded-lg text-left border border-[var(--color-border)]">
            <p className="text-sm font-semibold text-[var(--color-text-primary)] mb-2">Als Supporter erhalten Sie:</p>
            <ul className="text-sm text-[var(--color-text-secondary)] space-y-1 list-disc list-inside">
                <li>Zugriff auf <strong>alle KI-Tools</strong> (Sitzplan, Gruppen, Feedback)</li>
                <li>Das exklusive <strong>Golden Hour Theme</strong></li>
                <li>Unser unendliches Dankeschön! ❤️</li>
            </ul>
        </div>

        <div className="flex flex-col gap-3 pt-2">
            <Button onClick={handleSupportClick} className="w-full justify-center !py-3">
                Jetzt Projekt unterstützen
            </Button>
            <Button variant="secondary" onClick={onClose} className="w-full justify-center">
                Vielleicht später
            </Button>
        </div>
      </div>
    </Modal>
  );
};

export default SupporterModal;