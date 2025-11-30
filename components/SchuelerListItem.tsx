import React from 'react';
import { Schueler } from '../context/types';
import Button from './ui/Button';
import { TrashIcon } from './icons';

interface SchuelerListItemProps {
  schueler: Schueler;
  index: number;
  onSelect: () => void;
  onDelete: (e: React.MouseEvent) => void;
  isDeleteDisabled?: boolean;
}

const getInitials = (firstName: string, lastName: string) => {
    const first = firstName ? firstName[0] : '';
    const last = lastName ? lastName[0] : '';
    return `${first}${last}`.toUpperCase();
}

const formatDate = (dateString: string) => {
    if (!dateString) return null;
    // Split to avoid timezone issues with new Date()
    const [year, month, day] = dateString.split('-');
    if (!year || !month || !day) return null;
    return `${day}.${month}.${year}`;
}

const SchuelerListItem: React.FC<SchuelerListItemProps> = ({ schueler, index, onSelect, onDelete, isDeleteDisabled = false }) => {
  const { firstName, lastName, birthday } = schueler;
  const formattedBirthday = formatDate(birthday);

  return (
    <li className="flex items-center justify-between p-0 hover:bg-[var(--color-ui-secondary)]/50 transition-colors">
      <div
        className="flex-grow flex items-center space-x-4 p-4 cursor-pointer"
        onClick={onSelect}
        role="button"
        tabIndex={0}
        onKeyPress={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect(); }}
        aria-label={`Details für ${firstName} ${lastName} ansehen`}
      >
        <span className="text-[var(--color-text-tertiary)] w-6 text-right">{index + 1}.</span>
        <div className="w-10 h-10 bg-gradient-to-br from-[var(--color-accent-primary-hover)] to-[var(--color-accent-primary)] text-[var(--color-accent-text-inverted)] rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0">
          {getInitials(firstName, lastName)}
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-[var(--color-text-primary)]">{lastName}, {firstName}</span>
          {formattedBirthday && <span className="text-sm text-[var(--color-text-tertiary)]">Geb: {formattedBirthday}</span>}
        </div>
      </div>
      <div className="pr-4 flex-shrink-0">
        <Button variant="secondary" onClick={onDelete} disabled={isDeleteDisabled} className="!p-2" aria-label={`Lösche ${firstName} ${lastName}`}>
          <TrashIcon />
        </Button>
      </div>
    </li>
  );
};

export default SchuelerListItem;