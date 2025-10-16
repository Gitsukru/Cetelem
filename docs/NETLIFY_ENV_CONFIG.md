# 🔧 Configuration Variables d'Environnement Netlify

## 🚨 Problème

Lorsque l'application est déployée sur Netlify, l'erreur suivante apparaît :

```
POST https://sxtcyznkxtlcgkgrdrbi.supabase.co/rest/v1/groups 401 (Unauthorized)
Error: Invalid API key
```

**Symptômes :**
- ✅ Fonctionne en localhost
- ❌ Erreur 401 sur cetelems.netlify.app
- Message : "Invalid API key" même si la clé est correcte dans `.env`

## 🎯 Cause Racine

Le fichier `.env` contenant les clés API est dans `.gitignore` et **n'est jamais poussé sur GitHub**.

Netlify ne peut donc pas accéder aux variables d'environnement, et le script `scripts/inject-env.py` récupère des valeurs **vides** lors du build :

```python
# Dans inject-env.py
supabase_url = os.getenv('VITE_SUPABASE_URL', '')  # ❌ Retourne '' si non configuré
supabase_key = os.getenv('VITE_SUPABASE_ANON_KEY', '')  # ❌ Retourne '' si non configuré
```

## ✅ Solution

### Étape 1 : Récupérer les valeurs depuis `.env` local

```bash
# Dans le terminal local
cat .env
```

Vous devriez voir :
```bash
VITE_SUPABASE_URL=https://sxtcyznkxtlcgkgrdrbi.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_ACTIVE_PROVIDER=supabase
```

### Étape 2 : Ajouter les variables dans Netlify Dashboard

1. **Aller sur Netlify Dashboard** : https://app.netlify.com
2. Cliquer sur votre site **cetelems**
3. **Site settings** → **Environment variables** (dans le menu gauche)
4. Cliquer sur **"Add a variable"**
5. Ajouter ces 3 variables **une par une** :

| Key | Value |
|-----|-------|
| `VITE_SUPABASE_URL` | `https://sxtcyznkxtlcgkgrdrbi.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (copier depuis .env) |
| `VITE_ACTIVE_PROVIDER` | `supabase` |

**Important :**
- ✅ L'ordre n'a **aucune importance**
- ✅ Copier-coller les valeurs **exactement** depuis `.env`
- ✅ Pas d'espaces avant/après les valeurs
- ✅ Pas de guillemets autour des valeurs

### Étape 3 : Déclencher un redéploiement

**Option A : Via Netlify Dashboard**
1. Aller sur l'onglet **"Deploys"**
2. Cliquer sur **"Trigger deploy"** → **"Deploy site"**

**Option B : Via Git (recommandé)**
```bash
git commit --allow-empty -m "chore: Trigger Netlify redeploy after adding env variables"
git push
```

### Étape 4 : Vérifier le build

1. Aller sur https://app.netlify.com/sites/cetelems/deploys
2. Attendre que le statut passe à **"Published"** (voyant vert)
3. Temps estimé : **2-3 minutes**

### Étape 5 : Tester

1. Aller sur **https://cetelems.netlify.app**
2. **Vider le cache** : `Cmd+Shift+R` (Mac) ou `Ctrl+Shift+R` (Windows)
3. Ou ouvrir en **mode incognito** : `Cmd+Shift+N`
4. Tester la création de groupe

**Résultat attendu :**
- ✅ Pas d'erreur 401
- ✅ Groupe créé avec code (ex: ABC123)
- ✅ Fonctionne sur Chrome, Safari, Firefox, Edge

## 🔍 Vérification dans la Console

Après le déploiement, ouvrir la console navigateur (F12) sur cetelems.netlify.app :

```javascript
// Vérifier que les variables sont bien chargées
console.log('SUPABASE_URL:', window.__ENV__.SUPABASE_URL);
console.log('SUPABASE_KEY (50 chars):', window.__ENV__.SUPABASE_ANON_KEY.substring(0, 50));
```

**Résultat attendu :**
```
SUPABASE_URL: https://sxtcyznkxtlcgkgrdrbi.supabase.co
SUPABASE_KEY (50 chars): eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJ...
```

Si vous voyez `undefined` ou des chaînes vides, les variables ne sont pas configurées correctement.

## 🛠️ Dépannage

### Erreur persiste après ajout des variables

**Cause :** Les variables ont été ajoutées mais le site n'a pas été redéployé.

**Solution :** Déclencher manuellement un redéploiement (voir Étape 3 ci-dessus).

### Variables présentes mais erreur 401 persiste

**Cause possible 1 :** Cache navigateur

**Solution :**
1. Vider cache : `Cmd+Shift+R`
2. Ou tester en mode incognito

**Cause possible 2 :** Clé API expirée ou invalide

**Solution :**
1. Aller sur Supabase Dashboard : https://supabase.com/dashboard/project/sxtcyznkxtlcgkgrdrbi/settings/api
2. Copier la clé **"anon public"**
3. Mettre à jour dans Netlify → Environment variables
4. Redéployer

### Build Netlify échoue

**Vérifier les logs :**
1. Aller sur https://app.netlify.com/sites/cetelems/deploys
2. Cliquer sur le build qui a échoué
3. Lire les logs pour identifier l'erreur

**Erreur commune :** `python3: command not found`

**Solution :** Le script `inject-env.py` nécessite Python 3. Vérifier que `NODE_VERSION = "18"` est bien dans `netlify.toml`.

## 📋 Checklist Complète

- [ ] Récupérer les valeurs depuis `.env` local
- [ ] Ajouter `VITE_SUPABASE_URL` dans Netlify
- [ ] Ajouter `VITE_SUPABASE_ANON_KEY` dans Netlify
- [ ] Ajouter `VITE_ACTIVE_PROVIDER` dans Netlify
- [ ] Déclencher redéploiement (git push ou Netlify UI)
- [ ] Attendre fin du build (2-3 min)
- [ ] Tester sur cetelems.netlify.app en mode incognito
- [ ] Vérifier console pour `window.__ENV__`

## 📚 Fichiers Impliqués

- **`scripts/netlify-build.sh`** : Script appelé par Netlify lors du build
- **`scripts/inject-env.py`** : Script Python qui injecte les variables dans index.html
- **`netlify.toml`** : Configuration Netlify (ligne `command = "bash scripts/netlify-build.sh"`)
- **`.env`** : Variables locales (jamais commit, dans .gitignore)

## 🔗 Liens Utiles

- **Netlify Dashboard** : https://app.netlify.com/sites/cetelems
- **Supabase Dashboard** : https://supabase.com/dashboard/project/sxtcyznkxtlcgkgrdrbi
- **Site Production** : https://cetelems.netlify.app

---

**Dernière mise à jour :** 2025-10-16
**Auteur :** Claude Code
**Commit :** 5d5f143 - chore: Trigger Netlify redeploy after adding env variables
