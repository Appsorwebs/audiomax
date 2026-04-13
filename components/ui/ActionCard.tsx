import React from 'react';

interface ActionCardProps {
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  ariaLabel: string;
  variant?: 'primary' | 'secondary' | 'accent';
}

export const ActionCard: React.FC<ActionCardProps> = ({
  onClick,
  icon,
  title,
  subtitle,
  ariaLabel,
  variant = 'primary',
}) => {
  const variantClasses = {
    primary: 'glass-premium border-primary-500/30 hover:border-primary-400/50 hover:bg-primary-500/10',
    secondary: 'glass-premium border-secondary-500/30 hover:border-secondary-400/50 hover:bg-secondary-500/10',
    accent: 'glass-premium border-accent-500/30 hover:border-accent-400/50 hover:bg-accent-500/10',
  };

  return (
    <button
      onClick={onClick}
      className={`w-full h-full min-h-32 flex flex-col items-center justify-center ${variantClasses[variant]} rounded-xl p-6 transition-all duration-300 group text-center border hover:shadow-2xl hover:scale-105 active:scale-95`}
      aria-label={ariaLabel}
    >
      <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">{icon}</div>
      <h3 className="text-lg font-bold text-neutral-100 group-hover:text-primary-300 transition-colors">{title}</h3>
      <p className="text-sm text-neutral-400 mt-1">{subtitle}</p>
    </button>
  );
};

export default ActionCard;
