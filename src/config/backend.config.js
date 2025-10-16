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
      console.warn('⚠️ ENV non défini! Vérifiez que env.js est chargé avant backend.config.js');
      return { url: '', key: '', enabled: false };
    }

    // 🔍 DEBUG: Logger ce qui vient de ENV
    console.log('🔍 BackendConfig.supabase appelé')
    console.log('📍 ENV.SUPABASE_URL:', ENV.SUPABASE_URL)
    console.log('🔑 ENV.SUPABASE_ANON_KEY (50 premiers):', ENV.SUPABASE_ANON_KEY?.substring(0, 50))
    console.log('🔑 Key length:', ENV.SUPABASE_ANON_KEY?.length)
    console.log('🔑 Key contient des espaces?', ENV.SUPABASE_ANON_KEY?.includes(' '))

    const hasValidConfig = ENV.SUPABASE_URL && ENV.SUPABASE_ANON_KEY &&
                          ENV.SUPABASE_URL !== '' && ENV.SUPABASE_ANON_KEY !== '';

    if (!hasValidConfig) {
      console.warn('⚠️ Clés Supabase non configurées. Le mode groupe ne sera pas disponible.');
    }

    return {
      url: ENV.SUPABASE_URL || '',
      key: ENV.SUPABASE_ANON_KEY || '',
      enabled: hasValidConfig
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
    try {
      const config = this[this.ACTIVE_PROVIDER]

      if (!config || !config.enabled) {
        console.warn(`⚠️ Provider ${this.ACTIVE_PROVIDER} non configuré ou désactivé`);
        console.info('💡 Pour activer le mode groupe:');
        console.info('   1. Configurez les variables d\'environnement sur Netlify');
        console.info('   2. Ajoutez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY');
        console.info('   3. Redéployez l\'application');
        return null;
      }

      return {
        type: this.ACTIVE_PROVIDER,
        ...config
      }
    } catch (error) {
      console.error('❌ Erreur lors de la récupération du provider:', error);
      return null;
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
