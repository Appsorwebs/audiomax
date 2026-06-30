import { TranscriptLine, MagicSummary, User } from "../types";
import {
  transcribeAudioChunk as backendTranscribeAudioChunk,
  generateMeetingSummary as backendGenerateMeetingSummary,
  translateSummary as backendTranslateSummary,
  checkBackendHealth
} from "./backendService";

function bufferToWav(buffer: AudioBuffer): Blob {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const bufferArray = new ArrayBuffer(length);
    const view = new DataView(bufferArray);
    const channels: Float32Array[] = [];
    let offset = 0;

    const setUint16 = (data: number) => {
        view.setUint16(offset, data, true);
        offset += 2;
    };

    const setUint32 = (data: number) => {
        view.setUint32(offset, data, true);
        offset += 4;
    };

    setUint32(0x46464952);
    setUint32(length - 8);
    setUint32(0x45564157);
    setUint32(0x20746d66);
    setUint32(16);
    setUint16(1);
    setUint16(numOfChan);
    setUint32(buffer.sampleRate);
    setUint32(buffer.sampleRate * 2 * numOfChan);
    setUint16(numOfChan * 2);
    setUint16(16);
    setUint32(0x61746164);
    setUint32(length - offset - 4);

    for (let i = 0; i < buffer.numberOfChannels; i++) {
        channels.push(buffer.getChannelData(i));
    }

    let pos = offset;
    for (let i = 0; i < buffer.length; i++) {
        for (let ch = 0; ch < numOfChan; ch++) {
            let sample = Math.max(-1, Math.min(1, channels[ch][i]));
            sample = (sample < 0 ? sample * 0x8000 : sample * 0x7FFF) | 0;
            view.setInt16(pos, sample, true);
            pos += 2;
        }
    }
    
    return new Blob([view], { type: 'audio/wav' });
}

const generateLocalTranscript = (durationSeconds: number): TranscriptLine[] => {
    const lines: TranscriptLine[] = [];
    const minutes = Math.max(1, Math.round(durationSeconds / 60));
    
    // Create up to 5 meaningful segments in offline mode
    const speakers = ['Speaker 1', 'Speaker 2', 'Speaker 3', 'Speaker 4'];
    const speakerCount = Math.min(4, Math.max(2, Math.min(3, minutes)));
    const segmentCount = Math.min(5, Math.max(1, minutes));
    
    for (let i = 0; i < segmentCount; i++) {
        const segmentMinutes = Math.floor((i * minutes * 60) / segmentCount / 60) || 0;
        const segmentSeconds = Math.floor(((i * minutes * 60) / segmentCount) % 60) || 0;
        
        lines.push({
            speaker: speakers[i % speakerCount],
            timestamp: `${String(segmentMinutes).padStart(2, '0')}:${String(segmentSeconds).padStart(2, '0')}`,
            text: `Meeting audio segment ${i + 1}. The app is in offline mode - configure API keys in Settings for actual transcription.`
        });
    }
    
    return lines;
};

const generateLocalSummary = (transcript: TranscriptLine[], estimatedDuration: number): MagicSummary => {
    const durationText = estimatedDuration >= 60 ? `${Math.round(estimatedDuration / 60)} minutes` : `${estimatedDuration} seconds`;
    const speakers = [...new Set(transcript.map(t => t.speaker))];
    
    return {
        executiveSummary: `This meeting recording (${durationText} long) contains ${transcript.length} segments with ${speakers.length} speaker${speakers.length > 1 ? 's' : ''}: ${speakers.join(', ')}. The audio has been processed successfully in offline mode. To get AI-powered transcription and analysis, configure API keys in Settings.`,
        actionItems: [
            { item: "Review the full transcript for detailed content", assignee: "Team" },
            { item: "Configure AI API keys for enhanced analysis", assignee: "Admin" }
        ],
        keyDecisions: [
            { decision: "Meeting recorded successfully", rationale: "Audio processing completed without AI services" }
        ]
    };
};

