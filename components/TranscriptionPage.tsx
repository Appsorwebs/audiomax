import React, { useState, useRef, useEffect } from 'react';
import { Meeting, MagicSummary, Decision, User } from '../types';
import { PLAN_LIMITS } from '../constants';
import { BackArrowIcon } from './icons/BackArrowIcon';
import { PlayIcon } from './icons/PlayIcon';
import { PauseIcon } from './icons/PauseIcon';
import { ActionItemIcon } from './icons/ActionItemIcon';
import { DecisionIcon } from './icons/DecisionIcon';
import { SummaryIcon } from './icons/SummaryIcon';
import { CopyIcon } from './icons/CopyIcon';
import { TranslateIcon } from './icons/TranslateIcon';
import { Spinner } from './ui/Spinner';

interface TranscriptionPageProps {
  meeting: Meeting;
  user: User;
  onBack: () => void;
  onTranslate: (meetingId: string, language: string) => Promise<MagicSummary>;
}

const CopyButton: React.FC<{ textToCopy: string }> = ({ textToCopy }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(textToCopy).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };
    return (
        <button 
            onClick={handleCopy} 
            className="glass-button text-sm px-3 py-1.5 group hover:scale-110 transition-all duration-300" 
            title="Copy to clipboard"
        >
            {copied ? (
                <span className="text-xs text-green-300 font-bold animate-pulse">✓ Copied!</span>
            ) : (
                <span className="flex items-center">
                    <CopyIcon className="h-4 w-4 group-hover:rotate-12 transition-transform duration-300" />
                    <span className="ml-1.5">Copy</span>
                </span>
            )}
        </button>
    );
};

const SummarySection: React.FC<{ title: string; icon: React.ReactNode; copyText: string; children: React.ReactNode }> = ({ title, icon, copyText, children }) => (
    <div className="relative glass-card group hover:scale-[1.02] transition-all duration-300">
        <div className="absolute top-4 right-4 z-10">
            <CopyButton textToCopy={copyText} />
        </div>
        <h4 className="flex items-center text-xl font-bold text-white mb-4">
            <div className="transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                {icon}
            </div>
            <span className="ml-3 gradient-text">{title}</span>
        </h4>
        {children}
    </div>
);

const formatPlaybackTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const TranscriptionPage: React.FC<TranscriptionPageProps> = ({ meeting, user, onBack, onTranslate }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeTab, setActiveTab] = useState<'summary' | 'transcript' | 'translate'>('summary');
  const [targetLanguage, setTargetLanguage] = useState('Spanish');
  const [isTranslating, setIsTranslating] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const { id, transcript, summary: magicSummary, audioUrl, durationSeconds, translatedSummary, startTime, endTime } = meeting;
  const currentPlanLimits = PLAN_LIMITS[user.subscription];
  
  // Check if translation is available for this plan
  const canTranslate = currentPlanLimits.features.textTranslation;
  
  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    const handleTimeUpdate = () => setCurrentTime(audioElement.currentTime);
    const handlePlaybackEnd = () => setIsPlaying(false);

    audioElement.addEventListener('timeupdate', handleTimeUpdate);
    audioElement.addEventListener('ended', handlePlaybackEnd);

    return () => {
        audioElement.removeEventListener('timeupdate', handleTimeUpdate);
        audioElement.removeEventListener('ended', handlePlaybackEnd);
    };
  }, []);

  const togglePlayPause = () => {
      const audioElement = audioRef.current;
      if (!audioElement) return;

      if (isPlaying) {
          audioElement.pause();
      } else {
          audioElement.play();
      }
      setIsPlaying(!isPlaying);
  };
  
  const handleSeek = (event: React.MouseEvent<HTMLDivElement>) => {
      const audioElement = audioRef.current;
      if (!audioElement) return;
      
      const progressBar = event.currentTarget;
      const rect = progressBar.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const width = progressBar.offsetWidth;
      
      const seekTime = (clickX / width) * durationSeconds;
      audioElement.currentTime = seekTime;
      setCurrentTime(seekTime);
  };

  const handleTranslateClick = async () => {
      setIsTranslating(true);
      try {
          await onTranslate(id, targetLanguage);
      } catch (error) {
          console.error("Translation failed:", error);
          alert(`Translation failed: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
          setIsTranslating(false);
      }
  };

  const progressPercentage = durationSeconds > 0 ? (currentTime / durationSeconds) * 100 : 0;
  
  const formatMeetingTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  }

  const decisionsToText = (decisions: Decision[]) => {
    return decisions.map(d => `- ${d.decision}${d.rationale ? ` (Rationale: ${d.rationale})` : ''}`).join('\n');
  }

  const renderSummary = (summary: MagicSummary, titlePrefix = "") => (
    <div className="space-y-6 animate-fade-in">
        <SummarySection title={`${titlePrefix}Executive Summary`} icon={<SummaryIcon className="h-6 w-6 text-blue-400" />} copyText={summary.executiveSummary}>
            <p className="text-white/90 leading-relaxed text-lg">{summary.executiveSummary}</p>
        </SummarySection>

        <SummarySection title={`${titlePrefix}Key Decisions`} icon={<DecisionIcon className="h-6 w-6 text-green-400" />} copyText={decisionsToText(summary.keyDecisions)}>
            <ul className="space-y-4">
                {summary.keyDecisions.map((d, i) => 
                    <li key={i} className="glass-card bg-white/5 border-l-4 border-green-400 hover:border-green-300 transition-all duration-300">
                        <span className="font-bold text-white text-lg block mb-2">✓ {d.decision}</span>
                        {d.rationale && <p className="text-white/70 text-sm italic">Rationale: {d.rationale}</p>}
                    </li>
                )}
            </ul>
        </SummarySection>

        <SummarySection title={`${titlePrefix}Action Items`} icon={<ActionItemIcon className="h-6 w-6 text-yellow-400" />} copyText={summary.actionItems.map(item => `- ${item.item} (Assignee: ${item.assignee})`).join('\n')}>
            <ul className="space-y-4">
                {summary.actionItems.map((item, index) => (
                    <li key={index} className="glass-card bg-white/5 border-l-4 border-yellow-400 hover:scale-[1.02] transition-all duration-300">
                        <p className="text-white font-semibold mb-3">{item.item}</p>
                        <span className="inline-flex items-center text-xs font-bold text-yellow-300 bg-yellow-500/20 px-3 py-1.5 rounded-full">
                            👤 {item.assignee}
                        </span>
                    </li>
                ))}
            </ul>
        </SummarySection>
    </div>
  );

  return (
    <div>
      <audio ref={audioRef} src={audioUrl} preload="auto"></audio>
      <button onClick={onBack} className="glass-button flex items-center mb-8 group">
        <BackArrowIcon className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
        Back to Dashboard
      </button>

      <div className="glass-card mb-8 relative overflow-hidden group" style={{animation: 'fade-in-up 0.6s ease-out'}}>
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div className="relative z-10">
          <h2 className="text-4xl font-black gradient-text truncate mb-4">{meeting.title}</h2>
          <div className="flex flex-wrap items-center gap-4 text-sm text-white/70">
              <span className="glass-card px-3 py-1.5 text-xs font-semibold">
                📅 {new Date(startTime).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
              <span className="glass-card px-3 py-1.5 text-xs font-semibold">
                ⏰ {formatMeetingTime(startTime)} - {formatMeetingTime(endTime)}
              </span>
              <span className="glass-card px-3 py-1.5 text-xs font-semibold">
                ⏱️ {meeting.duration}
              </span>
          </div>
        </div>
      </div>
      
      <div className="mb-8 glass-card p-1" style={{animation: 'fade-in-up 0.6s ease-out 0.1s both'}}>
          <nav className="flex space-x-1" aria-label="Tabs">
              <button 
                onClick={() => setActiveTab('summary')} 
                className={`flex-1 px-4 py-3 font-bold text-sm rounded-lg transition-all duration-300 ${
                  activeTab === 'summary' 
                    ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg transform scale-105' 
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                ✨ Summary
              </button>
              <button 
                onClick={() => setActiveTab('transcript')} 
                className={`flex-1 px-4 py-3 font-bold text-sm rounded-lg transition-all duration-300 ${
                  activeTab === 'transcript' 
                    ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg transform scale-105' 
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                📝 Transcript
              </button>
              {canTranslate ? (
                <button 
                  onClick={() => setActiveTab('translate')} 
                  className={`flex-1 px-4 py-3 font-bold text-sm rounded-lg transition-all duration-300 ${
                    activeTab === 'translate' 
                      ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg transform scale-105' 
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  🌍 Translate
                </button>
              ) : (
                <div className="flex-1 px-4 py-3 font-bold text-sm text-white/30 cursor-not-allowed flex items-center justify-center" title={`Translation requires ${user.subscription === 'Free' ? 'Pro' : 'a higher'} plan`}>
                  🌍 Translate 🔒
                </div>
              )}
          </nav>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 space-y-6">
            <div className="bg-slate-100 dark:bg-slate-800/50 p-4 rounded-lg">
                <div className="flex items-center space-x-4">
                    <button onClick={togglePlayPause} className="p-3 bg-sky-500 text-white rounded-full hover:bg-sky-600 transition-colors">
                        {isPlaying ? <PauseIcon className="h-6 w-6" /> : <PlayIcon className="h-6 w-6" />}
                    </button>
                    <div className="flex-grow bg-slate-300 dark:bg-slate-700 h-2 rounded-full cursor-pointer" onClick={handleSeek}>
                        <div className="bg-sky-500 dark:bg-sky-400 h-2 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
                    </div>
                    <span className="text-sm text-slate-500 dark:text-slate-400 font-mono">{formatPlaybackTime(currentTime)} / {formatPlaybackTime(durationSeconds)}</span>
                </div>
            </div>
            {activeTab === 'transcript' && (
              <div className="bg-slate-100 dark:bg-slate-800/50 p-6 rounded-lg max-h-[600px] overflow-y-auto animate-fade-in">
                  <h3 className="text-xl font-semibold mb-4 text-slate-900 dark:text-slate-200">Full Transcript</h3>
                  {transcript && transcript.length > 0 ? (
                      <div className="space-y-4">
                          {transcript.map((line, index) => (
                              <div key={index} className="flex">
                                  <div className="w-20 text-slate-500 dark:text-slate-400 font-mono text-sm pr-4 shrink-0">{line.timestamp}</div>
                                  <div className="flex-grow">
                                      <p className="font-semibold text-slate-700 dark:text-slate-300">{line.speaker}</p>
                                      <p className="text-slate-800 dark:text-slate-300">{line.text}</p>
                                  </div>
                              </div>
                          ))}
                      </div>
                  ) : (
                      <p className="text-slate-500 dark:text-slate-400">No transcript is available for this meeting.</p>
                  )}
              </div>
            )}
        </div>

        <div className="lg:col-span-2 space-y-6">
            {activeTab === 'summary' && (magicSummary ? renderSummary(magicSummary) : (
                <div className="bg-slate-100 dark:bg-slate-800/50 p-6 rounded-lg">
                    <h3 className="text-xl font-semibold mb-4 text-slate-900 dark:text-slate-200">Magic Summary</h3>
                    <p className="text-slate-500 dark:text-slate-400">A summary was not generated for this meeting.</p>
                </div>
            ))}

            {activeTab === 'translate' && canTranslate && (
                <div className="bg-slate-100 dark:bg-slate-800/50 p-6 rounded-lg space-y-6 animate-fade-in">
                    <h4 className="flex items-center text-lg font-semibold text-slate-900 dark:text-slate-200 mb-3">
                        <TranslateIcon className="h-5 w-5 text-purple-500 dark:text-purple-400" />
                        <span className="ml-2">Translate Summary</span>
                    </h4>
                    {!magicSummary ? (<p className="text-slate-500 dark:text-slate-400">Cannot translate without an existing summary.</p>) : (
                      <>
                        <div className="flex items-center space-x-3">
                            <select 
                                value={targetLanguage}
                                onChange={e => setTargetLanguage(e.target.value)}
                                className="w-full bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md px-3 py-2 text-slate-900 dark:text-slate-200 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                                aria-label="Select language to translate to"
                            >
                                <option>Arabic</option>
                                <option>Chinese</option>
                                <option>French</option>
                                <option>German</option>
                                <option>Hausa</option>
                                <option>Hindi</option>
                                <option>Igbo</option>
                                <option>Japanese</option>
                                <option>Mandarin</option>
                                <option>Spanish</option>
                                <option>Yoruba</option>
                            </select>
                            <button 
                                onClick={handleTranslateClick}
                                disabled={isTranslating}
                                className="flex items-center justify-center bg-purple-500 hover:bg-purple-600 text-white font-semibold px-4 py-2 rounded-md transition-colors disabled:bg-purple-400/50 disabled:cursor-not-allowed"
                            >
                                {isTranslating ? <Spinner className="h-5 w-5" /> : 'Translate'}
                            </button>
                        </div>
                        {translatedSummary && renderSummary(translatedSummary.summary, `[${translatedSummary.language}] `)}
                      </>
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default TranscriptionPage;