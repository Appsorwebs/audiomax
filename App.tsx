
import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import Dashboard from './components/Dashboard';
import TranscriptionPage from './components/TranscriptionPage';
import RecordingPage from './components/RecordingPage';
import PricingPage from './components/PricingPage';
import AuthPage from './components/AuthPage';
import SettingsModal from './components/SettingsModal';
import AdminDashboard from './components/AdminDashboard';
import Credits from './components/Credits';
import ApiKeySetup from './components/ApiKeySetup';
import { Meeting, MagicSummary, User, SubscriptionPlan, UserSettings } from './types';
import { PLAN_LIMITS } from './constants';
import Header from './components/Header';
import ProcessingOverlay from './components/ProcessingOverlay';
import { transcribeAudio, generateMeetingSummary, translateSummary } from './services/geminiService';
import * as authService from './services/authService';
import { initializeSecurity, validateAudioFile, validateEnvironment } from './utils/security';

// Initialize security measures
initializeSecurity();

// Validate environment
const envCheck = validateEnvironment();
if (!envCheck.secure && import.meta.env.PROD) {
  console.warn('Security warnings:', envCheck.warnings);
}

type Page = 'dashboard' | 'processing' | 'transcription' | 'recording' | 'pricing' | 'auth';

/**
 * Creates a guest user object. Theme is now handled by ThemeProvider context.
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
        console.log('Loading audio metadata for file:', {
            name: file.name,
            type: file.type,
            size: file.size
        });

        // Check file size (max 100MB)
        if (file.size > 100 * 1024 * 1024) {
            reject(`File too large: ${Math.round(file.size / (1024 * 1024))}MB. Maximum size is 100MB.`);
            return;
        }

        // Check if file is empty
        if (file.size === 0) {
            reject('File is empty. Please select a valid audio file.');
            return;
        }

        // Create URL and audio element
        const url = window.URL.createObjectURL(file);
        const audio = document.createElement('audio');
        let settled = false;
        const timeoutId = window.setTimeout(() => {
          if (!settled) {
            settled = true;
            cleanup();
            // Continue with a conservative fallback when metadata cannot be read.
            resolve({ duration: 1, url });
          }
        }, 8000);
        
        audio.preload = 'metadata';
        audio.muted = true;
        
        const cleanup = () => {
            audio.removeEventListener('loadedmetadata', onLoad);
            audio.removeEventListener('error', onError);
          window.clearTimeout(timeoutId);
        };

        const onLoad = () => {
          if (settled) return;
          settled = true;
            console.log('Audio loaded, duration:', audio.duration);
            cleanup();
            // Accept any valid duration, including very short ones
            const duration = isNaN(audio.duration) || audio.duration <= 0 ? 1 : audio.duration;
            resolve({ duration, url });
        };

        const onError = () => {
          if (settled) return;
          settled = true;
            console.error('Audio loading error');
            cleanup();
            window.URL.revokeObjectURL(url);
            reject('Could not load audio file. Please try a different file.');
        };

        // Set up event listeners
        audio.addEventListener('loadedmetadata', onLoad);
        audio.addEventListener('error', onError);
        
        // Start loading
        audio.src = url;
        audio.load();
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
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState(false);
  const [needsApiKey, setNeedsApiKey] = useState(false);

  // Check if API key is available
  useEffect(() => {
    // Since we have at least one working API key, allow access
    setNeedsApiKey(false);
  }, []);

  const handleApiKeySet = () => {
    setNeedsApiKey(false);
  };

  // Admin dashboard keyboard shortcut (Ctrl+Alt+A)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.altKey && event.key === 'a') {
        event.preventDefault();
        setIsAdminDashboardOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

    const fileValidation = validateAudioFile(audioFile);
    if (!fileValidation.valid) {
      alert(fileValidation.error || 'Invalid audio file. Please choose another file.');
      return;
    }
    
    // Check plan limits before processing
    const currentPlanLimits = PLAN_LIMITS[currentUser.subscription];
    const totalMeetings = (currentUser.meetings || []).length;
    
    // Check upload limit
    if (currentPlanLimits.uploadsPerMonth !== 'unlimited' && totalMeetings >= currentPlanLimits.uploadsPerMonth) {
      alert(`Upload limit reached! You have used ${totalMeetings}/${currentPlanLimits.uploadsPerMonth} uploads for your ${currentUser.subscription} plan. Please upgrade to continue.`);
      setCurrentPage('pricing');
      return;
    }
    
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

        const transcript = await transcribeAudio(audioFile, currentUser, onTranscriptionProgress);
        setProcessingProgressText(''); // Clear progress text for next steps

        if (!transcript || transcript.length === 0) {
            throw new Error("Transcription failed or returned no content.");
        }
        setCurrentStep(2);

        const summary = await generateMeetingSummary(transcript, currentUser);
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
        
        // Better error message handling
        let errorMessage = "Unknown error occurred";
        if (error && typeof error === 'object') {
          if (error.message) {
            errorMessage = error.message;
          } else if (error.toString) {
            errorMessage = error.toString();
          }
        } else if (typeof error === 'string') {
          errorMessage = error;
        }
        
        // Check if it's an API key related error
        if (errorMessage.includes('API key') || errorMessage.includes('unauthorized') || errorMessage.includes('No API key')) {
          alert(`🔑 API Key Required\n\nThis demo uses placeholder API keys. To use AudioMax:\n\n1. Get a free Gemini API key from: https://ai.google.dev/\n2. Add it to your browser's localStorage as 'user_api_key'\n3. Or modify the FREE_API_KEYS in freeApiService.ts\n\nError details: ${errorMessage}`);
        } else if (/failed to fetch|network request failed|networkerror|load failed/i.test(errorMessage)) {
          alert(`Network error while contacting Gemini: ${errorMessage}\n\nQuick checks:\n1. Verify internet access\n2. Disable VPN/ad-blocker/firewall rules that block generativelanguage.googleapis.com\n3. Confirm your API key is valid\n\nNote: This app does not require a local backend server for transcription.`);
        } else {
          alert(`An error occurred during processing: ${errorMessage}\n\nPlease check the console for more details and ensure your API key is set up correctly.`);
        }
        
        handleBackToDashboard();
    }
  };

  const handleTranslateMeeting = async (meetingId: string, language: string): Promise<MagicSummary> => {
    if (!currentUser) throw new Error("No user logged in.");
    
    // Check if translation is allowed for current plan
    const currentPlanLimits = PLAN_LIMITS[currentUser.subscription];
    if (!currentPlanLimits.features.textTranslation) {
      throw new Error(`Text translation is not available for your ${currentUser.subscription} plan. Please upgrade to Pro or higher.`);
    }
    
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

  const handleSettingsSave = (settings: UserSettings) => {
    if (currentUser && !currentUser.isGuest) {
      const updatedUser = { ...currentUser, settings };
      authService.updateUser(updatedUser);
      setCurrentUser(updatedUser);
    }
  };

  const handleOpenSettings = () => {
    if (currentUser.isGuest) {
      alert("Please sign up or log in to configure AI settings.");
      setCurrentPage('auth');
      return;
    }
    setIsSettingsOpen(true);
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
        return <TranscriptionPage meeting={selectedMeeting!} user={currentUser} onBack={handleBackToDashboard} onTranslate={handleTranslateMeeting} />;
      case 'recording':
        return <RecordingPage onBack={handleBackToDashboard} onRecordingComplete={handleUploadAndProcess} />;
      case 'pricing':
        return <PricingPage onBack={handleBackToDashboard} onPlanSelect={handlePlanSelect} currentPlan={currentUser.subscription} />;
      case 'dashboard':
      default:
        return <Dashboard user={currentUser} onFileSelect={handleUploadAndProcess} onViewMeeting={handleViewMeeting} onRecord={() => setCurrentPage('recording')} onUpgrade={() => setCurrentPage('pricing')} onOpenSettings={handleOpenSettings} />;
    }
  };

  return (
    <ThemeProvider>
      <div className={`min-h-screen flex flex-col transition-all duration-500 relative overflow-hidden`}>
        {/* Animated Background Elements */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-float" style={{animationDelay: '0s'}}></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
          <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-float" style={{animationDelay: '4s'}}></div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 flex flex-col min-h-screen">
          {currentPage === 'processing' && <ProcessingOverlay steps={processingSteps} currentStep={currentStep} progressText={processingProgressText} />}
          
          <Header 
            user={currentUser}
            onLogout={handleLogout}
            onLoginClick={() => setCurrentPage('auth')}
            onHomeClick={handleBackToDashboard} 
            onPricingClick={() => setCurrentPage('pricing')} 
          />

          {needsApiKey ? (
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="glass-card max-w-2xl w-full" style={{animation: 'scale-in 0.5s ease-out'}}>
                <ApiKeySetup onApiKeySet={handleApiKeySet} />
              </div>
            </div>
          ) : (
            <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
              <div className="max-w-7xl mx-auto" style={{animation: 'fade-in-up 0.6s ease-out'}}>
                {renderPage()}
              </div>
            </main>
          )}
          
          {/* Admin Dashboard */}
          {isAdminDashboardOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{animation: 'fade-in-up 0.3s ease-out'}}>
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsAdminDashboardOpen(false)}></div>
              <div className="relative z-10 w-full max-w-6xl">
                <AdminDashboard onClose={() => setIsAdminDashboardOpen(false)} />
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-auto relative z-10">
            <Credits />
          </div>
          
          {/* Settings Modal */}
          <SettingsModal
            user={currentUser}
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            onSave={handleSettingsSave}
          />
        </div>
      </div>
    </ThemeProvider>
  );
};

export default App;