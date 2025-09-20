import React, { useRef, ChangeEvent } from 'react';
import { Meeting, User } from '../types';
import { PLAN_LIMITS } from '../constants';
import { UploadIcon } from './icons/UploadIcon';
import { FileAudioIcon } from './icons/FileAudioIcon';
import { RightArrowIcon } from './icons/RightArrowIcon';
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import { SettingsIcon } from './icons/SettingsIcon';
import ApiUsageDisplay from './ApiUsageDisplay';

interface DashboardProps {
  user: User;
  onFileSelect: (file: File) => void;
  onViewMeeting: (meeting: Meeting) => void;
  onRecord: () => void;
  onUpgrade: () => void;
  onOpenSettings: () => void;
}

const StatCard: React.FC<{ title: string; value: string; total: string }> = ({ title, value, total }) => (
    <div className="bg-slate-100 dark:bg-slate-800/50 p-4 rounded-lg">
        <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
        <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{value}<span className="text-base font-normal text-slate-500 dark:text-slate-400"> / {total}</span></p>
    </div>
);

const ActionCard: React.FC<{ onClick: () => void; icon: React.ReactNode; title: string; subtitle: string; ariaLabel: string }> = ({ onClick, icon, title, subtitle, ariaLabel }) => (
    <button
        onClick={onClick}
        className="w-full h-full flex flex-col items-center justify-center bg-sky-500/10 border-2 border-dashed border-sky-500/30 rounded-lg p-8 text-sky-600 dark:text-sky-400 hover:bg-sky-500/20 hover:border-sky-500/50 transition-all duration-300"
        aria-label={ariaLabel}
    >
        {icon}
        <span className="text-xl font-semibold">{title}</span>
        <span className="text-sm text-sky-500/80 dark:text-sky-300/80 mt-1">{subtitle}</span>
    </button>
);


