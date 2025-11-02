/**
 * VERSION CENTRALE DE L'APPLICATION
 * Générée automatiquement par Netlify à chaque déploiement
 */

const APP_VERSION = {
    number: '81cce79',
    date: '2025-11-02',
    changelog: [
        'refactor: Retirer !important (code propre)',
        'fix: Desktop sans scroll + tesbih 130% mobile centré',
        'feat: Refonte complète onglet Sayaç mobile',
        'feat: Stats card en haut (Bugün/Toplam/Süre)'
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
