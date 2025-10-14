#!/usr/bin/env python3
"""
Script pour injecter les variables d'environnement dans index.html
Utilisé par netlify-build.sh
"""

import os
import sys
import re
import json

# Récupérer les variables d'environnement
supabase_url = os.getenv('VITE_SUPABASE_URL', '')
supabase_key = os.getenv('VITE_SUPABASE_ANON_KEY', '')
infomaniak_url = os.getenv('VITE_INFOMANIAK_API_URL', '')
infomaniak_key = os.getenv('VITE_INFOMANIAK_API_KEY', '')
active_provider = os.getenv('VITE_ACTIVE_PROVIDER', 'supabase')

# Créer un objet JSON avec toutes les variables
env_vars = {
    'SUPABASE_URL': supabase_url,
    'SUPABASE_ANON_KEY': supabase_key,
    'INFOMANIAK_API_URL': infomaniak_url,
    'INFOMANIAK_API_KEY': infomaniak_key,
    'ACTIVE_PROVIDER': active_provider
}

# Lire index.html
with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Créer le script inline avec JSON.stringify pour éviter les problèmes d'échappement
env_json = json.dumps(env_vars)
env_script = f'''<script>
// Injecter les variables d'environnement
window.__ENV__ = {env_json};

// Créer un alias global ENV pour compatibilité avec backend.config.js
window.ENV = window.__ENV__;

console.log('✅ Variables d\\'environnement chargées (Netlify)');
</script>'''

# Remplacer la ligne qui charge env.local.js par le script inline
html = re.sub(
    r'<script src="src/config/env\.local\.js"></script>',
    env_script,
    html
)

# Supprimer aussi env.js qui cause des erreurs import.meta en production
html = re.sub(
    r'<script src="src/config/env\.js"></script>\n\s*',
    '',
    html
)

# Écrire le fichier modifié
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print('✅ Variables injectées dans index.html')
print(f'  - SUPABASE_URL: {supabase_url[:30]}...')
print(f'  - SUPABASE_ANON_KEY: {supabase_key[:30]}...')
print(f'  - ACTIVE_PROVIDER: {active_provider}')
