import React, { useState, useRef, useEffect } from 'react';
import { BackArrowIcon } from './icons/BackArrowIcon';
import { MicrophoneIcon } from './icons/MicrophoneIcon';

interface RecordingPageProps {
  onBack: () => void;
  onRecordingComplete: (file: File) => void;
}

const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

// Cross-platform audio format detection
const getSupportedMimeType = (): string => {
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
    'audio/wav'
  ];
  
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return 'audio/webm'; // fallback
};

const getFileExtension = (mimeType: string): string => {
  if (mimeType.includes('webm')) return 'webm';
  if (mimeType.includes('mp4')) return 'm4a';
  if (mimeType.includes('ogg')) return 'ogg';
  if (mimeType.includes('wav')) return 'wav';
  return 'webm';
};

const RecordingPage: React.FC<RecordingPageProps> = ({ onBack, onRecordingComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Check microphone permission status
  useEffect(() => {
    const checkPermission = async () => {
      try {
        // Check if we're on HTTPS or localhost
        if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
          setError('Audio recording requires HTTPS or localhost. Please use a secure connection.');
          return;
        }

        if (navigator.permissions) {
          const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          setPermissionStatus(permission.state as 'granted' | 'denied');
          
          permission.onchange = () => {
            setPermissionStatus(permission.state as 'granted' | 'denied');
          };
        }
      } catch (err) {
        console.log('Permission check not supported, will check on first use');
      }
    };

    checkPermission();
  }, []);

  const cleanup = () => {
    // Stop timer
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    
    // Stop audio stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // Clear MediaRecorder reference
    mediaRecorderRef.current = null;
  };

  const startRecording = async () => {
    if (isRecording || isProcessing) return;
    
    try {
      setError(null);
      setElapsedTime(0);
      audioChunksRef.current = [];
      
      // Request microphone access
      const constraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
          channelCount: 1,
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      setPermissionStatus('granted');
      
      const mimeType = getSupportedMimeType();
      console.log('Starting recording with MIME type:', mimeType);
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000,
      });
      
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        console.log('MediaRecorder stopped, creating file...');
        createAudioFile();
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setError('Recording failed. Please try again.');
        resetRecording();
      };

      // Start recording
      mediaRecorder.start();
      setIsRecording(true);
      
      // Start timer
      timerIntervalRef.current = window.setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);

    } catch (err: any) {
      console.error("Error starting recording:", err);
      setPermissionStatus('denied');
      
      if (err.name === 'NotAllowedError') {
        setError('Microphone access denied. Please allow microphone access and try again.');
      } else if (err.name === 'NotFoundError') {
        setError('No microphone found. Please connect a microphone and try again.');
      } else if (err.name === 'NotSupportedError') {
        setError('Audio recording is not supported in this browser.');
      } else {
        setError('Could not access microphone. Please try again.');
      }
    }
  };

  const stopRecording = () => {
    console.log('STOP BUTTON CLICKED - FORCE STOPPING EVERYTHING');
    
    // IMMEDIATELY force stop - no guards or checks
    setIsRecording(false);
    setIsProcessing(true);
    
    // Force stop timer immediately
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
      console.log('Timer stopped');
    }
    
    // Force stop all audio tracks immediately
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('Force stopped track:', track.kind);
      });
      streamRef.current = null;
      console.log('Stream cleared');
    }
    
    // Force stop MediaRecorder - no state checking
    if (mediaRecorderRef.current) {
      try {
        console.log('Current MediaRecorder state:', mediaRecorderRef.current.state);
        // Stop regardless of state
        if (mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
          console.log('MediaRecorder.stop() called');
        } else {
          // If already inactive, create file immediately
          createAudioFile();
        }
      } catch (error) {
        console.error('Error calling MediaRecorder.stop():', error);
        createAudioFile(); // Force create file on error
      }
      
      // Timeout fallback if onstop doesn't fire within 2 seconds
      setTimeout(() => {
        if (isProcessing) {
          console.log('Force cleanup after 2s timeout');
          createAudioFile();
        }
      }, 2000);
    } else {
      console.log('No MediaRecorder found, immediate cleanup');
      createAudioFile();
    }
  };

  const createAudioFile = () => {
    console.log('createAudioFile called, chunks available:', audioChunksRef.current.length);
    
    try {
      if (audioChunksRef.current.length === 0) {
        console.warn('No audio chunks available, resetting state');
        resetRecording();
        setError('Recording stopped but no audio data was captured. Please try again.');
        return;
      }
      
      const mimeType = getSupportedMimeType();
      const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
      
      // Check if blob has meaningful size (at least 1KB for a very short recording)
      if (audioBlob.size < 1024) {
        console.warn('Audio blob too small, likely corrupted:', audioBlob.size, 'bytes');
        resetRecording();
        setError('Recording too short or corrupted. Please try recording for at least 1 second.');
        return;
      }
      
      const extension = getFileExtension(mimeType);
      const audioFile = new File(
        [audioBlob], 
        `recording-${Date.now()}.${extension}`, 
        { type: mimeType }
      );
      
      console.log('Audio file created:', {
        name: audioFile.name,
        size: audioFile.size,
        type: audioFile.type,
        chunks: audioChunksRef.current.length
      });
      
      cleanup();
      setIsProcessing(false);
      setElapsedTime(0);
      audioChunksRef.current = [];
      
      onRecordingComplete(audioFile);
      
    } catch (error) {
      console.error('Error creating audio file:', error);
      resetRecording();
      setError('Failed to create audio file. Please try recording again.');
    }
  };

  const resetRecording = () => {
    cleanup();
    setIsRecording(false);
    setIsProcessing(false);
    setElapsedTime(0);
    audioChunksRef.current = [];
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);
  
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
        <button onClick={onBack} className="absolute top-28 left-4 md:left-8 flex items-center text-sm text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300 transition-colors">
            <BackArrowIcon className="h-4 w-4 mr-2" />
            Back to Dashboard
        </button>

        <div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                {isProcessing ? "Processing Recording..." : isRecording ? "Recording in Progress" : "Ready to Record"}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mb-8">
                {isProcessing ? "Please wait while we process your recording." : isRecording ? "Press the red button below to stop recording." : "Press the button below to start recording."}
            </p>

            {permissionStatus === 'denied' && !error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-600 dark:text-red-400 text-sm">
                  Microphone access is required for recording. Please enable it in your browser settings.
                </p>
              </div>
            )}

            <div className="w-64 h-64 rounded-full flex items-center justify-center bg-slate-200 dark:bg-slate-800/50 relative">
                <div className={`absolute inset-0 rounded-full bg-sky-500/20 animate-pulse ${isRecording ? 'block' : 'hidden'}`}></div>
                <button 
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={permissionStatus === 'denied' || isProcessing}
                    className={`w-40 h-40 rounded-full text-white flex items-center justify-center transition-all duration-300 shadow-lg ${
                      isProcessing
                        ? 'bg-gray-500 cursor-not-allowed'
                        : isRecording 
                        ? 'bg-red-500 hover:bg-red-600' 
                        : permissionStatus === 'denied' 
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : 'bg-sky-500 hover:bg-sky-600'
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

            <p className="text-5xl font-mono font-bold text-slate-900 dark:text-slate-100 mt-8">
                {formatTime(elapsedTime)}
            </p>

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

            {/* Emergency Reset Button - Always available when recording or processing */}
            {(isRecording || isProcessing) && (
              <div className="mt-6">
                <button 
                  onClick={() => {
                    console.log('EMERGENCY RESET TRIGGERED');
                    // Force immediate reset of all states
                    resetRecording();
                    setError(null);
                  }}
                  className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors border-2 border-red-700"
                >
                  🚨 Force Stop & Reset
                </button>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Use if recording won't stop normally
                </p>
              </div>
            )}
        </div>
    </div>
  );
};

// Inline StopIcon component
const StopIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 6h12v12H6z" />
    </svg>
);

export default RecordingPage;