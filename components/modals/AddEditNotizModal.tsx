import React, { useState, useEffect, useRef } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { useToolsContext } from '../../context/ToolsContext';
import { Notiz } from '../../context/types';
import { TrashIcon } from '../icons';
import ConfirmDeleteNotizModal from './ConfirmDeleteNotizModal';

interface AddEditNotizModalProps {
  isOpen: boolean;
  onClose: () => void;
  notizToEdit: Notiz | null;
  kategorieId: string;
}

const AddEditNotizModal: React.FC<AddEditNotizModalProps> = ({ isOpen, onClose, notizToEdit, kategorieId }) => {
  const { onAddNotiz, onUpdateNotiz } = useToolsContext();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (notizToEdit) {
        setTitle(notizToEdit.title);
        setContent(notizToEdit.content);
      } else {
        setTitle('');
        setContent('');
      }
      setTimeout(() => titleInputRef.current?.focus(), 100);
    }
  }, [isOpen, notizToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      if (notizToEdit) {
        await onUpdateNotiz(notizToEdit.id, title.trim(), content);
      } else {
        await onAddNotiz(kategorieId, title.trim(), content);
      }
      onClose();
    }
  };
  
  const handleDeleteRequest = () => {
      setIsConfirmDeleteOpen(true);
  };

  const modalTitle = notizToEdit ? 'Notiz bearbeiten' : 'Neue Notiz erstellen';
  const hasChanges = notizToEdit ? title.trim() !== notizToEdit.title || content !== notizToEdit.content : title.trim() !== '' || content !== '';

  return (
    <>
        <Modal isOpen={isOpen} onClose={onClose} title={modalTitle} size="lg">
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                ref={titleInputRef}
                label="Titel"
                id="notiz-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Titel Ihrer Notiz"
                required
                />
                <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Schreiben Sie hier Ihre Notiz..."
                className="w-full h-64 p-3 bg-[var(--color-ui-secondary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-border-focus)] transition-colors resize-y"
                />
                <div className="flex items-center justify-between pt-4">
                    {notizToEdit ? (
                        <Button type="button" variant="danger" onClick={handleDeleteRequest}>
                            <TrashIcon />
                            <span>Löschen</span>
                        </Button>
                    ) : <div />}
                    <div className="flex space-x-3">
                        <Button type="button" variant="secondary" onClick={onClose}>
                            Abbrechen
                        </Button>
                        <Button type="submit" disabled={!title.trim() || !hasChanges}>
                            {notizToEdit ? 'Speichern' : 'Erstellen'}
                        </Button>
                    </div>
                </div>
            </form>
        </Modal>
        {notizToEdit && (
            <ConfirmDeleteNotizModal
                isOpen={isConfirmDeleteOpen}
                onClose={() => setIsConfirmDeleteOpen(false)}
                onConfirm={() => {
                    onClose(); // Close edit modal after confirm
                }}
                notizToDelete={notizToEdit}
            />
        )}
    </>
  );
};

export default AddEditNotizModal;
