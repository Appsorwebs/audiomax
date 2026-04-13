import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'premium' | 'deep';
  hover?: boolean;
  onClick?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  variant = 'default',
  hover = true,
  onClick,
}) => {
  const variantClasses = {
    default: 'glass',
    premium: 'glass-premium',
    deep: 'glass-deep',
  };

  return (
    <div
      className={`${variantClasses[variant]} ${hover ? 'hover:scale-105 hover:shadow-glow' : ''} transition-all duration-300 ${className}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      {children}
    </div>
  );
};

export default GlassCard;
