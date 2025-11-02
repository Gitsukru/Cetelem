/**
 * VERSION CENTRALE DE L'APPLICATION
 * Générée automatiquement par Netlify à chaque déploiement
 */

const APP_VERSION = {
    number: '37af595',
    date: '2025-11-02',
    changelog: [
        'feat: Renommer onglet Yönetim → Ayarlar',
        'refactor: Retirer !important (code propre)',
        'fix: Desktop sans scroll + tesbih 130% mobile centré',
        'feat: Refonte complète onglet Sayaç mobile'
    ]
};

// Exposition globale
if (typeof window !== 'undefined') {
    window.APP_VERSION = APP_VERSION;
}

// Export pour Service Worker
if (typeof self !== 'undefined' && typeof window === 'undefined') {
    self.APP_VERSION = APP_VERSION;
}
