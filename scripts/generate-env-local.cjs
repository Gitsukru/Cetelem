#!/usr/bin/env node

/**
 * 🔐 Générateur de fichier env.local.js pour développement sans bundler
 *
 * Ce script lit le fichier .env et génère un fichier env.local.js
 * qui injecte les variables dans window.__ENV__
 *
 * Usage:
 *   npm run gen-env-local
 *   node scripts/generate-env-local.cjs
 */

const fs = require('fs');
const path = require('path');

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

function main() {
  log('\n🔐 Génération env.local.js depuis .env...\n', 'cyan');

  const envPath = path.join(__dirname, '..', '.env');
  const envExamplePath = path.join(__dirname, '..', '.env.example');
  const outputPath = path.join(__dirname, '..', 'src', 'config', 'env.local.js');

  // Vérifier si .env existe
  if (!fs.existsSync(envPath)) {
    log('❌ Fichier .env introuvable!', 'red');
    log('💡 Créez un fichier .env basé sur .env.example', 'yellow');

    if (fs.existsSync(envExamplePath)) {
      log(`   cp ${envExamplePath} ${envPath}`, 'cyan');
    }

    process.exit(1);
  }

  // Lire et parser le fichier .env
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};
  const lines = envContent.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const match = trimmed.match(/^([A-Z_]+)=(.+)$/);
    if (match) {
      const [, key, value] = match;
      envVars[key] = value.replace(/^["']|["']$/g, '');
    }
  }

  // Vérifier les variables requises
  const requiredVars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
  const missingVars = requiredVars.filter(v => !envVars[v]);

  if (missingVars.length > 0) {
    log('❌ Variables manquantes dans .env:', 'red');
    missingVars.forEach(v => log(`   - ${v}`, 'red'));
    process.exit(1);
  }

  // Générer le fichier env.local.js
  const jsContent = `/**
 * 🔐 Variables d'environnement pour développement sans bundler
 *
 * ⚠️  ATTENTION:
 * - Ce fichier est généré automatiquement depuis .env
 * - NE PAS MODIFIER MANUELLEMENT
 * - NE PAS COMMITER (déjà dans .gitignore)
 * - Pour mettre à jour: modifier .env puis lancer 'npm run gen-env-local'
 *
 * @generated ${new Date().toISOString()}
 */

// Injecter les variables d'environnement dans window.__ENV__
window.__ENV__ = {
  SUPABASE_URL: '${envVars.VITE_SUPABASE_URL}',
  SUPABASE_ANON_KEY: '${envVars.VITE_SUPABASE_ANON_KEY}',
  INFOMANIAK_API_URL: '${envVars.VITE_INFOMANIAK_API_URL || ''}',
  INFOMANIAK_API_KEY: '${envVars.VITE_INFOMANIAK_API_KEY || ''}',
  ACTIVE_PROVIDER: '${envVars.VITE_ACTIVE_PROVIDER || 'supabase'}'
};

console.log('✅ Variables d\\'environnement chargées depuis env.local.js');
`;

  // Écrire le fichier
  fs.writeFileSync(outputPath, jsContent, 'utf8');

  log('✅ Fichier env.local.js généré avec succès!', 'green');
  log(`📁 Emplacement: ${outputPath}`, 'cyan');
  log('\n💡 N\'oubliez pas de charger env.local.js AVANT env.js dans index.html\n', 'yellow');
}

main();
