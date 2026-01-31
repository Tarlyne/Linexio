import React from 'react';
import { BaseProps } from '../types';

/**
 * Layout Component
 * Implements "Tablet-First" and "Space Efficiency" principles.
 * - Uses flexbox for dynamic sizing.
 * - Handles safe areas and general structural constraints.
 */
export const Layout: React.FC<BaseProps> = ({ children, className = '' }) => {
  return (
    <div className={`min-h-screen w-full bg-slate-50 text-slate-900 font-sans flex flex-col overflow-hidden ${className}`}>
      <main className="flex-1 w-full h-full relative overflow-y-auto overflow-x-hidden">
        {children}
      </main>
    </div>
  );
};
