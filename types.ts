export type SubscriptionPlan = 'Free' | 'Pro' | 'Super Pro' | 'Enterprise';

export interface User {
  email: string;
  password?: string; // In a real app, never store this plaintext
  subscription: SubscriptionPlan;
  meetings: Meeting[];
  isGuest?: boolean;
}

export interface Meeting {
  id: string;
  title: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  duration: string; // Formatted string for display
  durationSeconds: number; // Raw seconds
  audioUrl: string; // Object URL for playback
  status: 'Transcribed' | 'Processing' | 'Translated';
  transcript?: TranscriptLine[];
  summary?: MagicSummary;
  translatedSummary?: {
    language: string;
    summary: MagicSummary;
  }
}

export interface TranscriptLine {
  speaker: string;
  timestamp: string;
  text: string;
}

export interface ActionItem {
    item: string;
    assignee: string;
}

export interface Decision {
    decision: string;
    rationale?: string; // Add rationale for more detail
}

export interface MagicSummary {
    executiveSummary: string;
    actionItems: ActionItem[];
    keyDecisions: Decision[];
}