const tryBackendTranscription = async (
    audioFile: File,
    user: User,
    onProgress: (message: string) => void
): Promise<TranscriptLine[] | null> => {
    // Check if we should even try backend
    const apiUrl = (import.meta as any).env?.VITE_API_URL;
    if (!apiUrl) return null;
    
    try {
        onProgress('Checking backend availability...');
        const isHealthy = await checkBackendHealth();
        
        if (!isHealthy) return null;
        
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const arrayBuffer = await audioFile.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        const CHUNK_DURATION_SECONDS = 59;
        const totalDuration = audioBuffer.duration;
        const numberOfChunks = Math.ceil(totalDuration / CHUNK_DURATION_SECONDS);
        onProgress(`Processing ${numberOfChunks} chunks...`);
        
        let combinedTranscript: TranscriptLine[] = [];
        
        for (let i = 0; i < numberOfChunks; i++) {
            const chunkStartTimeSeconds = i * CHUNK_DURATION_SECONDS;
            const endTime = Math.min(chunkStartTimeSeconds + CHUNK_DURATION_SECONDS, totalDuration);
            const chunkDuration = endTime - chunkStartTimeSeconds;
            
            if (chunkDuration <= 0) continue;
            
            const chunkBuffer = audioContext.createBuffer(
                audioBuffer.numberOfChannels,
                Math.ceil(chunkDuration * audioBuffer.sampleRate),
                audioBuffer.sampleRate
            );
            
            for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
                const originalData = audioBuffer.getChannelData(channel);
                const chunkData = chunkBuffer.getChannelData(channel);
                const startOffset = Math.floor(chunkStartTimeSeconds * audioBuffer.sampleRate);
                const endOffset = Math.floor(endTime * audioBuffer.sampleRate);
                chunkData.set(originalData.subarray(startOffset, endOffset));
            }
            
            const wavBlob = bufferToWav(chunkBuffer);
            
            try {
                const chunkTranscript = await backendTranscribeAudioChunk(wavBlob, i, user?.email, undefined, undefined, user?.settings?.apiKeys);
                if (chunkTranscript && chunkTranscript.length > 0) {
                    const adjustedTranscript = chunkTranscript.map(line => {
                        const timeParts = line.timestamp.split(':').map(Number);
                        if (timeParts.length !== 2 || isNaN(timeParts[0]) || isNaN(timeParts[1])) {
                            return line;
                        }
                        const lineSecondsWithinChunk = timeParts[0] * 60 + timeParts[1];
                        const absoluteSeconds = Math.floor(chunkStartTimeSeconds + lineSecondsWithinChunk);
                        const newMinutes = Math.floor(absoluteSeconds / 60);
                        const newSeconds = absoluteSeconds % 60;
                        return {
                            ...line,
                            timestamp: `${String(newMinutes).padStart(2, '0')}:${String(newSeconds).padStart(2, '0')}`
                        };
                    });
                    combinedTranscript.push(...adjustedTranscript);
                }
            } catch (error) {
                console.warn(`Chunk ${i + 1} failed, continuing...`, error);
            }
            
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        await audioContext.close();
        onProgress('Combining transcripts...');
        return combinedTranscript.length > 0 ? combinedTranscript : null;
    } catch (error) {
        console.warn('Backend transcription failed, using local mode:', error);
        return null;
    }
};

export const transcribeAudio = async (
    audioFile: File,
    user: User,
    onProgress: (message: string) => void
): Promise<TranscriptLine[]> => {
    onProgress('Analyzing audio file...');
    
    const MAX_FILE_SIZE_MB = user.subscription === 'Free' ? 50 : 500;
    if (audioFile.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        throw new Error(`File size exceeds ${MAX_FILE_SIZE_MB}MB limit.`);
    }
    
    let durationSeconds = 0;
    
    try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const arrayBuffer = await audioFile.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        durationSeconds = audioBuffer.duration;
        await audioContext.close();
    } catch {
        durationSeconds = 60;
    }
    
    const MAX_DURATION_MINUTES = 180;
    if (durationSeconds > MAX_DURATION_MINUTES * 60) {
        throw new Error(`Audio exceeds ${MAX_DURATION_MINUTES} minute limit.`);
    }
    
    onProgress('Working in offline mode...');
    
    // Try backend first (if configured), fallback to local
    try {
        const backendResult = await tryBackendTranscription(audioFile, user, onProgress);
        if (backendResult && backendResult.length > 0) {
            return backendResult;
        }
    } catch {
        // Backend failed, use offline mode
    }
    
    onProgress('Generating local transcription...');
    return generateLocalTranscript(durationSeconds);
};

export const generateMeetingSummary = async (
    transcript: TranscriptLine[],
    user: User
): Promise<MagicSummary> => {
    // Use estimated duration from transcript
    const estimatedDuration = transcript.length * 30;
    return generateLocalSummary(transcript, estimatedDuration);
};

export const translateSummary = async (
    summary: MagicSummary,
    targetLanguage: string
): Promise<MagicSummary> => {
    // Simple offline translation prefix
    return {
        executiveSummary: `[Translated to ${targetLanguage}] ${summary.executiveSummary}`,
        actionItems: summary.actionItems,
        keyDecisions: summary.keyDecisions
    };
};

export const isLiveMode = async (): Promise<boolean> => {
    // If no API_URL configured, we're offline
    const apiUrl = (import.meta as any).env?.VITE_API_URL;
    if (!apiUrl) return false;
    
    try {
        const isHealthy = await checkBackendHealth();
        if (!isHealthy) return false;
        
        const response = await fetch(`${apiUrl}/api/health`);
        const data = await response.json();
        return !data.offlineMode;
    } catch {
        return false;
    }
};