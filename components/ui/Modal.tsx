import React from 'react';
import { CloseIcon } from '../icons';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'md' | 'lg' | 'xl' | 'compact';
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    compact: 'max-w-[280px]',
  };

  return (
    <div 
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 animate-fade-in" 
      aria-modal="true"
      role="dialog"
      onClick={onClose}
    >
      <div 
        className={`bg-[var(--color-ui-primary)]/70 backdrop-blur-xl rounded-xl shadow-2xl shadow-[0_0_50px_5px_var(--color-shadow)] w-full border border-[var(--color-border)]/50 ${sizeClasses[size]} flex flex-col`}
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
      >
        <header className="flex items-center justify-between p-4 border-b border-[var(--color-border)] flex-shrink-0">
          <h2 className="text-xl font-bold text-[var(--color-text-primary)]">{title}</h2>
          <button onClick={onClose} className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors">
            <CloseIcon />
            <span className="sr-only">Schließen</span>
          </button>
        </header>
        <div className="p-6 overflow-y-auto max-h-[80vh]">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;