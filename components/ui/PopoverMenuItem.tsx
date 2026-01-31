import React from 'react';

interface PopoverMenuItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
  label: string;
  variant?: 'default' | 'danger';
}

const PopoverMenuItem: React.FC<PopoverMenuItemProps> = ({ icon, label, variant = 'default', ...props }) => {
  const variantClasses = {
    default: 'text-[var(--color-text-secondary)] hover:bg-[var(--color-accent-secondary-transparent-50)] hover:text-[var(--color-text-primary)]',
    danger: 'text-[var(--color-danger-text)] hover:bg-[var(--color-danger-background-transparent)]'
  };

  return (
    <button
      className={`flex items-center w-full p-2.5 text-sm rounded-md text-left transition-colors duration-200 ${variantClasses[variant]}`}
      role="menuitem"
      {...props}
    >
      {icon && <span className="mr-3 w-5 h-5">{icon}</span>}
      <span className="flex-1">{label}</span>
    </button>
  );
};

export default PopoverMenuItem;
