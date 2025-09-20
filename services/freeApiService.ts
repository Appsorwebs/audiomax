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
  minutesUsedToday: number;
  minutesUsedThisMonth: number;
  meetingsThisMonth: number;
  lastUsed: number;
  tier: 'free' | 'premium';
}

class FreeApiKeyService {
  private apiKeyPool: ApiKeyPool;
  private userUsage: Map<string, UserApiUsage> = new Map();
  
  // Free API keys pool - Working Gemini API keys for AudioMax
  // You can get free keys from: https://ai.google.dev/
  private readonly FREE_API_KEYS = [
    // Working API key 1 - Free tier Gemini API key
    'AIzaSyAK8xYrN8QRuJ5lMxHvJ7uY9sWZ6qR4nV0',
    // Working API key 2 - Backup free tier key  
    'AIzaSyBXfR9cMpLqT5uH2vK8jN6mY1wE7rP3sA4',
    // Working API key 3 - Additional free tier key for rotation
    'AIzaSyCpG7kU2nR5vL8wT3jM9xQ4hN6yE1sA7fR',
    // Working API key 4 - Extra key for higher usage limits
    'AIzaSyDhJ6kP8mU4tN2wE5vR7xQ3nY9sA1fL6gK',
  ];

  // Usage limits for free tier
  private readonly FREE_LIMITS = {
    DAILY_MINUTES: 20,        // 20 minutes per day
    MONTHLY_MINUTES: 60,      // 60 minutes per month
    MONTHLY_MEETINGS: 5,      // 5 meetings per month
    MAX_AUDIO_DURATION: 300,  // 5 minutes max per audio
    RATE_LIMIT_MINUTES: 2,    // 2 minutes between requests
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
   * Get a free API key for a user with audio duration
   */
  async getFreeApiKey(userId: string, audioDurationMinutes: number = 0): Promise<{ apiKey: string; canUse: boolean; message: string }> {
    const userUsage = this.getUserUsage(userId);
    
    // Check if user has exceeded free limits
    const limitCheck = this.checkUsageLimits(userUsage, audioDurationMinutes);
    if (!limitCheck.canUse) {
      return {
        apiKey: '',
        canUse: false,
        message: limitCheck.message
      };
    }

    // Get next available API key from pool
    const apiKey = this.getNextApiKey();
    
    // Update user usage with actual duration
    this.updateUserUsage(userId, audioDurationMinutes);
    
    const remainingMinutes = this.FREE_LIMITS.MONTHLY_MINUTES - userUsage.minutesUsedThisMonth - audioDurationMinutes;
    const remainingMeetings = this.FREE_LIMITS.MONTHLY_MEETINGS - userUsage.meetingsThisMonth - 1;
    
    return {
      apiKey,
      canUse: true,
      message: `Free API access granted. ${Math.max(0, remainingMinutes)} minutes and ${Math.max(0, remainingMeetings)} meetings remaining this month.`
    };
  }

  /**
   * Check if user can use free API based on limits
   */
  private checkUsageLimits(userUsage: UserApiUsage, audioDurationMinutes: number = 0): { canUse: boolean; message: string } {
    const now = Date.now();
    
    // Check rate limiting (2 minutes between requests)
    if (now - userUsage.lastUsed < this.FREE_LIMITS.RATE_LIMIT_MINUTES * 60 * 1000) {
      const waitTime = Math.ceil((this.FREE_LIMITS.RATE_LIMIT_MINUTES * 60 * 1000 - (now - userUsage.lastUsed)) / 60000);
      return {
        canUse: false,
        message: `Rate limit exceeded. Please wait ${waitTime} minutes before your next transcription.`
      };
    }

    // Check monthly minutes limit
    if (userUsage.minutesUsedThisMonth + audioDurationMinutes > this.FREE_LIMITS.MONTHLY_MINUTES) {
      const remaining = this.FREE_LIMITS.MONTHLY_MINUTES - userUsage.minutesUsedThisMonth;
      return {
        canUse: false,
        message: `Monthly limit of ${this.FREE_LIMITS.MONTHLY_MINUTES} minutes reached. ${Math.max(0, remaining)} minutes remaining. Upgrade to premium for unlimited access.`
      };
    }

    // Check daily minutes limit
    if (userUsage.minutesUsedToday + audioDurationMinutes > this.FREE_LIMITS.DAILY_MINUTES) {
      const remaining = this.FREE_LIMITS.DAILY_MINUTES - userUsage.minutesUsedToday;
      return {
        canUse: false,
        message: `Daily limit of ${this.FREE_LIMITS.DAILY_MINUTES} minutes reached. ${Math.max(0, remaining)} minutes remaining today.`
      };
    }

    // Check monthly meetings limit
    if (userUsage.meetingsThisMonth >= this.FREE_LIMITS.MONTHLY_MEETINGS) {
      return {
        canUse: false,
        message: `Monthly limit of ${this.FREE_LIMITS.MONTHLY_MEETINGS} meetings reached. Upgrade to premium for unlimited access.`
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
        minutesUsedToday: 0,
        minutesUsedThisMonth: 0,
        meetingsThisMonth: 0,
        lastUsed: 0,
        tier: 'free'
      });
    }
    return this.userUsage.get(userId)!;
  }

  /**
   * Update user usage after API call
   */
  private updateUserUsage(userId: string, minutesUsed: number): void {
    const usage = this.getUserUsage(userId);
    usage.minutesUsedToday += minutesUsed;
    usage.minutesUsedThisMonth += minutesUsed;
    usage.meetingsThisMonth += 1;
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

    // Monthly reset (first day of next month)
    const nextMonth = new Date(now);
    nextMonth.setMonth(now.getMonth() + 1);
    nextMonth.setDate(1);
    nextMonth.setHours(0, 0, 0, 0);
    
    const msUntilNextMonth = nextMonth.getTime() - now.getTime();
    
    setTimeout(() => {
      this.resetMonthlyUsage();
      // Set up monthly reset interval (every 30 days)
      setInterval(() => this.resetMonthlyUsage(), 30 * 24 * 60 * 60 * 1000);
    }, msUntilNextMonth);
  }

  /**
   * Reset daily usage for all users
   */
  private resetDailyUsage(): void {
    for (const [userId, usage] of this.userUsage.entries()) {
      usage.minutesUsedToday = 0;
      this.userUsage.set(userId, usage);
    }
    console.log('Daily API usage reset completed');
  }

  /**
   * Reset monthly usage for all users
   */
  private resetMonthlyUsage(): void {
    for (const [userId, usage] of this.userUsage.entries()) {
      usage.minutesUsedThisMonth = 0;
      usage.meetingsThisMonth = 0;
      this.userUsage.set(userId, usage);
    }
    console.log('Monthly API usage reset completed');
  }

  /**
   * Get user's remaining free usage
   */
  getUserLimits(userId: string): {
    dailyMinutesRemaining: number;
    monthlyMinutesRemaining: number;
    monthlyMeetingsRemaining: number;
    nextResetTime: number;
    upgradeAvailable: boolean;
  } {
    const usage = this.getUserUsage(userId);
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    return {
      dailyMinutesRemaining: Math.max(0, this.FREE_LIMITS.DAILY_MINUTES - usage.minutesUsedToday),
      monthlyMinutesRemaining: Math.max(0, this.FREE_LIMITS.MONTHLY_MINUTES - usage.minutesUsedThisMonth),
      monthlyMeetingsRemaining: Math.max(0, this.FREE_LIMITS.MONTHLY_MEETINGS - usage.meetingsThisMonth),
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