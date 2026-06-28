import React, { useState } from 'react';

interface ApiKeySetupProps {
  onApiKeySet: () => void;
}

const ApiKeySetup: React.FC<ApiKeySetupProps> = ({ onApiKeySet }) => {
  const [apiKey, setApiKey] = useState('');
  const [isValid, setIsValid] = useState(false);

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const key = e.target.value.trim();
    setApiKey(key);
    // Basic validation for Gemini API key format
    setIsValid(key.startsWith('AIzaSy') && key.length > 30);
  };

  const handleSaveApiKey = () => {
    if (isValid) {
      localStorage.setItem('user_api_key', apiKey);
      localStorage.removeItem('demo_mode');
      onApiKeySet();
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8 m-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          🔑 Add Your Gemini API Key
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          AudioMax needs a Gemini API key to transcribe your audio files.
        </p>
      </div>

      <div className="space-y-6">
        {/* Option 1: Add your own API key */}
        <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">
            ✨ Use Your API Key
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Get a Gemini API key from Google AI Studio and paste it here to enable transcription.
          </p>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Gemini API Key
              </label>
              <input
                type="text"
                value={apiKey}
                onChange={handleApiKeyChange}
                placeholder="AIzaSy..."
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              />
              {apiKey && !isValid && (
                <p className="text-red-500 text-sm mt-1">Please enter a valid Gemini API key</p>
              )}
            </div>
            
            <button
              onClick={handleSaveApiKey}
              disabled={!isValid}
              className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
                isValid
                  ? 'bg-sky-500 hover:bg-sky-600 text-white'
                  : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              }`}
            >
              Save API Key & Continue
            </button>
          </div>

          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>📋 Step-by-step instructions:</strong>
            </p>
            <ol className="text-sm text-blue-600 dark:text-blue-400 mt-1 ml-4 list-decimal space-y-1">
              <li>Visit <a href="https://ai.google.dev/" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-500 font-medium">ai.google.dev</a></li>
              <li>Click "Get API key in Google AI Studio"</li>
              <li>Sign in with your Google account</li>
              <li>Click "Create API key" → "Create API key in new project"</li>
              <li>Copy the key (starts with "AIzaSy...")</li>
              <li>Paste it in the field above and click "Save"</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiKeySetup;