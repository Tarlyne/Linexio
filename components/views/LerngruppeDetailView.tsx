import React, { useMemo, useState, useEffect } from 'react';
import Button from '../ui/Button';
import { PlusIcon, UserPlusIcon, LayoutGridIcon, ClipboardCheckIcon, CalculatorIcon, ShuffleIcon, DocumentDuplicateIcon, InformationCircleIcon, UsersIcon, DocumentArrowDownIcon, ChevronDownIcon } from '../icons';
import SchuelerListItem from '../SchuelerListItem';
import ToolCard from '../ui/ToolCard';
import { useLerngruppenContext } from '../../context/LerngruppenContext';
import { useUIContext } from '../../context/UIContext';
import { Schueler, Lerngruppe } from '../../context/types';
import AddSchuelerModal from '../modals/AddSchuelerModal';
import ConfirmDeleteSchuelerModal from '../modals/ConfirmDeleteSchuelerModal';
import CopyLerngruppeModal from '../modals/CopyLerngruppeModal';
import ZuordnenSchuelerModal from '../modals/ZuordnenSchuelerModal';
import CsvImportModal from '../modals/CsvImportModal';
import PopoverMenu from '../ui/PopoverMenu';
import PopoverMenuItem from '../ui/PopoverMenuItem';

const LerngruppeDetailView: React.FC = () => {
  const { schuelerInSelectedLerngruppe, selectedLerngruppe } = useLerngruppenContext();
  const { handleNavigate, onShowTool, systemSchoolYear, onShowNotenverwaltung, onBackToLerngruppen, currentSchoolYear, onSetCurrentSchoolYear, setHeaderConfig } = useUIContext();

  const [isAddSchuelerModalOpen, setAddSchuelerModalOpen] = useState(false);
  const [isZuordnenModalOpen, setZuordnenModalOpen] = useState(false);
  const [isCsvImportModalOpen, setCsvImportModalOpen] = useState(false);
  const [schuelerToDelete, setSchuelerToDelete] = useState<Schueler | null>(null);
  const [lerngruppeToCopy, setLerngruppeToCopy] = useState<Lerngruppe | null>(null);
  const [importMenuAnchor, setImportMenuAnchor] = useState<HTMLElement | null>(null);
  
  const isArchivedView = currentSchoolYear !== systemSchoolYear;

  useEffect(() => {
    if (selectedLerngruppe) {
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
        title: selectedLerngruppe.name,
        subtitle: <p className="text-sm text-[var(--color-accent-text)]">{selectedLerngruppe.fach}</p>,
        onBack: onBackToLerngruppen,
        banner: banner,
      });

      return () => {
          // FIX: Use functional update to only reset the banner, preserving other header config properties.
          setHeaderConfig(prev => ({ ...prev, banner: null }));
      }
    }
  }, [selectedLerngruppe, isArchivedView, currentSchoolYear, systemSchoolYear, onSetCurrentSchoolYear, setHeaderConfig, onBackToLerngruppen]);

  if (!selectedLerngruppe) {
    return <p>Keine Lerngruppe ausgewählt.</p>;
  }

  const sortedSchueler = useMemo(() => 
    [...schuelerInSelectedLerngruppe].sort((a: Schueler, b: Schueler) => 
      a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName)
    ), [schuelerInSelectedLerngruppe]);

  return (
    <>
      <div className="grid grid-rows-[auto_1fr] h-full gap-y-6">
        {/* Row 1: Headers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-shrink-0">
            {/* Left Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-semibold text-[var(--color-text-primary)]">Übersicht ({sortedSchueler.length})</h2>
                </div>
                <div className="flex items-center space-x-3 flex-wrap gap-y-2">
                    {isArchivedView && (
                        <Button variant="secondary" onClick={() => setLerngruppeToCopy(selectedLerngruppe)}>
                            <DocumentDuplicateIcon className="w-5 h-5"/>
                            <span>Klasse übernehmen</span>
                        </Button>
                    )}
                    {!isArchivedView && (
                        <>
                            <Button 
                                variant="secondary" 
                                onClick={(e) => setImportMenuAnchor(e.currentTarget)} 
                                className={!!importMenuAnchor ? 'bg-[var(--color-accent-secondary-transparent-50)] border-[var(--color-accent-border-focus)]' : ''}
                            >
                                <span>Importieren</span>
                                <ChevronDownIcon className={`w-4 h-4 ml-1 transition-transform ${importMenuAnchor ? 'rotate-180' : ''}`} />
                            </Button>
                            <Button onClick={() => setAddSchuelerModalOpen(true)}>
                                <PlusIcon />
                                <span>Neu</span>
                            </Button>
                        </>
                    )}
                </div>
            </div>
            {/* Right Header */}
            <div>
                <h2 className="text-2xl font-semibold text-[var(--color-text-primary)]">Tools</h2>
            </div>
        </div>
        
        {/* Row 2: Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-0">
            {/* Left Content: Student List */}
            <div className="bg-[var(--color-ui-primary)] rounded-lg border border-[var(--color-border)] overflow-y-auto">
                {sortedSchueler.length > 0 ? (
                <ul className="divide-y divide-[var(--color-border)]">
                    {sortedSchueler.map((s: Schueler, index: number) => (
                    <SchuelerListItem
                        key={s.id}
                        schueler={s}
                        index={index}
                        onSelect={() => handleNavigate('schuelerAkte', selectedLerngruppe.id, s.id)}
                        onDelete={(e) => {
                        e.stopPropagation();
                        setSchuelerToDelete(s);
                        }}
                        isDeleteDisabled={isArchivedView}
                    />
                    ))}
                </ul>
                ) : (
                <div className="text-center p-12 border-2 border-dashed border-[var(--color-border)] rounded-lg m-4">
                    <h3 className="text-xl font-semibold text-[var(--color-text-secondary)]">Diese Lerngruppe hat noch keine SchülerInnen.</h3>
                    {!isArchivedView && <p className="text-[var(--color-text-tertiary)] mt-2">Fügen Sie die erste Person hinzu, um zu beginnen.</p>}
                </div>
                )}
            </div>

            {/* Right Content: Tools */}
            <div className="overflow-y-auto pr-2 -mr-2">
                <div className="space-y-4 max-w-md">
                    <ToolCard
                        icon={<CalculatorIcon className="w-8 h-8"/>}
                        title="Notenverwaltung"
                        description="Noten eingeben, gewichten und Leistungsnachweise verwalten."
                        onClick={() => onShowNotenverwaltung(selectedLerngruppe.id)}
                    />
                    <ToolCard
                        icon={<ClipboardCheckIcon />}
                        title="Checklisten"
                        description="Verwaltet Anwesenheit oder erledigte Aufgaben."
                        onClick={() => onShowTool('checklisten', selectedLerngruppe.id)}
                    />
                    <ToolCard
                        icon={<UsersIcon />}
                        title="Gruppeneinteilung"
                        description="Erstellt zufällige oder kriterienbasierte Gruppen."
                        onClick={() => onShowTool('gruppeneinteilung', selectedLerngruppe.id)}
                    />
                    <ToolCard
                        icon={<LayoutGridIcon />}
                        title="Sitzplan"
                        description="Erstellt und verwaltet visuelle Sitzpläne."
                        onClick={() => onShowTool('sitzplan', selectedLerngruppe.id)}
                    />
                    <ToolCard
                        icon={<ShuffleIcon className="w-8 h-8"/>}
                        title="ZufallsschülerIn"
                        description="Wählt eine zufällige Person aus, die noch nicht aufgerufen wurde."
                        onClick={() => onShowTool('zufallsschueler', selectedLerngruppe.id)}
                    />
                </div>
            </div>
        </div>
      </div>

      <PopoverMenu
        isOpen={!!importMenuAnchor}
        anchorEl={importMenuAnchor}
        onClose={() => setImportMenuAnchor(null)}
      >
        <PopoverMenuItem
            icon={<DocumentArrowDownIcon className="w-5 h-5" />}
            label="Aus CSV-Datei"
            onClick={() => {
                setCsvImportModalOpen(true);
                setImportMenuAnchor(null);
            }}
        />
        <PopoverMenuItem
            icon={<UserPlusIcon className="w-5 h-5" />}
            label="Aus anderer Klasse"
            onClick={() => {
                setZuordnenModalOpen(true);
                setImportMenuAnchor(null);
            }}
        />
      </PopoverMenu>

      <AddSchuelerModal 
        isOpen={isAddSchuelerModalOpen} 
        onClose={() => setAddSchuelerModalOpen(false)} 
      />
      <ZuordnenSchuelerModal
        isOpen={isZuordnenModalOpen}
        onClose={() => setZuordnenModalOpen(false)}
      />
      <CsvImportModal
        isOpen={isCsvImportModalOpen}
        onClose={() => setCsvImportModalOpen(false)}
      />
      <ConfirmDeleteSchuelerModal 
        schuelerToDelete={schuelerToDelete} 
        onClose={() => setSchuelerToDelete(null)}
        lerngruppeId={selectedLerngruppe.id}
      />
      <CopyLerngruppeModal 
        lerngruppeToCopy={lerngruppeToCopy} 
        onClose={() => setLerngruppeToCopy(null)} 
      />
    </>
  );
};

export default LerngruppeDetailView;
