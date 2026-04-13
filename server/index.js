import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Validate API keys
const hasGemini = !!process.env.GEMINI_API_KEY;
const hasOpenAI = !!process.env.OPENAI_API_KEY;
const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;

if (!hasGemini && !hasOpenAI && !hasAnthropic) {
  console.warn('⚠️  No server-side API keys configured in .env file');
  console.log('Users will need to provide their own API keys in the app settings.');
  console.log('To add server-side keys, edit your .env file:');
  console.log('- GEMINI_API_KEY (from https://ai.google.dev/)');
  console.log('- OPENAI_API_KEY (from https://platform.openai.com/)');
  console.log('- ANTHROPIC_API_KEY (from https://console.anthropic.com/)');
}

// Initialize AI clients
const geminiAI = hasGemini ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;
const openai = hasOpenAI ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
const anthropic = hasAnthropic ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }) : null;

console.log('🔑 Server-side API providers:');
if (hasGemini) console.log('  ✅ Google Gemini');
if (hasOpenAI) console.log('  ✅ OpenAI');
if (hasAnthropic) console.log('  ✅ Anthropic Claude');
if (!hasGemini && !hasOpenAI && !hasAnthropic) {
  console.log('  ℹ️  None (users must provide their own API keys)');
}

// Helper function to get AI provider and model
function getProviderAndModel(modelId) {
  const model = modelId || 'gemini-2.0-flash-exp';
  
  if (model.startsWith('gemini')) {
    return { provider: 'google', model, client: geminiAI };
  } else if (model.startsWith('gpt') || model.includes('chatgpt')) {
    return { provider: 'openai', model, client: openai };
  } else if (model.startsWith('claude')) {
    return { provider: 'anthropic', model, client: anthropic };
  }
  
  // Default to gemini if available
  return { provider: 'google', model: 'gemini-2.0-flash-exp', client: geminiAI };
}

// Helper function to get API client with user's key if provided
function getClientForProvider(provider, userApiKeys) {
  if (!userApiKeys) {
    // Use server-side API keys
    if (provider === 'google') return geminiAI;
    if (provider === 'openai') return openai;
    if (provider === 'anthropic') return anthropic;
    return null;
  }

  // Use user-provided API keys
  try {
    if (provider === 'google' && userApiKeys.google) {
      return new GoogleGenAI({ apiKey: userApiKeys.google });
    }
    if (provider === 'openai' && userApiKeys.openai) {
      return new OpenAI({ apiKey: userApiKeys.openai });
    }
    if (provider === 'anthropic' && userApiKeys.anthropic) {
      return new Anthropic({ apiKey: userApiKeys.anthropic });
    }
  } catch (error) {
    console.error(`Error creating client for ${provider}:`, error);
  }

  // Fallback to server-side keys
  if (provider === 'google') return geminiAI;
  if (provider === 'openai') return openai;
  if (provider === 'anthropic') return anthropic;
  return null;
}

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'AudioMax API Server',
    version: '1.0.0',
    status: 'running',
    message: 'AudioMax backend API is running. Access the app at http://localhost:5173',
    endpoints: {
      health: '/api/health',
      transcribe: '/api/transcribe (POST)',
      generateSummary: '/api/generate-summary (POST)',
      translateSummary: '/api/translate-summary (POST)'
    }
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    message: 'AudioMax API Server is running',
    timestamp: new Date().toISOString()
  });
});

