import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useLerngruppenContext } from '../../context/LerngruppenContext';
import { useNotenContext } from '../../context/NotenContext';
import { useUIContext } from '../../context/UIContext';
import { Leistungsnachweis, Notenkategorie, AddLeistungsnachweisModalContext, EditModalContext, ManuelleNoteModalContext, EditModalItem, Schueler, ColumnDef } from '../../context/types';
import { PlusIcon, EyeIcon, PencilIcon, TrashIcon, InformationCircleIcon, ArrowTopRightOnSquareIcon, DocumentDuplicateIcon } from '../icons';
import PopoverMenu from '../ui/PopoverMenu';
import PopoverMenuItem from '../ui/PopoverMenuItem';
import AddLeistungsnachweisModal from '../modals/AddLeistungsnachweisModal';
import EditLeistungsnachweisModal from '../modals/EditLeistungsnachweisModal';
import ConfirmDeleteLeistungsnachweisModal from '../modals/ConfirmDeleteLeistungsnachweisModal';
import ManuelleNoteModal from '../modals/ManuelleNoteModal';
import Button from '../ui/Button';
import StrukturUebertragenModal from '../modals/StrukturUebertragenModal';
import ConfirmStrukturUebertragenModal from '../modals/ConfirmStrukturUebertragenModal';
import GesamtuebersichtPdfPreviewModal from '../modals/GesamtuebersichtPdfPreviewModal';
import { useNotenGridDef } from '../../hooks/useNotenGridDef';
import { NotenGridHeader } from './noten/NotenGridHeader';
import { NotenGridBody } from './noten/NotenGridBody';

interface TransferData {
    scope: 'gesamt' | 'hj1' | 'hj2';
    targetIds: string[];
}

