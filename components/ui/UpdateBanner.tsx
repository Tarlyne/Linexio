import React from 'react';
import { BellIcon } from '../icons';
import Button from './Button';

interface UpdateBannerProps {
  onUpdateClick: () => void;
  onChangelogClick: () => void;
}

const UpdateBanner: React.FC<UpdateBannerProps> = ({ onUpdateClick, onChangelogClick }) => {
  return (
    <div className="flex-shrink-0 bg-[var(--color-warning-primary-transparent)] text-[var(--color-text-primary)] px-6 md:px-8 py-2 flex items-center justify-between shadow-lg z-10 animate-fade-in">
      <div className="flex items-center space-x-3">
        <BellIcon className="w-6 h-6" />
        <p className="text-sm font-semibold">
          Ein Update für Linexio ist verfügbar.
        </p>
      </div>
      <div className="flex items-center space-x-3">
        <button onClick={onChangelogClick} className="text-sm font-bold hover:underline">
            Was ist neu?
        </button>
        <Button onClick={onUpdateClick}>
          Jetzt neu starten
        </Button>
      </div>
    </div>
  );
};

export default UpdateBanner;
