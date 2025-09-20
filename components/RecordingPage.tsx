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
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const extension = getFileExtension(mimeType);
        const audioFile = new File([audioBlob], `recording-${new Date().toISOString()}.${extension}`, { type: mimeType });
        
        console.log('Recording complete:', {
          size: audioFile.size,
          type: audioFile.type,
          duration: elapsedTime
        });
        
        onRecordingComplete(audioFile);
        audioChunksRef.current = [];
        
        // Clean up stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setError('Recording failed. Please try again.');
        setIsRecording(false);
      };

      // Start recording with data collection every second for better progress tracking
      mediaRecorder.start(1000);
      setIsRecording(true);
      
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
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      setElapsedTime(0);
    }
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
                {isRecording ? "Recording in Progress" : "Ready to Record"}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mb-8">
                {isRecording ? "Press the button below to stop and process." : "Press the button below to start recording."}
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
                    disabled={permissionStatus === 'denied' && !isRecording}
                    className={`w-40 h-40 rounded-full text-white flex items-center justify-center transition-all duration-300 shadow-lg ${
                      isRecording 
                        ? 'bg-red-500 hover:bg-red-600' 
                        : permissionStatus === 'denied' 
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : 'bg-sky-500 hover:bg-sky-600'
                    }`}
                    aria-label={isRecording ? 'Stop recording' : 'Start recording'}
                >
                    {isRecording ? <StopIcon className="h-16 w-16" /> : <MicrophoneIcon className="h-16 w-16" />}
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