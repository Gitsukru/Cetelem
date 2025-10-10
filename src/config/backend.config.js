/**
 * Configuration centralisée du backend
 *
 * ⚡ SÉCURISÉ: Les clés API sont maintenant chargées depuis ENV
 *
 * 🔧 POUR CHANGER DE PROVIDER:
 * 1. Modifie ACTIVE_PROVIDER dans .env ou src/config/env.js
 * 2. Remplis les credentials dans .env
 * 3. C'est tout ! Le reste s'adapte automatiquement
 */

const BackendConfig = {
  // 🎯 PROVIDER ACTIF (chargé depuis ENV)
  get ACTIVE_PROVIDER() {
    return typeof ENV !== 'undefined' ? ENV.ACTIVE_PROVIDER : 'supabase'
  },

  // ☁️ SUPABASE (Actuel - Gratuit)
  get supabase() {
    return {
      url: typeof ENV !== 'undefined' ? ENV.SUPABASE_URL : 'https://sxtcyznkxtlcgkgrdrbi.supabase.co',
      key: typeof ENV !== 'undefined' ? ENV.SUPABASE_ANON_KEY : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4dGN5em5reHRsY2drZ3JkcmJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0ODgyMjQsImV4cCI6MjA3NTA2NDIyNH0.09FRK2S1zaauEp5tV6g6-7YmynOVNV44pRSGwqpeG8A',
      enabled: true
    }
  },

  // 🇨🇭 INFOMANIAK (Futur - Migration)
  get infomaniak() {
    return {
      apiUrl: typeof ENV !== 'undefined' ? ENV.INFOMANIAK_API_URL : '',
      apiKey: typeof ENV !== 'undefined' ? ENV.INFOMANIAK_API_KEY : '',
      enabled: false
    }
  },

  /**
   * Récupérer le provider actif
   * @returns {Object} Configuration du provider actif
   */
  getActiveProvider() {
    const config = this[this.ACTIVE_PROVIDER]

    if (!config || !config.enabled) {
      throw new Error(`Provider ${this.ACTIVE_PROVIDER} non configuré ou désactivé`)
    }

    return {
      type: this.ACTIVE_PROVIDER,
      ...config
    }
  },

  /**
   * Vérifier si un provider est configuré
   * @param {string} providerName - 'supabase' ou 'infomaniak'
   * @returns {boolean}
   */
  isProviderConfigured(providerName) {
    const config = this[providerName]
    return config && config.enabled && (config.url || config.apiUrl) && (config.key || config.apiKey)
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BackendConfig
}
