import { GoogleGenAI, Type } from "@google/genai";
import { TranscriptLine, MagicSummary, User } from "../types.ts";
import { transcribeAudioWithProvider, generateMeetingSummaryWithProvider } from "./aiService";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // This warning is helpful for developers in a local environment.
  console.warn("API_KEY environment variable not set. The application will not be able to communicate with the Gemini API.");
}

const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

// Schema needed for translation function
const summarySchema = {
    type: Type.OBJECT,
    properties: {
        executiveSummary: {
            type: Type.STRING,
            description: "A concise, professional summary of the entire meeting conversation, written in an executive-ready format."
        },
        actionItems: {
            type: Type.ARRAY,
            description: "A list of all explicit action items mentioned. Each item should be clear and actionable.",
            items: {
                type: Type.OBJECT,
                properties: {
                    item: {
                        type: Type.STRING,
                        description: "The specific task or action to be completed."
                    },
                    assignee: {
                        type: Type.STRING,
                        description: "The person or team assigned to the action item. If not explicitly mentioned, state 'Unassigned'."
                    }
                },
                required: ["item", "assignee"]
            }
        },
        keyDecisions: {
            type: Type.ARRAY,
            description: "A detailed list of all key decisions made. For each decision, provide context and the rationale behind it if available in the transcript.",
            items: {
                type: Type.OBJECT,
                properties: {
                    decision: {
                        type: Type.STRING,
                        description: "The specific decision that was made."
                    },
                    rationale: {
                        type: Type.STRING,
                        description: "The reasoning or justification for the decision, as mentioned in the conversation."
                    }
                },
                required: ["decision"]
            }
        }
    },
    required: ["executiveSummary", "actionItems", "keyDecisions"]
};


const transcribeAudioChunk = async (audioChunk: File | Blob, user: User): Promise<TranscriptLine[]> => {
    // Use the new AI service that supports multiple providers
    return await transcribeAudioWithProvider(audioChunk, user);
};

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
    if (!ai) {
        throw new Error("API Client not initialized. Please set the API_KEY.");
    }
    
    onProgress('Decoding audio file...');
    
    // Check file size first - limit to prevent memory issues
    const MAX_FILE_SIZE_MB = 100; // 100MB limit
    if (audioFile.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        throw new Error(`File size (${Math.round(audioFile.size / (1024 * 1024))}MB) exceeds the maximum limit of ${MAX_FILE_SIZE_MB}MB. Please use a smaller file.`);
    }
    
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    let arrayBuffer: ArrayBuffer;
    let audioBuffer: AudioBuffer;
    
    try {
        arrayBuffer = await audioFile.arrayBuffer();
        audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    } catch (error) {
        throw new Error("Failed to decode audio file. Please ensure the file is a valid audio format (MP3, WAV, M4A, etc.).");
    }

    const CHUNK_DURATION_SECONDS = 59;
    const totalDuration = audioBuffer.duration;
    
    // Check duration limit based on plan (implement basic limits for now)
    const MAX_DURATION_MINUTES = 180; // 3 hours max for any plan to prevent crashes
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

        // Create audio chunk with better memory management
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
                chunkTranscript = await transcribeAudioChunk(wavBlob, user);
                break; // Success, exit retry loop
            } catch (error) {
                retryCount++;
                if (retryCount >= MAX_RETRIES) {
                    throw new Error(`Failed to transcribe chunk ${i + 1} after ${MAX_RETRIES} attempts: ${error instanceof Error ? error.message : String(error)}`);
                }
                onProgress(`Retrying chunk ${i + 1} (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
                await new Promise(resolve => setTimeout(resolve, 2000 * retryCount)); // Progressive delay
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
        
        // Clear chunk buffer to free memory
        chunkBuffer = null as any;
        
        // Add small delay between chunks to prevent overwhelming the API
        if (i < numberOfChunks - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }
    
    // Clean up audio context
    try {
        await audioContext.close();
    } catch (error) {
        console.warn("Failed to close audio context:", error);
    }
    
    onProgress('Combining transcripts...');
    return combinedTranscript;
};

export const generateMeetingSummary = async (transcript: TranscriptLine[], user: User): Promise<MagicSummary> => {
  // Use the new AI service that supports multiple providers
  return await generateMeetingSummaryWithProvider(transcript, user);
};

export const translateSummary = async (summary: MagicSummary, targetLanguage: string): Promise<MagicSummary> => {
    if (!ai) {
        throw new Error("API Client not initialized. Please set the API_KEY.");
    }

    const summaryText = `
        Executive Summary: ${summary.executiveSummary}
        Key Decisions: ${summary.keyDecisions.map(d => `${d.decision} (Rationale: ${d.rationale || 'N/A'})`).join('; ')}
        Action Items: ${summary.actionItems.map(a => `${a.item} (Assignee: ${a.assignee})`).join('; ')}
    `;

    const prompt = `Translate the following meeting summary text to ${targetLanguage}. Keep the original meaning and professional tone. Respond ONLY with a JSON object that follows the provided schema. Do not add any extra commentary or markdown formatting.

Text to translate:
---
${summaryText}
---
`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: summarySchema,
            }
        });
        
        if (!response.text) {
            throw new Error(`The model returned no content while translating to ${targetLanguage}.`);
        }

        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as MagicSummary;

    } catch (error) {
        console.error(`Error translating summary with Gemini to ${targetLanguage}:`, error);
        throw new Error(`Failed to translate summary to ${targetLanguage}.`);
    }
};