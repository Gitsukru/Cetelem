/**
 * VERSION CENTRALE DE L'APPLICATION
 * Générée automatiquement par Netlify à chaque déploiement
 */

const APP_VERSION = {
    number: '04c3e1b',
    date: '2025-11-02',
    changelog: [
        'feat: Choix précis des minutes (0-59) pour rappels',
        'style: Calendrier plus compact sur grand écran',
        'feat: Renommer onglet Yönetim → Ayarlar',
        'refactor: Retirer !important (code propre)'
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
