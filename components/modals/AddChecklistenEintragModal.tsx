import React, { useState, useRef, useEffect } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { ChecklistenStatusValue } from '../../context/types';

interface AddChecklistenEintragModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (name: string, defaultStatus: ChecklistenStatusValue, faelligkeitsdatum?: string) => void;
}

const AddChecklistenEintragModal: React.FC<AddChecklistenEintragModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [name, setName] = useState('');
  const [defaultStatus, setDefaultStatus] = useState<ChecklistenStatusValue>('offen');
  const [faelligkeitsdatum, setFaelligkeitsdatum] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => nameInputRef.current?.focus(), 100);
      setName('');
      setDefaultStatus('offen');
      setFaelligkeitsdatum('');
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onAdd(name.trim(), defaultStatus, faelligkeitsdatum);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Neuen Checklisten-Eintrag erstellen">
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          ref={nameInputRef}
          label="Name des Eintrags"
          id="cle-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="z.B. HA 25.10."
          required
        />
        <Input
            label="Fälligkeitsdatum (optional)"
            id="cle-faelligkeitsdatum"
            type="date"
            value={faelligkeitsdatum}
            onChange={(e) => setFaelligkeitsdatum(e.target.value)}
        />
        
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
            Standard-Status für alle SchülerInnen
          </label>
          <div className="grid grid-cols-3 gap-3">
            {(['erledigt', 'nicht-erledigt', 'offen'] as ChecklistenStatusValue[]).map(status => (
                <button
                    key={status}
                    type="button"
                    onClick={() => setDefaultStatus(status)}
                    className={`p-3 rounded-lg text-center font-semibold border-2 transition-all ${
                        defaultStatus === status ? 'border-[var(--color-accent-border-focus)] bg-[var(--color-accent-secondary-transparent-50)] text-[var(--color-text-primary)]' : 'border-[var(--color-border)] bg-[var(--color-ui-secondary)] text-[var(--color-text-secondary)] hover:border-[var(--color-ui-tertiary)]'
                    }`}
                >
                    {status === 'erledigt' && '✓ Erledigt'}
                    {status === 'nicht-erledigt' && '✗ Nicht erledigt'}
                    {status === 'offen' && '- Offen'}
                </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Abbrechen
          </Button>
          <Button type="submit" disabled={!name.trim()}>
            Erstellen
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddChecklistenEintragModal;