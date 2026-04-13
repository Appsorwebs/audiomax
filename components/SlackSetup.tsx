import React, { useState, useEffect } from 'react';
import { slackService } from '../services/slackService';

interface SlackSetupProps {
  onConfigured?: () => void;
  onClose?: () => void;
}

const SlackSetup: React.FC<SlackSetupProps> = ({ onConfigured, onClose }) => {
  const [setupMethod, setSetupMethod] = useState<'webhook' | 'oauth'>('webhook');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [channelId, setChannelId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [status, setStatus] = useState(slackService.getStatus());

  useEffect(() => {
    slackService.loadConfig();
    setStatus(slackService.getStatus());
  }, []);

  const handleWebhookSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!webhookUrl.trim()) {
      setError('Please enter a webhook URL');
      setLoading(false);
      return;
    }

    try {
      // Validate webhook URL format
      const url = new URL(webhookUrl);
      if (!url.hostname.includes('hooks.slack.com')) {
        setError('Invalid Slack webhook URL. Should be from hooks.slack.com');
        setLoading(false);
        return;
      }

      slackService.initWebhook(webhookUrl, channelId || undefined);
      setSuccess(true);
      setStatus(slackService.getStatus());

      setTimeout(() => {
        setSuccess(false);
        onConfigured?.();
      }, 2000);
    } catch (err) {
      setError('Invalid webhook URL format');
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setError(null);

    try {
      const success = await slackService.testConnection();
      if (success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError('Connection test failed. Check your webhook URL and channel.');
      }
    } catch (err) {
      setError('Error testing connection');
    } finally {
      setTestingConnection(false);
    }
  };

  const handleDisconnect = () => {
    if (confirm('Are you sure you want to disconnect Slack?')) {
      slackService.clearConfig();
      setStatus(slackService.getStatus());
      setWebhookUrl('');
      setChannelId('');
      setError(null);
      setSuccess(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <span>🎯</span>
            Slack Notifications Setup
          </h2>
          <p className="text-purple-100 text-sm mt-1">
            Automatically share meeting summaries to your Slack workspace
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Status Card */}
          {status.enabled && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <p className="text-green-700 dark:text-green-400 font-medium flex items-center gap-2">
                <span>✅</span>
                {status.configType === 'webhook'
                  ? 'Webhook configuration active'
                  : 'OAuth connection active'}
              </p>
              <p className="text-sm text-green-600 dark:text-green-500 mt-1">
                {status.channelId ? `Posting to: ${status.channelId}` : 'Ready to send notifications'}
              </p>
            </div>
          )}

          {/* Setup Method Selection */}
          <div className="mb-6">
            <p className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
              Setup Method
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setSetupMethod('webhook')}
                className={`p-3 rounded-lg border-2 transition ${
                  setupMethod === 'webhook'
                    ? 'bg-purple-500/10 border-purple-500 dark:border-purple-400'
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-purple-500/50'
                }`}
              >
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  🔗 Webhook (Easy)
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  No app approval needed
                </p>
              </button>
              <button
                onClick={() => setSetupMethod('oauth')}
                className={`p-3 rounded-lg border-2 transition ${
                  setupMethod === 'oauth'
                    ? 'bg-purple-500/10 border-purple-500 dark:border-purple-400'
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-purple-500/50'
                }`}
              >
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  🔐 OAuth (Advanced)
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Full app integration
                </p>
              </button>
            </div>
          </div>

          {/* Webhook Setup */}
          {setupMethod === 'webhook' && (
            <form onSubmit={handleWebhookSetup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                  Slack Webhook URL
                </label>
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://hooks.slack.com/services/..."
                  className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                  Create a webhook at{' '}
                  <a
                    href="https://api.slack.com/apps"
                    target="_blank"
                    rel="noreferrer"
                    className="text-purple-600 dark:text-purple-400 hover:underline"
                  >
                    api.slack.com/apps
                  </a>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                  Default Channel (Optional)
                </label>
                <input
                  type="text"
                  value={channelId}
                  onChange={(e) => setChannelId(e.target.value)}
                  placeholder="#general or C0123456789"
                  className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                  Channel where messages will be posted
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-600 dark:text-red-400">
                  {error}
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-sm text-green-600 dark:text-green-400">
                  ✅ Configuration saved successfully!
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Configuration'}
                </button>
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={!webhookUrl || testingConnection}
                  className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white font-medium rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition disabled:opacity-50"
                >
                  {testingConnection ? 'Testing...' : 'Test Connection'}
                </button>
              </div>
            </form>
          )}

          {/* OAuth Setup Info */}
          {setupMethod === 'oauth' && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-2">
                  📋 OAuth Setup Instructions:
                </p>
                <ol className="text-xs text-blue-600 dark:text-blue-500 space-y-2 list-decimal list-inside">
                  <li>Go to https://api.slack.com/apps and create a new app</li>
                  <li>Navigate to OAuth & Permissions</li>
                  <li>Add bot scopes: chat:write, channels:read</li>
                  <li>Install the app to your workspace</li>
                  <li>Copy the Bot User OAuth Token</li>
                  <li>Paste the token below</li>
                </ol>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                  Bot User OAuth Token
                </label>
                <input
                  type="password"
                  placeholder="xoxb-..."
                  className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <button
                disabled={true}
                className="w-full px-4 py-2 bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-400 font-medium rounded-lg cursor-not-allowed"
              >
                Coming Soon: OAuth Setup
              </button>
            </div>
          )}

          {/* Disconnect Option */}
          {status.enabled && (
            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={handleDisconnect}
                className="text-red-600 dark:text-red-400 text-sm font-medium hover:underline"
              >
                Disconnect Slack
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-100 dark:bg-slate-800 px-6 py-4 border-t border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-600 dark:text-slate-400">
            💡 After this recording completes, you'll get a Slack notification with the summary,
            key decisions, and action items.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SlackSetup;
