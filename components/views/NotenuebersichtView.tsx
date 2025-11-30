import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useLerngruppenContext } from '../../context/LerngruppenContext';
import { useNotenContext } from '../../context/NotenContext';
import { useUIContext } from '../../context/UIContext';
import { Leistungsnachweis, Notenkategorie, ManuelleNoteZiel, AddLeistungsnachweisModalContext, EditModalContext, ManuelleNoteModalContext, EditModalItem, Schueler, ColumnDef, HeaderCell } from '../../context/types';
import { PlusIcon, EyeIcon, EllipsisVerticalIcon, PencilIcon, TrashIcon, InformationCircleIcon, ExclamationCircleIcon, ArrowTopRightOnSquareIcon, DocumentDuplicateIcon } from '../icons';
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

const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
}

const GewichtungBadge: React.FC<{ gewichtung?: number }> = ({ gewichtung }) => {
    if (gewichtung === undefined) return null;

    return (
        <span className="relative ml-1.5 bg-[var(--color-accent-primary)] text-[var(--color-text-primary)] w-5 h-5 rounded-full inline-block flex-shrink-0 border-2 border-[var(--color-ui-primary)] align-middle">
            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-bold">
                {gewichtung}
            </span>
        </span>
    );
};

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
  
  const headerData = useMemo(() => {
    const rows: HeaderCell[][] = [[], [], [], []];
    if (columns.length <= 1) return { rows, totalGridColumns: 1, columnTemplate: '1fr' };
    
    const totalGridColumns = columns.length;
    let currentColumn = 1;

    rows[0].push({ id: 'gesamt_header', text: 'Gesamtes Schuljahr', style: { gridColumn: `1 / ${totalGridColumns + 1}`, gridRow: '1 / 2' }, className: 'text-base font-bold text-[var(--color-warning-text)]' });
    rows[1].push({ id: 'gesamt_avg_header_main', text: 'Gesamt', style: { gridColumn: '1 / 2', gridRow: '2 / 5' }, className: 'text-[var(--color-warning-text)]', colDef: columns[0] });
    currentColumn++;

    for (const halbjahr of [1, 2] as const) {
        const hjCols = columns.filter((c: ColumnDef) => c.halbjahr === halbjahr);
        if (hjCols.length > 0) {
            const hjStartIndex = currentColumn;
            const hjAvgColDef = hjCols.find((c: ColumnDef) => c.type === 'halbjahr_avg');
            const hjGewichtung = halbjahr === 1 ? selectedLerngruppe.gewichtungHj1 : selectedLerngruppe.gewichtungHj2;
            
            rows[1].push({ id: `h${halbjahr}`, text: `${halbjahr}. Halbjahr`, gewichtung: hjGewichtung, style: { gridColumn: `${hjStartIndex} / ${hjStartIndex + hjCols.length}`, gridRow: '2 / 3' }, colDef: hjAvgColDef, className: 'text-[var(--color-accent-text)]' });
            rows[2].push({ id: `h${halbjahr}_avg_header_main`, text: `${halbjahr}. Hj Ø`, style: { gridColumn: `${currentColumn} / ${currentColumn + 1}`, gridRow: '3 / 5' }, colDef: hjAvgColDef, className: 'text-[var(--color-accent-text)]' });
            currentColumn++;

            for (const typ of ['mündlich', 'schriftlich'] as const) {
                const katCols = hjCols.filter((c: ColumnDef) => c.kategorieTyp === typ);
                if (katCols.length > 0) {
                    const katStartIndex = currentColumn;
                    const katAvgColDef = katCols.find((c: ColumnDef) => c.type === 'kategorie_avg');
                    const lnCols = katCols.filter((c: ColumnDef) => c.type === 'leistungsnachweis' || c.type === 'kategorie_placeholder');
                    const katName = (katAvgColDef?.data as Notenkategorie)?.name || typ.charAt(0).toUpperCase() + typ.slice(1);
                    const katGewichtung = (katAvgColDef?.data as Notenkategorie)?.gewichtung ?? katAvgColDef?.gewichtung;
                    rows[2].push({ id: `kat_${halbjahr}_${typ}`, text: katName, style: { gridColumn: `${katStartIndex} / ${katStartIndex + katCols.length}`, gridRow: '3 / 4' }, gewichtung: katGewichtung, colDef: katAvgColDef });
                    
                    if (katAvgColDef) {
                        rows[3].push({ id: katAvgColDef.id, text: 'Ø', style: { gridColumn: `${currentColumn} / ${currentColumn + 1}`, gridRow: '4 / 5'}, colDef: katAvgColDef });
                        currentColumn++;
                    }
                    
                    lnCols.forEach((col: ColumnDef) => {
                        rows[3].push({ id: col.id, text: col.label, gewichtung: col.gewichtung, style: { gridColumn: `${currentColumn} / ${currentColumn + 1}`, gridRow: '4 / 5'}, colDef: col });
                        currentColumn++;
                    });
                }
            }
        }
    }
    const columnTemplate = columns.map((col: ColumnDef) => col.type === 'gesamt_avg' ? '80px' : '65px').join(' ');
    return { rows, totalGridColumns, columnTemplate };
  }, [columns, selectedLerngruppe]);
  
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

  const noteToPoints = useMemo(() => {
    const map = new Map<string, number>();
    if (notensystemForLerngruppe) {
      notensystemForLerngruppe.noten.forEach(n => map.set(n.displayValue, n.pointValue));
    }
    return map;
  }, [notensystemForLerngruppe]);

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
  
  const rowHeight = 48;
  const gridRowHeights = [36, 36, 36, 52];
  
    // Helpers for cell styling, moved out of the loop for performance
    const getInnerCellBorderClass = useCallback((column: ColumnDef): string => {
        if (column.type === 'gesamt_avg') return 'border border-[var(--color-warning-text)]';
        if (column.type === 'halbjahr_avg') return 'border border-[var(--color-accent-border-focus)]';
        if (column.type === 'kategorie_avg') return 'border border-[var(--color-border)]';
        return '';
    }, []);

    const getInnerCellBgClass = useCallback((column: ColumnDef): string => {
        if (column.type === 'kategorie_avg') return 'bg-transparent';
        if (column.type === 'halbjahr_avg' || column.type === 'gesamt_avg') return 'cursor-pointer hover:bg-[var(--color-ui-tertiary)] bg-[var(--color-ui-secondary)]';
        return 'bg-[var(--color-ui-secondary)]';
    }, []);

  return (
    <>
      <div className="self-start max-w-full h-full overflow-auto rounded-lg border border-[var(--color-border)]" style={{ scrollbarGutter: 'stable' }}>
        <div className="relative min-w-max">
          <div className="sticky top-0 z-20 flex bg-[var(--color-ui-primary)] border-b border-[var(--color-border)]">
            <div style={{ width: `${schuelerColumnWidth}px`, minWidth: `${schuelerColumnWidth}px` }} className="sticky left-0 z-30 flex-shrink-0 bg-[var(--color-ui-primary)] flex items-center justify-center font-bold text-[var(--color-text-secondary)] border-r border-[var(--color-border)]">
              SchülerIn
            </div>
            <div className="flex-grow bg-[var(--color-ui-primary)]">
                <div className="inline-grid bg-[var(--color-border)] gap-x-px" style={{ gridTemplateColumns: headerData.columnTemplate, gridTemplateRows: '36px 36px 36px 52px' }}>
                    {headerData.rows.flat().map((cell: HeaderCell) => {
                      const { colDef } = cell;
                      const isTargetAvgHeader = ['gesamt_avg_header_main', 'h1_avg_header_main', 'h2_avg_header_main'].includes(cell.id);
                      const isHalbjahrHeader = cell.id === 'h1' || cell.id === 'h2';
                      const isKategorieHeader = cell.id.startsWith('kat_');
                      const isLeistungsnachweisHeader = colDef?.type === 'leistungsnachweis';
                      const isCategoryAvgInLastRow = colDef?.type === 'kategorie_avg' && cell.style.gridRow === '4 / 5';
                      const isPlaceholder = colDef?.type === 'kategorie_placeholder';
                      const isInteractive = !isArchivedView && (isHalbjahrHeader || (isKategorieHeader && colDef) || (isLeistungsnachweisHeader && colDef?.data));
                      
                      const cellClasses = ['bg-[var(--color-ui-primary)]'];
                      const isSecondRowOrLower = cell.style.gridRow?.toString().startsWith('2') || cell.style.gridRow?.toString().startsWith('3') || cell.style.gridRow?.toString().startsWith('4');
                      if(isSecondRowOrLower && !isTargetAvgHeader && !isCategoryAvgInLastRow) {
                          cellClasses.push('border-t', 'border-[var(--color-border)]');
                      }
                      
                      const containerClasses = [
                        'w-full h-full', 'flex', 
                        isTargetAvgHeader || isCategoryAvgInLastRow ? '' : 'items-center',
                        cell.className || ''
                      ].filter(Boolean).join(' ');

                      const contentContainerClasses = [
                        'w-full h-full min-w-0 min-h-0 font-semibold px-2',
                        isTargetAvgHeader || isCategoryAvgInLastRow
                            ? 'grid items-end justify-center'
                            : 'flex items-center',
                        !isTargetAvgHeader && !isCategoryAvgInLastRow && (cell.id === 'gesamt_header' || colDef?.isAverage)
                          ? 'justify-center'
                          : ''
                      ].filter(Boolean).join(' ');

                      const content = (
                          <div className={contentContainerClasses}>
                              <span className="truncate">{cell.text}</span>
                              {cell.gewichtung !== undefined && <GewichtungBadge gewichtung={cell.gewichtung} />}
                          </div>
                      );
                      
                      const finalCellStyle = { ...cell.style };
                      const isVerticallyCenteredHeader = cell.id === 'gesamt_header' || isHalbjahrHeader || isKategorieHeader;
                      
                      if (isTargetAvgHeader) {
                          if (cell.id === 'gesamt_avg_header_main') {
                              finalCellStyle.height = `${gridRowHeights[1] + gridRowHeights[2] + gridRowHeights[3]}px`; // 124px
                          } else {
                              finalCellStyle.height = `${gridRowHeights[2] + gridRowHeights[3]}px`; // 88px
                          }
                      } else if (isCategoryAvgInLastRow || isLeistungsnachweisHeader || isPlaceholder) {
                          finalCellStyle.height = `${gridRowHeights[3]}px`; // 52px
                      } else if (isVerticallyCenteredHeader) {
                          finalCellStyle.height = '36px';
                      }

                      return (
                        <div key={cell.id} style={finalCellStyle} className={cellClasses.join(' ')}>
                            {isInteractive ? (
                                <button
                                    onClick={(e) => {
                                        if (isHalbjahrHeader) {
                                            const halbjahr = cell.id === 'h1' ? 1 : 2;
                                            const id = cell.id === 'h1' ? 'hj1' : 'hj2';
                                            const gewichtung = halbjahr === 1 ? selectedLerngruppe.gewichtungHj1 : selectedLerngruppe.gewichtungHj2;
                                            openEditModal({
                                                item: { id, name: `${halbjahr}. Halbjahr`, gewichtung: gewichtung ?? 1, _type: 'halbjahr' },
                                                title: 'Halbjahres-Gewichtung bearbeiten',
                                                isNameEditable: false
                                            });
                                        } else if (isLeistungsnachweisHeader) {
                                            handleHeaderClick(e, 'leistungsnachweis', colDef!.data as Leistungsnachweis);
                                        } else {
                                            handleHeaderClick(e, 'kategorie', colDef!);
                                        }
                                    }}
                                    className="w-full h-full hover:bg-[var(--color-ui-secondary)] transition-all text-left"
                                >
                                    <div className={containerClasses}>
                                      {isLeistungsnachweisHeader ? (
                                          <div className="flex flex-col justify-between w-full h-full font-semibold px-2 py-1 items-stretch">
                                              <div className="w-full text-center min-w-0">
                                                  <span className="truncate block leading-tight">{cell.text}</span>
                                              </div>
                                              <div className="relative flex items-center justify-center w-full">
                                                  <div className="flex-1 flex justify-center">{cell.gewichtung !== undefined && <GewichtungBadge gewichtung={cell.gewichtung} />}</div>
                                                  <div className="absolute right-0 top-1/2 -translate-y-1/2">
                                                      <EllipsisVerticalIcon className="w-4 h-4 text-[var(--color-text-tertiary)] flex-shrink-0" />
                                                  </div>
                                              </div>
                                          </div>
                                      ) : isHalbjahrHeader ? (
                                          <div className="relative flex items-center justify-center w-full h-full font-semibold px-2">
                                              <div className="flex items-center truncate">
                                                  <span className="truncate">{cell.text}</span>
                                                  {cell.gewichtung !== undefined && <GewichtungBadge gewichtung={cell.gewichtung} />}
                                              </div>
                                              <div className="absolute top-0 right-0 h-full flex items-center pr-2">
                                                  <EllipsisVerticalIcon className="w-4 h-4 text-[var(--color-text-tertiary)] flex-shrink-0" />
                                              </div>
                                          </div>
                                      ) : (
                                          <div className="flex items-center justify-between w-full h-full">
                                            <div className="flex-grow min-w-0">{content}</div>
                                            <EllipsisVerticalIcon className="w-4 h-4 text-[var(--color-text-tertiary)] flex-shrink-0 mr-2" />
                                          </div>
                                      )}
                                    </div>
                                </button>
                            ) : (
                                <div className={containerClasses}>{content}</div>
                            )}
                        </div>
                      );
                    })}
                </div>
            </div>
          </div>
          <div>
            {sortedSchueler.map((schueler: Schueler, index: number) => {
              const isFocused = focusedSchuelerId === schueler.id;
              const isAnyFocused = focusedSchuelerId !== null;
              const rowClasses = `flex transition-all duration-300 border-b border-[var(--color-border)] last:border-b-0 ${isAnyFocused && !isFocused ? 'relative blur-sm focus-overlay' : ''}`;

              return (
                <div key={schueler.id} className={rowClasses}>
                  <div style={{ width: `${schuelerColumnWidth}px`, minWidth: `${schuelerColumnWidth}px`, height: `${rowHeight}px` }} className={`sticky left-0 z-10 flex-shrink-0 flex items-center space-x-3 px-2 py-1 bg-[var(--color-ui-primary)] border-r border-[var(--color-border)]`}>
                    <button onClick={() => onToggleFocusSchueler(schueler.id)} disabled={isAnyFocused && !isFocused} className="p-1 rounded-full transition-colors group disabled:cursor-not-allowed disabled:opacity-50" aria-label={`Fokus auf ${schueler.firstName} ${schueler.lastName} umschalten`}>
                      <EyeIcon className={`w-5 h-5 transition-colors ${isFocused ? 'text-[var(--color-accent-text)]' : 'text-[var(--color-text-primary)]'}`} />
                    </button>
                    <div className="w-8 h-8 bg-gradient-to-br from-[var(--color-accent-primary-hover)] to-[var(--color-accent-primary)] text-[var(--color-accent-text-inverted)] rounded-md flex items-center justify-center font-bold text-xs flex-shrink-0">
                      {getInitials(schueler.firstName, schueler.lastName)}
                    </div>
                    <div>
                      <div className="font-bold text-[var(--color-text-primary)] truncate">{schueler.lastName},</div>
                      <div className="text-sm text-[var(--color-text-secondary)] truncate">{schueler.firstName}</div>
                    </div>
                  </div>
                  <div className="grid flex-grow bg-[var(--color-border)] gap-x-px" style={{ gridTemplateColumns: headerData.columnTemplate }}>
                    {columns.map((col: ColumnDef) => {
                      let noteData;
                      let isManuellUeberschrieben = false;
                      
                      if (col.type === 'kategorie_avg') noteData = schuelerKategorieNotenMap.get(`${schueler.id}-${col.id}`);
                      else if (col.type === 'halbjahr_avg') {
                          noteData = schuelerHalbjahresNotenMap.get(`${schueler.id}-${col.id}`);
                          isManuellUeberschrieben = !!noteData?.isManual;
                      } else if (col.type === 'gesamt_avg') {
                          noteData = schuelerGesamtNotenMap.get(`${schueler.id}-${col.id}`);
                          isManuellUeberschrieben = !!noteData?.isManual;
                      } else if (col.type === 'leistungsnachweis') {
                          noteData = schuelerLeistungsnachweisNotenMap.get(`${schueler.id}-${col.id}`);
                      }

                      const innerCellClasses = [
                        'h-10 rounded-md flex flex-col items-center justify-center', 'relative', 'transition-colors',
                        col.type === 'gesamt_avg' ? 'w-16' : 'w-[50px]',
                        getInnerCellBgClass(col),
                        getInnerCellBorderClass(col),
                      ].filter(Boolean).join(' ');

                      let innerCellContent = null;
                      
                      if (noteData) {
                          const pointValue = noteToPoints.get(noteData.finalGrade);
                          const isBadGrade = typeof pointValue === 'number' && pointValue <= 3;
                          const noteColorClass = isBadGrade ? 'text-[var(--color-danger-text)]' : 'text-[var(--color-text-primary)]';
                          innerCellContent = (
                              <div className="relative -top-px flex flex-col items-center">
                                  <span className={`text-lg leading-tight ${noteColorClass}`}>{noteData.finalGrade}</span>
                                  {noteData.displayDecimal && <span className="text-[9px] text-[var(--color-text-tertiary)] leading-none">{noteData.displayDecimal}</span>}
                              </div>
                          );
                      }

                      const isClickableAvg = !isArchivedView && (col.type === 'halbjahr_avg' || col.type === 'gesamt_avg');

                      return (
                        <div key={col.id} className="flex items-center justify-center p-1 bg-[var(--color-ui-primary)] font-bold">
                            {isClickableAvg ? (
                                <button 
                                    className={innerCellClasses}
                                    onClick={() => {
                                        let ziel: ManuelleNoteZiel | undefined;
                                        if (col.type === 'halbjahr_avg') ziel = col.halbjahr === 1 ? 'hj1' : 'hj2';
                                        if (col.type === 'gesamt_avg') ziel = 'gesamt';
                                        if (ziel && selectedLerngruppe) {
                                            openManuelleNoteModal({ 
                                                schueler, 
                                                lerngruppeId: selectedLerngruppe.id, 
                                                ziel, 
                                                berechneteNote: noteData?.finalGrade,
                                                berechneteDezimalNote: noteData?.displayDecimal 
                                            });
                                        }
                                    }}
                                >
                                    {isManuellUeberschrieben && <ExclamationCircleIcon className="w-4 h-4 text-[var(--color-warning-text)] absolute top-0.5 right-0.5" />}
                                    {innerCellContent}
                                </button>
                            ) : (
                                <div className={innerCellClasses}>
                                    {innerCellContent}
                                </div>
                            )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
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