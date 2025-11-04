#!/usr/bin/env node

/**
 * Script exécuté par Netlify à chaque déploiement
 * Génère version.js avec le hash Git du commit
 */

const { execSync } = require('child_process');
const fs = require('fs');

try {
    // Récupérer le hash court du commit
    const commitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();

    // Récupérer la date du commit
    const commitDate = execSync('git log -1 --format=%cd --date=format:"%Y-%m-%d"', { encoding: 'utf8' }).trim();

    // Récupérer le message du dernier commit
    const commitMsg = execSync('git log -1 --pretty=%B', { encoding: 'utf8' }).split('\n')[0].trim();

    // Échapper les apostrophes et backslashes pour JavaScript
    const escapedMsg = commitMsg
        .replace(/\\/g, '\\\\')  // Échapper les backslashes
        .replace(/'/g, "\\'");   // Échapper les apostrophes

    // Générer le contenu de version.js
    const versionContent = `/**
 * VERSION CENTRALE DE L'APPLICATION
 * Générée automatiquement par Netlify à chaque déploiement
 */

const APP_VERSION = {
    number: '${commitHash}',
    date: '${commitDate}',
    changelog: [
        '${escapedMsg}',
        'Déploiement automatique Netlify'
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
`;

    // Écrire le fichier
    fs.writeFileSync('version.js', versionContent, 'utf8');

    console.log('✅ version.js généré avec succès !');
    console.log(`   Hash: ${commitHash}`);
    console.log(`   Date: ${commitDate}`);
    console.log(`   Message: ${commitMsg}`);

} catch (error) {
    console.error('❌ Erreur lors de la génération de version.js:', error.message);
    process.exit(1);
}
