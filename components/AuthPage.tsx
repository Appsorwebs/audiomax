import React, { useState } from 'react';
import { User } from '../types';
import * as authService from '../services/authService';
import { Spinner } from './ui/Spinner';
import { LogoIcon } from './icons/LogoIcon';

interface AuthPageProps {
  onAuthSuccess: (user: User) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!email || !password) {
        setError("Email and password are required.");
        setIsLoading(false);
        return;
    }

    try {
      const result = isLogin
        ? await authService.login(email, password)
        : await authService.signup(email, password);

      if (result.user) {
        onAuthSuccess(result.user);
      } else {
        setError(result.error || 'An unexpected error occurred.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="p-3 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl inline-block">
            <LogoIcon className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mt-4 text-neutral-100">Welcome to AudioMax</h1>
          <p className="text-neutral-400">{isLogin ? 'Sign in to your account' : 'Create an account to get started'}</p>
        </div>

        <div className="glass-premium p-6 sm:p-8 rounded-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="form-label">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="demo@audiomax.com"
                className="form-input"
              />
            </div>
            <div>
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="demouser123"
                className="form-input"
              />
            </div>

            {error && <p className="text-sm text-danger-300 text-center">{error}</p>}

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-gradient w-full text-sm"
            >
              {isLoading ? <Spinner className="h-5 w-5" /> : (isLogin ? 'Sign In' : 'Sign Up')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button onClick={() => setIsLogin(!isLogin)} className="text-sm text-primary-400 hover:text-primary-300 transition-colors">
              {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;