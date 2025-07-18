import React from 'react';
import { Spinner } from './ui/Spinner';

interface ProcessingOverlayProps {
  steps: string[];
  currentStep: number;
  progressText?: string;
}

const ProcessingOverlay: React.FC<ProcessingOverlayProps> = ({ steps, currentStep, progressText }) => {
  return (
    <div className="fixed inset-0 bg-slate-900 bg-opacity-80 backdrop-blur-sm flex flex-col items-center justify-center z-50 p-4">
      <div className="text-center p-6 bg-slate-800/80 rounded-lg shadow-2xl">
        <Spinner className="h-12 w-12 text-sky-400 mx-auto" />
        <h2 className="text-2xl font-bold text-slate-100 mt-6">Processing your audio...</h2>
        <p className="text-slate-400 mt-2">This will just take a moment.</p>
        <div className="mt-8 w-80 text-left">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center my-2 transition-all duration-300">
              <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                  index < currentStep ? 'bg-green-500' :
                  index === currentStep ? 'bg-sky-500' :
                  'bg-slate-700'
              }`}>
                {index < currentStep ? (
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : index === currentStep ? (
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                ) : null}
              </div>
              <span className={`text-sm font-medium ${
                  index <= currentStep ? 'text-slate-200' : 'text-slate-500'
              }`}>{index === currentStep && progressText ? progressText : step}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProcessingOverlay;