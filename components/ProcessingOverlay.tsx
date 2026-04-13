import React from 'react';
import { Spinner } from './ui/Spinner';

interface ProcessingOverlayProps {
  steps: string[];
  currentStep: number;
  progressText?: string;
}

const ProcessingOverlay: React.FC<ProcessingOverlayProps> = ({ steps, currentStep, progressText }) => {
  const progress = Math.round(((currentStep + 1) / steps.length) * 100);

  return (
    <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-xl flex flex-col items-center justify-center z-50 p-4">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-transparent to-secondary-500/10 animate-pulse" />

      <div className="glass-premium p-8 rounded-2xl shadow-2xl max-w-md w-full relative z-10 border border-primary-500/30">
        {/* Spinner */}
        <div className="flex justify-center mb-6">
          <div className="relative w-16 h-16">
            <Spinner className="h-16 w-16 text-primary-400 mx-auto" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-bold text-primary-400">{progress}%</span>
            </div>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-neutral-100 text-center mb-2">
          Processing your audio
        </h2>
        <p className="text-neutral-400 text-center text-sm mb-6">
          Hang tight, this won't take long...
        </p>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="w-full h-2 bg-neutral-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-neutral-400 text-center mt-2">{progress}% complete</p>
        </div>

        {/* Steps */}
        <div className="space-y-2">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center gap-3 transition-all duration-300">
              <div
                className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-semibold text-xs transition-all ${
                  index < currentStep
                    ? 'bg-gradient-to-r from-success-500 to-success-600 text-white shadow-lg'
                    : index === currentStep
                    ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white animate-pulse'
                    : 'bg-neutral-700 text-neutral-400'
                }`}
              >
                {index < currentStep ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : index === currentStep ? (
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={`text-sm font-medium transition-colors ${
                  index <= currentStep
                    ? 'text-neutral-200'
                    : 'text-neutral-500'
                }`}
              >
                {index === currentStep && progressText ? progressText : step}
              </span>
            </div>
          ))}
        </div>

        {/* Tip */}
        <div className="mt-6 p-3 bg-primary-500/10 border border-primary-500/20 rounded-lg">
          <p className="text-xs text-primary-300 text-center">
            💡 Tip: File size and duration affect processing time
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProcessingOverlay;