import React, { useState, useRef, useEffect, useMemo } from 'react';
import { CloseIcon, DocumentArrowDownIcon, SpinnerIcon } from '../icons';
import Button from '../ui/Button';
import { Leistungsnachweis, NoteMapEntry, Schueler, KlausuraufgabePunkte, SchuelerLeistungsnachweisFeedback, Notensystem, EinzelLeistung, EinzelLeistungsNote, Klausuraufgabe } from '../../context/types';
import SchuelerberichtPDFLayout from '../pdf/SchuelerberichtPDFLayout';
import { generateSchuelerBerichtePDF } from '../../services/PdfExportService';
import { isAppleMobile } from '../../context/utils';
import DownloadAnleitungModal from './DownloadAnleitungModal';

interface PdfPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    options: { includeNotenspiegel: boolean; showDetails?: boolean; showSignatures?: boolean; };
    leistungsnachweis: Leistungsnachweis;
    schuelerInSelectedLerngruppe: Schueler[];
    schuelerKlausurNotenMap: Map<string, NoteMapEntry & { totalPunkte?: number; prozent?: number; }>;
    klausuraufgabePunkte: KlausuraufgabePunkte[];
    schuelerLeistungsnachweisFeedback: SchuelerLeistungsnachweisFeedback[];
    klausurDaten: any;
    notensystem: Notensystem;
    // Optional props for Sammelnote
    einzelLeistungen?: EinzelLeistung[];
    notenMap?: Map<string, EinzelLeistungsNote>;
    sammelnoteDaten?: any;
    // NEW: Optional secondary report data for combined view
    secondaryReportData?: {
        leistungsnachweis: Leistungsnachweis;
        noteMap: Map<string, NoteMapEntry>;
        details: any[];
        feedbackList: SchuelerLeistungsnachweisFeedback[];
    };
}

