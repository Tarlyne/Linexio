import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Schueler } from '../context/types';

export interface DraggedItem<S> {
  schueler: Schueler;
  source: S;
}

interface UseSchuelerDragAndDropProps<S, D> {
  onDrop: (draggedItem: DraggedItem<S>, dropTarget: D | null) => void;
  isDisabled?: (item: Schueler, source: S) => boolean;
}

export const useSchuelerDragAndDrop = <S, D>({ onDrop, isDisabled }: UseSchuelerDragAndDropProps<S, D>) => {
  const [draggedItem, setDraggedItem] = useState<DraggedItem<S> | null>(null);
  const [ghostPosition, setGhostPosition] = useState<{ x: number; y: number } | null>(null);
  const dropTargetRef = useRef<D | null>(null);
  const [isTouch, setIsTouch] = useState(false);

  const startDrag = useCallback((e: React.MouseEvent | React.TouchEvent, schueler: Schueler, source: S) => {
    if (isDisabled && isDisabled(schueler, source)) {
        return;
    }
    const isTouchEvent = 'touches' in e;
    setIsTouch(isTouchEvent);

    // NEW: preventDefault() is now called in the component's onTouchStart handler
    // before this function is even invoked. This is crucial for iOS Safari.

    const clientX = isTouchEvent ? e.touches[0].clientX : e.clientX;
    const clientY = isTouchEvent ? e.touches[0].clientY : e.clientY;
    
    setDraggedItem({ schueler, source });
    setGhostPosition({ x: clientX, y: clientY });
  }, [isDisabled]);

  // Effect to disable body scroll on drag, robust for mobile Safari
  useEffect(() => {
    if (draggedItem) {
      document.documentElement.classList.add('no-scroll-on-drag');
      document.body.classList.add('no-scroll-on-drag');
    } else {
      document.documentElement.classList.remove('no-scroll-on-drag');
      document.body.classList.remove('no-scroll-on-drag');
    }

    // Cleanup function in case the component unmounts during a drag
    return () => {
      document.documentElement.classList.remove('no-scroll-on-drag');
      document.body.classList.remove('no-scroll-on-drag');
    }
  }, [draggedItem]);

  useEffect(() => {
    if (!draggedItem) return;

    const getCoords = (e: MouseEvent | TouchEvent) => {
        if (e instanceof MouseEvent) return { x: e.clientX, y: e.clientY };
        if (e.touches && e.touches.length > 0) {
            return { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
        if (e.changedTouches && e.changedTouches.length > 0) {
            return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
        }
        return null;
    };

    const handleMove = (e: MouseEvent | TouchEvent) => {
        const coords = getCoords(e);
        if (!coords) return;

        // Prevent scroll on touch devices, this is crucial
        if ('touches' in e) {
            e.preventDefault(); 
        }

        setGhostPosition({ x: coords.x, y: coords.y });
        
        // For touch events, manually detect drop target via elementFromPoint
        if (isTouch) {
            const elementUnder = document.elementFromPoint(coords.x, coords.y);
            // Traverse up to find the closest droppable target
            const targetElement = elementUnder?.closest('[data-droptarget-json]');
            
            if (targetElement) {
                const targetJson = targetElement.getAttribute('data-droptarget-json');
                try {
                    if (targetJson) {
                        dropTargetRef.current = JSON.parse(targetJson);
                    }
                } catch (err) {
                    console.error("Failed to parse drop target JSON", err);
                    dropTargetRef.current = null;
                }
            } else {
                dropTargetRef.current = null;
            }
        }
    };

    const handleEnd = () => {
        if (draggedItem) {
            onDrop(draggedItem, dropTargetRef.current);
        }
        
        setDraggedItem(null);
        setGhostPosition(null);
        dropTargetRef.current = null;
        setIsTouch(false);
    };

    window.addEventListener('mousemove', handleMove, { passive: false });
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleEnd);

    return () => {
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleEnd);
        window.removeEventListener('touchmove', handleMove);
        window.removeEventListener('touchend', handleEnd);
    };
  }, [draggedItem, onDrop, isTouch]);

  return {
    draggedItem,
    ghostPosition,
    startDrag,
    dropTargetRef,
  };
};