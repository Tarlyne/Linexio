import React from 'react';
import { XIcon } from '../icons';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  onClear?: () => void;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ label, id, className, type, onClear, ...props }, ref) => {
  // Base styling for all inputs.
  const baseClasses = "h-10 w-full bg-[var(--color-ui-secondary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-border-focus)] transition-colors disabled:bg-[var(--color-ui-primary)] disabled:opacity-70 disabled:cursor-not-allowed shadow-inner shadow-black/20";
  
  // Add `appearance-none` specifically for date/time inputs to override Safari's default styling, which can enforce its own width.
  const typeSpecificClasses = (type === 'date' || type === 'time' || type === 'datetime-local') ? 'appearance-none' : '';

  const isClearable = !!onClear && props.value !== '' && props.value !== undefined && !props.disabled;
  const paddingClass = isClearable ? 'pl-3 pr-10' : 'px-3';

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          ref={ref}
          type={type}
          className={`${baseClasses} ${typeSpecificClasses} ${paddingClass} ${className || ''}`.trim().replace(/\s+/g, ' ')}
          {...props}
        />
        {isClearable && (
          <button
            type="button"
            onClick={onClear}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors focus:outline-none"
            tabIndex={-1}
            aria-label="Eingabe löschen"
          >
            <XIcon className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
});

Input.displayName = 'Input';

export default Input;