const Dashboard: React.FC<DashboardProps> = ({ user, onFileSelect, onViewMeeting, onRecord, onUpgrade, onOpenSettings }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const meetings = user.meetings || [];
    
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  // Generate a test audio file for debugging using MediaRecorder
  const generateTestAudio = async () => {
    try {
      // Create a simple audio context to generate test audio
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const duration = 3; // 3 seconds
      const sampleRate = audioContext.sampleRate;
      const numSamples = sampleRate * duration;
      
      // Create buffer and generate a simple tone
      const audioBuffer = audioContext.createBuffer(1, numSamples, sampleRate);
      const channelData = audioBuffer.getChannelData(0);
      
      // Generate a 440Hz sine wave
      for (let i = 0; i < numSamples; i++) {
        channelData[i] = Math.sin(2 * Math.PI * 440 * i / sampleRate) * 0.1;
      }
      
      // Use MediaRecorder to create a properly encoded audio file
      const stream = audioContext.createMediaStreamDestination();
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(stream);
      
      // Get supported mime type
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
        return 'audio/webm'; // fallback
      };
      
      const mimeType = getSupportedMimeType();
      const mediaRecorder = new MediaRecorder(stream.stream, { mimeType });
      const chunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: mimeType });
        const extension = mimeType.includes('webm') ? 'webm' : 
                         mimeType.includes('mp4') ? 'm4a' : 'ogg';
        const testFile = new File([audioBlob], `test-audio.${extension}`, { type: mimeType });
        
        console.log('Generated test audio file using MediaRecorder:', {
          name: testFile.name,
          type: testFile.type,
          size: testFile.size,
          mimeType
        });
        
        onFileSelect(testFile);
      };
      
      // Start recording
      mediaRecorder.start();
      source.start();
      
      // Stop after duration
      setTimeout(() => {
        source.stop();
        mediaRecorder.stop();
        audioContext.close();
      }, duration * 1000 + 100); // Small buffer to ensure complete recording
      
    } catch (error) {
      console.error('Error generating test audio:', error);
      alert('Failed to generate test audio. Please try uploading a real audio file instead.');
    }
  };

  const totalMinutesTranscribed = Math.floor(meetings.reduce((acc, meeting) => acc + (meeting.durationSeconds || 0), 0) / 60);
  const totalMeetings = meetings.length;

  const currentPlanLimits = PLAN_LIMITS[user.subscription];
  const maxMinutes = currentPlanLimits.transcriptionMinutes === 'unlimited' ? 'Unlimited' : `${currentPlanLimits.transcriptionMinutes}`;
  const maxUploads = currentPlanLimits.uploadsPerMonth === 'unlimited' ? 'Unlimited' : `${currentPlanLimits.uploadsPerMonth}`;
  
  // Check if user has reached limits
  const minutesLimitReached = currentPlanLimits.transcriptionMinutes !== 'unlimited' && 
    totalMinutesTranscribed >= currentPlanLimits.transcriptionMinutes;
  const uploadsLimitReached = currentPlanLimits.uploadsPerMonth !== 'unlimited' && 
    totalMeetings >= currentPlanLimits.uploadsPerMonth;


  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Dashboard</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Welcome back, {user.email}! Manage your meetings or start a new one.</p>
        </div>
        <button
          onClick={onOpenSettings}
          className="flex items-center space-x-2 px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
          title="AI Settings"
        >
          <SettingsIcon className="h-5 w-5" />
          <span className="hidden sm:inline">AI Settings</span>
        </button>
      </div>

      {/* API Usage Display for Free Users */}
      <ApiUsageDisplay user={user} onUpgrade={onUpgrade} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ActionCard
          onClick={handleUploadClick}
          icon={<UploadIcon className="h-12 w-12 mb-4" />}
          title="Upload Audio File"
          subtitle="MP3, WAV, M4A, etc."
          ariaLabel="Upload a new audio file"
        />
        <input 
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="audio/*"
        />
        <ActionCard
          onClick={onRecord}
          icon={<MicrophoneIcon className="h-12 w-12 mb-4" />}
          title="Record Audio"
          subtitle="Capture a new meeting"
          ariaLabel="Record a new audio meeting"
        />
        
        {/* Test Audio Button for Debugging */}
        <ActionCard
          onClick={generateTestAudio}
          icon={<div className="h-12 w-12 mb-4 flex items-center justify-center text-2xl">🎵</div>}
          title="Test Audio"
          subtitle="Generate sample audio"
          ariaLabel="Test with generated audio file"
        />
        <div className="space-y-4">
            <StatCard title="Minutes Transcribed" value={`${totalMinutesTranscribed} min`} total={`${maxMinutes} min`} />
            <StatCard title="Meetings This Month" value={`${totalMeetings}`} total={`${maxUploads}`} />
             <div className="bg-slate-100 dark:bg-slate-800/50 p-4 rounded-lg text-center">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Your current plan: <span className="font-bold">{user.subscription}</span></p>
                <button onClick={onUpgrade} className="mt-2 text-sm font-bold text-sky-600 dark:text-sky-400 hover:underline">Upgrade Plan</button>
                {(minutesLimitReached || uploadsLimitReached) && (
                  <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                    {minutesLimitReached && "Transcription limit reached. "}
                    {uploadsLimitReached && "Upload limit reached. "}
                    Upgrade to continue.
                  </p>
                )}
            </div>
        </div>
      </div>
      
      <div className="mt-8">
        <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">My Meetings</h3>
        <div className="bg-slate-100 dark:bg-slate-800/50 rounded-lg overflow-hidden">
            <ul className="divide-y divide-slate-200 dark:divide-slate-700/50">
            {meetings.length === 0 ? (
                <li className="p-6 text-center text-slate-500 dark:text-slate-400">You have no meetings yet. Upload or record one to get started!</li>
            ) : meetings.map(meeting => (
                <li key={meeting.id}>
                    <button onClick={() => onViewMeeting(meeting)} className="w-full flex items-center justify-between p-4 hover:bg-slate-200/50 dark:hover:bg-slate-700/40 transition-colors duration-200 text-left">
                        <div className="flex items-center overflow-hidden">
                            <div className="p-3 bg-slate-200 dark:bg-slate-700 rounded-full mr-4">
                                <FileAudioIcon className="h-6 w-6 text-sky-600 dark:text-sky-400" />
                            </div>
                            <div className="flex-1 truncate">
                                <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">{meeting.title}</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{formatDate(meeting.startTime)} &middot; {meeting.duration}</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4 shrink-0 ml-4">
                             <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                                meeting.status === 'Transcribed' ? 'bg-green-500/20 text-green-600 dark:text-green-400' : 
                                meeting.status === 'Processing' ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400' :
                                'bg-purple-500/20 text-purple-600 dark:text-purple-400'
                            }`}>
                                {meeting.status}
                            </span>
                            <RightArrowIcon className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                        </div>
                    </button>
                </li>
            ))}
            </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
