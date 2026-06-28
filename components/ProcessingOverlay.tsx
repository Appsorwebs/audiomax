import React from 'react';

interface ProcessingOverlayProps {
  steps: string[];
  currentStep: number;
  progressText?: string;
}

const ProcessingOverlay: React.FC<ProcessingOverlayProps> = ({ steps, currentStep, progressText }) => {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center z-50 p-4" style={{animation: 'fade-in-up 0.3s ease-out'}}>
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="relative z-10 text-center glass-card max-w-2xl w-full p-8 shadow-2xl">
        {/* Enhanced Loading Spinner */}
        <div className="relative inline-block mb-8">
          <div className="loading-spinner w-20 h-20"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 animate-pulse"></div>
          </div>
        </div>

        <h2 className="text-4xl font-black gradient-text mb-4">Processing your audio...</h2>
        <p className="text-white/70 text-lg mb-8">✨ AI magic in progress ✨</p>
        
        <div className="space-y-4 text-left">
          {steps.map((step, index) => (
            <div 
              key={index} 
              className="glass-card bg-white/5 flex items-center transition-all duration-500 hover:scale-105"
              style={{animation: `fade-in-up 0.4s ease-out ${index * 0.1}s both`}}
            >
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center mr-4 transition-all duration-500 ${
                  index < currentStep ? 'bg-gradient-to-br from-green-400 to-green-600 shadow-lg shadow-green-500/50' :
                  index === currentStep ? 'bg-gradient-to-br from-purple-500 to-blue-500 shadow-lg shadow-purple-500/50 animate-pulse-glow' :
                  'bg-white/10'
              }`}>
                {index < currentStep ? (
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : index === currentStep ? (
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                ) : (
                  <span className="text-white/50 text-lg font-bold">{index + 1}</span>
                )}
              </div>
              <div className="flex-1">
                <span className={`font-semibold block ${
                    index <= currentStep ? 'text-white' : 'text-white/40'
                }`}>{step}</span>
                {index === currentStep && progressText && (
                  <span className="text-sm text-white/60 mt-1 block">{progressText}</span>
                )}
              </div>
              {index === currentStep && (
                <div className="ml-4">
                  <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Progress Bar */}
        <div className="mt-8 h-2 bg-white/10 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-purple-500 via-blue-500 to-pink-500 transition-all duration-500 rounded-full"
            style={{width: `${(currentStep / steps.length) * 100}%`}}
          ></div>
        </div>
        <p className="text-white/50 text-sm mt-2">
          Step {currentStep + 1} of {steps.length}
        </p>
      </div>
    </div>
  );
};

export default ProcessingOverlay;