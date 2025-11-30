import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ label, id, className, ...props }, ref) => {
  const baseClasses = "w-full px-3 py-2 bg-[var(--color-ui-secondary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-border-focus)] transition-colors disabled:bg-[var(--color-ui-primary)] disabled:opacity-70 disabled:cursor-not-allowed resize-y shadow-inner shadow-black/20";
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
        {label}
      </label>
      <textarea
        id={id}
        ref={ref}
        className={`${baseClasses} ${className || ''}`}
        {...props}
      />
    </div>
  );
});

Textarea.displayName = 'Textarea';

export default Textarea;