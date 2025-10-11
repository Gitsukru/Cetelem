#!/bin/bash
# Script de build pour Netlify
# Injecte les variables d'environnement directement dans index.html

echo "🔧 Netlify Build Script"
echo "======================="

# Créer un script inline avec les variables d'environnement
ENV_SCRIPT="<script>
window.__ENV__ = {
  SUPABASE_URL: '${VITE_SUPABASE_URL}',
  SUPABASE_ANON_KEY: '${VITE_SUPABASE_ANON_KEY}',
  INFOMANIAK_API_URL: '${VITE_INFOMANIAK_API_URL:-}',
  INFOMANIAK_API_KEY: '${VITE_INFOMANIAK_API_KEY:-}',
  ACTIVE_PROVIDER: '${VITE_ACTIVE_PROVIDER:-supabase}'
};
console.log('✅ Variables d'\''environnement chargées (Netlify)');
</script>"

# Remplacer la ligne qui charge env.local.js par le script inline
sed -i "s|<script src=\"src/config/env.local.js\"></script>|${ENV_SCRIPT}|g" index.html

echo "✅ Variables d'environnement injectées dans index.html"
echo ""
echo "Variables configurées:"
echo "  - SUPABASE_URL: ${VITE_SUPABASE_URL:0:30}..."
echo "  - SUPABASE_ANON_KEY: ${VITE_SUPABASE_ANON_KEY:0:30}..."
echo "  - ACTIVE_PROVIDER: ${VITE_ACTIVE_PROVIDER:-supabase}"
echo ""
echo "🚀 Build terminé!"
