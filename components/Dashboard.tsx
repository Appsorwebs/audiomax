import React, { useRef, ChangeEvent } from 'react';
import { Meeting, User } from '../types';
import { PLAN_LIMITS } from '../constants';
import { UploadIcon } from './icons/UploadIcon';
import { FileAudioIcon } from './icons/FileAudioIcon';
import { RightArrowIcon } from './icons/RightArrowIcon';
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import { SettingsIcon } from './icons/SettingsIcon';

interface DashboardProps {
  user: User;
  onFileSelect: (file: File) => void;
  onViewMeeting: (meeting: Meeting) => void;
  onRecord: () => void;
  onUpgrade: () => void;
  onOpenSettings: () => void;
}

const StatCard: React.FC<{ title: string; value: string; total: string }> = ({ title, value, total }) => (
    <div className="glass-card hover:scale-105 transition-all duration-300 group">
        <p className="text-sm font-medium text-white/70 mb-2">{title}</p>
        <p className="text-3xl font-black gradient-text">
            {value}
            <span className="text-base font-normal text-white/50 ml-1">/ {total}</span>
        </p>
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
    </div>
);

const ActionCard: React.FC<{ onClick: () => void; icon: React.ReactNode; title: string; subtitle: string; ariaLabel: string }> = ({ onClick, icon, title, subtitle, ariaLabel }) => (
    <button
        onClick={onClick}
        className="group relative w-full h-full glass-card hover:scale-105 transition-all duration-500 overflow-hidden"
        aria-label={ariaLabel}
    >
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-blue-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div className="relative z-10 flex flex-col items-center justify-center p-8">
            <div className="mb-4 transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 animate-pulse-glow">
                {icon}
            </div>
            <span className="text-2xl font-bold text-white mb-2">{title}</span>
            <span className="text-sm text-white/70">{subtitle}</span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-blue-500 to-pink-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
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
      {/* Header Section with Glassmorphism */}
      <div className="glass-card">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-4xl font-black gradient-text mb-2">Dashboard</h2>
            <p className="text-white/70 text-lg">Welcome back, <span className="font-semibold text-white">{user.email}</span>! 🎙️</p>
          </div>
          <button
            onClick={onOpenSettings}
            className="glass-button group flex items-center space-x-2 relative overflow-hidden"
            title="AI Settings"
          >
            <SettingsIcon className="h-5 w-5 group-hover:rotate-90 transition-transform duration-500" />
            <span>Settings</span>
          </button>
        </div>
      </div>

      {/* Action Cards with Enhanced Design */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" style={{animation: 'fade-in-up 0.6s ease-out 0.1s both'}}>
        <ActionCard
          onClick={handleUploadClick}
          icon={<UploadIcon className="h-16 w-16 text-white drop-shadow-lg" />}
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
          icon={<MicrophoneIcon className="h-16 w-16 text-white drop-shadow-lg" />}
          title="Record Audio"
          subtitle="Capture a new meeting"
          ariaLabel="Record a new audio meeting"
        />
      </div>
      
      {/* Stats Grid with Modern Design */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6" style={{animation: 'fade-in-up 0.6s ease-out 0.2s both'}}>
        <StatCard title="Minutes Transcribed" value={`${totalMinutesTranscribed} min`} total={`${maxMinutes} min`} />
        <StatCard title="Meetings This Month" value={`${totalMeetings}`} total={`${maxUploads}`} />
        <div className="glass-card text-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <p className="text-sm font-medium text-white/70 mb-2">Your current plan</p>
            <p className="text-2xl font-black gradient-text mb-3">{user.subscription}</p>
            <button 
              onClick={onUpgrade} 
              className="gradient-button text-sm px-6 py-2 text-white font-bold"
            >
              ✨ Upgrade Plan
            </button>
            {(minutesLimitReached || uploadsLimitReached) && (
              <p className="text-xs text-red-400 mt-3 font-semibold">
                {minutesLimitReached && "⚠️ Transcription limit reached. "}
                {uploadsLimitReached && "⚠️ Upload limit reached. "}
                Upgrade to continue.
              </p>
            )}
          </div>
        </div>
      </div>
      
      {/* Meetings List with Advanced Styling */}
      <div className="mt-8" style={{animation: 'fade-in-up 0.6s ease-out 0.3s both'}}>
        <h3 className="text-3xl font-black gradient-text mb-6">My Meetings</h3>
        <div className="glass-card p-0 overflow-hidden">
            <ul className="divide-y divide-white/10">
            {meetings.length === 0 ? (
                <li className="p-8 text-center">
                  <div className="inline-block p-4 rounded-full bg-white/5 mb-4">
                    <FileAudioIcon className="h-12 w-12 text-white/40" />
                  </div>
                  <p className="text-white/70 text-lg">You have no meetings yet.</p>
                  <p className="text-white/50 text-sm mt-2">Upload or record one to get started! 🚀</p>
                </li>
            ) : meetings.map((meeting, index) => (
                <li key={meeting.id} style={{animation: `fade-in-up 0.4s ease-out ${index * 0.1}s both`}}>
                    <button 
                      onClick={() => onViewMeeting(meeting)} 
                      className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-all duration-300 text-left group relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-blue-500/10 to-purple-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                        <div className="flex items-center overflow-hidden relative z-10">
                            <div className="p-3 glass-card group-hover:scale-110 transition-transform duration-300 mr-4">
                                <FileAudioIcon className="h-6 w-6 text-white" />
                            </div>
                            <div className="flex-1 truncate">
                                <p className="font-bold text-white truncate text-lg group-hover:gradient-text transition-all duration-300">{meeting.title}</p>
                                <p className="text-sm text-white/60">{formatDate(meeting.startTime)} • {meeting.duration}</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4 shrink-0 ml-4 relative z-10">
                             <span className={`text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-sm ${
                                meeting.status === 'Transcribed' ? 'bg-green-500/30 text-green-300 shadow-lg shadow-green-500/20' : 
                                meeting.status === 'Processing' ? 'bg-yellow-500/30 text-yellow-300 shadow-lg shadow-yellow-500/20' :
                                'bg-purple-500/30 text-purple-300 shadow-lg shadow-purple-500/20'
                            }`}>
                                {meeting.status}
                            </span>
                            <RightArrowIcon className="h-5 w-5 text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all duration-300" />
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
