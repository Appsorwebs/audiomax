
import { SubscriptionPlan, PlanLimits, AIModel } from './types';

export const AVAILABLE_AI_MODELS: AIModel[] = [
  // Google Gemini Series
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'google',
    description: 'Most advanced Gemini model with superior reasoning',
    costLevel: 'high'
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'google',
    description: 'Fast and efficient, great for most tasks',
    costLevel: 'low'
  },
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    provider: 'google',
    description: 'Previous generation flagship model',
    costLevel: 'medium'
  },
  
  // Anthropic Claude Series
  {
    id: 'claude-sonnet-4',
    name: 'Claude Sonnet 4',
    provider: 'anthropic',
    description: 'Latest high-performance coding/agent model',
    costLevel: 'high'
  },
  {
    id: 'claude-sonnet-3.7',
    name: 'Claude Sonnet 3.7',
    provider: 'anthropic',
    description: 'Predecessor to Sonnet 4, still very capable',
    costLevel: 'medium'
  },
  {
    id: 'claude-opus-4',
    name: 'Claude Opus 4',
    provider: 'anthropic',
    description: 'Advanced agentic and coding model',
    costLevel: 'high'
  },
  
  // OpenAI ChatGPT Series
  {
    id: 'gpt-4o-agent',
    name: 'ChatGPT Agent (GPT-4o)',
    provider: 'openai',
    description: 'Powered by GPT-4o with agent capabilities',
    costLevel: 'high'
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    description: 'Multimodal flagship with agent capabilities',
    costLevel: 'high'
  },
  {
    id: 'gpt-4',
    name: 'GPT-4',
    provider: 'openai',
    description: 'Prior model, still widely used',
    costLevel: 'medium'
  }
];

export const DEFAULT_MODEL = 'gemini-2.5-flash';

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
