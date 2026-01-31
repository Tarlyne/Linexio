import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLerngruppenContext } from '../../context/LerngruppenContext';
import { Schueler } from '../../context/types';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import { PencilIcon, CameraIcon, CloseIcon, TagIcon, TrashIcon } from '../icons';
import { useUIContext } from '../../context/UIContext';

type AkteTab = 'akte' | 'notizen';

const ReadOnlyField: React.FC<{label: string, value: React.ReactNode}> = ({label, value}) => (
    <div>
        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">{label}</label>
        <div className="w-full px-3 bg-[var(--color-ui-secondary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] h-9 flex items-center">{value || <span className="text-[var(--color-text-tertiary)] opacity-50">N/A</span>}</div>
    </div>
);


const SchuelerAkteView: React.FC = () => {
  const { selectedSchueler, onUpdateSchueler } = useLerngruppenContext();
  const { onBackToLerngruppeDetail, setHeaderConfig } = useUIContext();

  const [activeTab, setActiveTab] = useState<AkteTab>('akte');
  const [isEditing, setIsEditing] = useState(false);
  
  const [formData, setFormData] = useState<Schueler | null>(selectedSchueler);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [newMerkmal, setNewMerkmal] = useState('');

  const imageSizeInKB = useMemo(() => {
    if (!formData?.profilePicture) return null;
    const base64 = formData.profilePicture;
    // Approximation der originalen Dateigröße in Bytes aus dem Base64-String
    const padding = (base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0);
    const bytes = (base64.length * 3 / 4) - padding;
    const kb = bytes / 1024;
    return kb.toFixed(1);
  }, [formData?.profilePicture]);

  useEffect(() => {
    if (selectedSchueler) {
      setHeaderConfig({
        title: `${selectedSchueler.lastName}, ${selectedSchueler.firstName}`,
        subtitle: <p className="text-sm text-[var(--color-accent-text)]">SchülerInnenakte</p>,
        onBack: onBackToLerngruppeDetail,
        banner: null
      });
    }
  }, [selectedSchueler, setHeaderConfig, onBackToLerngruppeDetail]);

  useEffect(() => {
    setFormData(selectedSchueler);
    setIsEditing(false); // Reset edit mode when schueler changes
  }, [selectedSchueler]);

  if (!selectedSchueler || !formData) {
    return <p>Kein Schüler ausgewählt.</p>;
  }
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'hasNachteilsausgleich') {
        const hasNTA = value === 'true';
        setFormData(prev => prev ? ({
            ...prev,
            hasNachteilsausgleich: hasNTA,
            nachteilsausgleichDetails: hasNTA ? prev.nachteilsausgleichDetails : '' 
        }) : null);
    } else {
        setFormData(prev => prev ? ({ ...prev, [name]: value }) : null);
    }
  };
  
  const handleSave = () => {
      if (formData) {
          onUpdateSchueler(formData);
      }
      setIsEditing(false);
  };
  
  const handleCancel = () => {
      setFormData(selectedSchueler);
      setIsEditing(false);
  };

  const handleRemoveImage = () => {
      setFormData(prev => prev ? ({ ...prev, profilePicture: undefined }) : null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && formData) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const MAX_WIDTH = 400;
          const MAX_HEIGHT = 400;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          ctx.drawImage(img, 0, 0, width, height);
          
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8); // Compress to JPEG with 80% quality
          const pureBase64 = dataUrl.split(',')[1];

          const updatedSchueler = { ...formData, profilePicture: pureBase64 };
          setFormData(updatedSchueler);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddMerkmal = () => {
    if (newMerkmal.trim() && !formData.paedagogischeMerkmale?.includes(newMerkmal.trim())) {
        setFormData(prev => prev ? ({
            ...prev,
            paedagogischeMerkmale: [...(prev.paedagogischeMerkmale || []), newMerkmal.trim()]
        }) : null);
        setNewMerkmal('');
    }
  };

  const handleRemoveMerkmal = (merkmalToRemove: string) => {
      setFormData(prev => prev ? ({
          ...prev,
          paedagogischeMerkmale: (prev.paedagogischeMerkmale || []).filter(m => m !== merkmalToRemove)
      }) : null);
  };

  const getInitials = (firstName: string, lastName: string) => {
    const first = firstName ? firstName[0] : '';
    const last = lastName ? lastName[0] : '';
    return `${first}${last}`.toUpperCase();
  }

  const getAge = (birthday: string) => {
    if (!birthday) return null;
    const birthDate = new Date(birthday);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="w-full max-w-5xl flex flex-col mx-auto">
      <input
        type="file"
        ref={imageInputRef}
        className="hidden"
        accept="image/*"
        capture="user" 
        onChange={handleImageUpload}
      />
      
      <div className="flex justify-between items-start mb-6 flex-shrink-0">
        <div className="flex items-center space-x-6">
            <div className="relative group">
                {formData.profilePicture ? (
                    <img 
                        src={`data:image/jpeg;base64,${formData.profilePicture}`} 
                        alt="Profilbild" 
                        className="w-24 h-24 rounded-full object-cover border-4 border-[var(--color-border)]"
                    />
                ) : (
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[var(--color-accent-primary-hover)] to-[var(--color-accent-primary)] text-[var(--color-accent-text-inverted)] flex items-center justify-center border-4 border-[var(--color-border)]">
                        <span className="text-4xl font-bold">{getInitials(formData.firstName, formData.lastName)}</span>
                    </div>
                )}
                {isEditing && (
                    <>
                        <button 
                            onClick={() => imageInputRef.current?.click()}
                            className="absolute bottom-0 right-0 bg-[var(--color-ui-tertiary)] hover:bg-[var(--color-accent-primary)] text-[var(--color-text-primary)] p-2 rounded-full transition-colors shadow-md"
                            aria-label="Profilbild ändern"
                        >
                            <CameraIcon className="w-5 h-5" />
                        </button>
                        {formData.profilePicture && (
                            <button 
                                onClick={handleRemoveImage}
                                className="absolute top-0 right-0 bg-[var(--color-danger-primary)] hover:bg-[var(--color-danger-primary-hover)] text-[var(--color-text-primary)] p-2 rounded-full transition-colors shadow-md"
                                aria-label="Profilbild löschen"
                            >
                                <TrashIcon className="w-4 h-4" />
                            </button>
                        )}
                    </>
                )}
            </div>
            <div>
                <h1 className="text-4xl font-bold text-[var(--color-text-primary)]">{selectedSchueler.lastName}, {selectedSchueler.firstName}</h1>
                <p className="text-xl text-[var(--color-accent-text)]">SchülerInnenakte</p>
                 {imageSizeInKB && (
                    <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                        Größe: {imageSizeInKB} KB
                    </p>
                )}
            </div>
        </div>

        <div>
            {isEditing ? (
                <div className="flex space-x-3">
                    <Button variant="secondary" onClick={handleCancel}>Abbrechen</Button>
                    <Button onClick={handleSave}>Änderungen speichern</Button>
                </div>
            ) : (
                <Button onClick={() => setIsEditing(true)}>
                    <PencilIcon />
                    <span>Akte bearbeiten</span>
                </Button>
            )}
        </div>
      </div>

      <div className="mb-4 flex-shrink-0">
        <div className="border-b border-[var(--color-border)]">
          <nav className="-mb-px flex space-x-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('akte')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'akte'
                  ? 'border-[var(--color-accent-border-focus)] text-[var(--color-accent-text)]'
                  : 'border-transparent text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] hover:border-[var(--color-ui-tertiary)]'
              }`}
            >
              Akte
            </button>
            <button
              onClick={() => setActiveTab('notizen')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'notizen'
                  ? 'border-[var(--color-accent-border-focus)] text-[var(--color-accent-text)]'
                  : 'border-transparent text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] hover:border-[var(--color-ui-tertiary)]'
              }`}
            >
              Notizen
            </button>
          </nav>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'akte' && (
          <div className="bg-[var(--color-ui-primary)] p-6 rounded-lg border border-[var(--color-border)]">
              <div>
                <h3 className="text-xl font-bold text-[var(--color-accent-text)] mb-4">Stammdaten</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                  {isEditing ? (
                      <>
                          <Input className="h-9" label="Nachname" id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} required />
                          <Input className="h-9" label="Vorname" id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} required />
                          <Select className="h-9" label="Geschlecht" id="gender" name="gender" value={formData.gender} onChange={handleChange} options={[
                              { value: 'm', label: 'Männlich' },
                              { value: 'w', label: 'Weiblich' },
                              { value: 'd', label: 'Divers' },
                          ]} required />
                          <Input 
                              className="h-9" 
                              label="Geburtstag" 
                              id="birthday" 
                              name="birthday" 
                              type="date" 
                              value={formData.birthday || ''} 
                              onChange={handleChange}
                              onClear={() => handleChange({ target: { name: 'birthday', value: '' } } as any)}
                          />
                          <ReadOnlyField label="Alter" value={getAge(formData.birthday)} />
                          <Input className="h-9" label="Kontakt Erziehungsberechtigte/r" id="contactGuardian1" name="contactGuardian1" value={formData.contactGuardian1 || ''} onChange={handleChange} placeholder="Name, Telefon, E-Mail..." />
                          <Input className="h-9" label="Zweiter Kontakt" id="contactGuardian2" name="contactGuardian2" value={formData.contactGuardian2 || ''} onChange={handleChange} placeholder="Name, Telefon, E-Mail..." />
                          <Select 
                              className="h-9"
                              label="Nachteilsausgleich" 
                              id="hasNachteilsausgleich" 
                              name="hasNachteilsausgleich" 
                              value={String(!!formData.hasNachteilsausgleich)} 
                              onChange={handleChange} 
                              options={[
                                  { value: 'false', label: 'Nein' },
                                  { value: 'true', label: 'Ja' },
                              ]} 
                          />
                      </>
                  ) : (
                      <>
                          <ReadOnlyField label="Nachname" value={selectedSchueler.lastName} />
                          <ReadOnlyField label="Vorname" value={selectedSchueler.firstName} />
                          <ReadOnlyField label="Geschlecht" value={{d: 'Divers', w: 'Weiblich', m: 'Männlich'}[selectedSchueler.gender]} />
                          <ReadOnlyField label="Geburtstag" value={selectedSchueler.birthday ? new Date(selectedSchueler.birthday).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : null} />
                          <ReadOnlyField label="Alter" value={getAge(selectedSchueler.birthday)} />
                          <ReadOnlyField label="Kontakt Erziehungsberechtigte/r" value={selectedSchueler.contactGuardian1} />
                          <ReadOnlyField label="Zweiter Kontakt" value={selectedSchueler.contactGuardian2} />
                          <ReadOnlyField label="Nachteilsausgleich" value={selectedSchueler.hasNachteilsausgleich ? 'Ja' : 'Nein'} />
                      </>
                  )}
                </div>
              </div>

              {isEditing && formData.hasNachteilsausgleich && (
                  <>
                      <hr className="border-[var(--color-border)] my-4" />
                      <div>
                          <h3 className="text-xl font-bold text-[var(--color-accent-text)] mb-4">Details zum Nachteilsausgleich</h3>
                          <textarea 
                              name="nachteilsausgleichDetails"
                              value={formData.nachteilsausgleichDetails || ''}
                              onChange={handleChange}
                              placeholder="Hier Details zum NTA eintragen (z.B. 25% Zeitverlängerung, Nutzung eines Lesestifts...)"
                              className="w-full h-32 p-3 bg-[var(--color-ui-secondary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-border-focus)] focus:border-[var(--color-accent-border-focus)] transition-colors"
                          />
                      </div>
                  </>
              )}

              {!isEditing && selectedSchueler.hasNachteilsausgleich && (
                  <>
                      <hr className="border-[var(--color-border)] my-4" />
                      <div>
                          <h3 className="text-xl font-bold text-[var(--color-accent-text)] mb-4">Details zum Nachteilsausgleich</h3>
                          <div className="w-full min-h-[80px] p-3 bg-[var(--color-ui-secondary)]/50 rounded-lg text-[var(--color-text-primary)] whitespace-pre-wrap">
                              {selectedSchueler.nachteilsausgleichDetails || <span className="text-[var(--color-text-tertiary)] opacity-50">Keine Details vorhanden.</span>}
                          </div>
                      </div>
                  </>
              )}
              
              <hr className="border-[var(--color-border)] my-4" />
              
              <div>
                  <h3 className="text-xl font-bold text-[var(--color-accent-text)] mb-4 flex items-center space-x-2">
                      <TagIcon className="w-6 h-6" />
                      <span>Pädagogische Merkmale</span>
                  </h3>
                  {isEditing ? (
                      <div className="space-y-4">
                          <div className="flex flex-wrap gap-2">
                              {(formData.paedagogischeMerkmale || []).map(merkmal => (
                                  <span key={merkmal} className="flex items-center bg-[var(--color-ui-tertiary)] text-[var(--color-text-primary)] text-sm font-medium px-3 py-1 rounded-full">
                                      {merkmal}
                                      <button onClick={() => handleRemoveMerkmal(merkmal)} className="ml-2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]">
                                          <CloseIcon className="w-4 h-4" />
                                      </button>
                                  </span>
                              ))}
                          </div>
                          <div className="flex items-end space-x-2">
                              <div className="flex-grow">
                                  <Input
                                      className="h-9"
                                      label="Neues Merkmal hinzufügen"
                                      id="new-merkmal"
                                      value={newMerkmal}
                                      onChange={(e) => setNewMerkmal(e.target.value)}
                                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddMerkmal(); } }}
                                      placeholder="z.B. unruhig, hilfsbereit..."
                                  />
                              </div>
                              <Button type="button" onClick={handleAddMerkmal} variant="secondary" className="h-9">
                                  Hinzufügen
                              </Button>
                          </div>
                      </div>
                  ) : (
                      <div className="flex flex-wrap gap-2 min-h-[42px] items-center">
                          {(selectedSchueler.paedagogischeMerkmale || []).length > 0 ? (
                              selectedSchueler.paedagogischeMerkmale.map(merkmal => (
                                  <span key={merkmal} className="bg-[var(--color-ui-secondary)]/50 text-[var(--color-text-secondary)] text-sm font-medium px-3 py-1 rounded-full">
                                      {merkmal}
                                  </span>
                              ))
                          ) : (
                              <p className="text-[var(--color-text-tertiary)] opacity-50">Keine Merkmale vorhanden.</p>
                          )}
                      </div>
                  )}
              </div>

            </div>
        )}

        {activeTab === 'notizen' && (
            <div className="bg-[var(--color-ui-primary)] p-6 rounded-lg border border-[var(--color-border)] flex flex-col">
                <h3 className="text-xl font-bold text-[var(--color-accent-text)] mb-4 flex-shrink-0">Notizen & Beobachtungen</h3>
                <textarea 
                    name="notes"
                    value={formData.notes || ''}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder={isEditing ? "Hier Notizen eintragen..." : "Keine Notizen vorhanden."}
                    className="w-full h-96 p-3 bg-[var(--color-ui-secondary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-border-focus)] focus:border-[var(--color-accent-border-focus)] transition-colors disabled:bg-[var(--color-ui-secondary)]/50 disabled:cursor-not-allowed"
                />
            </div>
        )}
      </div>
    </div>
  );
};

export default SchuelerAkteView;