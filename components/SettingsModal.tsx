import React, { useState } from 'react';
import { User, UserSettings, AIModel } from '../types';
import { AVAILABLE_AI_MODELS, DEFAULT_MODEL } from '../constants';

interface SettingsModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: UserSettings) => void;
}

const ProviderSection: React.FC<{
  title: string;
  provider: string;
  apiKey: string;
  onChange: (value: string) => void;
  placeholder: string;
}> = ({ title, provider, apiKey, onChange, placeholder }) => (
  <div className="space-y-3">
    <h4 className="font-semibold text-slate-800 dark:text-slate-200">{title}</h4>
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-600 dark:text-slate-400">
        API Key
      </label>
      <input
        type="password"
        value={apiKey}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-sky-500 focus:border-sky-500"
      />
      <p className="text-xs text-slate-500 dark:text-slate-400">
        {provider === 'google' && 'Get your key from Google AI Studio: https://makersuite.google.com/app/apikey'}
        {provider === 'anthropic' && 'Get your key from Anthropic Console: https://console.anthropic.com/'}
        {provider === 'openai' && 'Get your key from OpenAI Platform: https://platform.openai.com/api-keys'}
      </p>
    </div>
  </div>
);

const ModelCard: React.FC<{
  model: AIModel;
  isSelected: boolean;
  onSelect: () => void;
  hasApiKey: boolean;
}> = ({ model, isSelected, onSelect, hasApiKey }) => (
  <button
    onClick={onSelect}
    disabled={!hasApiKey}
    className={`w-full p-4 text-left rounded-lg border transition-all ${
      isSelected 
        ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/20' 
        : hasApiKey
          ? 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
          : 'border-slate-200 dark:border-slate-700 opacity-50 cursor-not-allowed'
    }`}
  >
    <div className="flex justify-between items-start mb-2">
      <h5 className="font-semibold text-slate-800 dark:text-slate-200">{model.name}</h5>
      <span className={`text-xs px-2 py-1 rounded-full ${
        model.costLevel === 'low' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
        model.costLevel === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      }`}>
        {model.costLevel === 'low' ? 'Cost-effective' : model.costLevel === 'medium' ? 'Moderate' : 'Premium'}
      </span>
    </div>
    <p className="text-sm text-slate-600 dark:text-slate-400">{model.description}</p>
    {!hasApiKey && (
      <p className="text-xs text-red-500 dark:text-red-400 mt-2">
        API key required for {model.provider.charAt(0).toUpperCase() + model.provider.slice(1)}
      </p>
    )}
  </button>
);

const SettingsModal: React.FC<SettingsModalProps> = ({ user, isOpen, onClose, onSave }) => {
  const currentSettings = user.settings || { selectedModel: DEFAULT_MODEL, apiKeys: {} };
  const [selectedModel, setSelectedModel] = useState(currentSettings.selectedModel);
  const [apiKeys, setApiKeys] = useState(currentSettings.apiKeys);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({
      selectedModel,
      apiKeys
    });
    onClose();
  };

  const updateApiKey = (provider: keyof typeof apiKeys, value: string) => {
    setApiKeys(prev => ({ ...prev, [provider]: value }));
  };

  const getModelsForProvider = (provider: string) => 
    AVAILABLE_AI_MODELS.filter(model => model.provider === provider);

  const hasApiKeyForProvider = (provider: string): boolean => {
    const key = apiKeys[provider as keyof typeof apiKeys];
    return Boolean(key && key.trim().length > 0);
  };

  return (
    <div className="fixed inset-0 bg-slate-900 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">AI Settings</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
          >
            <span className="sr-only">Close</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* API Keys Section */}
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">API Keys</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
              Configure your API keys to use different AI providers. Your keys are stored locally and never sent to our servers.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <ProviderSection
                title="Google Gemini"
                provider="google"
                apiKey={apiKeys.google || ''}
                onChange={(value) => updateApiKey('google', value)}
                placeholder="AIzaSy..."
              />
              
              <ProviderSection
                title="Anthropic Claude"
                provider="anthropic"
                apiKey={apiKeys.anthropic || ''}
                onChange={(value) => updateApiKey('anthropic', value)}
                placeholder="sk-ant..."
              />
              
              <ProviderSection
                title="OpenAI ChatGPT"
                provider="openai"
                apiKey={apiKeys.openai || ''}
                onChange={(value) => updateApiKey('openai', value)}
                placeholder="sk-..."
              />
            </div>
          </div>

          {/* Model Selection */}
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">AI Model Selection</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
              Choose the AI model for transcription and summarization. Models require their respective API keys.
            </p>

            {/* Google Models */}
            <div className="mb-6">
              <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">Google Gemini Series</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {getModelsForProvider('google').map(model => (
                  <ModelCard
                    key={model.id}
                    model={model}
                    isSelected={selectedModel === model.id}
                    onSelect={() => setSelectedModel(model.id)}
                    hasApiKey={hasApiKeyForProvider('google')}
                  />
                ))}
              </div>
            </div>

            {/* Anthropic Models */}
            <div className="mb-6">
              <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">Anthropic Claude Series</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {getModelsForProvider('anthropic').map(model => (
                  <ModelCard
                    key={model.id}
                    model={model}
                    isSelected={selectedModel === model.id}
                    onSelect={() => setSelectedModel(model.id)}
                    hasApiKey={hasApiKeyForProvider('anthropic')}
                  />
                ))}
              </div>
            </div>

            {/* OpenAI Models */}
            <div className="mb-6">
              <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">OpenAI ChatGPT Series</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {getModelsForProvider('openai').map(model => (
                  <ModelCard
                    key={model.id}
                    model={model}
                    isSelected={selectedModel === model.id}
                    onSelect={() => setSelectedModel(model.id)}
                    hasApiKey={hasApiKeyForProvider('openai')}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-md transition-colors"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;