import React, { useState, useEffect, useMemo, useRef, useLayoutEffect } from 'react';
import { useLerngruppenContext } from '../../context/LerngruppenContext';
import { Schueler } from '../../context/types';
import Button from '../ui/Button';
import { ShuffleIcon, RefreshIcon, CheckIcon, NoSymbolIcon, InformationCircleIcon } from '../icons';
import { useToolsContext } from '../../context/ToolsContext';
import { useUIContext } from '../../context/UIContext';

const getInitials = (firstName: string, lastName: string) => {
    const first = firstName ? firstName[0] : '';
    const last = lastName ? lastName[0] : '';
    return `${first}${last}`.toUpperCase();
};

type SchuelerStatus = 'available' | 'drawn' | 'excluded' | 'selected' | 'highlighted';

interface SchuelerCardProps {
    schueler: Schueler;
    status: SchuelerStatus;
    onClick: () => void;
    displayName: string;
    isAnimating: boolean;
    isHidden: boolean;
}

const SchuelerCard = React.forwardRef<HTMLButtonElement, SchuelerCardProps>(({ 
    schueler, status, onClick, displayName, isAnimating, isHidden 
}, ref) => {
    const isClickable = status !== 'drawn' && !isAnimating;

    const baseCardClasses = "relative flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all duration-200 ease-in-out w-full h-full";
    const baseAvatarClasses = "w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-lg mb-2 transition-all duration-200";
    const baseNameClasses = "text-sm text-center font-semibold truncate w-full transition-colors duration-200";
    const overlayIconClasses = "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-[var(--color-text-primary)]/80";

    let cardStyle = 'bg-[var(--color-ui-primary)] border-[var(--color-border)]';
    let avatarStyle = 'bg-gradient-to-br from-[var(--color-accent-primary-hover)] to-[var(--color-accent-primary)] text-[var(--color-accent-text-inverted)]';
    let nameStyle = 'text-[var(--color-text-primary)]';
    let overlayIcon = null;

    switch (status) {
        case 'available':
            cardStyle += ' hover:border-[var(--color-accent-border-focus)] cursor-pointer';
            break;
        case 'excluded':
            cardStyle += ' opacity-40 cursor-pointer';
            avatarStyle = 'bg-[var(--color-ui-tertiary)] text-[var(--color-text-tertiary)]';
            overlayIcon = <NoSymbolIcon className={overlayIconClasses} />;
            break;
        case 'drawn':
            cardStyle += ' opacity-20 cursor-not-allowed';
            avatarStyle = 'bg-[var(--color-ui-secondary)] text-[var(--color-text-tertiary)] opacity-75';
            overlayIcon = <CheckIcon className={`${overlayIconClasses} !text-[var(--color-success-text)]`} />;
            break;
        case 'highlighted':
            cardStyle = 'bg-[var(--color-ui-secondary)] border-[var(--color-accent-text)] z-10';
            break;
        case 'selected': // This state is now handled by the spotlight effect
            cardStyle += ' opacity-20'; // Keep it grayed out while the spotlight is active
            avatarStyle = 'bg-[var(--color-ui-secondary)] text-[var(--color-text-tertiary)] opacity-75';
            overlayIcon = <CheckIcon className={`${overlayIconClasses} !text-[var(--color-success-text)]`} />;
            break;
    }
    
    const finalCardStyle = `${baseCardClasses} ${cardStyle} ${isHidden ? 'opacity-0 pointer-events-none' : 'opacity-100'}`;

    return (
        <button
            ref={ref}
            onClick={onClick}
            disabled={!isClickable}
            className={finalCardStyle}
            aria-label={`Status für ${displayName} ändern`}
        >
            <div className={`${baseAvatarClasses} ${avatarStyle}`}>
                {getInitials(schueler.firstName, schueler.lastName)}
            </div>
            <p className={`${baseNameClasses} ${nameStyle}`}>{displayName}</p>
            {overlayIcon}
        </button>
    );
});

const SpotlightCard: React.FC<{ schueler: Schueler, displayName: string }> = ({ schueler, displayName }) => {
    return (
        <div className="flex flex-col items-center justify-center p-8 aspect-[4/3] w-full h-full rounded-2xl border-2 border-[var(--color-accent-text)] bg-[var(--color-ui-primary)] shadow-2xl shadow-[var(--color-accent-border-focus)]/30">
            <div className="w-32 h-32 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-5xl mb-4 bg-gradient-to-br from-[var(--color-accent-primary-hover)] to-[var(--color-accent-primary)] text-[var(--color-accent-text-inverted)]">
                {getInitials(schueler.firstName, schueler.lastName)}
            </div>
            <p className="text-3xl text-center font-bold text-[var(--color-text-primary)] truncate w-full">{displayName}</p>
        </div>
    );
};


