import React from 'react';
import { LogoIcon } from './icons/LogoIcon';
import ThemeToggle from './ThemeToggle';
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
    <header className="relative z-50 border-b border-white/10 backdrop-blur-xl bg-white/5">
      <div className="container mx-auto px-4 md:px-8 py-4">
        <div className="glass-card flex items-center justify-between">
          <button 
            onClick={onHomeClick} 
            className="group flex items-center focus:outline-none focus:ring-2 focus:ring-purple-500 rounded-lg p-2 -m-1 transition-all duration-300 hover:scale-105"
          >
            <div className="relative">
              <LogoIcon className="h-10 w-10 text-white drop-shadow-lg group-hover:rotate-12 transition-transform duration-300" />
              <div className="absolute inset-0 blur-xl bg-purple-500/50 group-hover:bg-purple-500/80 transition-all duration-300 -z-10"></div>
            </div>
            <h1 className="text-2xl font-black ml-3 tracking-tight gradient-text">AudioMax</h1>
          </button>
          
          <div className="flex items-center space-x-2 md:space-x-3">
            <ThemeToggle />
            
            {user && !user.isGuest ? (
              <div className="flex items-center space-x-2 md:space-x-3">
                <div className="hidden md:flex items-center glass-card px-4 py-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2"></div>
                  <span className="text-sm font-semibold text-white">{user.email}</span>
                </div>
                <button 
                  onClick={onLogout}
                  className="glass-button text-sm font-semibold text-white hover:text-red-300 hover:border-red-500/50 transition-all duration-300 group"
                >
                  <span className="group-hover:scale-110 inline-block transition-transform duration-300">👋</span>
                  <span className="ml-2">Logout</span>
                </button>
              </div>
            ) : (
              <button 
                onClick={onLoginClick}
                className="gradient-button text-sm font-bold px-6 py-2"
              >
                <span className="mr-2">🚀</span>
                Login / Sign Up
              </button>
            )}
            
            <button 
              onClick={onPricingClick}
              className="hidden sm:inline-block glass-button text-sm font-semibold text-white group relative overflow-hidden"
            >
              <span className="relative z-10">💎 Pricing</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;