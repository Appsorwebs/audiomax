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

    setUint32(0x46464952); // RIFF
    setUint32(length - 8);
    setUint32(0x45564157); // WAVE
    setUint32(0x20746d66); // fmt 
    setUint32(16);
    setUint16(1);
    setUint16(numOfChan);
    setUint32(buffer.sampleRate);
    setUint32(buffer.sampleRate * 2 * numOfChan);
    setUint16(numOfChan * 2);
    setUint16(16);
    setUint32(0x61746164); // data

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

// Backend transcription with proper error handling
const tryBackendTranscription = async (
    audioFile: File,
    user: User,
    onProgress: (message: string) => void
): Promise<TranscriptLine[]> => {
    onProgress('Connecting to transcription service...');
    
    const isHealthy = await checkBackendHealth();
    if (!isHealthy) {
        throw new Error('Backend server unavailable. Please start the backend server or configure AI API keys in Settings.');
    }
    
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
        
        const chunkTranscript = await backendTranscribeAudioChunk(wavBlob, i, user?.email, undefined, undefined, user?.settings?.apiKeys);
        const adjustedTranscript = chunkTranscript.map(line => {
            const timeParts = line.timestamp.split(':').map(Number);
            if (timeParts.length !== 2 || isNaN(timeParts[0]) || isNaN(timeParts[1])) {
                return line;
            }
            const lineSecondsWithinChunk = timeParts[0] * 60 + timeParts[1];
            const absoluteSeconds = Math.floor(chunkStartTimeSeconds + lineSecondsWithinChunk);
            const newMinutes = Math.floor(absoluteSeconds / 60);
            const newSeconds = absoluteSeconds % 60;
            return { ...line, timestamp: `${String(newMinutes).padStart(2, '0')}:${String(newSeconds).padStart(2, '0')}` };
        });
        combinedTranscript.push(...adjustedTranscript);
        
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    await audioContext.close();
    onProgress('Combining transcripts...');
    return combinedTranscript;
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
    
    return tryBackendTranscription(audioFile, user, onProgress);
};

export const generateMeetingSummary = async (
    transcript: TranscriptLine[],
    user: User,
    onProgress?: (message: string) => void
): Promise<MagicSummary> => {
    return await backendGenerateMeetingSummary(transcript, user?.email, onProgress, undefined, user?.settings?.apiKeys);
};

export const translateSummary = async (
    summary: MagicSummary,
    targetLanguage: string,
    onProgress?: (message: string) => void
): Promise<MagicSummary> => {
    return await backendTranslateSummary(summary, targetLanguage, onProgress);
};

export const isLiveMode = async (): Promise<boolean> => {
    const apiUrl = (import.meta as any).env?.VITE_API_URL;
    if (!apiUrl) return false;
    
    const isHealthy = await checkBackendHealth();
    return isHealthy;
};