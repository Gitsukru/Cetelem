/**
 * Logger utility pour gérer les logs en dev vs production
 * Usage: import logger from './src/utils/logger.js'
 *        logger.log('Message'), logger.warn('Attention'), logger.error('Erreur')
 */

const Logger = {
  // Détecte si on est en mode développement
  isDev() {
    return window.location.hostname === 'localhost' ||
           window.location.hostname === '127.0.0.1' ||
           window.location.port !== ''
  },

  log(...args) {
    if (this.isDev()) {
      console.log(...args)
    }
  },

  warn(...args) {
    if (this.isDev()) {
      console.warn(...args)
    }
  },

  error(...args) {
    // Les erreurs sont toujours loggées (même en prod)
    console.error(...args)
  },

  info(...args) {
    if (this.isDev()) {
      console.info(...args)
    }
  },

  debug(...args) {
    if (this.isDev()) {
      console.debug(...args)
    }
  }
}

// Export pour utilisation
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Logger
}

// Global pour compatibilité
window.logger = Logger
