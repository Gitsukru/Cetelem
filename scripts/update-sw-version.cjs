#!/usr/bin/env node
/**
 * Script pour mettre à jour automatiquement la version du Service Worker
 *
 * Usage:
 *   node scripts/update-sw-version.js
 *
 * Ce script est appelé automatiquement par le hook git pre-commit
 * Il met à jour CACHE_VERSION dans sw.js avec la date + hash git court
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SW_PATH = path.join(__dirname, '..', 'sw.js');

// Obtenir la date au format YYYY-MM-DD
const today = new Date().toISOString().split('T')[0];

// Obtenir le hash git court (7 caractères)
let gitHash = 'local';
try {
    gitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim();
} catch (e) {
    console.warn('Impossible d\'obtenir le hash git, utilisation de "local"');
}

// Nouvelle version: date-hash
const newVersion = `${today}-${gitHash}`;

// Lire le fichier sw.js
let swContent = fs.readFileSync(SW_PATH, 'utf-8');

// Remplacer la version
const versionRegex = /const CACHE_VERSION = '[^']+';/;
const oldVersionMatch = swContent.match(versionRegex);

if (oldVersionMatch) {
    const oldVersion = oldVersionMatch[0];
    const newVersionLine = `const CACHE_VERSION = '${newVersion}';`;

    if (oldVersion !== newVersionLine) {
        swContent = swContent.replace(versionRegex, newVersionLine);
        fs.writeFileSync(SW_PATH, swContent);
        console.log(`✅ Service Worker version mise à jour: ${newVersion}`);

        // Ajouter sw.js au commit
        try {
            execSync('git add sw.js', { encoding: 'utf-8' });
            console.log('✅ sw.js ajouté au commit');
        } catch (e) {
            console.warn('⚠️ Impossible d\'ajouter sw.js au commit');
        }
    } else {
        console.log(`ℹ️ Version déjà à jour: ${newVersion}`);
    }
} else {
    console.error('❌ Impossible de trouver CACHE_VERSION dans sw.js');
    process.exit(1);
}
