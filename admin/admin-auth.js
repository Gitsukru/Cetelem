/**
 * 🔐 ADMIN AUTHENTICATION SYSTEM
 *
 * Authentification via Supabase Auth
 * - L'admin se connecte avec email/password
 * - Session JWT sécurisée
 * - RLS protège les données
 *
 * Configuration requise dans Supabase :
 * 1. Créer un compte admin dans Auth
 * 2. Configurer RLS sur les tables analytics
 */

class AdminAuth {
    constructor() {
        // 🔑 Configuration
        this.ADMIN_EMAILS = [
            window.ENV?.ADMIN_EMAIL || 'admin@example.com',
            // Ajouter d'autres emails admin ici si besoin
        ];

        this.SESSION_DURATION_DAYS = 7;
        this.supabase = null;
        this.currentUser = null;
        this.APP_VERSION = '3.5.1'; // Synced with package.json
        this.pendingServiceWorker = null;
    }

    /**
     * 🚀 Initialisation
     */
    async init() {
        console.log('🔐 AdminAuth: Initialisation...');

        // Vérifier que Supabase est chargé
        if (typeof supabase === 'undefined') {
            console.error('❌ Supabase non chargé');
            this.showError('Erreur : Supabase non disponible');
            return;
        }

        // Initialiser Supabase client
        await this.initSupabase();

        // Vérifier la session
        await this.checkSession();
    }

