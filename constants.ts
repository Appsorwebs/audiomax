
import { SubscriptionPlan, PlanLimits, AIModel } from './types';

export const AVAILABLE_AI_MODELS: AIModel[] = [
  // Google Gemini Series
  {
    id: 'gemini-2.0-flash-exp',
    name: 'Gemini 2.0 Flash (Experimental)',
    provider: 'google',
    description: 'Latest experimental model with audio support',
    costLevel: 'low'
  },
  {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    provider: 'google',
    description: 'Fast and efficient with audio support',
    costLevel: 'low'
  },
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    provider: 'google',
    description: 'Previous generation with audio support',
    costLevel: 'medium'
  },
  
  // OpenAI Series (uses Whisper for audio)
  {
    id: 'gpt-4o',
    name: 'GPT-4o (with Whisper)',
    provider: 'openai',
    description: 'Uses Whisper for transcription + GPT-4o for analysis',
    costLevel: 'high'
  },
  {
    id: 'gpt-4',
    name: 'GPT-4 (with Whisper)',
    provider: 'openai',
    description: 'Uses Whisper for transcription + GPT-4 for analysis',
    costLevel: 'medium'
  },
  
  // Anthropic Claude Series (text-only, no audio transcription)
  {
    id: 'claude-sonnet-4',
    name: 'Claude Sonnet 4 (Text Only)',
    provider: 'anthropic',
    description: 'For summary/translation only (no audio transcription)',
    costLevel: 'high'
  },
  {
    id: 'claude-sonnet-3.7',
    name: 'Claude Sonnet 3.7 (Text Only)',
    provider: 'anthropic',
    description: 'For summary/translation only (no audio transcription)',
    costLevel: 'medium'
  }
];

export const DEFAULT_MODEL = 'gemini-2.0-flash-exp';

export const PLAN_LIMITS: Record<SubscriptionPlan, PlanLimits> = {
  'Free': {
    transcriptionMinutes: 60,
    uploadsPerMonth: 5,
    features: {
      basicSpeakerSeparation: true,
      aiAssistedActionItems: false,
      textTranslation: false,
      audioTranslation: false,
      textTranslationChars: 0,
      audioTranslationMinutes: 0,
      voiceIdProfiles: false,
      unlimitedUploads: false,
      realTimeTranslation: false,
      customAiModels: false,
      advancedSecurity: false,
      crossMeetingAnalytics: false,
      customBranding: false,
    },
    support: 'community'
  },
  'Pro': {
    transcriptionMinutes: 300,
    uploadsPerMonth: 20,
    features: {
      basicSpeakerSeparation: true,
      aiAssistedActionItems: true,
      textTranslation: true,
      audioTranslation: true,
      textTranslationChars: 10000,
      audioTranslationMinutes: 10,
      voiceIdProfiles: false,
      unlimitedUploads: false,
      realTimeTranslation: false,
      customAiModels: false,
      advancedSecurity: false,
      crossMeetingAnalytics: false,
      customBranding: false,
    },
    support: 'email'
  },
  'Super Pro': {
    transcriptionMinutes: 1000,
    uploadsPerMonth: 'unlimited',
    features: {
      basicSpeakerSeparation: true,
      aiAssistedActionItems: true,
      textTranslation: true,
      audioTranslation: true,
      textTranslationChars: 50000,
      audioTranslationMinutes: 60,
      voiceIdProfiles: true,
      unlimitedUploads: true,
      realTimeTranslation: true,
      customAiModels: false,
      advancedSecurity: false,
      crossMeetingAnalytics: false,
      customBranding: false,
    },
    support: 'priority'
  },
  'Enterprise': {
    transcriptionMinutes: 'unlimited',
    uploadsPerMonth: 'unlimited',
    features: {
      basicSpeakerSeparation: true,
      aiAssistedActionItems: true,
      textTranslation: true,
      audioTranslation: true,
      textTranslationChars: -1, // unlimited
      audioTranslationMinutes: -1, // unlimited
      voiceIdProfiles: true,
      unlimitedUploads: true,
      realTimeTranslation: true,
      customAiModels: true,
      advancedSecurity: true,
      crossMeetingAnalytics: true,
      customBranding: true,
    },
    support: 'dedicated'
  }
};
