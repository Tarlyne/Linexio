import React, { useState, useEffect, useRef } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { useToolsContext } from '../../context/ToolsContext';
import { NotizKategorie } from '../../context/types';
import { TrashIcon } from '../icons';
import ConfirmDeleteNotizKategorieModal from './ConfirmDeleteNotizKategorieModal';

interface AddEditNotizKategorieModalProps {
  isOpen: boolean;
  onClose: () => void;
  kategorieToEdit: NotizKategorie | null;
}

const EMOJI_PRESETS = ['📝', '🗣️', '📅', '🏫', '💡', '📌', '📋', '✅', '🧠', '🤔', '💬', '🔔'];

const AddEditNotizKategorieModal: React.FC<AddEditNotizKategorieModalProps> = ({ isOpen, onClose, kategorieToEdit }) => {
  const { onAddNotizKategorie, onUpdateNotizKategorie } = useToolsContext();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📝');
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (kategorieToEdit) {
        setName(kategorieToEdit.name);
        setIcon(kategorieToEdit.icon);
      } else {
        setName('');
        setIcon('📝');
      }
      setTimeout(() => nameInputRef.current?.focus(), 100);
    }
  }, [isOpen, kategorieToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && icon.trim()) {
      if (kategorieToEdit) {
        await onUpdateNotizKategorie(kategorieToEdit.id, name.trim(), icon.trim());
      } else {
        await onAddNotizKategorie(name.trim(), icon.trim());
      }
      onClose();
    }
  };

  const handleDeleteRequest = () => {
      setIsConfirmDeleteOpen(true);
  };
  
  const title = kategorieToEdit ? 'Kategorie bearbeiten' : 'Neue Kategorie erstellen';

  return (
    <>
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
        <form onSubmit={handleSubmit} className="space-y-6">
            <Input
            ref={nameInputRef}
            label="Name der Kategorie"
            id="kat-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="z.B. Konferenzen, Elterngespräche"
            required
            />
            <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Icon</label>
                <div className="grid grid-cols-6 gap-2 bg-[var(--color-ui-secondary)] p-2 rounded-lg">
                    {EMOJI_PRESETS.map((emoji: string) => (
                        <button
                            key={emoji}
                            type="button"
                            onClick={() => setIcon(emoji)}
                            aria-label={`Select emoji ${emoji}`}
                            className={`flex items-center justify-center text-2xl p-2 rounded-md transition-all ${
                                icon === emoji 
                                    ? 'bg-[var(--color-accent-primary)]' 
                                    : 'hover:bg-[var(--color-ui-tertiary)]'
                            }`}
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
            </div>
            <div className="flex items-center justify-between pt-4">
                {kategorieToEdit ? (
                    <Button type="button" variant="danger" onClick={handleDeleteRequest}>
                        <TrashIcon />
                        <span>Löschen</span>
                    </Button>
                ) : <div />}
                <div className="flex space-x-3">
                    <Button type="button" variant="secondary" onClick={onClose}>
                        Abbrechen
                    </Button>
                    <Button type="submit" disabled={!name.trim() || !icon.trim()}>
                        {kategorieToEdit ? 'Speichern' : 'Erstellen'}
                    </Button>
                </div>
            </div>
        </form>
        </Modal>
        {kategorieToEdit && (
            <ConfirmDeleteNotizKategorieModal
                isOpen={isConfirmDeleteOpen}
                onClose={() => setIsConfirmDeleteOpen(false)}
                onConfirm={() => {
                    onClose(); // Close edit modal after confirm
                }}
                kategorieToDelete={kategorieToEdit}
            />
        )}
    </>
  );
};

export default AddEditNotizKategorieModal;