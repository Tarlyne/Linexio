import React from 'react';

// FIX: Omit the conflicting 'onChange' from ButtonHTMLAttributes before extending it.
interface SwitchProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ checked, onChange, id, ...props }, ref) => {
    const handleToggle = () => {
      onChange(!checked);
    };

    return (
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={handleToggle}
        id={id}
        ref={ref}
        className={`relative inline-flex flex-shrink-0 h-7 w-12 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--color-ui-primary)] focus:ring-[var(--color-accent-border-focus)] disabled:opacity-50 disabled:cursor-not-allowed
          ${checked ? 'bg-[var(--color-accent-primary)]' : 'bg-[var(--color-ui-secondary)]'}
        `}
        {...props}
      >
        <span className="sr-only">Use setting</span>
        <span
          aria-hidden="true"
          className={`pointer-events-none inline-block h-6 w-6 rounded-full bg-white shadow-lg transform ring-0 transition ease-in-out duration-200
            ${checked ? 'translate-x-5' : 'translate-x-0'}
          `}
        />
      </button>
    );
  }
);

Switch.displayName = 'Switch';

export default Switch;