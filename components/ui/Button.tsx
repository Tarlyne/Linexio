import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  children: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ variant = 'primary', children, className = '', ...props }, ref) => {
  const baseClasses = 'inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--color-ui-primary)] transition-all disabled:opacity-50 disabled:cursor-not-allowed space-x-2';

  const variantClasses = {
    primary: 'relative overflow-hidden glossy-bar text-[var(--color-text-primary)] bg-[radial-gradient(ellipse_at_top,_var(--color-accent-primary),_var(--color-accent-primary-hover))] hover:brightness-95 focus:ring-[var(--color-accent-border-focus)]',
    secondary: 'text-[var(--color-text-primary)] bg-gradient-to-b from-[var(--color-ui-tertiary)] to-[var(--color-ui-secondary)] hover:brightness-95 focus:ring-[var(--color-accent-border-focus)]',
    danger: 'text-[var(--color-text-primary)] bg-gradient-to-b from-[var(--color-danger-primary-hover)] to-[var(--color-danger-primary)] hover:brightness-95 focus:ring-[var(--color-danger-primary)]',
  };

  return (
    <button
      ref={ref}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;