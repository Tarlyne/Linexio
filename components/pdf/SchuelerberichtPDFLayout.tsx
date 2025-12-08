import React from 'react';
import { Schueler, Leistungsnachweis, NoteMapEntry, Notensystem } from '../../context/types';

interface SchuelerberichtPDFLayoutProps {
    schueler: Schueler;
    leistungsnachweis: Leistungsnachweis;
    noteData: NoteMapEntry & { totalPunkte?: number; prozent?: number; };
    aufgabenDetails: { id: string; name: string; erreichtePunkte: number; maxPunkte: number; }[];
    sammelnoteDetails?: { name: string; note: string; weighting: number }[];
    feedback: string;
    klausurDaten: any; // Simplified
    includeNotenspiegel: boolean;
    showSignatures?: boolean;
    notensystem: Notensystem;
    scale?: number;
}

interface SimpleNotenspiegelTableProps {
    klausurDaten: any;
    notensystem: Notensystem;
    scale: number;
}

const SimpleNotenspiegelTable: React.FC<SimpleNotenspiegelTableProps> = ({ klausurDaten, notensystem, scale }) => {
    if (!klausurDaten) return null;
    const { notendurchschnittDezimal } = klausurDaten;

    let tableContent;

    if (notensystem.id === 'punkte_15_0') {
        const { punkteSpiegel } = klausurDaten;
        if (!punkteSpiegel) return null;
        const punkte = Array.from({ length: 16 }, (_, i) => 15 - i);
        
        const headerStyle: React.CSSProperties = { boxSizing: 'border-box', border: '1px solid #d1d5db', padding: `${4 * scale}px ${2*scale}px`, textAlign: 'center', fontWeight: '600', backgroundColor: '#f9fafb', color: '#1f2937', fontSize: `${0.65 * scale}rem`, width: '6.25%' };
        const cellStyle: React.CSSProperties = { boxSizing: 'border-box', border: '1px solid #d1d5db', padding: `${4 * scale}px ${2*scale}px`, textAlign: 'center', fontWeight: '500', color: '#1f2937', fontSize: `${0.65 * scale}rem`, width: '6.25%' };
        
        tableContent = (
            <>
                <thead>
                    <tr>
                        {punkte.map(p => ( <th key={p} style={headerStyle}>{p}</th> ))}
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        {punkte.map(p => ( <td key={p} style={cellStyle}>{punkteSpiegel.get(p) || 0}</td> ))}
                    </tr>
                </tbody>
            </>
        );
    } else {
        const { hauptnotenSpiegel } = klausurDaten;
        if (!hauptnotenSpiegel) return null;
        const noten = [1, 2, 3, 4, 5, 6];
        
        const headerStyle: React.CSSProperties = { boxSizing: 'border-box', border: '1px solid #d1d5db', padding: `${7*scale}px ${4*scale}px`, textAlign: 'center', fontWeight: '600', backgroundColor: '#f9fafb', color: '#1f2937', fontSize: `${0.8 * scale}rem`, width: '16.66%' };
        const cellStyle: React.CSSProperties = { boxSizing: 'border-box', border: '1px solid #d1d5db', padding: `${7*scale}px ${4*scale}px`, textAlign: 'center', fontWeight: '500', color: '#1f2937', fontSize: `${0.8 * scale}rem`, width: '16.66%' };

        tableContent = (
             <>
                <thead>
                    <tr>
                        {noten.map(note => ( <th key={note} style={headerStyle}>{note}</th> ))}
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        {noten.map(note => ( <td key={note} style={cellStyle}>{hauptnotenSpiegel.get(note) || 0}</td> ))}
                    </tr>
                </tbody>
            </>
        );
    }
    
    return (
        <div style={{ width: '100%' }}>
            <h3 style={{ fontSize: `${0.875 * scale}rem`, fontWeight: 'bold', color: '#0891b2', margin: 0, paddingBottom: `${4*scale}px` }}>
                Notenspiegel <span style={{ color: '#1f2937' }}>(Ø: {notendurchschnittDezimal.replace('.', ',')})</span>
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 0, tableLayout: 'fixed', maxWidth: '100%' }}>
                {tableContent}
            </table>
        </div>
    );
};

