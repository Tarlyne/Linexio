import React from 'react';

export const GewichtungBadge: React.FC<{ gewichtung?: number }> = ({ gewichtung }) => {
    if (gewichtung === undefined) return null;

    return (
        <span className="relative ml-1.5 bg-[var(--color-accent-primary)] text-[var(--color-text-primary)] w-5 h-5 rounded-full inline-block flex-shrink-0 border-2 border-[var(--color-ui-primary)] align-middle">
            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-bold">
                {gewichtung}
            </span>
        </span>
    );
};