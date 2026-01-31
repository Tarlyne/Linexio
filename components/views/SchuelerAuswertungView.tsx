import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useUIContext } from '../../context/UIContext';
import { useLerngruppenContext } from '../../context/LerngruppenContext';
import { useNotenContext } from '../../context/NotenContext';
import { useToolsContext } from '../../context/ToolsContext';
import { berechneKlausurNote, berechneSammelnoteDurchschnitt } from '../../services/NotenberechnungService';
import { SparklesIcon, SpinnerIcon, CheckCircleIcon } from '../icons';
import Button from '../ui/Button';
import SchuelerFeedbackAiModal from '../modals/SchuelerFeedbackAiModal';
import { Schueler, Leistungsnachweis, Notenkategorie, EinzelLeistungsNote, Note, Klausuraufgabe, NoteMapEntry, KlausurNoteMapEntry } from '../../context/types';
import { useLicenseContext } from '../../context/LicenseContext';
import SupporterModal from '../modals/SupporterModal';

const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
}

interface PreviousData {
    isFirst: boolean;
    name?: string;
    noteData?: NoteMapEntry;
    maxPunkte?: number;
}

const SchuelerAuswertungView: React.FC = () => {
    const {
        selectedSchuelerId,
        selectedLeistungsnachweisId,
        setHeaderConfig,
        handleNavigate,
    } = useUIContext();
    
    const { allSchueler, selectedLerngruppe, schuelerInSelectedLerngruppe } = useLerngruppenContext();
    const { licenseStatus } = useLicenseContext();
    
    const {
        leistungsnachweise,
        notensystemForLerngruppe,
        klausuraufgabePunkte,
        einzelLeistungen,
        einzelLeistungsNoten,
        notenschluesselMap,
        schuelerLeistungsnachweisFeedback,
        onUpdateSchuelerLeistungsnachweisFeedback,
        notenkategorien,
    } = useNotenContext();

    const { ai } = useToolsContext();

    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const [isSupporterModalOpen, setIsSupporterModalOpen] = useState(false);
    const [aiPrompt, setAiPrompt] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);
    const [generationStatus, setGenerationStatus] = useState('');
    
    const [feedbackText, setFeedbackText] = useState('');
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
    const debounceTimeoutRef = useRef<number | null>(null);
    const initialLoadDone = useRef(false);
    const statusTimeoutRef = useRef<number | null>(null);
    
    const isSupporter = licenseStatus === 'PRO' || licenseStatus === 'ALPHA_TESTER';

    const schueler = useMemo(() => 
        allSchueler.find((s: Schueler) => s.id === selectedSchuelerId), 
    [allSchueler, selectedSchuelerId]);

    const leistungsnachweis = useMemo(() => 
        leistungsnachweise.find(ln => ln.id === selectedLeistungsnachweisId),
    [leistungsnachweise, selectedLeistungsnachweisId]);
    
    const isKlausur = leistungsnachweis?.typ === 'klausur';
    const isSammelnote = leistungsnachweis?.typ === 'sammelnote';

    // Create lookup map for points
    const noteToPoints = useMemo<Map<string, number>>(() => {
        const map = new Map<string, number>();
        if (notensystemForLerngruppe) {
            notensystemForLerngruppe.noten.forEach(n => map.set(n.displayValue, n.pointValue));
        }
        return map;
    }, [notensystemForLerngruppe]);

    useEffect(() => {
        if (schueler && leistungsnachweis) {
            const feedbackRecord = schuelerLeistungsnachweisFeedback.find(f => f.schuelerId === schueler.id && f.leistungsnachweisId === leistungsnachweis.id);
            setFeedbackText(feedbackRecord?.feedbackText || '');
            initialLoadDone.current = false; // Reset for new schueler/ln
            setSaveStatus('idle');
        }
    }, [schueler, leistungsnachweis, schuelerLeistungsnachweisFeedback]);
    
    useEffect(() => {
        if (!initialLoadDone.current) {
            setTimeout(() => { initialLoadDone.current = true; }, 100);
            return;
        }
        
        if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
        if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
        
        setSaveStatus('idle');

        debounceTimeoutRef.current = window.setTimeout(async () => {
            if (schueler && leistungsnachweis) {
                setSaveStatus('saving');
                await onUpdateSchuelerLeistungsnachweisFeedback(schueler.id, leistungsnachweis.id, feedbackText);
                setSaveStatus('saved');
                
                statusTimeoutRef.current = window.setTimeout(() => {
                    setSaveStatus('idle');
                }, 1500);
            }
        }, 1500);

        return () => {
            if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
            if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
        };
    }, [feedbackText, schueler, leistungsnachweis, onUpdateSchuelerLeistungsnachweisFeedback]);


    const noteData = useMemo<NoteMapEntry | KlausurNoteMapEntry | null>(() => {
        if (!schueler || !leistungsnachweis || !notensystemForLerngruppe || !selectedLerngruppe) {
            return null;
        }

        if (isKlausur) {
            const punkteMap = new Map<string, number | null>();
            klausuraufgabePunkte.forEach(p => punkteMap.set(`${p.schuelerId}-${p.aufgabeId}`, p.punkte));

            const resultMap = berechneKlausurNote(
                [schueler],
                leistungsnachweis.aufgaben || [],
                punkteMap,
                leistungsnachweis,
                notensystemForLerngruppe,
                selectedLerngruppe,
                notenschluesselMap
            );
            return resultMap.get(schueler.id) || null;
        } else if (isSammelnote) {
            const lnEinzelLeistungen = einzelLeistungen.filter(el => el.leistungsnachweisId === leistungsnachweis.id);
            const notenMapForSammelnoten = new Map<string, EinzelLeistungsNote>();
            einzelLeistungsNoten.forEach(note => { notenMapForSammelnoten.set(`${note.schuelerId}-${note.einzelLeistungId}`, note); });
            
            const resultMap = berechneSammelnoteDurchschnitt(
                [schueler],
                lnEinzelLeistungen,
                notenMapForSammelnoten,
                notensystemForLerngruppe,
                selectedLerngruppe
            );
            return resultMap.get(schueler.id) || null;
        }
        return null;
    }, [isKlausur, isSammelnote, schueler, leistungsnachweis, notensystemForLerngruppe, selectedLerngruppe, klausuraufgabePunkte, notenschluesselMap, einzelLeistungen, einzelLeistungsNoten]);

    const previousLeistungsnachweisData = useMemo<PreviousData | null>(() => {
        if (!leistungsnachweis || !selectedLerngruppe || !schueler || !notensystemForLerngruppe) return null;
    
        const notenkategorie = notenkategorien.find((nk: Notenkategorie) => nk.id === leistungsnachweis.notenkategorieId);
        if (!notenkategorie) return null;
    
        // Only compare with same type
        const alleLnDerKategorie = leistungsnachweise
            .filter((ln: Leistungsnachweis) => ln.notenkategorieId === notenkategorie.id && ln.typ === leistungsnachweis.typ)
            .sort((a, b) => a.order - b.order);
    
        const currentIndex = alleLnDerKategorie.findIndex(ln => ln.id === leistungsnachweis.id);
    
        if (currentIndex <= 0) {
            return { isFirst: true };
        }
    
        const previousLn = alleLnDerKategorie[currentIndex - 1];
        let previousNoteData: NoteMapEntry | undefined = undefined;
        let maxPunkte = 0;

        if (isKlausur) {
            const punkteMap = new Map<string, number | null>();
            klausuraufgabePunkte.forEach(p => punkteMap.set(`${p.schuelerId}-${p.aufgabeId}`, p.punkte));
            const resultMap = berechneKlausurNote(
                [schueler],
                previousLn.aufgaben || [],
                punkteMap,
                previousLn,
                notensystemForLerngruppe,
                selectedLerngruppe,
                notenschluesselMap
            );
            // Service returns KlausurNoteMapEntry which extends NoteMapEntry
            previousNoteData = resultMap.get(schueler.id);
            maxPunkte = previousLn.aufgaben?.reduce((sum: number, a: Klausuraufgabe) => sum + Number(a.maxPunkte), 0) || 0;
        } else if (isSammelnote) {
            const lnEinzelLeistungen = einzelLeistungen.filter(el => el.leistungsnachweisId === previousLn.id);
            const notenMapForSammelnoten = new Map<string, EinzelLeistungsNote>();
            einzelLeistungsNoten.forEach(note => { notenMapForSammelnoten.set(`${note.schuelerId}-${note.einzelLeistungId}`, note); });
            const resultMap = berechneSammelnoteDurchschnitt(
                [schueler],
                lnEinzelLeistungen,
                notenMapForSammelnoten,
                notensystemForLerngruppe,
                selectedLerngruppe
            );
            previousNoteData = resultMap.get(schueler.id);
        }
    
        return {
            isFirst: false,
            name: previousLn.name,
            noteData: previousNoteData, // This is now strictly typed as NoteMapEntry | undefined
            maxPunkte, // relevant only for Klausur
        };
    
    }, [leistungsnachweis, selectedLerngruppe, schueler, notensystemForLerngruppe, notenkategorien, leistungsnachweise, klausuraufgabePunkte, notenschluesselMap, isKlausur, isSammelnote, einzelLeistungen, einzelLeistungsNoten]);


    const details = useMemo(() => {
        if (!leistungsnachweis || !schueler || !selectedLerngruppe || !notensystemForLerngruppe) return [];

        if (isKlausur && leistungsnachweis.aufgaben) {
            const schuelerInGroup = allSchueler.filter(s => selectedLerngruppe.schuelerIds.includes(s.id));
            return leistungsnachweis.aufgaben.map(aufgabe => {
                // Schüler-spezifische Berechnung
                const punkteEintrag = klausuraufgabePunkte.find(p => p.schuelerId === schueler.id && p.aufgabeId === aufgabe.id);
                const erreichtePunkte = punkteEintrag?.punkte ?? 0;
                const prozent = aufgabe.maxPunkte > 0 ? (erreichtePunkte / Number(aufgabe.maxPunkte)) * 100 : 0;
                
                // Klassen-Durchschnittsberechnung
                let totalPunkteKlasse = 0;
                let teilnehmerKlasse = 0;
                schuelerInGroup.forEach((s: Schueler) => {
                    const klassenPunkteEintrag = klausuraufgabePunkte.find(p => p.schuelerId === s.id && p.aufgabeId === aufgabe.id);
                    if (klassenPunkteEintrag) {
                        totalPunkteKlasse += klassenPunkteEintrag.punkte;
                        teilnehmerKlasse++;
                    }
                });
                const durchschnittPunkteKlasse = teilnehmerKlasse > 0 ? totalPunkteKlasse / teilnehmerKlasse : 0;
                const prozentKlasse = aufgabe.maxPunkte > 0 ? (durchschnittPunkteKlasse / Number(aufgabe.maxPunkte)) * 100 : 0;

                return { 
                    id: aufgabe.id,
                    name: aufgabe.name, 
                    inhalt: aufgabe.inhalt,
                    valueDisplay: `${erreichtePunkte.toLocaleString('de-DE')} / ${aufgabe.maxPunkte} P.`,
                    percentage: prozent, 
                    avgDisplay: `${durchschnittPunkteKlasse.toFixed(1).replace('.', ',')} P.`,
                    percentageClass: prozentKlasse,
                    weighting: null, // Tasks don't have weights in display usually
                    isBadGrade: false // Not used for points
                };
            });
        } else if (isSammelnote) {
            const lnEinzelLeistungen = einzelLeistungen.filter(el => el.leistungsnachweisId === leistungsnachweis.id).sort((a,b) => a.order - b.order);
            
            return lnEinzelLeistungen.map(el => {
                // Student
                const noteRecord = einzelLeistungsNoten.find(n => n.schuelerId === schueler.id && n.einzelLeistungId === el.id);
                const note = noteRecord?.note || '-';
                const points = noteRecord?.note ? noteToPoints.get(noteRecord.note) : undefined;
                
                const isBadGrade = points !== undefined && points <= 3; // <= 3 corresponds to grade 5+, 5, 5-, 6

                // Visualization percentage
                let percentage = 0;
                if (points !== undefined) {
                    if (selectedLerngruppe.notensystemId === 'noten_1_6_mit_tendenz') {
                        // 15 Pkt (1+) -> 100%, 0 Pkt (6) -> 0%
                        percentage = (points / 15) * 100; 
                    } else {
                        percentage = (points / 15) * 100;
                    }
                }

                // Class Average
                let totalPointsClass = 0;
                let countClass = 0;
                schuelerInSelectedLerngruppe.forEach(s => {
                    const nr = einzelLeistungsNoten.find(n => n.schuelerId === s.id && n.einzelLeistungId === el.id);
                    if (nr?.note) {
                        const p = noteToPoints.get(nr.note);
                        if (p !== undefined) {
                            totalPointsClass += p;
                            countClass++;
                        }
                    }
                });
                
                const avgPoints = countClass > 0 ? totalPointsClass / countClass : 0;
                let percentageClass = 0;
                let avgDisplay = '-';
                
                if (countClass > 0) {
                    if (selectedLerngruppe.notensystemId === 'noten_1_6_mit_tendenz') {
                        percentageClass = (avgPoints / 15) * 100;
                        const avgDecimal = (17 - avgPoints) / 3;
                        avgDisplay = `Ø ${avgDecimal.toFixed(2).replace('.', ',')}`;
                    } else {
                        percentageClass = (avgPoints / 15) * 100;
                        avgDisplay = `Ø ${avgPoints.toFixed(2).replace('.', ',')}`;
                    }
                }

                return {
                    id: el.id,
                    name: el.name,
                    inhalt: null,
                    valueDisplay: note,
                    percentage: Math.max(0, Math.min(100, percentage)),
                    avgDisplay: avgDisplay,
                    percentageClass: Math.max(0, Math.min(100, percentageClass)),
                    weighting: el.gewichtung,
                    isBadGrade: isBadGrade
                };
            });
        }
        return [];
    }, [leistungsnachweis, schueler, klausuraufgabePunkte, allSchueler, selectedLerngruppe, isKlausur, isSammelnote, einzelLeistungen, einzelLeistungsNoten, notensystemForLerngruppe, schuelerInSelectedLerngruppe, noteToPoints]);

    useEffect(() => {
        if (schueler && leistungsnachweis && selectedLerngruppe) {
            setHeaderConfig({
                title: `${schueler.lastName}, ${schueler.firstName}`,
                subtitle: <p className="text-sm text-[var(--color-accent-text)]">Einzelauswertung: {leistungsnachweis.name}</p>,
                onBack: () => handleNavigate('leistungsnachweisDetail', selectedLerngruppe.id, undefined, leistungsnachweis.id),
                banner: null,
            });
        }
    }, [schueler, leistungsnachweis, selectedLerngruppe, setHeaderConfig, handleNavigate]);

    const handleAiClick = () => {
        if (isSupporter) {
            setIsAiModalOpen(true);
        } else {
            setIsSupporterModalOpen(true);
        }
    };

    const handleGenerateAiFeedback = async () => {
        if (!aiPrompt.trim() || !schueler || !leistungsnachweis || !noteData || !selectedLerngruppe) return;
    
        setAiError(null);
        setIsGenerating(true);
        setGenerationStatus('');
    
        const MAX_RETRIES = 2;

        let termInstruction = '';
        if (isKlausur) {
            termInstruction = selectedLerngruppe.notensystemId === 'noten_1_6_mit_tendenz'
                ? 'Verwende durchgängig den Begriff "Klassenarbeit" anstelle von "Klausur".\n'
                : 'Verwende durchgängig den Begriff "Klausur".\n';
        } else {
            termInstruction = 'Verwende Begriffe wie "Mitarbeit", "Leistungsstand" oder "Gesamtleistung".\n';
        }

        const baseSystemInstruction = `${termInstruction}Du bist ein erfahrener Pädagoge und formulierst den Fließtext für ein Feedback an SchülerInnen.
Halte dich strikt an die folgenden Regeln:
1.  **Perspektive:** Schreibe direkt aus der Ich-Perspektive des Lehrers ("Mir ist aufgefallen...", nicht "Dem Lehrer ist aufgefallen...").
2.  **Ton:** Das Feedback soll ehrlich, direkt und faktenbasiert sein, ohne Leistungen zu beschönigen. Gleichzeitig soll es wertschätzend und zukunftsorientiert bleiben.
3.  **Inhalt:** Benenne klar Stärken und konkrete Verbesserungspotenziale basierend auf den Leistungsdaten und den Merkmalen des Schülers.
4.  **Keine expliziten Zahlen:** Nenne niemals explizite Punktzahlen oder Prozentwerte. Beschreibe die Leistung qualitativ (z.B. "du hast gute Ansätze gezeigt", "in diesem Bereich konntest du überzeugen").
5.  **Prägnanz:** Formuliere auf den Punkt gebracht.
6.  **Länge:** Formuliere ein prägnantes und hilfreiches Feedback. Eine ideale Länge liegt bei etwa 120 Wörtern.
7.  **Struktur:** Gliedere das Feedback wie folgt: Positiver Einstieg, dann konkreter Verbesserungspunkt, dann handlungsorientierter Ausblick.
8.  **Formatierung:** Beginne deine Antwort direkt mit dem ersten Wort des Feedbacks. Füge KEINE Anrede hinzu.
9.  **Anonymität im Text:** Beziehe dich im Text nicht auf eine spezifische Person und verwende keine Namen.
10. **Inhaltlicher Bezug:** Nutze die Namen/Inhalte der Teilaufgaben/Leistungen, um das Feedback zu konkretisieren.`;

        let finalSystemInstruction = baseSystemInstruction;
    
        if (previousLeistungsnachweisData && previousLeistungsnachweisData.noteData && noteData) {
            const previousPoints = previousLeistungsnachweisData.noteData.averagePoints;
            const currentPoints = noteData.averagePoints;
            const difference = currentPoints - previousPoints;
            const SIGNIFICANCE_THRESHOLD = 3; 
            
            if (difference >= SIGNIFICANCE_THRESHOLD) {
                const improvementInstruction = `Beginne dein Feedback mit einem expliziten, motivierenden Lob für die Steigerung im Vergleich zur vorherigen Leistung ("${previousLeistungsnachweisData.name}"). `;
                finalSystemInstruction = improvementInstruction + baseSystemInstruction;
            } else if (difference <= -SIGNIFICANCE_THRESHOLD) {
                const declineInstruction = `Sprich die Verschlechterung im Vergleich zur vorherigen Leistung ("${previousLeistungsnachweisData.name}") einfühlsam an. `;
                finalSystemInstruction = declineInstruction + baseSystemInstruction;
            }
        }
    
        const anonymizedSchuelerData = { merkmale: schueler.paedagogischeMerkmale || [] };
        
        let leistungDaten: any = {};
        if (isKlausur) {
            // Safe casting: noteData is derived from berechneKlausurNote which returns KlausurNoteMapEntry
            const klausurNote = noteData as KlausurNoteMapEntry; 
            const maxPunkteGesamt = leistungsnachweis.aufgaben?.reduce((sum: number, a: Klausuraufgabe) => sum + Number(a.maxPunkte), 0) || 0;
            const einzelergebnisse = details.map(d => ({ name: d.name, inhalt: d.inhalt, ergebnis: d.valueDisplay }));
            leistungDaten = { gesamtergebnis: `${klausurNote.finalGrade} (${klausurNote.totalPunkte} von ${maxPunkteGesamt} Punkten)`, details: einzelergebnisse };
        } else {
            const einzelergebnisse = details.map(d => ({ name: d.name, note: d.valueDisplay }));
            leistungDaten = { gesamtergebnis: `Note ${noteData.finalGrade}`, details: einzelergebnisse };
        }
    
        const fullPrompt = `Anonymisierte Schülerdaten: ${JSON.stringify(anonymizedSchuelerData)}\nLeistungsdaten: ${JSON.stringify(leistungDaten)}\n\nAnweisung des Lehrers: "${aiPrompt}"\n\nGeneriere nun das Feedback.`;

        for (let i = 0; i <= MAX_RETRIES; i++) {
            try {
                if (i > 0) {
                    setGenerationStatus(`(Versuch ${i + 1}/${MAX_RETRIES + 1})`);
                }

                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: fullPrompt,
                    config: { systemInstruction: finalSystemInstruction }
                });
    
                const rawText = response.text;
                const textWithCommas = rawText.replace(/\b(\d+)\.(\d+)\b/g, '$1,$2');
                
                let anrede: string;
                switch (schueler.gender) {
                    case 'm': anrede = 'Lieber'; break;
                    case 'w': anrede = 'Liebe'; break;
                    case 'd': default: anrede = 'Liebe(r)'; break;
                }
                const fullFeedback = `${anrede} ${schueler.firstName},\n\n${textWithCommas}`;
    
                setFeedbackText(prev => prev ? `${prev}\n\n---\n\n${fullFeedback}` : fullFeedback);
                setIsAiModalOpen(false);
                setAiPrompt("");
                setIsGenerating(false);
                return; // Success, exit loop
    
            } catch (error: any) {
                console.error(`Versuch ${i + 1} fehlgeschlagen:`, error);
                if (i === MAX_RETRIES) {
                    const errorMessage = error.message.toLowerCase();
                    if (errorMessage.includes('safety') || errorMessage.includes('blocked')) {
                        setAiError("Der generierte Text wurde blockiert. Bitte versuchen Sie es erneut oder formulieren Sie Ihre Stichpunkte leicht um.");
                    } else if (errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
                        setAiError("Die KI ist zurzeit ausgelastet. Bitte warten Sie einen Moment und versuchen Sie es dann erneut.");
                    } else {
                        setAiError("Die Anfrage konnte nicht gesendet werden. Bitte prüfen Sie Ihre Internetverbindung.");
                    }
                }
            }
        }
        setIsGenerating(false);
    };
    

    if (!schueler || !leistungsnachweis || !noteData) {
        return <div className="p-4 bg-[var(--color-ui-primary)] rounded-lg"><p className="text-[var(--color-text-secondary)]">Daten werden geladen oder sind nicht verfügbar...</p></div>;
    }
    
    // Derived values for display
    let mainScoreDisplay: React.ReactNode;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let mainScoreSubtext: React.ReactNode;
    
    if (isKlausur) {
        // Safe casting: noteData is guaranteed to be KlausurNoteMapEntry here
        const kn = noteData as KlausurNoteMapEntry;
        const maxPunkte = leistungsnachweis.aufgaben?.reduce((sum: number, a: Klausuraufgabe) => sum + Number(a.maxPunkte), 0) || 0;
        
        // Check if grade is bad (<= 3 points)
        const pointValue = noteToPoints.get(kn.finalGrade);
        const isOverallBadGrade = pointValue !== undefined && pointValue <= 3;
        
        mainScoreDisplay = (
            <div className="flex justify-around items-center text-center">
                <div>
                    <p className="text-sm font-semibold text-[var(--color-text-tertiary)]">Note</p>
                    <p className={`text-6xl font-bold mt-1 ${isOverallBadGrade ? 'text-[var(--color-danger-text)]' : 'text-[var(--color-accent-text)]'}`}>
                        {kn.finalGrade}
                    </p>
                </div>
                <div className="h-20 w-px bg-[var(--color-border)]"></div>
                <div>
                    <p className="text-sm font-semibold text-[var(--color-text-tertiary)]">Punkte</p>
                    <p className="text-4xl font-bold text-[var(--color-text-primary)] mt-2">{kn.totalPunkte.toLocaleString('de-DE')}</p>
                    <p className="text-sm text-[var(--color-text-tertiary)]">von {maxPunkte}</p>
                </div>
                 <div className="h-20 w-px bg-[var(--color-border)]"></div>
                <div>
                    <p className="text-sm font-semibold text-[var(--color-text-tertiary)]">Prozent</p>
                    <p className="text-4xl font-bold text-[var(--color-text-primary)] mt-2">{kn.prozent.toFixed(1).replace('.', ',')}%</p>
                </div>
            </div>
        );
    } else {
        // Sammelnote
        
        // Check if grade is bad (<= 3 points)
        const pointValue = noteToPoints.get(noteData.finalGrade);
        const isOverallBadGrade = pointValue !== undefined && pointValue <= 3;

        mainScoreDisplay = (
            <div className="flex justify-around items-center text-center">
                <div>
                    <p className="text-sm font-semibold text-[var(--color-text-tertiary)]">Gesamtnote</p>
                    <p className={`text-6xl font-bold mt-1 ${isOverallBadGrade ? 'text-[var(--color-danger-text)]' : 'text-[var(--color-accent-text)]'}`}>
                        {noteData.finalGrade}
                    </p>
                </div>
                <div className="h-20 w-px bg-[var(--color-border)]"></div>
                <div>
                    <p className="text-sm font-semibold text-[var(--color-text-tertiary)]">Durchschnitt</p>
                    <p className="text-4xl font-bold text-[var(--color-text-primary)] mt-2">{noteData.displayDecimal}</p>
                    <p className="text-sm text-[var(--color-text-tertiary)]">&nbsp;</p>
                </div>
            </div>
        );
    }
    
    const CHAR_LIMIT = 1000;
    const charCount = feedbackText.length;
    const isOverLimit = charCount > CHAR_LIMIT;
    
    return (
        <>
            <div className="flex flex-col lg:flex-row gap-6 h-full">
                {/* Left Column */}
                <div className="w-full lg:w-2/5 flex flex-col gap-6">
                    {/* Key Metrics */}
                    <div className="bg-[var(--color-ui-primary)] p-6 rounded-lg border border-[var(--color-border)]">
                        <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-4">Gesamtergebnis</h2>
                        {mainScoreDisplay}
                    </div>
                    {/* Details (Tasks or Sub-Grades) */}
                    <div className="bg-[var(--color-ui-primary)] p-6 rounded-lg border border-[var(--color-border)] flex-1 flex flex-col">
                        <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-4">
                            {isKlausur ? 'Aufgabenanalyse' : 'Leistungsübersicht'}
                        </h2>
                        <div className="space-y-4 overflow-y-auto pr-2 -mr-2">
                            {details.map((item, index) => {
                                const isBelow50 = item.percentage < 50;
                                const barColorClass = isBelow50 
                                    ? 'bg-gradient-to-r from-[var(--color-danger-primary-hover)] to-[var(--color-danger-primary)]' 
                                    : 'bg-gradient-to-r from-[var(--color-accent-primary-hover)] to-[var(--color-accent-primary)]';
                                
                                const avgColorClass = item.percentageClass < 50
                                    ? 'bg-gradient-to-r from-[var(--color-danger-primary-hover)] to-[var(--color-danger-primary)]' 
                                    : 'bg-gradient-to-r from-[var(--color-accent-primary-hover)] to-[var(--color-accent-primary)]';

                                return (
                                    <div key={index} className="space-y-1.5">
                                        <div className="flex justify-between items-baseline">
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <span className="font-semibold text-[var(--color-text-primary)] truncate">{item.name}</span>
                                                {item.weighting && (
                                                    <span className="text-xs bg-[var(--color-ui-secondary)] text-[var(--color-text-tertiary)] px-1.5 py-0.5 rounded border border-[var(--color-border)] whitespace-nowrap">x{item.weighting}</span>
                                                )}
                                            </div>
                                            {isSammelnote ? (
                                                <div className="ml-2 whitespace-nowrap text-sm">
                                                    <span className="text-[var(--color-text-tertiary)] mr-1.5">Note:</span>
                                                    <span className={`font-bold ${item.isBadGrade ? 'text-[var(--color-danger-text)]' : 'text-[var(--color-accent-text)]'}`}>{item.valueDisplay}</span>
                                                </div>
                                            ) : (
                                                <span className="text-sm text-[var(--color-text-secondary)] whitespace-nowrap ml-2">{item.valueDisplay}</span>
                                            )}
                                        </div>
                                        {/* Schüler-Balken */}
                                        <div className="w-full bg-[var(--color-ui-secondary)] rounded-md h-5">
                                            <div
                                                className={`relative overflow-hidden glossy-bar ${barColorClass} h-5 rounded-md`}
                                                style={{ width: `${item.percentage}%` }}
                                            ></div>
                                        </div>
                                        {/* Klassen-Durchschnitt */}
                                        <div className="relative w-full bg-[var(--color-ui-secondary)] rounded-md h-5">
                                            <div 
                                                className={`relative overflow-hidden glossy-bar h-full rounded-md ${avgColorClass}`} 
                                                style={{ width: `${item.percentageClass}%` }}
                                                title={`Klassendurchschnitt: ${item.avgDisplay}`}
                                            ></div>
                                            <div className="absolute inset-0 flex items-center justify-center px-2">
                                                <span className="italic text-xs font-bold text-white shadow-black/50 [text-shadow:0_1px_2px_var(--tw-shadow-color)]">
                                                    Klasse: {item.avgDisplay}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="w-full lg:w-3/5 flex flex-col gap-6">
                    <div className="bg-[var(--color-ui-primary)] p-6 rounded-lg border border-[var(--color-border)] flex flex-col flex-1">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center space-x-4">
                                <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Feedback</h2>
                                {saveStatus === 'saving' && (
                                    <div className="flex items-center space-x-2 text-sm text-[var(--color-text-tertiary)] transition-opacity duration-300">
                                        <SpinnerIcon />
                                        <span>Speichern...</span>
                                    </div>
                                )}
                                {saveStatus === 'saved' && (
                                    <div className="flex items-center space-x-2 text-sm text-[var(--color-success-text)] transition-opacity duration-300">
                                        <CheckCircleIcon className="w-5 h-5" />
                                        <span>Gespeichert</span>
                                    </div>
                                )}
                            </div>
                            <Button variant="primary" onClick={handleAiClick} aria-label="KI-Vorschlag für Feedback" className="!px-3">
                                <SparklesIcon className="w-6 h-6 text-yellow-300" />
                                <span className="ml-2">Intelligent</span>
                            </Button>
                        </div>
                        <textarea
                            value={feedbackText}
                            onChange={(e) => setFeedbackText(e.target.value)}
                            placeholder="Schreiben Sie hier ein individuelles Feedback für die Schülerin / den Schüler..."
                            className="w-full flex-1 p-3 bg-[var(--color-ui-secondary)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-border-focus)] transition-colors resize-y"
                        />
                         <div className={`text-right text-xs mt-2 ${isOverLimit ? 'text-[var(--color-danger-text)]' : 'text-[var(--color-text-tertiary)]'}`}>
                            {charCount} / {CHAR_LIMIT} Zeichen
                        </div>
                    </div>

                    <div className="bg-[var(--color-ui-primary)] p-6 rounded-lg border border-[var(--color-border)]">
                         <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-4">
                            Vergleich: <span className="text-[var(--color-accent-text)]">{previousLeistungsnachweisData?.name}</span>
                        </h2>
                        {previousLeistungsnachweisData?.isFirst ? (
                            <div className="flex-1 flex items-center justify-center text-center py-8">
                                <p className="text-sm text-[var(--color-text-tertiary)]">Dies ist der erste Leistungsnachweis dieser Art.</p>
                            </div>
                        ) : previousLeistungsnachweisData?.noteData ? (
                            <div className="flex justify-around items-center text-center">
                                <div>
                                    <p className="text-sm font-semibold text-[var(--color-text-tertiary)]">{isSammelnote ? 'Gesamtnote' : 'Note'}</p>
                                    <p className="text-6xl font-bold text-[var(--color-accent-text)] mt-1">{previousLeistungsnachweisData.noteData.finalGrade}</p>
                                </div>
                                <div className="h-20 w-px bg-[var(--color-border)]"></div>
                                {isKlausur && (
                                    <>
                                        <div>
                                            <p className="text-sm font-semibold text-[var(--color-text-tertiary)]">Punkte</p>
                                            <p className="text-4xl font-bold text-[var(--color-text-primary)] mt-2">{(previousLeistungsnachweisData.noteData as KlausurNoteMapEntry).totalPunkte.toLocaleString('de-DE')}</p>
                                            <p className="text-sm text-[var(--color-text-tertiary)]">von {previousLeistungsnachweisData.maxPunkte}</p>
                                        </div>
                                        <div className="h-20 w-px bg-[var(--color-border)]"></div>
                                        <div>
                                            <p className="text-sm font-semibold text-[var(--color-text-tertiary)]">Prozent</p>
                                            <p className="text-4xl font-bold text-[var(--color-text-primary)] mt-2">{(previousLeistungsnachweisData.noteData as KlausurNoteMapEntry).prozent.toFixed(1).replace('.', ',')}%</p>
                                        </div>
                                    </>
                                )}
                                {isSammelnote && (
                                    <div>
                                        <p className="text-sm font-semibold text-[var(--color-text-tertiary)]">Durchschnitt</p>
                                        <p className="text-4xl font-bold text-[var(--color-text-primary)] mt-2">{previousLeistungsnachweisData.noteData.displayDecimal}</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-center py-8">
                                <p className="text-sm text-[var(--color-text-tertiary)]">Für den vorherigen Leistungsnachweis wurden für diese/n SchülerIn keine Noten eingetragen.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <SchuelerFeedbackAiModal
                isOpen={isAiModalOpen}
                onClose={() => setIsAiModalOpen(false)}
                onGenerate={handleGenerateAiFeedback}
                isGenerating={isGenerating}
                aiError={aiError}
                prompt={aiPrompt}
                setPrompt={setAiPrompt}
                generationStatus={generationStatus}
            />
            <SupporterModal
                isOpen={isSupporterModalOpen}
                onClose={() => setIsSupporterModalOpen(false)}
            />
        </>
    );
};

export default SchuelerAuswertungView;
