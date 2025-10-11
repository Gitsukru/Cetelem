#!/bin/bash
# Script de build pour Netlify
# Génère env.local.js avec les variables d'environnement Netlify

echo "🔧 Netlify Build Script"
echo "======================="

# Créer le dossier si nécessaire
mkdir -p src/config

# Créer env.local.js avec les variables d'environnement Netlify
cat > src/config/env.local.js <<EOF
/**
 * 🔐 Variables d'environnement pour production
 * Généré automatiquement par Netlify
 */

window.__ENV__ = {
  SUPABASE_URL: '${VITE_SUPABASE_URL}',
  SUPABASE_ANON_KEY: '${VITE_SUPABASE_ANON_KEY}',
  INFOMANIAK_API_URL: '${VITE_INFOMANIAK_API_URL:-}',
  INFOMANIAK_API_KEY: '${VITE_INFOMANIAK_API_KEY:-}',
  ACTIVE_PROVIDER: '${VITE_ACTIVE_PROVIDER:-supabase}'
};

console.log('✅ Variables d\'environnement chargées (Netlify)');
EOF

echo "✅ env.local.js généré avec les variables Netlify"
echo ""
echo "Variables configurées:"
echo "  - SUPABASE_URL: ${VITE_SUPABASE_URL:0:30}..."
echo "  - SUPABASE_ANON_KEY: ${VITE_SUPABASE_ANON_KEY:0:30}..."
echo "  - ACTIVE_PROVIDER: ${VITE_ACTIVE_PROVIDER:-supabase}"
echo ""

# Vérifier que le fichier existe
if [ -f "src/config/env.local.js" ]; then
  echo "✅ Fichier créé: src/config/env.local.js ($(wc -c < src/config/env.local.js) bytes)"
  ls -lh src/config/env.local.js
else
  echo "❌ ERREUR: Le fichier n'a pas été créé!"
  exit 1
fi

echo ""
echo "🚀 Build terminé!"
