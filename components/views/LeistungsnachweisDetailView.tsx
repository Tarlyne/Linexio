import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useLerngruppenContext } from '../../context/LerngruppenContext';
import { useNotenContext } from '../../context/NotenContext';
import { useUIContext } from '../../context/UIContext';
import { useModalContext } from '../../context/ModalContext';
import { PREDEFINED_NOTENSYSTEME, EinzelLeistungsNote } from '../../context/types';
import { PlusIcon, EyeIcon, ChatBubbleBottomCenterTextIcon, ChartBarIcon, ArrowTopRightOnSquareIcon } from '../icons';
import Button from '../ui/Button';
import { berechneSammelnoteDurchschnitt, berechneKlausurNote } from '../../services/NotenberechnungService';
import { generateSammelnotePDF } from '../../services/PdfExportService';
import { useNumpadOrchestrator } from '../../hooks/useNumpadOrchestrator';
import AddEinzelLeistungModal from '../modals/AddEinzelLeistungModal';
import EditEinzelLeistungModal from '../modals/EditEinzelLeistungModal';
import ConfirmDeleteEinzelLeistungModal from '../modals/ConfirmDeleteEinzelLeistungModal';
import NoteneingabeNumpadModal from '../modals/NoteneingabeNumpadModal';
import AddKlausuraufgabeModal from '../modals/AddKlausuraufgabeModal';
import EditKlausuraufgabeModal from '../modals/EditKlausuraufgabeModal';
import ConfirmDeleteKlausuraufgabeModal from '../modals/ConfirmDeleteKlausuraufgabeModal';
import PunkteNumpadModal from '../modals/PunkteNumpadModal';
import { isAppleMobile } from '../../context/utils';
import DownloadAnleitungModal from '../modals/DownloadAnleitungModal';


const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
}

const GewichtungBadge: React.FC<{ gewichtung: number }> = ({ gewichtung }) => (
    <span className="relative bg-[var(--color-accent-primary)] text-[var(--color-text-primary)] w-5 h-5 rounded-full inline-block flex-shrink-0 border-2 border-[var(--color-ui-primary)] align-middle">
        <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-bold">
            {gewichtung}
        </span>
    </span>
);

