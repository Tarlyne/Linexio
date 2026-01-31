import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { ExclamationCircleIcon } from '../icons';

interface InactivityWarningModalProps {
  isOpen: boolean;
  onExtend: () => void;
  onLogout: () => void;
}

const InactivityWarningModal: React.FC<InactivityWarningModalProps> = ({ isOpen, onExtend, onLogout }) => {
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (isOpen) {
      setCountdown(60);
      const interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            // The timer in SecurityContext will handle the final logout.
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    // Use a high z-index to appear above other modals if necessary
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4" 
      aria-modal="true"
      role="dialog"
    >
        <div 
            className="bg-[var(--color-ui-primary)] rounded-xl shadow-2xl w-full max-w-sm border border-[var(--color-border)] animate-fade-in flex flex-col"
            onClick={(e) => e.stopPropagation()}
        >
            <header className="flex items-center justify-between p-4 border-b border-[var(--color-border)] flex-shrink-0">
                <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Sitzung läuft ab</h2>
            </header>
            <div className="p-6 space-y-4 text-center">
                <ExclamationCircleIcon className="w-16 h-16 text-[var(--color-warning-text)] mx-auto" />
                <p className="text-[var(--color-text-secondary)]">
                Aus Sicherheitsgründen werden Sie in Kürze abgemeldet.
                </p>
                <p className="text-4xl font-bold text-[var(--color-text-primary)]">
                {countdown}
                </p>
                <p className="text-[var(--color-text-tertiary)]">
                Sekunden verbleibend...
                </p>
                <div className="flex flex-col space-y-2 pt-4">
                <Button onClick={onExtend} className="w-full">
                    Angemeldet bleiben
                </Button>
                <Button variant="secondary" onClick={onLogout} className="w-full">
                    Jetzt abmelden
                </Button>
                </div>
            </div>
        </div>
    </div>
  );
};

export default InactivityWarningModal;
