#!/usr/bin/env node

/**
 * Script pour injecter les variables d'environnement dans index.html
 * Exécuté par Netlify lors du build
 */

const fs = require('fs');

try {
  // Lire les variables d'environnement Netlify
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
  const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';
  const ACTIVE_PROVIDER = process.env.VITE_ACTIVE_PROVIDER || 'supabase';

  console.log('📦 Injection des variables d\'environnement...');
  console.log('   SUPABASE_URL:', SUPABASE_URL ? '✅ Défini' : '❌ Manquant');
  console.log('   SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? '✅ Défini' : '❌ Manquant');

  // Créer le script d'injection
  const envScript = `
<!-- Variables d'environnement injectées par Netlify -->
<script>
  window.__ENV__ = {
    SUPABASE_URL: '${SUPABASE_URL}',
    SUPABASE_ANON_KEY: '${SUPABASE_ANON_KEY}',
    INFOMANIAK_API_URL: '',
    INFOMANIAK_API_KEY: '',
    ACTIVE_PROVIDER: '${ACTIVE_PROVIDER}'
  };
  console.log('✅ Variables d\\'environnement chargées depuis Netlify');
</script>
`;

  // Lire index.html
  let html = fs.readFileSync('index.html', 'utf8');

  // Injecter le script avant </head>
  html = html.replace('</head>', `${envScript}\n</head>`);

  // Écrire le fichier modifié
  fs.writeFileSync('index.html', html, 'utf8');

  console.log('✅ Variables d\'environnement injectées dans index.html');

} catch (error) {
  console.error('❌ Erreur lors de l\'injection:', error.message);
  // Ne pas faire échouer le build si les variables manquent
  console.log('⚠️  Build continue sans configuration backend');
}
