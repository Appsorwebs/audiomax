import React from 'react';

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  animated?: boolean;
  variant?: 'primary' | 'success' | 'warning' | 'danger';
  showPercentage?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  label,
  animated = true,
  variant = 'primary',
  showPercentage = true,
}) => {
  const percentage = (value / max) * 100;

  const variantClasses = {
    primary: 'bg-gradient-to-r from-primary-500 to-primary-600',
    success: 'bg-gradient-to-r from-success-500 to-success-600',
    warning: 'bg-gradient-to-r from-warning-500 to-warning-600',
    danger: 'bg-gradient-to-r from-danger-500 to-danger-600',
  };

  return (
    <div>
      {label && (
        <div className="flex justify-between items-center mb-2">
          <p className="text-sm font-medium text-neutral-300">{label}</p>
          {showPercentage && (
            <span className="text-sm font-bold text-primary-400">{Math.round(percentage)}%</span>
          )}
        </div>
      )}
      <div className="w-full h-3 bg-glass-light rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${variantClasses[variant]} ${animated ? 'animate-pulse' : ''}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
