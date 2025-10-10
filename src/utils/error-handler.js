/**
 * ⚡ Gestionnaire d'erreurs global
 * Capture toutes les erreurs non gérées et les rapporte de manière centralisée
 */

class ErrorHandler {
  constructor() {
    this.errors = []
    this.maxErrors = 50 // Garder seulement les 50 dernières erreurs
    this.initializeHandlers()
  }

  /**
   * Initialiser les gestionnaires d'erreurs globaux
   */
  initializeHandlers() {
    // Erreurs JavaScript non capturées
    window.addEventListener('error', (event) => {
      this.logError({
        type: 'UnhandledError',
        message: event.message,
        filename: event.filename,
        line: event.lineno,
        column: event.colno,
        stack: event.error?.stack
      })
    })

    // Promesses rejetées non gérées
    window.addEventListener('unhandledrejection', (event) => {
      this.logError({
        type: 'UnhandledPromiseRejection',
        message: event.reason?.message || String(event.reason),
        stack: event.reason?.stack
      })

      // Empêcher l'affichage dans la console
      event.preventDefault()
    })

    console.log('✅ ErrorHandler initialisé')
  }

  /**
   * Logger une erreur
   * @param {Object} error - Informations sur l'erreur
   */
  logError(error) {
    const errorEntry = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      ...error
    }

    // Ajouter à la liste
    this.errors.push(errorEntry)

    // Limiter la taille
    if (this.errors.length > this.maxErrors) {
      this.errors.shift()
    }

    // Logger en console
    console.error('🔴 Erreur capturée:', errorEntry)

    // Sauvegarder dans localStorage (pour debug)
    try {
      localStorage.setItem('app_errors', JSON.stringify(this.errors.slice(-10)))
    } catch (e) {
      // Ignorer si localStorage plein
    }

    // Afficher à l'utilisateur si erreur critique
    if (this.isCriticalError(error)) {
      this.showUserNotification(error)
    }

    // TODO: Envoyer à un service de monitoring (Sentry, LogRocket, etc.)
    // this.sendToMonitoring(errorEntry)
  }

  /**
   * Déterminer si l'erreur est critique
   * @param {Object} error
   * @returns {boolean}
   */
  isCriticalError(error) {
    const criticalKeywords = [
      'QuotaExceededError',
      'Failed to fetch',
      'Network request failed',
      'Database error'
    ]

    const message = error.message || ''
    return criticalKeywords.some(keyword => message.includes(keyword))
  }

  /**
   * Afficher une notification à l'utilisateur
   * @param {Object} error
   */
  showUserNotification(error) {
    if (typeof showCustomAlert === 'function') {
      let message = '⚠️ Une erreur est survenue'

      if (error.type === 'QuotaExceededError') {
        message = '❌ Stockage plein!<br>Veuillez exporter vos données'
      } else if (error.message?.includes('fetch')) {
        message = '🔌 Problème de connexion<br>Vérifiez votre internet'
      }

      showCustomAlert(message, 'error', 4000)
    }
  }

  /**
   * Récupérer toutes les erreurs
   * @returns {Array}
   */
  getErrors() {
    return this.errors
  }

  /**
   * Effacer les erreurs
   */
  clearErrors() {
    this.errors = []
    localStorage.removeItem('app_errors')
  }

  /**
   * Exporter les erreurs (pour debug)
   * @returns {string} JSON des erreurs
   */
  exportErrors() {
    return JSON.stringify(this.errors, null, 2)
  }

  /**
   * Afficher un dashboard des erreurs
   */
  showDashboard() {
    const errors = this.getErrors()

    if (errors.length === 0) {
      alert('✅ Aucune erreur enregistrée')
      return
    }

    const html = `
      <div class="custom-modal-overlay" onclick="if(event.target === this) this.remove()">
        <div class="custom-modal-content modern-modal" style="max-width: 800px;">
          <div class="modal-header">
            <h3>🔍 Rapport d'erreurs</h3>
            <button class="modal-close" onclick="this.closest('.custom-modal-overlay').remove()">✕</button>
          </div>
          <div class="modal-body">
            <p style="color: #64748b; margin-bottom: 16px;">
              ${errors.length} erreur(s) capturée(s)
            </p>
            <div style="max-height: 400px; overflow-y: auto; font-size: 12px; font-family: monospace;">
              ${errors.slice(-10).reverse().map((err, i) => `
                <div style="padding: 12px; margin-bottom: 8px; background: #f8fafc; border-left: 3px solid #ef4444; border-radius: 4px;">
                  <div style="font-weight: bold; color: #ef4444;">${err.type}</div>
                  <div style="color: #475569; margin-top: 4px;">${err.message}</div>
                  <div style="color: #94a3b8; font-size: 10px; margin-top: 4px;">
                    ${new Date(err.timestamp).toLocaleString()}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" onclick="errorHandler.clearErrors(); this.closest('.custom-modal-overlay').remove()">
              Effacer
            </button>
            <button class="btn-primary" onclick="navigator.clipboard.writeText(errorHandler.exportErrors()).then(() => alert('Copié!'))">
              Copier JSON
            </button>
          </div>
        </div>
      </div>
    `

    document.body.insertAdjacentHTML('beforeend', html)
  }
}

// Instance globale
const errorHandler = new ErrorHandler()

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ErrorHandler
}
