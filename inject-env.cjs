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
  const ADMIN_EMAIL = process.env.VITE_ADMIN_EMAIL || '';

  console.log('📦 Injection des variables d\'environnement...');
  console.log('   SUPABASE_URL:', SUPABASE_URL ? '✅ Défini' : '❌ Manquant');
  console.log('   SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? '✅ Défini' : '❌ Manquant');
  console.log('   ADMIN_EMAIL:', ADMIN_EMAIL ? '✅ Défini' : '❌ Manquant');

  // Créer le script d'injection
  const envScript = `
<!-- Variables d'environnement injectées par Netlify -->
<script>
  window.__ENV__ = {
    SUPABASE_URL: '${SUPABASE_URL}',
    SUPABASE_ANON_KEY: '${SUPABASE_ANON_KEY}',
    INFOMANIAK_API_URL: '',
    INFOMANIAK_API_KEY: '',
    ACTIVE_PROVIDER: '${ACTIVE_PROVIDER}',
    ADMIN_EMAIL: '${ADMIN_EMAIL}'
  };
  console.log('✅ Variables d\\'environnement chargées depuis Netlify');
</script>
`;

  // Injecter dans index.html
  let indexHtml = fs.readFileSync('index.html', 'utf8');
  indexHtml = indexHtml.replace('</head>', `${envScript}\n</head>`);
  fs.writeFileSync('index.html', indexHtml, 'utf8');
  console.log('✅ Variables d\'environnement injectées dans index.html');

  // Injecter dans admin.html
  let adminHtml = fs.readFileSync('admin.html', 'utf8');
  adminHtml = adminHtml.replace('</head>', `${envScript}\n</head>`);
  fs.writeFileSync('admin.html', adminHtml, 'utf8');
  console.log('✅ Variables d\'environnement injectées dans admin.html');

} catch (error) {
  console.error('❌ Erreur lors de l\'injection:', error.message);
  // Ne pas faire échouer le build si les variables manquent
  console.log('⚠️  Build continue sans configuration backend');
}
