import React from 'react';
import { useToastContext } from '../../context/ToastContext';
import ToastComponent from './Toast';

const ToastContainer: React.FC = () => {
  const { toasts } = useToastContext();

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center space-y-3">
      {toasts.map(toast => (
        <ToastComponent key={toast.id} toast={toast} />
      ))}
    </div>
  );
};

export default ToastContainer;