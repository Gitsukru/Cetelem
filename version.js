/**
 * VERSION CENTRALE DE L'APPLICATION
 * Générée automatiquement par Netlify à chaque déploiement
 */

const APP_VERSION = {
    number: '39278a3',
    date: '2025-11-02',
    changelog: [
        'fix: Tesbih 125% uniquement sur mobile (pas desktop)',
        'feat: Refonte complète onglet Sayaç mobile',
        'feat: Stats card en haut (Bugün/Toplam/Süre)',
        'feat: Tesbih compact 85vw + mode paysage'
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
