import { describe, expect, it } from 'vitest';
import { getApiKey } from '../services/aiService';
import { User } from '../types';

const baseUser: User = {
  email: 'tester@example.com',
  subscription: 'Free',
  meetings: []
};

describe('aiService getApiKey', () => {
  it('prefers user settings key when available', () => {
    const user: User = {
      ...baseUser,
      settings: {
        selectedModel: 'gemini-2.5-flash',
        apiKeys: {
          google: 'settings-key'
        }
      }
    };

    const key = getApiKey(user, 'google');
    expect(key).toBe('settings-key');
  });

  it('falls back to localStorage key when settings key is missing', () => {
    localStorage.setItem('user_api_key', 'local-storage-key');
    const key = getApiKey(baseUser, 'google');
    expect(key).toBe('local-storage-key');
    localStorage.removeItem('user_api_key');
  });

  it('returns null for unsupported providers without configured keys', () => {
    const key = getApiKey(baseUser, 'anthropic');
    expect(key).toBeNull();
  });
});
