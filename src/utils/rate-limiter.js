/**
 * Rate Limiter with enhanced brute-force protection
 * Uses device fingerprint and exponential backoff for better security
 */

class RateLimiter {
  constructor() {
    this.limits = new Map()
    this.resetTimers = new Map()
    this.failedAttempts = new Map() // Track failed attempts for exponential backoff
    this.deviceId = this.getDeviceId()
  }

  /**
   * Generate a device fingerprint for tracking across sessions
   * This helps prevent rate limit bypass through localStorage clearing
   */
  getDeviceId() {
    const DEVICE_KEY = 'rl_device_id'
    let deviceId = localStorage.getItem(DEVICE_KEY)

    if (!deviceId) {
      // Create fingerprint from available browser data
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      ctx.textBaseline = 'top'
      ctx.font = '14px Arial'
      ctx.fillText('fingerprint', 2, 2)
      const canvasData = canvas.toDataURL()

      const fingerprint = [
        navigator.userAgent,
        navigator.language,
        screen.width + 'x' + screen.height,
        new Date().getTimezoneOffset(),
        canvasData.slice(-50) // Last 50 chars of canvas data
      ].join('|')

      // Hash the fingerprint
      let hash = 0
      for (let i = 0; i < fingerprint.length; i++) {
        const char = fingerprint.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash
      }
      deviceId = 'dev_' + Math.abs(hash).toString(36) + '_' + Date.now().toString(36)
      localStorage.setItem(DEVICE_KEY, deviceId)
    }

    return deviceId
  }

  /**
   * Check if an action is allowed with enhanced protection
   * @param {string} action - Action name (e.g., 'createGroup', 'joinGroup')
   * @param {Object} options - Configuration options
   * @returns {Object} { allowed: boolean, retryAfter: number, message: string }
   */
  check(action, options = {}) {
    const {
      maxAttempts = 5,
      windowMs = 60000, // 1 minute default
      bruteForceProtection = false, // Enable exponential backoff
      maxBackoffMs = 3600000 // Max 1 hour backoff
    } = options

    const now = Date.now()
    const key = `ratelimit_${action}_${this.deviceId}`

    // Check for active lockout (exponential backoff)
    if (bruteForceProtection) {
      const lockoutCheck = this.checkLockout(action)
      if (!lockoutCheck.allowed) {
        return lockoutCheck
      }
    }

    // Get or initialize attempts
    if (!this.limits.has(key)) {
      // Try to load from localStorage first
      try {
        const stored = localStorage.getItem(key)
        if (stored) {
          this.limits.set(key, JSON.parse(stored))
        } else {
          this.limits.set(key, [])
        }
      } catch (e) {
        this.limits.set(key, [])
      }
    }

    const attempts = this.limits.get(key)

    // Clean old attempts outside the window
    const recentAttempts = attempts.filter(timestamp => now - timestamp < windowMs)
    this.limits.set(key, recentAttempts)

    // Check limit
    if (recentAttempts.length >= maxAttempts) {
      const oldestAttempt = Math.min(...recentAttempts)
      const retryAfter = windowMs - (now - oldestAttempt)

      // Record failed attempt for exponential backoff
      if (bruteForceProtection) {
        this.recordFailedAttempt(action)
      }

      return {
        allowed: false,
        retryAfter: Math.ceil(retryAfter / 1000),
        message: `Çok fazla deneme. ${Math.ceil(retryAfter / 1000)} saniye bekleyin.`
      }
    }

    // Add current attempt
    recentAttempts.push(now)
    this.limits.set(key, recentAttempts)

    // Save to localStorage for persistence
    try {
      localStorage.setItem(key, JSON.stringify(recentAttempts))
    } catch (e) {
      // Ignore localStorage errors
    }

    return { allowed: true }
  }

  /**
   * Check if device is locked out due to brute force attempts
   */
  checkLockout(action) {
    const lockoutKey = `lockout_${action}_${this.deviceId}`
    try {
      const lockoutData = localStorage.getItem(lockoutKey)
      if (lockoutData) {
        const { until, attempts } = JSON.parse(lockoutData)
        if (Date.now() < until) {
          const retryAfter = Math.ceil((until - Date.now()) / 1000)
          return {
            allowed: false,
            retryAfter,
            message: `Hesap koruma aktif. ${Math.ceil(retryAfter / 60)} dakika bekleyin.`
          }
        }
      }
    } catch (e) {
      // Ignore errors
    }
    return { allowed: true }
  }

  /**
   * Record a failed attempt and apply exponential backoff
   */
  recordFailedAttempt(action) {
    const lockoutKey = `lockout_${action}_${this.deviceId}`
    let attempts = 1
    let baseBackoff = 30000 // Start with 30 seconds

    try {
      const existing = localStorage.getItem(lockoutKey)
      if (existing) {
        const data = JSON.parse(existing)
        attempts = (data.attempts || 0) + 1
      }

      // Exponential backoff: 30s, 1m, 2m, 4m, 8m, 16m, 32m, max 1h
      const backoffMs = Math.min(baseBackoff * Math.pow(2, attempts - 1), 3600000)
      const until = Date.now() + backoffMs

      localStorage.setItem(lockoutKey, JSON.stringify({ until, attempts }))
    } catch (e) {
      // Ignore errors
    }
  }

  /**
   * Clear lockout after successful action (e.g., successful login)
   */
  clearLockout(action) {
    const lockoutKey = `lockout_${action}_${this.deviceId}`
    localStorage.removeItem(lockoutKey)
  }

  /**
   * Reset rate limit for an action
   * @param {string} action
   */
  reset(action) {
    const key = `ratelimit_${action}_${this.deviceId}`
    this.limits.delete(key)
    localStorage.removeItem(key)
  }

  /**
   * Load rate limits from localStorage
   */
  load() {
    try {
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.startsWith('ratelimit_') && key.includes(this.deviceId)) {
          try {
            const attempts = JSON.parse(localStorage.getItem(key))
            if (Array.isArray(attempts)) {
              this.limits.set(key, attempts)
            }
          } catch (e) {
            // Ignore parsing errors
          }
        }
      })
    } catch (e) {
      // Ignore errors
    }
  }

  /**
   * Get remaining attempts for an action
   * @param {string} action
   * @param {Object} options
   * @returns {number}
   */
  getRemainingAttempts(action, options = {}) {
    const { maxAttempts = 5, windowMs = 60000 } = options
    const key = `ratelimit_${action}_${this.deviceId}`
    const attempts = this.limits.get(key) || []
    const now = Date.now()
    const recentAttempts = attempts.filter(t => now - t < windowMs)
    return Math.max(0, maxAttempts - recentAttempts.length)
  }

  /**
   * Wrapper pour fonction avec rate limiting
   * @param {string} action
   * @param {Function} fn
   * @param {Object} options
   * @returns {Function}
   */
  wrap(action, fn, options = {}) {
    return async (...args) => {
      const check = this.check(action, options)

      if (!check.allowed) {
        if (typeof showCustomAlert === 'function') {
          showCustomAlert(
            `⚠️ ${check.message}<br>Protection anti-spam active`,
            'warning',
            3000
          )
        }
        throw new Error(check.message)
      }

      return await fn(...args)
    }
  }
}

// Instance globale
const rateLimiter = new RateLimiter()

// Charger au démarrage
if (typeof window !== 'undefined') {
  rateLimiter.load()
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RateLimiter
}
