import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { SunIcon } from './icons/SunIcon';
import { MoonIcon } from './icons/MoonIcon';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative inline-flex items-center justify-center w-12 h-6 bg-slate-200 dark:bg-slate-700 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {/* Toggle track */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 dark:from-indigo-500 dark:to-purple-600 transition-all duration-300" />
      
      {/* Toggle thumb */}
      <div className={`relative w-5 h-5 bg-white dark:bg-slate-800 rounded-full shadow-md transform transition-transform duration-300 ${
        theme === 'dark' ? 'translate-x-3' : '-translate-x-3'
      }`}>
        {/* Icons */}
        <div className="absolute inset-0 flex items-center justify-center">
          {theme === 'light' ? (
            <SunIcon className="w-3 h-3 text-yellow-500" />
          ) : (
            <MoonIcon className="w-3 h-3 text-indigo-400" />
          )}
        </div>
      </div>
      
      {/* Background icons */}
      <div className="absolute inset-0 flex items-center justify-between px-1">
        <SunIcon className={`w-4 h-4 transition-opacity duration-300 ${
          theme === 'light' ? 'opacity-0' : 'opacity-70 text-yellow-300'
        }`} />
        <MoonIcon className={`w-4 h-4 transition-opacity duration-300 ${
          theme === 'dark' ? 'opacity-0' : 'opacity-70 text-indigo-300'
        }`} />
      </div>
    </button>
  );
};

export default ThemeToggle;
