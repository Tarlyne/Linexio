import React from 'react';

interface PunkteHeatmapProps {
    punkteSpiegel: Map<number, number>;
}

const PunkteHeatmap: React.FC<PunkteHeatmapProps> = ({ punkteSpiegel }) => {
    const punkteGrid = [
        [15, 14, 13, 12],
        [11, 10, 9, 8],
        [7, 6, 5, 4],
        [3, 2, 1, 0]
    ];

    const maxCount = Math.max(1, ...punkteSpiegel.values());

    const getHeatmapStyle = (count: number): { className: string, textColorClass: string } => {
        if (count === 0) return { className: 'bg-[var(--color-ui-secondary)]', textColorClass: 'text-[var(--color-text-tertiary)]' };
        if (maxCount === 0) return { className: 'bg-[var(--color-ui-secondary)]', textColorClass: 'text-[var(--color-text-tertiary)]' };

        const ratio = count / maxCount;
        if (ratio > 0.75) return { className: 'bg-[var(--color-accent-primary)]', textColorClass: 'text-[var(--color-text-primary)] font-bold' };
        if (ratio > 0.4) return { className: 'bg-[var(--color-accent-secondary-transparent-50)]', textColorClass: 'text-[var(--color-text-primary)]' };
        return { className: 'bg-[var(--color-accent-secondary-transparent-40)]', textColorClass: 'text-[var(--color-text-secondary)]' };
    };

    return (
        <div className="grid grid-cols-4 gap-2 flex-1">
            {punkteGrid.flat().map(punkte => {
                const count = punkteSpiegel.get(punkte) || 0;
                const { className, textColorClass } = getHeatmapStyle(count);
                return (
                    <div key={punkte} className={`flex flex-col items-center justify-center p-2 aspect-square rounded-lg transition-colors ${className}`}>
                        <span className={`text-xl font-bold ${textColorClass}`}>{punkte} P.</span>
                        <span className={`text-xs font-semibold ${textColorClass}`}>{count}x</span>
                    </div>
                );
            })}
        </div>
    );
};

export default PunkteHeatmap;