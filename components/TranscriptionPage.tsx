import React, { useState, useRef, useEffect } from 'react';
import { Meeting, TranscriptLine, MagicSummary, Decision } from '../types';
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
        <button onClick={handleCopy} className="text-slate-400 hover:text-sky-400 transition-colors" title="Copy to clipboard">
            {copied ? <span className="text-xs text-green-400">Copied!</span> : <CopyIcon className="h-4 w-4" />}
        </button>
    );
};

const SummarySection: React.FC<{ title: string; icon: React.ReactNode; copyText: string; children: React.ReactNode }> = ({ title, icon, copyText, children }) => (
    <div className="relative bg-white dark:bg-slate-800/50 p-6 rounded-lg shadow-sm dark:shadow-none">
        <div className="absolute top-4 right-4">
            <CopyButton textToCopy={copyText} />
        </div>
        <h4 className="flex items-center text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3">
            {icon}
            <span className="ml-2">{title}</span>
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

const TranscriptionPage: React.FC<TranscriptionPageProps> = ({ meeting, onBack, onTranslate }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeTab, setActiveTab] = useState<'summary' | 'transcript' | 'translate'>('summary');
  const [targetLanguage, setTargetLanguage] = useState('Spanish');
  const [isTranslating, setIsTranslating] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const { id, transcript, summary: magicSummary, audioUrl, durationSeconds, translatedSummary, startTime, endTime } = meeting;
  
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
        <SummarySection title={`${titlePrefix}Executive Summary`} icon={<SummaryIcon className="h-5 w-5 text-sky-500 dark:text-sky-400" />} copyText={summary.executiveSummary}>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{summary.executiveSummary}</p>
        </SummarySection>

        <SummarySection title={`${titlePrefix}Key Decisions`} icon={<DecisionIcon className="h-5 w-5 text-green-500 dark:text-green-400" />} copyText={decisionsToText(summary.keyDecisions)}>
            <ul className="space-y-3 list-inside">
                {summary.keyDecisions.map((d, i) => 
                    <li key={i} className="text-slate-600 dark:text-slate-300">
                        <span className="font-semibold text-slate-700 dark:text-slate-200">{d.decision}</span>
                        {d.rationale && <p className="pl-1 mt-1 text-sm text-slate-500 dark:text-slate-400 italic">Rationale: {d.rationale}</p>}
                    </li>
                )}
            </ul>
        </SummarySection>

        <SummarySection title={`${titlePrefix}Action Items`} icon={<ActionItemIcon className="h-5 w-5 text-yellow-500 dark:text-yellow-400" />} copyText={summary.actionItems.map(item => `- ${item.item} (Assignee: ${item.assignee})`).join('\n')}>
            <ul className="space-y-3">
                {summary.actionItems.map((item, index) => (
                    <li key={index} className="bg-slate-200 dark:bg-slate-700/50 p-3 rounded-md">
                        <p className="text-slate-800 dark:text-slate-200">{item.item}</p>
                        <span className="text-xs font-semibold text-yellow-700 dark:text-yellow-400 bg-yellow-500/20 dark:bg-yellow-500/10 px-2 py-1 rounded-full inline-block mt-2">
                            Assignee: {item.assignee}
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
      <button onClick={onBack} className="flex items-center text-sm text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300 transition-colors mb-6">
        <BackArrowIcon className="h-4 w-4 mr-2" />
        Back to Dashboard
      </button>

      <div className="bg-slate-100 dark:bg-slate-800/50 rounded-lg p-6 mb-8">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 truncate">{meeting.title}</h2>
        <div className="text-sm text-slate-500 dark:text-slate-400 mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>{new Date(startTime).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            <span className="hidden md:inline text-slate-300 dark:text-slate-600">&middot;</span>
            <span>Start: {formatMeetingTime(startTime)}</span>
            <span className="hidden md:inline text-slate-300 dark:text-slate-600">&middot;</span>
            <span>End: {formatMeetingTime(endTime)}</span>
            <span className="hidden md:inline text-slate-300 dark:text-slate-600">&middot;</span>
            <span>Duration: {meeting.duration}</span>
        </div>
      </div>
      
      <div className="mb-6 border-b border-slate-200 dark:border-slate-700">
          <nav className="flex space-x-1" aria-label="Tabs">
              <button onClick={() => setActiveTab('summary')} className={`px-3 py-2 font-medium text-sm rounded-t-md transition-colors ${activeTab === 'summary' ? 'bg-white dark:bg-slate-800/50 text-sky-600 dark:text-sky-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>Magic Summary</button>
              <button onClick={() => setActiveTab('transcript')} className={`px-3 py-2 font-medium text-sm rounded-t-md transition-colors ${activeTab === 'transcript' ? 'bg-white dark:bg-slate-800/50 text-sky-600 dark:text-sky-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>Transcript</button>
              <button onClick={() => setActiveTab('translate')} className={`px-3 py-2 font-medium text-sm rounded-t-md transition-colors ${activeTab === 'translate' ? 'bg-white dark:bg-slate-800/50 text-sky-600 dark:text-sky-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>Translate</button>
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

            {activeTab === 'translate' && (
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