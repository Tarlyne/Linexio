import React from 'react';

interface DashboardCardProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  onClick?: () => void;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ icon, title, children, onClick }) => {
  const baseClasses = "bg-[var(--color-ui-primary)] rounded-xl shadow-[0_4px_12px_var(--color-shadow)] border border-[var(--color-border)] p-5 flex flex-col items-start text-left transition-all duration-300 w-full";
  const interactiveClasses = "hover:border-[var(--color-accent-border-focus)] hover:shadow-[0_6px_16px_var(--color-shadow)] cursor-pointer";
  
  const content = (
    <>
      <div className="flex items-center mb-4">
        <div className="text-[var(--color-accent-text)] flex-shrink-0">{icon}</div>
        <h3 className="text-xl font-bold text-[var(--color-text-primary)] ml-4">{title}</h3>
      </div>
      <div className="flex-grow w-full flex flex-col min-h-0">
        {children}
      </div>
    </>
  );

  if (onClick) {
    return (
      <button onClick={onClick} className={`${baseClasses} ${interactiveClasses}`}>
        {content}
      </button>
    );
  }

  return (
    <div className={baseClasses}>
      {content}
    </div>
  );
};

export default DashboardCard;