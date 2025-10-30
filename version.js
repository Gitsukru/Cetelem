/**
 * VERSION CENTRALE DE L'APPLICATION
 * Modifiez uniquement ICI pour changer la version partout
 */

const APP_VERSION = {
    number: '3.5.1',
    date: '2025-01-30',
    changelog: [
        'Amélioration réactivité bouton compteur mobile',
        'Barre navigation Tesbihat fixée en bas',
        'Menu hamburger fermable en cliquant dehors',
        'Boutons Namaz optimisés pour petits écrans',
        'Système de mise à jour amélioré'
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
