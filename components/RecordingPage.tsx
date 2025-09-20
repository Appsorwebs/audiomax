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

  const startRecording = async () => {
    if (isProcessing) return; // Prevent action during processing
    
    try {
      setError(null);
      
      // Request microphone access with optimized constraints for mobile
      const constraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
          channelCount: 1, // Mono for smaller file size
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      setPermissionStatus('granted');
      
      const mimeType = getSupportedMimeType();
      console.log('Using MIME type:', mimeType);
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000, // 128kbps for good quality but reasonable size
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = []; // Reset chunks
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        console.log('MediaRecorder onstop event fired');
        finishRecording();
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setError('Recording failed. Please try again.');
        setIsRecording(false);
      };

      // Start recording with data collection every second for better progress tracking
      mediaRecorder.start(1000);
      setIsRecording(true);
      console.log('Recording started, MediaRecorder state:', mediaRecorder.state);
      
      // Start timer
      timerIntervalRef.current = window.setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);

    } catch (err: any) {
      console.error("Error accessing microphone:", err);
      setPermissionStatus('denied');
      
      if (err.name === 'NotAllowedError') {
        setError('Microphone access denied. Please allow microphone access in your browser settings and try again.');
      } else if (err.name === 'NotFoundError') {
        setError('No microphone found. Please connect a microphone and try again.');
      } else if (err.name === 'NotSupportedError') {
        setError('Audio recording is not supported in this browser.');
      } else {
        setError('Could not access microphone. Please ensure permission is granted and try again.');
      }
    }
  };

  const stopRecording = () => {
    console.log('STOP BUTTON CLICKED - FORCE STOPPING EVERYTHING');
    
    // IMMEDIATELY stop everything - no checks, no delays
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
        }
      } catch (error) {
        console.error('Error calling MediaRecorder.stop():', error);
      }
      
      // Don't wait for onstop - force cleanup after 500ms
      setTimeout(() => {
        console.log('Force cleanup after 500ms');
        finishRecording();
      }, 500);
    } else {
      console.log('No MediaRecorder found, immediate cleanup');
      finishRecording();
    }
  };

  const finishRecording = () => {
    console.log('finishRecording called');
    
    // Create audio file if we have any chunks at all
    if (audioChunksRef.current && audioChunksRef.current.length > 0) {
      try {
        const mimeType = getSupportedMimeType();
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const extension = getFileExtension(mimeType);
        const audioFile = new File([audioBlob], `recording-${new Date().toISOString()}.${extension}`, { type: mimeType });
        
        console.log('Audio file created:', {
          size: audioFile.size,
          type: audioFile.type,
          chunks: audioChunksRef.current.length
        });
        
        // Reset everything
        audioChunksRef.current = [];
        setElapsedTime(0);
        setIsProcessing(false);
        
        onRecordingComplete(audioFile);
        return;
      } catch (error) {
        console.error('Error creating audio file:', error);
      }
    }
    
    // If no audio or error, just reset everything
    console.log('No audio data or error - resetting to initial state');
    audioChunksRef.current = [];
    setElapsedTime(0);
    setIsProcessing(false);
    setError('Recording stopped but no audio data was captured. Please try again.');
  };

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
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
                        ? 'bg-gray-500 cursor-not-allowed animate-pulse'
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
              </div>
            )}

            {/* Emergency Force Stop Button - for debugging */}
            {(isRecording || isProcessing) && (
              <div className="mt-4">
                <button 
                  onClick={() => {
                    console.log('EMERGENCY FORCE STOP TRIGGERED');
                    setIsRecording(false);
                    setIsProcessing(false);
                    setElapsedTime(0);
                    if (timerIntervalRef.current) {
                      clearInterval(timerIntervalRef.current);
                      timerIntervalRef.current = null;
                    }
                    if (streamRef.current) {
                      streamRef.current.getTracks().forEach(track => track.stop());
                      streamRef.current = null;
                    }
                    audioChunksRef.current = [];
                    mediaRecorderRef.current = null;
                  }}
                  className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                >
                  🚨 Force Stop Emergency Reset
                </button>
              </div>
            )}
        </div>
    </div>
  );
};

// Inline StopIcon component to avoid import issues
const StopIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 6h12v12H6z" />
    </svg>
);

export default RecordingPage;