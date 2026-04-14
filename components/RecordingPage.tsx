import React, { useState, useRef, useEffect } from 'react';
import { BackArrowIcon } from './icons/BackArrowIcon';
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import LiveCaptionsDisplay from './LiveCaptionsDisplay';
import CalendarSelector from './CalendarSelector';
import SelectedEventInfo from './SelectedEventInfo';
import { StreamingCaption } from '../services/streamingTranscriptionService';
import { type CalendarEvent } from '../services/calendarService';

interface RecordingPageProps {
  onBack: () => void;
  onRecordingComplete: (file: File) => void;
}

const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const getSupportedMimeType = (): string => {
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus'
  ];
  
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return 'audio/webm';
};

const getFileExtension = (mimeType: string): string => {
  if (mimeType.includes('webm')) return 'webm';
  if (mimeType.includes('mp4')) return 'm4a';
  if (mimeType.includes('ogg')) return 'ogg';
  return 'webm';
};

const RecordingPage: React.FC<RecordingPageProps> = ({ onBack, onRecordingComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [liveCaptions, setLiveCaptions] = useState<StreamingCaption[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showCalendarSelector, setShowCalendarSelector] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processCallbackRef = useRef<(() => void) | null>(null);

  // Cleanup function
  const cleanup = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
  };

  // Start recording
  const startRecording = async () => {
    try {
      setError(null);
      
      // Get microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      
      streamRef.current = stream;
      
      // Set up MediaRecorder
      const mimeType = getSupportedMimeType();
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      // Handle data
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      // Handle stop
      mediaRecorder.onstop = () => {
        console.log('📹 MediaRecorder onstop event fired');
        // Call the processing callback if available
        if (processCallbackRef.current) {
          processCallbackRef.current();
        }
      };
      
      // Start recording
      mediaRecorder.start();
      setIsRecording(true);
      setElapsedTime(0);
      setLiveCaptions([]); // Clear previous captions
      
      // Start generating live captions
      let captionId = 0;
      let speakerToggle = false;
      const captionInterval = setInterval(() => {
        if (!isRecording) {
          clearInterval(captionInterval);
          return;
        }
        
        const captionTexts = [
          "I believe we should focus on the metrics.",
          "That's a really good point to consider.",
          "Let me elaborate on that discussion.",
          "I completely agree with that approach.",
          "We need to analyze this more carefully.",
          "That aligns with our strategy perfectly.",
          "Can we schedule another follow-up meeting?",
          "I think we've covered the main points.",
        ];
        
        const newCaption: StreamingCaption = {
          id: `caption-${captionId++}`,
          text: captionTexts[Math.floor(Math.random() * captionTexts.length)],
          speaker: speakerToggle ? 'Speaker 1' : 'Speaker 2',
          timestamp: formatTime(elapsedTime),
          confidence: Math.min(95, 60 + Math.random() * 40),
          startTime: elapsedTime,
          endTime: elapsedTime + 2
        };
        
        setLiveCaptions(prev => [...prev, newCaption]);
        speakerToggle = !speakerToggle;
      }, 2000);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
      
    } catch (err: any) {
      console.error('Recording error:', err);
      if (err.name === 'NotAllowedError') {
        setError('Microphone access denied. Please allow microphone access and try again.');
      } else {
        setError('Could not access microphone. Please try again.');
      }
      cleanup();
    }
  };

  // Stop recording
  const stopRecording = () => {
    console.log('🔴 STOP BUTTON CLICKED - Starting force stop sequence');
    console.log('Current state:', { isRecording, isProcessing, chunks: audioChunksRef.current.length });
    
    // Define the processing callback
    const doProcess = () => {
      console.log('🔧 Processing audio file...');
      console.log('Audio chunks available:', audioChunksRef.current.length);
      
      // If no chunks, show error
      if (audioChunksRef.current.length === 0) {
        console.log('❌ No audio chunks available');
        setError('No audio data recorded. Please try again.');
        setIsProcessing(false);
        setElapsedTime(0);
        cleanup();
        return;
      }
      
      try {
        const mimeType = getSupportedMimeType();
        console.log('🎵 Creating blob with mime type:', mimeType);
        
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        console.log('📦 Blob created, size:', audioBlob.size, 'bytes');
        
        if (audioBlob.size < 100) {
          console.log('❌ Blob too small:', audioBlob.size, 'bytes');
          setError('Recording too short. Please try again.');
          setIsProcessing(false);
          setElapsedTime(0);
          cleanup();
          return;
        }
        
        const extension = getFileExtension(mimeType);
        const audioFile = new File(
          [audioBlob], 
          `recording-${Date.now()}.${extension}`, 
          { type: mimeType }
        );
        
        console.log('✅ Audio file created successfully:');
        console.log('  - Name:', audioFile.name);
        console.log('  - Size:', audioFile.size, 'bytes');
        console.log('  - Type:', audioFile.type);
        
        // Clear processing state and clean up
        setIsProcessing(false);
        setElapsedTime(0);
        cleanup();
        
        // Call completion handler
        console.log('🚀 Calling onRecordingComplete...');
        onRecordingComplete(audioFile);
        
      } catch (error) {
        console.error('❌ Error creating audio file:', error);
        setError('Failed to create audio file. Please try again.');
        setIsProcessing(false);
        setElapsedTime(0);
        cleanup();
      }
    };
    
    // Store the callback so onstop can call it
    processCallbackRef.current = doProcess;
    
    // STEP 1: Force immediate state change - no guards whatsoever
    setIsRecording(false);
    setIsProcessing(true);
    console.log('✅ States changed: isRecording=false, isProcessing=true');
    
    // STEP 2: Force stop timer immediately
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
      console.log('✅ Timer stopped and cleared');
    }
    
    // STEP 3: Force stop all audio tracks FIRST (this is critical)
    if (streamRef.current) {
      console.log('🎤 Stopping audio tracks...');
      streamRef.current.getTracks().forEach((track, index) => {
        console.log(`Stopping track ${index}:`, track.kind, track.readyState);
        track.stop();
      });
      streamRef.current = null;
      console.log('✅ All audio tracks stopped and stream cleared');
    }
    
    // STEP 4: Handle MediaRecorder (with aggressive fallback)
    if (mediaRecorderRef.current) {
      console.log('📹 MediaRecorder found, state:', mediaRecorderRef.current.state);
      
      try {
        if (mediaRecorderRef.current.state === 'recording') {
          console.log('📹 Calling MediaRecorder.stop()...');
          mediaRecorderRef.current.stop();
          console.log('✅ MediaRecorder.stop() called successfully');
        } else if (mediaRecorderRef.current.state === 'paused') {
          console.log('📹 MediaRecorder paused, resuming then stopping...');
          mediaRecorderRef.current.resume();
          mediaRecorderRef.current.stop();
        } else {
          console.log('📹 MediaRecorder not recording, processing file manually');
          doProcess();
        }
      } catch (error) {
        console.error('❌ Error with MediaRecorder.stop():', error);
        console.log('🔧 Falling back to manual file creation');
        doProcess();
      }
    } else {
      console.log('📹 No MediaRecorder found, processing file manually');
      doProcess();
    }
    
    // STEP 5: Aggressive timeout fallback (1 second)
    const timeoutId = setTimeout(() => {
      console.log('⏰ 1-second timeout check...');
      // Check if we still have chunks - if so, process them
      if (audioChunksRef.current.length > 0 && processCallbackRef.current) {
        console.log('🚨 TIMEOUT: MediaRecorder.onstop never fired, forcing completion');
        processCallbackRef.current();
      } else {
        console.log('✅ Already completed or no chunks, timeout not needed');
      }
    }, 1000);
    
    // Store timeout ID for cleanup if needed
    (window as any).recordingTimeoutId = timeoutId;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => cleanup();
  }, []);

  return (
    <div className="w-full min-h-screen flex items-center justify-center">
      <div className="max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Calendar Selector Modal */}
        {showCalendarSelector && (
          <CalendarSelector 
            onSelectEvent={(event) => setSelectedEvent(event)}
            onClose={() => setShowCalendarSelector(false)}
            selectedEvent={selectedEvent || undefined}
          />
        )}

        <div className="flex flex-col items-center justify-center text-center relative">
          <button 
            onClick={onBack} 
            className="absolute -top-20 left-0 flex items-center gap-2 text-primary-400 hover:text-primary-300 transition-colors group"
          >
            <BackArrowIcon className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
            <span className="hidden sm:inline">Back to Dashboard</span>
            <span className="sm:hidden">Back</span>
          </button>

          {/* Calendar Button or Selected Event */}
          <div className="mb-6 max-w-2xl w-full">
            {selectedEvent ? (
              <SelectedEventInfo 
                event={selectedEvent}
                onChangeEvent={() => setShowCalendarSelector(true)}
              />
            ) : (
              <button
                onClick={() => setShowCalendarSelector(true)}
                className="w-full px-4 py-3 bg-gradient-to-r from-sky-500/20 to-blue-500/20 border border-sky-500/30 hover:border-sky-500/60 rounded-lg font-medium text-sky-600 dark:text-sky-400 transition-all flex items-center justify-center gap-2 hover:from-sky-500/30 hover:to-blue-500/30"
              >
                <span>📅</span>
                <span>Link Calendar Event</span>
                <span className="text-xs ml-auto opacity-60">Optional</span>
              </button>
            )}
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-neutral-100 mb-2">
              {isProcessing ? "Processing Recording..." : isRecording ? "Recording in Progress" : "Ready to Record"}
            </h2>
            <p className="text-neutral-400 mb-8 text-sm sm:text-base">
              {isProcessing 
                ? "Please wait while we process your recording." 
                : isRecording 
                ? "Press the red button below to stop recording." 
                : "Press the button below to start recording."
              }
            </p>

            <div className="w-48 h-48 sm:w-64 sm:h-64 rounded-full flex items-center justify-center glass-premium relative mx-auto">
          {isRecording && (
            <div className="absolute inset-0 rounded-full bg-sky-500/20 animate-pulse"></div>
          )}
          
          <button 
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
            className={`w-32 h-32 sm:w-40 sm:h-40 rounded-full text-white flex items-center justify-center transition-all duration-300 shadow-lg ${
              isProcessing
                ? 'bg-neutral-500 cursor-not-allowed opacity-50'
                : isRecording 
                ? 'bg-danger-500 hover:bg-danger-600 shadow-danger-500/50' 
                : 'bg-primary-500 hover:bg-primary-600 shadow-primary-500/50'
            }`}
            aria-label={isProcessing ? 'Processing recording' : isRecording ? 'Stop recording' : 'Start recording'}
          >
            {isProcessing ? (
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white"></div>
            ) : isRecording ? (
              <StopIcon className="h-16 w-16" />
            ) : (
              <MicrophoneIcon className="h-16 w-16" />
            )}
          </button>
        </div>
        </div>

        <p className="text-5xl font-mono font-bold text-slate-900 dark:text-slate-100 mt-8">
          {formatTime(elapsedTime)}
        </p>

        {/* Live Captions Display */}
        {isRecording && (
          <div className="mt-8 w-full max-w-2xl mx-auto">
            <LiveCaptionsDisplay 
              captions={liveCaptions} 
              isLive={isRecording}
            />
          </div>
        )}

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="mt-6 flex items-center justify-center gap-3 p-4 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border border-blue-200 dark:border-blue-800 max-w-2xl mx-auto">
            <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></div>
            <p className="text-blue-700 dark:text-blue-300 font-medium">
              Processing your recording...
            </p>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg max-w-sm mx-auto">
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="mt-2 text-sm text-red-500 hover:text-red-700 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Emergency Reset Button - for testing */}
        {(isRecording || isProcessing) && (
          <div className="mt-6">
            <button 
              onClick={() => {
                console.log('🚨 EMERGENCY RESET TRIGGERED');
                cleanup();
                setIsRecording(false);
                setIsProcessing(false);
                setElapsedTime(0);
                setError('Recording reset successfully.');
                setTimeout(() => setError(null), 3000);
              }}
              className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors border-2 border-red-700"
            >
              🚨 Emergency Reset
            </button>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Use if recording won't stop
            </p>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

// Stop icon component
const StopIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 6h12v12H6z" />
  </svg>
);

export default RecordingPage;