import React, { useState, useRef, useEffect, useMemo } from 'react';
import { DocumentArrowDownIcon, SpinnerIcon } from '../icons';
import Button from '../ui/Button';
import { useLerngruppenContext } from '../../context/LerngruppenContext';
import { useNotenContext } from '../../context/NotenContext';
import { ColumnDef, HeaderCell, Leistungsnachweis, Notenkategorie } from '../../context/types';
import GesamtuebersichtPDFLayout from '../pdf/GesamtuebersichtPDFLayout';
import { generateGesamtuebersichtPDF } from '../../services/PdfExportService';
import { useToastContext } from '../../context/ToastContext';
import { isAppleMobile } from '../../context/utils';
import DownloadAnleitungModal from './DownloadAnleitungModal';

interface PdfPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const GesamtuebersichtPdfPreviewModal: React.FC<PdfPreviewModalProps> = ({ isOpen, onClose }) => {
    const { selectedLerngruppe, schuelerInSelectedLerngruppe } = useLerngruppenContext();
    const { columns, schuelerGesamtNotenMap, schuelerHalbjahresNotenMap, schuelerKategorieNotenMap, schuelerLeistungsnachweisNotenMap } = useNotenContext();
    
    const [isGenerating, setIsGenerating] = useState(false);
    const [scale, setScale] = useState(1);
    const [isAnleitungModalOpen, setIsAnleitungModalOpen] = useState(false);
    const previewContainerRef = useRef<HTMLDivElement>(null);
    const isAppleDevice = useMemo(() => isAppleMobile(), []);

