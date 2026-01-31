import React, { useMemo, useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react';
import { useLerngruppenContext } from '../../context/LerngruppenContext';
import { useToolsContext } from '../../context/ToolsContext';
import { Schueler, Sitzplan, CellType } from '../../context/types';
import Button from '../ui/Button';
import { SparklesIcon, LockClosedIcon, LockOpenIcon, AdjustmentsHorizontalIcon, TrashIcon, UsersIcon, InformationCircleIcon, ShuffleIcon, CheckIcon } from '../icons';
import SchuelerDndCard from '../ui/SchuelerDndCard';
import Modal from '../ui/Modal';
import { useSchuelerDragAndDrop } from '../../hooks/useSchuelerDragAndDrop';
import { useUIContext } from '../../context/UIContext';
import PopoverMenu from '../ui/PopoverMenu';
import PopoverMenuItem from '../ui/PopoverMenuItem';
import { useToastContext } from '../../context/ToastContext';
import Switch from '../ui/Switch';
import { useLicenseContext } from '../../context/LicenseContext';
import SupporterModal from '../modals/SupporterModal';

// --- Sub-components for better readability ---
const SchuelerPlatzCard: React.FC<{ 
    schueler: Schueler; 
    onMouseDown: (e: React.MouseEvent) => void; 
    onTouchStart: (e: React.TouchEvent) => void; 
    isDragged: boolean; 
    isPinned: boolean; 
    isPinningDisabled: boolean; 
    onClick: (e: React.MouseEvent) => void; 
    isDropTarget: boolean; 
    duplicateFirstNames: Set<string>;
    gridCols: number;
}> = ({ schueler, onMouseDown, onTouchStart, isDragged, isPinned, isPinningDisabled, onClick, isDropTarget, duplicateFirstNames, gridCols }) => {
    
    const displayName = duplicateFirstNames.has(schueler.firstName) 
        ? `${schueler.firstName} ${schueler.lastName.charAt(0)}.` 
        : schueler.firstName;

    const fontSizeClass = gridCols > 8 ? 'text-xs' : gridCols > 6 ? 'text-sm' : 'text-base';

    return (
        <div 
            onMouseDown={onMouseDown} 
            onTouchStart={onTouchStart} 
            className={`draggable-item bg-[var(--color-ui-secondary)] border border-[var(--color-border)] rounded-lg h-full w-full shadow-lg select-none transition-all duration-200 relative flex items-center justify-center p-1 ${isPinningDisabled || isPinned ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'} ${isDragged ? 'opacity-30' : 'opacity-100'} ${isDropTarget && !isPinned ? 'ring-2 ring-[var(--color-accent-border-focus)]' : ''}`}
        >
            <p className={`font-medium text-[var(--color-text-primary)] text-center whitespace-nowrap truncate w-full ${fontSizeClass}`}>
                {displayName}
            </p>
            <button 
                onClick={onClick} 
                disabled={isPinningDisabled} 
                className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-[var(--color-accent-secondary-transparent-40)] hover:bg-[var(--color-accent-primary)] group transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[var(--color-accent-secondary-transparent-40)]"
            >
                {isPinned 
                    ? <LockClosedIcon className="w-4 h-4 text-[var(--color-accent-text)]" /> 
                    : <LockOpenIcon className="w-4 h-4 text-[var(--color-text-tertiary)] group-hover:text-[var(--color-text-primary)]" />
                }
            </button>
        </div>
    );
}

const SeatPlaceholder: React.FC<{ isDropTarget: boolean }> = ({ isDropTarget }) => (
    <div className={`bg-[var(--color-ui-secondary)] border border-[var(--color-border)] rounded-lg h-full w-full transition-all ${isDropTarget ? 'ring-2 ring-[var(--color-accent-border-focus)]' : ''}`}></div>
);

const AisleCell: React.FC = () => (
    <div className="bg-transparent rounded-lg border-2 border-dashed border-[var(--color-border)] h-full w-full"></div>
);

const DeskCell: React.FC = () => (
    <div className="bg-amber-800 border-b-4 border-amber-900 rounded-lg flex items-center justify-center text-amber-200 h-full w-full font-semibold">
        Pult
    </div>
);

const LegendItem: React.FC<{ label: string; type: 'seat' | 'aisle' | 'desk' }> = ({ label, type }) => {
    let box;
    switch (type) {
        case 'seat':
            box = <div className="w-5 h-5 bg-[var(--color-ui-secondary)] rounded-sm border border-[var(--color-border)]"></div>;
            break;
        case 'aisle':
            box = <div className="w-5 h-5 border-2 border-dashed border-[var(--color-border)] rounded-sm"></div>;
            break;
        case 'desk':
            box = <div className="w-5 h-5 bg-amber-800 border-b-2 border-amber-900 rounded-sm"></div>;
            break;
    }
    return (
        <div className="flex items-center space-x-2">
            {box}
            <span className="text-xs text-[var(--color-text-tertiary)]">{label}</span>
        </div>
    );
};


const SitzplanView: React.FC = () => {
  const {
    selectedLerngruppe,
    schuelerInSelectedLerngruppe,
  } = useLerngruppenContext();
  
  const {
    sitzplaene,
    onUpdateSitzplan,
    ai,
  } = useToolsContext();
  
  const { onBackToLerngruppeDetail, currentSchoolYear, systemSchoolYear, onSetCurrentSchoolYear, setHeaderConfig } = useUIContext();
  const { showToast } = useToastContext();
  const { licenseStatus } = useLicenseContext();

  const sitzplan = useMemo(() => sitzplaene.find(sp => sp.lerngruppeId === selectedLerngruppe?.id), [sitzplaene, selectedLerngruppe?.id]);

  const [isLayoutEditMode, setIsLayoutEditMode] = useState(false);
  const [isPlacingDesk, setIsPlacingDesk] = useState(false);
  const [isSchuelerListOpen, setIsSchuelerListOpen] = useState(true);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isSupporterModalOpen, setIsSupporterModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState(sitzplan?.aiPrompt || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [popoverAnchorEl, setPopoverAnchorEl] = useState<HTMLElement | null>(null);
  const schuelerListButtonRef = useRef<HTMLButtonElement>(null);

  const [rowsInput, setRowsInput] = useState(sitzplan ? String(sitzplan.rows) : '5');
  const [colsInput, setColsInput] = useState(sitzplan ? String(sitzplan.cols) : '5');

  const gridContainerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  
  const isSupporter = licenseStatus === 'PRO' || licenseStatus === 'ALPHA_TESTER';

  useEffect(() => {
    const measureContainer = () => {
      if (gridContainerRef.current) {
        const { width, height } = gridContainerRef.current.getBoundingClientRect();
        setContainerSize({ width, height });
      }
    };

    const container = gridContainerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(measureContainer);
    resizeObserver.observe(container);
    
    // Initial measure
    measureContainer();

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
       if (gridContainerRef.current) {
        const { width, height } = gridContainerRef.current.getBoundingClientRect();
        setContainerSize({ width, height });
      }
    }, 50); // Small delay to allow layout to settle

    return () => clearTimeout(timeoutId);
  }, [isSchuelerListOpen]);



  const { gridStyle, rowHeight } = useMemo(() => {
    if (!sitzplan || containerSize.width === 0 || containerSize.height === 0) {
        return { 
            gridStyle: { visibility: 'hidden' as const },
            rowHeight: 0
        };
    }

    const gridAspectRatio = (sitzplan.cols * 4) / (sitzplan.rows * 3);
    const containerAspectRatio = containerSize.width / containerSize.height;

    let finalWidth: number;
    let finalHeight: number;

    if (containerAspectRatio > gridAspectRatio) {
        finalHeight = containerSize.height;
        finalWidth = containerSize.height * gridAspectRatio;
    } else {
        finalWidth = containerSize.width;
        finalHeight = containerSize.width / gridAspectRatio;
    }

    const gap = 8; // in pixels
    
    const totalGapWidth = (sitzplan.cols - 1) * gap;
    const colWidth = (finalWidth - totalGapWidth) / sitzplan.cols;

    const totalGapHeight = (sitzplan.rows - 1) * gap;
    const calculatedRowHeight = (finalHeight - totalGapHeight) / sitzplan.rows;

    const style = {
        visibility: 'visible' as const,
        width: `${finalWidth}px`,
        height: `${finalHeight}px`,
        gridTemplateColumns: `repeat(${sitzplan.cols}, ${colWidth > 0 ? colWidth : 1}px)`,
        rowGap: `${gap}px`,
        columnGap: `${gap}px`,
    };

    return {
        gridStyle: style,
        rowHeight: calculatedRowHeight > 0 ? calculatedRowHeight : 1
    };
  }, [sitzplan, containerSize]);


  type DragSource = 'list' | { row: number; col: number };
  type DropTarget = 'list' | { row: number; col: number };
  type AssignmentCriterion = 'zufaellig' | 'geschlechtAusgleich';
  
  const isArchivedView = currentSchoolYear !== systemSchoolYear;

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
        title: 'Sitzplan',
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
        if (sitzplan) {
            setRowsInput(String(sitzplan.rows));
            setColsInput(String(sitzplan.cols));
        }
    }, [sitzplan]);

    useEffect(() => {
        if (!isLayoutEditMode) {
            setIsPlacingDesk(false); // Turn off desk placement when exiting edit mode
        }
    }, [isLayoutEditMode]);

  const duplicateFirstNames = useMemo(() => {
    const firstNameCounts = schuelerInSelectedLerngruppe.reduce((acc, schueler) => {
        acc[schueler.firstName] = (acc[schueler.firstName] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const duplicates = new Set<string>();
    for (const firstName in firstNameCounts) {
        if (firstNameCounts[firstName] > 1) {
            duplicates.add(firstName);
        }
    }
    return duplicates;
  }, [schuelerInSelectedLerngruppe]);

  const isLayoutUnchanged = useMemo(() => {
    if (!sitzplan) return true;
    return sitzplan.layout.every(row => row.every(cell => cell === 'aisle'));
  }, [sitzplan]);

  const platzierteSchuelerIds = useMemo(() => new Set(Object.keys(sitzplan?.schuelerPlacements || {})), [sitzplan]);
  
  const nichtPlatzierteSchueler = useMemo(() =>
    schuelerInSelectedLerngruppe
      .filter(s => !platzierteSchuelerIds.has(s.id))
      .sort((a, b) => a.lastName.localeCompare(b.lastName)),
    [schuelerInSelectedLerngruppe, platzierteSchuelerIds]
  );
  
  useEffect(() => {
    if (nichtPlatzierteSchueler.length === 0 && platzierteSchuelerIds.size > 0) {
        setIsSchuelerListOpen(false);
    }
  }, [nichtPlatzierteSchueler.length, platzierteSchuelerIds.size]);

  const schuelerMap = useMemo(() =>
    new Map(schuelerInSelectedLerngruppe.map(s => [s.id, s])),
    [schuelerInSelectedLerngruppe]
  );

  const platzMap = useMemo(() => {
    const map = new Map<string, string>();
    if (!sitzplan) return map;
    for (const schuelerId in sitzplan.schuelerPlacements) {
      const placement = sitzplan.schuelerPlacements[schuelerId];
      if (placement) {
        const { row, col } = placement;
        map.set(`${row}-${col}`, schuelerId);
      }
    }
    return map;
  }, [sitzplan]);

  const schuelerColumnWidth = useMemo(() => {
    const longestNameLength = Math.max(0, ...schuelerInSelectedLerngruppe.map(s => s.lastName.length + s.firstName.length + 2)); // +2 for ", "
    const baseWidth = 80;
    const charWidth = 8;
    let calculatedWidth = baseWidth + longestNameLength * charWidth;
    calculatedWidth = Math.max(200, calculatedWidth);
    calculatedWidth = Math.min(320, calculatedWidth);
    return calculatedWidth;
  }, [schuelerInSelectedLerngruppe]);

  const hasUnappliedChanges = useMemo(() => {
    if (!sitzplan) return false;
    // Using != because rowsInput/colsInput are strings
    return parseInt(rowsInput, 10) !== sitzplan.rows || parseInt(colsInput, 10) !== sitzplan.cols;
  }, [rowsInput, colsInput, sitzplan]);

  const applyDimensionChanges = useCallback(() => {
    if (!sitzplan) return;

    const newRowsNum = parseInt(rowsInput, 10);
    const newColsNum = parseInt(colsInput, 10);
    
    const currentRows = sitzplan.rows;
    const currentCol = sitzplan.cols;

    const validatedNewRows = Math.max(5, Math.min(10, isNaN(newRowsNum) ? currentRows : newRowsNum));
    const validatedNewCols = Math.max(5, Math.min(10, isNaN(newColsNum) ? currentCol : newColsNum));
    
    if (validatedNewRows === currentRows && validatedNewCols === currentCol) {
        setRowsInput(String(validatedNewRows));
        setColsInput(String(validatedNewCols));
        return;
    }

    const newLayout: CellType[][] = Array.from({ length: validatedNewRows }, () => Array(validatedNewCols).fill('aisle'));

    for (let r = 0; r < Math.min(currentRows, validatedNewRows); r++) {
        for (let c = 0; c < Math.min(currentCol, validatedNewCols); c++) {
            newLayout[r][c] = sitzplan.layout[r][c];
        }
    }

    const newPlacements = { ...sitzplan.schuelerPlacements };
    for (const schuelerId in newPlacements) {
        const { row, col } = newPlacements[schuelerId];
        if (row >= validatedNewRows || col >= validatedNewCols || newLayout[row][col] !== 'seat') {
            delete newPlacements[schuelerId];
        }
    }
    
    onUpdateSitzplan({
        ...sitzplan,
        rows: validatedNewRows,
        cols: validatedNewCols,
        layout: newLayout,
        schuelerPlacements: newPlacements,
    });
    
    setRowsInput(String(validatedNewRows));
    setColsInput(String(validatedNewCols));
  }, [sitzplan, rowsInput, colsInput, onUpdateSitzplan]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        applyDimensionChanges();
        (e.target as HTMLInputElement).blur();
    }
  };
  
  const handleCellClick = (row: number, col: number) => {
    if (!sitzplan || !isLayoutEditMode) return;
    const newLayout = sitzplan.layout.map(r => [...r]);
    const currentType = newLayout[row][col];
    const newPlacements = {...sitzplan.schuelerPlacements};
    
    if (isPlacingDesk) {
        newLayout[row][col] = currentType === 'desk' ? 'aisle' : 'desk';
    } else {
        newLayout[row][col] = currentType === 'seat' ? 'aisle' : 'seat';
    }

    if (newLayout[row][col] !== 'seat') {
        const schuelerIdOnSeat = platzMap.get(`${row}-${col}`);
        if (schuelerIdOnSeat) {
            delete newPlacements[schuelerIdOnSeat];
        }
    }
    onUpdateSitzplan({ ...sitzplan, layout: newLayout, schuelerPlacements: newPlacements });
  };


  const handleLayoutReset = () => {
    if (!sitzplan) return;
    const newLayout = Array(sitzplan.rows).fill(null).map(() => Array(sitzplan.cols).fill('aisle' as CellType));
    onUpdateSitzplan({ ...sitzplan, layout: newLayout, schuelerPlacements: {} });
  };
  
  const handleRandomAssignment = (criterion: AssignmentCriterion) => {
      if (!sitzplan) return;
      const pinnedPlacements: typeof sitzplan.schuelerPlacements = {};
      const pinnedSeats = new Set<string>();
      for (const schuelerId in sitzplan.schuelerPlacements) {
          const placement = sitzplan.schuelerPlacements[schuelerId];
          if (placement?.isPinned) {
              pinnedPlacements[schuelerId] = placement;
              const { row, col } = placement;
              pinnedSeats.add(`${row}-${col}`);
          }
      }

      const unpinnedPlacedSchueler = schuelerInSelectedLerngruppe.filter( s => sitzplan.schuelerPlacements[s.id] && !sitzplan.schuelerPlacements[s.id].isPinned );
      const studentsToShuffle = [...nichtPlatzierteSchueler, ...unpinnedPlacedSchueler];
      const availableSeats: { row: number, col: number }[] = [];
      sitzplan.layout.forEach((rowArr, r) => {
          rowArr.forEach((cell, c) => {
              if (cell === 'seat' && !pinnedSeats.has(`${r}-${c}`)) {
                  availableSeats.push({ row: r, col: c });
              }
          });
      });

      if (availableSeats.length < studentsToShuffle.length) {
          showToast('Nicht genügend freie Sitzplätze für alle zuzuordnenden SchülerInnen vorhanden.', 'error');
          return;
      }

      for (let i = availableSeats.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [availableSeats[i], availableSeats[j]] = [availableSeats[j], availableSeats[i]];
      }
      let shuffledStudents = [...studentsToShuffle];
      if (criterion === 'geschlechtAusgleich') {
          const males = shuffledStudents.filter(s => s.gender === 'm');
          const females = shuffledStudents.filter(s => s.gender !== 'm');
          shuffledStudents = [];
          let mIndex = 0, fIndex = 0;
          while (mIndex < males.length || fIndex < females.length) {
              if (mIndex < males.length) shuffledStudents.push(males[mIndex++]);
              if (fIndex < females.length) shuffledStudents.push(females[fIndex++]);
          }
      } else {
          for (let i = shuffledStudents.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [shuffledStudents[i], shuffledStudents[j]] = [shuffledStudents[j], shuffledStudents[i]];
          }
      }
      const newRandomPlacements: typeof sitzplan.schuelerPlacements = {};
      const numToPlace = Math.min(availableSeats.length, shuffledStudents.length);
      for (let i = 0; i < numToPlace; i++) {
          const student = shuffledStudents[i];
          const seat = availableSeats[i];
          newRandomPlacements[student.id] = { row: seat.row, col: seat.col, isPinned: false };
      }
      onUpdateSitzplan({ ...sitzplan, schuelerPlacements: { ...pinnedPlacements, ...newRandomPlacements } });
  };
  
  const handleResetPlacements = () => {
    if (!sitzplan) return;
    const newPlacements = { ...sitzplan.schuelerPlacements };
    for (const schuelerId in newPlacements) {
        if (!newPlacements[schuelerId].isPinned) {
            delete newPlacements[schuelerId];
        }
    }
    onUpdateSitzplan({ ...sitzplan, schuelerPlacements: newPlacements });
  };
  
  const handleTogglePin = (schuelerId: string) => {
      if (!sitzplan || !sitzplan.schuelerPlacements[schuelerId] || isLayoutEditMode) return;
      const newPlacements = { ...sitzplan.schuelerPlacements };
      newPlacements[schuelerId] = { ...newPlacements[schuelerId], isPinned: !newPlacements[schuelerId].isPinned };
      onUpdateSitzplan({ ...sitzplan, schuelerPlacements: newPlacements });
  };

    const handleAiClick = () => {
        if (isSupporter) {
            setAiPrompt(sitzplan?.aiPrompt || '');
            setIsAiModalOpen(true);
        } else {
            setIsSupporterModalOpen(true);
        }
        setPopoverAnchorEl(null);
    };

    const handleGenerateAiSitzplan = async () => {
        if (!sitzplan || !aiPrompt.trim()) return;
        setAiError(null);
        
        const pinnedPlacements: typeof sitzplan.schuelerPlacements = {};
        const pinnedSeats = new Set<string>();
        for (const schuelerId in sitzplan.schuelerPlacements) {
            const placement = sitzplan.schuelerPlacements[schuelerId];
            if (placement?.isPinned) {
                pinnedPlacements[schuelerId] = placement;
                const { row, col } = placement;
                pinnedSeats.add(`${row}-${col}`);
            }
        }
        const studentsToPlace = schuelerInSelectedLerngruppe.filter(s => !pinnedPlacements[s.id]);
        const availableSeats: { row: number, col: number }[] = [];
        const deskCoords: { row: number, col: number }[] = [];
        sitzplan.layout.forEach((rowArr, r) => { 
            rowArr.forEach((cell, c) => { 
                if (cell === 'seat' && !pinnedSeats.has(`${r}-${c}`)) { 
                    availableSeats.push({ row: r, col: c }); 
                } else if (cell === 'desk') {
                    deskCoords.push({ row: r, col: c });
                }
            }); 
        });

        if (studentsToPlace.length === 0) {
            setAiError("Alle SchülerInnen sind bereits fest zugeordnet. Es gibt niemanden zu platzieren.");
            return;
        }
        if (availableSeats.length < studentsToPlace.length) {
            setAiError(`Nicht genügend freie Sitzplätze. Es werden ${studentsToPlace.length} Plätze benötigt, aber nur ${availableSeats.length} sind verfügbar.`);
            return;
        }
        setIsGenerating(true);
        const loadingMessages = ["Analysiere das Raumlayout...","Bewerte die pädagogischen Merkmale...","Prüfe die Anweisungen...","Erstelle den optimalen Sitzplan...","Einen Moment noch...",];
        let messageIndex = 0;
        setLoadingMessage(loadingMessages[messageIndex]);
        const intervalId: ReturnType<typeof setInterval> = setInterval(() => { messageIndex = (messageIndex + 1) % loadingMessages.length; setLoadingMessage(loadingMessages[messageIndex]); }, 2000);

        try {
            const anonymousStudentMap = new Map<string, string>();
            const reverseAnonymousMap = new Map<string, string>();
            
            const replacements: { search: string, replace: string }[] = [];
            studentsToPlace.forEach((s, index) => {
                const anonymousId = `s_${index}`;
                anonymousStudentMap.set(s.id, anonymousId);
                reverseAnonymousMap.set(anonymousId, s.id);
                replacements.push({ search: `${s.firstName} ${s.lastName}`, replace: anonymousId });
                replacements.push({ search: s.firstName, replace: anonymousId });
            });
            
            replacements.sort((a, b) => b.search.length - a.search.length);
            
            let processedAiPrompt = ` ${aiPrompt} `;
            replacements.forEach(({ search, replace }) => {
                const escapedSearch = search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
                const regex = new RegExp(`\\b${escapedSearch}\\b`, 'gi');
                processedAiPrompt = processedAiPrompt.replace(regex, ` ${replace} `);
            });
            processedAiPrompt = processedAiPrompt.trim().replace(/\s+/g, ' ');

            const anonymousStudents = studentsToPlace.map((s) => ({ id: anonymousStudentMap.get(s.id)!, merkmale: s.paedagogischeMerkmale || [] }));
            const layout = { rows: sitzplan.rows, cols: sitzplan.cols, seats: availableSeats, desks: deskCoords };
            const systemInstruction = `Du bist ein erfahrener Pädagoge und erstellst einen optimalen Sitzplan. Die Eigenschaft 'desks' im Raumlayout gibt die Koordinaten des Lehrerpults an. Dies definiert die "Vorderseite" des Raumes. Anweisungen wie "vorne" oder "in der ersten Reihe" beziehen sich auf die Nähe zu diesen Pult-Koordinaten. Deine Aufgabe ist es, die anonymisierten SchülerInnen auf die verfügbaren Sitzplätze zu verteilen. Berücksichtige die Anweisungen des Nutzers und die pädagogischen Merkmale der SchülerInnen. Gib als Antwort NUR ein JSON-Objekt zurück, das ein Array namens "placements" enthält. Jedes Element im Array muss ein Objekt mit "studentId" (die anonyme ID), "row" und "col" sein. Platziere JEDEN Schüler aus der Liste.`;
            const fullPrompt = `Raumlayout: ${JSON.stringify(layout)}\nAnonymisierte SchülerInnenliste: ${JSON.stringify(anonymousStudents)}\n\nAnweisung des Nutzers: "${processedAiPrompt}"`;
            
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: fullPrompt, config: { systemInstruction, responseMimeType: "application/json", } });
            
            const jsonString = response.text; 
            const result = JSON.parse(jsonString);

            if (result.placements && Array.isArray(result.placements)) {
                const newAiPlacements: typeof sitzplan.schuelerPlacements = {};
                result.placements.forEach((p: { studentId: string; row: number; col: number; }) => { const realSchuelerId = reverseAnonymousMap.get(p.studentId); if (realSchuelerId) { newAiPlacements[realSchuelerId] = { row: p.row, col: p.col, isPinned: false }; } });
                onUpdateSitzplan({ ...sitzplan, schuelerPlacements: { ...pinnedPlacements, ...newAiPlacements } });
                setIsAiModalOpen(false); setAiPrompt('');
            } else { throw new Error("Ungültiges Antwortformat von der KI."); }
        } catch (error) { console.error("Fehler bei der KI-Anfrage:", error); setAiError("Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut oder formulieren Sie Ihre Anfrage anders.");
        } finally { clearInterval(intervalId); setIsGenerating(false); setLoadingMessage(''); }
    };

    const handleCloseAiModal = () => {
        if (sitzplan && aiPrompt !== (sitzplan.aiPrompt || '')) {
            onUpdateSitzplan({ ...sitzplan, aiPrompt });
        }
        setIsAiModalOpen(false);
    };

    const handleDrop = useCallback((draggedItem: { schueler: Schueler; source: DragSource }, target: DropTarget | null) => {
        if (!sitzplan) return;
        const { schueler: draggedSchueler, source } = draggedItem;

        // Check if target seat is pinned
        if (typeof target === 'object' && target) {
            const schuelerAtTargetId = platzMap.get(`${target.row}-${target.col}`);
            if (schuelerAtTargetId && sitzplan.schuelerPlacements[schuelerAtTargetId]?.isPinned) {
                return; // Abort if target is pinned
            }
        }

        const newPlacements = { ...sitzplan.schuelerPlacements };
        if (target === null) return;

        const isSameGridSpot = typeof source === 'object' && typeof target === 'object' && source.row === target.row && source.col === target.col;
        if ((source === 'list' && target === 'list') || isSameGridSpot) return;
        
        const schuelerAtTargetId = typeof target === 'object' ? platzMap.get(`${target.row}-${target.col}`) : undefined;

        // Move dragged student
        delete newPlacements[draggedSchueler.id];
        if (typeof target === 'object') {
            newPlacements[draggedSchueler.id] = { row: target.row, col: target.col, isPinned: false };
        }

        // If a student was on the target seat (swap logic)
        if (schuelerAtTargetId) {
            if (typeof source === 'object') { // Dragged from another seat -> swap
                const targetOriginalPinnedStatus = sitzplan.schuelerPlacements[schuelerAtTargetId]?.isPinned ?? false;
                newPlacements[schuelerAtTargetId] = { row: source.row, col: source.col, isPinned: targetOriginalPinnedStatus };
            } else { // Dragged from list -> move target student to list
                delete newPlacements[schuelerAtTargetId];
            }
        }
        
        onUpdateSitzplan({ ...sitzplan, schuelerPlacements: newPlacements });
    }, [onUpdateSitzplan, sitzplan, platzMap]);

    const isDragDisabled = useCallback((schueler: Schueler) => { return isLayoutEditMode || (sitzplan?.schuelerPlacements[schueler.id]?.isPinned ?? false); }, [isLayoutEditMode, sitzplan]);
    const { draggedItem, ghostPosition, startDrag, dropTargetRef } = useSchuelerDragAndDrop<DragSource, DropTarget>({ onDrop: handleDrop, isDisabled: isDragDisabled });
  
    const handleTouchStart = (e: React.TouchEvent, schueler: Schueler, source: DragSource) => {
        e.preventDefault();
        startDrag(e, schueler, source);
    };

  if (!sitzplan || !selectedLerngruppe) {
    return ( <div className="h-full flex flex-col flex-1 text-[var(--color-text-primary)]"><div className="flex-1 flex items-center justify-center bg-[var(--color-ui-primary)] rounded-lg border-2 border-dashed border-[var(--color-border)]"><p>Für diese Lerngruppe wurde noch kein Sitzplan konfiguriert.</p></div></div>);
  }
  const unpinnedPlacedSchuelerCount = schuelerInSelectedLerngruppe.filter(s => sitzplan.schuelerPlacements[s.id] && !sitzplan.schuelerPlacements[s.id].isPinned).length;
  const isResetDisabled = unpinnedPlacedSchuelerCount === 0;
  const totalAssignableSchuelerCount = nichtPlatzierteSchueler.length + unpinnedPlacedSchuelerCount;
  const isAssignmentDisabled = totalAssignableSchuelerCount === 0;

  return (
    <>
      {draggedItem && ghostPosition && (<div className="fixed top-0 left-0 pointer-events-none z-50 transform -translate-x-1/2 -translate-y-1/2" style={{ left: ghostPosition.x, top: ghostPosition.y }}><div className="w-48 opacity-80"><SchuelerDndCard schueler={draggedItem.schueler} isGhost /></div></div>)}
      <div className="flex-shrink-0 p-2 bg-[var(--color-ui-primary)] rounded-lg border border-[var(--color-border)] flex items-center mb-4">
        <div className="flex items-center gap-2">
            <Button ref={schuelerListButtonRef} variant="secondary" onClick={() => { setIsSchuelerListOpen(p => !p); schuelerListButtonRef.current?.blur(); }} className={`relative ${isSchuelerListOpen ? '!bg-[var(--color-accent-secondary-transparent-50)]' : ''}`} aria-label={isSchuelerListOpen ? "SchülerInnenliste ausblenden" : "SchülerInnenliste einblenden"}>
                <UsersIcon className="w-6 h-6"/><span className="absolute -top-1 -right-1 bg-[var(--color-accent-primary)] text-[var(--color-text-primary)] text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-[var(--color-ui-primary)]">{nichtPlatzierteSchueler.length}</span>
            </Button>
             <Button variant="secondary" onClick={(event) => setPopoverAnchorEl(event.currentTarget)} className={`${!!popoverAnchorEl ? 'bg-[var(--color-accent-secondary-transparent-50)] border border-[var(--color-accent-border-focus)]' : ''} ${!!popoverAnchorEl ? 'focus:ring-0 focus:ring-offset-0' : ''}`} aria-label="Sitzplan-Steuerung öffnen" aria-expanded={!!popoverAnchorEl} disabled={isLayoutEditMode}>
                <AdjustmentsHorizontalIcon className="w-6 h-6" />
            </Button>
        </div>
        
        <div className="flex-1 min-w-0"></div>
        
        <div className="flex items-center gap-3 min-w-0">
            <div className={`flex items-center gap-3 transition-all duration-300 ease-in-out overflow-hidden ${isLayoutEditMode ? 'max-w-2xl' : 'max-w-0'}`}>
                <div className={`flex items-center gap-3 whitespace-nowrap transition-opacity duration-200 ${isLayoutEditMode ? 'opacity-100' : 'opacity-0'}`}>
                    <Button variant={isPlacingDesk ? 'primary' : 'secondary'} onClick={() => setIsPlacingDesk(!isPlacingDesk)}>Pult platzieren</Button>
                    <div className="flex items-center space-x-2 border-l border-[var(--color-border)] pl-3">
                        <input aria-label="Anzahl der Reihen" id="rows" type="number" min="5" max="10" value={rowsInput} onChange={(e) => setRowsInput(e.target.value)} onKeyDown={handleKeyDown} className="w-14 p-1.5 bg-[var(--color-ui-secondary)] border border-[var(--color-border)] rounded-md text-center" />
                        <span className="text-[var(--color-text-tertiary)]">x</span>
                        <input aria-label="Anzahl der Spalten" id="cols" type="number" min="5" max="10" value={colsInput} onChange={(e) => setColsInput(e.target.value)} onKeyDown={handleKeyDown} className="w-14 p-1.5 bg-[var(--color-ui-secondary)] border border-[var(--color-border)] rounded-md text-center" />
                        {hasUnappliedChanges && (
                            <Button onClick={applyDimensionChanges} className="!p-2" aria-label="Änderungen anwenden">
                                <CheckIcon className="w-5 h-5" strokeWidth={2} />
                            </Button>
                        )}
                        <Button onClick={handleLayoutReset} variant="danger" className="!p-2" aria-label="Layout zurücksetzen" disabled={isLayoutUnchanged}><TrashIcon /></Button>
                    </div>
                </div>
            </div>
            
            <div className="flex items-center gap-3 flex-shrink-0 ml-auto">
                <div className="flex items-center space-x-3">
                    <label htmlFor="edit-mode-switch" className={`text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${isLayoutEditMode ? 'text-[var(--color-accent-text)]' : 'text-[var(--color-text-secondary)]'}`}>Layout bearbeiten</label>
                    <Switch
                        id="edit-mode-switch"
                        checked={isLayoutEditMode}
                        onChange={setIsLayoutEditMode}
                    />
                </div>
            </div>
        </div>
      </div>
      <div className="flex-1 flex gap-6 overflow-hidden">
        <div className={`pt-4 flex-shrink-0 transition-all duration-300 ease-in-out ${isSchuelerListOpen ? 'opacity-100' : 'opacity-0 -mr-6'}`} style={{ width: isSchuelerListOpen ? `${schuelerColumnWidth}px` : '0px' }}>
            <div 
                className={`h-full bg-[var(--color-ui-primary)] p-4 rounded-lg border ${draggedItem && dropTargetRef.current === 'list' ? 'border-2 border-[var(--color-accent-border-focus)]' : 'border-[var(--color-border)]'} transition-all flex flex-col overflow-hidden`} 
                onMouseEnter={() => { if(draggedItem) dropTargetRef.current = 'list'; }} 
                onMouseLeave={() => { if(draggedItem) dropTargetRef.current = null; }}
                data-droptarget-json='"list"'
            >
                <h2 className="text-lg font-bold text-[var(--color-accent-text)] mb-3 flex-shrink-0">Nicht zugeordnet ({nichtPlatzierteSchueler.length})</h2>
                <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                    {nichtPlatzierteSchueler.map(s => <div key={s.id} className={`transition-opacity duration-200 ${draggedItem?.schueler.id === s.id ? 'opacity-30' : 'opacity-100'}`} onMouseDown={(e) => startDrag(e, s, 'list')} onTouchStart={(e) => handleTouchStart(e, s, 'list')}><SchuelerDndCard schueler={s} /></div>)}
                </div>
            </div>
        </div>
        <div ref={gridContainerRef} className="flex-1 flex items-center justify-center p-2 min-w-0">
            <div
                className="grid"
                style={gridStyle}>
                {sitzplan.layout.map((row, r) => row.map((cellType, c) => {
                    const schuelerId = platzMap.get(`${r}-${c}`);
                    const schueler = schuelerId ? schuelerMap.get(schuelerId) : undefined;
                    const isPinnedAtTarget = schuelerId ? (sitzplan.schuelerPlacements[schuelerId]?.isPinned ?? false) : false;
                    const isDropTarget = dropTargetRef.current && typeof dropTargetRef.current === 'object' && dropTargetRef.current.row === r && dropTargetRef.current.col === c && !isPinnedAtTarget;
                    const isDroppable = cellType === 'seat' && !isLayoutEditMode;
                    const droppableProps = isDroppable ? {
                        'data-droptarget-json': JSON.stringify({ row: r, col: c }),
                        onMouseEnter: () => { if (draggedItem) dropTargetRef.current = { row: r, col: c }; },
                        onMouseLeave: () => { if (draggedItem) dropTargetRef.current = null; }
                    } : {};

                    return (
                        <div key={`${r}-${c}`} className="relative" style={{ height: `${rowHeight}px` }} {...droppableProps}>
                            {isLayoutEditMode ? (<button onClick={() => handleCellClick(r, c)} className="w-full h-full">{cellType === 'seat' && <SeatPlaceholder isDropTarget={false} />}{cellType === 'aisle' && <AisleCell />}{cellType === 'desk' && <DeskCell />}</button>) : (<>{cellType === 'desk' && <DeskCell />}{cellType === 'aisle' && <AisleCell />}{cellType === 'seat' && (schueler ? (<SchuelerPlatzCard schueler={schueler} onMouseDown={(e) => startDrag(e, schueler, { row: r, col: c })} onTouchStart={(e) => handleTouchStart(e, schueler, { row: r, col: c })} isDragged={draggedItem?.schueler.id === schueler.id} isPinned={sitzplan.schuelerPlacements[schueler.id]?.isPinned ?? false} isPinningDisabled={isLayoutEditMode} onClick={(e) => { e.stopPropagation(); handleTogglePin(schueler.id); }} isDropTarget={isDropTarget} duplicateFirstNames={duplicateFirstNames} gridCols={sitzplan.cols}/>) : (<SeatPlaceholder isDropTarget={isDropTarget} />))}</>)}
                        </div>
                    );
                }))}
            </div>
        </div>
      </div>
      <PopoverMenu
            isOpen={!!popoverAnchorEl}
            onClose={() => setPopoverAnchorEl(null)}
            anchorEl={popoverAnchorEl}
        >
            <div className="px-3 pt-2 pb-1">
                <h3 className="text-sm font-semibold text-[var(--color-text-tertiary)]">Zuweisung</h3>
            </div>
            <PopoverMenuItem
                icon={<ShuffleIcon className="w-5 h-5" />}
                label="Zufällig zuweisen"
                onClick={() => { handleRandomAssignment('zufaellig'); setPopoverAnchorEl(null); }}
                disabled={isAssignmentDisabled}
            />
            <PopoverMenuItem
                icon={<UsersIcon className="w-5 h-5" />}
                label="Abwechselnd nach Geschlecht"
                onClick={() => { handleRandomAssignment('geschlechtAusgleich'); setPopoverAnchorEl(null); }}
                disabled={isAssignmentDisabled}
            />
            <PopoverMenuItem
                icon={<SparklesIcon className="w-5 h-5 text-[var(--color-warning-text)]" />}
                label="Intelligente Zuweisung"
                onClick={handleAiClick}
            />
            <PopoverMenuItem
                icon={<TrashIcon className="w-5 h-5" />}
                label="Platzierung zurücksetzen"
                variant="danger"
                onClick={() => { handleResetPlacements(); setPopoverAnchorEl(null); }}
                disabled={isResetDisabled}
            />
      </PopoverMenu>
      <Modal isOpen={isAiModalOpen} onClose={handleCloseAiModal} title="Intelligenter Sitzplan" size="lg">
        <div className="space-y-4">
            <p className="text-sm text-[var(--color-text-tertiary)]">Beschreiben Sie in natürlicher Sprache, wie der Sitzplan erstellt werden soll. Berücksichtigen Sie dabei die pädagogischen Merkmale, die Sie in der Schülerakte vergeben haben. Die KI interpretiert die Position des Pults als "vorne". Anweisungen wie "in die erste Reihe" orientieren sich daran.</p>
            <textarea value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} placeholder="z.B. 'Setze Leo und Frida nebeneinander. Unruhige SchülerInnen sollen vorne sitzen. Hanna braucht einen Platz in der ersten Reihe.'" className="w-full h-40 p-3 bg-[var(--color-ui-secondary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:ring-2 focus:ring-[var(--color-accent-border-focus)] focus:border-[var(--color-accent-border-focus)] transition-colors" disabled={isGenerating}/>
            {aiError && <p className="text-sm text-[var(--color-danger-text)]">{aiError}</p>}
            <div className="flex justify-end items-center space-x-3 pt-2">
                {isGenerating && <p className="text-sm text-[var(--color-text-tertiary)] animate-pulse">{loadingMessage}</p>}
                <Button type="button" variant="secondary" onClick={handleCloseAiModal} disabled={isGenerating}>Abbrechen</Button>
                <Button type="button" onClick={handleGenerateAiSitzplan} disabled={!aiPrompt.trim() || isGenerating}>
                    {isGenerating ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-[var(--color-text-primary)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Generiere...</span>
                        </>
                    ) : (
                        'Sitzplan generieren'
                    )}
                </Button>
            </div>
        </div>
      </Modal>
      <SupporterModal
        isOpen={isSupporterModalOpen}
        onClose={() => setIsSupporterModalOpen(false)}
      />
    </>
  );
};

export default SitzplanView;