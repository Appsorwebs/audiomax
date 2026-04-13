import React from 'react';

interface PremiumHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  breadcrumb?: { label: string; onClick: () => void }[];
  showGradient?: boolean;
}

export const PremiumHeader: React.FC<PremiumHeaderProps> = ({
  title,
  subtitle,
  action,
  breadcrumb,
  showGradient = true,
}) => {
  return (
    <div
      className={`glass-premium p-8 rounded-2xl mb-8 border-b-2 ${showGradient ? 'border-primary-500/30' : 'border-neutral-700/30'}`}
    >
      {breadcrumb && breadcrumb.length > 0 && (
        <div className="flex items-center gap-2 mb-4">
          {breadcrumb.map((item, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <span className="text-neutral-500">/</span>}
              <button
                onClick={item.onClick}
                className="text-primary-400 hover:text-primary-300 transition-colors text-sm font-medium"
              >
                {item.label}
              </button>
            </React.Fragment>
          ))}
        </div>
      )}

      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h1 className={`text-4xl font-bold mb-2 ${showGradient ? 'gradient-primary' : 'text-white'}`}>
            {title}
          </h1>
          {subtitle && <p className="text-neutral-400 text-lg">{subtitle}</p>}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    </div>
  );
};

export default PremiumHeader;