// Transcribe audio endpoint
app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const { chunkIndex, userId, modelId, apiKeys } = req.body;
    const userApiKeys = apiKeys ? JSON.parse(apiKeys) : null;
    const { provider, model } = getProviderAndModel(modelId);
    const client = getClientForProvider(provider, userApiKeys);
    
    console.log(`🔍 DEBUG Transcribe Request:`, {
      chunkIndex,
      userId,
      modelId,
      userApiKeys: userApiKeys ? Object.keys(userApiKeys) : null,
      provider,
      model,
      clientAvailable: !!client
    });

    if (!client) {
      return res.status(503).json({ 
        error: `${provider} API not configured`,
        message: `Please add your ${provider.charAt(0).toUpperCase() + provider.slice(1)} API key in Settings`
      });
    }

    const audioBase64 = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype || 'audio/wav';

    let transcript;

    if (provider === 'google') {
      const transcriptSchema = {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            speaker: { type: "STRING", description: "The identified speaker. E.g., 'Speaker 1'." },
            timestamp: { type: "STRING", description: "The timestamp of the speech in MM:SS format." },
            text: { type: "STRING", description: "The transcribed text for this segment." }
          },
          required: ["speaker", "timestamp", "text"]
        }
      };

      const genModel = client.getGenerativeModel({ model: model });
      const result = await genModel.generateContent({
        contents: [{
          role: 'user',
          parts: [
            {
              text: 'Transcribe this audio accurately. Identify different speakers as "Speaker 1", "Speaker 2", etc. Include timestamps in MM:SS format for each segment. Return the result as a structured array.'
            },
            {
              inlineData: {
                mimeType,
                data: audioBase64
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json",
          responseSchema: transcriptSchema
        }
      });

      const response = await result.response;
      transcript = JSON.parse(response.text());
    } else if (provider === 'openai') {
      // OpenAI Whisper doesn't support structured output, so we'll use GPT-4 for formatting
      const whisperResponse = await client.audio.transcriptions.create({
        file: new File([req.file.buffer], 'audio.wav', { type: mimeType }),
        model: 'whisper-1',
        response_format: 'verbose_json',
        timestamp_granularities: ['segment']
      });

      // Format with GPT to add speaker identification
      const formatResponse = await client.chat.completions.create({
        model: model === 'gpt-4o-agent' ? 'gpt-4o' : model,
        messages: [{
          role: 'user',
          content: `Format this transcription with speaker identification. Add timestamps in MM:SS format:\n\n${JSON.stringify(whisperResponse)}\n\nReturn as JSON array with format: [{"speaker": "Speaker 1", "timestamp": "00:00", "text": "..."}]`
        }],
        response_format: { type: 'json_object' }
      });

      const formatted = JSON.parse(formatResponse.choices[0].message.content);
      transcript = formatted.transcript || formatted;
    } else if (provider === 'anthropic') {
      // Claude doesn't support audio input directly, return error for now
      return res.status(501).json({ 
        error: 'Audio transcription not supported with Claude',
        message: 'Please use Google Gemini or OpenAI models for audio transcription'
      });
    }

    res.json({
      success: true,
      transcript,
      chunkIndex: chunkIndex || 0,
      modelUsed: `${provider}/${model}`
    });

  } catch (error) {
    console.error('Transcription error:', error);
    res.status(500).json({ 
      error: 'Transcription failed',
      message: error.message,
      details: error.toString()
    });
  }
});

// Generate meeting summary endpoint
app.post('/api/generate-summary', async (req, res) => {
  try {
    const { transcript, userId, modelId, apiKeys } = req.body;

    if (!transcript || !Array.isArray(transcript)) {
      return res.status(400).json({ error: 'Invalid transcript provided' });
    }

    const userApiKeys = apiKeys || null;
    const { provider, model } = getProviderAndModel(modelId);
    const client = getClientForProvider(provider, userApiKeys);
    
    console.log(`Generating summary for user ${userId || 'anonymous'} using ${provider}/${model}`);

    if (!client) {
      return res.status(503).json({ 
        error: `${provider} API not configured`,
        message: `Please add your ${provider.charAt(0).toUpperCase() + provider.slice(1)} API key in Settings`
      });
    }

    const summarySchema = {
      type: "OBJECT",
      properties: {
        executiveSummary: {
          type: "STRING",
          description: "A concise, professional summary of the entire meeting conversation."
        },
        actionItems: {
          type: "ARRAY",
          description: "A list of all explicit action items mentioned.",
          items: {
            type: "OBJECT",
            properties: {
              item: { type: "STRING", description: "The specific task or action to be completed." },
              assignee: { type: "STRING", description: "The person or team assigned to the action item." }
            },
            required: ["item", "assignee"]
          }
        },
        keyDecisions: {
          type: "ARRAY",
          description: "A detailed list of all key decisions made.",
          items: {
            type: "OBJECT",
            properties: {
              decision: { type: "STRING", description: "The specific decision that was made." },
              rationale: { type: "STRING", description: "The reasoning or justification for the decision." }
            },
            required: ["decision"]
          }
        }
      },
      required: ["executiveSummary", "actionItems", "keyDecisions"]
    };

    const transcriptText = transcript
      .map(line => `[${line.timestamp}] ${line.speaker}: ${line.text}`)
      .join('\n');

    const prompt = `Analyze the following meeting transcript and provide a comprehensive summary:\n\n${transcriptText}\n\nProvide:\n1. An executive summary\n2. All action items with assignees\n3. All key decisions with rationale`;

    let summary;

    if (provider === 'google') {
      const genModel = client.getGenerativeModel({ model: model });
      const result = await genModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          responseMimeType: "application/json",
          responseSchema: summarySchema
        }
      });
      const response = await result.response;
      summary = JSON.parse(response.text());
    } else if (provider === 'openai') {
      const result = await client.chat.completions.create({
        model: model === 'gpt-4o-agent' ? 'gpt-4o' : model,
        messages: [{
          role: 'user',
          content: prompt
        }],
        response_format: { type: 'json_object' },
        temperature: 0.3
      });
      summary = JSON.parse(result.choices[0].message.content);
    } else if (provider === 'anthropic') {
      const result = await client.messages.create({
        model: model,
        max_tokens: 4096,
        temperature: 0.3,
        messages: [{
          role: 'user',
          content: prompt + '\n\nRespond ONLY with valid JSON matching this schema: ' + JSON.stringify(summarySchema)
        }]
      });
      summary = JSON.parse(result.content[0].text);
    }
    
    res.json({
      success: true,
      summary,
      modelUsed: `${provider}/${model}`
    });

  } catch (error) {
    console.error('Summary generation error:', error);
    res.status(500).json({ 
      error: 'Summary generation failed',
      message: error.message,
      details: error.toString()
    });
  }
});

