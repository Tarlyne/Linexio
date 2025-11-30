import React, { useState, useEffect, useRef } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Select from '../ui/Select';
import { useLerngruppenContext } from '../../context/LerngruppenContext';
import { PREDEFINED_NOTENSYSTEME, Lerngruppe } from '../../context/types';
import { useLicenseContext } from '../../context/LicenseContext';
import { useUIContext } from '../../context/UIContext';
import { SparklesIcon } from '../icons';

interface AddLerngruppeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddLerngruppeModal: React.FC<AddLerngruppeModalProps> = ({ isOpen, onClose }) => {
  const { handleAddLerngruppe, lerngruppen } = useLerngruppenContext();
  const { licenseStatus } = useLicenseContext();
  const { currentSchoolYear } = useUIContext();

  const [name, setName] = useState('');
  const [fach, setFach] = useState('');
  const [notensystemId, setNotensystemId] = useState(PREDEFINED_NOTENSYSTEME[0]?.id || '');
  
  const nameInputRef = useRef<HTMLInputElement>(null);

  const currentLerngruppen = lerngruppen.filter((lg: Lerngruppe) => lg.schuljahr === currentSchoolYear);
  const isLimitReached = licenseStatus === 'FREEMIUM' && currentLerngruppen.length >= 3;

  useEffect(() => {
    if (isOpen) {
      setName('');
      setFach('');
      setNotensystemId(PREDEFINED_NOTENSYSTEME[0]?.id || '');
      setTimeout(() => nameInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && fach.trim() && notensystemId) {
      handleAddLerngruppe({ name, fach, notensystemId });
      onClose();
    }
  };

  const notensystemOptions = PREDEFINED_NOTENSYSTEME.map(system => ({
      value: system.id,
      label: system.name,
  }));

  const renderContent = () => {
    if (isLimitReached) {
      return (
        <div className="text-center space-y-4">
            <SparklesIcon className="w-16 h-16 text-[var(--color-warning-text)] mx-auto" />
            <h3 className="text-xl font-bold text-[var(--color-text-primary)]">Freemium-Limit erreicht</h3>
            <p className="text-[var(--color-text-secondary)]">
                In der kostenlosen Version können Sie bis zu 3 Lerngruppen verwalten. Um weitere Lerngruppen zu erstellen, ist ein Upgrade erforderlich.
            </p>
            <div className="flex justify-end pt-4">
                <Button type="button" onClick={onClose}>
                    Verstanden
                </Button>
            </div>
        </div>
      );
    }

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          ref={nameInputRef}
          label="Name der Lerngruppe"
          id="lg-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="z.B. Mathe 10a"
          required
        />
        <Input
          label="Fach"
          id="lg-fach"
          value={fach}
          onChange={(e) => setFach(e.target.value)}
          placeholder="z.B. Mathematik"
          required
        />
        <Select
          label="Notensystem"
          id="lg-notensystem"
          value={notensystemId}
          onChange={(e) => setNotensystemId(e.target.value)}
          options={notensystemOptions}
          required
        />
        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Abbrechen
          </Button>
          <Button type="submit" disabled={!name.trim() || !fach.trim() || !notensystemId}>
            Erstellen
          </Button>
        </div>
      </form>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isLimitReached ? 'Upgrade erforderlich' : 'Neue Lerngruppe erstellen'}>
      {renderContent()}
    </Modal>
  );
};

export default AddLerngruppeModal;