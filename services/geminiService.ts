import { TranscriptLine, MagicSummary, User } from "../types.ts";
import * as backendService from "./backendService";

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

    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8);
    setUint32(0x45564157); // "WAVE"
    setUint32(0x20746d66); // "fmt "
    setUint32(16);
    setUint16(1);
    setUint16(numOfChan);
    setUint32(buffer.sampleRate);
    setUint32(buffer.sampleRate * 2 * numOfChan);
    setUint16(numOfChan * 2);
    setUint16(16);
    setUint32(0x61746164); // "data"
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


export const transcribeAudio = async (
    audioFile: File,
    user: User,
    onProgress: (message: string) => void
): Promise<TranscriptLine[]> => {
    onProgress('Decoding audio file...');
    
    // Check file size first - limit to prevent memory issues
    const MAX_FILE_SIZE_MB = user.subscription === 'Free' ? 25 : 100;
    if (audioFile.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        throw new Error(`File size (${Math.round(audioFile.size / (1024 * 1024))}MB) exceeds the maximum limit of ${MAX_FILE_SIZE_MB}MB${user.subscription === 'Free' ? ' for free tier' : ''}. Please use a smaller file.`);
    }
    
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    let arrayBuffer: ArrayBuffer;
    let audioBuffer: AudioBuffer;
    
    try {
        onProgress('Loading audio file...');
        arrayBuffer = await audioFile.arrayBuffer();
        
        onProgress('Processing audio...');
        audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    } catch (error) {
        throw new Error("Failed to decode audio file. Please ensure the file is a valid audio format (MP3, WAV, M4A, etc.).");
    }

    const CHUNK_DURATION_SECONDS = 59;
    const totalDuration = audioBuffer.duration;
    
    // Check duration limit based on plan
    const MAX_DURATION_MINUTES = 180; // 3 hours max
    if (totalDuration > MAX_DURATION_MINUTES * 60) {
        throw new Error(`Audio duration (${Math.round(totalDuration / 60)} minutes) exceeds the maximum limit of ${MAX_DURATION_MINUTES} minutes. Please use a shorter audio file or split it into smaller segments.`);
    }
    
    const numberOfChunks = Math.ceil(totalDuration / CHUNK_DURATION_SECONDS);
    onProgress(`Processing ${numberOfChunks} chunks for ${Math.round(totalDuration / 60)} minute audio...`);

    let combinedTranscript: TranscriptLine[] = [];

    for (let i = 0; i < numberOfChunks; i++) {
        const progress = Math.round(((i + 1) / numberOfChunks) * 100);
        onProgress(`Transcribing chunk ${i + 1} of ${numberOfChunks} (${progress}%)...`);
        
        const chunkStartTimeSeconds = i * CHUNK_DURATION_SECONDS;
        const endTime = Math.min(chunkStartTimeSeconds + CHUNK_DURATION_SECONDS, totalDuration);
        const chunkDuration = endTime - chunkStartTimeSeconds;

        if (chunkDuration <= 0) continue;

        let chunkBuffer: AudioBuffer;
        try {
            chunkBuffer = audioContext.createBuffer(
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
        } catch (error) {
            throw new Error(`Failed to process audio chunk ${i + 1}. The audio file may be corrupted or too complex.`);
        }

        const wavBlob = bufferToWav(chunkBuffer);
        
        // Add retry logic for API calls
        let chunkTranscript: TranscriptLine[] = [];
        let retryCount = 0;
        const MAX_RETRIES = 3;
        
        while (retryCount < MAX_RETRIES) {
            try {
                chunkTranscript = await backendService.transcribeAudioChunk(
                    wavBlob, 
                    i, 
                    user.email, 
                    onProgress,
                    user.settings?.selectedModel,
                    user.settings?.apiKeys
                );
                break;
            } catch (error) {
                retryCount++;
                const errorMessage = error instanceof Error ? error.message : String(error);
                
                // Check for quota/rate limit errors - don't retry these
                if (errorMessage.includes('quota') || errorMessage.includes('rate limit') || errorMessage.includes('429')) {
                    throw new Error(`API quota exceeded. ${errorMessage.includes('gemini') || errorMessage.includes('google') ? 'Try switching to gemini-1.5-flash in Settings, or use a different provider (OpenAI/Anthropic).' : 'Please check your API usage limits or try a different model.'}`);
                }
                
                if (retryCount >= MAX_RETRIES) {
                    throw new Error(`Failed to transcribe chunk ${i + 1} after ${MAX_RETRIES} attempts: ${errorMessage}`);
                }
                onProgress(`Retrying chunk ${i + 1} (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
                await new Promise(resolve => setTimeout(resolve, 2000 * retryCount));
            }
        }

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
        
        chunkBuffer = null as any;
        
        if (i < numberOfChunks - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }
    
    try {
        await audioContext.close();
    } catch (error) {
        console.warn("Failed to close audio context:", error);
    }
    
    onProgress('Combining transcripts...');
    return combinedTranscript;
};

export const generateMeetingSummary = async (transcript: TranscriptLine[], user: User): Promise<MagicSummary> => {
    return await backendService.generateMeetingSummary(
        transcript, 
        user.email,
        undefined,
        user.settings?.selectedModel,
        user.settings?.apiKeys
    );
};

export const translateSummary = async (summary: MagicSummary, targetLanguage: string, user?: User): Promise<MagicSummary> => {
    return await backendService.translateSummary(
        summary, 
        targetLanguage,
        undefined,
        user?.settings?.selectedModel,
        user?.settings?.apiKeys
    );
};