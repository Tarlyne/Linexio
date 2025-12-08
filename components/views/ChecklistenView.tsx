import React, { useState, useMemo, useEffect } from 'react';
import { useLerngruppenContext } from '../../context/LerngruppenContext';
import { Checkliste, ChecklistenEintrag, ChecklistenStatusValue } from '../../context/types';
import Button from '../ui/Button';
import { PlusIcon, CheckIcon, XIcon, MinusIcon, EllipsisVerticalIcon, InformationCircleIcon, CalendarDaysIcon } from '../icons';
import AddChecklisteModal from '../modals/AddChecklisteModal';
import AddChecklistenEintragModal from '../modals/AddChecklistenEintragModal';
import EditChecklistenEintragModal from '../modals/EditChecklistenEintragModal';
import ConfirmDeleteChecklistenEintragModal from '../modals/ConfirmDeleteChecklistenEintragModal';
import EditChecklisteModal from '../modals/EditChecklisteModal';
import ConfirmDeleteChecklisteModal from '../modals/ConfirmDeleteChecklisteModal';
import { useToolsContext } from '../../context/ToolsContext';
import { useUIContext } from '../../context/UIContext';

const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
}

const ChecklistenView: React.FC = () => {
  const {
    selectedLerngruppe,
    schuelerInSelectedLerngruppe,
  } = useLerngruppenContext();
  
  const { onBackToLerngruppeDetail, currentSchoolYear, systemSchoolYear, onSetCurrentSchoolYear, setHeaderConfig, selectedChecklisteId, clearSelectedChecklisteId } = useUIContext();

  const {
    checklisten,
    checklistenEintraege,
    checklistenStati,
    onAddCheckliste,
    onUpdateCheckliste,
    onDeleteCheckliste,
    onAddChecklistenEintrag,
    onToggleChecklistenStatus,
    onUpdateChecklistenEintrag,
    onDeleteChecklistenEintrag,
  } = useToolsContext();

  const [isAddChecklisteModalOpen, setAddChecklisteModalOpen] = useState(false);
  const [isAddEintragModalOpen, setAddEintragModalOpen] = useState(false);
  const [eintragToEdit, setEintragToEdit] = useState<ChecklistenEintrag | null>(null);
  const [eintragToDelete, setEintragToDelete] = useState<ChecklistenEintrag | null>(null);
  
  const [isEditChecklisteModalOpen, setIsEditChecklisteModalOpen] = useState(false);
  const [checklisteToDelete, setChecklisteToDelete] = useState<Checkliste | null>(null);
  
  const isArchivedView = currentSchoolYear !== systemSchoolYear;

  useEffect(() => {
    if(selectedLerngruppe) {
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
        title: 'Checklisten',
        subtitle: <p className="text-sm text-[var(--color-accent-text)]">{`${selectedLerngruppe.name}, ${selectedLerngruppe.fach}`}</p>,
        onBack: onBackToLerngruppeDetail,
        banner: banner
      });
      return () => {
          // FIX: Use functional update to only reset the banner, preserving other header config properties.
          setHeaderConfig(prev => ({ ...prev, banner: null }));
      }
    }
  }, [selectedLerngruppe, isArchivedView, currentSchoolYear, systemSchoolYear, onSetCurrentSchoolYear, setHeaderConfig, onBackToLerngruppeDetail]);

  const lerngruppenChecklisten = useMemo(() => 
    checklisten.filter(c => c.lerngruppeId === selectedLerngruppe?.id).sort((a, b) => a.order - b.order),
    [checklisten, selectedLerngruppe?.id]
  );
  
  const [activeChecklisteId, setActiveChecklisteId] = useState<string | null>(null);

  useEffect(() => {
    // Priority 1: Handle deep link from context
    if (selectedChecklisteId && lerngruppenChecklisten.some(c => c.id === selectedChecklisteId)) {
        setActiveChecklisteId(selectedChecklisteId);
        clearSelectedChecklisteId();
        return; // Exit early
    }

    // Priority 2: Keep current active tab if it's still valid
    if (activeChecklisteId && lerngruppenChecklisten.some(c => c.id === activeChecklisteId)) {
        return; // Do nothing, current active is fine
    }

    // Priority 3: Fallback to first checklist if current is invalid or null
    if (lerngruppenChecklisten.length > 0) {
        setActiveChecklisteId(lerngruppenChecklisten[0].id);
    } 
    // Priority 4: No checklists exist
    else {
        setActiveChecklisteId(null);
    }
  }, [lerngruppenChecklisten, selectedChecklisteId, clearSelectedChecklisteId, activeChecklisteId]);

  const activeCheckliste = useMemo(() => 
    lerngruppenChecklisten.find(c => c.id === activeChecklisteId),
    [lerngruppenChecklisten, activeChecklisteId]
  );

  const aktiveEintraege = useMemo(() => 
    checklistenEintraege.filter(e => e.checklisteId === activeChecklisteId).sort((a,b) => a.order - b.order),
    [checklistenEintraege, activeChecklisteId]
  );

  const sortedSchueler = useMemo(() =>
    [...schuelerInSelectedLerngruppe].sort((a, b) =>
      a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName)
    ), [schuelerInSelectedLerngruppe]
  );
  
  const schuelerColumnWidth = useMemo(() => {
    const longestNameLength = Math.max(0, ...schuelerInSelectedLerngruppe.map(s => (s.lastName + s.firstName).length));
    const baseWidth = 72;
    const charWidth = 7;
    let calculatedWidth = baseWidth + longestNameLength * charWidth;
    calculatedWidth = Math.max(160, calculatedWidth);
    calculatedWidth = Math.min(280, calculatedWidth);
    return calculatedWidth;
  }, [schuelerInSelectedLerngruppe]);

  const eintragColumnWidth = 100;

  const gridTemplateColumns = useMemo(() => {
    const columns = [`${schuelerColumnWidth}px`];
    aktiveEintraege.forEach(() => columns.push(`${eintragColumnWidth}px`));
    columns.push(`${eintragColumnWidth}px`); // For the add button
    return columns.join(' ');
  }, [schuelerColumnWidth, aktiveEintraege]);
  
  const handleHeaderClick = (e: React.MouseEvent, eintrag: ChecklistenEintrag) => {
      e.stopPropagation();
      setEintragToEdit(eintrag);
  }
  
  if (!selectedLerngruppe) return null;

  return (
    <>
      {/* Tabs for Checklists */}
      <div className="mb-6 flex-shrink-0 pt-2">
        <div className="border-b border-[var(--color-border)]">
          <div className="flex items-center justify-between">
            <div className="flex items-end">
              <nav className="-mb-px flex space-x-2" aria-label="Tabs">
                {lerngruppenChecklisten.map(cl => (
                  <button
                      key={cl.id}
                      onClick={() => setActiveChecklisteId(cl.id)}
                      className={`whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm transition-colors rounded-t-md ${
                      activeChecklisteId === cl.id
                          ? 'border-[var(--color-accent-border-focus)] text-[var(--color-accent-text)]'
                          : 'border-transparent text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] hover:border-[var(--color-ui-tertiary)]'
                      }`}
                  >
                      {cl.name}
                  </button>
                ))}
              </nav>
              <div className="pl-4 pb-2">
                <Button variant="secondary" className="!p-2" onClick={() => setAddChecklisteModalOpen(true)} aria-label="Neues Register hinzufügen">
                    <PlusIcon/>
                </Button>
              </div>
            </div>
            
            <div className="flex items-center">
              {activeChecklisteId && (
                <button 
                    className="p-2 text-[var(--color-text-tertiary)] rounded-full hover:bg-[var(--color-ui-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                    onClick={() => setIsEditChecklisteModalOpen(true)} 
                    aria-label="Aktives Register bearbeiten"
                >
                    <EllipsisVerticalIcon className="w-5 h-5"/>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Table */}
      <div className="flex-1 overflow-auto">
        <div className="inline-block align-middle rounded-lg border border-[var(--color-border)] overflow-hidden">
          {/* Header */}
          <div className="sticky top-0 z-20 text-center font-bold bg-[var(--color-ui-primary)] grid" style={{ gridTemplateColumns }}>
            <div className="sticky top-0 left-0 flex items-center justify-start p-3 border-r border-b border-[var(--color-border)] bg-[var(--color-ui-primary)] z-30">SchülerIn</div>
            {aktiveEintraege.map(eintrag => (
                <button
                    key={eintrag.id}
                    onClick={(e) => handleHeaderClick(e, eintrag)}
                    className="w-full h-full flex flex-col items-center justify-center p-2 border-r border-b border-[var(--color-border)] text-center font-semibold hover:bg-[var(--color-ui-secondary)] transition-colors min-w-0"
                >
                    <span className="truncate w-full">{eintrag.name}</span>
                    {eintrag.faelligkeitsdatum && (
                        <span className="text-xs font-normal text-[var(--color-text-tertiary)] mt-1 flex items-center space-x-1">
                            <CalendarDaysIcon className="w-3 h-3" />
                            <span>{new Date(eintrag.faelligkeitsdatum).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}</span>
                        </span>
                    )}
                </button>
            ))}
            <div className="flex items-center justify-center p-2 border-b border-[var(--color-border)]">
                <Button variant="secondary" className="!p-2" onClick={() => setAddEintragModalOpen(true)} disabled={!activeChecklisteId}><PlusIcon/></Button>
            </div>
          </div>

          {/* Body */}
          <div>
            {sortedSchueler.map((schueler) => {
              return (
                <div key={schueler.id} className="grid hover:bg-[var(--color-ui-secondary)]/50 border-b border-[var(--color-border)] last:border-b-0" style={{ gridTemplateColumns }}>
                  <div className="sticky left-0 z-10 flex items-center space-x-2 p-2 border-r border-[var(--color-border)] bg-[var(--color-ui-primary)]">
                    <div className="w-8 h-8 bg-gradient-to-br from-[var(--color-accent-primary-hover)] to-[var(--color-accent-primary)] text-[var(--color-accent-text-inverted)] rounded-md flex items-center justify-center font-bold text-xs flex-shrink-0">
                        {getInitials(schueler.firstName, schueler.lastName)}
                    </div>
                    <div className="font-semibold text-[var(--color-text-primary)] truncate">{schueler.lastName}, {schueler.firstName}</div>
                  </div>
                  {aktiveEintraege.map(eintrag => {
                      const status = checklistenStati[eintrag.id]?.[schueler.id] || 'offen';
                      
                      let buttonClasses = "w-8 h-8 rounded-md flex items-center justify-center transition-colors ";
                      let icon: React.ReactNode;

                      switch(status) {
                          case 'erledigt':
                              buttonClasses += "bg-[var(--color-success-text)]/20 hover:bg-[var(--color-success-text)]/30";
                              icon = <CheckIcon className="text-[var(--color-success-text)]" />;
                              break;
                          case 'nicht-erledigt':
                              buttonClasses += "bg-[var(--color-danger-text)]/20 hover:bg-[var(--color-danger-text)]/30";
                              icon = <XIcon className="text-[var(--color-danger-text)]" />;
                              break;
                          default:
                              buttonClasses += "hover:bg-[var(--color-ui-tertiary)]";
                              icon = <MinusIcon className="text-[var(--color-text-tertiary)]" />;
                              break;
                      }

                      return (
                        <div key={eintrag.id} className="flex items-center justify-center p-2 border-r border-[var(--color-border)]">
                            <button onClick={() => onToggleChecklistenStatus(eintrag.id, schueler.id)} className={buttonClasses}>
                                {icon}
                            </button>
                        </div>
                      )
                  })}
                  <div />
                </div>
              )
            })}
          </div>
        </div>
      </div>
      
      <AddChecklisteModal 
        isOpen={isAddChecklisteModalOpen}
        onClose={() => setAddChecklisteModalOpen(false)}
        onAdd={(name) => {
          onAddCheckliste(name, selectedLerngruppe.id);
          setAddChecklisteModalOpen(false);
        }}
      />
      
      {activeChecklisteId && (
        <AddChecklistenEintragModal
          isOpen={isAddEintragModalOpen}
          onClose={() => setAddEintragModalOpen(false)}
          onAdd={(name, defaultStatus, faelligkeitsdatum) => {
            onAddChecklistenEintrag(name, activeChecklisteId, defaultStatus, faelligkeitsdatum);
            setAddEintragModalOpen(false);
          }}
        />
      )}
      
      {eintragToEdit && (
        <EditChecklistenEintragModal
          isOpen={!!eintragToEdit}
          onClose={() => setEintragToEdit(null)}
          onUpdate={(newName, newFaelligkeitsdatum) => onUpdateChecklistenEintrag(eintragToEdit.id, newName, newFaelligkeitsdatum)}
          onDelete={() => {
            setEintragToDelete(eintragToEdit);
            setEintragToEdit(null);
          }}
          eintrag={eintragToEdit}
        />
      )}

      {eintragToDelete && (
        <ConfirmDeleteChecklistenEintragModal
          isOpen={!!eintragToDelete}
          onClose={() => setEintragToDelete(null)}
          onConfirm={() => onDeleteChecklistenEintrag(eintragToDelete.id)}
          eintragName={eintragToDelete.name}
        />
      )}
      
      {activeCheckliste && (
        <EditChecklisteModal
            isOpen={isEditChecklisteModalOpen}
            onClose={() => setIsEditChecklisteModalOpen(false)}
            onUpdate={(newName) => onUpdateCheckliste(activeCheckliste.id, newName)}
            onDelete={() => {
                setChecklisteToDelete(activeCheckliste);
                setIsEditChecklisteModalOpen(false);
            }}
            checkliste={activeCheckliste}
        />
      )}

      {checklisteToDelete && (
        <ConfirmDeleteChecklisteModal
            isOpen={!!checklisteToDelete}
            onClose={() => setChecklisteToDelete(null)}
            onConfirm={() => onDeleteCheckliste(checklisteToDelete.id)}
            checklisteName={checklisteToDelete.name}
        />
      )}

    </>
  );
};

export default ChecklistenView;
