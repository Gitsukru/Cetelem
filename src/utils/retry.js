/**
 * Retry utility avec exponential backoff
 * Usage: await retry(() => apiCall(), { maxRetries: 3 })
 */

/**
 * Attend un certain temps (promesse)
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Retry une fonction avec exponential backoff
 *
 * @param {Function} fn - Fonction async à retry
 * @param {Object} options - Options de retry
 * @param {number} options.maxRetries - Nombre max de tentatives (défaut: 3)
 * @param {number} options.baseDelay - Délai de base en ms (défaut: 1000)
 * @param {number} options.maxDelay - Délai max en ms (défaut: 10000)
 * @param {Function} options.onRetry - Callback appelé avant chaque retry
 * @returns {Promise} Résultat de la fonction ou erreur
 */
async function retry(fn, options = {}) {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    onRetry = null
  } = options

  let lastError

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Tentative d'exécution
      const result = await fn()

      // Succès ! On log si c'était pas la première tentative
      if (attempt > 0) {
        logger.log(`✅ Succès après ${attempt + 1} tentative(s)`)
      }

      return result

    } catch (error) {
      lastError = error

      // Si c'est la dernière tentative, on throw
      if (attempt === maxRetries - 1) {
        logger.error(`❌ Échec après ${maxRetries} tentatives:`, error)
        throw error
      }

      // Calcul du délai avec exponential backoff
      // Tentative 1: 1s, Tentative 2: 2s, Tentative 3: 4s, etc.
      const delay = Math.min(
        baseDelay * Math.pow(2, attempt),
        maxDelay
      )

      logger.warn(`⚠️ Tentative ${attempt + 1}/${maxRetries} échouée. Nouvelle tentative dans ${delay}ms...`)

      // Callback optionnel avant retry
      if (onRetry) {
        try {
          onRetry(attempt + 1, error, delay)
        } catch (callbackError) {
          logger.error('Erreur callback onRetry:', callbackError)
        }
      }

      // Attendre avant de réessayer
      await sleep(delay)
    }
  }

  // Ne devrait jamais arriver ici, mais au cas où
  throw lastError
}

/**
 * Version spécialisée pour Supabase
 * Détecte les erreurs réseau vs erreurs métier
 */
async function retrySupabase(fn, options = {}) {
  return retry(fn, {
    ...options,
    maxRetries: options.maxRetries || 3,
    onRetry: (attempt, error, delay) => {
      // Détection du type d'erreur
      const isNetworkError =
        error.message?.includes('fetch') ||
        error.message?.includes('network') ||
        error.code === 'ECONNREFUSED' ||
        error.code === 'ETIMEDOUT'

      if (isNetworkError) {
        logger.warn(`🌐 Erreur réseau détectée (tentative ${attempt})`)
      } else {
        logger.warn(`⚙️ Erreur serveur (tentative ${attempt}):`, error.message)
      }

      // Callback utilisateur optionnel
      if (options.onRetry) {
        options.onRetry(attempt, error, delay)
      }
    }
  })
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { retry, retrySupabase, sleep }
}

window.retry = retry
window.retrySupabase = retrySupabase
window.sleep = sleep
