# 🚀 Configuration Netlify pour Çetelem

## 📋 Variables d'Environnement Requises

Pour que l'application fonctionne sur Netlify, vous devez configurer les variables d'environnement suivantes:

### Dans Netlify Dashboard

1. **Allez dans:** Site settings → Build & deploy → Environment
2. **Ajoutez ces variables:**

```
VITE_SUPABASE_URL=https://sxtcyznkxtlcgkgrdrbi.supabase.co
VITE_SUPABASE_ANON_KEY=votre_clé_anon_supabase
VITE_ACTIVE_PROVIDER=supabase
```

### Où Trouver les Valeurs ?

- **VITE_SUPABASE_URL** et **VITE_SUPABASE_ANON_KEY** :
  - Supabase Dashboard → Settings → API
  - Copier "Project URL" et "anon/public" key

---

## 🔧 Comment Ça Fonctionne

### 1. Build Script (`netlify-build.sh`)
- Exécuté automatiquement par Netlify avant chaque déploiement
- Génère `src/config/env.local.js` avec les variables d'environnement Netlify
- Injecte les valeurs dans `window.__ENV__`

### 2. Configuration (`netlify.toml`)
- Définit la commande de build
- Configure les headers HTTP (sécurité + MIME types)
- Définit les règles de cache
- Configure la redirection SPA

### 3. Chargement Runtime
- `index.html` charge `env.local.js` **EN PREMIER**
- `env.js` détecte `window.__ENV__` et l'utilise
- L'application fonctionne sans bundler (Vite)

---

## 🐛 Dépannage

### Erreur: "Cannot use 'import.meta' outside a module"
✅ **Corrigé** - `env.js` utilise maintenant un helper sécurisé qui gère les deux modes

### Erreur: "MIME type 'text/html' is not executable"
✅ **Corrigé** - `netlify.toml` force `Content-Type: application/javascript` pour tous les `.js`

### Erreur: "ENV non défini"
- Vérifiez que les variables d'environnement sont configurées dans Netlify
- Vérifiez que `netlify-build.sh` s'est bien exécuté (voir logs de build)
- Vérifiez que `env.local.js` est généré (Netlify Functions → Build log)

---

## 📊 Vérification Post-Déploiement

Après déploiement, ouvrez la console du navigateur sur votre site Netlify:

```javascript
// Devrait afficher: "✅ Variables d'environnement chargées (Netlify)"
console.log(window.__ENV__)
// Devrait afficher: { SUPABASE_URL: "...", SUPABASE_ANON_KEY: "...", ... }
```

Si vous voyez `undefined`, le build script n'a pas fonctionné.

---

## 🔄 Workflow de Déploiement

### Développement Local
```bash
# Créer .env avec vos vraies clés
npm run gen-env-local  # Génère env.local.js
# Ouvrir index.html dans le navigateur
```

### Production Netlify
1. Push vers GitHub
2. Netlify détecte le push
3. Execute `netlify-build.sh`
4. Génère `env.local.js` avec les variables Netlify
5. Publie le site

---

## 🔐 Sécurité

✅ **Bonnes Pratiques Appliquées:**
- `.env` est dans `.gitignore` (jamais commité)
- `env.local.js` est dans `.gitignore` (généré au build)
- Les clés sont injectées via variables d'environnement Netlify (sécurisées)
- Headers de sécurité configurés (X-Frame-Options, CSP, etc.)
- RLS activé sur Supabase (protection base de données)

⚠️ **Important:**
- Ne JAMAIS commit `.env` ou `env.local.js`
- Ne JAMAIS hardcoder les clés API dans le code
- Utiliser Row Level Security sur Supabase
- Activer rate limiting si disponible

---

## 📝 Checklist Déploiement

- [ ] Variables d'environnement configurées dans Netlify
- [ ] `netlify-build.sh` est exécutable (`chmod +x`)
- [ ] `netlify.toml` contient la commande de build
- [ ] `.gitignore` contient `env.local.js` et `.env`
- [ ] RLS activé sur Supabase
- [ ] Test de l'app en production
- [ ] Console sans erreurs

---

## 🆘 Support

En cas de problème:
1. Vérifier les logs de build Netlify
2. Vérifier la console navigateur (erreurs JS)
3. Vérifier `window.__ENV__` dans la console
4. Vérifier que les variables Netlify sont bien définies

---

**Dernière mise à jour:** 2025-10-11
**Version:** 3.5.1
