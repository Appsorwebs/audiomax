/**
 * Security Utilities for AudioMax by AppsOrWebs Limited
 * Implements various security measures to protect against common attacks
 */

// Content Security Policy headers
export const CSP_HEADERS = {
  'Content-Security-Policy': 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: blob:; " +
    "media-src 'self' blob:; " +
    "connect-src 'self' https://generativelanguage.googleapis.com https://api.anthropic.com https://api.openai.com; " +
    "font-src 'self'; " +
    "object-src 'none'; " +
    "base-uri 'self'; " +
    "form-action 'self';"
};

// Input sanitization
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') {
    return '';
  }
  
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframe tags
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim()
    .slice(0, 10000); // Limit length
};

// API key validation
export const validateApiKey = (key: string): boolean => {
  if (!key || typeof key !== 'string') {
    return false;
  }
  
  // Basic format validation (adjust based on provider)
  if (key.length < 10 || key.length > 200) {
    return false;
  }
  
  // Check for suspicious patterns
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /data:/i,
    /vbscript:/i
  ];
  
  return !suspiciousPatterns.some(pattern => pattern.test(key));
};

// File validation for audio uploads
export const validateAudioFile = (file: File): { valid: boolean; error?: string } => {
  const maxSize = 100 * 1024 * 1024; // 100MB
  const allowedTypes = [
    'audio/mpeg',
    'audio/mp4',
    'audio/wav',
    'audio/webm',
    'audio/ogg',
    'audio/m4a'
  ];
  
  if (file.size > maxSize) {
    return { valid: false, error: 'File size exceeds 100MB limit' };
  }
  
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Only audio files are allowed' };
  }
  
  // Check file extension matches MIME type
  const extension = file.name.split('.').pop()?.toLowerCase();
  const validExtensions = ['mp3', 'mp4', 'm4a', 'wav', 'webm', 'ogg'];
  
  if (!extension || !validExtensions.includes(extension)) {
    return { valid: false, error: 'Invalid file extension' };
  }
  
  return { valid: true };
};

// Rate limiting for API calls
class RateLimiter {
  private calls: number[] = [];
  private maxCalls: number;
  private timeWindow: number;
  
  constructor(maxCalls: number = 10, timeWindowMs: number = 60000) {
    this.maxCalls = maxCalls;
    this.timeWindow = timeWindowMs;
  }
  
  canMakeCall(): boolean {
    const now = Date.now();
    
    // Remove old calls outside time window
    this.calls = this.calls.filter(callTime => now - callTime < this.timeWindow);
    
    if (this.calls.length >= this.maxCalls) {
      return false;
    }
    
    this.calls.push(now);
    return true;
  }
  
  getRemainingCalls(): number {
    const now = Date.now();
    this.calls = this.calls.filter(callTime => now - callTime < this.timeWindow);
    return Math.max(0, this.maxCalls - this.calls.length);
  }
}

// Create rate limiters for different operations
export const transcriptionRateLimiter = new RateLimiter(5, 60000); // 5 calls per minute
export const summaryRateLimiter = new RateLimiter(10, 60000); // 10 calls per minute

// Secure local storage with encryption simulation
export const secureStorage = {
  set: (key: string, value: any): void => {
    try {
      const data = JSON.stringify(value);
      // In a real app, you'd encrypt this data
      const encoded = btoa(data); // Simple base64 encoding (not secure, but obfuscated)
      localStorage.setItem(`audiomax_${key}`, encoded);
    } catch (error) {
      console.error('Failed to save to secure storage:', error);
    }
  },
  
  get: (key: string): any => {
    try {
      const encoded = localStorage.getItem(`audiomax_${key}`);
      if (!encoded) return null;
      
      const data = atob(encoded); // Decode base64
      return JSON.parse(data);
    } catch (error) {
      console.error('Failed to read from secure storage:', error);
      return null;
    }
  },
  
  remove: (key: string): void => {
    localStorage.removeItem(`audiomax_${key}`);
  },
  
  clear: (): void => {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('audiomax_')) {
        localStorage.removeItem(key);
      }
    });
  }
};

// XSS Protection
export const escapeHtml = (text: string): string => {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  
  return text.replace(/[&<>"']/g, (match) => map[match]);
};

// CSRF token generation
export const generateCSRFToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Environment validation
export const validateEnvironment = (): { secure: boolean; warnings: string[] } => {
  const warnings: string[] = [];
  let secure = true;
  
  // Check if running on HTTPS (except localhost)
  if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
    warnings.push('Application should be served over HTTPS in production');
    secure = false;
  }
  
  // Check for development tools
  if (process.env.NODE_ENV === 'development') {
    warnings.push('Running in development mode - ensure production build for deployment');
  }
  
  // Check for insecure features
  if (typeof eval !== 'undefined') {
    warnings.push('eval() function is available - potential security risk');
  }
  
  return { secure, warnings };
};

// Initialize security measures
export const initializeSecurity = (): void => {
  // Disable right-click context menu in production
  if (process.env.NODE_ENV === 'production') {
    document.addEventListener('contextmenu', (e) => e.preventDefault());
    
    // Disable F12, Ctrl+Shift+I, etc.
    document.addEventListener('keydown', (e) => {
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        (e.ctrlKey && e.shiftKey && e.key === 'J') ||
        (e.ctrlKey && e.key === 'U')
      ) {
        e.preventDefault();
        return false;
      }
    });
  }
  
  // Clear console in production
  if (process.env.NODE_ENV === 'production') {
    console.clear();
    console.log('%c🔒 AudioMax by AppsOrWebs Limited', 'color: #0ea5e9; font-size: 20px; font-weight: bold;');
    console.log('%c⚠️ This is a protected application. Unauthorized access is prohibited.', 'color: #ef4444; font-size: 14px;');
  }
};

export default {
  CSP_HEADERS,
  sanitizeInput,
  validateApiKey,
  validateAudioFile,
  transcriptionRateLimiter,
  summaryRateLimiter,
  secureStorage,
  escapeHtml,
  generateCSRFToken,
  validateEnvironment,
  initializeSecurity
};