const ZufallsschuelerView: React.FC = () => {
    const {
        selectedLerngruppe,
        schuelerInSelectedLerngruppe,
    } = useLerngruppenContext();

    const {
        pickedSchuelerIds,
        onMarkSchuelerAsPicked,
        onResetPickedList,
    } = useToolsContext();
    
    const { onBackToLerngruppeDetail, currentSchoolYear, systemSchoolYear, onSetCurrentSchoolYear, setHeaderConfig } = useUIContext();

    const [excludedStudentIds, setExcludedStudentIds] = useState(new Set<string>());
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    const [highlightedStudentId, setHighlightedStudentId] = useState<string | null>(null);
    const [isAnimating, setIsAnimating] = useState(false);
    
    const [spotlightStartPosition, setSpotlightStartPosition] = useState<DOMRect | null>(null);
    const [spotlightPhase, setSpotlightPhase] = useState<'idle' | 'zooming' | 'returning'>('idle');
    const cardRefs = useRef<Map<string, HTMLButtonElement | null>>(new Map());

    const animationIntervalRef = useRef<number | null>(null);
    const animationTimeoutRef = useRef<number | null>(null);
    const selectionResetTimeoutRef = useRef<number | null>(null);
    const spotlightDelayTimeoutRef = useRef<number | null>(null);
    
    const isArchivedView = currentSchoolYear !== systemSchoolYear;

    const gridContainerRef = useRef<HTMLDivElement>(null);
    const [gridDimensions, setGridDimensions] = useState({ cols: 1, rows: 1 });

    useLayoutEffect(() => {
        const gridContainer = gridContainerRef.current;
        if (!gridContainer) return;

        const resizeObserver = new ResizeObserver(entries => {
            if (!entries || entries.length === 0) return;

            const entry = entries[0];
            const numSchueler = schuelerInSelectedLerngruppe.length;

            if (numSchueler === 0) {
                setGridDimensions({ cols: 1, rows: 1 });
                return;
            }

            const { width, height } = entry.contentRect;
            if (width === 0 || height === 0) return;
            
            const CARD_ASPECT_RATIO = 4 / 3;

            let bestLayout = { cols: 1, rows: numSchueler, area: 0 };

            for (let cols = 1; cols <= numSchueler; cols++) {
                const rows = Math.ceil(numSchueler / cols);
                
                const cardWidth = width / cols;
                const cardHeight = height / rows;
                
                let effectiveCardWidth;
                if (cardWidth / cardHeight > CARD_ASPECT_RATIO) {
                    effectiveCardWidth = cardHeight * CARD_ASPECT_RATIO;
                } else {
                    effectiveCardWidth = cardWidth;
                }

                const area = effectiveCardWidth * (effectiveCardWidth / CARD_ASPECT_RATIO);

                if (area > bestLayout.area) {
                    bestLayout = { cols, rows, area };
                }
            }
            setGridDimensions({ cols: bestLayout.cols, rows: bestLayout.rows });
        });

        resizeObserver.observe(gridContainer);
        return () => resizeObserver.disconnect();
    }, [schuelerInSelectedLerngruppe.length]);

    useEffect(() => {
        if (selectedLerngruppe) {
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
                title: "ZufallsschülerIn",
                subtitle: <p className="text-sm text-[var(--color-accent-text)]">{selectedLerngruppe.name}</p>,
                onBack: onBackToLerngruppeDetail,
                banner: banner
            });

            return () => {
                setHeaderConfig(prev => ({ ...prev, banner: null }));
            }
        }
    }, [selectedLerngruppe, isArchivedView, currentSchoolYear, systemSchoolYear, onSetCurrentSchoolYear, setHeaderConfig, onBackToLerngruppeDetail]);


    if (!selectedLerngruppe) return null;
    
    const lerngruppeId = selectedLerngruppe.id;

    const drawnStudentIds = useMemo(() => new Set(pickedSchuelerIds[lerngruppeId] || []), [pickedSchuelerIds, lerngruppeId]);
    
    const sortedSchueler = useMemo(() =>
        [...schuelerInSelectedLerngruppe].sort((a: Schueler, b: Schueler) => a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName)),
        [schuelerInSelectedLerngruppe]
    );

    const duplicateFirstNames = useMemo(() => {
        const counts = new Map<string, number>();
        schuelerInSelectedLerngruppe.forEach((s: Schueler) => {
            counts.set(s.firstName, (counts.get(s.firstName) || 0) + 1);
        });
        const duplicates = new Set<string>();
        counts.forEach((count, name) => {
            if (count > 1) duplicates.add(name);
        });
        return duplicates;
    }, [schuelerInSelectedLerngruppe]);

    const availableForSelection = useMemo(() =>
        schuelerInSelectedLerngruppe.filter((s: Schueler) => !drawnStudentIds.has(s.id) && !excludedStudentIds.has(s.id)),
        [schuelerInSelectedLerngruppe, drawnStudentIds, excludedStudentIds]
    );

    useEffect(() => {
        return () => {
            if (animationIntervalRef.current) clearInterval(animationIntervalRef.current);
            if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);
            if (selectionResetTimeoutRef.current) clearTimeout(selectionResetTimeoutRef.current);
            if (spotlightDelayTimeoutRef.current) clearTimeout(spotlightDelayTimeoutRef.current);
            setSpotlightPhase('idle');
            setSpotlightStartPosition(null);
        };
    }, []);

    const handleCardClick = (schuelerId: string) => {
        if (isAnimating || drawnStudentIds.has(schuelerId) || selectedStudentId === schuelerId) return;

        const newSet = new Set(excludedStudentIds);
        if (newSet.has(schuelerId)) {
            newSet.delete(schuelerId);
        } else {
            newSet.add(schuelerId);
        }
        setExcludedStudentIds(newSet);
    };

    const handleReset = () => {
        onResetPickedList(lerngruppeId);
        setExcludedStudentIds(new Set());
        setSelectedStudentId(null);
        setSpotlightPhase('idle');
        setSpotlightStartPosition(null);
        if (selectionResetTimeoutRef.current) clearTimeout(selectionResetTimeoutRef.current);
    };

    const handleStartSelection = () => {
        if (isAnimating || availableForSelection.length === 0) return;

        setIsAnimating(true);
        setSelectedStudentId(null);

        const animationDuration = 2500;
        const intervalDuration = 100;

        animationIntervalRef.current = window.setInterval(() => {
            const randomIndex = Math.floor(Math.random() * availableForSelection.length);
            setHighlightedStudentId(availableForSelection[randomIndex].id);
        }, intervalDuration);

        animationTimeoutRef.current = window.setTimeout(() => {
            if (animationIntervalRef.current) clearInterval(animationIntervalRef.current);
            
            const finalRandomIndex = Math.floor(Math.random() * availableForSelection.length);
            const finalSchueler = availableForSelection[finalRandomIndex];
            
            if (finalSchueler) {
                setHighlightedStudentId(finalSchueler.id);

                if (spotlightDelayTimeoutRef.current) clearTimeout(spotlightDelayTimeoutRef.current);
                spotlightDelayTimeoutRef.current = window.setTimeout(() => {
                    setHighlightedStudentId(null);

                    const cardElement = cardRefs.current.get(finalSchueler.id);
                    if (cardElement) {
                        setSpotlightStartPosition(cardElement.getBoundingClientRect());
                    }

                    setSelectedStudentId(finalSchueler.id);
                    onMarkSchuelerAsPicked(lerngruppeId, finalSchueler.id);
                    
                    requestAnimationFrame(() => {
                        setSpotlightPhase('zooming');
                    });
                    
                    if (selectionResetTimeoutRef.current) clearTimeout(selectionResetTimeoutRef.current);
                    selectionResetTimeoutRef.current = window.setTimeout(() => {
                        setSpotlightPhase('returning');
                    }, 3000);

                }, 500);
            }
            
            setIsAnimating(false);
        }, animationDuration);
    };

    const handleTransitionEnd = () => {
        if (spotlightPhase === 'returning') {
            setSelectedStudentId(null);
            setSpotlightStartPosition(null);
            setSpotlightPhase('idle');
        }
    };

    const spotlightStyle: React.CSSProperties = useMemo(() => {
        if (!spotlightStartPosition) return { opacity: 0 };
        
        const baseStyle: React.CSSProperties = {
            position: 'fixed',
            left: `${spotlightStartPosition.left}px`,
            top: `${spotlightStartPosition.top}px`,
            width: `${spotlightStartPosition.width}px`,
            height: `${spotlightStartPosition.height}px`,
            transition: 'all 500ms cubic-bezier(0.4, 0, 0.2, 1)',
        };

        if (spotlightPhase === 'zooming') {
            return {
                ...baseStyle,
                left: `50%`,
                top: `50%`,
                width: `320px`,
                height: `240px`,
                transform: 'translate(-50%, -50%)',
            };
        }
        
        return baseStyle;
    }, [spotlightStartPosition, spotlightPhase]);

    const selectedSchuelerForSpotlight = useMemo(() => {
        if (!selectedStudentId) return null;
        return schuelerInSelectedLerngruppe.find((s: Schueler) => s.id === selectedStudentId);
    }, [selectedStudentId, schuelerInSelectedLerngruppe]);


    return (
      <>
        <div className="flex-shrink-0 mb-4 flex items-center justify-between">
             <Button 
                onClick={handleStartSelection} 
                disabled={isAnimating || availableForSelection.length === 0}
                className="!px-4 !py-2"
            >
                <ShuffleIcon className="w-5 h-5"/>
                <span>{isAnimating ? 'Wähle...' : 'Zufallswahl'}</span>
            </Button>
            <Button 
                onClick={handleReset} 
                variant="secondary" 
                disabled={isAnimating || (drawnStudentIds.size === 0 && excludedStudentIds.size === 0)}
                className="!px-4 !py-2"
            >
                <RefreshIcon />
                <span>Zurücksetzen</span>
            </Button>
        </div>

        <div className="flex-1 min-h-0">
            <div 
                ref={gridContainerRef}
                className="grid gap-3 md:gap-4 h-full"
                style={{ 
                    gridTemplateColumns: `repeat(${gridDimensions.cols}, 1fr)`,
                    gridTemplateRows: `repeat(${gridDimensions.rows}, 1fr)`,
                }}
            >
                {sortedSchueler.map((s: Schueler) => {
                    let status: SchuelerStatus = 'available';
                    if (selectedStudentId === s.id) status = 'selected';
                    else if (highlightedStudentId === s.id) status = 'highlighted';
                    else if (drawnStudentIds.has(s.id)) status = 'drawn';
                    else if (excludedStudentIds.has(s.id)) status = 'excluded';
                    
                    const displayName = duplicateFirstNames.has(s.firstName)
                        ? `${s.firstName} ${s.lastName.charAt(0)}.`
                        : s.firstName;

                    return (
                        <SchuelerCard
                            ref={el => { cardRefs.current.set(s.id, el); }}
                            key={s.id}
                            schueler={s}
                            status={status}
                            onClick={() => handleCardClick(s.id)}
                            displayName={displayName}
                            isAnimating={isAnimating}
                            isHidden={!!spotlightStartPosition && selectedStudentId === s.id}
                        />
                    );
                })}
            </div>
             {schuelerInSelectedLerngruppe.length === 0 && (
                 <div className="text-center p-12 bg-[var(--color-ui-primary)] rounded-lg border border-[var(--color-border)] max-w-2xl mx-auto mt-10">
                    <h3 className="text-xl font-semibold text-[var(--color-text-secondary)]">Keine SchülerInnen in dieser Lerngruppe</h3>
                    <p className="text-[var(--color-text-tertiary)] mt-2">Fügen Sie SchülerInnen in der Detailansicht der Lerngruppe hinzu, um dieses Tool zu verwenden.</p>
                </div>
            )}
        </div>
        
        {spotlightStartPosition && selectedSchuelerForSpotlight && (
            <div 
                className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${spotlightPhase === 'zooming' ? 'opacity-100' : 'opacity-0'}`}
            >
                <div 
                    style={spotlightStyle}
                    onTransitionEnd={handleTransitionEnd}
                >
                    <SpotlightCard 
                        schueler={selectedSchuelerForSpotlight} 
                        displayName={
                            duplicateFirstNames.has(selectedSchuelerForSpotlight.firstName)
                            ? `${selectedSchuelerForSpotlight.firstName} ${selectedSchuelerForSpotlight.lastName}`
                            : selectedSchuelerForSpotlight.firstName
                        }
                    />
                </div>
            </div>
        )}
      </>
    );
};

export default ZufallsschuelerView;