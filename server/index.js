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

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024
  }
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const hasGemini = !!process.env.GEMINI_API_KEY;
const hasOpenAI = !!process.env.OPENAI_API_KEY;
const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;

if (!hasGemini && !hasOpenAI && !hasAnthropic) {
  console.warn('⚠️  No server-side API keys configured - running in offline mode');
  console.log('Note: Users without API keys will get placeholder transcriptions.');
}

const geminiAI = hasGemini ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;
const openai = hasOpenAI ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
const anthropic = hasAnthropic ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }) : null;

function getProviderAndModel(modelId) {
  const model = modelId || 'gemini-2.5-flash';
  
  if (model.startsWith('gemini')) {
    return { provider: 'google', model, client: geminiAI };
  } else if (model.startsWith('gpt') || model.includes('chatgpt')) {
    return { provider: 'openai', model, client: openai };
  } else if (model.startsWith('claude')) {
    return { provider: 'anthropic', model, client: anthropic };
  }
  
  return { provider: 'google', model: 'gemini-2.5-flash', client: geminiAI };
}

function getClientForProvider(provider, userApiKeys) {
  if (!userApiKeys) {
    if (provider === 'google') return geminiAI;
    if (provider === 'openai') return openai;
    if (provider === 'anthropic') return anthropic;
    return null;
  }

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

  if (provider === 'google') return geminiAI;
  if (provider === 'openai') return openai;
  if (provider === 'anthropic') return anthropic;
  return null;
}

function generateOfflineTranscript(durationSeconds, chunkIndex = 0) {
  const segments = Math.max(1, Math.ceil(durationSeconds / 60));
  const lines = [];
  for (let i = 0; i < segments; i++) {
    const minutes = Math.floor(((chunkIndex * 59) + (i * 60)) / 60);
    const seconds = ((chunkIndex * 59) + (i * 60)) % 60;
    lines.push({
      speaker: `Speaker ${(i % 3) + 1}`,
      timestamp: `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
      text: `[Offline Mode] Audio segment ${i + 1}. Configure API keys for actual transcription.`
    });
  }
  return lines;
}

app.get('/', (req, res) => {
  res.json({
    name: 'AudioMax API Server',
    version: '1.0.0',
    status: 'running',
    offlineMode: !hasGemini && !hasOpenAI && !hasAnthropic,
    message: 'AudioMax backend API is running',
    endpoints: {
      health: '/api/health',
      transcribe: '/api/transcribe (POST)',
      generateSummary: '/api/generate-summary (POST)',
      translateSummary: '/api/translate-summary (POST)'
    }
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    offlineMode: !hasGemini && !hasOpenAI && !hasAnthropic,
    message: 'AudioMax API Server is running',
    timestamp: new Date().toISOString()
  });
});

app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const { chunkIndex, userId, modelId, apiKeys } = req.body;
    const userApiKeys = apiKeys ? JSON.parse(apiKeys) : null;
    const { provider, model } = getProviderAndModel(modelId);
    const client = getClientForProvider(provider, userApiKeys);
    
    if (!client) {
      const approximateDuration = 60;
      return res.json({
        success: true,
        transcript: generateOfflineTranscript(approximateDuration, parseInt(chunkIndex) || 0),
        chunkIndex: parseInt(chunkIndex) || 0,
        modelUsed: 'offline-mode',
        message: 'No AI API available - using offline placeholder transcription'
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
              text: 'Transcribe this audio accurately. Identify different speakers as "Speaker 1", "Speaker 2", etc. Include timestamps in MM:SS format for each segment.'
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
      const whisperResponse = await client.audio.transcriptions.create({
        file: new File([req.file.buffer], 'audio.wav', { type: mimeType }),
        model: 'whisper-1',
        response_format: 'verbose_json',
        timestamp_granularities: ['segment']
      });

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
      return res.status(501).json({ 
        error: 'Audio transcription not supported with Claude',
        message: 'Please use Google Gemini or OpenAI models for audio transcription'
      });
    }

    res.json({
      success: true,
      transcript,
      chunkIndex: parseInt(chunkIndex) || 0,
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

app.post('/api/generate-summary', async (req, res) => {
  try {
    const { transcript, userId, modelId, apiKeys } = req.body;

    if (!transcript || !Array.isArray(transcript)) {
      return res.status(400).json({ error: 'Invalid transcript provided' });
    }

    const userApiKeys = apiKeys || null;
    const { provider, model } = getProviderAndModel(modelId);
    const client = getClientForProvider(provider, userApiKeys);
    
    if (!client) {
      const speakers = [...new Set(transcript.map(t => t.speaker))];
      return res.json({
        success: true,
        summary: {
          executiveSummary: `[Offline Mode] This meeting has ${transcript.length} segments with ${speakers.length} speaker(s): ${speakers.join(', ')}. Configure AI API keys in Settings for detailed analysis.`,
          actionItems: [
            { item: "Review the full transcript", assignee: "Team" },
            { item: "Configure API keys for enhanced analysis", assignee: "Admin" }
          ],
          keyDecisions: [
            { decision: "Meeting recorded in offline mode", rationale: "No AI services configured" }
          ]
        },
        modelUsed: 'offline-mode'
      });
    }

    const summarySchema = {
      type: "OBJECT",
      properties: {
        executiveSummary: { type: "STRING", description: "A concise summary." },
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

    const transcriptText = transcript
      .map(line => `[${line.timestamp}] ${line.speaker}: ${line.text}`)
      .join('\n');

    const prompt = `Summarize this meeting transcript:\n\n${transcriptText}\n\nProvide: 1) Executive summary 2) Action items with assignees 3) Key decisions with rationale`;

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
          content: prompt
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

app.post('/api/translate-summary', async (req, res) => {
  try {
    const { summary, targetLanguage, modelId, apiKeys } = req.body;

    if (!summary || !targetLanguage) {
      return res.status(400).json({ error: 'Summary and target language are required' });
    }

    const userApiKeys = apiKeys || null;
    const { provider, model } = getProviderAndModel(modelId);
    const client = getClientForProvider(provider, userApiKeys);

    if (!client) {
      return res.json({
        success: true,
        summary: {
          executiveSummary: `[Translated to ${targetLanguage}] ${summary.executiveSummary}`,
          actionItems: summary.actionItems,
          keyDecisions: summary.keyDecisions
        },
        modelUsed: 'offline-mode'
      });
    }

    const prompt = `Translate the following meeting summary to ${targetLanguage}:\n\n${JSON.stringify(summary, null, 2)}`;

    let translatedSummary;

    if (provider === 'google') {
      const genModel = client.getGenerativeModel({ model: model });
      const result = await genModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          responseMimeType: "application/json",
          responseSchema: summarySchema || { type: "OBJECT" }
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
          content: prompt
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

app.listen(PORT, () => {
  console.log(`🚀 AudioMax API Server running on http://localhost:${PORT}`);
  if (hasGemini || hasOpenAI || hasAnthropic) {
    console.log(`✅ AI Providers: ${hasGemini ? 'Gemini' : ''} ${hasOpenAI ? 'OpenAI' : ''} ${hasAnthropic ? 'Anthropic' : ''}`.trim() || 'None');
  }
  console.log(`📡 Offline mode: ${!hasGemini && !hasOpenAI && !hasAnthropic}`);
});