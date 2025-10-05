/**
 * Debounce et throttle utilities
 */

/**
 * Debounce - Attend que l'utilisateur arrête d'appeler avant d'exécuter
 * Usage: const debouncedFn = debounce(() => updateStats(), 2000)
 *        debouncedFn() // Appelle plusieurs fois, n'exécute qu'une fois 2s après le dernier appel
 *
 * @param {Function} func - Fonction à debounce
 * @param {number} wait - Délai en ms
 * @returns {Function} Fonction debouncée
 */
function debounce(func, wait = 300) {
  let timeout

  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }

    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * Throttle - Limite l'exécution à une fois par période
 * Usage: const throttledFn = throttle(() => saveData(), 5000)
 *        throttledFn() // N'exécute que toutes les 5s max
 *
 * @param {Function} func - Fonction à throttle
 * @param {number} limit - Délai minimum entre exécutions en ms
 * @returns {Function} Fonction throttlée
 */
function throttle(func, limit = 300) {
  let inThrottle

  return function(...args) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { debounce, throttle }
}

window.debounce = debounce
window.throttle = throttle
