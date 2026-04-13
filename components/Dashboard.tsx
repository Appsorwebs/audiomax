import React, { useRef, ChangeEvent } from 'react';
import { Meeting, User } from '../types';
import { PLAN_LIMITS } from '../constants';
import { UploadIcon } from './icons/UploadIcon';
import { FileAudioIcon } from './icons/FileAudioIcon';
import { RightArrowIcon } from './icons/RightArrowIcon';
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import { SettingsIcon } from './icons/SettingsIcon';
import ApiUsageDisplay from './ApiUsageDisplay';
import { StatCard } from './ui/StatCard';
import { ActionCard } from './ui/ActionCard';
import { PremiumHeader } from './ui/PremiumHeader';
import { PremiumButton } from './ui/PremiumButton';

interface DashboardProps {
  user: User;
  onFileSelect: (file: File) => void;
  onViewMeeting: (meeting: Meeting) => void;
  onRecord: () => void;
  onUpgrade: () => void;
  onOpenSettings: () => void;
}

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

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Transcribed': return 'success';
      case 'Processing': return 'warning';
      default: return 'primary';
    }
  };

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-6 lg:space-y-8">
        {/* Header with Settings */}
        <PremiumHeader
          title="Dashboard"
          subtitle={`Welcome back, ${user.email}! Manage your meetings or start a new one.`}
          action={
            <PremiumButton
              onClick={onOpenSettings}
              variant="secondary"
              size="md"
              icon={<SettingsIcon className="h-5 w-5" />}
            >
              AI Settings
            </PremiumButton>
          }
          showGradient={true}
        />

        {/* API Usage Display */}
        <ApiUsageDisplay user={user} onUpgrade={onUpgrade} />

        {/* Main Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
          <ActionCard
            onClick={handleUploadClick}
            icon={<UploadIcon className="h-12 w-12" />}
            title="Upload Audio File"
            subtitle="MP3, WAV, M4A, FLAC, etc."
            ariaLabel="Upload a new audio file"
            variant="primary"
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
            icon={<MicrophoneIcon className="h-12 w-12" />}
            title="Record Audio"
            subtitle="Capture a new meeting in real-time"
            ariaLabel="Record a new audio meeting"
            variant="secondary"
          />
        </div>
        
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          <StatCard
            title="Minutes Transcribed"
            value={totalMinutesTranscribed}
            subtitle={`of ${maxMinutes} minutes`}
            icon="⏱️"
            trend={minutesLimitReached ? 'up' : 'neutral'}
            trendValue={minutesLimitReached ? 'Limit reached' : `${Math.floor((totalMinutesTranscribed / (currentPlanLimits.transcriptionMinutes === 'unlimited' ? totalMinutesTranscribed + 1 : currentPlanLimits.transcriptionMinutes as number)) * 100)}%`}
          />
          <StatCard
            title="Meetings This Month"
            value={totalMeetings}
            subtitle={`of ${maxUploads} uploads`}
            icon="📞"
            trend={uploadsLimitReached ? 'up' : 'neutral'}
            trendValue={uploadsLimitReached ? 'Limit reached' : `${Math.floor((totalMeetings / (currentPlanLimits.uploadsPerMonth === 'unlimited' ? totalMeetings + 1 : currentPlanLimits.uploadsPerMonth as number)) * 100)}%`}
          />
          <div className="glass-premium p-6 rounded-xl">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-neutral-400 text-sm font-medium uppercase tracking-wide">Plan</p>
                <h3 className="text-3xl font-bold mt-3 text-white bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">
                  {user.subscription}
                </h3>
                <p className="text-neutral-500 text-sm mt-2">
                  {user.subscription === 'Free' ? 'Upgrade for more features' : 'Premium benefits enabled'}
                </p>
              </div>
              <div className="text-2xl">👑</div>
            </div>
            <PremiumButton
              onClick={onUpgrade}
              variant="gradient"
              size="sm"
              fullWidth
              className="mt-4"
            >
              {user.subscription === 'Free' ? 'Upgrade Plan' : 'View Plans'}
            </PremiumButton>
            {(minutesLimitReached || uploadsLimitReached) && (
              <p className="text-danger-300 text-xs font-semibold mt-3">
                ⚠️ {minutesLimitReached && 'Transcription limit reached. '}
                {uploadsLimitReached && 'Upload limit reached. '}
                Upgrade to continue.
              </p>
            )}
          </div>
        </div>
        
        {/* Recent Meetings */}
        <div className="space-y-4">
          <h3 className="text-2xl font-bold text-neutral-100 flex items-center gap-2">
            <span>📋</span> My Meetings
          </h3>
          
          {meetings.length === 0 ? (
            <div className="glass-premium p-12 rounded-xl text-center border border-primary-500/20">
              <p className="text-neutral-400 text-lg mb-4">You have no meetings yet</p>
              <p className="text-neutral-500 text-sm">Upload or record your first meeting to get started with AI-powered transcription!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {meetings.map((meeting, idx) => (
                <button
                  key={meeting.id}
                  onClick={() => onViewMeeting(meeting)}
                  className="w-full glass-premium p-4 rounded-xl hover:bg-primary-500/10 hover:border-primary-400/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 active:translate-y-0 text-left border border-neutral-700/30 hover:border-primary-400/30"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="p-3 bg-gradient-to-br from-primary-500/20 to-secondary-500/20 rounded-lg flex-shrink-0">
                        <FileAudioIcon className="h-6 w-6 text-primary-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-neutral-100 truncate">{meeting.title}</h4>
                        <p className="text-xs text-neutral-400 mt-0.5">{formatDate(meeting.startTime)} • {meeting.duration}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className={`text-xs font-semibold px-3 py-1.5 rounded-full badge ${
                        meeting.status === 'Transcribed' ? 'badge-success' : 
                        meeting.status === 'Processing' ? 'badge-warning' :
                        'badge-primary'
                      }`}>
                        {meeting.status}
                      </span>
                      <RightArrowIcon className="h-5 w-5 text-neutral-500 group-hover:text-primary-400" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
