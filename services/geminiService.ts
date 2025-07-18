import { GoogleGenAI, Type } from "@google/genai";
import { TranscriptLine, MagicSummary } from "../types.ts";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // This warning is helpful for developers in a local environment.
  console.warn("API_KEY environment variable not set. The application will not be able to communicate with the Gemini API.");
}

const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

const fileToGenerativePart = async (file: File | Blob) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

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

const transcriptSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            speaker: {
                type: Type.STRING,
                description: "The identified speaker. E.g., 'Speaker 1'."
            },
            timestamp: {
                type: Type.STRING,
                description: "The timestamp of the speech in MM:SS format."
            },
            text: {
                type: Type.STRING,
                description: "The transcribed text for this segment."
            }
        },
        required: ["speaker", "timestamp", "text"]
    }
};

/**
 * Attempts to repair a truncated JSON string that should be an array of objects.
 */
function repairAndParseJsonArray(jsonText: string): TranscriptLine[] {
    console.warn("Attempting to repair truncated JSON...");
    let content = jsonText.trim();
    
    if (!content.startsWith('[')) {
        throw new Error("JSON does not start with an array bracket.");
    }

    const lastBraceIndex = content.lastIndexOf('}');
    if (lastBraceIndex === -1) {
        throw new Error("No closing brace found in JSON text to repair from.");
    }
    
    const truncatedContent = content.substring(0, lastBraceIndex + 1);

    const lastCommaIndex = truncatedContent.lastIndexOf(',');
    const lastOpenBraceIndex = truncatedContent.lastIndexOf('{');

    let repairedString;
    if (lastCommaIndex > lastOpenBraceIndex) {
        repairedString = truncatedContent + ']';
    } else {
        const contentBeforeLastObject = truncatedContent.substring(0, lastOpenBraceIndex);
        const lastCommaBefore = contentBeforeLastObject.lastIndexOf(',');
        if (lastCommaBefore !== -1) {
            repairedString = contentBeforeLastObject.substring(0, lastCommaBefore) + '}]';
        } else {
             throw new Error("Cannot repair: the only object in the array is truncated.");
        }
    }
    
    repairedString = repairedString.replace(/,\]$/, ']');

    try {
        const result = JSON.parse(repairedString);
        console.log("Successfully repaired and parsed JSON.");
        return result;
    } catch(e) {
        console.error("Failed to parse repaired JSON:", e);
        throw new Error("Could not repair the malformed JSON response.");
    }
}


const transcribeAudioChunk = async (audioChunk: File | Blob): Promise<TranscriptLine[]> => {
    if (!ai) {
        throw new Error("API Client not initialized. Please set the API_KEY.");
    }

    const audioPart = await fileToGenerativePart(audioChunk);
    const prompt = `Transcribe the audio. Identify distinct speakers as "Speaker 1", "Speaker 2", etc. Provide timestamps for each segment in MM:SS format. Important: Break up long monologues into smaller segments of no more than 3-4 sentences each. The final output MUST be a complete and valid JSON array.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [audioPart, { text: prompt }] },
            config: {
                responseMimeType: "application/json",
                responseSchema: transcriptSchema,
            }
        });

        if (!response.text) {
            const finishReason = response.candidates?.[0]?.finishReason;
            const finishMessage = response.candidates?.[0]?.finishMessage;
            console.error(`Transcription failed. Finish Reason: ${finishReason || 'N/A'}. Message: ${finishMessage || 'N/A'}`);
            
            let errorMessage = "The model returned no content. This might be due to a safety block or an issue with the audio file.";
            if (finishReason === 'SAFETY') {
                errorMessage = "Transcription failed because the content was blocked for safety reasons.";
            } else if (finishReason === 'MAX_TOKENS') {
                 errorMessage = "Transcription failed because the audio is too long, exceeding the model's token limit.";
            }
            throw new Error(errorMessage);
        }

        const jsonText = response.text.trim();
        const finishReason = response.candidates?.[0]?.finishReason;
        if (finishReason && finishReason !== 'STOP') {
            console.warn(`Gemini transcription finished with non-standard reason: ${finishReason}. This could indicate the response was truncated.`);
        }

        try {
            return JSON.parse(jsonText) as TranscriptLine[];
        } catch (parseError) {
             console.error("Failed to parse JSON response from Gemini during transcription:", parseError);
             console.error("Problematic JSON text received for transcription:", jsonText);
             
             try {
                const repairedTranscript = repairAndParseJsonArray(jsonText);
                alert("The AI transcription was incomplete and had to be repaired. The end of the transcript may be missing. Please review carefully.");
                return repairedTranscript;
             } catch(repairError) {
                console.error("JSON repair attempt failed:", repairError);
                throw new Error("The model returned a malformed JSON response that could not be repaired. This can happen with very long or complex audio files.");
             }
        }

    } catch (error) {
        console.error("Error transcribing audio with Gemini:", error);
        if (error instanceof Error) {
             throw error; 
        }
        throw new Error("Failed to transcribe audio. The model may have been unable to process the request. Please try again with a shorter audio file if the problem persists.");
    }
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
    onProgress: (message: string) => void
): Promise<TranscriptLine[]> => {
    if (!ai) {
        throw new Error("API Client not initialized. Please set the API_KEY.");
    }
    
    onProgress('Decoding audio file...');
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const arrayBuffer = await audioFile.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    const CHUNK_DURATION_SECONDS = 59;
    const totalDuration = audioBuffer.duration;
    const numberOfChunks = Math.ceil(totalDuration / CHUNK_DURATION_SECONDS);

    let combinedTranscript: TranscriptLine[] = [];

    for (let i = 0; i < numberOfChunks; i++) {
        onProgress(`Transcribing chunk ${i + 1} of ${numberOfChunks}...`);
        
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
        
        const chunkTranscript = await transcribeAudioChunk(wavBlob);

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
    
    onProgress('Combining transcripts...');
    return combinedTranscript;
};

export const generateMeetingSummary = async (transcript: TranscriptLine[]): Promise<MagicSummary> => {
  if (!ai) {
    throw new Error("API Client not initialized. Please set the API_KEY.");
  }
  
  const transcriptText = transcript.map(line => `${line.speaker}: ${line.text}`).join('\n');
  const prompt = `Based on the following meeting transcript, please generate a structured summary. The summary must be detailed and professional.

For 'keyDecisions', it is crucial to not only state the decision but to also capture the *rationale* or justification behind it if it is mentioned in the discussion. This detail is very important.

Transcript:
---
${transcriptText}
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
        throw new Error("The model returned no content while generating the summary.");
    }

    const jsonText = response.text.trim();
    const parsedJson = JSON.parse(jsonText);

    if (parsedJson.executiveSummary && parsedJson.actionItems && parsedJson.keyDecisions) {
        return parsedJson as MagicSummary;
    } else {
        throw new Error("Invalid JSON structure received from summary API.");
    }

  } catch (error) {
    console.error("Error generating summary with Gemini:", error);
    throw new Error("Failed to generate meeting summary. Please check the console for details.");
  }
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