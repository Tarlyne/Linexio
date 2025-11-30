import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useLerngruppenContext } from '../../context/LerngruppenContext';
import { Schueler } from '../../context/types';
import Button from '../ui/Button';
import { PlusIcon, SparklesIcon, AdjustmentsHorizontalIcon, UsersIcon, ChevronDownIcon, InformationCircleIcon } from '../icons';
import Select from '../ui/Select';
import Input from '../ui/Input';
import SchuelerDndCard from '../ui/SchuelerDndCard';
import IntelligenteGruppeneinteilungModal from '../modals/IntelligenteGruppeneinteilungModal';
import { useToolsContext } from '../../context/ToolsContext';
import { useSchuelerDragAndDrop } from '../../hooks/useSchuelerDragAndDrop';
import { useUIContext } from '../../context/UIContext';
import SegmentedControl, { SegmentedControlOption } from '../ui/SegmentedControl';

type Mode = 'zufällig' | 'manuell' | 'intelligent';
type EinteilungNach = 'groupCount' | 'groupSize';
type Kriterium = 'zufaellig' | 'geschlechtAusgleich' | 'geschlechterTrennen';

const GruppeneinteilungView: React.FC = () => {
    const {
        selectedLerngruppe,
        schuelerInSelectedLerngruppe,
    } = useLerngruppenContext();
    
    const { onBackToLerngruppeDetail, currentSchoolYear, systemSchoolYear, onSetCurrentSchoolYear, setHeaderConfig } = useUIContext();
    const { ai } = useToolsContext();

    const [mode, setMode] = useState<Mode>('zufällig');
    const [einteilungNach, setEinteilungNach] = useState<EinteilungNach>('groupCount');
    const [anzahl, setAnzahl] = useState<string>('2');
    const [kriterium, setKriterium] = useState<Kriterium>('zufaellig');
    
    const [gruppen, setGruppen] = useState<Schueler[][]>([]);
    const [nichtZugeordnet, setNichtZugeordnet] = useState<Schueler[]>([]);
    
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);
    const [aiPrompt, setAiPrompt] = useState('');
    
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isSchuelerListOpen, setIsSchuelerListOpen] = useState(true);

    const generateButtonRef = useRef<HTMLButtonElement>(null);
    const settingsButtonRef = useRef<HTMLButtonElement>(null);
    const settingsPanelRef = useRef<HTMLDivElement>(null);
    const schuelerListButtonRef = useRef<HTMLButtonElement>(null);
    
    const isArchivedView = currentSchoolYear !== systemSchoolYear;

    useEffect(() => {
        if(selectedLerngruppe) {
            const banner = isArchivedView ? (
                <div className="flex-shrink-0 bg-[var(--color-warning-primary-transparent)] text-[var(--color-text-primary)] px-6 md:px-8 py-2 flex items-center justify-between shadow-lg z-10">
                    <div className="flex items-center space-x-3">
                    <InformationCircleIcon className="w-6 h-6" />
                    <p className="text-sm font-semibold">
                        Sie betrachten das Archiv-Schuljahr <span className="font-bold underline">{currentSchoolYear}</span>.
                    </p>
                    </div>
                    <button onClick={() => onSetCurrentSchoolYear(systemSchoolYear)} className="text-sm font-bold hover:underline">
                    Zurück zum aktuellen Schuljahr ({systemSchoolYear}) →
                    </button>
                </div>
            ) : null;

            setHeaderConfig({
                title: 'Gruppeneinteilung',
                subtitle: <p className="text-sm text-[var(--color-accent-text)]">{selectedLerngruppe.name}</p>,
                onBack: onBackToLerngruppeDetail,
                banner: banner,
            });
            return () => {
                setHeaderConfig(prev => ({ ...prev, banner: null }));
            }
        }
    }, [selectedLerngruppe, isArchivedView, currentSchoolYear, systemSchoolYear, onSetCurrentSchoolYear, setHeaderConfig, onBackToLerngruppeDetail]);

    useEffect(() => {
        setNichtZugeordnet([...schuelerInSelectedLerngruppe].sort((a,b) => a.lastName.localeCompare(b.lastName)));
        setGruppen([]);
        setIsSchuelerListOpen(true);
    }, [schuelerInSelectedLerngruppe]);
    
    useEffect(() => {
        if (nichtZugeordnet.length === 0 && gruppen.length > 0) {
            setIsSchuelerListOpen(false);
        } else if (nichtZugeordnet.length > 0 && gruppen.length === 0) {
            setIsSchuelerListOpen(true);
        }
    }, [nichtZugeordnet.length, gruppen.length]);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                settingsPanelRef.current &&
                !settingsPanelRef.current.contains(event.target as Node) &&
                settingsButtonRef.current &&
                !settingsButtonRef.current.contains(event.target as Node)
            ) {
                setIsSettingsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const schuelerColumnWidth = useMemo(() => {
        const longestNameLength = Math.max(0, ...schuelerInSelectedLerngruppe.map((s: Schueler) => s.lastName.length + s.firstName.length + 2)); // +2 for ", "
        const baseWidth = 80;
        const charWidth = 8;
        let calculatedWidth = baseWidth + longestNameLength * charWidth;
        calculatedWidth = Math.max(200, calculatedWidth);
        calculatedWidth = Math.min(320, calculatedWidth);
        return calculatedWidth;
    }, [schuelerInSelectedLerngruppe]);

    const shuffleArray = <T,>(array: T[]): T[] => {
        let currentIndex = array.length, randomIndex;
        while (currentIndex !== 0) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
            [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
        }
        return array;
    }

    const handleGenerate = useCallback(() => {
        const anzahlNum = parseInt(anzahl, 10) || 1;
        const generateGroupsForPool = (pool: Schueler[], nach: EinteilungNach, num: number): Schueler[][] => {
            if (pool.length === 0 || num <= 0) return [];
            
            let numGruppen = (nach === 'groupCount') ? Math.max(1, num) : Math.max(1, Math.round(pool.length / num));
            numGruppen = Math.min(pool.length, numGruppen);

            const shuffledPool = shuffleArray([...pool]);
            const newGruppen: Schueler[][] = Array.from({ length: numGruppen }, () => []);
            shuffledPool.forEach((schueler, index) => {
                newGruppen[index % numGruppen].push(schueler);
            });
            return newGruppen;
        };
        
        let schuelerPool = [...schuelerInSelectedLerngruppe];
        if (kriterium === 'geschlechterTrennen') {
            const jungs = schuelerPool.filter(s => s.gender === 'm');
            const maedchen = schuelerPool.filter(s => s.gender === 'w' || s.gender === 'd');
            const jungsGruppen = generateGroupsForPool(jungs, einteilungNach, anzahlNum);
            const maedchenGruppen = generateGroupsForPool(maedchen, einteilungNach, anzahlNum);
            setGruppen([...jungsGruppen, ...maedchenGruppen]);
            setNichtZugeordnet([]);
            generateButtonRef.current?.blur();
            return;
        }
        
        let shuffledSchueler: Schueler[] = [];
        if (kriterium === 'geschlechtAusgleich') {
            const maenner = shuffleArray(schuelerPool.filter(s => s.gender === 'm'));
            const frauen = shuffleArray(schuelerPool.filter(s => s.gender === 'w' || s.gender === 'd'));
            let mIndex = 0, fIndex = 0;
            while(mIndex < maenner.length || fIndex < frauen.length) {
                if(mIndex < maenner.length) shuffledSchueler.push(maenner[mIndex++]);
                if(fIndex < frauen.length) shuffledSchueler.push(frauen[fIndex++]);
            }
        } else {
             shuffledSchueler = shuffleArray(schuelerPool);
        }

        let numGruppen = (einteilungNach === 'groupCount') ? Math.max(1, anzahlNum) : (anzahlNum > 0 ? Math.max(1, Math.round(shuffledSchueler.length / anzahlNum)) : 1);
        numGruppen = Math.min(shuffledSchueler.length, numGruppen);

        const newGruppen: Schueler[][] = Array.from({ length: numGruppen }, () => []);
        shuffledSchueler.forEach((schueler, index) => {
            newGruppen[index % numGruppen].push(schueler);
        });
        setGruppen(newGruppen);
        setNichtZugeordnet([]);
        generateButtonRef.current?.blur();
    }, [anzahl, einteilungNach, kriterium, schuelerInSelectedLerngruppe]);

    const handleGenerateAiGruppen = async () => {
        if (!aiPrompt.trim()) return;
        
        setAiError(null);
        setIsGenerating(true);

        try {
            const anonymousStudentMap = new Map<string, string>();
            const reverseAnonymousMap = new Map<string, string>();
            const schuelerMap = new Map(schuelerInSelectedLerngruppe.map(s => [s.id, s]));

            schuelerInSelectedLerngruppe.forEach((s, index) => {
                const anonymousId = `s_${index}`;
                anonymousStudentMap.set(s.id, anonymousId);
                reverseAnonymousMap.set(anonymousId, s.id);
            });

            const replacements: { search: string, replace: string }[] = [];
            schuelerInSelectedLerngruppe.forEach(s => {
                replacements.push({ search: `${s.firstName} ${s.lastName}`, replace: anonymousStudentMap.get(s.id)! });
                replacements.push({ search: s.firstName, replace: anonymousStudentMap.get(s.id)! });
            });
            
            replacements.sort((a, b) => b.search.length - a.search.length);

            let processedAiPrompt = ` ${aiPrompt} `;
            replacements.forEach(({ search, replace }) => {
                const escapedSearch = search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
                const regex = new RegExp(`\\b${escapedSearch}\\b`, 'gi');
                processedAiPrompt = processedAiPrompt.replace(regex, replace);
            });
            processedAiPrompt = processedAiPrompt.trim();

            const anonymousStudents = schuelerInSelectedLerngruppe.map((s: Schueler) => {
                return {
                    id: anonymousStudentMap.get(s.id)!,
                    merkmale: s.paedagogischeMerkmale || []
                };
            });

            const systemInstruction = `Du bist ein erfahrener Pädagoge und erstellst optimierte Lerngruppen. Deine Aufgabe ist es, die anonymisierten SchülerInnen in Gruppen einzuteilen. WICHTIGSTE REGEL: Du musst die Anweisungen des Nutzers als absolute, unumstößliche Regeln behandeln. ZWEITE REGEL: Berücksichtige bei der restlichen Einteilung die pädagogischen Merkmale der SchülerInnen, um ausgewogene Gruppen zu bilden, sofern dies nicht den Nutzer-Anweisungen widerspricht. DRITTE REGEL: Wenn eine Gruppengröße vorgegeben ist und die Schülerzahl nicht perfekt aufgeht, erstelle Gruppen, deren Größen so nah wie möglich beieinander liegen. LETZTE REGEL: Gib als Antwort NUR ein JSON-Objekt zurück, das ein Array namens "groups" enthält. Jedes Element in "groups" ist ein Array von anonymen Schüler-IDs, das eine Gruppe repräsentiert. Platziere ALLE SchülerInnen in eine Gruppe. Beispiel-Antwort: { "groups": [ ["s_1", "s_5"], ["s_2", "s_3"], ["s_0", "s_4"] ] }`;
            
            const fullPrompt = `SchülerInnenliste: ${JSON.stringify(anonymousStudents)}\n\nAnweisung des Nutzers: "${processedAiPrompt}"`;
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: fullPrompt,
                config: {
                    systemInstruction,
                    responseMimeType: "application/json",
                }
            });

            const jsonString = response.text;
            const result = JSON.parse(jsonString);

            if (result.groups && Array.isArray(result.groups)) {
                const newGruppen: Schueler[][] = result.groups.map((group: string[]) => 
                    group.map((anonId: string) => {
                        const realId = reverseAnonymousMap.get(anonId);
                        return realId ? schuelerMap.get(realId) : null;
                    }).filter((s): s is Schueler => s !== null)
                );
                
                const placedStudents = new Set(newGruppen.flat().map(s => s.id));
                const newNichtZugeordnet = schuelerInSelectedLerngruppe.filter(s => !placedStudents.has(s.id));
                
                setGruppen(newGruppen);
                setNichtZugeordnet(newNichtZugeordnet);
                setIsAiModalOpen(false);
            } else {
                throw new Error("Ungültiges Antwortformat von der KI.");
            }

        } catch (error) {
            console.error("Fehler bei der KI-Anfrage:", error);
            setAiError("Ein Fehler ist aufgetreten. Bitte prüfen Sie Ihre Anweisung oder versuchen Sie es erneut.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleReset = () => {
        setGruppen([]);
        setNichtZugeordnet([...schuelerInSelectedLerngruppe].sort((a,b) => a.lastName.localeCompare(b.lastName)));
    };
    
    const handleAddNewGroup = () => {
        setGruppen(prev => [...prev, []]);
    };

    const handleDrop = useCallback((
        draggedItem: { schueler: Schueler; source: number | null },
        targetIndex: number | null
    ) => {
        if (targetIndex !== null && targetIndex !== draggedItem.source) {
            const { schueler, source: sourceIndex } = draggedItem;
            const newGruppen = [...gruppen];
            let newNichtZugeordnet = [...nichtZugeordnet];

            if (sourceIndex === null) {
                newNichtZugeordnet = newNichtZugeordnet.filter(s => s.id !== schueler.id);
            } else {
                newGruppen[sourceIndex] = newGruppen[sourceIndex].filter(s => s.id !== schueler.id);
            }

            if (targetIndex === -1) {
                newNichtZugeordnet.push(schueler);
                newNichtZugeordnet.sort((a,b) => a.lastName.localeCompare(b.lastName));
            } else {
                newGruppen[targetIndex].push(schueler);
            }
            setGruppen(newGruppen);
            setNichtZugeordnet(newNichtZugeordnet);
        }
    }, [gruppen, nichtZugeordnet, setGruppen, setNichtZugeordnet]);

    const { draggedItem, ghostPosition, startDrag, dropTargetRef } = useSchuelerDragAndDrop<number | null, number>({ onDrop: handleDrop });

    const handleTouchStart = (e: React.TouchEvent, schueler: Schueler, gruppeIndex: number | null) => {
        e.preventDefault();
        startDrag(e, schueler, gruppeIndex);
    };

    const modeOptions: SegmentedControlOption<Mode>[] = [
        { value: 'zufällig', label: 'Zufällig' },
        { value: 'manuell', label: 'Manuell' },
        { value: 'intelligent', label: 'Intelligent', icon: <SparklesIcon className="w-5 h-5 text-yellow-300"/> },
    ];

    if (!selectedLerngruppe) return null;

    return (
      <div className="flex flex-col h-full">
        {draggedItem && ghostPosition && (
            <div className="fixed top-0 left-0 pointer-events-none z-50 transform -translate-x-1/2 -translate-y-1/2" style={{ left: ghostPosition.x, top: ghostPosition.y }}>
                <div className="w-64 opacity-80"><SchuelerDndCard schueler={draggedItem.schueler} isGhost /></div>
            </div>
        )}

        {/* Control Bar */}
        <div className="flex-shrink-0 flex flex-col gap-4 mb-4">
            <div className="bg-[var(--color-ui-primary)] p-2 rounded-lg border border-[var(--color-border)] flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <Button
                        ref={schuelerListButtonRef}
                        variant="secondary"
                        onClick={() => { setIsSchuelerListOpen(p => !p); schuelerListButtonRef.current?.blur(); }}
                        className={`relative ${isSchuelerListOpen ? '!bg-[var(--color-accent-secondary-transparent-50)]' : ''}`}
                        aria-label={isSchuelerListOpen ? "SchülerInnenliste ausblenden" : "SchülerInnenliste einblenden"}
                    >
                        <UsersIcon className="w-6 h-6"/>
                        <span className="absolute -top-1 -right-1 bg-[var(--color-accent-primary)] text-[var(--color-text-primary)] text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-[var(--color-ui-primary)]">
                            {nichtZugeordnet.length}
                        </span>
                    </Button>
                    <div className="w-full max-w-sm">
                        <SegmentedControl
                            name="Einteilungsmodus"
                            options={modeOptions}
                            value={mode}
                            onChange={(value) => setMode(value)}
                        />
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    {mode === 'zufällig' && (
                        <>
                            <Button ref={settingsButtonRef} variant="secondary" onClick={() => setIsSettingsOpen(p => !p)} className="!px-3">
                                <span>Einstellungen</span>
                                <ChevronDownIcon className={`w-5 h-5 ml-2 transform transition-transform ${isSettingsOpen ? 'rotate-180' : ''}`} />
                            </Button>
                            <Button ref={generateButtonRef} onClick={handleGenerate} disabled={!anzahl.trim()}>Generieren</Button>
                        </>
                    )}
                    {mode === 'manuell' && (
                       <Button onClick={handleAddNewGroup}><PlusIcon/>Neue Gruppe</Button>
                    )}
                    {mode === 'intelligent' && (
                        <Button onClick={() => { setAiError(null); setIsAiModalOpen(true); }}>
                            <SparklesIcon className="w-5 h-5 text-yellow-300"/>
                            <span>Intelligente Einteilung</span>
                        </Button>
                    )}
                    <Button onClick={handleReset} variant="secondary" disabled={gruppen.length === 0 && nichtZugeordnet.length === schuelerInSelectedLerngruppe.length}>Zurücksetzen</Button>
                </div>
            </div>

            <div ref={settingsPanelRef} className={`transition-all duration-300 ease-in-out overflow-hidden ${isSettingsOpen && mode === 'zufällig' ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="bg-[var(--color-ui-primary)] p-4 rounded-lg border border-[var(--color-border)]">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <Select label="Einteilung nach" id="einteilung-nach" value={einteilungNach} onChange={e => setEinteilungNach(e.target.value as EinteilungNach)} options={[ { value: 'groupCount', label: 'Anzahl der Gruppen' }, { value: 'groupSize', label: 'Personen pro Gruppe' } ]} />
                        <Input label={einteilungNach === 'groupCount' ? 'Anzahl Gruppen' : 'Personen pro Gruppe'} id="anzahl" type="number" min="1" value={anzahl} onChange={e => setAnzahl(e.target.value)} />
                        <Select label="Kriterien" id="kriterien" value={kriterium} onChange={e => setKriterium(e.target.value as Kriterium)} options={[ { value: 'zufaellig', label: 'Zufällig mischen' }, { value: 'geschlechtAusgleich', label: 'Geschlechter ausgleichen' }, { value: 'geschlechterTrennen', label: 'Geschlechter trennen' } ]} />
                    </div>
                </div>
            </div>
        </div>

        {/* Content Wrapper */}
        <div className="flex-1 flex gap-6 overflow-hidden">
            {/* Left Sidebar for "Nicht zugeordnet" */}
            <div 
                className={`flex-shrink-0 transition-all duration-300 ease-in-out ${isSchuelerListOpen ? 'opacity-100' : 'opacity-0 -mr-6'}`} 
                style={{ width: isSchuelerListOpen ? `${schuelerColumnWidth}px` : '0px' }}
            >
                <div 
                    className={`h-full bg-[var(--color-ui-primary)] p-4 rounded-lg border ${draggedItem && dropTargetRef.current === -1 ? 'border-2 border-[var(--color-accent-border-focus)]' : 'border-[var(--color-border)]'} transition-all flex flex-col overflow-hidden`} 
                    onMouseEnter={() => { if(draggedItem) dropTargetRef.current = -1; }} 
                    onMouseLeave={() => { if(draggedItem) dropTargetRef.current = null; }}
                    data-droptarget-json="-1"
                >
                    <h2 className="text-lg font-bold text-[var(--color-accent-text)] mb-3 flex-shrink-0">Nicht zugeordnet ({nichtZugeordnet.length})</h2>
                    <div className="flex-1 overflow-y-auto -mr-2 pr-2 space-y-2">
                        {nichtZugeordnet.map(s => (
                            <div key={s.id} className={`w-full transition-opacity duration-200 ${draggedItem?.schueler.id === s.id ? 'opacity-30' : 'opacity-100'}`}>
                                <SchuelerDndCard 
                                    schueler={s} 
                                    displayFormat="list" 
                                    allSchuelerInGroup={nichtZugeordnet}
                                    onMouseDown={(e) => startDrag(e, s, null)}
                                    onTouchStart={(e) => handleTouchStart(e, s, null)}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Groups Area */}
            <div className="flex-1 overflow-y-auto pr-2 -mr-2">
                <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 content-start`}>
                    {gruppen.map((gruppe, index) => (
                         <div 
                            key={index} 
                            className={`bg-[var(--color-ui-primary)] p-3 rounded-lg border ${draggedItem && dropTargetRef.current === index ? 'border-[var(--color-accent-border-focus)] shadow-lg shadow-[var(--color-shadow)]' : 'border-[var(--color-border)]'} transition-all flex flex-col min-h-[120px]`} 
                            onMouseEnter={() => { if(draggedItem) dropTargetRef.current = index; }} 
                            onMouseLeave={() => { if(draggedItem) dropTargetRef.current = null; }}
                            data-droptarget-json={index}
                         >
                            <h2 className="text-lg font-bold text-[var(--color-accent-text)] mb-2">Gruppe {index + 1} ({gruppe.length})</h2>
                            <div className="flex flex-col space-y-2 flex-grow content-start">
                                {gruppe.map(s => (
                                     <div key={s.id} className={`w-full transition-opacity duration-200 ${draggedItem?.schueler.id === s.id ? 'opacity-30' : 'opacity-100'}`}>
                                        <SchuelerDndCard 
                                            schueler={s} 
                                            displayFormat="group" 
                                            allSchuelerInGroup={gruppe}
                                            onMouseDown={(e) => startDrag(e, s, index)}
                                            onTouchStart={(e) => handleTouchStart(e, s, index)}
                                        />
                                    </div>
                                ))}
                                {gruppe.length === 0 && <div className="text-center text-[var(--color-text-tertiary)] p-4 border-2 border-dashed border-[var(--color-border)] rounded-md w-full flex-1 flex items-center justify-center">Gruppe ist leer</div>}
                            </div>
                        </div>
                    ))}
                     {gruppen.length === 0 && (
                        <div className="sm:col-span-2 lg:col-span-3 xl:col-span-4 2xl:col-span-5 text-center p-12 bg-[var(--color-ui-primary)] rounded-lg border-2 border-dashed border-[var(--color-border)] max-w-lg mx-auto">
                            <h3 className="text-xl font-semibold text-[var(--color-text-secondary)]">Noch keine Gruppen erstellt.</h3>
                            <p className="text-[var(--color-text-tertiary)] mt-2">Nutzen Sie die Steuerung, um Gruppen zu erstellen.</p>
                        </div>
                     )}
                </div>
            </div>
        </div>
        
        <IntelligenteGruppeneinteilungModal
            isOpen={isAiModalOpen}
            onClose={() => setIsAiModalOpen(false)}
            onGenerate={handleGenerateAiGruppen}
            isGenerating={isGenerating}
            aiError={aiError}
            prompt={aiPrompt}
            setPrompt={setAiPrompt}
        />
      </div>
    );
};

export default GruppeneinteilungView;