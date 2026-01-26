import React from 'react';
import { LinexioLogoIcon } from '../icons';

const PreLoader: React.FC = () => {
  return (
    <div className="aurora-container relative isolate overflow-hidden h-screen w-full flex items-center justify-center bg-[var(--color-background)]">
      <div className="stars-layer-2"></div>
      
      <div className="relative z-10 flex flex-col items-center">
        <div className="animate-logo-breathing mb-8">
          <LinexioLogoIcon 
            style={{ width: '120px', height: '120px' }} 
            secondaryColor="var(--color-accent-text)" 
          />
        </div>
        <div className="flex flex-col items-center gap-4">
            <h1 className="text-3xl font-bold text-[var(--color-text-primary)] tracking-widest">
                LINEXIO
            </h1>
            
            {/* Elegant Scanning Progress Bar */}
            <div className="w-48 h-1 bg-[var(--color-ui-secondary)] rounded-full overflow-hidden shadow-lg shadow-[var(--color-shadow)]">
                <div className="w-full h-full animate-loading-sweep"></div>
            </div>
            
            <p className="text-[var(--color-text-tertiary)] text-xs font-medium uppercase tracking-[0.2em] opacity-50">
                Initialisierung
            </p>
        </div>
      </div>
    </div>
  );
};

export default PreLoader;