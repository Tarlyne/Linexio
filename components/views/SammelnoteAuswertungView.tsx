import React, { useEffect, useMemo, useState } from 'react';
import { useUIContext } from '../../context/UIContext';
import { useLerngruppenContext } from '../../context/LerngruppenContext';
import { useNotenContext } from '../../context/NotenContext';
import { Schueler, NoteMapEntry, EinzelLeistungsNote, EinzelLeistung } from '../../context/types';
import { berechneSammelnoteDurchschnitt } from '../../services/NotenberechnungService';
import PunkteHeatmap from '../ui/charts/PunkteHeatmap';
import Button from '../ui/Button';
import { ArrowTopRightOnSquareIcon } from '../icons';
import ExportBerichteModal from '../modals/ExportBerichteModal';
import PdfPreviewModal from '../modals/PdfPreviewModal';

// Helper to get initials
const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
}

interface ExportOptions {
    includeNotenspiegel: boolean;
    showDetails: boolean;
    showSignatures: boolean;
}

const SammelnoteAuswertungView: React.FC = () => {
    const { onBackToNotenuebersicht, selectedLeistungsnachweisId, setHeaderConfig, handleNavigate } = useUIContext();
    const { schuelerInSelectedLerngruppe, selectedLerngruppe } = useLerngruppenContext();
    const {
        leistungsnachweise,
        einzelLeistungen,
        einzelLeistungsNoten,
        notensystemForLerngruppe,
        schuelerLeistungsnachweisFeedback,
    } = useNotenContext();

    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [exportOptions, setExportOptions] = useState<ExportOptions>({ includeNotenspiegel: false, showDetails: true, showSignatures: true });

    const leistungsnachweis = useMemo(() =>
        leistungsnachweise.find(ln => ln.id === selectedLeistungsnachweisId && ln.typ === 'sammelnote'),
        [leistungsnachweise, selectedLeistungsnachweisId]
    );

    const filteredEinzelLeistungen = useMemo(() =>
        leistungsnachweis ? einzelLeistungen.filter(el => el.leistungsnachweisId === leistungsnachweis.id).sort((a, b) => a.order - b.order) : [],
        [einzelLeistungen, leistungsnachweis]
    );

    const notenMap = useMemo(() => {
        const map = new Map<string, EinzelLeistungsNote>();
        einzelLeistungsNoten.forEach(note => { map.set(`${note.schuelerId}-${note.einzelLeistungId}`, note); });
        return map;
    }, [einzelLeistungsNoten]);

    // Explicitly typed useMemo ensures we are working with clean NoteMapEntry objects
    const schuelerGesamtNotenMap = useMemo<Map<string, NoteMapEntry>>(() => {
        if (!leistungsnachweis || !notensystemForLerngruppe || !selectedLerngruppe) {
            return new Map();
        }
        return berechneSammelnoteDurchschnitt(
            schuelerInSelectedLerngruppe,
            filteredEinzelLeistungen,
            notenMap,
            notensystemForLerngruppe,
            selectedLerngruppe
        );
    }, [leistungsnachweis, notensystemForLerngruppe, selectedLerngruppe, schuelerInSelectedLerngruppe, filteredEinzelLeistungen, notenMap]);

    const handleGeneratePreview = (options: ExportOptions) => {
        setExportOptions(options);
        setIsPreviewModalOpen(true);
    };

    useEffect(() => {
        if (leistungsnachweis && selectedLerngruppe) {
            setHeaderConfig({
                title: 'Auswertung',
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
    
    const sammelnoteDaten = useMemo(() => {
        if (!leistungsnachweis || !notensystemForLerngruppe || schuelerInSelectedLerngruppe.length === 0 || !selectedLerngruppe) {
            return null;
        }

        const teilnehmendeSchueler = schuelerInSelectedLerngruppe.filter((s: Schueler) => schuelerGesamtNotenMap.has(s.id));
        
        // 1. Notenspiegel
        const notenspiegel = new Map<string, number>();
        notensystemForLerngruppe.noten.forEach(note => notenspiegel.set(note.displayValue, 0));

        teilnehmendeSchueler.forEach((s: Schueler) => {
            const noteData = schuelerGesamtNotenMap.get(s.id);
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

        // 2. Notendurchschnitt (Gesamt)
        let summePunkte = 0;
        let countPunkte = 0;
        
        teilnehmendeSchueler.forEach((s) => {
            const noteData = schuelerGesamtNotenMap.get(s.id);
            if (noteData) {
                // Hier ist kein Cast mehr notwendig, da NoteMapEntry.averagePoints als number definiert ist.
                summePunkte += noteData.averagePoints;
                countPunkte++;
            }
        });
        
        const durchschnittPunkte = countPunkte > 0 ? summePunkte / countPunkte : 0;
        
        let displayDecimalValue: number;
        if (selectedLerngruppe.notensystemId === 'noten_1_6_mit_tendenz') {
            displayDecimalValue = (17 - durchschnittPunkte) / 3;
        } else {
            displayDecimalValue = durchschnittPunkte;
        }
        const notendurchschnittDezimal = countPunkte > 0 ? displayDecimalValue.toFixed(2) : 'N/A';
        
        // 3. Beste / Schlechteste Note
        let besteNoteDaten: NoteMapEntry | null = null;
        let schlechtesteNoteDaten: NoteMapEntry | null = null;

        teilnehmendeSchueler.forEach((s: Schueler) => {
            const noteData = schuelerGesamtNotenMap.get(s.id);
            if (noteData) {
                if (!besteNoteDaten || noteData.averagePoints > besteNoteDaten.averagePoints) {
                    besteNoteDaten = noteData;
                }
                if (!schlechtesteNoteDaten || noteData.averagePoints < schlechtesteNoteDaten.averagePoints) {
                    schlechtesteNoteDaten = noteData;
                }
            }
        });

        const besteNote = besteNoteDaten?.finalGrade || 'N/A';
        const schlechtesteNote = schlechtesteNoteDaten?.finalGrade || 'N/A';

        // 4. Leistungsstreuung (Top/Bottom 3 based on points)
        const schuelerMitNoten = teilnehmendeSchueler.map((s: Schueler) => ({
            schueler: s,
            punkte: schuelerGesamtNotenMap.get(s.id)?.averagePoints || 0,
            note: schuelerGesamtNotenMap.get(s.id)?.finalGrade || ''
        })).sort((a, b) => b.punkte - a.punkte);
        
        const topLeistungen = schuelerMitNoten.slice(0, 3);
        const unterstuetzungsbedarf = schuelerMitNoten.slice(-3).reverse();
        
        // 5. Einzel-Spalten-Analyse
        const noteToPoints = new Map<string, number>();
        notensystemForLerngruppe.noten.forEach(n => noteToPoints.set(n.displayValue, n.pointValue));
        
        const spaltenAnalyse = filteredEinzelLeistungen.map(el => {
            let totalPoints = 0;
            let count = 0;
            
            schuelerInSelectedLerngruppe.forEach(s => {
                const noteRecord = notenMap.get(`${s.id}-${el.id}`);
                const note = noteRecord?.note;
                if (note) {
                    const points = noteToPoints.get(note);
                    if (points !== undefined) {
                        totalPoints += points;
                        count++;
                    }
                }
            });
            
            const avgPoints = count > 0 ? totalPoints / count : 0;
            let avgDisplay = 0;
            
            // Normalize for visual bar (0-100%)
            let percentage = 0;
            if (selectedLerngruppe.notensystemId === 'noten_1_6_mit_tendenz') {
                // 15 Pkt (1+) -> 100%, 0 Pkt (6) -> 0%
                percentage = (avgPoints / 15) * 100;
                avgDisplay = (17 - avgPoints) / 3;
            } else {
                percentage = (avgPoints / 15) * 100;
                avgDisplay = avgPoints;
            }

            return {
                name: el.name,
                avgDisplay: avgDisplay.toFixed(2),
                percentage: Math.min(100, Math.max(0, percentage)),
                count
            };
        });


        return {
            hauptnotenSpiegel,
            punkteSpiegel,
            maxHauptnoteCount,
            notendurchschnittDezimal,
            besteNote,
            schlechtesteNote,
            topLeistungen,
            unterstuetzungsbedarf,
            spaltenAnalyse,
        };
    }, [leistungsnachweis, notensystemForLerngruppe, schuelerInSelectedLerngruppe, schuelerGesamtNotenMap, filteredEinzelLeistungen, selectedLerngruppe, notenMap]);


    if (!leistungsnachweis || !selectedLerngruppe || !notensystemForLerngruppe) {
        return <div className="p-4 bg-[var(--color-ui-primary)] rounded-lg"><p className="text-[var(--color-text-secondary)]">Sammelnote nicht gefunden.</p></div>;
    }
    
    if (!sammelnoteDaten) {
        return <div className="p-4 bg-[var(--color-ui-primary)] rounded-lg"><p className="text-[var(--color-text-secondary)]">Für diese Sammelnote wurden noch keine Noten eingetragen.</p></div>;
    }
    
    const { hauptnotenSpiegel, maxHauptnoteCount, notendurchschnittDezimal, besteNote, schlechtesteNote, topLeistungen, unterstuetzungsbedarf, spaltenAnalyse } = sammelnoteDaten;
    
    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-full">
                {/* Linke Spalte */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    {/* Notenspiegel */}
                    <div className="bg-[var(--color-ui-primary)] p-6 rounded-lg border border-[var(--color-border)] flex flex-col">
                        <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-6">Notenspiegel (Gesamt)</h2>
                        {selectedLerngruppe.notensystemId === 'punkte_15_0' ? (
                            <PunkteHeatmap punkteSpiegel={sammelnoteDaten.punkteSpiegel} />
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
                                        <li key={schueler.id} className="flex items-center space-x-3 p-1 -ml-1 rounded-md">
                                            <div className="w-8 h-8 bg-[var(--color-accent-secondary)] text-[var(--color-accent-text-inverted)] rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0">{getInitials(schueler.firstName, schueler.lastName)}</div>
                                            <div className="min-w-0"><p className="font-semibold text-sm text-[var(--color-text-primary)] truncate">{schueler.lastName}, {schueler.firstName}</p><p className="text-xs text-[var(--color-text-tertiary)]">{note}</p></div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <h3 className="font-semibold text-[var(--color-danger-text)] mb-2 truncate">Unterstützungsbedarf</h3>
                                <ul className="space-y-1">
                                    {unterstuetzungsbedarf.map(({schueler, note}) => (
                                        <li key={schueler.id} className="flex items-center space-x-3 p-1 -ml-1 rounded-md">
                                            <div className="w-8 h-8 bg-[var(--color-accent-secondary)] text-[var(--color-accent-text-inverted)] rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0">{getInitials(schueler.firstName, schueler.lastName)}</div>
                                            <div className="min-w-0"><p className="font-semibold text-sm text-[var(--color-text-primary)] truncate">{schueler.lastName}, {schueler.firstName}</p><p className="text-xs text-[var(--color-text-tertiary)]">{note}</p></div>
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
                        </div>
                        <div className="bg-[var(--color-ui-primary)] p-4 rounded-lg border border-[var(--color-border)] text-center flex flex-col justify-center">
                            <h3 className="text-sm font-semibold text-[var(--color-text-tertiary)]">Beste Note</h3>
                            <p className="text-4xl font-bold text-[var(--color-success-text)] mt-1">{besteNote}</p>
                        </div>
                        <div className="bg-[var(--color-ui-primary)] p-4 rounded-lg border border-[var(--color-border)] text-center flex flex-col justify-center">
                            <h3 className="text-sm font-semibold text-[var(--color-text-tertiary)]">Schlechteste Note</h3>
                            <p className="text-4xl font-bold text-[var(--color-danger-text)] mt-1">{schlechtesteNote}</p>
                        </div>
                    </div>
                    {/* Detail-Analyse (Spalten) */}
                    <div className="bg-[var(--color-ui-primary)] p-6 rounded-lg border border-[var(--color-border)] flex flex-col flex-1">
                        <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-4">Detail-Analyse (Spaltendurchschnitte)</h2>
                        <div className="space-y-4 overflow-y-auto pr-2 -mr-2">
                            {spaltenAnalyse.map((spalte, index) => {
                                const isBelowThreshold = spalte.percentage < 50; // Simple threshold logic
                                return (
                                    <div key={index}>
                                        <div className="flex justify-between items-baseline mb-1">
                                            <span className={`font-semibold ${isBelowThreshold ? 'text-[var(--color-danger-text)]' : 'text-[var(--color-text-primary)]'}`}>{spalte.name}</span>
                                            <span className={`text-sm ${isBelowThreshold ? 'text-[var(--color-danger-text)]' : 'text-[var(--color-text-secondary)]'}`}>Ø {spalte.avgDisplay.replace('.', ',')} ({spalte.count} Noten)</span>
                                        </div>
                                        <div className="w-full bg-[var(--color-ui-secondary)] rounded-md h-5">
                                            <div 
                                                className={`relative overflow-hidden glossy-bar rounded-md h-5 ${isBelowThreshold ? 'bg-gradient-to-r from-[var(--color-danger-primary-hover)] to-[var(--color-danger-primary)]' : 'bg-gradient-to-r from-[var(--color-accent-primary-hover)] to-[var(--color-accent-primary)]'}`}
                                                style={{ width: `${spalte.percentage}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                )
                            })}
                            {spaltenAnalyse.length === 0 && <p className="text-[var(--color-text-tertiary)]">Keine Notenspalten vorhanden.</p>}
                        </div>
                    </div>
                </div>
            </div>
            
            <ExportBerichteModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                onGeneratePreview={handleGeneratePreview}
                type="sammelnote"
            />
            <PdfPreviewModal
                isOpen={isPreviewModalOpen}
                onClose={() => setIsPreviewModalOpen(false)}
                options={exportOptions}
                leistungsnachweis={leistungsnachweis}
                schuelerInSelectedLerngruppe={schuelerInSelectedLerngruppe}
                schuelerKlausurNotenMap={schuelerGesamtNotenMap as any} // Reusing Map structure, data is slightly different but types align enough for basic use
                klausuraufgabePunkte={[]} // No raw points for Sammelnote
                schuelerLeistungsnachweisFeedback={schuelerLeistungsnachweisFeedback}
                klausurDaten={null} // Not needed for Sammelnote export in the same way
                notensystem={notensystemForLerngruppe}
                einzelLeistungen={filteredEinzelLeistungen}
                notenMap={notenMap}
                sammelnoteDaten={sammelnoteDaten} // Pass explicit sammelnote data
            />
        </>
    )
}

export default SammelnoteAuswertungView;
