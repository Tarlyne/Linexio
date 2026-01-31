import React from 'react';
import { AdjustmentValues } from '../../services/PdfExportService';
import { CloseIcon } from '../icons';

interface FineTuningPanelProps {
    adjustments: AdjustmentValues;
    onAdjustmentsChange: React.Dispatch<React.SetStateAction<AdjustmentValues>>;
    onClose: () => void;
}

const TuningInput: React.FC<{ label: string; value: number; onChange: (v: number) => void; min: number; max: number; step: number; }> = ({ label, value, onChange, min, max, step }) => {
    return (
        <div className="grid grid-cols-3 items-center gap-2">
            <label htmlFor={label} className="text-xs text-[var(--color-text-secondary)] truncate">{label}</label>
            <input
                type="range"
                id={label}
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                className="col-span-1 accent-[var(--color-accent-primary)]"
            />
            <input
                type="number"
                step={step}
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                className="col-span-1 w-16 text-xs bg-[var(--color-ui-primary)] border border-[var(--color-border)] rounded-md p-1 text-right"
            />
        </div>
    );
};


const FineTuningPanel: React.FC<FineTuningPanelProps> = ({ adjustments, onAdjustmentsChange, onClose }) => {
    
    const handleChange = (key: keyof AdjustmentValues, value: number) => {
        onAdjustmentsChange(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className="absolute top-4 right-4 w-80 bg-[var(--color-ui-secondary)] p-4 rounded-lg shadow-2xl border border-[var(--color-border)] z-10 text-[var(--color-text-primary)]">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold">Feinabstimmung</h3>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-[var(--color-ui-tertiary)]"><CloseIcon className="w-5 h-5"/></button>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                <h4 className="text-sm font-semibold text-[var(--color-accent-text)] border-b border-[var(--color-border)] pb-1">Schriftgrößen (pt)</h4>
                <TuningInput label="H1 (Titel)" value={adjustments.h1} onChange={(v) => handleChange('h1', v)} min={-5} max={5} step={0.25} />
                <TuningInput label="H3 (Überschrift)" value={adjustments.h3} onChange={(v) => handleChange('h3', v)} min={-5} max={5} step={0.25} />
                <TuningInput label="Body (Aufgaben)" value={adjustments.body} onChange={(v) => handleChange('body', v)} min={-5} max={5} step={0.25} />
                <TuningInput label="Small (Feedback)" value={adjustments.small} onChange={(v) => handleChange('small', v)} min={-5} max={5} step={0.25} />
                <TuningInput label="X-Small (Datum)" value={adjustments.xsmall} onChange={(v) => handleChange('xsmall', v)} min={-5} max={5} step={0.25} />
                <TuningInput label="Note (Gesamt)" value={adjustments.note} onChange={(v) => handleChange('note', v)} min={-10} max={10} step={0.5} />
                
                <h4 className="text-sm font-semibold text-[var(--color-accent-text)] border-b border-[var(--color-border)] pb-1 pt-2">Abstände (mm)</h4>
                <TuningInput label="Seitenränder" value={adjustments.margin} onChange={(v) => handleChange('margin', v)} min={-10} max={10} step={0.5} />
                <TuningInput label="Spaltenabstand" value={adjustments.colGap} onChange={(v) => handleChange('colGap', v)} min={-10} max={10} step={0.5} />
                <TuningInput label="V-Space Header" value={adjustments.vSpaceHeader} onChange={(v) => handleChange('vSpaceHeader', v)} min={-5} max={5} step={0.5} />
                <TuningInput label="V-Space Section" value={adjustments.vSpaceSection} onChange={(v) => handleChange('vSpaceSection', v)} min={-5} max={5} step={0.5} />
                <TuningInput label="V-Space Footer" value={adjustments.vSpaceFooter} onChange={(v) => handleChange('vSpaceFooter', v)} min={-10} max={10} step={0.5} />
            </div>
        </div>
    );
};

export default FineTuningPanel;
