import React from 'react';
import { ColumnDef, EditModalItem, HeaderCell, Leistungsnachweis, Lerngruppe, Notenkategorie } from '../../../context/types';
import { EllipsisVerticalIcon } from '../../icons';
import { GewichtungBadge } from '../../ui/GewichtungBadge';

interface NotenGridHeaderProps {
    headerData: { rows: HeaderCell[][]; columnTemplate: string; };
    schuelerColumnWidth: number;
    selectedLerngruppe: Lerngruppe;
    isArchivedView: boolean;
    onHeaderClick: (event: React.MouseEvent<HTMLButtonElement>, type: 'kategorie' | 'leistungsnachweis', data: ColumnDef | Leistungsnachweis) => void;
    onEditHalbjahr: (item: EditModalItem, title: string) => void;
}

const gridRowHeights = [36, 36, 36, 52];

export const NotenGridHeader: React.FC<NotenGridHeaderProps> = ({
    headerData,
    schuelerColumnWidth,
    selectedLerngruppe,
    isArchivedView,
    onHeaderClick,
    onEditHalbjahr
}) => {
    return (
        <div className="sticky top-0 z-20 flex bg-[var(--color-ui-primary)] border-b border-[var(--color-border)]">
            <div 
                style={{ width: `${schuelerColumnWidth}px`, minWidth: `${schuelerColumnWidth}px` }} 
                className="sticky left-0 z-30 flex-shrink-0 bg-[var(--color-ui-primary)] flex items-center justify-center font-bold text-[var(--color-text-secondary)] border-r border-[var(--color-border)]"
            >
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
                        if (isSecondRowOrLower && !isTargetAvgHeader && !isCategoryAvgInLastRow) {
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
                                                onEditHalbjahr(
                                                    { id, name: `${halbjahr}. Halbjahr`, gewichtung: gewichtung ?? 1, _type: 'halbjahr' },
                                                    'Halbjahres-Gewichtung bearbeiten'
                                                );
                                            } else if (isLeistungsnachweisHeader) {
                                                onHeaderClick(e, 'leistungsnachweis', colDef!.data as Leistungsnachweis);
                                            } else {
                                                onHeaderClick(e, 'kategorie', colDef!);
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
    );
};