import React from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose?: () => void;
  icon?: React.ReactNode;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  duration = 3000,
  onClose,
  icon,
}) => {
  React.useEffect(() => {
    if (duration > 0 && onClose) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const typeClasses = {
    success: 'border-success-500/50 bg-success-500/10',
    error: 'border-danger-500/50 bg-danger-500/10',
    warning: 'border-warning-500/50 bg-warning-500/10',
    info: 'border-primary-500/50 bg-primary-500/10',
  };

  const textClasses = {
    success: 'text-success-300',
    error: 'text-danger-300',
    warning: 'text-warning-300',
    info: 'text-primary-300',
  };

  return (
    <div
      className={`glass-premium p-4 rounded-lg border ${typeClasses[type]} animate-slideInUp backdrop-blur-xl`}
      role="alert"
    >
      <div className="flex items-center gap-3">
        {icon && <div className="text-xl flex-shrink-0">{icon}</div>}
        <p className={`flex-1 ${textClasses[type]} font-medium`}>{message}</p>
        {onClose && (
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-200 transition-colors text-xl leading-none"
            aria-label="Close"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

export default Toast;
