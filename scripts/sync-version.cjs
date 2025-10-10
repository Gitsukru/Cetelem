#!/usr/bin/env node

/**
 * 🔄 Script de synchronisation des versions
 *
 * Synchronise automatiquement la version depuis package.json
 * vers tous les autres fichiers du projet
 *
 * Usage: node scripts/sync-version.js
 */

const fs = require('fs');
const path = require('path');

// Couleurs pour le terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Lire la version depuis package.json
function getVersionFromPackageJson() {
  try {
    const packagePath = path.join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    return packageJson.version;
  } catch (error) {
    log('❌ Erreur lecture package.json:', 'red');
    console.error(error);
    process.exit(1);
  }
}

// Mettre à jour sw.js
function updateServiceWorker(version) {
  try {
    const swPath = path.join(__dirname, '..', 'sw.js');
    let content = fs.readFileSync(swPath, 'utf8');

    // Remplacer le CACHE_NAME
    const oldMatch = content.match(/const CACHE_NAME = 'cetelem-v([^']+)'/);
    if (oldMatch) {
      const oldVersion = oldMatch[1];
      content = content.replace(
        /const CACHE_NAME = 'cetelem-v[^']+'/,
        `const CACHE_NAME = 'cetelem-v${version}'`
      );
      fs.writeFileSync(swPath, content, 'utf8');
      log(`  ✅ sw.js: v${oldVersion} → v${version}`, 'green');
      return true;
    } else {
      log('  ⚠️  sw.js: CACHE_NAME non trouvé', 'yellow');
      return false;
    }
  } catch (error) {
    log('  ❌ Erreur mise à jour sw.js:', 'red');
    console.error(error);
    return false;
  }
}

// Mettre à jour index.html
function updateIndexHtml(version) {
  try {
    const indexPath = path.join(__dirname, '..', 'index.html');
    let content = fs.readFileSync(indexPath, 'utf8');

    // Remplacer la version dans le footer
    const oldMatch = content.match(/<p class="footer-version">v([^<•]+)/);
    if (oldMatch) {
      const oldVersion = oldMatch[1].trim();
      content = content.replace(
        /<p class="footer-version">v[^<•]+/,
        `<p class="footer-version">v${version}`
      );
      fs.writeFileSync(indexPath, content, 'utf8');
      log(`  ✅ index.html: v${oldVersion} → v${version}`, 'green');
      return true;
    } else {
      log('  ⚠️  index.html: footer-version non trouvé', 'yellow');
      return false;
    }
  } catch (error) {
    log('  ❌ Erreur mise à jour index.html:', 'red');
    console.error(error);
    return false;
  }
}

// Mettre à jour manifest.json (ajouter version si absente)
function updateManifest(version) {
  try {
    const manifestPath = path.join(__dirname, '..', 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

    const oldVersion = manifest.version || 'none';
    manifest.version = version;

    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
    log(`  ✅ manifest.json: v${oldVersion} → v${version}`, 'green');
    return true;
  } catch (error) {
    log('  ❌ Erreur mise à jour manifest.json:', 'red');
    console.error(error);
    return false;
  }
}

// Fonction principale
function main() {
  log('\n🔄 Synchronisation des versions...\n', 'cyan');

  const version = getVersionFromPackageJson();
  log(`📦 Version source (package.json): ${version}\n`, 'cyan');

  let successCount = 0;
  let totalCount = 0;

  // Mise à jour de tous les fichiers
  totalCount++;
  if (updateServiceWorker(version)) successCount++;

  totalCount++;
  if (updateIndexHtml(version)) successCount++;

  totalCount++;
  if (updateManifest(version)) successCount++;

  // Résumé
  log(`\n${'─'.repeat(50)}`, 'cyan');
  if (successCount === totalCount) {
    log(`\n✅ Succès ! ${successCount}/${totalCount} fichiers mis à jour`, 'green');
    log(`📌 Version synchronisée: v${version}\n`, 'green');
    process.exit(0);
  } else {
    log(`\n⚠️  Partiel: ${successCount}/${totalCount} fichiers mis à jour`, 'yellow');
    log(`📌 Version cible: v${version}\n`, 'yellow');
    process.exit(1);
  }
}

// Exécution
main();
