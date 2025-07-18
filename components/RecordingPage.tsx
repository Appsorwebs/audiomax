import React, { useState, useRef, useEffect } from 'react';
import { BackArrowIcon } from './icons/BackArrowIcon';
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import { StopIcon } from './icons/StopIcon';

interface RecordingPageProps {
  onBack: () => void;
  onRecordingComplete: (file: File) => void;
}

const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const RecordingPage: React.FC<RecordingPageProps> = ({ onBack, onRecordingComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setError(null);
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
        const audioFile = new File([audioBlob], `recording-${new Date().toISOString()}.webm`, { type: 'audio/webm;codecs=opus' });
        onRecordingComplete(audioFile);
        audioChunksRef.current = [];
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      timerIntervalRef.current = window.setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error("Error accessing microphone:", err);
      setError("Could not access microphone. Please ensure permission is granted and try again.");
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
          mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
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

            <div className="w-64 h-64 rounded-full flex items-center justify-center bg-slate-200 dark:bg-slate-800/50 relative">
                <div className={`absolute inset-0 rounded-full bg-sky-500/20 animate-pulse ${isRecording ? 'block' : 'hidden'}`}></div>
                <button 
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`w-40 h-40 rounded-full text-white flex items-center justify-center transition-all duration-300 shadow-lg ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-sky-500 hover:bg-sky-600'}`}
                    aria-label={isRecording ? 'Stop recording' : 'Start recording'}
                >
                    {isRecording ? <StopIcon className="h-16 w-16" /> : <MicrophoneIcon className="h-16 w-16" />}
                </button>
            </div>

            <p className="text-5xl font-mono font-bold text-slate-900 dark:text-slate-100 mt-8">
                {formatTime(elapsedTime)}
            </p>

            {error && <p className="text-red-500 dark:text-red-400 mt-4 max-w-sm mx-auto">{error}</p>}
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