    /**
     * Initialise le client Supabase
     */
    async initSupabase() {
        try {
            // Configuration Supabase (utilise variables d'environnement injectées)
            const SUPABASE_URL = window.ENV?.SUPABASE_URL || '';
            const SUPABASE_ANON_KEY = window.ENV?.SUPABASE_ANON_KEY || '';

            if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
                throw new Error('Variables d\'environnement Supabase manquantes');
            }

            this.supabase = supabase.createClient(
                SUPABASE_URL,
                SUPABASE_ANON_KEY
            );

            console.log('✅ Supabase client initialisé');
        } catch (error) {
            console.error('❌ Erreur init Supabase:', error);
            this.showError('Erreur de connexion à la base de données');
        }
    }

    /**
     * Vérifie la session active
     */
    async checkSession() {
        try {
            const { data: { session }, error } = await this.supabase.auth.getSession();

            if (error) throw error;

            if (session && session.user) {
                console.log('✅ Session active trouvée');

                // Vérifier que c'est un admin autorisé
                if (this.isAdminEmail(session.user.email)) {
                    this.currentUser = session.user;
                    console.log('👑 Admin autorisé:', session.user.email);
                    this.showDashboard();
                } else {
                    console.warn('⚠️ Email non autorisé:', session.user.email);
                    await this.logout();
                    this.showError('Cet email n\'a pas les droits d\'administrateur');
                }
            } else {
                console.log('🔓 Pas de session active');
                this.showLoginForm();
            }
        } catch (error) {
            console.error('❌ Erreur vérification session:', error);
            this.showLoginForm();
        }
    }

    /**
     * Vérifie si un email est autorisé comme admin
     */
    isAdminEmail(email) {
        return this.ADMIN_EMAILS.includes(email);
    }

    /**
     * Affiche le formulaire de connexion
     */
    showLoginForm() {
        const loader = document.getElementById('adminLoader');
        if (!loader) return;

        loader.innerHTML = `
            <div class="login-container">
                <div class="login-header">
                    <div class="login-icon">👑</div>
                    <h1>Admin Dashboard</h1>
                    <p>Çetelem</p>
                </div>

                <form id="loginForm" class="login-form" onsubmit="event.preventDefault(); adminAuth.handleLogin();">
                    <div class="form-group">
                        <label for="emailInput">
                            <span class="label-icon">📧</span>
                            Email
                        </label>
                        <input
                            type="email"
                            id="emailInput"
                            class="form-control"
                            placeholder="admin@example.com"
                            required
                            autocomplete="email"
                        >
                    </div>

                    <div class="form-group">
                        <label for="passwordInput">
                            <span class="label-icon">🔒</span>
                            Mot de passe
                        </label>
                        <input
                            type="password"
                            id="passwordInput"
                            class="form-control"
                            placeholder="••••••••"
                            required
                            autocomplete="current-password"
                        >
                    </div>

                    <div id="loginError" class="error-message" style="display: none;"></div>

                    <button type="submit" class="btn-login" id="loginBtn">
                        <span class="btn-icon">🔓</span>
                        <span class="btn-text">Se connecter</span>
                    </button>
                </form>

                <div class="login-footer">
                    <a href="../index.html" class="back-link">
                        ← Retour à l'application
                    </a>
                </div>

                <div class="login-info">
                    <div class="info-badge">🔐 Connexion sécurisée</div>
                    <p>Authentification via Supabase Auth</p>
                </div>
            </div>
        `;

        // Focus sur email
        setTimeout(() => {
            const emailInput = document.getElementById('emailInput');
            if (emailInput) emailInput.focus();
        }, 100);
    }

    /**
     * Gère la soumission du formulaire de connexion
     */
    async handleLogin() {
        const emailInput = document.getElementById('emailInput');
        const passwordInput = document.getElementById('passwordInput');
        const errorDiv = document.getElementById('loginError');
        const loginBtn = document.getElementById('loginBtn');

        if (!emailInput || !passwordInput) return;

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        // Validation
        if (!email || !password) {
            this.showLoginError('Veuillez remplir tous les champs');
            return;
        }

        // Vérifier que l'email est autorisé AVANT de tenter la connexion
        if (!this.isAdminEmail(email)) {
            this.showLoginError('Cet email n\'a pas les droits d\'administrateur');
            return;
        }

        // Désactiver le bouton pendant la connexion
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<span class="btn-spinner">⏳</span><span>Connexion...</span>';
        errorDiv.style.display = 'none';

        try {
            // Connexion Supabase
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) throw error;

            if (data.user) {
                console.log('✅ Connexion réussie');
                this.currentUser = data.user;

                // Log de connexion (optionnel)
                await this.logAdminAccess();

                // Afficher le dashboard
                this.showDashboard();
            }
        } catch (error) {
            console.error('❌ Erreur connexion:', error);

            // Messages d'erreur en français
            let errorMessage = 'Erreur de connexion';

            if (error.message.includes('Invalid login credentials')) {
                errorMessage = 'Email ou mot de passe incorrect';
            } else if (error.message.includes('Email not confirmed')) {
                errorMessage = 'Email non confirmé. Vérifiez votre boîte mail.';
            } else if (error.message.includes('Too many requests')) {
                errorMessage = 'Trop de tentatives. Attendez quelques minutes.';
            }

            this.showLoginError(errorMessage);

            // Réactiver le bouton
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<span class="btn-icon">🔓</span><span class="btn-text">Se connecter</span>';
        }
    }

    /**
     * Affiche une erreur de connexion
     */
    showLoginError(message) {
        const errorDiv = document.getElementById('loginError');
        if (!errorDiv) return;

        errorDiv.textContent = '❌ ' + message;
        errorDiv.style.display = 'block';

        // Animation shake
        errorDiv.style.animation = 'shake 0.4s';
        setTimeout(() => {
            errorDiv.style.animation = '';
        }, 400);
    }

    /**
     * Déconnexion
     */
    async logout() {
        try {
            const { error } = await this.supabase.auth.signOut();

            if (error) throw error;

            console.log('🚪 Déconnexion réussie');
            this.currentUser = null;

            // Recharger la page
            window.location.reload();
        } catch (error) {
            console.error('❌ Erreur déconnexion:', error);
            // Forcer le reload quand même
            window.location.reload();
        }
    }

    /**
     * Log d'accès admin dans analytics
     */
    async logAdminAccess() {
        try {
            await this.supabase.from('analytics_events').insert({
                event_type: 'admin_login',
                event_data: {
                    timestamp: new Date().toISOString(),
                    email: this.currentUser.email,
                    userAgent: navigator.userAgent
                }
            });
        } catch (error) {
            console.log('⚠️ Erreur log analytics (ignoré)');
        }
    }

    /**
     * Affiche le dashboard admin
     */
    showDashboard() {
        const loader = document.getElementById('adminLoader');
        const container = document.getElementById('adminContainer');

        if (loader) loader.style.display = 'none';
        if (container) container.style.display = 'flex';

        // Afficher l'email admin dans le sidebar
        this.displayAdminInfo();

        // Enregistrer Service Worker et afficher version
        this.registerServiceWorker();

        // Initialiser le dashboard
        if (typeof adminDashboard !== 'undefined') {
            adminDashboard.init(this.supabase, this.currentUser);
        }
    }

    /**
     * Affiche les infos admin dans le sidebar
     */
    displayAdminInfo() {
        const adminInfo = document.querySelector('.admin-info');
        if (!adminInfo || !this.currentUser) return;

        adminInfo.innerHTML = `
            <div class="admin-email" title="${this.currentUser.email}">
                ${this.currentUser.email}
            </div>
            <div class="admin-status">
                <span class="status-dot"></span>
                Connecté
            </div>
        `;
    }

    /**
     * Affiche une erreur
     */
    showError(message) {
        const loader = document.getElementById('adminLoader');
        if (!loader) return;

        loader.innerHTML = `
            <div class="loader-content">
                <div class="loader-icon" style="font-size: 80px;">❌</div>
                <h2 style="color: #ef4444;">Erreur</h2>
                <p style="color: #64748b; margin: 20px 0;">
                    ${message}
                </p>
                <button onclick="window.location.reload()"
                        style="margin-top: 20px; padding: 12px 24px; background: #667eea; color: white; border: none; border-radius: 8px; font-size: 16px; cursor: pointer;">
                    Réessayer
                </button>
                <br>
                <a href="../index.html" style="display: inline-block; margin-top: 12px; color: #64748b; text-decoration: none;">
                    ← Retour à l'application
                </a>
            </div>
        `;
    }

    /**
     * Obtient le client Supabase (pour le dashboard)
     */
    getSupabase() {
        return this.supabase;
    }

    /**
     * Obtient l'utilisateur actuel
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Enregistre le Service Worker pour l'admin
     */
    registerServiceWorker() {
        if (!('serviceWorker' in navigator)) {
            console.log('⚠️ Service Worker non supporté');
            return;
        }

        navigator.serviceWorker.register('../sw.js')
            .then(registration => {
                console.log('✅ Service Worker enregistré (admin)');

                // Afficher la version
                this.displayVersion();

                // Vérifier les mises à jour
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;

                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            console.log('🆕 Nouvelle version disponible (admin)');
                            this.pendingServiceWorker = newWorker;
                            this.showUpdateBanner();
                        }
                    });
                });

                // Vérifier immédiatement si update en attente
                if (registration.waiting) {
                    this.pendingServiceWorker = registration.waiting;
                    this.showUpdateBanner();
                }
            })
            .catch(error => {
                console.error('❌ Erreur Service Worker:', error);
            });
    }

    /**
     * Affiche la version dans le sidebar
     */
    displayVersion() {
        const versionInfo = document.querySelector('.version-info');
        if (versionInfo) {
            // Obtenir le commit hash depuis version.js (généré par Netlify)
            const commitHash = (typeof APP_VERSION !== 'undefined' && APP_VERSION.number)
                ? APP_VERSION.number
                : 'dev';

            versionInfo.textContent = `v${this.APP_VERSION} • ${commitHash} • 2025`;
        }
    }

    /**
     * Affiche la bannière de mise à jour
     */
    showUpdateBanner() {
        // Vérifier si déjà affiché
        if (document.getElementById('adminUpdateBanner')) return;

        const banner = document.createElement('div');
        banner.id = 'adminUpdateBanner';
        banner.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 12px 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 16px;
            font-weight: 600;
            font-size: 14px;
            z-index: 100000;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            animation: slideDown 0.3s ease;
        `;

        banner.innerHTML = `
            <span style="font-size: 20px;">🎉</span>
            <span>Nouvelle version disponible !</span>
            <button onclick="adminAuth.applyUpdate()" style="background: white; color: #059669; border: none; padding: 8px 20px; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 14px;">
                🚀 Mettre à jour
            </button>
            <button onclick="document.getElementById('adminUpdateBanner').remove()" style="background: transparent; color: white; border: 1px solid rgba(255,255,255,0.3); width: 28px; height: 28px; border-radius: 50%; font-size: 16px; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0;">
                ✕
            </button>
        `;

        document.body.insertBefore(banner, document.body.firstChild);
    }

    /**
     * Applique la mise à jour
     */
    applyUpdate() {
        if (!this.pendingServiceWorker) return;

        const banner = document.getElementById('adminUpdateBanner');
        if (banner) banner.remove();

        // Afficher message de chargement
        const loading = document.createElement('div');
        loading.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 32px 48px;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            z-index: 100001;
            text-align: center;
        `;
        loading.innerHTML = `
            <div style="font-size: 48px; margin-bottom: 16px;">🔄</div>
            <div style="font-size: 18px; font-weight: 600; color: #1e293b;">Mise à jour en cours...</div>
        `;
        document.body.appendChild(loading);

        // Activer le nouveau Service Worker
        this.pendingServiceWorker.postMessage({ type: 'SKIP_WAITING' });

        // Recharger après 2s
        setTimeout(() => {
            window.location.reload();
        }, 2000);
    }
}

// Instance globale
const adminAuth = new AdminAuth();

// Auto-init au chargement
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => adminAuth.init());
} else {
    adminAuth.init();
}

console.log('🔐 admin-auth.js chargé (Supabase Auth)');
