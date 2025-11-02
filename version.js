/**
 * VERSION CENTRALE DE L'APPLICATION
 * Générée automatiquement par Netlify à chaque déploiement
 */

const APP_VERSION = {
    number: 'd8a5aa3',
    date: '2025-11-02',
    changelog: [
        'fix: Retirer attribut integrity Supabase (hash instable)',
        'fix: Réactiver mise à jour automatique de l\'app',
        'feat: Afficher numéro commit dans footer'
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
