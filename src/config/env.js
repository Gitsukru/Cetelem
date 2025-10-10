/**
 * ⚡ Chargement des variables d'environnement
 *
 * En développement avec bundler (Vite/Webpack):
 *   - Les variables sont injectées via import.meta.env ou process.env
 *
 * En production sans bundler (comme actuellement):
 *   - Fallback sur les valeurs codées en dur
 *   - IMPORTANT: Ne jamais commit .env avec de vraies valeurs
 */

const ENV = {
  // Détection de l'environnement
  isDevelopment: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',

  // Charger depuis import.meta.env (Vite) ou fallback
  get SUPABASE_URL() {
    return typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL
      || 'https://sxtcyznkxtlcgkgrdrbi.supabase.co'
  },

  get SUPABASE_ANON_KEY() {
    return typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY
      || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4dGN5em5reHRsY2drZ3JkcmJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0ODgyMjQsImV4cCI6MjA3NTA2NDIyNH0.09FRK2S1zaauEp5tV6g6-7YmynOVNV44pRSGwqpeG8A'
  },

  get INFOMANIAK_API_URL() {
    return typeof import.meta !== 'undefined' && import.meta.env?.VITE_INFOMANIAK_API_URL
      || ''
  },

  get INFOMANIAK_API_KEY() {
    return typeof import.meta !== 'undefined' && import.meta.env?.VITE_INFOMANIAK_API_KEY
      || ''
  },

  get ACTIVE_PROVIDER() {
    return typeof import.meta !== 'undefined' && import.meta.env?.VITE_ACTIVE_PROVIDER
      || 'supabase'
  }
}

// ⚠️ Avertissement en développement si variables manquantes
if (ENV.isDevelopment) {
  if (!ENV.SUPABASE_URL || !ENV.SUPABASE_ANON_KEY) {
    console.warn('⚠️ Variables d\'environnement manquantes. Utilisation des valeurs par défaut.')
    console.warn('💡 Créez un fichier .env basé sur .env.example')
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ENV
}
