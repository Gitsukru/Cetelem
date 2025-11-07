# 🔧 Configuration des Variables d'Environnement sur Netlify

Ce guide explique comment configurer les clés API Supabase sur Netlify pour activer le mode groupe.

## 📋 Prérequis

1. Un compte Netlify avec le projet déployé
2. Un compte Supabase avec un projet créé
3. Les clés API Supabase (URL et Anon Key)

## 🔑 Obtenir les Clés Supabase

### 1. Accéder au Dashboard Supabase
- Aller sur [supabase.com](https://supabase.com)
- Se connecter à votre compte
- Sélectionner votre projet

### 2. Récupérer les Clés
1. Dans le menu latéral, cliquer sur **Settings** (⚙️)
2. Cliquer sur **API**
3. Copier les deux valeurs suivantes :
   - **Project URL** (commence par `https://xxx.supabase.co`)
   - **anon/public key** (clé publique, commence généralement par `eyJ...`)

## 🚀 Configurer sur Netlify

### Méthode 1 : Via le Dashboard Netlify (Recommandé)

1. **Accéder aux Variables d'Environnement**
   - Aller sur [app.netlify.com](https://app.netlify.com)
   - Sélectionner votre site (ex: cetelems)
   - Aller dans **Site settings** → **Environment variables**

2. **Ajouter les Variables**

   Cliquer sur **Add a variable** et ajouter les 2 variables suivantes :

   **Variable 1 :**
   ```
   Key:   VITE_SUPABASE_URL
   Value: https://YOUR-PROJECT.supabase.co
   ```
   *(Remplacer par votre propre URL Supabase)*

   **Variable 2 :**
   ```
   Key:   VITE_SUPABASE_ANON_KEY
   Value: YOUR-ANON-KEY-HERE
   ```
   *(Remplacer par votre propre clé Supabase)*

   **Variable 3 (Optionnelle) :**
   ```
   Key:   VITE_ACTIVE_PROVIDER
   Value: supabase
   ```

3. **Redéployer le Site**
   - Aller dans **Deploys**
   - Cliquer sur **Trigger deploy** → **Clear cache and deploy site**
   - Attendre que le déploiement se termine (1-2 minutes)

### Méthode 2 : Via Netlify CLI

Si vous préférez utiliser la ligne de commande :

```bash
# Installer Netlify CLI
npm install -g netlify-cli

# Se connecter
netlify login

# Lier le projet
netlify link

# Définir les variables
netlify env:set VITE_SUPABASE_URL "https://xxx.supabase.co"
netlify env:set VITE_SUPABASE_ANON_KEY "eyJhbGci..."
netlify env:set VITE_ACTIVE_PROVIDER "supabase"

# Redéployer
netlify deploy --prod
```

## ✅ Vérifier la Configuration

### 1. Après le Déploiement

Ouvrir la console du navigateur sur votre site Netlify et vérifier :

**Si les variables sont bien configurées :**
```
✅ Variables d'environnement chargées (Netlify)
✅ Supabase initialisé
```

**Si les variables ne sont PAS configurées :**
```
⚠️ Clés Supabase non configurées. Le mode groupe ne sera pas disponible.
⚠️ Backend non configuré - Mode groupe désactivé
💡 L'application fonctionne en mode local uniquement
```

### 2. Tester le Mode Groupe

1. Aller sur votre site : `https://cetelems.netlify.app`
2. Cliquer sur l'onglet **Groupe**
3. Essayer de créer un groupe
4. Si tout fonctionne ✅, les variables sont bien configurées
5. Si erreur ❌, vérifier les variables dans Netlify

## 🐛 Dépannage

### Erreur : "Invalid API key"

**Problème :** Les clés Supabase sont incorrectes ou mal copiées

**Solution :**
1. Vérifier qu'il n'y a pas d'espaces avant/après les clés
2. Vérifier que vous utilisez la **anon/public key** (pas la service_role key)
3. Vérifier que l'URL se termine bien par `.supabase.co`

### Erreur : "ENV non défini"

**Problème :** Les variables ne sont pas injectées dans le build

**Solution :**
1. Vérifier que le script `inject-env.py` est exécuté dans `netlify-build.sh`
2. Vérifier les logs de build Netlify pour voir si les variables sont bien présentes
3. Redéployer avec **Clear cache and deploy site**

### L'onglet Groupe est Grisé

**Problème :** Le backend n'est pas configuré

**Solution :**
1. Vérifier que les variables sont définies sur Netlify
2. Redéployer le site
3. Vider le cache du navigateur (Ctrl+F5)

### Erreur 401 Unauthorized

**Problème :** La clé API n'est pas valide pour ce projet Supabase

**Solution :**
1. Vérifier que l'URL et la clé proviennent du **même projet** Supabase
2. Vérifier que le projet Supabase est actif (pas pausé)
3. Regénérer la clé API si nécessaire

## 📊 Logs de Build Netlify

Pour voir si les variables sont bien injectées, regarder les logs de build :

```
🔧 Netlify Build Script
=======================
✅ Variables injectées dans index.html
  - SUPABASE_URL: https://YOUR-PROJECT-ID...
  - SUPABASE_ANON_KEY: eyJhbGciOiJIUzI1NiIsInR5cC...
  - ACTIVE_PROVIDER: supabase

🚀 Build terminé!
```

Si vous voyez des valeurs vides, c'est que les variables ne sont pas définies sur Netlify.

## 🔒 Sécurité

**IMPORTANT :**
- Ne JAMAIS committer les clés API dans Git
- Utiliser UNIQUEMENT la clé `anon/public` (pas la `service_role`)
- Les clés `anon` sont sécurisées et peuvent être exposées côté client
- Supabase gère la sécurité via RLS (Row Level Security)

## 📚 Ressources

- [Documentation Netlify - Variables d'environnement](https://docs.netlify.com/environment-variables/overview/)
- [Documentation Supabase - API Keys](https://supabase.com/docs/guides/api/api-keys)
- [Notre guide d'architecture backend](../architecture/BACKEND_ARCHITECTURE.md)

## ✉️ Support

Si vous rencontrez des problèmes :
1. Vérifier les logs Netlify
2. Vérifier la console du navigateur
3. Ouvrir une issue sur GitHub avec les logs (sans les clés API !)
