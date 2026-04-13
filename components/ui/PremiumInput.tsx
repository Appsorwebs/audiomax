import React from 'react';

interface PremiumInputProps {
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  disabled?: boolean;
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  className?: string;
}

export const PremiumInput: React.FC<PremiumInputProps> = ({
  placeholder,
  value,
  onChange,
  type = 'text',
  disabled = false,
  label,
  error,
  icon,
  fullWidth = true,
  className = '',
}) => {
  return (
    <div className={`form-group ${fullWidth ? 'w-full' : ''}`}>
      {label && <label className="form-label">{label}</label>}
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-primary-400">
            {icon}
          </div>
        )}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`form-input ${icon ? 'pl-12' : ''} ${error ? 'border-danger-500 focus:border-danger-500' : ''} ${className}`}
        />
      </div>
      {error && <p className="text-danger-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

export default PremiumInput;
