import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend = 'neutral',
  trendValue,
  onClick,
}) => {
  const trendColors = {
    up: 'text-success-500',
    down: 'text-danger-500',
    neutral: 'text-neutral-400',
  };

  return (
    <div
      className="glass-premium p-6 rounded-xl cursor-pointer transition-all duration-300 group"
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-neutral-400 text-sm font-medium uppercase tracking-wide">{title}</p>
          <h3 className="text-3xl font-bold mt-3 text-white group-hover:text-primary-400 transition-colors">
            {value}
          </h3>
          {subtitle && <p className="text-neutral-500 text-sm mt-2">{subtitle}</p>}
        </div>
        {icon && <div className="text-2xl opacity-60 group-hover:opacity-100 transition-opacity">{icon}</div>}
      </div>

      {trendValue && (
        <div className="flex items-center gap-2 mt-4">
          <span className={`text-sm font-semibold ${trendColors[trend]}`}>{trendValue}</span>
          <span className="text-neutral-500 text-xs">vs last month</span>
        </div>
      )}
    </div>
  );
};

export default StatCard;