// Translate summary endpoint
app.post('/api/translate-summary', async (req, res) => {
  try {
    const { summary, targetLanguage, modelId, apiKeys } = req.body;

    if (!summary || !targetLanguage) {
      return res.status(400).json({ error: 'Summary and target language are required' });
    }

    const userApiKeys = apiKeys || null;
    const { provider, model } = getProviderAndModel(modelId);
    const client = getClientForProvider(provider, userApiKeys);
    
    console.log(`Translating summary to ${targetLanguage} using ${provider}/${model}`);

    if (!client) {
      return res.status(503).json({ 
        error: `${provider} API not configured`,
        message: `Please add your ${provider.charAt(0).toUpperCase() + provider.slice(1)} API key in Settings`
      });
    }

    const summarySchema = {
      type: "OBJECT",
      properties: {
        executiveSummary: { type: "STRING" },
        actionItems: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              item: { type: "STRING" },
              assignee: { type: "STRING" }
            },
            required: ["item", "assignee"]
          }
        },
        keyDecisions: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              decision: { type: "STRING" },
              rationale: { type: "STRING" }
            },
            required: ["decision"]
          }
        }
      },
      required: ["executiveSummary", "actionItems", "keyDecisions"]
    };

    const prompt = `Translate the following meeting summary to ${targetLanguage}. Maintain the same structure and formatting:\n\n${JSON.stringify(summary, null, 2)}`;

    let translatedSummary;

    if (provider === 'google') {
      const genModel = client.getGenerativeModel({ model: model });
      const result = await genModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          responseMimeType: "application/json",
          responseSchema: summarySchema
        }
      });
      const response = await result.response;
      translatedSummary = JSON.parse(response.text());
    } else if (provider === 'openai') {
      const result = await client.chat.completions.create({
        model: model === 'gpt-4o-agent' ? 'gpt-4o' : model,
        messages: [{
          role: 'user',
          content: prompt
        }],
        response_format: { type: 'json_object' },
        temperature: 0.3
      });
      translatedSummary = JSON.parse(result.choices[0].message.content);
    } else if (provider === 'anthropic') {
      const result = await client.messages.create({
        model: model,
        max_tokens: 4096,
        temperature: 0.3,
        messages: [{
          role: 'user',
          content: prompt + '\n\nRespond ONLY with valid JSON.'
        }]
      });
      translatedSummary = JSON.parse(result.content[0].text);
    }
    
    res.json({
      success: true,
      summary: translatedSummary,
      modelUsed: `${provider}/${model}`
    });

  } catch (error) {
    console.error('Translation error:', error);
    res.status(500).json({ 
      error: 'Translation failed',
      message: error.message,
      details: error.toString()
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 AudioMax API Server running on http://localhost:${PORT}`);
  console.log(`✅ Gemini API Key configured`);
  console.log(`📡 Ready to accept requests`);
});
