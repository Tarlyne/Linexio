import React from 'react';

export interface SegmentedControlOption<T extends string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  name: string; // for accessibility
}

const SegmentedControl = <T extends string>({ options, value, onChange, name }: SegmentedControlProps<T>) => {
  return (
    <div className="flex w-full bg-[var(--color-ui-secondary)] rounded-lg p-1 space-x-1" role="group" aria-label={name}>
      {options.map((option: SegmentedControlOption<T>) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          role="radio"
          aria-checked={value === option.value}
          className={`flex-grow flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-md transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-ui-primary)] focus-visible:ring-[var(--color-accent-border-focus)]
            ${value === option.value
              ? 'relative overflow-hidden glossy-bar text-[var(--color-text-primary)] bg-[radial-gradient(ellipse_at_top,_var(--color-accent-primary),_var(--color-accent-primary-hover))] shadow-sm'
              : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-ui-tertiary)]'
            }
          `}
        >
          {option.icon}
          <span className={`whitespace-nowrap ${option.icon ? 'ml-2' : ''}`}>{option.label}</span>
        </button>
      ))}
    </div>
  );
};

export default SegmentedControl;