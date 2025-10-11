/**
 * ⚡ Chargement des variables d'environnement
 *
 * 🔧 MODE HYBRIDE:
 * - Avec Vite (npm run dev/build): Charge depuis .env via import.meta.env
 * - Sans Vite (index.html direct): Charge depuis window.__ENV__ injecté par un script
 *
 * ⚠️  SÉCURITÉ:
 * - Ne JAMAIS commit de vraies clés API dans ce fichier
 * - Les vraies valeurs sont dans .env (déjà dans .gitignore)
 * - En production, injecter les variables via script ou serveur
 */

// Helper pour vérifier import.meta de manière sécurisée
function getViteEnv(key) {
  try {
    // Cette vérification ne fonctionnera que dans un module ES
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      return import.meta.env[key];
    }
  } catch (e) {
    // import.meta n'est pas disponible (script classique)
  }
  return undefined;
}

const ENV = {
  // Détection de l'environnement
  isDevelopment: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',

  // ⚡ Support Vite (avec bundler) OU injection manuelle (sans bundler)
  get SUPABASE_URL() {
    // Mode 1: Vite (import.meta.env)
    const viteValue = getViteEnv('VITE_SUPABASE_URL');
    if (viteValue) return viteValue;

    // Mode 2: Injection manuelle (window.__ENV__)
    if (typeof window !== 'undefined' && window.__ENV__?.SUPABASE_URL) {
      return window.__ENV__.SUPABASE_URL;
    }

    throw new Error('❌ SUPABASE_URL manquant! Configurez soit .env (Vite) soit window.__ENV__ (sans Vite)');
  },

  get SUPABASE_ANON_KEY() {
    // Mode 1: Vite (import.meta.env)
    const viteValue = getViteEnv('VITE_SUPABASE_ANON_KEY');
    if (viteValue) return viteValue;

    // Mode 2: Injection manuelle (window.__ENV__)
    if (typeof window !== 'undefined' && window.__ENV__?.SUPABASE_ANON_KEY) {
      return window.__ENV__.SUPABASE_ANON_KEY;
    }

    throw new Error('❌ SUPABASE_ANON_KEY manquant! Configurez soit .env (Vite) soit window.__ENV__ (sans Vite)');
  },

  get INFOMANIAK_API_URL() {
    return getViteEnv('VITE_INFOMANIAK_API_URL') || '';
  },

  get INFOMANIAK_API_KEY() {
    return getViteEnv('VITE_INFOMANIAK_API_KEY') || '';
  },

  get ACTIVE_PROVIDER() {
    return getViteEnv('VITE_ACTIVE_PROVIDER') || 'supabase';
  }
}

// ✅ Les variables sont maintenant vérifiées dans les getters ci-dessus
// Si elles manquent, une erreur sera lancée immédiatement

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ENV
}
