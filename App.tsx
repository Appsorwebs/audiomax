
import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import TranscriptionPage from './components/TranscriptionPage';
import RecordingPage from './components/RecordingPage';
import PricingPage from './components/PricingPage';
import AuthPage from './components/AuthPage';
import { Meeting, MagicSummary, User, SubscriptionPlan } from './types';
import Header from './components/Header';
import ProcessingOverlay from './components/ProcessingOverlay';
import { transcribeAudio, generateMeetingSummary, translateSummary } from './services/geminiService';
import * as authService from './services/authService';

type Page = 'dashboard' | 'processing' | 'transcription' | 'recording' | 'pricing' | 'auth';

/**
 * Creates a guest user object. Theme is now handled by a script in index.html
 * and is no longer part of the user state.
 */
const createGuestUser = (): User => {
    return {
        email: 'Guest',
        subscription: 'Free',
        meetings: [],
        isGuest: true
    };
};

const getAudioMetadata = (file: File): Promise<{ duration: number; url: string }> => {
    return new Promise((resolve, reject) => {
        const audio = document.createElement('audio');
        audio.preload = 'metadata';
        const url = window.URL.createObjectURL(file);
        audio.src = url;
        audio.onloadedmetadata = () => {
            resolve({ duration: audio.duration, url });
        };
        audio.onerror = () => {
            window.URL.revokeObjectURL(url);
            reject('Failed to load audio metadata.');
        };
    });
};

