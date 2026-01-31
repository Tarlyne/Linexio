import React, { useState, useRef, useEffect } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Select from '../ui/Select';
import { useLerngruppenContext } from '../../context/LerngruppenContext';
import { Gender, Schueler } from '../../context/types';

interface AddSchuelerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddSchuelerModal: React.FC<AddSchuelerModalProps> = ({ isOpen, onClose }) => {
  const { handleAddSchueler, selectedLerngruppe } = useLerngruppenContext();
  
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [gender, setGender] = useState<Gender | ''>('');
  const [birthday, setBirthday] = useState('');
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const lastNameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => lastNameInputRef.current?.focus(), 100);
    } else {
      setFeedback(null);
    }
  }, [isOpen]);

  const resetForm = () => {
    setLastName('');
    setFirstName('');
    setGender('');
    setBirthday('');
    lastNameInputRef.current?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedLerngruppe && firstName.trim() && lastName.trim() && gender) {
      try {
        const schuelerData: Omit<Schueler, 'id'> = { 
          firstName: firstName.trim(), 
          lastName: lastName.trim(),
          gender,
          birthday,
        };
        handleAddSchueler(schuelerData, selectedLerngruppe.id);
        setFeedback({ message: 'SchülerIn erfolgreich hinzugefügt.', type: 'success' });
        resetForm();
        setTimeout(() => setFeedback(null), 2000);
      } catch (error) {
        setFeedback({ message: 'Fehler beim Hinzufügen.', type: 'error' });
        setTimeout(() => setFeedback(null), 3000);
      }
    }
  };
  
  if (!selectedLerngruppe) return null;

  const isFormValid = firstName.trim() && lastName.trim() && gender;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="SchülerIn hinzufügen">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          ref={lastNameInputRef}
          label="Nachname"
          id="s-lastname"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          placeholder="Mustermann"
          required
        />
        <Input
          label="Vorname"
          id="s-firstname"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="Max"
          required
        />
        <Select
          label="Geschlecht"
          id="s-gender"
          value={gender}
          onChange={(e) => setGender(e.target.value as Gender | '')}
          options={[
            { value: '', label: 'Bitte wählen...' },
            { value: 'm', label: 'Männlich' },
            { value: 'w', label: 'Weiblich' },
            { value: 'd', label: 'Divers' },
          ]}
          required
        />
        <Input
          label="Geburtstag"
          id="s-birthday"
          type="date"
          value={birthday}
          onChange={(e) => setBirthday(e.target.value)}
        />
        <div className="flex justify-between items-center pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Schließen
          </Button>
          <Button type="submit" disabled={!isFormValid}>
            Speichern
          </Button>
        </div>
        <div className="mt-2 h-5 text-center">
          {feedback && (
            <span
              className={`text-sm transition-opacity duration-300 ${
                feedback.type === 'success' ? 'text-[var(--color-success-text)]' : 'text-[var(--color-danger-text)]'
              }`}
            >
              {feedback.message}
            </span>
          )}
        </div>
      </form>
    </Modal>
  );
};

export default AddSchuelerModal;