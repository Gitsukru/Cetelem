/**
 * URL Router - Deep linking pour le partage de Hatim
 * Gere le routage base sur le hash pour SPA
 *
 * Usage:
 *   URLRouter.register('hatim', (code) => HatimManager.openHatim(code));
 *
 * URLs supportees:
 *   https://app.com/#hatim=ABC12345
 *   https://app.com/#cevsen=XYZ98765
 */

const URLRouter = {
    routes: new Map(),
    initialized: false,

    /**
     * Initialiser le router et verifier les deep links
     */
    init() {
        if (this.initialized) return;
        this.initialized = true;

        // Ecouter les changements de hash
        window.addEventListener('hashchange', () => this.handleRoute());

        // Verifier le hash initial au chargement
        // Delai pour s'assurer que les handlers sont enregistres
        setTimeout(() => {
            if (window.location.hash) {
                this.handleRoute();
            }
        }, 500);

        console.log('URLRouter initialise');
    },

    /**
     * Enregistrer un handler de route
     * @param {string} pattern - Pattern de route (ex: 'hatim', 'cevsen')
     * @param {Function} handler - Fonction handler(code)
     */
    register(pattern, handler) {
        this.routes.set(pattern, handler);
        console.log(`Route enregistree: ${pattern}`);
    },

    /**
     * Traiter la route actuelle
     */
    handleRoute() {
        const hash = window.location.hash.slice(1);  // Retirer #
        if (!hash) return;

        // Parser le hash: hatim=ABC12345 ou cevsen=XYZ98765
        const equalIndex = hash.indexOf('=');
        if (equalIndex === -1) return;

        const route = hash.substring(0, equalIndex);
        const code = hash.substring(equalIndex + 1);

        const handler = this.routes.get(route);

        if (handler && code) {
            console.log(`Deep link detecte: ${route}=${code}`);

            // Effacer le hash apres traitement (evite re-trigger)
            history.replaceState(null, '', window.location.pathname + window.location.search);

            // Executer le handler
            try {
                handler(code);
            } catch (error) {
                console.error('Erreur handler deep link:', error);
            }
        }
    },

    /**
     * Generer une URL de partage
     * @param {string} type - 'hatim' ou 'cevsen'
     * @param {string} code - Code 8 caracteres
     * @returns {string} URL complete de partage
     */
    generateShareURL(type, code) {
        const baseUrl = window.location.origin + window.location.pathname;
        return `${baseUrl}#${type}=${code}`;
    },

    /**
     * Naviguer vers une route
     * @param {string} type - Type de route
     * @param {string} code - Code
     */
    navigate(type, code) {
        window.location.hash = `${type}=${code}`;
    }
};

// Auto-init au chargement du DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => URLRouter.init());
} else {
    URLRouter.init();
}

// Exposition globale
window.URLRouter = URLRouter;
