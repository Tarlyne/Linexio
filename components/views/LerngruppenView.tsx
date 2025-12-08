import React, { useState, useEffect } from 'react';
import LerngruppeCard from '../LerngruppeCard';
import Button from '../ui/Button';
import { PlusIcon, InformationCircleIcon, SparklesIcon } from '../icons';
import { useLerngruppenContext } from '../../context/LerngruppenContext';
import { useUIContext } from '../../context/UIContext';
import { Lerngruppe } from '../../context/types';
import AddLerngruppeModal from '../modals/AddLerngruppeModal';
import EditLerngruppeModal from '../modals/EditLerngruppeModal';
import ConfirmDeleteLerngruppeModal from '../modals/ConfirmDeleteLerngruppeModal';
import { useLicenseContext } from '../../context/LicenseContext';

const LerngruppenView: React.FC = () => {
  const { lerngruppen, onReorderLerngruppe, allSchueler } = useLerngruppenContext();
  const { handleNavigate, currentSchoolYear, systemSchoolYear, onSetCurrentSchoolYear, setHeaderConfig } = useUIContext();
  const { licenseStatus } = useLicenseContext();

  const [isAddLerngruppeModalOpen, setAddLerngruppeModalOpen] = useState(false);
  const [lerngruppeToEdit, setLerngruppeToEdit] = useState<Lerngruppe | null>(null);
  const [lerngruppeToDelete, setLerngruppeToDelete] = useState<Lerngruppe | null>(null);

  const isArchivedView = currentSchoolYear !== systemSchoolYear;
  const filteredLerngruppen = lerngruppen.filter((lg: Lerngruppe) => lg.schuljahr === currentSchoolYear);

  const isLimitReached = licenseStatus === 'FREEMIUM' && filteredLerngruppen.length >= 3;

  useEffect(() => {
    const banner = isArchivedView ? (
      <div className="flex-shrink-0 bg-[var(--color-warning-primary-transparent)] text-[var(--color-text-primary)] px-6 md:px-8 py-2 flex items-center justify-between shadow-lg z-10">
        <div className="flex items-center space-x-3">
          <InformationCircleIcon className="w-6 h-6" />
          <p className="text-sm font-semibold">
            Sie betrachten das Archiv-Schuljahr <span className="font-bold underline">{currentSchoolYear}</span>.
          </p>
        </div>
        <button onClick={() => onSetCurrentSchoolYear(systemSchoolYear)} className="text-sm font-bold hover:underline">
          Zurück zum aktuellen Schuljahr ({systemSchoolYear}) →
        </button>
      </div>
    ) : null;

    setHeaderConfig({
      title: "Meine Lerngruppen",
      subtitle: <p className="text-sm text-[var(--color-accent-text)]">{isArchivedView ? `Archiv: Schuljahr ${currentSchoolYear}` : 'Übersicht'}</p>,
      onBack: undefined,
      banner: banner
    });
    
    return () => {
        // FIX: Use functional update to only reset the banner, preserving other header config properties.
        setHeaderConfig(prev => ({ ...prev, banner: null }));
    }
  }, [setHeaderConfig, isArchivedView, currentSchoolYear, systemSchoolYear, onSetCurrentSchoolYear]);

  return (
    <>
      <div className="flex justify-start items-start mb-6 flex-shrink-0 flex-col sm:flex-row sm:items-center gap-4">
        <Button onClick={() => setAddLerngruppeModalOpen(true)} disabled={isArchivedView || isLimitReached}>
          <PlusIcon />
          <span>Neue Lerngruppe</span>
        </Button>
        {isLimitReached && (
          <div className="flex items-center space-x-2 text-sm text-[var(--color-warning-text)]">
            <SparklesIcon className="w-5 h-5" />
            <span>Freemium-Limit erreicht. Upgraden Sie für unbegrenzte Lerngruppen.</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto pr-2 -mr-2">
        {filteredLerngruppen.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredLerngruppen.map((lg: Lerngruppe, index: number) => {
                const studentsInGroup = allSchueler.filter(s => lg.schuelerIds.includes(s.id));
                const genderStats = {
                    m: studentsInGroup.filter(s => s.gender === 'm').length,
                    w: studentsInGroup.filter(s => s.gender === 'w').length,
                    d: studentsInGroup.filter(s => s.gender === 'd').length
                };

                return (
                  <LerngruppeCard
                    key={lg.id}
                    lerngruppe={lg}
                    schuelerCount={lg.schuelerIds.length}
                    genderStats={genderStats}
                    onSelect={() => handleNavigate('lerngruppeDetail', lg.id)}
                    onEdit={() => setLerngruppeToEdit(lg)}
                    onMoveUp={() => onReorderLerngruppe(lg.id, 'up')}
                    onMoveDown={() => onReorderLerngruppe(lg.id, 'down')}
                    isFirst={index === 0}
                    isLast={index === filteredLerngruppen.length - 1}
                    isArchived={isArchivedView}
                  />
                );
            })}
          </div>
        ) : (
          <div className="text-center p-12 bg-[var(--color-ui-primary)] rounded-lg border border-[var(--color-border)] max-w-2xl mx-auto mt-10">
            <h3 className="text-xl font-semibold text-[var(--color-text-secondary)]">Keine Lerngruppen für das Schuljahr {currentSchoolYear} gefunden.</h3>
            <p className="text-[var(--color-text-tertiary)] mt-2">Erstellen Sie Ihre erste Lerngruppe, um zu beginnen.</p>
          </div>
        )}
      </div>

      <AddLerngruppeModal 
        isOpen={isAddLerngruppeModalOpen} 
        onClose={() => setAddLerngruppeModalOpen(false)} 
      />
      <EditLerngruppeModal 
        lerngruppeToEdit={lerngruppeToEdit} 
        onClose={() => setLerngruppeToEdit(null)} 
        onDeleteRequest={setLerngruppeToDelete} 
      />
      <ConfirmDeleteLerngruppeModal 
        lerngruppeToDelete={lerngruppeToDelete} 
        onClose={() => setLerngruppeToDelete(null)} 
      />
    </>
  );
};

export default LerngruppenView;