import React, { useMemo, useCallback } from 'react';
import { Schueler, ColumnDef, Notensystem, NoteMapEntry, ManuelleNoteModalContext, ManuelleNoteZiel } from '../../../context/types';
import { EyeIcon, ExclamationCircleIcon } from '../../icons';

interface NotenGridBodyProps {
    schuelerListe: Schueler[];
    columns: ColumnDef[];
    columnTemplate: string;
    schuelerColumnWidth: number;
    focusedSchuelerId: string | null;
    selectedLerngruppeId: string;
    notensystem: Notensystem | undefined;
    notenMaps: {
        leistungsnachweis: Map<string, NoteMapEntry>;
        kategorie: Map<string, NoteMapEntry>;
        halbjahr: Map<string, NoteMapEntry>;
        gesamt: Map<string, NoteMapEntry>;
    };
    isArchivedView: boolean;
    onToggleFocus: (id: string) => void;
    onOpenManuelleNote: (context: ManuelleNoteModalContext) => void;
}

const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
}

export const NotenGridBody: React.FC<NotenGridBodyProps> = ({
    schuelerListe,
    columns,
    columnTemplate,
    schuelerColumnWidth,
    focusedSchuelerId,
    selectedLerngruppeId,
    notensystem,
    notenMaps,
    isArchivedView,
    onToggleFocus,
    onOpenManuelleNote
}) => {
    const rowHeight = 48;

    const noteToPoints = useMemo(() => {
        const map = new Map<string, number>();
        if (notensystem) {
            notensystem.noten.forEach(n => map.set(n.displayValue, n.pointValue));
        }
        return map;
    }, [notensystem]);

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
        <div>
            {schuelerListe.map((schueler) => {
                const isFocused = focusedSchuelerId === schueler.id;
                const isAnyFocused = focusedSchuelerId !== null;
                const rowClasses = `flex transition-all duration-300 border-b border-[var(--color-border)] last:border-b-0 ${isAnyFocused && !isFocused ? 'relative blur-sm focus-overlay' : ''}`;

                return (
                    <div key={schueler.id} className={rowClasses}>
                        <div style={{ width: `${schuelerColumnWidth}px`, minWidth: `${schuelerColumnWidth}px`, height: `${rowHeight}px` }} className={`sticky left-0 z-10 flex-shrink-0 flex items-center space-x-3 px-2 py-1 bg-[var(--color-ui-primary)] border-r border-[var(--color-border)]`}>
                            <button onClick={() => onToggleFocus(schueler.id)} disabled={isAnyFocused && !isFocused} className="p-1 rounded-full transition-colors group disabled:cursor-not-allowed disabled:opacity-50" aria-label={`Fokus auf ${schueler.firstName} ${schueler.lastName} umschalten`}>
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
                        <div className="grid flex-grow bg-[var(--color-border)] gap-x-px" style={{ gridTemplateColumns: columnTemplate }}>
                            {columns.map((col) => {
                                let noteData: NoteMapEntry | undefined;
                                let isManuellUeberschrieben = false;

                                if (col.type === 'kategorie_avg') noteData = notenMaps.kategorie.get(`${schueler.id}-${col.id}`);
                                else if (col.type === 'halbjahr_avg') {
                                    noteData = notenMaps.halbjahr.get(`${schueler.id}-${col.id}`);
                                    isManuellUeberschrieben = !!noteData?.isManual;
                                } else if (col.type === 'gesamt_avg') {
                                    noteData = notenMaps.gesamt.get(`${schueler.id}-${col.id}`);
                                    isManuellUeberschrieben = !!noteData?.isManual;
                                } else if (col.type === 'leistungsnachweis') {
                                    noteData = notenMaps.leistungsnachweis.get(`${schueler.id}-${col.id}`);
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
                                                    if (ziel) {
                                                        onOpenManuelleNote({
                                                            schueler,
                                                            lerngruppeId: selectedLerngruppeId,
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
    );
};
