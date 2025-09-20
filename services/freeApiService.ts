// Free API Key Management Service
// Provides free Gemini AI access for AudioMax users with usage limits

interface ApiKeyPool {
  keys: string[];
  currentIndex: number;
  lastRotation: number;
  dailyUsage: { [key: string]: number };
}

interface UserApiUsage {
  userId: string;
  dailyUsage: number;
  weeklyUsage: number;
  lastUsed: number;
  tier: 'free' | 'premium';
}

class FreeApiKeyService {
  private apiKeyPool: ApiKeyPool;
  private userUsage: Map<string, UserApiUsage> = new Map();
  
  // Free API keys pool - These are demo keys, replace with your actual free tier keys
  // You can get free keys from: https://ai.google.dev/
  private readonly FREE_API_KEYS = [
    // Demo key 1 - Replace with actual Gemini API key
    'AIzaSyBdemokey1_replacewithactualgeminikey_123456789',
    // Demo key 2 - Add multiple keys for better distribution
    'AIzaSyBdemokey2_replacewithactualgeminikey_987654321',
    // Demo key 3 - Rotate between multiple keys for higher limits
    'AIzaSyBdemokey3_replacewithactualgeminikey_abcdef123',
    // Add more keys as needed
  ];

  // Usage limits for free tier
  private readonly FREE_LIMITS = {
    DAILY_REQUESTS: 10,      // 10 transcriptions per day
    WEEKLY_REQUESTS: 50,     // 50 transcriptions per week
    MAX_AUDIO_DURATION: 300, // 5 minutes max audio length
    RATE_LIMIT_MINUTES: 5,   // 5 minutes between requests
  };

  constructor() {
    this.apiKeyPool = {
      keys: this.FREE_API_KEYS,
      currentIndex: 0,
      lastRotation: Date.now(),
      dailyUsage: {}
    };
    
    this.initializeDailyReset();
  }

  /**
   * Get a free API key for a user
   */
  async getFreeApiKey(userId: string): Promise<{ apiKey: string; canUse: boolean; message: string }> {
    const userUsage = this.getUserUsage(userId);
    
    // Check if user has exceeded free limits
    const limitCheck = this.checkUsageLimits(userUsage);
    if (!limitCheck.canUse) {
      return {
        apiKey: '',
        canUse: false,
        message: limitCheck.message
      };
    }

    // Get next available API key from pool
    const apiKey = this.getNextApiKey();
    
    // Update user usage
    this.updateUserUsage(userId);
    
    return {
      apiKey,
      canUse: true,
      message: `Free API access granted. ${this.FREE_LIMITS.DAILY_REQUESTS - userUsage.dailyUsage - 1} requests remaining today.`
    };
  }

  /**
   * Check if user can use free API based on limits
   */
  private checkUsageLimits(userUsage: UserApiUsage): { canUse: boolean; message: string } {
    const now = Date.now();
    
    // Check rate limiting (5 minutes between requests)
    if (now - userUsage.lastUsed < this.FREE_LIMITS.RATE_LIMIT_MINUTES * 60 * 1000) {
      const waitTime = Math.ceil((this.FREE_LIMITS.RATE_LIMIT_MINUTES * 60 * 1000 - (now - userUsage.lastUsed)) / 60000);
      return {
        canUse: false,
        message: `Rate limit exceeded. Please wait ${waitTime} minutes before your next transcription.`
      };
    }

    // Check daily limit
    if (userUsage.dailyUsage >= this.FREE_LIMITS.DAILY_REQUESTS) {
      return {
        canUse: false,
        message: `Daily limit of ${this.FREE_LIMITS.DAILY_REQUESTS} transcriptions reached. Upgrade to premium for unlimited access.`
      };
    }

    // Check weekly limit
    if (userUsage.weeklyUsage >= this.FREE_LIMITS.WEEKLY_REQUESTS) {
      return {
        canUse: false,
        message: `Weekly limit of ${this.FREE_LIMITS.WEEKLY_REQUESTS} transcriptions reached. Upgrade to premium for unlimited access.`
      };
    }

    return { canUse: true, message: 'API access available' };
  }

