import React from 'react';
import { Lerngruppe } from '../context/types';
import { EllipsisVerticalIcon, StudentsIcon, ArrowUpIcon, ArrowDownIcon } from './icons';

interface LerngruppeCardProps {
  lerngruppe: Lerngruppe;
  schuelerCount: number;
  onSelect: () => void;
  onEdit: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
  isArchived: boolean;
  showMenu?: boolean;
  genderStats?: { m: number; w: number; d: number };
}

const LerngruppeCard: React.FC<LerngruppeCardProps> = ({ 
  lerngruppe, 
  schuelerCount, 
  onSelect, 
  onEdit,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  isArchived,
  showMenu = true,
  genderStats,
}) => {

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit();
  };

  const handleMoveUpClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onMoveUp();
  };

  const handleMoveDownClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onMoveDown();
  };

  const genderString = genderStats 
    ? [
        genderStats.w > 0 ? `${genderStats.w}w` : null,
        genderStats.m > 0 ? `${genderStats.m}m` : null,
        genderStats.d > 0 ? `${genderStats.d}d` : null
      ].filter(Boolean).join(' • ')
    : null;

  return (
    <div 
      className="bg-[var(--color-ui-primary)] rounded-xl shadow-[0_4px_12px_var(--color-shadow)] border border-[var(--color-border)] hover:border-[var(--color-accent-border-focus)] hover:shadow-[0_6px_16px_var(--color-shadow)] transition-all duration-300 cursor-pointer flex flex-col text-left relative"
      onClick={onSelect}
    >
      {showMenu && (
        <div className="absolute top-2 right-2">
          <button
            onClick={handleEditClick}
            disabled={isArchived}
            className="p-2 text-[var(--color-text-tertiary)] rounded-full hover:bg-[var(--color-ui-secondary)] hover:text-[var(--color-text-primary)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Bearbeiten"
          >
            <EllipsisVerticalIcon />
          </button>
        </div>
      )}

      <div className="p-5 flex-grow">
        <h3 className={`text-xl font-bold text-[var(--color-text-primary)] truncate ${showMenu ? 'pr-8' : ''}`}>{lerngruppe.name}</h3>
        <p className="text-[var(--color-accent-text)] font-semibold">{lerngruppe.fach}</p>
        {genderString && (
            <p className="text-xs text-[var(--color-text-tertiary)] mt-1 font-medium">{genderString}</p>
        )}
      </div>
      <div className="p-4 border-t border-[var(--color-border)] flex justify-between items-center bg-[var(--color-ui-primary)]/50 rounded-b-xl">
        <div className="flex items-center space-x-2 text-[var(--color-text-tertiary)]">
          <StudentsIcon className="w-5 h-5" />
          <span className="text-sm whitespace-nowrap">{schuelerCount} SchülerInnen</span>
        </div>
        
        <div className="flex items-center space-x-1">
            <button 
                onClick={handleMoveUpClick}
                disabled={isFirst || isArchived}
                className="p-2 text-[var(--color-text-tertiary)] rounded-md active:bg-[var(--color-ui-secondary)] active:text-[var(--color-text-primary)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed desktop-hover-secondary desktop-hover-text-primary"
                aria-label="Nach oben verschieben"
            >
                <ArrowUpIcon />
            </button>
            <button 
                onClick={handleMoveDownClick}
                disabled={isLast || isArchived}
                className="p-2 text-[var(--color-text-tertiary)] rounded-md active:bg-[var(--color-ui-secondary)] active:text-[var(--color-text-primary)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed desktop-hover-secondary desktop-hover-text-primary"
                aria-label="Nach unten verschieben"
            >
                <ArrowDownIcon />
            </button>
        </div>
      </div>
    </div>
  );
};

export default LerngruppeCard;