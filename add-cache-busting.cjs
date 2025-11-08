#!/usr/bin/env node

/**
 * Script de cache-busting pour index.html et admin.html
 *
 * Ajoute automatiquement ?v=timestamp à tous les fichiers .js et .css
 * pour forcer les navigateurs à télécharger les nouvelles versions.
 *
 * Exécution: node add-cache-busting.cjs
 */

const fs = require('fs');
const path = require('path');

// Timestamp unique pour ce build
const VERSION = Date.now();

console.log('🔧 Cache-busting: Ajout versions aux assets...');
console.log(`📦 Version: ${VERSION}`);

/**
 * Ajoute ?v= aux URLs de scripts et styles
 */
function addCacheBusting(content, filename) {
    let modified = content;
    let count = 0;

    // Pattern pour <script src="...">
    const scriptPattern = /<script\s+src="([^"?]+)(?:\?v=[^"]*)?"/g;
    modified = modified.replace(scriptPattern, (match, url) => {
        count++;
        return `<script src="${url}?v=${VERSION}"`;
    });

    // Pattern pour <link rel="stylesheet" href="...">
    const linkPattern = /<link\s+rel="stylesheet"\s+href="([^"?]+)(?:\?v=[^"]*)?"/g;
    modified = modified.replace(linkPattern, (match, url) => {
        count++;
        return `<link rel="stylesheet" href="${url}?v=${VERSION}"`;
    });

    console.log(`  ✅ ${filename}: ${count} fichiers versionnés`);
    return modified;
}

/**
 * Traite un fichier HTML
 */
function processFile(filepath) {
    const filename = path.basename(filepath);

    if (!fs.existsSync(filepath)) {
        console.log(`  ⚠️  ${filename}: fichier introuvable`);
        return;
    }

    const content = fs.readFileSync(filepath, 'utf8');
    const modified = addCacheBusting(content, filename);

    fs.writeFileSync(filepath, modified, 'utf8');
}

// Fichiers à traiter
const files = [
    path.join(__dirname, 'index.html'),
    path.join(__dirname, 'admin.html'),
    path.join(__dirname, 'admin', 'index.html')
];

// Traitement
files.forEach(processFile);

console.log('✅ Cache-busting terminé!\n');
