import jsPDF from 'jspdf';
import { Leistungsnachweis, NoteMapEntry, Schueler, KlausuraufgabePunkte, SchuelerLeistungsnachweisFeedback, PREDEFINED_NOTENSYSTEME, Notensystem, NotenschluesselEintrag, ColumnDef, HeaderCell, EinzelLeistung, EinzelLeistungsNote, Lerngruppe } from '../context/types';

export interface AdjustmentValues {
    h1: number;
    h3: number;
    body: number;
    small: number;
    xsmall: number;
    note: number;
    margin: number;
    colGap: number;
    vSpaceHeader: number;
    vSpaceSection: number;
    vSpaceFooter: number;
}

interface GeneratePDFProps {
    leistungsnachweis: Leistungsnachweis;
    schuelerInSelectedLerngruppe: Schueler[];
    schuelerKlausurNotenMap: Map<string, NoteMapEntry & { totalPunkte: number; prozent: number; }>;
    klausuraufgabePunkte: KlausuraufgabePunkte[];
    schuelerLeistungsnachweisFeedback: SchuelerLeistungsnachweisFeedback[];
    klausurDaten: any; // Contains hauptnotenSpiegel, etc.
    includeNotenspiegel: boolean;
    notensystem: Notensystem;
}

export interface GesamtuebersichtPDFProps {
    lerngruppe: Lerngruppe;
    schueler: Schueler[];
    headerData: { rows: HeaderCell[][]; columnTemplate: string; };
    columns: ColumnDef[];
    schuelerColumnWidth: number;
    maps: {
        schuelerGesamtNotenMap: Map<string, NoteMapEntry>;
        schuelerHalbjahresNotenMap: Map<string, NoteMapEntry>;
        schuelerKategorieNotenMap: Map<string, NoteMapEntry>;
        schuelerLeistungsnachweisNotenMap: Map<string, NoteMapEntry>;
    };
}


const COLORS = {
    textPrimary: '#1f2937',
    textSecondary: '#6b7280',
    accent: '#0891b2',
    borderLight: '#d1d5db',
    borderDark: '#e5e7eb',
    bgLight: '#f9fafb',
    white: '#ffffff',
    warning: '#f59e0b',
    danger: '#dc2626',
};

function drawJustifiedText(pdf: jsPDF, text: string, x: number, y: number, maxWidth: number) {
    const fontSize = pdf.getFontSize();
    const lineHeight = fontSize * 0.352778 * 1.35;

    const paragraphs = text.split('\n');
    let currentY = y;

    for (const paragraph of paragraphs) {
        if (paragraph.trim() === '') {
            currentY += lineHeight;
            continue;
        }

        const lines = pdf.splitTextToSize(paragraph, maxWidth);

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            pdf.text(line, x, currentY);
            currentY += lineHeight;
        }
    }
}

const drawNotenspiegelTable = (pdf: jsPDF, klausurDaten: any, notensystem: Notensystem, x: number, y: number, width: number): number => {
    const FONT_SIZES = { body: 9.6, xsmall: 8 };
    if (notensystem.id === 'punkte_15_0') {
        const { punkteSpiegel } = klausurDaten;
        if (!punkteSpiegel) return y;
        
        const punkte = Array.from({length: 16}, (_, i) => 15 - i);
        const cellWidth = width / 16;
        
        pdf.setDrawColor(COLORS.borderLight);
        pdf.setFontSize(FONT_SIZES.xsmall);

        // Header
        pdf.setFillColor(COLORS.bgLight);
        pdf.rect(x, y, width, 6, 'FD');
        punkte.forEach((p, i) => {
            pdf.text(String(p), x + i * cellWidth + cellWidth / 2, y + 4, { align: 'center' });
            if (i < 15) pdf.line(x + (i + 1) * cellWidth, y, x + (i + 1) * cellWidth, y + 12);
        });

        // Body
        punkte.forEach((p, i) => {
            pdf.text(String(punkteSpiegel.get(p) || 0), x + i * cellWidth + cellWidth / 2, y + 10, { align: 'center' });
        });
        pdf.line(x, y + 6, x + width, y + 6);
        pdf.rect(x, y, width, 12, 'S');
        return y + 12;

    } else { // 1-6 Notensystem
        const { hauptnotenSpiegel } = klausurDaten;
        if (!hauptnotenSpiegel) return y;

        const noten = [1, 2, 3, 4, 5, 6];
        const cellWidth = width / 6;

        pdf.setDrawColor(COLORS.borderLight);
        pdf.setFontSize(FONT_SIZES.body);
             
        // Header
        pdf.setFillColor(COLORS.bgLight);
        pdf.rect(x, y, width, 6, 'FD');
        noten.forEach((note, i) => {
            pdf.text(String(note), x + i * cellWidth + cellWidth/2, y + 4, {align: 'center'});
            if (i < 5) pdf.line(x + (i + 1) * cellWidth, y, x + (i + 1) * cellWidth, y + 12);
        });
        // Body
        noten.forEach((note, i) => {
            pdf.text(String(hauptnotenSpiegel.get(note) || 0), x + i * cellWidth + cellWidth/2, y + 10, {align: 'center'});
        });
        pdf.line(x, y + 6, x + width, y + 6);
        pdf.rect(x, y, width, 12, 'S');
        return y + 12;
    }
};

