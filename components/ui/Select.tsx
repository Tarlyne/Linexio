import React from 'react';
import { ChevronDownIcon } from '../icons';

interface Option {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: Option[];
}

const Select: React.FC<SelectProps> = ({ label, id, options, className, ...props }) => {
  const baseClasses = "h-10 w-full pl-3 pr-10 bg-[var(--color-ui-secondary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-border-focus)] transition-colors appearance-none shadow-inner shadow-black/20";
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          className={`${baseClasses} ${className || ''}`}
          {...props}
        >
          {options.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[var(--color-text-tertiary)]">
          <ChevronDownIcon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};

export default Select;