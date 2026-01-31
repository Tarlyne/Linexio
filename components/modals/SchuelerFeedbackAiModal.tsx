import React from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { SparklesIcon, SpinnerIcon } from '../icons';

interface SchuelerFeedbackAiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: () => Promise<void>;
  isGenerating: boolean;
  aiError: string | null;
  prompt: string;
  setPrompt: (value: string) => void;
  generationStatus: string;
}

const SchuelerFeedbackAiModal: React.FC<SchuelerFeedbackAiModalProps> = ({
  isOpen,
  onClose,
  onGenerate,
  isGenerating,
  aiError,
  prompt,
  setPrompt,
  generationStatus,
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
      title="KI-Feedback generieren"
      size="lg"
    >
      <div className="space-y-4">
        <p className="text-sm text-[var(--color-text-tertiary)]">
          Geben Sie Stichworte oder Anweisungen an, um ein konstruktives, pädagogisches Feedback für die Schülerin/den Schüler zu erstellen. Die KI berücksichtigt die Leistungsdaten der Klausur.
        </p>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Gib ein konstruktives Feedback. Berücksichtige Stärken und Schwächen."
          className="w-full h-40 p-3 bg-[var(--color-ui-secondary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent-border-focus)] focus:border-[var(--color-accent-border-focus)] transition-colors"
          disabled={isGenerating}
          autoFocus
        />
        {aiError && <p className="text-sm text-[var(--color-danger-text)]">{aiError}</p>}
        <div className="flex justify-end items-center space-x-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose} disabled={isGenerating}>
                Abbrechen
            </Button>
            <Button type="button" onClick={handleGenerateClick} disabled={!prompt.trim() || isGenerating}>
                {isGenerating ? <SpinnerIcon /> : <SparklesIcon className="w-5 h-5 text-yellow-300" />}
                <span>{isGenerating ? `Generiere... ${generationStatus}` : 'Feedback generieren'}</span>
            </Button>
        </div>
      </div>
    </Modal>
  );
};

export default SchuelerFeedbackAiModal;