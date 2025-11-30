import React from 'react';
import { CheckCircleIcon, ExclamationTriangleIcon } from '../icons';
import { Toast } from '../../context/ToastContext';

interface ToastProps {
  toast: Toast;
}

const ToastComponent: React.FC<ToastProps> = ({ toast }) => {
  const { message, type } = toast;

  const typeStyles = {
    success: {
      bg: 'bg-green-100 dark:bg-[var(--color-accent-secondary-transparent-50)]',
      iconColor: 'text-green-500 dark:text-green-400',
      textColor: 'text-green-800 dark:text-green-200',
      Icon: CheckCircleIcon,
    },
    error: {
      bg: 'bg-red-100 dark:bg-[var(--color-danger-background-transparent)]',
      iconColor: 'text-red-500 dark:text-red-400',
      textColor: 'text-red-800 dark:text-red-200',
      Icon: ExclamationTriangleIcon,
    },
  };
  
  const styles = typeStyles[type];

  return (
    <div className={`flex items-center w-full max-w-xs p-4 space-x-4 rounded-lg shadow-lg ${styles.bg} ${styles.textColor} border border-transparent dark:border-[var(--color-border)] animate-fade-in`}>
      <div className={`inline-flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-lg ${styles.iconColor}`}>
        <styles.Icon className="w-6 h-6" />
        <span className="sr-only">{type} icon</span>
      </div>
      <div className="text-sm font-normal">{message}</div>
    </div>
  );
};

export default ToastComponent;
