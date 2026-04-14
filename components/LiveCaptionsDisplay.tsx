import React, { useEffect, useRef } from 'react';
import { StreamingCaption } from '../services/streamingTranscriptionService';

interface LiveCaptionsDisplayProps {
  captions: StreamingCaption[];
  isLive: boolean;
}

const LiveCaptionsDisplay: React.FC<LiveCaptionsDisplayProps> = ({ captions, isLive }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new captions arrive
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [captions]);

  if (captions.length === 0) {
    return (
      <div className="w-full">
        <div className="p-6 rounded-lg bg-slate-50 dark:bg-slate-800/50 border-2 border-dashed border-slate-300 dark:border-slate-700 text-center">
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {isLive ? 'Captions will appear here as you speak...' : 'No captions yet'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div
        ref={scrollContainerRef}
        className="h-48 overflow-y-auto rounded-lg bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-900/50 border border-slate-200 dark:border-slate-700 p-4 space-y-3"
      >
        {captions.map((caption) => (
          <div
            key={caption.id}
            className={`fade-in p-3 rounded-lg transition-all ${
              isLive && caption.id === captions[captions.length - 1]?.id
                ? 'bg-blue-100 dark:bg-blue-900/30 border-l-2 border-blue-500'
                : 'bg-white dark:bg-slate-800/30 border-l-2 border-transparent'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-gradient-to-r from-primary-500 to-sky-500 text-white text-xs font-bold">
                  {caption.speaker.split(' ')[1]?.[0] || 'S'}
                </span>
              </div>
              <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                    {caption.speaker}
                  </p>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {caption.timestamp}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                    {Math.round(caption.confidence)}%
                  </span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 text-sm break-words">
                  {caption.text}
                </p>
              </div>
            </div>
          </div>
        ))}
        {isLive && (
          <div className="flex items-center gap-2 p-3 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex gap-1">
              <div className="w-1 h-1 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-1 h-1 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-1 h-1 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
            <span>Listening...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveCaptionsDisplay;
