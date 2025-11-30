import React from 'react';
import { ChevronLeftIcon } from './icons';

interface HeaderProps {
  title: string;
  subtitle?: React.ReactNode;
  children?: React.ReactNode;
  onBack?: () => void;
  actions?: React.ReactNode;
}

const Header: React.FC<HeaderProps> = ({ title, subtitle, children, onBack, actions }) => {
  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center">
        {onBack && (
          <button 
            onClick={onBack} 
            className="mr-4 -ml-2 p-2 rounded-full text-[var(--color-text-tertiary)] active:bg-[var(--color-ui-secondary)] active:text-[var(--color-text-primary)] transition-colors desktop-hover-secondary desktop-hover-text-primary"
            aria-label="Zurück"
          >
            <ChevronLeftIcon />
          </button>
        )}
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">{title}</h1>
          {subtitle}
        </div>
      </div>
      <div className="flex items-center space-x-4">
        {actions}
        {children}
      </div>
    </div>
  );
};

export default Header;