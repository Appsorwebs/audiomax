import React, { useState } from 'react';
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="glass-premium border-b border-primary-500/20 sticky top-0 z-50 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <button
            onClick={onHomeClick}
            className="flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg p-2 -m-2 group"
          >
            <div className="p-2 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg group-hover:shadow-lg group-hover:shadow-primary-500/50 transition-all">
              <LogoIcon className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">
              AudioMax
            </h1>
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <button
              onClick={onPricingClick}
              className="text-neutral-300 hover:text-primary-400 transition-colors font-medium relative group"
            >
              Pricing
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary-400 to-secondary-400 group-hover:w-full transition-all duration-300" />
            </button>
          </div>

          {/* Right Side Controls */}
          <div className="flex items-center gap-3">
            <ThemeToggle />

            {user && !user.isGuest ? (
              <div className="hidden md:flex items-center gap-4 border-l border-neutral-700/50 pl-4 ml-2">
                <span className="text-sm text-neutral-400">
                  {user.email}
                  {user.subscription !== 'Free' && (
                    <span className="badge badge-primary ml-2">{user.subscription}</span>
                  )}
                </span>
                <button
                  onClick={onLogout}
                  className="btn btn-secondary text-sm"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={onLoginClick}
                className="btn btn-gradient hidden md:inline-flex text-sm"
              >
                Login / Sign Up
              </button>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden btn-icon btn-secondary"
            >
              ☰
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pt-4 border-t border-neutral-700/30 space-y-3">
            <button
              onClick={() => {
                onPricingClick();
                setIsMenuOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-neutral-300 hover:bg-primary-500/10 rounded-lg transition-colors"
            >
              Pricing
            </button>
            {user && !user.isGuest ? (
              <>
                <div className="px-4 py-2 text-sm text-neutral-400">
                  {user.email}
                  {user.subscription !== 'Free' && (
                    <span className="badge badge-primary ml-2">{user.subscription}</span>
                  )}
                </div>
                <button
                  onClick={() => {
                    onLogout();
                    setIsMenuOpen(false);
                  }}
                  className="w-full btn btn-secondary text-sm"
                >
                  Logout
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  onLoginClick();
                  setIsMenuOpen(false);
                }}
                className="w-full btn btn-gradient text-sm"
              >
                Login / Sign Up
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;