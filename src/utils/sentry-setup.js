/**
 * Configuration Sentry pour monitoring production
 *
 * Documentation: https://docs.sentry.io/platforms/javascript/
 *
 * 1. Créer compte gratuit sur https://sentry.io
 * 2. Créer projet JavaScript
 * 3. Copier le DSN
 * 4. Définir VITE_SENTRY_DSN dans .env
 */

const SentryMonitoring = {
  /**
   * Initialise Sentry si DSN configuré
   */
  init() {
    // Vérifier si Sentry doit être activé
    const SENTRY_DSN = window.__ENV__?.SENTRY_DSN;
    const IS_PRODUCTION = window.location.hostname !== 'localhost'
                       && window.location.hostname !== '127.0.0.1';

    if (!SENTRY_DSN || !IS_PRODUCTION) {
      console.log('Sentry désactivé (dev ou DSN manquant)');
      return;
    }

    // Charger Sentry depuis CDN
    const script = document.createElement('script');
    script.src = 'https://browser.sentry-cdn.com/7.119.0/bundle.min.js';
    script.integrity = 'sha384-tG3KJmT0QB3L1q7vN9kHG0CJj5OEI8eVJPe59L4kLLj8cLJfFw2SzJKLz5YlC6gT';
    script.crossOrigin = 'anonymous';
    script.onload = () => {
      // Initialiser Sentry
      Sentry.init({
        dsn: SENTRY_DSN,

        // Nom de l'app
        environment: 'production',
        release: window.APP_VERSION?.number || 'unknown',

        // Taux d'échantillonnage (100% = tous les erreurs)
        tracesSampleRate: 0.1, // 10% des transactions (économiser quota)

        // Filtrer les erreurs non importantes
        beforeSend(event, hint) {
          const error = hint.originalException;

          // Ignorer erreurs réseau (hors ligne)
          if (error && error.message && error.message.includes('NetworkError')) {
            return null;
          }

          // Ignorer erreurs extension navigateur
          if (error && error.stack && error.stack.includes('chrome-extension://')) {
            return null;
          }

          return event;
        },

        // Ignorer certains types d'erreurs
        ignoreErrors: [
          'Non-Error promise rejection captured',
          'ResizeObserver loop limit exceeded',
          'SecurityError',
          'QuotaExceededError'
        ]
      });

      // Définir contexte utilisateur
      Sentry.setContext('app', {
        name: 'Zikirmatik',
        version: window.APP_VERSION?.number,
        userAgent: navigator.userAgent,
        language: navigator.language
      });

      console.log('✅ Sentry monitoring activé');
    };

    script.onerror = () => {
      console.warn('⚠️ Impossible de charger Sentry');
    };

    document.head.appendChild(script);
  },

  /**
   * Capture une erreur manuellement
   */
  captureException(error, context = {}) {
    if (typeof Sentry !== 'undefined') {
      Sentry.captureException(error, {
        extra: context
      });
    } else {
      console.error('Sentry pas chargé:', error);
    }
  },

  /**
   * Capture un message (info, warning)
   */
  captureMessage(message, level = 'info') {
    if (typeof Sentry !== 'undefined') {
      Sentry.captureMessage(message, level);
    }
  },

  /**
   * Ajoute un breadcrumb (trace navigation)
   */
  addBreadcrumb(message, data = {}) {
    if (typeof Sentry !== 'undefined') {
      Sentry.addBreadcrumb({
        message,
        data,
        level: 'info'
      });
    }
  }
};

// Initialiser automatiquement au chargement
document.addEventListener('DOMContentLoaded', () => {
  SentryMonitoring.init();
});

// Export global
window.SentryMonitoring = SentryMonitoring;

// Export module
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SentryMonitoring;
}
