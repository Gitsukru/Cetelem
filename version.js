/**
 * VERSION CENTRALE DE L'APPLICATION
 * Générée automatiquement par Netlify à chaque déploiement
 */

const APP_VERSION = {
    number: 'b781ec7',
    date: '2025-11-02',
    changelog: [
        'refactor: Onglet Ayarlar avec système accordéon',
        'feat: Configuration rappels sans autorisation',
        'feat: Minutes précises (0-59) pour rappels',
        'style: Calendrier compact sur grand écran'
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