const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({
    isOpen,
    onClose,
    options,
    secondaryReportData,
    ...pdfProps
}) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [scale, setScale] = useState(1);
    const [isAnleitungModalOpen, setIsAnleitungModalOpen] = useState(false);
    const previewContainerRef = useRef<HTMLDivElement>(null);
    const isAppleDevice = useMemo(() => isAppleMobile(), []);

    useEffect(() => {
        const container = previewContainerRef.current;
        if (!isOpen || !container) return;

        const calculateScale = () => {
            const containerWidth = container.clientWidth;
            // The container has p-8, which is 2rem (32px) on each side.
            const contentAreaWidth = containerWidth - 64; 
            const newScale = Math.min(1, contentAreaWidth / 550); // Ensure we don't scale up
            setScale(newScale);
        };

        const resizeObserver = new ResizeObserver(calculateScale);
        resizeObserver.observe(container);
        calculateScale(); // Initial calculation

        return () => resizeObserver.unobserve(container);
    }, [isOpen]);


    if (!isOpen) return null;

    const teilnehmendeSchueler = pdfProps.schuelerInSelectedLerngruppe
        .filter(s => pdfProps.schuelerKlausurNotenMap.has(s.id))
        .sort((a,b) => a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName));
    
    // For Pagination in Preview if list is long
    const pages = [];
    // If combined, 1 student per "page", otherwise 2 per "page" (conceptually)
    const chunkSize = secondaryReportData ? 1 : 2;
    
    for (let i = 0; i < teilnehmendeSchueler.length; i += chunkSize) {
        pages.push(teilnehmendeSchueler.slice(i, i + chunkSize));
    }

    const performDownload = async () => {
        setIsGenerating(true);
        try {
            await generateSchuelerBerichtePDF({ ...pdfProps, ...options, secondaryReportData });
        } catch (error) {
            console.error("PDF generation failed:", error);
        } finally {
            setIsGenerating(false);
            onClose();
        }
    };
    
    const handleDownloadClick = () => {
        if (isAppleDevice) {
            setIsAnleitungModalOpen(true);
        } else {
            performDownload();
        }
    };

    const isSammelnote = pdfProps.leistungsnachweis.typ === 'sammelnote';

    // Helper to prepare props for a specific report
    const prepareReportProps = (schueler: Schueler, isSecondary = false) => {
        if (isSecondary && secondaryReportData) {
            const ln = secondaryReportData.leistungsnachweis;
            const noteData = secondaryReportData.noteMap.get(schueler.id);
            if (!noteData) return null;

            const feedbackRecord = secondaryReportData.feedbackList.find(f => f.schuelerId === schueler.id);
            
            // Map details
            let aufgabenDetails: any[] = [];
            let sammelnoteDetails: any[] = [];
            
            if (ln.typ === 'klausur') {
                // Secondary Klausur: Map tasks to student-specific points using the global context
                aufgabenDetails = (secondaryReportData.details as Klausuraufgabe[]).map(aufgabe => {
                    const punkteEintrag = pdfProps.klausuraufgabePunkte.find(p => p.schuelerId === schueler.id && p.aufgabeId === aufgabe.id);
                    return {
                        id: aufgabe.id,
                        name: aufgabe.name,
                        erreichtePunkte: punkteEintrag?.punkte ?? 0,
                        maxPunkte: aufgabe.maxPunkte,
                    };
                });
            } else {
                 // Secondary Sammelnote: Map items to student-specific grades using the provided map
                 sammelnoteDetails = (secondaryReportData.details as EinzelLeistung[]).map(el => {
                    const noteRecord = pdfProps.notenMap?.get(`${schueler.id}-${el.id}`);
                    return {
                        name: el.name,
                        note: noteRecord?.note || '-',
                        weighting: el.gewichtung
                    };
                });
            }

            return {
                schueler,
                leistungsnachweis: ln,
                noteData,
                aufgabenDetails,
                sammelnoteDetails,
                feedback: feedbackRecord?.feedbackText || '',
                klausurDaten: null, // Secondary has no statistics for now
                includeNotenspiegel: false, // Secondary usually doesn't need class mirror
                showSignatures: true, // Secondary gets the signature line in combined mode
                notensystem: pdfProps.notensystem,
                scale
            };
        }

        // Primary Report Logic
        const noteData = pdfProps.schuelerKlausurNotenMap.get(schueler.id);
        if (!noteData) return null;

        let aufgabenDetails: any[] = [];
        let sammelnoteDetails: any[] | undefined = undefined;

        if (isSammelnote && pdfProps.einzelLeistungen && pdfProps.notenMap) {
            if (options.showDetails) {
                sammelnoteDetails = pdfProps.einzelLeistungen.map(el => {
                    const noteRecord = pdfProps.notenMap!.get(`${schueler.id}-${el.id}`);
                    return {
                        name: el.name,
                        note: noteRecord?.note || '-',
                        weighting: el.gewichtung
                    };
                });
            }
        } else {
            // Klausur
            aufgabenDetails = (pdfProps.leistungsnachweis.aufgaben || []).map(aufgabe => {
                const punkteEintrag = pdfProps.klausuraufgabePunkte.find(p => p.schuelerId === schueler.id && p.aufgabeId === aufgabe.id);
                return {
                    id: aufgabe.id,
                    name: aufgabe.name,
                    erreichtePunkte: punkteEintrag?.punkte ?? 0,
                    maxPunkte: aufgabe.maxPunkte,
                };
            });
        }

        const feedbackRecord = pdfProps.schuelerLeistungsnachweisFeedback.find(f => f.schuelerId === schueler.id && f.leistungsnachweisId === pdfProps.leistungsnachweis.id);

        return {
            schueler,
            leistungsnachweis: pdfProps.leistungsnachweis,
            noteData,
            aufgabenDetails,
            sammelnoteDetails,
            feedback: feedbackRecord?.feedbackText || '',
            klausurDaten: pdfProps.klausurDaten,
            includeNotenspiegel: options.includeNotenspiegel,
            showSignatures: secondaryReportData ? false : options.showSignatures, // Hide signature on primary if combined
            notensystem: pdfProps.notensystem,
            scale
        };
    };

    return (
        <>
            <div 
                className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" 
                aria-modal="true"
                role="dialog"
                onClick={onClose}
            >
                <div 
                    className="bg-[var(--color-ui-primary)] rounded-xl shadow-2xl w-full h-full max-w-5xl max-h-[95vh] border border-[var(--color-border)] flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <header className="flex-shrink-0 bg-[var(--color-ui-primary)] h-16 px-6 flex items-center justify-between border-b border-[var(--color-border)] rounded-t-xl">
                        <h2 className="text-xl font-bold text-[var(--color-text-primary)]">PDF-Vorschau</h2>
                        <div className="flex items-center space-x-4">
                            <Button variant="secondary" onClick={onClose} disabled={isGenerating}>
                                Schließen
                            </Button>
                            <Button onClick={handleDownloadClick} disabled={isGenerating}>
                                {isGenerating ? <SpinnerIcon /> : <DocumentArrowDownIcon className="w-5 h-5" />}
                                <span>{isGenerating ? 'Generiere...' : (isAppleDevice ? 'Öffnen & Sichern' : 'Als PDF herunterladen')}</span>
                            </Button>
                        </div>
                    </header>

                    {/* Content */}
                    <main ref={previewContainerRef} className="relative flex-1 bg-[var(--color-background-subtle)] overflow-y-auto p-8 rounded-b-xl flex justify-center">
                        <div className="space-y-8">
                            {pages.map((pageSchueler, pageIndex) => (
                                <div key={pageIndex} className="bg-white shadow-lg mx-auto" style={{ padding: `${8*scale}px` }}>
                                    {pageSchueler.map((schueler, schuelerIndex) => {
                                        const primaryProps = prepareReportProps(schueler, false);
                                        const secondaryProps = secondaryReportData ? prepareReportProps(schueler, true) : null;

                                        if (!primaryProps) return null;

                                        return (
                                            <React.Fragment key={schueler.id}>
                                                <div className="flex flex-col gap-4">
                                                    {/* Primary Report */}
                                                    <SchuelerberichtPDFLayout {...primaryProps} />
                                                    
                                                    {/* Secondary Report (if combined) */}
                                                    {secondaryProps && (
                                                        <>
                                                            <div style={{ borderTop: '2px dashed #9ca3af', margin: `${10 * scale}px 0` }}></div>
                                                            <SchuelerberichtPDFLayout {...secondaryProps} />
                                                        </>
                                                    )}
                                                </div>
                                                
                                                {/* Separator for standard multiple-per-page layout (only if NOT combined) */}
                                                {!secondaryReportData && schuelerIndex < pageSchueler.length - 1 && (
                                                    <div style={{ borderTop: '1px dashed #9ca3af', margin: `${16 * scale}px 0` }}></div>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </main>
                </div>
            </div>
            <DownloadAnleitungModal
                isOpen={isAnleitungModalOpen}
                onClose={() => setIsAnleitungModalOpen(false)}
                onConfirm={performDownload}
            />
        </>
    );
};

export default PdfPreviewModal;