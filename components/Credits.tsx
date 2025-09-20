import React from 'react';

const Credits: React.FC = () => {
  return (
    <div className="mt-8 py-6 border-t border-slate-200 dark:border-slate-700">
      <div className="text-center space-y-2">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          AudioMax - AI-Powered Audio Transcription
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          © 2025{' '}
          <a 
            href="https://www.appsorwebs.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="font-semibold text-sky-600 dark:text-sky-400 hover:underline transition-colors"
          >
            AppsOrWebs Limited
          </a>
          . All rights reserved.
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          <a 
            href="https://www.appsorwebs.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors cursor-pointer"
          >
            Developed with ❤️ by AppsOrWebs Limited
          </a>
        </p>
        <div className="flex justify-center items-center space-x-4 mt-2">
          <a 
            href="https://www.appsorwebs.com/privacy" 
            className="text-xs text-slate-400 dark:text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            Privacy Policy
          </a>
          <span className="text-xs text-slate-300 dark:text-slate-600">•</span>
          <a 
            href="https://www.appsorwebs.com/terms" 
            className="text-xs text-slate-400 dark:text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            Terms of Service
          </a>
          <span className="text-xs text-slate-300 dark:text-slate-600">•</span>
          <a 
            href="https://www.appsorwebs.com/contact" 
            className="text-xs text-slate-400 dark:text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            Contact
          </a>
        </div>
      </div>
    </div>
  );
};

export default Credits;