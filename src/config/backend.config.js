/**
 * Configuration centralisée du backend
 *
 * 🔧 POUR CHANGER DE PROVIDER:
 * 1. Modifie ACTIVE_PROVIDER ('supabase' ou 'infomaniak')
 * 2. Remplis les credentials du provider choisi
 * 3. C'est tout ! Le reste s'adapte automatiquement
 */

const BackendConfig = {
  // 🎯 PROVIDER ACTIF
  // Change cette ligne pour basculer de Supabase à Infomaniak
  ACTIVE_PROVIDER: 'supabase', // 'supabase' | 'infomaniak'

  // ☁️ SUPABASE (Actuel - Gratuit)
  supabase: {
    url: 'https://sxtcyznkxtlcgkgrdrbi.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4dGN5em5reHRsY2drZ3JkcmJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0ODgyMjQsImV4cCI6MjA3NTA2NDIyNH0.09FRK2S1zaauEp5tV6g6-7YmynOVNV44pRSGwqpeG8A',
    enabled: true
  },

  // 🇨🇭 INFOMANIAK (Futur - Migration)
  infomaniak: {
    apiUrl: '', // À remplir: https://api-zikirmatik.jelastic.infomaniak.com
    apiKey: '', // À remplir: ton API key
    enabled: false
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
