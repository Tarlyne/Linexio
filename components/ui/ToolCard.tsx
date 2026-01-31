import React from 'react';

interface ToolCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  disabled?: boolean;
}

const ToolCard: React.FC<ToolCardProps> = ({ icon, title, description, onClick, disabled = false }) => {
  const baseClasses = "bg-[var(--color-ui-primary)] rounded-xl shadow-[0_4px_12px_var(--color-shadow)] border border-[var(--color-border)] p-5 flex flex-col items-start text-left transition-all duration-300 w-full";
  const enabledClasses = "hover:border-[var(--color-accent-border-focus)] hover:shadow-[0_6px_16px_var(--color-shadow)] cursor-pointer";
  const disabledClasses = "opacity-50 cursor-not-allowed";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${disabled ? disabledClasses : enabledClasses}`}
      aria-label={title}
    >
      <div className="flex items-center mb-3">
        <div className="text-[var(--color-accent-text)] flex-shrink-0">{icon}</div>
        <h3 className="text-lg font-bold text-[var(--color-text-primary)] ml-4">{title}</h3>
      </div>
      <p className="text-sm text-[var(--color-text-tertiary)] flex-grow">{description}</p>
      {disabled && (
        <span className="text-xs font-semibold text-[var(--color-warning-text)] bg-[var(--color-warning-secondary-transparent)] px-2 py-1 rounded-full mt-4">
          Bald verfügbar
        </span>
      )}
    </button>
  );
};

export default ToolCard;