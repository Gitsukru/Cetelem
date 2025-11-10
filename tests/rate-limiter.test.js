/**
 * Tests pour Rate Limiter
 * Protection anti-spam et anti-abus
 */

const RateLimiter = require('../src/utils/rate-limiter.js')

describe('RateLimiter - Protection Anti-Spam', () => {
  let limiter

  beforeEach(() => {
    // Nouvelle instance pour chaque test
    limiter = new RateLimiter()
    // Nettoyer localStorage
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  // =======================
  // 1. INITIALISATION
  // =======================

  describe('Initialisation', () => {
    test('should create new instance', () => {
      expect(limiter).toBeInstanceOf(RateLimiter)
      expect(limiter.limits).toBeInstanceOf(Map)
      expect(limiter.limits.size).toBe(0)
    })

    test('should have check method', () => {
      expect(typeof limiter.check).toBe('function')
    })

    test('should have reset method', () => {
      expect(typeof limiter.reset).toBe('function')
    })

    test('should have load method', () => {
      expect(typeof limiter.load).toBe('function')
    })

    test('should have wrap method', () => {
      expect(typeof limiter.wrap).toBe('function')
    })
  })

  // =======================
  // 2. CHECK - FONCTIONNEMENT NORMAL
  // =======================

  describe('check() - Usage Normal', () => {
    test('should allow first attempt', () => {
      const result = limiter.check('testAction')

      expect(result.allowed).toBe(true)
      expect(result.retryAfter).toBeUndefined()
    })

    test('should allow multiple attempts within limit', () => {
      const options = { maxAttempts: 5, windowMs: 60000 }

      for (let i = 0; i < 5; i++) {
        const result = limiter.check('testAction', options)
        expect(result.allowed).toBe(true)
      }
    })

    test('should track attempts per action', () => {
      limiter.check('action1')
      limiter.check('action2')
      limiter.check('action1')

      expect(limiter.limits.get('action1').length).toBe(2)
      expect(limiter.limits.get('action2').length).toBe(1)
    })

    test('should use default options', () => {
      // Default: 5 tentatives en 60 secondes
      for (let i = 0; i < 5; i++) {
        const result = limiter.check('defaultTest')
        expect(result.allowed).toBe(true)
      }

      // 6ème devrait être bloquée
      const result = limiter.check('defaultTest')
      expect(result.allowed).toBe(false)
    })
  })

  // =======================
  // 3. CHECK - RATE LIMITING
  // =======================

  describe('check() - Rate Limiting Active', () => {
    test('should block when limit exceeded', () => {
      const options = { maxAttempts: 3, windowMs: 60000 }

      // 3 tentatives OK
      for (let i = 0; i < 3; i++) {
        limiter.check('limitTest', options)
      }

      // 4ème bloquée
      const result = limiter.check('limitTest', options)

      expect(result.allowed).toBe(false)
      expect(result.retryAfter).toBeDefined()
      expect(result.message).toContain('Trop de tentatives')
    })

    test('should return retryAfter in seconds', () => {
      const options = { maxAttempts: 2, windowMs: 10000 } // 10 secondes

      limiter.check('retryTest', options)
      limiter.check('retryTest', options)

      const result = limiter.check('retryTest', options)

      expect(result.allowed).toBe(false)
      expect(result.retryAfter).toBeGreaterThan(0)
      expect(result.retryAfter).toBeLessThanOrEqual(10)
    })

    test('should include message when blocked', () => {
      const options = { maxAttempts: 1, windowMs: 5000 }

      limiter.check('messageTest', options)
      const result = limiter.check('messageTest', options)

      expect(result.message).toContain('Trop de tentatives')
      expect(result.message).toContain('Réessayez dans')
    })
  })

  // =======================
  // 4. FENÊTRE TEMPORELLE
  // =======================

  describe('check() - Time Window', () => {
    test('should reset after time window expires', (done) => {
      const options = { maxAttempts: 2, windowMs: 100 } // 100ms

      // 2 tentatives
      limiter.check('windowTest', options)
      limiter.check('windowTest', options)

      // 3ème bloquée
      let result = limiter.check('windowTest', options)
      expect(result.allowed).toBe(false)

      // Attendre expiration de la fenêtre
      setTimeout(() => {
        result = limiter.check('windowTest', options)
        expect(result.allowed).toBe(true)
        done()
      }, 150) // 150ms > 100ms window
    }, 500)

    test('should clean old attempts outside window', () => {
      const options = { maxAttempts: 3, windowMs: 1000 }

      // Première tentative
      limiter.check('cleanTest', options)

      // Simuler tentatives anciennes en modifiant directement
      const attempts = limiter.limits.get('cleanTest')
      attempts.push(Date.now() - 2000) // 2 secondes avant (hors fenêtre)
      attempts.push(Date.now() - 1500) // 1.5 secondes avant (hors fenêtre)
      limiter.limits.set('cleanTest', attempts)

      // Nouvelle tentative devrait nettoyer les anciennes
      const result = limiter.check('cleanTest', options)

      expect(result.allowed).toBe(true)
      const currentAttempts = limiter.limits.get('cleanTest')
      expect(currentAttempts.length).toBe(2) // Anciennes nettoyées
    })
  })

  // =======================
  // 5. RESET
  // =======================

  describe('reset()', () => {
    test('should reset limits for specific action', () => {
      const options = { maxAttempts: 2, windowMs: 60000 }

      // Remplir la limite
      limiter.check('resetTest', options)
      limiter.check('resetTest', options)

      // Bloquer
      let result = limiter.check('resetTest', options)
      expect(result.allowed).toBe(false)

      // Reset
      limiter.reset('resetTest')

      // Devrait être autorisé maintenant
      result = limiter.check('resetTest', options)
      expect(result.allowed).toBe(true)
    })

    test('should not affect other actions', () => {
      limiter.check('action1')
      limiter.check('action2')

      limiter.reset('action1')

      expect(limiter.limits.has('action1')).toBe(false)
      expect(limiter.limits.has('action2')).toBe(true)
    })

    test('should remove from localStorage', () => {
      limiter.check('localStorageTest')

      // Vérifier présence
      const key = 'ratelimit_localStorageTest'
      expect(localStorage.getItem(key)).not.toBeNull()

      // Reset
      limiter.reset('localStorageTest')

      // Vérifier suppression
      expect(localStorage.getItem(key)).toBeNull()
    })
  })

  // =======================
  // 6. PERSISTENCE (localStorage)
  // =======================

  describe('Persistence avec localStorage', () => {
    test('should save attempts to localStorage', () => {
      limiter.check('persistTest')

      const key = 'ratelimit_persistTest'
      const saved = localStorage.getItem(key)

      expect(saved).not.toBeNull()

      const attempts = JSON.parse(saved)
      expect(Array.isArray(attempts)).toBe(true)
      expect(attempts.length).toBe(1)
    })

    test('should load attempts from localStorage', () => {
      // Sauvegarder manuellement dans localStorage
      const key = 'ratelimit_loadTest'
      const attempts = [Date.now(), Date.now() - 1000]
      localStorage.setItem(key, JSON.stringify(attempts))

      // Créer nouvelle instance et charger
      const newLimiter = new RateLimiter()
      newLimiter.load()

      // Vérifier chargement
      expect(newLimiter.limits.has('loadTest')).toBe(true)
      expect(newLimiter.limits.get('loadTest').length).toBe(2)
    })

    test('should ignore corrupted localStorage data', () => {
      // Données corrompues
      localStorage.setItem('ratelimit_corrupted', 'invalid json{]')

      // Ne devrait pas crasher
      const newLimiter = new RateLimiter()
      expect(() => newLimiter.load()).not.toThrow()
    })

    test('should handle localStorage quota errors', () => {
      // Remplir localStorage (simuler quota)
      const largeMock = jest.spyOn(Storage.prototype, 'setItem')
      largeMock.mockImplementation(() => {
        throw new Error('QuotaExceededError')
      })

      // Ne devrait pas crasher
      expect(() => {
        limiter.check('quotaTest')
      }).not.toThrow()

      largeMock.mockRestore()
    })
  })

  // =======================
  // 7. WRAP - FONCTION WRAPPER
  // =======================

  describe('wrap() - Function Wrapper', () => {
    test('should wrap async function', async () => {
      const mockFn = jest.fn().mockResolvedValue('success')
      const options = { maxAttempts: 2, windowMs: 60000 }

      const wrapped = limiter.wrap('wrapTest', mockFn, options)

      const result = await wrapped('arg1', 'arg2')

      expect(result).toBe('success')
      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2')
    })

    test('should block wrapped function when limit exceeded', async () => {
      const mockFn = jest.fn().mockResolvedValue('success')
      const options = { maxAttempts: 1, windowMs: 60000 }

      const wrapped = limiter.wrap('blockTest', mockFn, options)

      // Premier appel OK
      await wrapped()
      expect(mockFn).toHaveBeenCalledTimes(1)

      // Deuxième appel bloqué
      await expect(wrapped()).rejects.toThrow('Trop de tentatives')
      expect(mockFn).toHaveBeenCalledTimes(1) // Pas appelé une 2ème fois
    })

    test('should pass arguments correctly', async () => {
      const mockFn = jest.fn((a, b, c) => a + b + c)
      const wrapped = limiter.wrap('argsTest', mockFn)

      const result = await wrapped(1, 2, 3)

      expect(result).toBe(6)
      expect(mockFn).toHaveBeenCalledWith(1, 2, 3)
    })
  })

  // =======================
  // 8. CAS D'USAGE RÉELS
  // =======================

  describe('Cas d\'usage Zikirmatik', () => {
    test('should limit group creation (5/day)', () => {
      const options = { maxAttempts: 5, windowMs: 24 * 60 * 60 * 1000 }

      // 5 créations OK
      for (let i = 0; i < 5; i++) {
        const result = limiter.check('createGroup', options)
        expect(result.allowed).toBe(true)
      }

      // 6ème bloquée
      const result = limiter.check('createGroup', options)
      expect(result.allowed).toBe(false)
      expect(result.message).toContain('Trop de tentatives')
    })

    test('should limit chat messages (10/minute)', () => {
      const options = { maxAttempts: 10, windowMs: 60000 }

      // 10 messages OK
      for (let i = 0; i < 10; i++) {
        limiter.check('sendMessage', options)
      }

      // 11ème bloqué
      const result = limiter.check('sendMessage', options)
      expect(result.allowed).toBe(false)
    })

    test('should limit API calls (100/hour)', () => {
      const options = { maxAttempts: 100, windowMs: 60 * 60 * 1000 }

      // 100 appels OK
      for (let i = 0; i < 100; i++) {
        limiter.check('apiCall', options)
      }

      // 101ème bloqué
      const result = limiter.check('apiCall', options)
      expect(result.allowed).toBe(false)
    })
  })

  // =======================
  // 9. TESTS DE PERFORMANCE
  // =======================

  describe('Performance', () => {
    test('should handle 1000 checks quickly', () => {
      const start = Date.now()

      for (let i = 0; i < 1000; i++) {
        limiter.check(`action${i}`)
      }

      const duration = Date.now() - start

      expect(duration).toBeLessThan(1000) // < 1 seconde
    })

    test('should clean old attempts efficiently', () => {
      const options = { maxAttempts: 100, windowMs: 1000 }

      // Ajouter beaucoup de tentatives
      for (let i = 0; i < 50; i++) {
        limiter.check('perfTest', options)
      }

      const start = Date.now()
      limiter.check('perfTest', options)
      const duration = Date.now() - start

      expect(duration).toBeLessThan(10) // < 10ms
    })
  })

  // =======================
  // 10. EDGE CASES
  // =======================

  describe('Edge Cases', () => {
    test('should handle zero maxAttempts', () => {
      const result = limiter.check('zeroTest', { maxAttempts: 0 })

      expect(result.allowed).toBe(false)
    })

    test('should handle negative maxAttempts', () => {
      const result = limiter.check('negativeTest', { maxAttempts: -1 })

      expect(result.allowed).toBe(false)
    })

    test('should handle very large windowMs', () => {
      const options = { maxAttempts: 2, windowMs: 999999999 }

      limiter.check('largeWindowTest', options)
      limiter.check('largeWindowTest', options)

      const result = limiter.check('largeWindowTest', options)

      expect(result.allowed).toBe(false)
    })

    test('should handle concurrent actions', () => {
      // Simuler plusieurs actions simultanées
      const results = []

      for (let i = 0; i < 10; i++) {
        results.push(limiter.check('concurrentTest', { maxAttempts: 5 }))
      }

      const allowed = results.filter(r => r.allowed).length
      const blocked = results.filter(r => !r.allowed).length

      expect(allowed).toBe(5)
      expect(blocked).toBe(5)
    })
  })
})