    const schueler = useMemo(() => 
        [...schuelerInSelectedLerngruppe].sort((a,b) => a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName)),
    [schuelerInSelectedLerngruppe]);

    const schuelerColumnWidth = useMemo(() => {
        const longestNameLength = Math.max(0, ...schueler.map(s => s.lastName.length + s.firstName.length));
        return Math.min(280, Math.max(180, 80 + longestNameLength * 7));
    }, [schueler]);

    const headerData = useMemo(() => {
        const rows: HeaderCell[][] = [[], [], [], []];
        if (!selectedLerngruppe || columns.length <= 1) return { rows, totalGridColumns: 1, columnTemplate: '1fr' };
        
        const totalGridColumns = columns.length;
        let currentColumn = 1;

        rows[0].push({ id: 'gesamt', text: 'Gesamtes Schuljahr', style: { gridColumn: `1 / ${totalGridColumns + 1}`, gridRow: '1 / 2' }});
        rows[1].push({ id: 'gesamt_avg_header_main', text: 'Gesamt', style: { gridColumn: '1 / 2', gridRow: '2 / 5' }, colDef: columns[0] });
        currentColumn++;

        for (const halbjahr of [1, 2] as const) {
            const hjCols = columns.filter(c => c.halbjahr === halbjahr);
            if (hjCols.length > 0) {
                const hjStartIndex = currentColumn;
                const hjAvgColDef = hjCols.find(c => c.type === 'halbjahr_avg');
                const hjGewichtung = halbjahr === 1 ? selectedLerngruppe.gewichtungHj1 : selectedLerngruppe.gewichtungHj2;
                
                rows[1].push({ id: `h${halbjahr}`, text: `${halbjahr}. Halbjahr`, gewichtung: hjGewichtung, style: { gridColumn: `${hjStartIndex} / ${hjStartIndex + hjCols.length}`, gridRow: '2 / 3' }, colDef: hjAvgColDef });
                rows[2].push({ id: `h${halbjahr}_avg_header_main`, text: `${halbjahr}. Hj Ø`, style: { gridColumn: `${currentColumn} / ${currentColumn + 1}`, gridRow: '3 / 5' }, colDef: hjAvgColDef });
                currentColumn++;

                for (const typ of ['mündlich', 'schriftlich'] as const) {
                    const katCols = hjCols.filter(c => c.kategorieTyp === typ);
                    if (katCols.length > 0) {
                        const katStartIndex = currentColumn;
                        const katAvgColDef = katCols.find(c => c.type === 'kategorie_avg');
                        const lnCols = katCols.filter(c => c.type === 'leistungsnachweis' || c.type === 'kategorie_placeholder');
                        const katName = (katAvgColDef?.data as Notenkategorie)?.name || typ.charAt(0).toUpperCase() + typ.slice(1);
                        const katGewichtung = (katAvgColDef?.data as Notenkategorie)?.gewichtung ?? katAvgColDef?.gewichtung;
                        rows[2].push({ id: `kat_${halbjahr}_${typ}`, text: katName, style: { gridColumn: `${katStartIndex} / ${katStartIndex + katCols.length}`, gridRow: '3 / 4' }, gewichtung: katGewichtung, colDef: katAvgColDef });
                        
                        if (katAvgColDef) {
                            rows[3].push({ id: katAvgColDef.id, text: 'Ø', style: { gridColumn: `${currentColumn} / ${currentColumn + 1}`, gridRow: '4 / 5'}, colDef: katAvgColDef });
                            currentColumn++;
                        }
                        
                        lnCols.forEach(col => {
                            rows[3].push({ id: col.id, text: col.label, gewichtung: col.gewichtung, style: { gridColumn: `${currentColumn} / ${currentColumn + 1}`, gridRow: '4 / 5'}, colDef: col });
                            currentColumn++;
                        });
                    }
                }
            }
        }
        const columnTemplate = columns.map(col => col.type === 'gesamt_avg' ? '80px' : '65px').join(' ');
        return { rows, totalGridColumns, columnTemplate };
    }, [columns, selectedLerngruppe]);

    useEffect(() => {
        const container = previewContainerRef.current;
        if (!isOpen || !container) return;

        const calculateScale = () => {
            const containerWidth = container.clientWidth;
            const contentAreaWidth = containerWidth - 64; 
            const templateWidths = headerData.columnTemplate.split(' ').map(w => parseInt(w, 10));
            const totalWidth = schuelerColumnWidth + templateWidths.reduce((a, b) => a + b, 0);
            const newScale = Math.min(1, contentAreaWidth / totalWidth);
            setScale(newScale);
        };

        const resizeObserver = new ResizeObserver(calculateScale);
        resizeObserver.observe(container);
        calculateScale();

        return () => resizeObserver.unobserve(container);
    }, [isOpen, headerData.columnTemplate, schuelerColumnWidth]);

    if (!isOpen || !selectedLerngruppe) return null;

    const performDownload = async () => {
        setIsGenerating(true);
        try {
            await generateGesamtuebersichtPDF({
                lerngruppe: selectedLerngruppe,
                schueler: schueler,
                headerData,
                columns,
                schuelerColumnWidth,
                maps: {
                    schuelerGesamtNotenMap,
                    schuelerHalbjahresNotenMap,
                    schuelerKategorieNotenMap,
                    schuelerLeistungsnachweisNotenMap,
                }
            });
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


    return (
        <>
            <div 
                className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" 
                aria-modal="true"
                role="dialog"
                onClick={onClose}
            >
                <div 
                    className="bg-[var(--color-ui-primary)] rounded-xl shadow-2xl w-full h-full max-w-7xl max-h-[95vh] border border-[var(--color-border)] flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                >
                    <header className="flex-shrink-0 bg-[var(--color-ui-primary)] h-16 px-6 flex items-center justify-between border-b border-[var(--color-border)] rounded-t-xl">
                        <h2 className="text-xl font-bold text-[var(--color-text-primary)]">PDF-Vorschau: Gesamtübersicht</h2>
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

                    <main ref={previewContainerRef} className="relative flex-1 bg-[var(--color-background-subtle)] overflow-auto p-8 rounded-b-xl flex justify-center">
                        <div className="bg-white shadow-lg mx-auto" style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}>
                            <GesamtuebersichtPDFLayout
                                lerngruppe={selectedLerngruppe}
                                schueler={schueler}
                                headerData={headerData}
                                columns={columns}
                                schuelerColumnWidth={schuelerColumnWidth}
                                maps={{ schuelerGesamtNotenMap, schuelerHalbjahresNotenMap, schuelerKategorieNotenMap, schuelerLeistungsnachweisNotenMap }}
                            />
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

export default GesamtuebersichtPdfPreviewModal;