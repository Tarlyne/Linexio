import React, { useMemo } from 'react';
import { ColumnDef, HeaderCell, Lerngruppe, NoteMapEntry, Schueler } from '../../context/types';
import { useNotenContext } from '../../context/NotenContext';

interface LayoutProps {
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

const getInitials = (firstName: string, lastName: string) => `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();

const GewichtungBadge: React.FC<{ gewichtung?: number }> = ({ gewichtung }) => {
    if (gewichtung === undefined) return null;
    return (
        <span style={{
            position: 'relative', marginLeft: '4px', backgroundColor: '#e5e7eb', color: '#4b5563',
            width: '18px', height: '18px', borderRadius: '9999px', display: 'inline-flex',
            alignItems: 'center', justifyContent: 'center', flexShrink: 0, verticalAlign: 'middle'
        }}>
            <span style={{ fontSize: '11px', fontWeight: '600' }}>
                {gewichtung}
            </span>
        </span>
    );
};

const GesamtuebersichtPDFLayout: React.FC<LayoutProps> = ({ lerngruppe, schueler, headerData, columns, schuelerColumnWidth, maps }) => {
    const { notensystemForLerngruppe } = useNotenContext();
    
    const noteToPoints = useMemo(() => {
        const map = new Map<string, number>();
        if (notensystemForLerngruppe) {
            notensystemForLerngruppe.noten.forEach(n => map.set(n.displayValue, n.pointValue));
        }
        return map;
    }, [notensystemForLerngruppe]);

    const headerHeight = 160;
    const rowHeight = 48;
    
    return (
        <div style={{ fontFamily: 'sans-serif', backgroundColor: 'white', color: '#1f2937' }}>
            <div style={{ position: 'relative', display: 'inline-block', verticalAlign: 'middle', border: '1px solid #d1d5db', borderRadius: '0.5rem', overflow: 'hidden' }}>
                {/* Header */}
                <div style={{ zIndex: 20, display: 'flex' }}>
                    <div style={{ width: `${schuelerColumnWidth}px`, minWidth: `${schuelerColumnWidth}px`, height: `${headerHeight}px`, flexShrink: 0, backgroundColor: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#6b7280', borderRight: '1px solid #d1d5db' }}>
                        SchülerIn
                    </div>
                    <div style={{ display: 'grid', flexGrow: 1, gridTemplateColumns: headerData.columnTemplate, gridTemplateRows: '36px 36px 36px 52px' }}>
                        {headerData.rows.flat().map(cell => {
                            const { colDef } = cell;
                            let textColor = '#4b5563';
                            if (colDef?.type === 'gesamt_avg') textColor = '#f59e0b';
                            else if (colDef?.type === 'kategorie_avg') textColor = '#0891b2';

                            const cellStyle: React.CSSProperties = {
                                ...cell.style,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                padding: '4px', border: '1px solid #d1d5db',
                                borderTop: 'none', borderRight: 'none',
                                fontWeight: '600', color: textColor,
                                fontSize: '12px', backgroundColor: '#f9fafb'
                            };
                            return (
                                <div key={cell.id} style={cellStyle}>
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cell.text}</span>
                                    {cell.gewichtung !== undefined && <GewichtungBadge gewichtung={cell.gewichtung} />}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Body */}
                <div>
                    {schueler.map((s, index) => {
                        const rowStyle: React.CSSProperties = {
                            display: 'flex',
                            borderTop: '1px solid #d1d5db',
                            backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb',
                        };
                        return (
                            <div key={s.id} style={rowStyle}>
                                <div style={{ width: `${schuelerColumnWidth}px`, minWidth: `${schuelerColumnWidth}px`, height: `${rowHeight}px`, flexShrink: 0, display: 'flex', alignItems: 'center', gap: '12px', padding: '4px 8px', borderRight: '1px solid #d1d5db' }}>
                                    <div style={{ width: '32px', height: '32px', backgroundColor: '#dbeafe', color: '#1e40af', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '12px', flexShrink: 0 }}>
                                        {getInitials(s.firstName, s.lastName)}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: '600', color: '#1f2937', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.lastName},</div>
                                        <div style={{ fontSize: '14px', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.firstName}</div>
                                    </div>
                                </div>
                                <div style={{ display: 'grid', flexGrow: 1, gridTemplateColumns: headerData.columnTemplate }}>
                                    {columns.map(col => {
                                        let noteData: NoteMapEntry | undefined;
                                        if (col.type === 'gesamt_avg') noteData = maps.schuelerGesamtNotenMap.get(`${s.id}-${col.id}`);
                                        else if (col.type === 'halbjahr_avg') noteData = maps.schuelerHalbjahresNotenMap.get(`${s.id}-${col.id}`);
                                        else if (col.type === 'kategorie_avg') noteData = maps.schuelerKategorieNotenMap.get(`${s.id}-${col.id}`);
                                        else if (col.type === 'leistungsnachweis') noteData = maps.schuelerLeistungsnachweisNotenMap.get(`${s.id}-${col.id}`);
                                        
                                        const pointValue = noteData ? noteToPoints.get(noteData.finalGrade) : undefined;
                                        const isBadGrade = typeof pointValue === 'number' && pointValue <= 3;
                                        const noteColor = isBadGrade ? '#dc2626' : '#1f2937';

                                        let borderColor = 'transparent';
                                        if (col.type === 'kategorie_avg') borderColor = '#3b82f6';
                                        if (col.type === 'gesamt_avg') borderColor = '#f59e0b';


                                        return (
                                            <div key={col.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', borderLeft: '1px solid #d1d5db' }}>
                                                <div style={{ height: '40px', width: col.type === 'gesamt_avg' ? '64px' : '50px', borderRadius: '6px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6', border: `1px solid ${borderColor}` }}>
                                                    {noteData && (
                                                        <>
                                                            <span style={{ fontSize: '18px', lineHeight: 1, color: noteColor, fontWeight: '500' }}>{noteData.finalGrade}</span>
                                                            {noteData.displayDecimal && <span style={{ fontSize: '9px', color: '#6b7280', lineHeight: 1 }}>{noteData.displayDecimal}</span>}
                                                        </>
                                                    )}
                                                </div>
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
    );
};

export default GesamtuebersichtPDFLayout;