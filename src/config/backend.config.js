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
    if (typeof ENV === 'undefined') {
      throw new Error('❌ ENV non défini! Vérifiez que env.js est chargé avant backend.config.js');
    }
    return {
      url: ENV.SUPABASE_URL,  // Lèvera une erreur si manquant
      key: ENV.SUPABASE_ANON_KEY,  // Lèvera une erreur si manquant
      enabled: true
    }
  },

  // 🇨🇭 INFOMANIAK (Futur - Migration)
  get infomaniak() {
    if (typeof ENV === 'undefined') {
      throw new Error('❌ ENV non défini! Vérifiez que env.js est chargé avant backend.config.js');
    }
    return {
      apiUrl: ENV.INFOMANIAK_API_URL || '',
      apiKey: ENV.INFOMANIAK_API_KEY || '',
      enabled: false  // Désactivé pour l'instant
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
