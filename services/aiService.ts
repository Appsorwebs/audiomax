import { GoogleGenAI, Type } from "@google/genai";
import { TranscriptLine, MagicSummary, User, AIModel } from "../types";
import { AVAILABLE_AI_MODELS, DEFAULT_MODEL } from "../constants";

// Get API key based on provider
const getApiKey = (user: User, provider: string): string | null => {
  if (user.settings?.apiKeys) {
    switch (provider) {
      case 'google':
        return user.settings.apiKeys.google || null;
      case 'anthropic':
        return user.settings.apiKeys.anthropic || null;
      case 'openai':
        return user.settings.apiKeys.openai || null;
      default:
        return null;
    }
  }
  
  // Fallback to environment variable for Google
  if (provider === 'google') {
    return process.env.API_KEY || null;
  }
  
  return null;
};

// Get selected model for user
const getUserModel = (user: User): AIModel => {
  const selectedModelId = user.settings?.selectedModel || DEFAULT_MODEL;
  return AVAILABLE_AI_MODELS.find(model => model.id === selectedModelId) || 
         AVAILABLE_AI_MODELS.find(model => model.id === DEFAULT_MODEL)!;
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

// For now, only Google Gemini is implemented. This service can be extended for other providers.
const transcribeAudioWithProvider = async (
    audioChunk: File | Blob, 
    user: User
): Promise<TranscriptLine[]> => {
    const model = getUserModel(user);
    const apiKey = getApiKey(user, model.provider);
    
    if (!apiKey) {
        throw new Error(`API key not configured for ${model.provider}. Please add your API key in settings.`);
    }
    
    // For now, we only support Google Gemini models
    if (model.provider !== 'google') {
        throw new Error(`Provider ${model.provider} is not yet implemented. Please use a Google Gemini model for now.`);
    }
    
    const ai = new GoogleGenAI({ apiKey });
    
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

    const audioPart = await fileToGenerativePart(audioChunk);
    const prompt = `Transcribe the audio. Identify distinct speakers as "Speaker 1", "Speaker 2", etc. Provide timestamps for each segment in MM:SS format. Important: Break up long monologues into smaller segments of no more than 3-4 sentences each. The final output MUST be a complete and valid JSON array.`;

    try {
        const response = await ai.models.generateContent({
            model: model.id,
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
        return JSON.parse(jsonText) as TranscriptLine[];

    } catch (error) {
        console.error("Error transcribing audio:", error);
        if (error instanceof Error) {
             throw error; 
        }
        throw new Error("Failed to transcribe audio. The model may have been unable to process the request.");
    }
};

const generateMeetingSummaryWithProvider = async (
    transcript: TranscriptLine[], 
    user: User
): Promise<MagicSummary> => {
    const model = getUserModel(user);
    const apiKey = getApiKey(user, model.provider);
    
    if (!apiKey) {
        throw new Error(`API key not configured for ${model.provider}. Please add your API key in settings.`);
    }
    
    // For now, we only support Google Gemini models
    if (model.provider !== 'google') {
        throw new Error(`Provider ${model.provider} is not yet implemented. Please use a Google Gemini model for now.`);
    }
    
    const ai = new GoogleGenAI({ apiKey });
    
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
            model: model.id,
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
        console.error("Error generating summary:", error);
        throw new Error("Failed to generate meeting summary. Please check the console for details.");
    }
};

export { transcribeAudioWithProvider, generateMeetingSummaryWithProvider, getUserModel, getApiKey };