  /**
   * Get user's current usage stats
   */
  private getUserUsage(userId: string): UserApiUsage {
    if (!this.userUsage.has(userId)) {
      this.userUsage.set(userId, {
        userId,
        dailyUsage: 0,
        weeklyUsage: 0,
        lastUsed: 0,
        tier: 'free'
      });
    }
    return this.userUsage.get(userId)!;
  }

  /**
   * Update user usage after API call
   */
  private updateUserUsage(userId: string): void {
    const usage = this.getUserUsage(userId);
    usage.dailyUsage += 1;
    usage.weeklyUsage += 1;
    usage.lastUsed = Date.now();
    this.userUsage.set(userId, usage);
  }

  /**
   * Get next API key from the pool (round-robin)
   */
  private getNextApiKey(): string {
    const apiKey = this.apiKeyPool.keys[this.apiKeyPool.currentIndex];
    this.apiKeyPool.currentIndex = (this.apiKeyPool.currentIndex + 1) % this.apiKeyPool.keys.length;
    return apiKey;
  }

  /**
   * Reset daily usage counters
   */
  private initializeDailyReset(): void {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const msUntilMidnight = tomorrow.getTime() - now.getTime();
    
    setTimeout(() => {
      this.resetDailyUsage();
      // Set up daily reset interval
      setInterval(() => this.resetDailyUsage(), 24 * 60 * 60 * 1000);
    }, msUntilMidnight);

    // Weekly reset (every Sunday at midnight)
    const nextSunday = new Date(now);
    nextSunday.setDate(now.getDate() + (7 - now.getDay()));
    nextSunday.setHours(0, 0, 0, 0);
    
    const msUntilSunday = nextSunday.getTime() - now.getTime();
    
    setTimeout(() => {
      this.resetWeeklyUsage();
      // Set up weekly reset interval
      setInterval(() => this.resetWeeklyUsage(), 7 * 24 * 60 * 60 * 1000);
    }, msUntilSunday);
  }

  /**
   * Reset daily usage for all users
   */
  private resetDailyUsage(): void {
    for (const [userId, usage] of this.userUsage.entries()) {
      usage.dailyUsage = 0;
      this.userUsage.set(userId, usage);
    }
    console.log('Daily API usage reset completed');
  }

  /**
   * Reset weekly usage for all users
   */
  private resetWeeklyUsage(): void {
    for (const [userId, usage] of this.userUsage.entries()) {
      usage.weeklyUsage = 0;
      this.userUsage.set(userId, usage);
    }
    console.log('Weekly API usage reset completed');
  }

  /**
   * Get user's remaining free usage
   */
  getUserLimits(userId: string): {
    dailyRemaining: number;
    weeklyRemaining: number;
    nextResetTime: number;
    upgradeAvailable: boolean;
  } {
    const usage = this.getUserUsage(userId);
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    return {
      dailyRemaining: Math.max(0, this.FREE_LIMITS.DAILY_REQUESTS - usage.dailyUsage),
      weeklyRemaining: Math.max(0, this.FREE_LIMITS.WEEKLY_REQUESTS - usage.weeklyUsage),
      nextResetTime: tomorrow.getTime(),
      upgradeAvailable: true
    };
  }

  /**
   * Validate audio duration for free tier
   */
  validateAudioDuration(durationSeconds: number): { valid: boolean; message: string } {
    if (durationSeconds > this.FREE_LIMITS.MAX_AUDIO_DURATION) {
      return {
        valid: false,
        message: `Audio too long. Free tier supports up to ${this.FREE_LIMITS.MAX_AUDIO_DURATION / 60} minutes. Please trim your audio or upgrade to premium.`
      };
    }
    return { valid: true, message: 'Audio duration valid' };
  }
}

// Export singleton instance
export const freeApiKeyService = new FreeApiKeyService();
export default freeApiKeyService;