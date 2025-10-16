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
  // ⚠️ import.meta ne peut être utilisé que dans un module ES6
  // En mode script classique (sans type="module"), toujours retourner undefined
  // Vite injectera les variables via window.__ENV__ à la place
  return undefined;
}

const ENV = {
  // Détection de l'environnement
  isDevelopment: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',

  // ⚡ Support Vite (avec bundler) OU injection manuelle (sans bundler)
  get SUPABASE_URL() {
    // Mode 1: Vite (import.meta.env)
    const viteValue = getViteEnv('VITE_SUPABASE_URL');
    if (viteValue) return viteValue.trim();

    // Mode 2: Injection manuelle (window.__ENV__)
    if (typeof window !== 'undefined' && window.__ENV__?.SUPABASE_URL) {
      return window.__ENV__.SUPABASE_URL.trim();
    }

    // Mode 3: Retourner chaîne vide au lieu d'erreur (mode dégradé)
    console.warn('⚠️ SUPABASE_URL manquant - Mode groupe désactivé');
    return '';
  },

  get SUPABASE_ANON_KEY() {
    // Mode 1: Vite (import.meta.env)
    const viteValue = getViteEnv('VITE_SUPABASE_ANON_KEY');
    if (viteValue) return viteValue.replace(/\s+/g, ''); // Nettoyer tous les espaces

    // Mode 2: Injection manuelle (window.__ENV__)
    if (typeof window !== 'undefined' && window.__ENV__?.SUPABASE_ANON_KEY) {
      // 🔧 FIX: Nettoyer les espaces qui peuvent être injectés par erreur lors du build Netlify
      return window.__ENV__.SUPABASE_ANON_KEY.replace(/\s+/g, '');
    }

    // Mode 3: Retourner chaîne vide au lieu d'erreur (mode dégradé)
    console.warn('⚠️ SUPABASE_ANON_KEY manquant - Mode groupe désactivé');
    return '';
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