const LeistungsnachweisDetailView: React.FC = () => {
    const lerngruppenContext = useLerngruppenContext();
    const notenContext = useNotenContext();
    const uiContext = useUIContext();
    const modalContext = useModalContext();

    const { selectedLerngruppe: lerngruppe, schuelerInSelectedLerngruppe: schueler } = lerngruppenContext;
    const { 
        leistungsnachweise, 
        einzelLeistungen, 
        einzelLeistungsNoten, 
        klausuraufgabePunkte, 
        notenschluesselMap,
        handleDeleteEinzelLeistung,
        handleDeleteKlausuraufgabe
    } = notenContext;
    const { selectedLeistungsnachweisId, focusedSchuelerId, onToggleFocusSchueler, onBackToNotenuebersicht, setHeaderConfig, handleNavigate } = uiContext;
    const { 
        openAddEinzelLeistungModal, 
        openEditEinzelLeistungModal, 
        openNumpadModal, 
        openAddKlausuraufgabeModal, 
        openEditKlausuraufgabeModal, 
        openPunkteNumpadModal,
        einzelLeistungToDelete,
        isConfirmDeleteEinzelLeistungModalOpen,
        closeConfirmDeleteEinzelLeistungModal,
        klausuraufgabeToDelete,
        isConfirmDeleteKlausuraufgabeModalOpen,
        closeConfirmDeleteKlausuraufgabeModal,
    } = modalContext;
    
    const [isAnleitungModalOpen, setIsAnleitungModalOpen] = useState(false);
    const isAppleDevice = useMemo(() => isAppleMobile(), []);

    const { handleNumpadSaveAndNext, handlePunkteNumpadSaveAndNext } = useNumpadOrchestrator();

    const leistungsnachweis = useMemo(() => leistungsnachweise.find(ln => ln.id === selectedLeistungsnachweisId), [leistungsnachweise, selectedLeistungsnachweisId]);

    const notensystemForLerngruppe = useMemo(() => PREDEFINED_NOTENSYSTEME.find(ns => ns.id === lerngruppe?.notensystemId), [lerngruppe?.notensystemId]);

    const sortedSchueler = useMemo(() => [...(schueler || [])].sort((a, b) => a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName)), [schueler]);
    const sortedSchuelerIds = useMemo(() => sortedSchueler.map(s => s.id), [sortedSchueler]);
    
    // --- Sammelnote Specific ---
    const filteredEinzelLeistungen = useMemo(() =>
        leistungsnachweis?.typ === 'sammelnote' ? einzelLeistungen.filter(el => el.leistungsnachweisId === leistungsnachweis.id).sort((a, b) => a.order - b.order) : [],
        [einzelLeistungen, leistungsnachweis]
    );

    const notenMap = useMemo(() => {
        const map = new Map<string, EinzelLeistungsNote>();
        einzelLeistungsNoten.forEach(note => { map.set(`${note.schuelerId}-${note.einzelLeistungId}`, note); });
        return map;
    }, [einzelLeistungsNoten]);

    const schuelerGesamtNotenMap = useMemo(() => {
        if (leistungsnachweis?.typ !== 'sammelnote' || !notensystemForLerngruppe || !lerngruppe) {
            return new Map();
        }
        return berechneSammelnoteDurchschnitt(
            sortedSchueler,
            filteredEinzelLeistungen,
            notenMap,
            notensystemForLerngruppe,
            lerngruppe
        );
    }, [leistungsnachweis, notensystemForLerngruppe, lerngruppe, sortedSchueler, filteredEinzelLeistungen, notenMap]);

    const pdfProps = useMemo(() => ({
        leistungsnachweis,
        lerngruppe,
        schueler: sortedSchueler,
        einzelLeistungen: filteredEinzelLeistungen,
        notenMap,
        schuelerGesamtNotenMap,
    }), [leistungsnachweis, lerngruppe, sortedSchueler, filteredEinzelLeistungen, notenMap, schuelerGesamtNotenMap]);

    const handleGeneratePdf = useCallback(() => {
        if (pdfProps.leistungsnachweis && pdfProps.lerngruppe) {
            generateSammelnotePDF(pdfProps);
        }
    }, [pdfProps]);
    
    const handleExportClick = useCallback(() => {
        if (isAppleDevice) {
            setIsAnleitungModalOpen(true);
        } else {
            handleGeneratePdf();
        }
    }, [isAppleDevice, handleGeneratePdf]);

    useEffect(() => {
        if (leistungsnachweis && lerngruppe) {
            const actions = leistungsnachweis.typ === 'sammelnote' ? (
                <Button
                    variant="primary"
                    onClick={handleExportClick}
                    className="!p-2"
                    aria-label="Als PDF exportieren"
                >
                    <ArrowTopRightOnSquareIcon className="w-6 h-6" />
                </Button>
            ) : undefined;

            setHeaderConfig({
                title: leistungsnachweis.name,
                subtitle: <p className="text-sm text-[var(--color-accent-text)]">{lerngruppe.name}</p>,
                onBack: onBackToNotenuebersicht,
                banner: null,
                actions: actions,
            });
        }
    }, [leistungsnachweis, lerngruppe, setHeaderConfig, onBackToNotenuebersicht, handleExportClick]);
    
    // --- Klausur Specific ---
    const aufgaben = useMemo(() => (leistungsnachweis?.aufgaben || []).sort((a, b) => a.order - b.order), [leistungsnachweis?.aufgaben]);
    const punkteMap = useMemo(() => {
        const map = new Map<string, number | null>(); // Key: 'schuelerId-aufgabeId'
        klausuraufgabePunkte.forEach(p => { map.set(`${p.schuelerId}-${p.aufgabeId}`, p.punkte); });
        return map;
    }, [klausuraufgabePunkte]);

    const schuelerKlausurNotenMap = useMemo(() => {
        if (leistungsnachweis?.typ !== 'klausur' || !notensystemForLerngruppe || !lerngruppe) {
            return new Map();
        }
        return berechneKlausurNote(
            sortedSchueler,
            aufgaben,
            punkteMap,
            leistungsnachweis,
            notensystemForLerngruppe,
            lerngruppe,
            notenschluesselMap
        );
    }, [leistungsnachweis, notensystemForLerngruppe, lerngruppe, sortedSchueler, aufgaben, punkteMap, notenschluesselMap]);


    // --- Common ---
    const schuelerColumnWidth = useMemo(() => {
        const longestNameLength = Math.max(0, ...(schueler || []).map(s => s.lastName.length + s.firstName.length));
        return Math.min(280, Math.max(180, 80 + longestNameLength * 7));
    }, [schueler]);

    if (!leistungsnachweis || !lerngruppe || !notensystemForLerngruppe) {
        return <div className="p-4 bg-[var(--color-ui-primary)] rounded-lg"><p className="text-[var(--color-text-secondary)]">Leistungsnachweis wird geladen...</p></div>
    }
    const noteToPoints = new Map(notensystemForLerngruppe.noten.map(n => [n.displayValue, n.pointValue]));
    
    const renderContent = () => {
        // --- RENDER SAMMELNOTE ---
        if (leistungsnachweis.typ === 'sammelnote') {
            const gridTemplateColumns = `${schuelerColumnWidth}px 90px ${filteredEinzelLeistungen.map(() => '80px').join(' ')} 80px 120px`;
            return (
                <div className="min-w-max">
                    {/* Header */}
                    <div className="sticky top-0 z-20 grid" style={{ gridTemplateColumns }}>
                        <div className="sticky left-0 z-30 p-3 flex items-center justify-center bg-[var(--color-ui-primary)] border-b border-r border-[var(--color-border)]"><span className="font-bold text-[var(--color-text-tertiary)]">SchülerIn</span></div>
                        <div className="p-3 border-b border-r border-[var(--color-border)] flex items-center justify-center bg-[var(--color-ui-primary)]"><span className="font-bold text-[var(--color-accent-text)]">Gesamt Ø</span></div>
                        {filteredEinzelLeistungen.map(el => (
                            <div key={el.id} className="p-1 border-b border-r border-[var(--color-border)] flex items-center justify-center bg-[var(--color-ui-primary)] min-w-0">
                                <button onClick={() => openEditEinzelLeistungModal(el)} className="w-full h-full flex flex-col items-center justify-center rounded-md hover:bg-[var(--color-ui-secondary)] transition-colors min-w-0">
                                    <span className="font-bold text-[var(--color-text-primary)] truncate text-sm w-full px-1 min-w-0">{el.name}</span>
                                    <GewichtungBadge gewichtung={el.gewichtung} />
                                </button>
                            </div>
                        ))}
                        <div className="p-3 border-b border-r border-[var(--color-border)] flex items-center justify-center bg-[var(--color-ui-primary)]">
                            <Button onClick={() => openAddEinzelLeistungModal(leistungsnachweis.id)} variant="secondary" className="!p-2" aria-label="Neue Notenspalte hinzufügen"><PlusIcon /></Button>
                        </div>
                        <div className="p-1 border-b border-r border-[var(--color-border)] flex items-center justify-center bg-[var(--color-ui-primary)]">
                            <button
                                onClick={() => handleNavigate('sammelnoteAuswertung', lerngruppe.id, undefined, leistungsnachweis.id)}
                                className="w-full h-full flex flex-col items-center justify-center rounded-md bg-[var(--color-ui-secondary)] hover:bg-[var(--color-ui-tertiary)] transition-colors"
                            >
                                <span className="font-bold text-[var(--color-text-primary)] truncate text-sm">Auswertung</span>
                                <span className="font-bold text-[var(--color-accent-text)] text-xs mt-1">Gesamt</span>
                            </button>
                        </div>
                    </div>

                    {/* Body */}
                    {sortedSchueler.map(s => {
                        const isFocused = focusedSchuelerId === s.id;
                        const isAnyFocused = focusedSchuelerId !== null;
                        const rowClasses = `grid transition-all duration-300 ${isAnyFocused && !isFocused ? 'relative blur-sm focus-overlay' : ''}`;
                        const gesamtNote = schuelerGesamtNotenMap.get(s.id);
                        const gesamtNotePointValue = gesamtNote ? noteToPoints.get(gesamtNote.finalGrade) : undefined;
                        const gesamtNoteColorClass = (typeof gesamtNotePointValue === 'number' && gesamtNotePointValue <= 3) ? 'text-[var(--color-danger-text)]' : 'text-[var(--color-text-primary)]';
                        return (
                            <div key={s.id} className={rowClasses} style={{ gridTemplateColumns }}>
                                <div className="sticky left-0 z-10 flex items-center space-x-3 px-2 py-1 bg-[var(--color-ui-primary)] border-b border-r border-[var(--color-border)]">
                                    <button onClick={() => onToggleFocusSchueler(s.id)} disabled={isAnyFocused && !isFocused} className="p-1 rounded-full transition-colors group disabled:cursor-not-allowed disabled:opacity-50"><EyeIcon className={`w-5 h-5 transition-colors ${isFocused ? 'text-[var(--color-accent-text)]' : 'text-[var(--color-text-tertiary)] group-hover:text-[var(--color-text-primary)]'}`} /></button>
                                    <div className="w-8 h-8 bg-gradient-to-br from-[var(--color-accent-primary-hover)] to-[var(--color-accent-primary)] text-[var(--color-accent-text-inverted)] rounded-md flex items-center justify-center font-bold text-xs flex-shrink-0">{getInitials(s.firstName, s.lastName)}</div>
                                    <div><div className="font-bold text-[var(--color-text-primary)] truncate">{s.lastName},</div><div className="text-sm text-[var(--color-text-secondary)] truncate">{s.firstName}</div></div>
                                </div>
                                <div className="flex items-center justify-center p-1 border-b border-r border-[var(--color-border)] bg-[var(--color-ui-primary)] font-bold">
                                    <div className="h-10 w-14 rounded-md flex flex-col items-center justify-center bg-[var(--color-ui-secondary)] border border-[var(--color-accent-border-focus)]">
                                        {gesamtNote && <div className="relative -top-px flex flex-col items-center"><span className={`text-lg leading-tight ${gesamtNoteColorClass}`}>{gesamtNote.finalGrade}</span><span className="text-[9px] text-[var(--color-text-tertiary)] leading-none">{gesamtNote.displayDecimal}</span></div>}
                                    </div>
                                </div>
                                {filteredEinzelLeistungen.map(el => {
                                    const noteRecord = notenMap.get(`${s.id}-${el.id}`);
                                    const note = noteRecord?.note;
                                    const hasBemerkung = !!noteRecord?.bemerkung;
                                    const pointValue = note ? noteToPoints.get(note) : undefined;
                                    const noteColorClass = (typeof pointValue === 'number' && pointValue <= 3) ? 'text-[var(--color-danger-text)]' : '';
                                    return (
                                        <div key={el.id} className="flex items-center justify-center border-b border-r border-[var(--color-border)] bg-[var(--color-ui-primary)]">
                                            <button onClick={() => openNumpadModal({ schueler: s, einzelLeistungId: el.id, currentNote: note || '', currentBemerkung: noteRecord?.bemerkung, sortedSchuelerIds })} className={`relative h-8 w-12 rounded-md flex items-center justify-center text-lg hover:bg-[var(--color-ui-tertiary)] transition-colors bg-[var(--color-ui-secondary)] ${noteColorClass}`} disabled={isAnyFocused && !isFocused}>
                                                {note}
                                                {hasBemerkung && <span className="absolute top-0 right-0"><ChatBubbleBottomCenterTextIcon className="w-3 h-3 text-[var(--color-accent-text)]" /></span>}
                                            </button>
                                        </div>
                                    );
                                })}
                                <div className="border-b border-r border-[var(--color-border)] bg-[var(--color-ui-primary)]"></div>
                                <div className="flex items-center justify-center p-1 border-b border-r border-[var(--color-border)] bg-[var(--color-ui-primary)]">
                                    <button
                                        onClick={() => handleNavigate('schuelerAuswertung', lerngruppe.id, s.id, leistungsnachweis.id)}
                                        className="h-8 w-12 rounded-md flex items-center justify-center text-base bg-[var(--color-ui-secondary)] text-[var(--color-text-primary)] hover:bg-[var(--color-ui-tertiary)]"
                                        title={`Einzelauswertung für ${s.firstName} ${s.lastName}`}
                                    >
                                        <ChartBarIcon className="w-5 h-5 text-[var(--color-accent-text)]" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            );
        }
        
        // --- RENDER KLAUSUR ---
        if (leistungsnachweis.typ === 'klausur') {
            const maxPunkteGesamt = aufgaben.reduce((sum, aufg) => sum + aufg.maxPunkte, 0);
            const gridTemplateColumns = `${schuelerColumnWidth}px 90px 90px ${aufgaben.map(() => '80px').join(' ')} 80px 120px`;
            return (
                <div className="min-w-max">
                    {/* Header */}
                    <div className="sticky top-0 z-20 grid" style={{ gridTemplateColumns }}>
                        <div className="sticky left-0 z-30 p-3 flex items-center justify-center bg-[var(--color-ui-primary)] border-b border-r border-[var(--color-border)]"><span className="font-bold text-[var(--color-text-tertiary)]">SchülerIn</span></div>
                        <div className="p-3 border-b border-r border-[var(--color-border)] flex items-center justify-center bg-[var(--color-ui-primary)]"><span className="font-bold text-[var(--color-accent-text)]">Note</span></div>
                        <div className="p-1 border-b border-r border-[var(--color-border)] flex flex-col items-center justify-center bg-[var(--color-ui-primary)]"><span className="font-bold text-yellow-400 text-sm">Punkte</span><span className="font-bold text-yellow-400 text-xs mt-1">{maxPunkteGesamt} P.</span></div>
                        {aufgaben.map(aufg => (
                            <div key={aufg.id} className="p-1 border-b border-r border-[var(--color-border)] flex items-center justify-center bg-[var(--color-ui-primary)]">
                                <button 
                                    onClick={() => openEditKlausuraufgabeModal(aufg)} 
                                    className="w-full h-full flex flex-col items-center justify-center rounded-md hover:bg-[var(--color-ui-secondary)] transition-colors"
                                    title={aufg.inhalt} // Tooltip for content
                                >
                                    <span className="font-bold text-[var(--color-text-primary)] truncate text-sm w-full">{aufg.name}</span>
                                    <span className="font-semibold text-[var(--color-accent-text)] text-xs mt-1">{aufg.maxPunkte} P.</span>
                                </button>
                            </div>
                        ))}
                        <div className="p-3 border-b border-r border-[var(--color-border)] flex items-center justify-center bg-[var(--color-ui-primary)]">
                            <Button onClick={() => openAddKlausuraufgabeModal(leistungsnachweis.id)} variant="secondary" className="!p-2" aria-label="Neue Aufgabe hinzufügen"><PlusIcon /></Button>
                        </div>
                        <div className="p-1 border-b border-r border-[var(--color-border)] flex items-center justify-center bg-[var(--color-ui-primary)]">
                            <button
                                onClick={() => handleNavigate('klausurAuswertung', lerngruppe.id, undefined, leistungsnachweis.id)}
                                className="w-full h-full flex flex-col items-center justify-center rounded-md bg-[var(--color-ui-secondary)] hover:bg-[var(--color-ui-tertiary)] transition-colors"
                            >
                                <span className="font-bold text-[var(--color-text-primary)] truncate text-sm">Auswertung</span>
                                <span className="font-bold text-[var(--color-accent-text)] text-xs mt-1">Gesamt</span>
                            </button>
                        </div>
                    </div>

                    {/* Body */}
                    {sortedSchueler.map(s => {
                        const isFocused = focusedSchuelerId === s.id;
                        const isAnyFocused = focusedSchuelerId !== null;
                        const rowClasses = `grid transition-all duration-300 ${isAnyFocused && !isFocused ? 'relative blur-sm focus-overlay' : ''}`;
                        const gesamt = schuelerKlausurNotenMap.get(s.id);
                        const gesamtNotePointValue = gesamt && notensystemForLerngruppe ? notensystemForLerngruppe.noten.find(n => n.displayValue === gesamt.finalGrade)?.pointValue : undefined;
                        const gesamtNoteColorClass = (typeof gesamtNotePointValue === 'number' && gesamtNotePointValue <= 3) ? 'text-[var(--color-danger-text)]' : 'text-[var(--color-text-primary)]';
                        return (
                            <div key={s.id} className={rowClasses} style={{ gridTemplateColumns }}>
                                <div className="sticky left-0 z-10 flex items-center space-x-3 px-2 py-1 bg-[var(--color-ui-primary)] border-b border-r border-[var(--color-border)]">
                                    <button onClick={() => onToggleFocusSchueler(s.id)} disabled={isAnyFocused && !isFocused} className="p-1 rounded-full group transition-colors"><EyeIcon className={`w-5 h-5 ${isFocused ? 'text-[var(--color-accent-text)]' : 'text-[var(--color-text-tertiary)] group-hover:text-[var(--color-text-primary)]'}`} /></button>
                                    <div className="w-8 h-8 bg-gradient-to-br from-[var(--color-accent-primary-hover)] to-[var(--color-accent-primary)] text-[var(--color-accent-text-inverted)] rounded-md flex items-center justify-center font-bold text-xs flex-shrink-0">{getInitials(s.firstName, s.lastName)}</div>
                                    <div><div className="font-bold text-[var(--color-text-primary)] truncate">{s.lastName},</div><div className="text-sm text-[var(--color-text-secondary)] truncate">{s.firstName}</div></div>
                                </div>
                                <div className="flex items-center justify-center p-1 border-b border-r border-[var(--color-border)] bg-[var(--color-ui-primary)] font-bold">
                                    <div className="h-10 w-14 rounded-md flex items-center justify-center bg-[var(--color-ui-secondary)] border border-[var(--color-accent-border-focus)]">
                                        {gesamt && <span className={`text-xl ${gesamtNoteColorClass}`}>{gesamt.finalGrade}</span>}
                                    </div>
                                </div>
                                <div className="flex items-center justify-center p-1 border-b border-r border-[var(--color-border)] bg-[var(--color-ui-primary)] font-bold">
                                    <div className="h-10 w-16 rounded-md flex flex-col items-center justify-center bg-[var(--color-ui-secondary)]">
                                        {gesamt && <><span className="text-base text-[var(--color-text-primary)]">{gesamt.totalPunkte.toLocaleString('de-DE')}</span><span className="text-[10px] text-[var(--color-text-tertiary)]">{gesamt.prozent.toFixed(1).replace('.', ',')}%</span></>}
                                    </div>
                                </div>
                                {aufgaben.map(aufg => {
                                    const punkte = punkteMap.get(`${s.id}-${aufg.id}`);
                                    return (
                                        <div key={aufg.id} className="flex items-center justify-center border-b border-r border-[var(--color-border)] bg-[var(--color-ui-primary)]">
                                            <button 
                                                onClick={() => openPunkteNumpadModal({ 
                                                    schueler: s, 
                                                    aufgabeId: aufg.id,
                                                    aufgabeName: aufg.name,
                                                    maxPunkte: aufg.maxPunkte, 
                                                    currentPunkte: punkte ?? null, 
                                                    sortedSchuelerIds,
                                                    leistungsnachweisId: leistungsnachweis.id,
                                                    sortedAufgabenIds: aufgaben.map(a => a.id),
                                                })} 
                                                className="h-8 w-12 rounded-md flex items-center justify-center text-base hover:bg-[var(--color-ui-tertiary)] transition-colors bg-[var(--color-ui-secondary)] text-[var(--color-text-primary)]" 
                                                disabled={isAnyFocused && !isFocused}
                                            >
                                                {punkte?.toLocaleString('de-DE') ?? ''}
                                            </button>
                                        </div>
                                    );
                                })}
                                <div className="border-b border-r border-[var(--color-border)] bg-[var(--color-ui-primary)]"></div>
                                <div className="flex items-center justify-center p-1 border-b border-r border-[var(--color-border)] bg-[var(--color-ui-primary)]">
                                    <button
                                        onClick={() => handleNavigate('schuelerAuswertung', lerngruppe.id, s.id, leistungsnachweis.id)}
                                        className="h-8 w-12 rounded-md flex items-center justify-center text-base bg-[var(--color-ui-secondary)] text-[var(--color-text-primary)] hover:bg-[var(--color-ui-tertiary)]"
                                        title={`Einzelauswertung für ${s.firstName} ${s.lastName}`}
                                    >
                                        <ChartBarIcon className="w-5 h-5 text-[var(--color-accent-text)]" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            );
        }

        return null;
    };
    
    return (
        <>
            <div className="self-start max-w-full h-full overflow-auto rounded-lg border border-[var(--color-border)]" style={{ scrollbarGutter: 'stable' }}>
                <div className="inline-block align-middle">
                    {renderContent()}
                </div>
            </div>

            {/* --- Modals --- */}
            <AddEinzelLeistungModal />
            <EditEinzelLeistungModal />
            <ConfirmDeleteEinzelLeistungModal
                isOpen={isConfirmDeleteEinzelLeistungModalOpen}
                onClose={closeConfirmDeleteEinzelLeistungModal}
                onConfirm={handleDeleteEinzelLeistung}
                einzelLeistung={einzelLeistungToDelete}
            />
            <NoteneingabeNumpadModal onSaveAndNext={handleNumpadSaveAndNext} />

            <AddKlausuraufgabeModal />
            <EditKlausuraufgabeModal />
            <ConfirmDeleteKlausuraufgabeModal
                isOpen={isConfirmDeleteKlausuraufgabeModalOpen}
                onClose={closeConfirmDeleteKlausuraufgabeModal}
                onConfirm={() => {
                    if (klausuraufgabeToDelete && leistungsnachweis?.id) {
                        handleDeleteKlausuraufgabe(leistungsnachweis.id, klausuraufgabeToDelete.id);
                    }
                }}
                aufgabe={klausuraufgabeToDelete}
            />
            <PunkteNumpadModal onSaveAndNext={handlePunkteNumpadSaveAndNext} />
            <DownloadAnleitungModal
                isOpen={isAnleitungModalOpen}
                onClose={() => setIsAnleitungModalOpen(false)}
                onConfirm={handleGeneratePdf}
            />
        </>
    )
};

export default LeistungsnachweisDetailView;