const drawSignatureLine = (pdf: jsPDF, x: number, y: number, width: number): number => {
    const FONT_SIZES = { xsmall: 8.4 };
    const gap = 10;
    const boxWidth = (width - gap) / 2;

    pdf.setFontSize(FONT_SIZES.xsmall);
    pdf.setTextColor(COLORS.textSecondary);
    pdf.setLineDashPattern([1, 1], 0);

    // Lehrkraft
    const x1_lehrkraft = x;
    pdf.line(x1_lehrkraft, y, x1_lehrkraft + boxWidth, y);
    pdf.text('Lehrkraft', x1_lehrkraft + boxWidth / 2, y + 3, { align: 'center' });

    // Erziehungsberechtigte(r)
    const x1_erz = x + boxWidth + gap;
    pdf.line(x1_erz, y, x1_erz + boxWidth, y);
    pdf.text('Erziehungsberechtigte(r)', x1_erz + boxWidth / 2, y + 3, { align: 'center' });

    pdf.setLineDashPattern([], 0);
    return y + 5;
};


const drawReport = (pdf: jsPDF, props: any, x: number, y: number, width: number, height: number) => {
    const { schueler, leistungsnachweis, noteData, aufgabenDetails, feedback, klausurDaten, includeNotenspiegel, notensystem } = props;

    const FONT_SIZES = { h1: 12, h3: 10.5, body: 9.6, small: 9, xsmall: 8.4, note: 36 };
    const margin = 5;
    const colGap = 9;
    const vSpaceHeader = 5.5;
    const vSpaceSection = 6;
    const vSpaceFooter = 13;

    pdf.setDrawColor(COLORS.borderDark);
    pdf.rect(x, y, width, height);
    
    const innerX = x + margin;
    const innerY = y + 2.5;
    const innerWidth = width - (margin * 2);
    
    let currentY = innerY;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(FONT_SIZES.h1);
    pdf.setTextColor(COLORS.textPrimary);
    pdf.text(`${schueler.firstName} ${schueler.lastName}, ${leistungsnachweis.name}`, innerX, currentY + 4);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(FONT_SIZES.xsmall);
    pdf.setTextColor(COLORS.textSecondary);
    pdf.text(`Datum: ${new Date().toLocaleDateString('de-DE')}`, x + width - margin, currentY + 4, { align: 'right' });
    
    currentY += 8;
    pdf.setDrawColor(COLORS.borderLight);
    pdf.line(innerX, currentY, innerX + innerWidth, currentY);
    currentY += vSpaceHeader;

    const leftColWidth = (innerWidth - colGap) * 0.45;
    const rightColWidth = (innerWidth - colGap) * 0.55;
    const rightColX = innerX + leftColWidth + colGap;

    // --- LEFT COLUMN (ALWAYS VISIBLE) ---
    let leftColY = currentY;
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(FONT_SIZES.h3);
    pdf.setTextColor(COLORS.accent);
    pdf.text('Gesamtergebnis', innerX, leftColY);
    leftColY += 4;
    
    pdf.setFillColor(COLORS.bgLight);
    pdf.setDrawColor(COLORS.borderDark);
    pdf.roundedRect(innerX, leftColY, leftColWidth, 25, 3, 3, 'FD');
    
    pdf.setFontSize(FONT_SIZES.note);
    pdf.setTextColor(COLORS.accent);
    pdf.text(noteData.finalGrade, innerX + leftColWidth / 2, leftColY + 13, { align: 'center' });
    
    const maxPunkteGesamt = leistungsnachweis.aufgaben?.reduce((sum: number, a: any) => sum + a.maxPunkte, 0) || 0;
    pdf.setFontSize(FONT_SIZES.h3);
    pdf.setTextColor(COLORS.textSecondary);
    pdf.text(`${noteData.totalPunkte.toLocaleString('de-DE')} / ${maxPunkteGesamt} P. (${noteData.prozent.toFixed(1).replace('.', ',')}%)`, innerX + leftColWidth / 2, leftColY + 20, { align: 'center' });
    
    leftColY += 25 + vSpaceSection;

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(FONT_SIZES.h3);
    pdf.setTextColor(COLORS.accent);
    pdf.text('Aufgabenergebnisse', innerX, leftColY);
    leftColY += 7;

    pdf.setFont('helvetica', 'normal');
    const aufgabenFontSize = aufgabenDetails.length > 9 ? FONT_SIZES.xsmall : FONT_SIZES.body;
    pdf.setFontSize(aufgabenFontSize);
    aufgabenDetails.forEach((aufgabe: { name: string; erreichtePunkte: number; maxPunkte: number; }, index: number) => {
        pdf.setTextColor(COLORS.textSecondary);
        const aufgabeNameLines = pdf.splitTextToSize(aufgabe.name, leftColWidth - 30);
        
        const entryHeight = (aufgabeNameLines.length * aufgabenFontSize * 0.4) + 1;
        const rectTopY = leftColY - (entryHeight * 0.8);

        if (index % 2 === 0) {
            pdf.setFillColor(249, 250, 251); // RGB for #f9fafb
            pdf.rect(innerX - 2, rectTopY, leftColWidth + 4, entryHeight, 'F');
        }

        pdf.text(aufgabeNameLines, innerX, leftColY);
        
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(COLORS.textPrimary);
        pdf.text(`${aufgabe.erreichtePunkte.toLocaleString('de-DE')} / ${aufgabe.maxPunkte} P.`, innerX + leftColWidth, leftColY, { align: 'right' });
        
        leftColY += entryHeight;
        pdf.setFont('helvetica', 'normal');
    });

    // --- DYNAMIC RIGHT CONTENT & FOOTER ---
    const hasFeedback = feedback && feedback.trim() && feedback.trim() !== '---';

    if (hasFeedback) {
        // --- RIGHT COLUMN: FEEDBACK ---
        let rightColY = currentY;
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(FONT_SIZES.h3);
        pdf.setTextColor(COLORS.accent);
        pdf.text('Feedback', rightColX, rightColY);
        rightColY += 4;
        
        pdf.setFillColor(COLORS.bgLight);
        pdf.setDrawColor(COLORS.borderDark);
        const feedbackHeight = y + height - rightColY - margin - 25;
        pdf.roundedRect(rightColX, rightColY, rightColWidth, feedbackHeight, 3, 3, 'FD');
        
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(FONT_SIZES.small);
        pdf.setTextColor(COLORS.textSecondary);
        drawJustifiedText(pdf, feedback, rightColX + 3, rightColY + 4, rightColWidth - 6);
        
        // --- FOOTER (WITH FEEDBACK LAYOUT) ---
        const footerY = y + height - margin - vSpaceFooter;
        
        if (includeNotenspiegel) {
            const tableWidth = leftColWidth;
            let nsY = footerY;
            if(notensystem.id === 'punkte_15_0'){
                 nsY -= 5;
            }

            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(FONT_SIZES.h3);
            pdf.setTextColor(COLORS.accent);
            pdf.text('Notenspiegel', innerX, nsY);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(COLORS.textPrimary);
            pdf.text(`(Ø: ${klausurDaten.notendurchschnittDezimal.replace('.', ',')})`, innerX + 28, nsY);
            nsY += 4;
            drawNotenspiegelTable(pdf, klausurDaten, notensystem, innerX, nsY, tableWidth);
        }

        drawSignatureLine(pdf, rightColX, footerY + 10, rightColWidth);

    } else {
        // --- RIGHT COLUMN: NOTENSPIEGEL & SIGNATURE (NO FEEDBACK LAYOUT) ---
        let rightColY = currentY;
        let signatureY: number;

        if (includeNotenspiegel) {
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(FONT_SIZES.h3);
            pdf.setTextColor(COLORS.accent);
            pdf.text('Notenspiegel', rightColX, rightColY);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(COLORS.textPrimary);
            pdf.text(`(Ø: ${klausurDaten.notendurchschnittDezimal.replace('.', ',')})`, rightColX + 28, rightColY);
            rightColY += 4;
            
            const tableBottomY = drawNotenspiegelTable(pdf, klausurDaten, notensystem, rightColX, rightColY, rightColWidth);
            signatureY = tableBottomY + 10;
        } else {
            signatureY = y + height - margin - vSpaceFooter - 5;
        }
        
        drawSignatureLine(pdf, rightColX, signatureY, rightColWidth);
    }
};

