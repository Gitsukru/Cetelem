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
     * Verifier si on est dans la PWA (mode standalone)
     */
    isInPWA() {
        return window.matchMedia('(display-mode: standalone)').matches ||
               window.navigator.standalone === true ||
               document.referrer.includes('android-app://');
    },

    /**
     * Detecter iOS
     */
    isIOS() {
        return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
               (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    },

    /**
     * Extraire le code du hash
     */
    extractCodeFromHash(hash) {
        const match = hash.match(/(?:kuran|cevsen|hatim)=([A-Z0-9]+)/i);
        return match ? match[1].toUpperCase() : null;
    },

    /**
     * Afficher le bandeau "Ouvrir dans l'app"
     */
    showOpenInAppBanner(hash) {
        // Ne pas afficher si deja dans la PWA
        if (this.isInPWA()) return;

        // Ne pas afficher si deja ferme dans cette session
        if (sessionStorage.getItem('hideOpenInAppBanner')) return;

        const isIOS = this.isIOS();
        const code = this.extractCodeFromHash(hash);

        const banner = document.createElement('div');
        banner.id = 'openInAppBanner';
        banner.innerHTML = `
            <div style="position: fixed; bottom: 0; left: 0; right: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px; z-index: 10000; box-shadow: 0 -4px 20px rgba(0,0,0,0.3);">
                <div style="max-width: 500px; margin: 0 auto; display: flex; align-items: center; gap: 12px;">
                    <div style="font-size: 32px;">📱</div>
                    <div style="flex: 1;">
                        <div style="font-weight: 600; font-size: 14px;">Çetelem uygulaması yüklü mü?</div>
                        <div style="font-size: 12px; opacity: 0.9;">${isIOS
                            ? 'iOS\'ta uygulamayı manuel olarak açmanız gerekiyor'
                            : 'Daha iyi deneyim için uygulamayı kullanın'}</div>
                    </div>
                    <button data-action="URLRouter.dismissBanner()" style="padding: 8px 12px; background: rgba(255,255,255,0.2); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px;">
                        ✕
                    </button>
                </div>
                ${code ? `
                <div style="max-width: 500px; margin: 12px auto 0; background: rgba(255,255,255,0.15); padding: 12px; border-radius: 8px;">
                    <div style="font-size: 12px; opacity: 0.9; margin-bottom: 8px;">📋 Hatim Kodu:</div>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <div style="flex: 1; background: white; color: #1e293b; padding: 10px; border-radius: 6px; font-family: monospace; font-size: 18px; font-weight: 700; letter-spacing: 2px; text-align: center;">
                            ${code}
                        </div>
                        <button data-action="URLRouter.copyCode('${code}')" style="padding: 10px 16px; background: white; color: #667eea; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 13px;">
                            Kopyala
                        </button>
                    </div>
                    <div style="font-size: 11px; opacity: 0.8; margin-top: 8px; text-align: center;">
                        ${isIOS
                            ? '👆 Kodu kopyalayın → Uygulamayı açın → "Kod ile Katıl"'
                            : '👆 Uygulama açılmazsa: Kodu kopyalayın → Uygulamayı açın → "Kod ile Katıl"'}
                    </div>
                </div>
                ` : ''}
                <div style="max-width: 500px; margin: 12px auto 0; display: flex; gap: 8px;">
                    ${!isIOS ? `
                    <button data-action="URLRouter.openInApp()" style="flex: 1; padding: 12px; background: white; color: #667eea; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 14px;">
                        📲 Uygulamada Aç
                    </button>
                    ` : ''}
                    <button data-action="URLRouter.continueInBrowser()" style="flex: 1; padding: 12px; background: ${isIOS ? 'white; color: #667eea;' : 'rgba(255,255,255,0.2); color: white;'} border: none; border-radius: 8px; cursor: pointer; font-weight: 500; font-size: 14px;">
                        ${isIOS ? '✓ Tarayıcıda Devam Et' : 'Tarayıcıda Devam Et'}
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(banner);

        // Sauvegarder le hash pour l'ouvrir dans l'app
        this.pendingHash = hash;
    },

    /**
     * Copier le code dans le presse-papier
     */
    copyCode(code) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(code).then(() => {
                if (typeof showCustomAlert === 'function') {
                    showCustomAlert('✓ Kod kopyalandı!', 'success', 2000);
                } else {
                    alert('Kod kopyalandı: ' + code);
                }
            });
        }
    },

    /**
     * Fermer le bandeau
     */
    dismissBanner() {
        const banner = document.getElementById('openInAppBanner');
        if (banner) banner.remove();
        sessionStorage.setItem('hideOpenInAppBanner', 'true');
    },

    /**
     * Ouvrir dans l'app installée
     */
    openInApp() {
        // Essayer d'ouvrir l'app via le protocol handler ou simplement rafraîchir
        // Sur certains appareils, cela peut ouvrir la PWA si elle est installée
        const url = window.location.origin + window.location.pathname + '#' + this.pendingHash;

        // Créer un lien invisible pour tenter d'ouvrir la PWA
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener';

        // Sur Android, cela peut proposer d'ouvrir dans l'app
        link.click();

        this.dismissBanner();
    },

    /**
     * Continuer dans le navigateur
     */
    continueInBrowser() {
        this.dismissBanner();
        // Le hash sera traité normalement
        if (this.pendingHash) {
            window.location.hash = this.pendingHash;
        }
    },

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
                const hash = window.location.hash.slice(1);
                // Si on est dans le navigateur (pas PWA) et qu'il y a un deep link
                if (!this.isInPWA() && (hash.startsWith('kuran=') || hash.startsWith('cevsen=') || hash.startsWith('hatim='))) {
                    this.showOpenInAppBanner(hash);
                }
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
