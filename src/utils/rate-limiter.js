/**
 * ⚡ Rate Limiter côté client
 * Empêche le spam et les abus d'API
 */

class RateLimiter {
  constructor() {
    this.limits = new Map()
    this.resetTimers = new Map()
  }

  /**
   * Vérifier si une action est autorisée
   * @param {string} action - Nom de l'action (ex: 'createGroup')
   * @param {Object} options - { maxAttempts, windowMs }
   * @returns {Object} { allowed: boolean, retryAfter: number }
   */
  check(action, options = {}) {
    const {
      maxAttempts = 5,
      windowMs = 60000 // 1 minute par défaut
    } = options

    const now = Date.now()
    const key = `ratelimit_${action}`

    // Récupérer ou initialiser les tentatives
    if (!this.limits.has(action)) {
      this.limits.set(action, [])
    }

    const attempts = this.limits.get(action)

    // Nettoyer les anciennes tentatives (hors fenêtre)
    const recentAttempts = attempts.filter(timestamp => now - timestamp < windowMs)
    this.limits.set(action, recentAttempts)

    // Vérifier la limite
    if (recentAttempts.length >= maxAttempts) {
      const oldestAttempt = Math.min(...recentAttempts)
      const retryAfter = windowMs - (now - oldestAttempt)

      return {
        allowed: false,
        retryAfter: Math.ceil(retryAfter / 1000), // en secondes
        message: `Trop de tentatives. Réessayez dans ${Math.ceil(retryAfter / 1000)}s`
      }
    }

    // Ajouter la tentative actuelle
    recentAttempts.push(now)
    this.limits.set(action, recentAttempts)

    // Sauvegarder dans localStorage pour persistance
    try {
      localStorage.setItem(key, JSON.stringify(recentAttempts))
    } catch (e) {
      // Ignorer erreurs localStorage
    }

    return { allowed: true }
  }

  /**
   * Réinitialiser le rate limit pour une action
   * @param {string} action
   */
  reset(action) {
    this.limits.delete(action)
    const key = `ratelimit_${action}`
    localStorage.removeItem(key)
  }

  /**
   * Charger les rate limits depuis localStorage
   */
  load() {
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.startsWith('ratelimit_')) {
        try {
          const action = key.replace('ratelimit_', '')
          const attempts = JSON.parse(localStorage.getItem(key))
          if (Array.isArray(attempts)) {
            this.limits.set(action, attempts)
          }
        } catch (e) {
          // Ignorer erreurs parsing
        }
      }
    })
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