const drawSignatureLine = (x: number, y: number, width: number, scale: number) => {
    const gap = 20 * scale;
    const fontSize = `${0.7 * scale}rem`;
    const color = '#6b7280';
    const borderStyle = '1px dotted #9ca3af';

    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: `${gap}px`, width: '100%', marginTop: `${20*scale}px` }}>
            <div style={{ flex: 1, textAlign: 'center', fontSize: fontSize, color: color }}>
                <div style={{ borderTop: borderStyle, marginBottom: `${2*scale}px` }}></div>
                <span>Lehrkraft</span>
            </div>
            <div style={{ flex: 1, textAlign: 'center', fontSize: fontSize, color: color }}>
                <div style={{ borderTop: borderStyle, marginBottom: `${2*scale}px` }}></div>
                <span>Erziehungsberechtigte(r)</span>
            </div>
        </div>
    );
}


const SchuelerberichtPDFLayout: React.FC<SchuelerberichtPDFLayoutProps> = ({
    schueler,
    leistungsnachweis,
    noteData,
    aufgabenDetails,
    sammelnoteDetails,
    feedback,
    klausurDaten,
    includeNotenspiegel,
    showSignatures,
    notensystem,
    scale = 1,
}) => {
    const maxPunkteGesamt = leistungsnachweis.aufgaben?.reduce((sum, a) => sum + a.maxPunkte, 0) || 0;
    const currentDate = new Date().toLocaleDateString('de-DE');
    
    const isKlausur = leistungsnachweis.typ === 'klausur';
    const aufgabenFontSize = aufgabenDetails.length > 9 ? 0.7 : 0.8;
    const hasFeedback = feedback && feedback.trim() && feedback.trim() !== '---';

    return (
        <div style={{ width: `${550 * scale}px`, height: `${420 * scale}px`, fontFamily: 'sans-serif', backgroundColor: 'white', color: '#1f2937', border: '1px solid #e5e7eb', padding: `${8*scale}px ${16*scale}px ${16*scale}px`, display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #d1d5db', paddingBottom: `${2*scale}px`, marginBottom: `${8*scale}px` }}>
                <div>
                    <h1 style={{ fontSize: `${1 * scale}rem`, fontWeight: 'bold', margin: 0 }}>{schueler.firstName} {schueler.lastName}, {leistungsnachweis.name}</h1>
                </div>
                <div style={{ textAlign: 'right', fontSize: `${0.75 * scale}rem`, color: '#6b7280', flexShrink: 0, paddingLeft: `${8*scale}px` }}>
                    <div>Datum: {currentDate}</div>
                </div>
            </div>

            {/* Main Body */}
            <div style={{ flexGrow: 1, display: 'flex', gap: `${20*scale}px`, minHeight: 0 }}>
                {/* Left: Results, Aufgaben/Details */}
                <div style={{ width: '45%', display: 'flex', flexDirection: 'column', gap: `${12*scale}px` }}>
                    {/* Gesamtergebnis */}
                    <div>
                        <h3 style={{ fontSize: `${0.875 * scale}rem`, fontWeight: 'bold', color: '#0891b2', margin: 0, paddingBottom: `${4*scale}px` }}>Gesamtergebnis</h3>
                        <div style={{ textAlign: 'center', backgroundColor: '#f9fafb', padding: `${4*scale}px ${8*scale}px ${8*scale}px`, borderRadius: `${8*scale}px`, border: '1px solid #e5e7eb' }}>
                            <div style={{ fontSize: `${2.25 * scale}rem`, fontWeight: 'bold', color: '#0891b2', lineHeight: 1.2 }}>{noteData.finalGrade}</div>
                            {isKlausur ? (
                                <div style={{ fontSize: `${0.875 * scale}rem`, color: '#4b5563' }}>{noteData.totalPunkte?.toLocaleString('de-DE')} / {maxPunkteGesamt} P. ({noteData.prozent?.toFixed(1).replace('.', ',')}%)</div>
                            ) : (
                                <div style={{ fontSize: `${0.875 * scale}rem`, color: '#4b5563' }}>Durchschnitt: {noteData.displayDecimal}</div>
                            )}
                        </div>
                    </div>

                    {/* Aufgabenergebnisse / Einzelnoten */}
                    <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minHeight: 0 }}>
                        {((aufgabenDetails && aufgabenDetails.length > 0) || (sammelnoteDetails && sammelnoteDetails.length > 0)) && (
                            <>
                                <h3 style={{ fontSize: `${0.875 * scale}rem`, fontWeight: 'bold', color: '#0891b2', margin: 0, paddingBottom: `${4*scale}px` }}>{isKlausur ? 'Aufgabenergebnisse' : 'Einzelnoten'}</h3>
                                <div style={{ fontSize: `${aufgabenFontSize*scale}rem`, paddingTop: '0px', overflowY: 'auto', margin: `0 ${-4*scale}px` }}>
                                    {isKlausur ? aufgabenDetails.map((aufgabe, index: number) => (
                                        <div key={aufgabe.id} style={{ 
                                            display: 'flex', 
                                            justifyContent: 'space-between', 
                                            padding: `${3*scale}px ${4*scale}px`,
                                            borderRadius: `${4*scale}px`,
                                            backgroundColor: index % 2 === 0 ? '#f9fafb' : 'transparent',
                                        }}>
                                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: `${8*scale}px` }}>{aufgabe.name}</span>
                                            <span style={{ flexShrink: 0, fontWeight: '500' }}>{aufgabe.erreichtePunkte.toLocaleString('de-DE')} / {aufgabe.maxPunkte} P.</span>
                                        </div>
                                    )) : sammelnoteDetails?.map((detail, index: number) => (
                                        <div key={index} style={{ 
                                            display: 'flex', 
                                            justifyContent: 'space-between', 
                                            padding: `${3*scale}px ${4*scale}px`,
                                            borderRadius: `${4*scale}px`,
                                            backgroundColor: index % 2 === 0 ? '#f9fafb' : 'transparent',
                                        }}>
                                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: `${8*scale}px` }}>
                                                {detail.name} <span style={{ fontSize: '0.85em', color: '#6b7280' }}>(x{detail.weighting})</span>
                                            </span>
                                            <span style={{ flexShrink: 0, fontWeight: '500' }}>{detail.note}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Right: Feedback or Notenspiegel/Signature */}
                <div style={{ width: '55%', display: 'flex', flexDirection: 'column' }}>
                    {hasFeedback ? (
                        <>
                            <h3 style={{ fontSize: `${0.875 * scale}rem`, fontWeight: 'bold', color: '#0891b2', margin: 0, paddingBottom: `${4*scale}px` }}>Feedback</h3>
                            <div style={{ flexGrow: 1, fontSize: `${0.75 * scale}rem`, color: '#4b5563', whiteSpace: 'pre-wrap', overflowY: 'auto', backgroundColor: '#f9fafb', padding: `${8*scale}px`, borderRadius: `${8*scale}px`, border: '1px solid #e5e7eb' }}>
                                {feedback}
                            </div>
                        </>
                    ) : (
                        <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                            {includeNotenspiegel && (
                                <SimpleNotenspiegelTable klausurDaten={klausurDaten} notensystem={notensystem} scale={scale} />
                            )}
                            {showSignatures && (
                                <div style={{ marginTop: includeNotenspiegel ? `${20 * scale}px` : 'auto' }}>
                                    {drawSignatureLine(0, 0, 0, scale)}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Footer Area - RENDER ONLY IF FEEDBACK EXISTS */}
            {hasFeedback && (
                 <div style={{ display: 'flex', gap: `${20*scale}px`, alignItems: 'flex-end', marginTop: `${16*scale}px` }}>
                    <div style={{ width: '45%' }}>
                        {includeNotenspiegel && (
                            <SimpleNotenspiegelTable klausurDaten={klausurDaten} notensystem={notensystem} scale={scale} />
                        )}
                    </div>
                    <div style={{ width: '55%' }}>
                        {showSignatures && drawSignatureLine(0, 0, 0, scale)}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SchuelerberichtPDFLayout;