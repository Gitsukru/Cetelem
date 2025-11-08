#!/usr/bin/env node

/**
 * Script de minification JavaScript pour production
 *
 * Minifie tous les fichiers JS (sauf node_modules, dist, tests)
 * pour optimiser la taille et les performances en production.
 *
 * Usage:
 *   node minify-production.cjs [--dry-run]
 *
 * Options:
 *   --dry-run : Afficher les fichiers qui seraient minifiés sans les modifier
 */

const fs = require('fs');
const path = require('path');
const { minify } = require('terser');

// Configuration
const ROOT_DIR = __dirname;
const EXCLUDE_DIRS = ['node_modules', 'dist', 'tests', 'coverage', '.git'];
const EXCLUDE_FILES = [
  'minify-production.cjs',
  'generate-version.cjs',
  'inject-env.cjs',
  'add-cache-busting.cjs',
  'vite.config.js'
];

// Options Terser pour minification optimale
const TERSER_OPTIONS = {
  compress: {
    dead_code: true,
    drop_console: false, // Garder console.log car désactivé via disable-console-production.js
    drop_debugger: true,
    conditionals: true,
    evaluate: true,
    booleans: true,
    loops: true,
    unused: true,
    hoist_funs: true,
    if_return: true,
    join_vars: true,
    collapse_vars: true,
    reduce_vars: true,
    warnings: false,
    negate_iife: true,
    pure_getters: false,
    unsafe: false,
    unsafe_comps: false,
    unsafe_math: false,
    unsafe_methods: false
  },
  mangle: {
    toplevel: false,
    eval: false,
    keep_classnames: false,
    keep_fnames: false,
    safari10: true
  },
  format: {
    comments: false,
    beautify: false,
    ascii_only: false
  },
  sourceMap: false,
  keep_classnames: false,
  keep_fnames: false
};

// Mode dry-run
const DRY_RUN = process.argv.includes('--dry-run');

/**
 * Trouver tous les fichiers JS à minifier
 */
function findJSFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Skip excluded directories
      const relativePath = path.relative(ROOT_DIR, filePath);
      const shouldSkip = EXCLUDE_DIRS.some(excludeDir =>
        relativePath.startsWith(excludeDir) || file === excludeDir
      );

      if (!shouldSkip) {
        findJSFiles(filePath, fileList);
      }
    } else if (file.endsWith('.js') && !file.endsWith('.min.js')) {
      // Skip excluded files
      if (!EXCLUDE_FILES.includes(file)) {
        fileList.push(filePath);
      }
    }
  });

  return fileList;
}

/**
 * Minifier un fichier JavaScript
 */
async function minifyFile(filePath) {
  try {
    const code = fs.readFileSync(filePath, 'utf8');
    const originalSize = Buffer.byteLength(code, 'utf8');

    // Minifier avec Terser
    const result = await minify(code, TERSER_OPTIONS);

    if (result.error) {
      throw result.error;
    }

    const minifiedCode = result.code;
    const minifiedSize = Buffer.byteLength(minifiedCode, 'utf8');
    const savings = ((originalSize - minifiedSize) / originalSize * 100).toFixed(1);

    const relativePath = path.relative(ROOT_DIR, filePath);

    if (DRY_RUN) {
      console.log(`[DRY-RUN] ${relativePath}`);
      console.log(`  Original: ${formatBytes(originalSize)}`);
      console.log(`  Minified: ${formatBytes(minifiedSize)} (-${savings}%)`);
    } else {
      // Créer backup
      const backupPath = filePath + '.backup';
      fs.copyFileSync(filePath, backupPath);

      // Écrire version minifiée
      fs.writeFileSync(filePath, minifiedCode, 'utf8');

      console.log(`✅ ${relativePath}`);
      console.log(`   ${formatBytes(originalSize)} → ${formatBytes(minifiedSize)} (-${savings}%)`);
    }

    return {
      file: relativePath,
      originalSize,
      minifiedSize,
      savings: parseFloat(savings)
    };
  } catch (error) {
    console.error(`❌ Erreur minification ${filePath}:`, error.message);
    return null;
  }
}

/**
 * Formatter taille en bytes
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 10) / 10 + ' ' + sizes[i];
}

/**
 * Main
 */
async function main() {
  console.log('🔍 Recherche des fichiers JavaScript...\n');

  const jsFiles = findJSFiles(ROOT_DIR);

  console.log(`📦 ${jsFiles.length} fichiers trouvés\n`);

  if (DRY_RUN) {
    console.log('⚠️  MODE DRY-RUN - Aucun fichier ne sera modifié\n');
  }

  const results = [];
  for (const filePath of jsFiles) {
    const result = await minifyFile(filePath);
    if (result) {
      results.push(result);
    }
  }

  // Statistiques finales
  console.log('\n' + '='.repeat(60));
  console.log('📊 RÉSUMÉ MINIFICATION');
  console.log('='.repeat(60));

  const totalOriginal = results.reduce((sum, r) => sum + r.originalSize, 0);
  const totalMinified = results.reduce((sum, r) => sum + r.minifiedSize, 0);
  const totalSavings = ((totalOriginal - totalMinified) / totalOriginal * 100).toFixed(1);

  console.log(`Fichiers traités: ${results.length}`);
  console.log(`Taille originale: ${formatBytes(totalOriginal)}`);
  console.log(`Taille minifiée:  ${formatBytes(totalMinified)}`);
  console.log(`Économie totale:  ${formatBytes(totalOriginal - totalMinified)} (-${totalSavings}%)`);

  if (!DRY_RUN) {
    console.log('\n💾 Backups créés avec extension .backup');
    console.log('   Pour restaurer: rm *.js && rename .backup "" *.backup');
  }

  console.log('\n✅ Terminé!');
}

// Exécuter
main().catch(error => {
  console.error('❌ Erreur:', error);
  process.exit(1);
});
