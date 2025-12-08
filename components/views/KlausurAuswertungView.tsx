import React, { useEffect, useMemo, useState } from 'react';
import { useUIContext } from '../../context/UIContext';
import { useLerngruppenContext } from '../../context/LerngruppenContext';
import { useNotenContext } from '../../context/NotenContext';
import { Schueler, NotenschluesselEintrag, DEFAULT_NOTENSCHLUESSEL_MAP, NoteMapEntry, Leistungsnachweis, EinzelLeistungsNote } from '../../context/types';
import { berechneKlausurNote, berechneSammelnoteDurchschnitt } from '../../services/NotenberechnungService';
import Button from '../ui/Button';
import { ArrowTopRightOnSquareIcon, ChevronDownIcon } from '../icons';
import KlausurNotenschluesselModal from '../modals/KlausurNotenschluesselModal';
import ExportBerichteModal from '../modals/ExportBerichteModal';
import PdfPreviewModal from '../modals/PdfPreviewModal';
import PunkteHeatmap from '../ui/charts/PunkteHeatmap';

// Helper to get initials
const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
}

interface ExportOptions {
    includeNotenspiegel: boolean;
    additionalLeistungsnachweisId?: string;
}

const KlausurAuswertungView: React.FC = () => {
    const { onBackToNotenuebersicht, selectedLeistungsnachweisId, setHeaderConfig, handleNavigate } = useUIContext();
    const { schuelerInSelectedLerngruppe, selectedLerngruppe } = useLerngruppenContext();
    const {
        leistungsnachweise,
        notensystemForLerngruppe,
        klausuraufgabePunkte,
        notenschluesselMap,
        schuelerLeistungsnachweisFeedback,
        einzelLeistungen,
        einzelLeistungsNoten,
        notenkategorien,
    } = useNotenContext();

    const [isSchluesselModalOpen, setIsSchluesselModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [exportOptions, setExportOptions] = useState<ExportOptions>({ includeNotenspiegel: true });
    
    // State to hold calculated data for the secondary report (if selected)
    const [secondaryReportData, setSecondaryReportData] = useState<any>(null);


    const leistungsnachweis = useMemo(() =>
        leistungsnachweise.find(ln => ln.id === selectedLeistungsnachweisId && ln.typ === 'klausur'),
        [leistungsnachweise, selectedLeistungsnachweisId]
    );
    
    // Available options for the secondary report dropdown (all other LNs in this group)
    const availableSecondaryLeistungsnachweise = useMemo(() => 
        leistungsnachweise.filter(ln => {
            if (ln.id === selectedLeistungsnachweisId) return false;
            // Find the category for this LN to check lerngruppeId
            const kategorie = notenkategorien.find(nk => nk.id === ln.notenkategorieId);
            return kategorie && kategorie.lerngruppeId === selectedLerngruppe?.id;
        }),
    [leistungsnachweise, selectedLeistungsnachweisId, selectedLerngruppe, notenkategorien]);

    const schuelerKlausurNotenMap: Map<string, NoteMapEntry & { totalPunkte: number; prozent: number; }> = useMemo(() => {
        if (!leistungsnachweis || !notensystemForLerngruppe || !selectedLerngruppe) {
            return new Map();
        }
        
        const aufgaben = (leistungsnachweis.aufgaben || []).sort((a, b) => a.order - b.order);
        
        const punkteMap = new Map<string, number | null>();
        klausuraufgabePunkte.forEach(p => {
            punkteMap.set(`${p.schuelerId}-${p.aufgabeId}`, p.punkte);
        });

        return berechneKlausurNote(
            schuelerInSelectedLerngruppe,
            aufgaben,
            punkteMap,
            leistungsnachweis,
            notensystemForLerngruppe,
            selectedLerngruppe,
            notenschluesselMap
        );
    }, [leistungsnachweis, notensystemForLerngruppe, selectedLerngruppe, schuelerInSelectedLerngruppe, klausuraufgabePunkte, notenschluesselMap]);

    useEffect(() => {
        if (leistungsnachweis && selectedLerngruppe) {
            setHeaderConfig({
                title: 'Klausurauswertung',
                subtitle: <p className="text-sm text-[var(--color-accent-text)]">{leistungsnachweis.name}</p>,
                onBack: () => handleNavigate('leistungsnachweisDetail', selectedLerngruppe.id, undefined, leistungsnachweis.id),
                banner: null,
                actions: (
                    <Button
                        variant="primary"
                        onClick={() => setIsExportModalOpen(true)}
                        className="!p-2"
                        aria-label="Berichte exportieren"
                    >
                        <ArrowTopRightOnSquareIcon className="w-6 h-6" />
                    </Button>
                )
            });
        }
        return () => setHeaderConfig(prev => ({...prev, actions: undefined}));
    }, [leistungsnachweis, selectedLerngruppe, setHeaderConfig, handleNavigate]);
    
    const klausurDaten = useMemo(() => {
        if (!leistungsnachweis || !notensystemForLerngruppe || schuelerInSelectedLerngruppe.length === 0 || !selectedLerngruppe) {
            return null;
        }

        const teilnehmendeSchueler = schuelerInSelectedLerngruppe.filter((s: Schueler) => schuelerKlausurNotenMap.has(s.id));
        if (teilnehmendeSchueler.length === 0) return null;

        // 1. Notenspiegel & Hauptnotenspiegel / Punkte-Spiegel
        const notenspiegel = new Map<string, number>();
        notensystemForLerngruppe.noten.forEach(note => notenspiegel.set(note.displayValue, 0));

        teilnehmendeSchueler.forEach((s: Schueler) => {
            const noteData = schuelerKlausurNotenMap.get(s.id);
            if (noteData) {
                notenspiegel.set(noteData.finalGrade, (notenspiegel.get(noteData.finalGrade) || 0) + 1);
            }
        });

        const hauptnotenSpiegel = new Map<number, number>();
        const punkteSpiegel = new Map<number, number>();

        if (selectedLerngruppe.notensystemId === 'punkte_15_0') {
            for (let i = 0; i <= 15; i++) {
                punkteSpiegel.set(i, 0);
            }
            notenspiegel.forEach((count, noteDisplay) => {
                const punkte = parseInt(noteDisplay, 10);
                if (!isNaN(punkte) && punkte >= 0 && punkte <= 15) {
                    punkteSpiegel.set(punkte, count);
                }
            });
        } else {
            for (let i = 1; i <= 6; i++) {
                hauptnotenSpiegel.set(i, 0);
            }
            notenspiegel.forEach((count, noteDisplay) => {
                const hauptnote = parseInt(noteDisplay.charAt(0), 10);
                if (!isNaN(hauptnote) && hauptnote >= 1 && hauptnote <= 6) {
                    hauptnotenSpiegel.set(hauptnote, (hauptnotenSpiegel.get(hauptnote) || 0) + count);
                }
            });
        }
        
        const maxHauptnoteCount = Math.max(0, ...Array.from(hauptnotenSpiegel.values()));

        // 2. Notendurchschnitt
        const summePunkte = teilnehmendeSchueler.reduce((sum, s) => {
            const noteData = schuelerKlausurNotenMap.get(s.id);
            return sum + (noteData?.averagePoints || 0);
        }, 0);
        const durchschnittPunkte = summePunkte / teilnehmendeSchueler.length;
        
        let displayDecimalValue: number;
        if (selectedLerngruppe.notensystemId === 'noten_1_6_mit_tendenz') {
            displayDecimalValue = (17 - durchschnittPunkte) / 3;
        } else {
            displayDecimalValue = durchschnittPunkte;
        }
        const notendurchschnittDezimal = displayDecimalValue.toFixed(2);
        
        // 3. Beste / Schlechteste Note
        let besteNoteDaten: (NoteMapEntry & { prozent: number; }) | null = null;
        let schlechtesteNoteDaten: (NoteMapEntry & { prozent: number; }) | null = null;

        teilnehmendeSchueler.forEach((s: Schueler) => {
            const noteData = schuelerKlausurNotenMap.get(s.id);
            if (noteData) {
                if (!besteNoteDaten || noteData.prozent > besteNoteDaten.prozent) {
                    besteNoteDaten = noteData;
                }
                if (!schlechtesteNoteDaten || noteData.prozent < schlechtesteNoteDaten.prozent) {
                    schlechtesteNoteDaten = noteData;
                }
            }
        });

        const besteNote = besteNoteDaten?.finalGrade || 'N/A';
        const schlechtesteNote = schlechtesteNoteDaten?.finalGrade || 'N/A';
        const besteNoteProzent = besteNoteDaten?.prozent || 0;
        const schlechtesteNoteProzent = schlechtesteNoteDaten?.prozent || 0;

        // 4. Leistungsstreuung
        const schuelerMitNoten = teilnehmendeSchueler.map((s: Schueler) => ({
            schueler: s,
            punkte: schuelerKlausurNotenMap.get(s.id)?.totalPunkte || 0,
            note: schuelerKlausurNotenMap.get(s.id)?.finalGrade || ''
        })).sort((a, b) => b.punkte - a.punkte);
        
        const topLeistungen = schuelerMitNoten.slice(0, 3);
        const unterstuetzungsbedarf = schuelerMitNoten.slice(-3).reverse();
        
        // 5. Aufgabenanalyse
        const aufgaben = leistungsnachweis.aufgaben || [];
        const aufgabenanalyse = aufgaben.map(aufgabe => {
            let totalPunkte = 0;
            teilnehmendeSchueler.forEach(s => {
                const punkteEintrag = klausuraufgabePunkte.find(p => p.schuelerId === s.id && p.aufgabeId === aufgabe.id);
                totalPunkte += punkteEintrag?.punkte || 0;
            });
            const durchschnitt = totalPunkte / teilnehmendeSchueler.length;
            const prozent = aufgabe.maxPunkte > 0 ? (durchschnitt / aufgabe.maxPunkte) * 100 : 0;
            return {
                name: aufgabe.name,
                durchschnittPunkte: durchschnitt,
                maxPunkte: aufgabe.maxPunkte,
                prozent,
            };
        });


        return {
            hauptnotenSpiegel,
            punkteSpiegel,
            maxHauptnoteCount,
            notendurchschnittDezimal,
            besteNote,
            schlechtesteNote,
            besteNoteProzent,
            schlechtesteNoteProzent,
            topLeistungen,
            unterstuetzungsbedarf,
            aufgabenanalyse,
        };
    }, [leistungsnachweis, notensystemForLerngruppe, schuelerInSelectedLerngruppe, schuelerKlausurNotenMap, klausuraufgabePunkte, selectedLerngruppe, notenschluesselMap]);

    const handleGeneratePreview = (options: ExportOptions) => {
        if (options.additionalLeistungsnachweisId && selectedLerngruppe && notensystemForLerngruppe) {
            const secLN = leistungsnachweise.find(ln => ln.id === options.additionalLeistungsnachweisId);
            if (secLN) {
                // Calculate data for the secondary LN "on the fly"
                let secMap: Map<string, NoteMapEntry>;
                let secDetails: any[] = [];
                
                if (secLN.typ === 'sammelnote') {
                    const lnEinzelLeistungen = einzelLeistungen.filter(el => el.leistungsnachweisId === secLN.id).sort((a,b) => a.order - b.order);
                    const mapForCalc = new Map<string, EinzelLeistungsNote>();
                    einzelLeistungsNoten.forEach(note => mapForCalc.set(`${note.schuelerId}-${note.einzelLeistungId}`, note));
                    
                    secMap = berechneSammelnoteDurchschnitt(
                        schuelerInSelectedLerngruppe,
                        lnEinzelLeistungen,
                        mapForCalc,
                        notensystemForLerngruppe,
                        selectedLerngruppe
                    );
                    secDetails = lnEinzelLeistungen;
                } else { // Klausur
                    const aufgaben = (secLN.aufgaben || []).sort((a, b) => a.order - b.order);
                    const mapForCalc = new Map<string, number | null>();
                    klausuraufgabePunkte.forEach(p => mapForCalc.set(`${p.schuelerId}-${p.aufgabeId}`, p.punkte));
                    
                    const rawSecMap = berechneKlausurNote(
                        schuelerInSelectedLerngruppe,
                        aufgaben,
                        mapForCalc,
                        secLN,
                        notensystemForLerngruppe,
                        selectedLerngruppe,
                        notenschluesselMap
                    );

                    // Transform redundant: Service now returns proper NoteMapEntry structure including displayDecimal.
                    secMap = rawSecMap as Map<string, NoteMapEntry>;
                    secDetails = aufgaben;
                }
                
                setSecondaryReportData({
                    leistungsnachweis: secLN,
                    noteMap: secMap,
                    details: secDetails,
                    feedbackList: schuelerLeistungsnachweisFeedback.filter(f => f.leistungsnachweisId === secLN.id)
                });
            }
        } else {
            setSecondaryReportData(null);
        }

        setExportOptions(options);
        setIsPreviewModalOpen(true);
    };

    if (!leistungsnachweis || !selectedLerngruppe || !notensystemForLerngruppe) {
        return <div className="p-4 bg-[var(--color-ui-primary)] rounded-lg"><p className="text-[var(--color-text-secondary)]">Klausur nicht gefunden oder es handelt sich nicht um eine Klausur.</p></div>;
    }
    
    if (!klausurDaten) {
        return <div className="p-4 bg-[var(--color-ui-primary)] rounded-lg"><p className="text-[var(--color-text-secondary)]">Für diese Klausur wurden noch keine Noten eingetragen.</p></div>;
    }
    
    const { hauptnotenSpiegel, maxHauptnoteCount, notendurchschnittDezimal, besteNote, schlechtesteNote, besteNoteProzent, schlechtesteNoteProzent, topLeistungen, unterstuetzungsbedarf, aufgabenanalyse } = klausurDaten;
    
    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-full">
                {/* Linke Spalte */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    {/* Notenspiegel */}
                    <div className="bg-[var(--color-ui-primary)] p-6 rounded-lg border border-[var(--color-border)] flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Notenspiegel</h2>
                            <Button onClick={() => setIsSchluesselModalOpen(true)} variant="primary">Notenschlüssel</Button>
                        </div>
                        {selectedLerngruppe.notensystemId === 'punkte_15_0' ? (
                            <PunkteHeatmap punkteSpiegel={klausurDaten.punkteSpiegel} />
                        ) : (
                            <div className="flex-1 space-y-4 pr-2">
                                {[1, 2, 3, 4, 5, 6].map(noteWert => {
                                    const count = hauptnotenSpiegel.get(noteWert) || 0;
                                    const widthPercentage = maxHauptnoteCount > 0 ? (count / maxHauptnoteCount) * 100 : 0;
                                    const barClass = noteWert >= 5 ? 'bg-gradient-to-r from-[var(--color-danger-primary-hover)] to-[var(--color-danger-primary)]' : noteWert === 4 ? 'bg-gradient-to-r from-amber-600 to-amber-500' : 'bg-gradient-to-r from-[var(--color-accent-primary-hover)] to-[var(--color-accent-primary)]';
                                    return (
                                        <div key={noteWert} className="flex items-center gap-4">
                                            <span className="font-semibold text-sm text-[var(--color-text-tertiary)] w-14">Note {noteWert}</span>
                                            <div className="flex-1 flex items-center bg-[var(--color-ui-secondary)] rounded-md h-7">
                                                <div className={`relative overflow-hidden glossy-bar h-full rounded-md ${barClass} transition-all duration-500 flex items-center pr-2 justify-end`} style={{ width: `${widthPercentage}%` }}>
                                                    {widthPercentage > 15 && <span className="text-sm font-bold text-white">{count}x</span>}
                                                </div>
                                                {widthPercentage <= 15 && count > 0 && <span className="text-sm font-bold text-[var(--color-text-secondary)] ml-2">{count}x</span>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                    {/* Leistungsstreuung */}
                    <div className="bg-[var(--color-ui-primary)] p-6 rounded-lg border border-[var(--color-border)] flex flex-col flex-1">
                        <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-4">Leistungsstreuung</h2>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <h3 className="font-semibold text-[var(--color-success-text)] mb-2">Top-Leistungen</h3>
                                <ul className="space-y-1">
                                    {topLeistungen.map(({schueler, note}) => (
                                        <li key={schueler.id}>
                                            <button onClick={() => handleNavigate('schuelerAuswertung', selectedLerngruppe.id, schueler.id, leistungsnachweis.id)} className="flex items-center space-x-3 p-1 -ml-1 rounded-md hover:bg-[var(--color-ui-secondary)] w-full text-left">
                                                <div className="w-8 h-8 bg-[var(--color-accent-secondary)] text-[var(--color-accent-text-inverted)] rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0">{getInitials(schueler.firstName, schueler.lastName)}</div>
                                                <div className="min-w-0"><p className="font-semibold text-sm text-[var(--color-text-primary)] truncate">{schueler.lastName}, {schueler.firstName}</p><p className="text-xs text-[var(--color-text-tertiary)]">{note}</p></div>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <h3 className="font-semibold text-[var(--color-danger-text)] mb-2 truncate">Unterstützungsbedarf</h3>
                                <ul className="space-y-1">
                                    {unterstuetzungsbedarf.map(({schueler, note}) => (
                                        <li key={schueler.id}>
                                            <button onClick={() => handleNavigate('schuelerAuswertung', selectedLerngruppe.id, schueler.id, leistungsnachweis.id)} className="flex items-center space-x-3 p-1 -ml-1 rounded-md hover:bg-[var(--color-ui-secondary)] w-full text-left">
                                                <div className="w-8 h-8 bg-[var(--color-accent-secondary)] text-[var(--color-accent-text-inverted)] rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0">{getInitials(schueler.firstName, schueler.lastName)}</div>
                                                <div className="min-w-0"><p className="font-semibold text-sm text-[var(--color-text-primary)] truncate">{schueler.lastName}, {schueler.firstName}</p><p className="text-xs text-[var(--color-text-tertiary)]">{note}</p></div>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Rechte Spalte */}
                <div className="lg:col-span-3 flex flex-col gap-6">
                    {/* Statistik-Highlights */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-[var(--color-ui-primary)] p-4 rounded-lg border border-[var(--color-border)] text-center flex flex-col justify-center">
                            <h3 className="text-sm font-semibold text-[var(--color-text-tertiary)]">Notendurchschnitt</h3>
                            <p className="text-4xl font-bold text-[var(--color-accent-text)] mt-1">{notendurchschnittDezimal.replace('.', ',')}</p>
                            <p className="text-xs text-[var(--color-text-tertiary)]">&nbsp;</p>
                        </div>
                        <div className="bg-[var(--color-ui-primary)] p-4 rounded-lg border border-[var(--color-border)] text-center flex flex-col justify-center">
                            <h3 className="text-sm font-semibold text-[var(--color-text-tertiary)]">Beste Note</h3>
                            <p className="text-4xl font-bold text-[var(--color-success-text)] mt-1">{besteNote}</p>
                            <p className="text-xs text-[var(--color-text-tertiary)]">{besteNoteProzent.toFixed(1).replace('.', ',')}%</p>
                        </div>
                        <div className="bg-[var(--color-ui-primary)] p-4 rounded-lg border border-[var(--color-border)] text-center flex flex-col justify-center">
                            <h3 className="text-sm font-semibold text-[var(--color-text-tertiary)]">Schlechteste Note</h3>
                            <p className="text-4xl font-bold text-[var(--color-danger-text)] mt-1">{schlechtesteNote}</p>
                            <p className="text-xs text-[var(--color-text-tertiary)]">{schlechtesteNoteProzent.toFixed(1).replace('.', ',')}%</p>
                        </div>
                    </div>
                    {/* Aufgabenanalyse */}
                    <div className="bg-[var(--color-ui-primary)] p-6 rounded-lg border border-[var(--color-border)] flex flex-col flex-1">
                        <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-4">Aufgabenanalyse</h2>
                        <div className="space-y-4 overflow-y-auto pr-2 -mr-2">
                            {aufgabenanalyse.map((aufgabe, index) => {
                                const isBelowThreshold = aufgabe.prozent < 50;
                                return (
                                    <div key={index}>
                                        <div className="flex justify-between items-baseline mb-1">
                                            <span className={`font-semibold ${isBelowThreshold ? 'text-[var(--color-danger-text)]' : 'text-[var(--color-text-primary)]'}`}>{aufgabe.name}</span>
                                            <span className={`text-sm ${isBelowThreshold ? 'text-[var(--color-danger-text)]' : 'text-[var(--color-text-secondary)]'}`}>{aufgabe.durchschnittPunkte.toFixed(1).replace('.', ',')} von {aufgabe.maxPunkte} P. ({aufgabe.prozent.toFixed(1).replace('.', ',')}%)</span>
                                        </div>
                                        <div className="w-full bg-[var(--color-ui-secondary)] rounded-md h-5">
                                            <div 
                                                className={`relative overflow-hidden glossy-bar rounded-md h-5 ${isBelowThreshold ? 'bg-gradient-to-r from-[var(--color-danger-primary-hover)] to-[var(--color-danger-primary)]' : 'bg-gradient-to-r from-[var(--color-accent-primary-hover)] to-[var(--color-accent-primary)]'}`}
                                                style={{ width: `${aufgabe.prozent}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>

            <KlausurNotenschluesselModal
                isOpen={isSchluesselModalOpen}
                onClose={() => setIsSchluesselModalOpen(false)}
                leistungsnachweis={leistungsnachweis}
            />
            <ExportBerichteModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                onGeneratePreview={handleGeneratePreview}
                availableLeistungsnachweise={availableSecondaryLeistungsnachweise}
            />
            <PdfPreviewModal
                isOpen={isPreviewModalOpen}
                onClose={() => setIsPreviewModalOpen(false)}
                options={exportOptions}
                leistungsnachweis={leistungsnachweis}
                schuelerInSelectedLerngruppe={schuelerInSelectedLerngruppe}
                schuelerKlausurNotenMap={schuelerKlausurNotenMap}
                klausuraufgabePunkte={klausuraufgabePunkte}
                schuelerLeistungsnachweisFeedback={schuelerLeistungsnachweisFeedback}
                klausurDaten={klausurDaten}
                notensystem={notensystemForLerngruppe}
                secondaryReportData={secondaryReportData}
                // Also pass notenMap for sammelnote support if the primary is a sammelnote (unlikely here but for completeness)
                einzelLeistungen={einzelLeistungen.filter(el => el.leistungsnachweisId === leistungsnachweis.id)}
                notenMap={(() => {
                    const map = new Map<string, EinzelLeistungsNote>();
                    einzelLeistungsNoten.forEach(note => { map.set(`${note.schuelerId}-${note.einzelLeistungId}`, note); });
                    return map;
                })()}
            />
        </>
    )
}

export default KlausurAuswertungView;