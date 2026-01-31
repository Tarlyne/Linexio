import React, { useMemo } from 'react';
import { Schueler } from '../../context/types';

const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
}

interface SchuelerDndCardProps {
    schueler: Schueler;
    isGhost?: boolean;
    displayFormat?: 'list' | 'group';
    allSchuelerInGroup?: Schueler[];
    onMouseDown?: (e: React.MouseEvent) => void;
    onTouchStart?: (e: React.TouchEvent) => void;
}

const SchuelerDndCard: React.FC<SchuelerDndCardProps> = ({ schueler, isGhost, displayFormat = 'list', allSchuelerInGroup = [], onMouseDown, onTouchStart }) => {

    const displayName = useMemo(() => {
        if (displayFormat === 'group' && allSchuelerInGroup.length > 0) {
            const firstNameCount = allSchuelerInGroup.filter(s => s.firstName === schueler.firstName).length;
            if (firstNameCount > 1) {
                return `${schueler.firstName} ${schueler.lastName.charAt(0)}.`;
            }
            return schueler.firstName;
        }
        // Default to 'list' format
        return `${schueler.lastName}, ${schueler.firstName}`;
    }, [schueler, displayFormat, allSchuelerInGroup]);
    
    return (
        <div 
            onMouseDown={onMouseDown}
            onTouchStart={onTouchStart}
            className={`draggable-item flex items-center space-x-2 p-2 rounded-md transition-shadow duration-200 shadow-sm select-none cursor-grab active:cursor-grabbing ${isGhost ? 'bg-[var(--color-ui-tertiary)]' : 'bg-[var(--color-ui-secondary)]'}`}>
            <div className="w-8 h-8 bg-gradient-to-br from-[var(--color-accent-primary-hover)] to-[var(--color-accent-primary)] text-[var(--color-accent-text-inverted)] rounded-md flex items-center justify-center font-bold text-xs flex-shrink-0">
                {getInitials(schueler.firstName, schueler.lastName)}
            </div>
            <span className="text-[var(--color-text-primary)] truncate flex-1">{displayName}</span>
        </div>
    );
};

export default SchuelerDndCard;