const NotenuebersichtView: React.FC = () => { 
  const {
    selectedLerngruppe,
    handleUpdateLerngruppe,
    schuelerInSelectedLerngruppe,
  } = useLerngruppenContext();

  const {
    notensystemForLerngruppe,
    columns,
    handleDeleteLeistungsnachweis,
    handleAddLeistungsnachweis,
    handleUpdateLeistungsnachweis,
    handleUpdateNotenkategorie,
    schuelerLeistungsnachweisNotenMap,
    schuelerKategorieNotenMap,
    schuelerHalbjahresNotenMap,
    schuelerGesamtNotenMap,
    uebertrageNotenstruktur
  } = useNotenContext();

  const {
      focusedSchuelerId,
      onToggleFocusSchueler,
      handleNavigate,
      onBackToLerngruppeDetail,
      currentSchoolYear,
      systemSchoolYear,
      onSetCurrentSchoolYear,
      setHeaderConfig,
  } = useUIContext();
  
  const [isAddLeistungsnachweisModalOpen, setAddLeistungsnachweisModalOpen] = useState(false);
  const [addLeistungsnachweisContext, setAddLeistungsnachweisContext] = useState<AddLeistungsnachweisModalContext | null>(null);

  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [editModalContext, setEditModalContext] = useState<EditModalContext | null>(null);

  const [isConfirmDeleteLeistungsnachweisModalOpen, setConfirmDeleteLeistungsnachweisModalOpen] = useState(false);
  const [leistungsnachweisToDelete, setLeistungsnachweisToDelete] = useState<Leistungsnachweis | null>(null);
  
  const [isManuelleNoteModalOpen, setManuelleNoteModalOpen] = useState(false);
  const [manuelleNoteContext, setManuelleNoteContext] = useState<ManuelleNoteModalContext | null>(null);

  const [isStrukturUebertragenModalOpen, setIsStrukturUebertragenModalOpen] = useState(false);
  const [isConfirmTransferModalOpen, setIsConfirmTransferModalOpen] = useState(false);
  const [transferData, setTransferData] = useState<TransferData | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  const openAddLeistungsnachweisModal = useCallback((context: AddLeistungsnachweisModalContext) => {
    setAddLeistungsnachweisContext(context);
    setAddLeistungsnachweisModalOpen(true);
  }, []);
  const closeAddLeistungsnachweisModal = useCallback(() => setAddLeistungsnachweisModalOpen(false), []);

  const openEditModal = useCallback((context: EditModalContext) => {
    setEditModalContext(context);
    setEditModalOpen(true);
  }, []);
  const closeEditModal = useCallback(() => setEditModalContext(null), []);

  const openConfirmDeleteLeistungsnachweisModal = useCallback((ln: Leistungsnachweis) => {
    setLeistungsnachweisToDelete(ln);
    setConfirmDeleteLeistungsnachweisModalOpen(true);
  }, []);
  const closeConfirmDeleteLeistungsnachweisModal = useCallback(() => setConfirmDeleteLeistungsnachweisModalOpen(false), []);

  const openManuelleNoteModal = useCallback((context: ManuelleNoteModalContext) => {
    setManuelleNoteContext(context);
    setManuelleNoteModalOpen(true);
  }, []);
  const closeManuelleNoteModal = useCallback(() => setManuelleNoteContext(null), []);

  const handleAddLeistungsnachweisSubmit = useCallback(async (data: { bezeichnung: string; gewichtung: number; typ: 'sammelnote' | 'klausur'; context: AddLeistungsnachweisModalContext }) => {
    if (selectedLerngruppe && data.context) {
        await handleAddLeistungsnachweis({
            ...data,
            context: {
                ...data.context,
                lerngruppeId: selectedLerngruppe.id,
            }
        });
    }
  }, [handleAddLeistungsnachweis, selectedLerngruppe]);

  const handlePropertiesUpdate = useCallback(async (item: EditModalItem) => {
      switch (item._type) {
          case 'leistungsnachweis':
              const { _type: lt, ...ln } = item;
              await handleUpdateLeistungsnachweis(ln as Leistungsnachweis);
              break;
          case 'notenkategorie':
              const { _type: nt, ...nk } = item;
              await handleUpdateNotenkategorie(nk as Notenkategorie);
              break;
          case 'halbjahr':
              if (selectedLerngruppe) {
                  const updatedLerngruppe = { ...selectedLerngruppe };
                  if (item.id === 'hj1') {
                      updatedLerngruppe.gewichtungHj1 = item.gewichtung;
                  } else {
                      updatedLerngruppe.gewichtungHj2 = item.gewichtung;
                  }
                  await handleUpdateLerngruppe(updatedLerngruppe);
              }
              break;
      }
  }, [handleUpdateLeistungsnachweis, handleUpdateNotenkategorie, selectedLerngruppe, handleUpdateLerngruppe]);

  const [popoverState, setPopoverState] = useState<{
    anchorEl: HTMLElement | null;
    context: { type: 'kategorie' | 'leistungsnachweis'; data: ColumnDef | Leistungsnachweis } | null;
  }>({ anchorEl: null, context: null });
  
  const isArchivedView = currentSchoolYear !== systemSchoolYear;
  
  // Use the hook for grid definition
  const { headerData } = useNotenGridDef(columns, selectedLerngruppe);
  
  if (!selectedLerngruppe) return null;
  
  const sortedSchueler = useMemo(() =>
    [...schuelerInSelectedLerngruppe].sort((a: Schueler, b: Schueler) =>
      a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName)
    ), [schuelerInSelectedLerngruppe]
  );

  const schuelerColumnWidth = useMemo(() => {
    const longestNameLength = Math.max(0, ...schuelerInSelectedLerngruppe.map((s: Schueler) => s.lastName.length + s.firstName.length));
    const baseWidth = 80;
    const charWidth = 7;
    let calculatedWidth = baseWidth + longestNameLength * charWidth;
    calculatedWidth = Math.max(180, calculatedWidth);
    calculatedWidth = Math.min(280, calculatedWidth);
    return calculatedWidth;
  }, [schuelerInSelectedLerngruppe]);
  
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
        title: 'Notenverwaltung',
        subtitle: <p className="text-sm text-[var(--color-accent-text)]">{`${selectedLerngruppe.name}, ${selectedLerngruppe.fach}`}</p>,
        onBack: onBackToLerngruppeDetail,
        banner: banner,
        actions: (
            <div className="flex items-center space-x-3">
                <Button variant="primary" onClick={() => setIsStrukturUebertragenModalOpen(true)} disabled={isArchivedView} className="!p-2" aria-label="Struktur übertragen">
                    <DocumentDuplicateIcon className="w-6 h-6" />
                </Button>
                <Button variant="primary" onClick={() => setIsPreviewModalOpen(true)} className="!p-2" aria-label="Als PDF exportieren">
                    <ArrowTopRightOnSquareIcon className="w-6 h-6" />
                </Button>
            </div>
        )
      });

      return () => { setHeaderConfig(prev => ({...prev, banner: null, actions: undefined })); }
    }
  }, [selectedLerngruppe, isArchivedView, currentSchoolYear, systemSchoolYear, onSetCurrentSchoolYear, setHeaderConfig, onBackToLerngruppeDetail]);


  const handleHeaderClick = (event: React.MouseEvent<HTMLButtonElement>, type: 'kategorie' | 'leistungsnachweis', data: ColumnDef | Leistungsnachweis) => {
    setPopoverState({ anchorEl: event.currentTarget, context: { type, data } });
  };
  const closePopover = () => setPopoverState({ anchorEl: null, context: null });

  const handleStartTransfer = (data: TransferData) => {
      setTransferData(data);
      setIsStrukturUebertragenModalOpen(false);
      setIsConfirmTransferModalOpen(true);
  };
  
  const handleConfirmTransfer = async () => {
      if (transferData && selectedLerngruppe) {
          await uebertrageNotenstruktur(selectedLerngruppe.id, transferData.targetIds, transferData.scope);
      }
      setTransferData(null);
      setIsConfirmTransferModalOpen(false);
  };

  const notenMaps = useMemo(() => ({
      leistungsnachweis: schuelerLeistungsnachweisNotenMap,
      kategorie: schuelerKategorieNotenMap,
      halbjahr: schuelerHalbjahresNotenMap,
      gesamt: schuelerGesamtNotenMap,
  }), [schuelerLeistungsnachweisNotenMap, schuelerKategorieNotenMap, schuelerHalbjahresNotenMap, schuelerGesamtNotenMap]);
  
  return (
    <>
      <div className="self-start max-w-full h-full overflow-auto rounded-lg border border-[var(--color-border)]" style={{ scrollbarGutter: 'stable' }}>
        <div className="relative min-w-max">
          <NotenGridHeader 
            headerData={headerData}
            schuelerColumnWidth={schuelerColumnWidth}
            selectedLerngruppe={selectedLerngruppe}
            isArchivedView={isArchivedView}
            onHeaderClick={handleHeaderClick}
            onEditHalbjahr={(item, title) => openEditModal({ item, title, isNameEditable: false })}
          />
          <NotenGridBody 
              schuelerListe={sortedSchueler}
              columns={columns}
              columnTemplate={headerData.columnTemplate}
              schuelerColumnWidth={schuelerColumnWidth}
              focusedSchuelerId={focusedSchuelerId}
              selectedLerngruppeId={selectedLerngruppe.id}
              notensystem={notensystemForLerngruppe}
              notenMaps={notenMaps}
              isArchivedView={isArchivedView}
              onToggleFocus={onToggleFocusSchueler}
              onOpenManuelleNote={openManuelleNoteModal}
          />
        </div>
      </div>

      <PopoverMenu
        isOpen={!!popoverState.anchorEl}
        onClose={closePopover}
        anchorEl={popoverState.anchorEl}
      >
        {popoverState.context?.type === 'kategorie' && (() => {
            const colDef = popoverState.context!.data as ColumnDef;
            const kategorie = colDef?.data as Notenkategorie | undefined;
            return (
              <>
                <PopoverMenuItem
                  icon={<PlusIcon />}
                  label="Neuen Leistungsnachweis erstellen"
                  onClick={() => {
                    if (colDef.halbjahr && colDef.kategorieTyp) {
                        openAddLeistungsnachweisModal({ halbjahr: colDef.halbjahr, typ: colDef.kategorieTyp });
                    }
                    closePopover();
                  }}
                />
                {kategorie && (
                  <PopoverMenuItem
                    icon={<PencilIcon />}
                    label="Gewichtung bearbeiten"
                    onClick={() => {
                        openEditModal({
                            item: { ...kategorie, _type: 'notenkategorie' },
                            title: 'Kategorie-Gewichtung bearbeiten',
                            isNameEditable: false
                        });
                        closePopover();
                    }}
                  />
                )}
              </>
            );
          })()}
        {popoverState.context?.type === 'leistungsnachweis' && (
          <>
            <PopoverMenuItem
              icon={<EyeIcon />}
              label="Noten eingeben / ansehen"
              onClick={() => {
                const ln = popoverState.context?.data as Leistungsnachweis;
                if (ln && selectedLerngruppe) {
                  handleNavigate('leistungsnachweisDetail', selectedLerngruppe.id, undefined, ln.id);
                }
                closePopover();
              }}
            />
            <PopoverMenuItem
              icon={<PencilIcon />}
              label="Eigenschaften bearbeiten"
              onClick={() => {
                const ln = popoverState.context?.data as Leistungsnachweis;
                if (ln) {
                  openEditModal({
                    item: { ...ln, _type: 'leistungsnachweis' },
                    title: 'Leistungsnachweis bearbeiten',
                    isNameEditable: true,
                  });
                }
                closePopover();
              }}
            />
            <PopoverMenuItem
              icon={<TrashIcon />}
              label="Löschen"
              variant="danger"
              onClick={() => {
                const ln = popoverState.context?.data as Leistungsnachweis;
                if (ln) {
                  openConfirmDeleteLeistungsnachweisModal(ln);
                }
                closePopover();
              }}
            />
          </>
        )}
      </PopoverMenu>

      <AddLeistungsnachweisModal 
          isOpen={isAddLeistungsnachweisModalOpen}
          onClose={closeAddLeistungsnachweisModal}
          onAdd={handleAddLeistungsnachweisSubmit}
          context={addLeistungsnachweisContext}
      />
      <EditLeistungsnachweisModal
          isOpen={isEditModalOpen}
          onClose={closeEditModal}
          onUpdate={handlePropertiesUpdate}
          context={editModalContext}
      />
      <ConfirmDeleteLeistungsnachweisModal
        isOpen={isConfirmDeleteLeistungsnachweisModalOpen}
        onClose={closeConfirmDeleteLeistungsnachweisModal}
        onConfirm={handleDeleteLeistungsnachweis}
        leistungsnachweis={leistungsnachweisToDelete}
      />
      <ManuelleNoteModal 
        isOpen={isManuelleNoteModalOpen}
        onClose={closeManuelleNoteModal}
        context={manuelleNoteContext}
      />
      <StrukturUebertragenModal
        isOpen={isStrukturUebertragenModalOpen}
        onClose={() => setIsStrukturUebertragenModalOpen(false)}
        onContinue={handleStartTransfer}
      />
      {transferData && (
          <ConfirmStrukturUebertragenModal
            isOpen={isConfirmTransferModalOpen}
            onClose={() => setIsConfirmTransferModalOpen(false)}
            onConfirm={handleConfirmTransfer}
            transferData={transferData}
          />
      )}
      <GesamtuebersichtPdfPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
      />
    </>
  );
};

export default NotenuebersichtView;