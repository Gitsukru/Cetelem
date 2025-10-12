/**
 * 📊 Système de Monitoring et Métriques
 *
 * Centralise le monitoring de l'application:
 * - Erreurs JavaScript
 * - Performance (vitals web)
 * - Métriques utilisateur
 * - Health checks
 */

const Monitoring = {
  // Configuration
  config: {
    enabled: true,
    sampleRate: 1.0, // 100% des événements (réduire à 0.1 pour 10% en prod)
    reportInterval: 60000, // Reporter toutes les 60s
    maxQueueSize: 100
  },

  // Queue des métriques
  metricsQueue: [],
  performanceMetrics: {},

  /**
   * Initialiser le monitoring
   */
  init() {
    if (!this.config.enabled) return;

    this.startPerformanceMonitoring();
    this.setupErrorTracking();
    // ⚠️ DÉSACTIVÉ: setupHealthChecks et setupAutoReporting causaient 180+ requêtes/h vers Supabase
    // Cette app est localStorage-first, le monitoring automatique n'est pas nécessaire
    // this.setupHealthChecks();
    // this.setupAutoReporting();

    console.log('📊 Monitoring initialisé (mode local seulement)');
  },

  /**
   * Monitoring de performance (Web Vitals)
   */
  startPerformanceMonitoring() {
    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.trackMetric('LCP', lastEntry.renderTime || lastEntry.loadTime);
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {
        // Browser ne supporte pas LCP
      }

      // First Input Delay (FID)
      try {
        const fidObserver = new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            this.trackMetric('FID', entry.processingStart - entry.startTime);
          }
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
      } catch (e) {
        // Browser ne supporte pas FID
      }

      // Cumulative Layout Shift (CLS)
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
              this.trackMetric('CLS', clsValue);
            }
          }
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (e) {
        // Browser ne supporte pas CLS
      }
    }

    // Time to First Byte (TTFB)
    window.addEventListener('load', () => {
      const navTiming = performance.getEntriesByType('navigation')[0];
      if (navTiming) {
        this.trackMetric('TTFB', navTiming.responseStart - navTiming.requestStart);
        this.trackMetric('DOM_Load', navTiming.domContentLoadedEventEnd - navTiming.fetchStart);
        this.trackMetric('Full_Load', navTiming.loadEventEnd - navTiming.fetchStart);
      }
    });
  },

  /**
   * Tracking des erreurs (intégration avec ErrorHandler)
   */
  setupErrorTracking() {
    // Écouter les erreurs capturées par ErrorHandler
    const originalLogError = window.errorHandler?.logError;
    if (originalLogError) {
      window.errorHandler.logError = (error) => {
        // Appeler l'original
        originalLogError.call(window.errorHandler, error);

        // Tracker l'erreur
        this.trackError(error);
      };
    }
  },

  /**
   * Health checks périodiques
   */
  setupHealthChecks() {
    setInterval(() => {
      const health = this.getHealthStatus();

      // Si problème détecté, logger
      if (health.status !== 'healthy') {
        this.trackMetric('Health_Check', 0, { issues: health.issues });
      } else {
        this.trackMetric('Health_Check', 1);
      }
    }, 30000); // Check toutes les 30s
  },

  /**
   * Reporting automatique des métriques
   */
  setupAutoReporting() {
    setInterval(() => {
      this.flushMetrics();
    }, this.config.reportInterval);

    // Flush avant de quitter la page
    window.addEventListener('beforeunload', () => {
      this.flushMetrics();
    });
  },

  /**
   * Tracker une métrique
   * @param {string} name - Nom de la métrique
   * @param {number} value - Valeur
   * @param {Object} metadata - Métadonnées additionnelles
   */
  trackMetric(name, value, metadata = {}) {
    // Sampling
    if (Math.random() > this.config.sampleRate) return;

    const metric = {
      name,
      value,
      timestamp: Date.now(),
      url: window.location.pathname,
      metadata,
      session: this.getSessionId()
    };

    this.metricsQueue.push(metric);

    // Stocker aussi dans performanceMetrics pour accès rapide
    if (!this.performanceMetrics[name]) {
      this.performanceMetrics[name] = [];
    }
    this.performanceMetrics[name].push(value);

    // Flush si queue trop grande
    if (this.metricsQueue.length >= this.config.maxQueueSize) {
      this.flushMetrics();
    }
  },

  /**
   * Tracker une erreur
   * @param {Object} error - Erreur à tracker
   */
  trackError(error) {
    this.trackMetric('Error', 1, {
      type: error.type,
      message: error.message,
      stack: error.stack?.substring(0, 200), // Limiter la taille
      critical: error.critical || false
    });

    // Envoyer immédiatement si erreur critique
    if (error.critical) {
      this.flushMetrics();
    }
  },

  /**
   * Tracker un événement utilisateur
   * @param {string} eventName
   * @param {Object} properties
   */
  trackEvent(eventName, properties = {}) {
    this.trackMetric('User_Event', 1, {
      event: eventName,
      ...properties
    });
  },

  /**
   * Obtenir le statut de santé de l'app
   * @returns {Object}
   */
  getHealthStatus() {
    const issues = [];

    // Check localStorage quota
    try {
      const usage = this.getStorageUsage();
      if (usage > 0.9) {
        issues.push('localStorage_full');
      }
    } catch (e) {
      issues.push('localStorage_error');
    }

    // Check si online
    if (!navigator.onLine) {
      issues.push('offline');
    }

    // Check erreurs récentes
    const recentErrors = window.errorHandler?.getErrors?.() || [];
    const criticalErrors = recentErrors.filter(e =>
      Date.now() - new Date(e.timestamp).getTime() < 60000
    );
    if (criticalErrors.length > 5) {
      issues.push('high_error_rate');
    }

    // Check performance
    const avgLCP = this.getAverageMetric('LCP');
    if (avgLCP > 4000) {
      issues.push('slow_lcp');
    }

    return {
      status: issues.length === 0 ? 'healthy' : 'degraded',
      issues,
      timestamp: Date.now()
    };
  },

  /**
   * Obtenir l'usage du localStorage
   * @returns {number} Pourcentage (0-1)
   */
  getStorageUsage() {
    let total = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length + key.length;
      }
    }
    // Limite approximative: 5MB = 5 * 1024 * 1024 caractères
    const limit = 5 * 1024 * 1024;
    return total / limit;
  },

  /**
   * Obtenir la moyenne d'une métrique
   * @param {string} name
   * @returns {number}
   */
  getAverageMetric(name) {
    const values = this.performanceMetrics[name] || [];
    if (values.length === 0) return 0;
    const sum = values.reduce((a, b) => a + b, 0);
    return sum / values.length;
  },

  /**
   * Obtenir ou créer un session ID
   * @returns {string}
   */
  getSessionId() {
    let sessionId = sessionStorage.getItem('monitoring_session_id');
    if (!sessionId) {
      sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('monitoring_session_id', sessionId);
    }
    return sessionId;
  },

  /**
   * Envoyer les métriques au backend
   */
  async flushMetrics() {
    if (this.metricsQueue.length === 0) return;

    const metrics = [...this.metricsQueue];
    this.metricsQueue = [];

    // Envoyer à analytics si disponible
    if (typeof analytics !== 'undefined' && analytics.track) {
      try {
        await analytics.track('Monitoring_Metrics', {
          metrics,
          count: metrics.length,
          session: this.getSessionId()
        });
      } catch (error) {
        console.error('Erreur envoi métriques:', error);
      }
    }

    // Ou envoyer à un service externe (Sentry, LogRocket, etc.)
    // await this.sendToExternalService(metrics);
  },

  /**
   * Dashboard de monitoring
   */
  showDashboard() {
    const health = this.getHealthStatus();
    const metrics = this.performanceMetrics;

    const metricsHtml = Object.entries(metrics)
      .map(([name, values]) => {
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const min = Math.min(...values);
        const max = Math.max(...values);

        let status = '🟢';
        let statusText = 'Bon';

        // Évaluation selon les seuils Web Vitals
        if (name === 'LCP' && avg > 2500) {
          status = avg > 4000 ? '🔴' : '🟡';
          statusText = avg > 4000 ? 'Mauvais' : 'Moyen';
        } else if (name === 'FID' && avg > 100) {
          status = avg > 300 ? '🔴' : '🟡';
          statusText = avg > 300 ? 'Mauvais' : 'Moyen';
        } else if (name === 'CLS' && avg > 0.1) {
          status = avg > 0.25 ? '🔴' : '🟡';
          statusText = avg > 0.25 ? 'Mauvais' : 'Moyen';
        }

        return `
          <tr>
            <td style="padding: 8px;">${status} ${name}</td>
            <td style="padding: 8px;">${Math.round(avg)}ms</td>
            <td style="padding: 8px;">${Math.round(min)}-${Math.round(max)}ms</td>
            <td style="padding: 8px;">${values.length}</td>
            <td style="padding: 8px;">${statusText}</td>
          </tr>
        `;
      }).join('');

    const html = `
      <div class="custom-modal-overlay" onclick="if(event.target === this) this.remove()">
        <div class="custom-modal" style="max-width: 800px;">
          <div class="modal-header">
            <h3>📊 Dashboard Monitoring</h3>
            <button class="modal-close" onclick="this.closest('.custom-modal-overlay').remove()">✕</button>
          </div>
          <div class="modal-body">
            <div style="margin-bottom: 20px;">
              <h4>Statut Système</h4>
              <div style="padding: 12px; background: ${health.status === 'healthy' ? '#d1fae5' : '#fee2e2'}; border-radius: 8px;">
                ${health.status === 'healthy' ? '✅' : '⚠️'} ${health.status === 'healthy' ? 'Système en bonne santé' : 'Problèmes détectés'}
                ${health.issues.length > 0 ? `<div style="margin-top: 8px; font-size: 13px;">Issues: ${health.issues.join(', ')}</div>` : ''}
              </div>
            </div>

            <h4>Métriques de Performance</h4>
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <thead>
                <tr style="background: #f1f5f9;">
                  <th style="padding: 8px; text-align: left;">Métrique</th>
                  <th style="padding: 8px; text-align: left;">Moyenne</th>
                  <th style="padding: 8px; text-align: left;">Min-Max</th>
                  <th style="padding: 8px; text-align: left;">Samples</th>
                  <th style="padding: 8px; text-align: left;">État</th>
                </tr>
              </thead>
              <tbody>
                ${metricsHtml || '<tr><td colspan="5" style="text-align: center; padding: 20px;">Aucune métrique collectée</td></tr>'}
              </tbody>
            </table>

            <div style="margin-top: 20px; padding: 12px; background: #f8fafc; border-radius: 8px; font-size: 12px;">
              <strong>Légende Web Vitals:</strong><br>
              • LCP (Largest Contentful Paint): <2.5s = Bon, 2.5-4s = Moyen, >4s = Mauvais<br>
              • FID (First Input Delay): <100ms = Bon, 100-300ms = Moyen, >300ms = Mauvais<br>
              • CLS (Cumulative Layout Shift): <0.1 = Bon, 0.1-0.25 = Moyen, >0.25 = Mauvais
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" onclick="this.closest('.custom-modal-overlay').remove()">
              Fermer
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);
  }
};

// Auto-init si dans le navigateur
if (typeof window !== 'undefined') {
  window.Monitoring = Monitoring;

  // Init après chargement du DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Monitoring.init());
  } else {
    Monitoring.init();
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Monitoring;
}
