import React from 'react';
import { LogoIcon } from './icons/LogoIcon';
import { User } from '../types';

interface HeaderProps {
  user: User;
  onLogout: () => void;
  onLoginClick: () => void;
  onHomeClick: () => void;
  onPricingClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout, onLoginClick, onHomeClick, onPricingClick }) => {
  return (
    <header className="border-b border-slate-200 dark:border-slate-700/50">
      <div className="container mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
        <button onClick={onHomeClick} className="flex items-center focus:outline-none focus:ring-2 focus:ring-sky-500 rounded-md p-1 -m-1">
          <LogoIcon className="h-8 w-8 text-sky-500 dark:text-sky-400" />
          <h1 className="text-xl font-bold ml-3 tracking-tight text-slate-900 dark:text-slate-100">AudioMax</h1>
        </button>
        <div className="flex items-center space-x-2 md:space-x-4">
            {user && !user.isGuest ? (
                <div className="flex items-center space-x-2 md:space-x-4">
                    <span className="hidden md:inline text-sm text-slate-500 dark:text-slate-400">{user.email}</span>
                     <button 
                        onClick={onLogout}
                        className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-red-500 dark:hover:text-red-400 transition-colors px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        Logout
                      </button>
                </div>
            ) : (
                 <button 
                    onClick={onLoginClick}
                    className="text-sm font-semibold text-white bg-sky-500 hover:bg-sky-600 transition-colors px-4 py-2 rounded-md"
                  >
                    Login / Sign Up
                  </button>
            )}
           <button 
            onClick={onPricingClick}
            className="hidden sm:inline-block text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-sky-500 dark:hover:text-sky-400 transition-colors px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Pricing
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;