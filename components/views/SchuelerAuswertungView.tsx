import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useUIContext } from '../../context/UIContext';
import { useLerngruppenContext } from '../../context/LerngruppenContext';
import { useNotenContext } from '../../context/NotenContext';
import { useToolsContext } from '../../context/ToolsContext';
import { berechneKlausurNote } from '../../services/NotenberechnungService';
import { SparklesIcon, SpinnerIcon, CheckCircleIcon } from '../icons';
import Button from '../ui/Button';
import SchuelerFeedbackAiModal from '../modals/SchuelerFeedbackAiModal';
import { Schueler, Leistungsnachweis, Notenkategorie } from '../../context/types';

const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
}

const SchuelerAuswertungView: React.FC = () => {
    const {
        selectedSchuelerId,
        selectedLeistungsnachweisId,
        setHeaderConfig,
        handleNavigate,
    } = useUIContext();
    
    const { allSchueler, selectedLerngruppe } = useLerngruppenContext();
    
    const {
        leistungsnachweise,
        notensystemForLerngruppe,
        klausuraufgabePunkte,
        notenschluesselMap,
        schuelerLeistungsnachweisFeedback,
        onUpdateSchuelerLeistungsnachweisFeedback,
        notenkategorien,
    } = useNotenContext();

    const { ai } = useToolsContext();

    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const [aiPrompt, setAiPrompt] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);
    const [generationStatus, setGenerationStatus] = useState('');
    
    const [feedbackText, setFeedbackText] = useState('');
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
    const debounceTimeoutRef = useRef<number | null>(null);
    const initialLoadDone = useRef(false);
    const statusTimeoutRef = useRef<number | null>(null);

    const schueler = useMemo(() => 
        allSchueler.find((s: Schueler) => s.id === selectedSchuelerId), 
    [allSchueler, selectedSchuelerId]);

    const leistungsnachweis = useMemo(() => 
        leistungsnachweise.find(ln => ln.id === selectedLeistungsnachweisId && ln.typ === 'klausur'),
    [leistungsnachweise, selectedLeistungsnachweisId]);
    
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


    const schuelerNoteData = useMemo(() => {
        if (!schueler || !leistungsnachweis || !notensystemForLerngruppe || !selectedLerngruppe) {
            return null;
        }

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
    }, [schueler, leistungsnachweis, notensystemForLerngruppe, selectedLerngruppe, klausuraufgabePunkte, notenschluesselMap]);

    const previousKlausurData = useMemo(() => {
        if (!leistungsnachweis || !selectedLerngruppe || !schueler || !notensystemForLerngruppe) return null;
    
        const notenkategorie = notenkategorien.find((nk: Notenkategorie) => nk.id === leistungsnachweis.notenkategorieId);
        if (!notenkategorie) return null;
    
        const alleKlausurenDerKategorie = leistungsnachweise
            .filter((ln: Leistungsnachweis) => ln.notenkategorieId === notenkategorie.id && ln.typ === 'klausur')
            .sort((a, b) => a.order - b.order);
    
        const currentIndex = alleKlausurenDerKategorie.findIndex(ln => ln.id === leistungsnachweis.id);
    
        if (currentIndex <= 0) {
            return { isFirst: true };
        }
    
        const previousKlausur = alleKlausurenDerKategorie[currentIndex - 1];
    
        const punkteMap = new Map<string, number | null>();
        klausuraufgabePunkte.forEach(p => punkteMap.set(`${p.schuelerId}-${p.aufgabeId}`, p.punkte));
    
        const resultMap = berechneKlausurNote(
            [schueler],
            previousKlausur.aufgaben || [],
            punkteMap,
            previousKlausur,
            notensystemForLerngruppe,
            selectedLerngruppe,
            notenschluesselMap
        );
    
        const noteData = resultMap.get(schueler.id);
        const maxPunkteGesamt = previousKlausur.aufgaben?.reduce((sum, a) => sum + a.maxPunkte, 0) || 0;
    
        return {
            isFirst: false,
            name: previousKlausur.name,
            noteData: noteData || null,
            maxPunkteGesamt,
        };
    
    }, [leistungsnachweis, selectedLerngruppe, schueler, notensystemForLerngruppe, notenkategorien, leistungsnachweise, klausuraufgabePunkte, notenschluesselMap]);


    const aufgabenDetails = useMemo(() => {
        if (!leistungsnachweis?.aufgaben || !schueler || !selectedLerngruppe) return [];

        const schuelerInLerngruppe = allSchueler.filter(s => selectedLerngruppe.schuelerIds.includes(s.id));

        return leistungsnachweis.aufgaben.map(aufgabe => {
            // Schüler-spezifische Berechnung
            const punkteEintrag = klausuraufgabePunkte.find(p => p.schuelerId === schueler.id && p.aufgabeId === aufgabe.id);
            const erreichtePunkte = punkteEintrag?.punkte ?? 0;
            const prozent = aufgabe.maxPunkte > 0 ? (erreichtePunkte / aufgabe.maxPunkte) * 100 : 0;
            
            // Klassen-Durchschnittsberechnung
            let totalPunkteKlasse = 0;
            let teilnehmerKlasse = 0;
            schuelerInLerngruppe.forEach((s: Schueler) => {
                const klassenPunkteEintrag = klausuraufgabePunkte.find(p => p.schuelerId === s.id && p.aufgabeId === aufgabe.id);
                if (klassenPunkteEintrag) {
                    totalPunkteKlasse += klassenPunkteEintrag.punkte;
                    teilnehmerKlasse++;
                }
            });
            const durchschnittPunkteKlasse = teilnehmerKlasse > 0 ? totalPunkteKlasse / teilnehmerKlasse : 0;
            const prozentKlasse = aufgabe.maxPunkte > 0 ? (durchschnittPunkteKlasse / aufgabe.maxPunkte) * 100 : 0;

            return { ...aufgabe, erreichtePunkte, prozent, durchschnittPunkteKlasse, prozentKlasse };
        });
    }, [leistungsnachweis, schueler, klausuraufgabePunkte, allSchueler, selectedLerngruppe]);

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

    const handleGenerateAiFeedback = async () => {
        if (!aiPrompt.trim() || !schueler || !leistungsnachweis || !schuelerNoteData || !selectedLerngruppe) return;
    
        setAiError(null);
        setIsGenerating(true);
        setGenerationStatus('');
    
        const MAX_RETRIES = 2;

        const termInstruction = selectedLerngruppe.notensystemId === 'noten_1_6_mit_tendenz'
            ? 'Verwende durchgängig den Begriff "Klassenarbeit" anstelle von "Klausur".\n'
            : 'Verwende durchgängig den Begriff "Klausur".\n';

        const baseSystemInstruction = `${termInstruction}Du bist ein erfahrener Pädagoge und formulierst den Fließtext für ein Feedback an SchülerInnen.
Halte dich strikt an die folgenden Regeln:
1.  **Perspektive:** Schreibe direkt aus der Ich-Perspektive des Lehrers ("Mir ist aufgefallen...", nicht "Dem Lehrer ist aufgefallen...").
2.  **Ton:** Das Feedback soll ehrlich, direkt und faktenbasiert sein, ohne Leistungen zu beschönigen. Gleichzeitig soll es wertschätzend und zukunftsorientiert bleiben.
3.  **Inhalt:** Benenne klar Stärken und konkrete Verbesserungspotenziale basierend auf den Klausurdaten und den Merkmalen des Schülers.
4.  **Keine expliziten Zahlen:** Nenne niemals explizite Punktzahlen, Prozentwerte oder die finale Note (z.B. "15 von 30 Punkten" oder "Note 4"). Beschreibe die Leistung qualitativ (z.B. "du hast bei vielen Aufgaben gute Ansätze gezeigt", "insbesondere im ersten Teil der Klausur konntest du überzeugen").
5.  **Prägnanz:** Formuliere auf den Punkt gebracht. Vermeide Offensichtlichkeiten wie "Ich habe deine Klausur korrigiert".
6.  **Länge:** Formuliere ein prägnantes und hilfreiches Feedback. Eine ideale Länge liegt bei etwa 120 Wörtern. Überschreite KEINESFALLS 150 Wörter.
7.  **Struktur:** Gliedere das Feedback wie folgt: Positiver Einstieg, dann konkreter Verbesserungspunkt, dann handlungsorientierter Ausblick. Verwende maximal 2 Absätze.
8.  **Formatierung:** Beginne deine Antwort direkt mit dem ersten Wort des Feedbacks. Füge KEINE Anrede (z.B. "Lieber Max,") oder sonstige Einleitungsfloskeln hinzu. Das erste Wort muss kleingeschrieben sein, es sei denn, es ist ein Substantiv. Gib als Antwort NUR den Fließtext des Feedbacks zurück.
9.  **Anonymität im Text:** Beziehe dich im Text nicht auf eine spezifische Person und verwende keine Namen.
10. **Inhaltlicher Bezug:** Wenn zu den Aufgaben Themen oder Inhalte angegeben sind (Feld 'inhalt'), nutze diese für das Feedback. Statt nur 'Aufgabe 1 war gut' zu schreiben, schreibe z.B. 'Im Bereich [Thema] hast du solide Kenntnisse gezeigt'.`;

        let finalSystemInstruction = baseSystemInstruction;
    
        if (previousKlausurData && previousKlausurData.noteData && schuelerNoteData) {
            const previousPoints = previousKlausurData.noteData.averagePoints;
            const currentPoints = schuelerNoteData.averagePoints;
            const difference = currentPoints - previousPoints;
            const SIGNIFICANCE_THRESHOLD = 3;
    
            if (difference >= SIGNIFICANCE_THRESHOLD) {
                const improvementInstruction = `Beginne dein Feedback mit einem expliziten, motivierenden Lob für die Steigerung im Vergleich zur Vorklausur. `;
                finalSystemInstruction = improvementInstruction + baseSystemInstruction;
            } else if (difference <= -SIGNIFICANCE_THRESHOLD) {
                const declineInstruction = `Sprich die Verschlechterung im Vergleich zur Vorklausur einfühlsam an und formuliere eine offene Frage, um zum Nachdenken anzuregen, woran es gelegen haben könnte. `;
                finalSystemInstruction = declineInstruction + baseSystemInstruction;
            }
        }
    
        const anonymizedSchuelerData = { merkmale: schueler.paedagogischeMerkmale || [] };
        const aufgabenErgebnisse = aufgabenDetails.map(a => ({ name: a.name, inhalt: a.inhalt, erreicht: a.erreichtePunkte, max: a.maxPunkte, }));
        const maxPunkteGesamt = leistungsnachweis.aufgaben?.reduce((sum, a) => sum + a.maxPunkte, 0) || 0;
        const klausurDaten = { gesamtergebnis: `${schuelerNoteData.finalGrade} (${schuelerNoteData.totalPunkte} von ${maxPunkteGesamt} Punkten, ${schuelerNoteData.prozent.toFixed(1)}%)`, einzelergebnisse: aufgabenErgebnisse };
    
        const fullPrompt = `Anonymisierte Schülerdaten: ${JSON.stringify(anonymizedSchuelerData)}\nKlausurdaten: ${JSON.stringify(klausurDaten)}\n\nAnweisung des Lehrers: "${aiPrompt}"\n\nGeneriere nun das Feedback.`;

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
    

    if (!schueler || !leistungsnachweis || !schuelerNoteData) {
        return <div className="p-4 bg-[var(--color-ui-primary)] rounded-lg"><p className="text-[var(--color-text-secondary)]">Daten werden geladen oder sind nicht verfügbar...</p></div>;
    }
    
    const maxPunkteGesamt = leistungsnachweis.aufgaben?.reduce((sum, a) => sum + a.maxPunkte, 0) || 0;
    
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
                        <div className="flex justify-around items-center text-center">
                            <div>
                                <p className="text-sm font-semibold text-[var(--color-text-tertiary)]">Note</p>
                                <p className="text-6xl font-bold text-[var(--color-accent-text)] mt-1">{schuelerNoteData.finalGrade}</p>
                            </div>
                            <div className="h-20 w-px bg-[var(--color-border)]"></div>
                            <div>
                                <p className="text-sm font-semibold text-[var(--color-text-tertiary)]">Punkte</p>
                                <p className="text-4xl font-bold text-[var(--color-text-primary)] mt-2">{schuelerNoteData.totalPunkte.toLocaleString('de-DE')}</p>
                                <p className="text-sm text-[var(--color-text-tertiary)]">von {maxPunkteGesamt}</p>
                            </div>
                             <div className="h-20 w-px bg-[var(--color-border)]"></div>
                            <div>
                                <p className="text-sm font-semibold text-[var(--color-text-tertiary)]">Prozent</p>
                                <p className="text-4xl font-bold text-[var(--color-text-primary)] mt-2">{schuelerNoteData.prozent.toFixed(1).replace('.', ',')}%</p>
                            </div>
                        </div>
                    </div>
                    {/* Aufgabenanalyse */}
                    <div className="bg-[var(--color-ui-primary)] p-6 rounded-lg border border-[var(--color-border)] flex-1 flex flex-col">
                        <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-4">Aufgabenanalyse</h2>
                        <div className="space-y-4 overflow-y-auto pr-2 -mr-2">
                            {aufgabenDetails.map((aufgabe, index) => {
                                return (
                                    <div key={index} className="space-y-1.5">
                                        <div className="flex justify-between items-baseline">
                                            <span className="font-semibold text-[var(--color-text-primary)]">{aufgabe.name}</span>
                                            <span className="text-sm text-[var(--color-text-secondary)]">{aufgabe.erreichtePunkte.toLocaleString('de-DE')} von {aufgabe.maxPunkte} P. ({aufgabe.prozent.toFixed(1).replace('.', ',')}%)</span>
                                        </div>
                                        {/* Schüler-Balken */}
                                        <div className="w-full bg-[var(--color-ui-secondary)] rounded-md h-5">
                                            <div
                                                className={`relative overflow-hidden glossy-bar ${aufgabe.prozent < 50 ? 'bg-gradient-to-r from-[var(--color-danger-primary-hover)] to-[var(--color-danger-primary)]' : 'bg-gradient-to-r from-[var(--color-accent-primary-hover)] to-[var(--color-accent-primary)]'} h-5 rounded-md`}
                                                style={{ width: `${aufgabe.prozent}%` }}
                                            ></div>
                                        </div>
                                        {/* Klassen-Durchschnitt */}
                                        <div className="relative w-full bg-[var(--color-ui-secondary)] rounded-md h-5">
                                            <div 
                                                className={`relative overflow-hidden glossy-bar h-full rounded-md ${aufgabe.prozentKlasse < 50 ? 'bg-gradient-to-r from-[var(--color-danger-primary-hover)] to-[var(--color-danger-primary)]' : 'bg-gradient-to-r from-[var(--color-accent-primary-hover)] to-[var(--color-accent-primary)]'}`} 
                                                style={{ width: `${aufgabe.prozentKlasse}%` }}
                                                title={`Klassendurchschnitt: ${aufgabe.durchschnittPunkteKlasse.toFixed(1).replace('.', ',')} P. (${aufgabe.prozentKlasse.toFixed(1).replace('.', ',')}%)`}
                                            ></div>
                                            <div className="absolute inset-0 flex items-center justify-center px-2">
                                                <span className="italic text-xs font-bold text-white shadow-black/50 [text-shadow:0_1px_2px_var(--tw-shadow-color)]">
                                                    Klasse: {aufgabe.durchschnittPunkteKlasse.toFixed(1).replace('.', ',')} P. ({aufgabe.prozentKlasse.toFixed(1).replace('.', ',')}%)
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
                            <Button variant="primary" onClick={() => setIsAiModalOpen(true)} aria-label="KI-Vorschlag für Feedback" className="!px-3">
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
                            Vergleich zur letzten Klausur - <span className="text-[var(--color-accent-text)]">{previousKlausurData?.name}</span>
                        </h2>
                        {previousKlausurData?.isFirst ? (
                            <div className="flex-1 flex items-center justify-center text-center py-8">
                                <p className="text-sm text-[var(--color-text-tertiary)]">Dies ist die erste schriftliche Leistungsüberprüfung.</p>
                            </div>
                        ) : previousKlausurData?.noteData ? (
                            <div className="flex justify-around items-center text-center">
                                <div>
                                    <p className="text-sm font-semibold text-[var(--color-text-tertiary)]">Note</p>
                                    <p className="text-6xl font-bold text-[var(--color-accent-text)] mt-1">{previousKlausurData.noteData.finalGrade}</p>
                                </div>
                                <div className="h-20 w-px bg-[var(--color-border)]"></div>
                                <div>
                                    <p className="text-sm font-semibold text-[var(--color-text-tertiary)]">Punkte</p>
                                    <p className="text-4xl font-bold text-[var(--color-text-primary)] mt-2">{previousKlausurData.noteData.totalPunkte.toLocaleString('de-DE')}</p>
                                    <p className="text-sm text-[var(--color-text-tertiary)]">von {previousKlausurData.maxPunkteGesamt}</p>
                                </div>
                                <div className="h-20 w-px bg-[var(--color-border)]"></div>
                                <div>
                                    <p className="text-sm font-semibold text-[var(--color-text-tertiary)]">Prozent</p>
                                    <p className="text-4xl font-bold text-[var(--color-text-primary)] mt-2">{previousKlausurData.noteData.prozent.toFixed(1).replace('.', ',')}%</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-center py-8">
                                <p className="text-sm text-[var(--color-text-tertiary)]">Für die vorherige Klausur wurden für diese/n SchülerIn keine Punkte eingetragen.</p>
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
        </>
    );
};

export default SchuelerAuswertungView;