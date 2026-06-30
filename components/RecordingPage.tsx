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

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isProcessingRef = useRef(false);
  const completionHandledRef = useRef(false);
  const stopTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cleanup = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (stopTimeoutRef.current) {
      clearTimeout(stopTimeoutRef.current);
      stopTimeoutRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
    isProcessingRef.current = false;
  };

  const startRecording = async () => {
    try {
      setError(null);

      if (!navigator.mediaDevices?.getUserMedia) {
        setError('This browser does not support microphone recording. Please use a modern browser or mobile device.');
        return;
      }

      if (typeof MediaRecorder === 'undefined') {
        setError('This browser does not support audio recording. Please use a modern browser or mobile device.');
        return;
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      
      streamRef.current = stream;
      
      const mimeType = getSupportedMimeType();
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        if (!isProcessingRef.current || completionHandledRef.current) {
          return;
        }
        completionHandledRef.current = true;
        
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
          
          if (audioBlob.size < 100) {
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
          
          isProcessingRef.current = false;
          setIsProcessing(false);
          setElapsedTime(0);
          cleanup();
          onRecordingComplete(audioFile);
        } else {
          setError('No audio data recorded. Please try again.');
          isProcessingRef.current = false;
          setIsProcessing(false);
          setElapsedTime(0);
          cleanup();
        }
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setElapsedTime(0);
      
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);

    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setError('Microphone access denied. Please allow microphone access and try again.');
      } else {
        setError('Could not access microphone. Please try again.');
      }
      cleanup();
    }
  };

  const stopRecording = () => {
    completionHandledRef.current = false;
    
    setIsRecording(false);
    setIsProcessing(true);
    isProcessingRef.current = true;
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (mediaRecorderRef.current) {
      try {
        if (mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
        } else {
          createAudioFileManually();
        }
      } catch {
        createAudioFileManually();
      }
    } else {
      createAudioFileManually();
    }
    
    stopTimeoutRef.current = setTimeout(() => {
      if (isProcessingRef.current && !completionHandledRef.current) {
        completionHandledRef.current = true;
        createAudioFileManually();
      }
    }, 1000);
  };

  const createAudioFileManually = () => {
    if (!isProcessingRef.current) {
      return;
    }
    
    if (audioChunksRef.current.length === 0) {
      setError('No audio data recorded. Please try again.');
      setIsProcessing(false);
      setElapsedTime(0);
      cleanup();
      return;
    }
    
    try {
      const mimeType = getSupportedMimeType();
      const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
      
      if (audioBlob.size < 100) {
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
      
      isProcessingRef.current = false;
      setIsProcessing(false);
      setElapsedTime(0);
      cleanup();
      onRecordingComplete(audioFile);
      
    } catch {
      setError('Failed to create audio file. Please try again.');
      isProcessingRef.current = false;
      setIsProcessing(false);
      setElapsedTime(0);
      cleanup();
    }
  };

  useEffect(() => {
    return () => cleanup();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center relative">
      <button 
        onClick={onBack} 
        className="absolute top-4 left-4 md:left-8 glass-button flex items-center group"
      >
        <BackArrowIcon className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
        Back to Dashboard
      </button>

      <div className="max-w-2xl mx-auto px-4">
        <h2 className="text-5xl font-black gradient-text mb-4" style={{animation: 'fade-in-up 0.6s ease-out'}}>
          {isProcessing ? "Processing Recording..." : isRecording ? "Recording in Progress" : "Ready to Record"}
        </h2>
        <p className="text-white/70 text-xl mb-12" style={{animation: 'fade-in-up 0.6s ease-out 0.1s both'}}>
          {isProcessing 
            ? "Please wait while we process your recording. ⚡" 
            : isRecording 
            ? "Press the red button below to stop recording. 🎙️" 
            : "Press the button below to start recording. 🚀"
          }
        </p>

        <div className="relative inline-block mb-8" style={{animation: 'scale-in 0.6s ease-out 0.2s both'}}>
          {isRecording && (
            <>
              <div className="absolute inset-0 rounded-full bg-red-500/20 animate-pulse" style={{animation: 'pulse-glow 1.5s ease-in-out infinite'}}></div>
              <div className="absolute inset-[-20px] rounded-full border-2 border-red-500/30 animate-ping"></div>
              <div className="absolute inset-[-40px] rounded-full border border-red-500/20 animate-ping" style={{animationDelay: '0.5s'}}></div>
            </>
          )}
          
          <div className="w-80 h-80 rounded-full glass-card flex items-center justify-center relative overflow-hidden group">
            <div className={`absolute inset-0 opacity-50 ${
              isRecording 
                ? 'bg-gradient-to-br from-red-500 via-pink-500 to-red-600' 
                : 'bg-gradient-to-br from-purple-500 via-blue-500 to-pink-500'
            } ${isRecording ? 'animate-pulse' : ''}`}></div>
            
            <button 
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isProcessing}
              className={`relative z-10 w-56 h-56 rounded-full text-white flex items-center justify-center transition-all duration-500 shadow-2xl transform hover:scale-110 ${
                isProcessing
                  ? 'bg-gradient-to-br from-gray-500 to-gray-600 cursor-not-allowed'
                  : isRecording 
                    ? 'bg-gradient-to-br from-red-500 to-red-700 hover:shadow-red-500/50' 
                    : 'bg-gradient-to-br from-purple-500 to-blue-600 hover:shadow-purple-500/50 animate-pulse-glow'
              }`}
              aria-label={isProcessing ? 'Processing recording' : isRecording ? 'Stop recording' : 'Start recording'}
            >
              {isProcessing ? (
                <div className="relative">
                  <div className="loading-spinner"></div>
                </div>
              ) : isRecording ? (
                <StopIcon className="h-20 w-20 drop-shadow-lg" />
              ) : (
                <MicrophoneIcon className="h-20 w-20 drop-shadow-lg" />
              )}
            </button>
          </div>
        </div>

        <div className="glass-card inline-block px-12 py-6 mb-8" style={{animation: 'fade-in-up 0.6s ease-out 0.3s both'}}>
          <p className="text-6xl font-mono font-black gradient-text">
            {formatTime(elapsedTime)}
          </p>
          <p className="text-sm text-white/50 mt-2 uppercase tracking-wider">Recording Time</p>
        </div>

        {error && (
          <div className="glass-card border-2 border-red-500/50 max-w-md mx-auto" style={{animation: 'scale-in 0.3s ease-out'}}>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 text-2xl">⚠️</div>
              <div className="flex-1 text-left">
                <p className="text-red-300 font-semibold mb-2">{error}</p>
                <button 
                  onClick={() => setError(null)}
                  className="text-sm text-red-400 hover:text-red-300 underline"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {(isRecording || isProcessing) && (
          <div className="mt-8" style={{animation: 'fade-in-up 0.6s ease-out 0.4s both'}}>
            <button 
              onClick={() => {
                cleanup();
                setIsRecording(false);
                setIsProcessing(false);
                setElapsedTime(0);
                setError('Recording reset successfully.');
                setTimeout(() => setError(null), 3000);
              }}
              className="glass-button border-2 border-red-500/50 hover:border-red-500 hover:bg-red-500/20 transition-all duration-300"
            >
              <span className="mr-2">🚨</span> Emergency Reset
            </button>
            <p className="text-xs text-white/40 mt-2">
              Use if recording won't stop
            </p>
          </div>
        )}

        {isRecording && (
          <div className="flex justify-center space-x-1 mt-8" style={{animation: 'fade-in-up 0.6s ease-out 0.5s both'}}>
            {[...Array(12)].map((_, i) => (
              <div 
                key={i}
                className="w-1 bg-gradient-to-t from-purple-500 to-pink-500 rounded-full"
                style={{
                  height: `${Math.random() * 40 + 10}px`,
                  animation: `float 1s ease-in-out infinite`,
                  animationDelay: `${i * 0.1}s`
                }}
              ></div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const StopIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 6h12v12H6z" />
  </svg>
);

export default RecordingPage;