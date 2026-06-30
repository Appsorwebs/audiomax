// Backend API Service
// Gracefully handles backend unavailability with offline fallbacks

const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001';

interface TranscriptLine {
  speaker: string;
  timestamp: string;
  text: string;
}

interface MagicSummary {
  executiveSummary: string;
  actionItems: Array<{
    item: string;
    assignee: string;
  }>;
  keyDecisions: Array<{
    decision: string;
    rationale?: string;
  }>;
}

// Backend health cache
let backendAvailable: boolean | null = null;

export const checkBackendHealth = async (): Promise<boolean> => {
  // Return cached result if available
  if (backendAvailable !== null) {
    return backendAvailable;
  }
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    
    const response = await fetch(`${API_URL}/api/health`, {
      method: 'GET',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    backendAvailable = response.ok;
    return backendAvailable;
  } catch (error) {
    backendAvailable = false;
    return false;
  }
};

export const transcribeAudioChunk = async (
  audioChunk: File | Blob,
  chunkIndex: number = 0,
  userId?: string,
  onProgress?: (message: string) => void,
  modelId?: string,
  apiKeys?: { google?: string; openai?: string; anthropic?: string }
): Promise<TranscriptLine[]> => {
  // Check backend health first
  if (!await checkBackendHealth()) {
    throw new Error('Backend unavailable - offline mode');
  }
  
  const formData = new FormData();
  formData.append('audio', audioChunk);
  formData.append('chunkIndex', chunkIndex.toString());
  if (userId) {
    formData.append('userId', userId);
  }
  if (modelId) {
    formData.append('modelId', modelId);
  }
  if (apiKeys) {
    formData.append('apiKeys', JSON.stringify(apiKeys));
  }

  if (onProgress) {
    onProgress(`Transcribing audio chunk ${chunkIndex + 1}...`);
  }

  const response = await fetch(`${API_URL}/api/transcribe`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Transcription failed' }));
    throw new Error(errorData.message || errorData.error || 'Transcription failed');
  }

  const data = await response.json();
  return data.transcript;
};

export const generateMeetingSummary = async (
  transcript: TranscriptLine[],
  userId?: string,
  onProgress?: (message: string) => void,
  modelId?: string,
  apiKeys?: { google?: string; openai?: string; anthropic?: string }
): Promise<MagicSummary> => {
  if (onProgress) {
    onProgress('Generating meeting summary...');
  }
  
  // Check backend health first
  if (!await checkBackendHealth()) {
    throw new Error('Backend unavailable - offline mode');
  }

  const response = await fetch(`${API_URL}/api/generate-summary`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ transcript, userId, modelId, apiKeys })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Summary generation failed' }));
    throw new Error(errorData.message || errorData.error || 'Summary generation failed');
  }

  const data = await response.json();
  return data.summary;
};

export const translateSummary = async (
  summary: MagicSummary,
  targetLanguage: string,
  onProgress?: (message: string) => void,
  modelId?: string,
  apiKeys?: { google?: string; openai?: string; anthropic?: string }
): Promise<MagicSummary> => {
  if (onProgress) {
    onProgress(`Translating summary to ${targetLanguage}...`);
  }
  
  // Check backend health first
  if (!await checkBackendHealth()) {
    throw new Error('Backend unavailable - offline mode');
  }

  const response = await fetch(`${API_URL}/api/translate-summary`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ summary, targetLanguage, modelId, apiKeys })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Translation failed' }));
    throw new Error(errorData.message || errorData.error || 'Translation failed');
  }

  const data = await response.json();
  return data.summary;
};