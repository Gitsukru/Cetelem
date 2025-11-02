/**
 * VERSION CENTRALE DE L'APPLICATION
 * Générée automatiquement par Netlify à chaque déploiement
 */

const APP_VERSION = {
    number: '5899ec7',
    date: '2025-11-02',
    changelog: [
        'style: Calendrier plus compact sur grand écran (≥1024px)',
        'feat: Renommer onglet Yönetim → Ayarlar',
        'refactor: Retirer !important (code propre)',
        'fix: Desktop sans scroll + tesbih 130% mobile centré'
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
