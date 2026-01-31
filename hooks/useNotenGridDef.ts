import { useMemo } from 'react';
import { ColumnDef, HeaderCell, Lerngruppe, Notenkategorie } from '../context/types';

export const useNotenGridDef = (columns: ColumnDef[], selectedLerngruppe: Lerngruppe | null) => {
    const headerData = useMemo(() => {
        const rows: HeaderCell[][] = [[], [], [], []];
        if (!selectedLerngruppe || columns.length <= 1) return { rows, totalGridColumns: 1, columnTemplate: '1fr' };
        
        const totalGridColumns = columns.length;
        let currentColumn = 1;

        // Zeile 1: Gesamtes Schuljahr Header
        rows[0].push({ id: 'gesamt_header', text: 'Gesamtes Schuljahr', style: { gridColumn: `1 / ${totalGridColumns + 1}`, gridRow: '1 / 2' }, className: 'text-base font-bold text-[var(--color-warning-text)]' });
        
        // Zeile 2: Gesamt Durchschnitt (spannt über Zeile 2-4)
        rows[1].push({ id: 'gesamt_avg_header_main', text: 'Gesamt', style: { gridColumn: '1 / 2', gridRow: '2 / 5' }, className: 'text-[var(--color-warning-text)]', colDef: columns[0] });
        currentColumn++;

        for (const halbjahr of [1, 2] as const) {
            const hjCols = columns.filter((c: ColumnDef) => c.halbjahr === halbjahr);
            if (hjCols.length > 0) {
                const hjStartIndex = currentColumn;
                const hjAvgColDef = hjCols.find((c: ColumnDef) => c.type === 'halbjahr_avg');
                const hjGewichtung = halbjahr === 1 ? selectedLerngruppe.gewichtungHj1 : selectedLerngruppe.gewichtungHj2;
                
                // Zeile 2: Halbjahres Header
                rows[1].push({ id: `h${halbjahr}`, text: `${halbjahr}. Halbjahr`, gewichtung: hjGewichtung, style: { gridColumn: `${hjStartIndex} / ${hjStartIndex + hjCols.length}`, gridRow: '2 / 3' }, colDef: hjAvgColDef, className: 'text-[var(--color-accent-text)]' });
                
                // Zeile 3: Halbjahres Durchschnitt (spannt über Zeile 3-4)
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
                        
                        // Zeile 3: Kategorie Header
                        rows[2].push({ id: `kat_${halbjahr}_${typ}`, text: katName, style: { gridColumn: `${katStartIndex} / ${katStartIndex + katCols.length}`, gridRow: '3 / 4' }, gewichtung: katGewichtung, colDef: katAvgColDef });
                        
                        // Zeile 4: Kategorie Durchschnitt
                        if (katAvgColDef) {
                            rows[3].push({ id: katAvgColDef.id, text: 'Ø', style: { gridColumn: `${currentColumn} / ${currentColumn + 1}`, gridRow: '4 / 5'}, colDef: katAvgColDef });
                            currentColumn++;
                        }
                        
                        // Zeile 4: Leistungsnachweise
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

    return { headerData };
};