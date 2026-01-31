import React, { useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

interface IntelligenteGruppeneinteilungModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: () => Promise<void>;
  isGenerating: boolean;
  aiError: string | null;
  prompt: string;
  setPrompt: (value: string) => void;
}

const IntelligenteGruppeneinteilungModal: React.FC<IntelligenteGruppeneinteilungModalProps> = ({
  isOpen,
  onClose,
  onGenerate,
  isGenerating,
  aiError,
  prompt,
  setPrompt,
}) => {

  const handleGenerateClick = () => {
    if (prompt.trim()) {
      onGenerate();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Intelligente Gruppeneinteilung"
      size="lg"
    >
      <div className="space-y-4">
        <p className="text-sm text-[var(--color-text-secondary)]">
          Beschreiben Sie in natürlicher Sprache, wie die Gruppen erstellt werden sollen.
          Berücksichtigen Sie dabei die pädagogischen Merkmale, die Sie in der Schülerakte vergeben haben.
        </p>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="z.B. 'Bilde 4er-Gruppen. Leo und Frida sollen in getrennte Gruppen. Mische leistungsstarke mit schwächeren SchülerInnen.'"
          className="w-full h-40 p-3 bg-[var(--color-ui-secondary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-border-focus)] focus:border-[var(--color-accent-border-focus)] transition-colors"
          disabled={isGenerating}
        />
        {aiError && <p className="text-sm text-[var(--color-danger-text)]">{aiError}</p>}
        <div className="flex justify-end space-x-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isGenerating}>
            Abbrechen
          </Button>
          <Button type="button" onClick={handleGenerateClick} disabled={!prompt.trim() || isGenerating}>
            {isGenerating ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-[var(--color-text-primary)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Generiere...</span>
              </>
            ) : (
              <span>Gruppen generieren</span>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default IntelligenteGruppeneinteilungModal;