export const generateSchuelerBerichtePDF = async (props: GeneratePDFProps) => {
    const {
        leistungsnachweis,
        schuelerInSelectedLerngruppe,
        schuelerKlausurNotenMap,
        klausuraufgabePunkte,
        schuelerLeistungsnachweisFeedback,
        klausurDaten,
        includeNotenspiegel,
        notensystem,
    } = props;
    
    const teilnehmendeSchueler = schuelerInSelectedLerngruppe.filter(s => schuelerKlausurNotenMap.has(s.id))
        .sort((a,b) => a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName));

    const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
    });
    
    const pageMargin = 15;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    const reportWidth = pageWidth - 2 * pageMargin;
    const reportHeight = reportWidth * (420 / 550);
    
    const reportsPerPage = 2;
    const totalContentHeight = (reportsPerPage * reportHeight);
    const spacing = (pageHeight - totalContentHeight) / (reportsPerPage + 1);
    
    let yPos = spacing;
    let schuelerCount = 0;

    for (const schueler of teilnehmendeSchueler) {
        if (schuelerCount > 0 && schuelerCount % reportsPerPage === 0) {
            pdf.addPage();
            yPos = spacing;
        }

        const noteData = schuelerKlausurNotenMap.get(schueler.id);
        if (!noteData) continue;

        const aufgabenDetails = (leistungsnachweis.aufgaben || []).map(aufgabe => {
            const punkteEintrag = klausuraufgabePunkte.find(p => p.schuelerId === schueler.id && p.aufgabeId === aufgabe.id);
            return {
                id: aufgabe.id,
                name: aufgabe.name,
                erreichtePunkte: punkteEintrag?.punkte ?? 0,
                maxPunkte: aufgabe.maxPunkte,
            };
        });

        const feedbackRecord = schuelerLeistungsnachweisFeedback.find(f => f.schuelerId === schueler.id && f.leistungsnachweisId === leistungsnachweis.id);
        
        const reportProps = {
            schueler,
            leistungsnachweis,
            noteData,
            aufgabenDetails,
            feedback: feedbackRecord?.feedbackText || '',
            klausurDaten,
            includeNotenspiegel,
            notensystem,
        };
        
        drawReport(pdf, reportProps, pageMargin, yPos, reportWidth, reportHeight);
        
        if (schuelerCount % reportsPerPage < reportsPerPage - 1 && schuelerCount < teilnehmendeSchueler.length - 1) {
             const lineY = yPos + reportHeight + (spacing / 2);
             pdf.setDrawColor(COLORS.textSecondary);
             pdf.setLineDashPattern([2, 2], 0);
             pdf.line(pageMargin / 2, lineY, pageWidth - (pageMargin / 2), lineY);
             pdf.setLineDashPattern([], 0);
        }
        
        yPos += reportHeight + spacing;
        schuelerCount++;
    }

    const date = new Date();
    const dateString = `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
    pdf.save(`Einzelberichte-${leistungsnachweis.name}-${dateString}.pdf`);
};

const drawPageNumber = (pdf: jsPDF) => {
    const pageCount = pdf.internal.getNumberOfPages();
    pdf.setFontSize(8);
    pdf.setTextColor(COLORS.textSecondary);
    for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.text(
            `Seite ${i} von ${pageCount}`,
            pdf.internal.pageSize.getWidth() / 2,
            pdf.internal.pageSize.getHeight() - 10,
            { align: 'center' }
        );
    }
};

export const generateGesamtuebersichtPDF = async (props: GesamtuebersichtPDFProps) => {
    const { lerngruppe, schueler, headerData, columns, schuelerColumnWidth, maps } = props;
    if (!lerngruppe || schueler.length === 0) return;

    const pdf = new jsPDF({ orientation: 'l', unit: 'mm', format: 'a4' });
    const pageMargin = 15;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const contentWidth = pageWidth - 2 * pageMargin;
    let yPos = pageMargin;

    // Title and Date
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.setTextColor(COLORS.textPrimary);
    pdf.text('Notenübersicht', pageMargin, yPos);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(12);
    pdf.setTextColor(COLORS.textSecondary);
    yPos += 7;
    pdf.text(`${lerngruppe.name}, ${lerngruppe.fach} (${lerngruppe.schuljahr})`, pageMargin, yPos);
    
    const dateString = new Date().toLocaleDateString('de-DE');
    pdf.setFontSize(10);
    pdf.text(dateString, pageWidth - pageMargin, yPos, { align: 'right' });
    yPos += 15;

    const colWidthsFromTemplate = headerData.columnTemplate.split(' ').map(val => parseFloat(val));
    const totalRelativeWidth = schuelerColumnWidth + colWidthsFromTemplate.reduce((sum, w) => sum + w, 0);
    const scaleFactor = contentWidth / totalRelativeWidth;

    const schuelerColWidthMm = schuelerColumnWidth * scaleFactor;
    const dataColWidthsMm = colWidthsFromTemplate.map(w => w * scaleFactor);
    
    const tableWidth = schuelerColWidthMm + dataColWidthsMm.reduce((sum, w) => sum + w, 0);

    const headerRowHeights = [8, 8, 8, 12];
    const totalHeaderHeight = headerRowHeights.reduce((sum, h) => sum + h, 0);

    const drawHeader = (startY: number) => {
        pdf.setDrawColor(COLORS.borderLight);
        pdf.setFont('helvetica', 'bold');
        
        // --- Schüler Column ---
        pdf.setFillColor(COLORS.bgLight);
        pdf.rect(pageMargin, startY, schuelerColWidthMm, totalHeaderHeight, 'FD');
        pdf.setTextColor(COLORS.textSecondary);
        pdf.setFontSize(10);
        pdf.text('SchülerIn', pageMargin + 5, startY + totalHeaderHeight / 2, { baseline: 'middle' });

        // --- Data Columns ---
        const gridStartX = pageMargin + schuelerColWidthMm;

        headerData.rows.flat().forEach(cell => {
            // FIX: The `gridColumn` and `gridRow` properties are of type `string | number`.
            // Convert them to a string before calling `.match()` to avoid a type error.
            const gridColMatch = String(cell.style.gridColumn)?.match(/(\d+)\s*\/\s*(\d+)/);
            const gridRowMatch = String(cell.style.gridRow)?.match(/(\d+)\s*\/\s*(\d+)/);

            if (!gridColMatch || !gridRowMatch) return;

            const startCol = parseInt(gridColMatch[1], 10) - 1;
            const endCol = parseInt(gridColMatch[2], 10) - 1;
            const startRow = parseInt(gridRowMatch[1], 10) - 1;
            const endRow = parseInt(gridRowMatch[2], 10) - 1;

            const cellX = gridStartX + dataColWidthsMm.slice(0, startCol).reduce((a, b) => a + b, 0);
            const cellY = startY + headerRowHeights.slice(0, startRow).reduce((a, b) => a + b, 0);
            const cellWidth = dataColWidthsMm.slice(startCol, endCol).reduce((a, b) => a + b, 0);
            const cellHeight = headerRowHeights.slice(startRow, endRow).reduce((a, b) => a + b, 0);
            
            pdf.setFillColor(COLORS.bgLight);
            pdf.rect(cellX, cellY, cellWidth, cellHeight, 'FD');

            let textColor = COLORS.textPrimary;
            if(cell.className?.includes('warning')) textColor = COLORS.warning;
            else if(cell.className?.includes('accent')) textColor = COLORS.accent;
            else if(cell.colDef?.type === 'gesamt_avg') textColor = COLORS.warning;
            else if (cell.colDef?.type === 'kategorie_avg') textColor = COLORS.accent;
            
            pdf.setTextColor(textColor);
            pdf.setFontSize(9);
            
            const text = `${cell.text}${cell.gewichtung !== undefined ? ` (x${cell.gewichtung})` : ''}`;
            pdf.text(text, cellX + cellWidth / 2, cellY + cellHeight / 2, { align: 'center', baseline: 'middle', maxWidth: cellWidth - 2 });
        });
        
        return startY + totalHeaderHeight;
    };
    
    yPos = drawHeader(yPos);

    const rowHeight = 10;
    schueler.forEach((s, index) => {
        if (yPos + rowHeight > pageHeight - pageMargin - 5) {
            pdf.addPage();
            yPos = pageMargin;
            yPos = drawHeader(yPos);
        }

        if (index % 2 === 0) {
            pdf.setFillColor(COLORS.bgLight);
            pdf.rect(pageMargin, yPos, tableWidth, rowHeight, 'F');
        }

        pdf.setDrawColor(COLORS.borderLight);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(COLORS.textPrimary);
        
        let currentCellX = pageMargin;
        pdf.rect(currentCellX, yPos, schuelerColWidthMm, rowHeight, 'S');
        pdf.text(`${s.lastName}, ${s.firstName}`, currentCellX + 2, yPos + rowHeight / 2, { maxWidth: schuelerColWidthMm - 4, ellipsize: true, baseline: 'middle' });
        currentCellX += schuelerColWidthMm;

        columns.forEach((col, colIndex) => {
            let noteData: NoteMapEntry | undefined;
            if (col.type === 'gesamt_avg') noteData = maps.schuelerGesamtNotenMap.get(`${s.id}-${col.id}`);
            else if (col.type === 'halbjahr_avg') noteData = maps.schuelerHalbjahresNotenMap.get(`${s.id}-${col.id}`);
            else if (col.type === 'kategorie_avg') noteData = maps.schuelerKategorieNotenMap.get(`${s.id}-${col.id}`);
            else if (col.type === 'leistungsnachweis') noteData = maps.schuelerLeistungsnachweisNotenMap.get(`${s.id}-${col.id}`);
            
            const cellWidth = dataColWidthsMm[colIndex];
            pdf.rect(currentCellX, yPos, cellWidth, rowHeight, 'S');
            pdf.text(noteData?.finalGrade || '-', currentCellX + cellWidth / 2, yPos + rowHeight / 2, { align: 'center', baseline: 'middle' });
            currentCellX += cellWidth;
        });
        
        yPos += rowHeight;
    });

    drawPageNumber(pdf);
    pdf.save(`Gesamtuebersicht-${lerngruppe.name}-${dateString}.pdf`);
};

export const generateSammelnotePDF = async (props: {
    leistungsnachweis: Leistungsnachweis;
    lerngruppe: Lerngruppe;
    schueler: Schueler[];
    einzelLeistungen: EinzelLeistung[];
    notenMap: Map<string, EinzelLeistungsNote>;
    schuelerGesamtNotenMap: Map<string, NoteMapEntry>;
}) => {
    const { leistungsnachweis, lerngruppe, schueler, einzelLeistungen, notenMap, schuelerGesamtNotenMap } = props;
    if (!leistungsnachweis || !lerngruppe || !schueler.length) return;

    const pdf = new jsPDF({ orientation: 'l', unit: 'mm', format: 'a4' });
    const pageMargin = 15;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const contentWidth = pageWidth - 2 * pageMargin;
    let yPos = pageMargin;

    // Title and Date
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.setTextColor(COLORS.textPrimary);
    pdf.text(leistungsnachweis.name, pageMargin, yPos);

    const dateString = new Date().toLocaleDateString('de-DE');
    pdf.setFontSize(10);
    pdf.setTextColor(COLORS.textSecondary);
    pdf.text(dateString, pageWidth - pageMargin, yPos, { align: 'right' });
    
    yPos += 7;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(12);
    pdf.setTextColor(COLORS.textSecondary);
    pdf.text(`${lerngruppe.name}, ${lerngruppe.fach}`, pageMargin, yPos);
    yPos += 15;

    // Helper function for manual truncation
    const truncateText = (text: string, maxWidth: number) => {
        if (pdf.getTextDimensions(text).w <= maxWidth) {
            return text;
        }
        let truncated = text;
        while (pdf.getTextDimensions(truncated + '...').w > maxWidth && truncated.length > 0) {
            truncated = truncated.slice(0, -1);
        }
        return truncated + '...';
    };

    // Column Width Calculation
    pdf.setFontSize(9);
    const longestNameWidth = Math.max(0, ...schueler.map((s: Schueler) => pdf.getTextDimensions(`${s.lastName}, ${s.firstName}`).w));
    const schuelerColWidth = Math.min(80, Math.max(50, longestNameWidth + 8));
    
    const gesamtColWidth = 25;
    const maxElColWidth = 35;
    const restWidth = contentWidth - schuelerColWidth - gesamtColWidth;
    const elColWidth = einzelLeistungen.length > 0 ? Math.min(maxElColWidth, restWidth / einzelLeistungen.length) : 0;
    const tableWidth = schuelerColWidth + gesamtColWidth + elColWidth * einzelLeistungen.length;

    const rowHeight = 10;
    const headerHeight = 16;

    const drawHeader = (currentY: number) => {
        pdf.setFillColor(COLORS.bgLight);
        pdf.rect(pageMargin, currentY, tableWidth, headerHeight, 'F');
        pdf.setDrawColor(COLORS.borderLight);
        pdf.line(pageMargin, currentY + headerHeight, pageMargin + tableWidth, currentY + headerHeight);

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(COLORS.textPrimary);

        let currentX = pageMargin;
        pdf.text('SchülerIn', currentX + 2, currentY + headerHeight / 2, { baseline: 'middle'});
        currentX += schuelerColWidth;
        pdf.line(currentX, currentY, currentX, currentY + headerHeight);

        pdf.text('Gesamt Ø', currentX + gesamtColWidth / 2, currentY + headerHeight / 2, { align: 'center', baseline: 'middle' });
        currentX += gesamtColWidth;
        pdf.line(currentX, currentY, currentX, currentY + headerHeight);

        einzelLeistungen.forEach((el: EinzelLeistung) => {
            pdf.setFontSize(10);
            pdf.setTextColor(COLORS.textPrimary);
            
            // Manual truncation logic
            const truncatedName = truncateText(el.name, elColWidth - 4);
            pdf.text(truncatedName, currentX + elColWidth / 2, currentY + 7, { align: 'center' });
            
            pdf.setFontSize(8);
            pdf.setTextColor(COLORS.textSecondary);
            pdf.text(`(x${el.gewichtung})`, currentX + elColWidth / 2, currentY + 13, { align: 'center' });

            currentX += elColWidth;
            pdf.line(currentX, currentY, currentX, currentY + headerHeight);
        });

        return currentY + headerHeight;
    };

    yPos = drawHeader(yPos);
    
    schueler.forEach((s: Schueler, index: number) => {
        if (yPos + rowHeight > pageHeight - pageMargin - 5) {
            pdf.addPage();
            yPos = pageMargin;
            yPos = drawHeader(yPos);
        }

        if (index % 2 === 0) { // Apply zebra stripe
            pdf.setFillColor(COLORS.bgLight);
            pdf.rect(pageMargin, yPos, tableWidth, rowHeight, 'F');
        }

        pdf.setDrawColor(COLORS.borderLight);
        
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(COLORS.textPrimary);
        
        let currentX = pageMargin;
        pdf.text(`${s.lastName}, ${s.firstName}`, currentX + 2, yPos + rowHeight / 2, { maxWidth: schuelerColWidth - 4, ellipsize: true, baseline: 'middle' });
        currentX += schuelerColWidth;
        pdf.line(currentX, yPos, currentX, yPos + rowHeight);

        const gesamtNote = schuelerGesamtNotenMap.get(s.id);
        pdf.setFont('helvetica', 'bold');
        pdf.text(gesamtNote?.finalGrade || '-', currentX + gesamtColWidth / 2, yPos + rowHeight / 2, { align: 'center', baseline: 'middle' });
        currentX += gesamtColWidth;
        pdf.line(currentX, yPos, currentX, yPos + rowHeight);
        pdf.setFont('helvetica', 'normal');

        einzelLeistungen.forEach((el: EinzelLeistung) => {
            const note = notenMap.get(`${s.id}-${el.id}`)?.note;
            pdf.text(note || '-', currentX + elColWidth / 2, yPos + rowHeight / 2, { align: 'center', baseline: 'middle' });
            currentX += elColWidth;
            pdf.line(currentX, yPos, currentX, yPos + rowHeight);
        });
        
        yPos += rowHeight;
    });
    
    drawPageNumber(pdf);
    pdf.save(`Sammelnote-${leistungsnachweis.name}-${new Date().toLocaleDateString('de-DE')}.pdf`);
};
