// Backend API Service
// Works offline with no network calls when running without AI services

const API_URL = (import.meta as any).env?.VITE_API_URL || '';

interface TranscriptLine {
  speaker: string;
  timestamp: string;
  text: string;
}

interface MagicSummary {
  executiveSummary: string;
  actionItems: Array<{ item: string; assignee: string; }>;
  keyDecisions: Array<{ decision: string; rationale?: string; }>;
}

// Check if we should skip backend (no server configured)
const shouldSkipBackend = (): boolean => {
  // If no API_URL is configured, we're in pure offline mode
  return !API_URL;
};

let backendAvailable: boolean | null = null;

export const checkBackendHealth = async (): Promise<boolean> => {
  if (shouldSkipBackend()) {
    backendAvailable = false;
    return false;
  }
  
  if (backendAvailable !== null) return backendAvailable;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1000);
    const response = await fetch(`${API_URL}/api/health`, { method: 'GET', signal: controller.signal });
    clearTimeout(timeoutId);
    backendAvailable = response.ok;
    return backendAvailable;
  } catch {
    backendAvailable = false;
    return false;
  }
};

export const transcribeAudioChunk = async (
  audioChunk: File | Blob, chunkIndex: number = 0, userId?: string,
  onProgress?: (message: string) => void, modelId?: string,
  apiKeys?: { google?: string; openai?: string; anthropic?: string }
): Promise<TranscriptLine[]> => {
  if (shouldSkipBackend()) {
    throw new Error('offline-mode');
  }
  
  const formData = new FormData();
  formData.append('audio', audioChunk);
  formData.append('chunkIndex', chunkIndex.toString());
  if (userId) formData.append('userId', userId);
  if (modelId) formData.append('modelId', modelId);
  if (apiKeys) formData.append('apiKeys', JSON.stringify(apiKeys));

  if (onProgress) onProgress(`Transcribing audio chunk ${chunkIndex + 1}...`);

  const response = await fetch(`${API_URL}/api/transcribe`, { method: 'POST', body: formData });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Transcription failed' }));
    throw new Error(errorData.message || errorData.error || 'Transcription failed');
  }

  return (await response.json()).transcript;
};

export const generateMeetingSummary = async (
  transcript: TranscriptLine[], userId?: string, onProgress?: (message: string) => void,
  modelId?: string, apiKeys?: { google?: string; openai?: string; anthropic?: string }
): Promise<MagicSummary> => {
  if (onProgress) onProgress('Generating meeting summary...');
  
  if (shouldSkipBackend()) {
    throw new Error('offline-mode');
  }

  const response = await fetch(`${API_URL}/api/generate-summary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcript, userId, modelId, apiKeys })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Summary generation failed' }));
    throw new Error(errorData.message || errorData.error || 'Summary generation failed');
  }

  return (await response.json()).summary;
};

export const translateSummary = async (
  summary: MagicSummary, targetLanguage: string, onProgress?: (message: string) => void,
  modelId?: string, apiKeys?: { google?: string; openai?: string; anthropic?: string }
): Promise<MagicSummary> => {
  if (onProgress) onProgress(`Translating summary to ${targetLanguage}...`);
  
  if (shouldSkipBackend()) {
    throw new Error('offline-mode');
  }

  const response = await fetch(`${API_URL}/api/translate-summary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ summary, targetLanguage, modelId, apiKeys })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Translation failed' }));
    throw new Error(errorData.message || errorData.error || 'Translation failed');
  }

  return (await response.json()).summary;
};