const formatDuration = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '0s';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    
    if (h === 0 && m === 0 && s === 0) return '0s';

    const hStr = h > 0 ? `${h}h ` : '';
    const mStr = m > 0 ? `${m}m ` : '';
    const sStr = s > 0 ? `${s}s` : '';

    return `${hStr}${mStr}${sStr}`.trim() || '0s';
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User>(authService.getCurrentUser() || createGuestUser());
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [processingSteps, setProcessingSteps] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [processingProgressText, setProcessingProgressText] = useState('');

  const updateUserMeetings = (meetings: Meeting[]) => {
    if (currentUser) {
        const updatedUser = { ...currentUser, meetings };
        if (!currentUser.isGuest) {
            authService.updateUser(updatedUser);
        }
        setCurrentUser(updatedUser);
    }
  };

  const handleUploadAndProcess = async (audioFile: File) => {
    if (!currentUser) return;
    const steps = ["Reading Audio File...", "Transcribing...", "Summarizing Minutes...", "Finalizing..."];
    setProcessingSteps(steps);
    setProcessingProgressText('');
    setCurrentStep(0);
    setCurrentPage('processing');

    try {
        await new Promise(res => setTimeout(res, 500)); 
        const { duration: durationSeconds, url: audioUrl } = await getAudioMetadata(audioFile);
        setCurrentStep(1);

        const onTranscriptionProgress = (message: string) => {
            setProcessingProgressText(message);
        };

        const transcript = await transcribeAudio(audioFile, onTranscriptionProgress);
        setProcessingProgressText(''); // Clear progress text for next steps

        if (!transcript || transcript.length === 0) {
            throw new Error("Transcription failed or returned no content.");
        }
        setCurrentStep(2);

        const summary = await generateMeetingSummary(transcript);
        setCurrentStep(3);
        
        const startTime = new Date();
        const endTime = new Date(startTime.getTime() + durationSeconds * 1000);

        const newMeeting: Meeting = {
            id: `meeting-${Date.now()}`,
            title: audioFile.name.replace(/\.[^/.]+$/, "") || "Recorded Meeting",
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            duration: formatDuration(durationSeconds),
            durationSeconds,
            audioUrl,
            status: 'Transcribed',
            transcript,
            summary,
        };

        await new Promise(res => setTimeout(res, 500)); 

        updateUserMeetings([newMeeting, ...(currentUser.meetings || [])]);
        setSelectedMeeting(newMeeting);
        setCurrentPage('transcription');

    } catch (error: any) {
        console.error("Processing failed:", error);
        alert(`An error occurred during processing: ${error.message}\nPlease check the console for more details and ensure your API key is set up correctly.`);
        handleBackToDashboard();
    }
  };

  const handleTranslateMeeting = async (meetingId: string, language: string): Promise<MagicSummary> => {
    if (!currentUser) throw new Error("No user logged in.");
    const meetingToTranslate = currentUser.meetings.find(m => m.id === meetingId);
    if (!meetingToTranslate || !meetingToTranslate.summary) {
        throw new Error("Meeting or summary not found for translation.");
    }
    
    const translatedSummary = await translateSummary(meetingToTranslate.summary, language);
    const updatedMeetings = currentUser.meetings.map((m): Meeting => 
        m.id === meetingId ? { ...m, status: 'Translated', translatedSummary: { language, summary: translatedSummary } } : m
    );

    updateUserMeetings(updatedMeetings);
    setSelectedMeeting(prev => prev && prev.id === meetingId ? { ...prev, status: 'Translated', translatedSummary: { language, summary: translatedSummary } } : prev);

    return translatedSummary;
  };

  const handlePlanSelect = (plan: SubscriptionPlan) => {
    if (currentUser.isGuest) {
        alert("Please sign up or log in to select a plan.");
        setCurrentPage('auth');
        return;
    }
    const updatedUser = { ...currentUser, subscription: plan };
    authService.updateUser(updatedUser);
    setCurrentUser(updatedUser);
    alert(`Your plan has been updated to ${plan}!`);
    setCurrentPage('dashboard');
  };
  
  const handleViewMeeting = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setCurrentPage('transcription');
  };

  const handleBackToDashboard = () => {
    setSelectedMeeting(null);
    setCurrentPage('dashboard');
  };
  
  const handleAuthSuccess = (user: User) => {
      const guestMeetings = currentUser.isGuest ? currentUser.meetings : [];
      
      if (guestMeetings.length > 0) {
          const mergedMeetings = [...user.meetings, ...guestMeetings];
          const updatedUser = { ...user, meetings: mergedMeetings };
          authService.updateUser(updatedUser);
          setCurrentUser(updatedUser);
      } else {
          setCurrentUser(user);
      }
      
      setCurrentPage('dashboard');
  };

  const handleLogout = () => {
      authService.logout();
      setCurrentUser(createGuestUser());
      setCurrentPage('dashboard');
  }
  
  const renderPage = () => {
    switch (currentPage) {
      case 'auth':
        return <AuthPage onAuthSuccess={handleAuthSuccess} />;
      case 'transcription':
        return <TranscriptionPage meeting={selectedMeeting!} onBack={handleBackToDashboard} onTranslate={handleTranslateMeeting} />;
      case 'recording':
        return <RecordingPage onBack={handleBackToDashboard} onRecordingComplete={handleUploadAndProcess} />;
      case 'pricing':
        return <PricingPage onBack={handleBackToDashboard} onPlanSelect={handlePlanSelect} currentPlan={currentUser.subscription} />;
      case 'dashboard':
      default:
        return <Dashboard user={currentUser} onFileSelect={handleUploadAndProcess} onViewMeeting={handleViewMeeting} onRecord={() => setCurrentPage('recording')} onUpgrade={() => setCurrentPage('pricing')} />;
    }
  };

  return (
    <div className={`min-h-screen bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 flex flex-col transition-colors duration-300`}>
      {currentPage === 'processing' && <ProcessingOverlay steps={processingSteps} currentStep={currentStep} progressText={processingProgressText} />}
      <Header 
        user={currentUser}
        onLogout={handleLogout}
        onLoginClick={() => setCurrentPage('auth')}
        onHomeClick={handleBackToDashboard} 
        onPricingClick={() => setCurrentPage('pricing')} 
      />
      <main className="container mx-auto p-4 md:p-8 flex-grow">
        {renderPage()}
      </main>
      <footer className="text-center py-4 text-slate-500 dark:text-slate-500 text-xs border-t border-slate-200 dark:border-slate-800">
        Developed by Appsorwebs Limited
        <a href="https://www.appsorwebs.com" className="sr-only">www.appsorwebs.com</a>
      </footer>
    </div>
  );
};

export default App;