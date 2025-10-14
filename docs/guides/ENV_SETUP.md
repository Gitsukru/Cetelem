# 🔐 Configuration des Variables d'Environnement

## 📋 Vue d'ensemble

Ce projet utilise des variables d'environnement pour sécuriser les clés API Supabase.
Il supporte **deux modes de développement** :

1. **Avec Vite (recommandé)** : Variables chargées depuis `.env` via `import.meta.env`
2. **Sans Vite (mode legacy)** : Variables injectées via `env.local.js`

---

## 🚀 Configuration Initiale

### Étape 1 : Créer le fichier `.env`

```bash
# Copier le modèle
cp .env.example .env

# Éditer avec vos vraies valeurs Supabase
nano .env
```

### Étape 2 : Remplir les valeurs

Ouvrez `.env` et remplissez avec vos clés Supabase :

```env
# Supabase
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_cle_anon_ici

# Provider actif
VITE_ACTIVE_PROVIDER=supabase
```

---

## 🔧 Mode Développement

### Avec Vite (recommandé)

```bash
npm run dev
```

✅ Vite charge automatiquement les variables depuis `.env`
✅ Rechargement instantané (hot reload)
✅ Variables accessibles via `import.meta.env`

### Sans Vite (mode legacy - HTML direct)

```bash
# 1. Générer env.local.js depuis .env
npm run gen-env-local

# 2. Ouvrir index.html dans le navigateur
open index.html
```

✅ Variables injectées dans `window.__ENV__`
✅ Fonctionne sans bundler
⚠️  Régénérer `env.local.js` à chaque modification de `.env`

---

## 📦 Mode Production

### Build avec Vite

```bash
# Build de production
npm run build

# Preview du build
npm run preview
```

Le build Vite :
- ✅ Minifie le code (~70% de réduction)
- ✅ Injecte les variables d'environnement
- ✅ Supprime les `console.log`
- ✅ Génère des sourcemaps (si activé)

---

## 🔒 Sécurité

### ✅ Fichiers DÉJÀ dans `.gitignore`

```gitignore
.env
.env.local
src/config/env.local.js
```

### ❌ Ne JAMAIS commiter

- Vos vraies clés API Supabase
- Le fichier `.env`
- Le fichier `env.local.js` généré

### ✅ Commiter uniquement

- `.env.example` (avec des valeurs factices)
- Le code de configuration (`env.js`, `backend.config.js`)

---

## 🛠️ Scripts Disponibles

| Commande                | Description                                    |
| ----------------------- | ---------------------------------------------- |
| `npm run gen-env-local` | Générer `env.local.js` depuis `.env`           |
| `npm run sync-version`  | Synchroniser les versions dans tous les fichiers |
| `npm run dev`           | Lancer Vite dev server                         |
| `npm run build`         | Build de production avec Vite                  |

---

## 🔄 Workflow Complet

### Développement quotidien (avec Vite)

```bash
# 1. Créer .env (une seule fois)
cp .env.example .env
# Éditer .env avec vos vraies clés

# 2. Lancer le serveur
npm run dev
```

### Développement sans Vite

```bash
# 1. Créer .env (une seule fois)
cp .env.example .env
# Éditer .env avec vos vraies clés

# 2. Générer env.local.js
npm run gen-env-local

# 3. Ouvrir dans le navigateur
open index.html
```

### Déploiement en production

```bash
# 1. Vérifier que .env contient les bonnes clés
cat .env

# 2. Build
npm run build

# 3. Le dossier dist/ est prêt pour déploiement
```

---

## ❓ FAQ

### Q: Pourquoi deux systèmes (Vite + env.local.js) ?

**R:** Pour supporter les deux modes :
- **Vite** : Mode moderne avec bundling, hot reload, optimisations
- **Legacy** : Mode compatible sans tooling (index.html direct)

### Q: Quelle est la différence entre `.env` et `env.local.js` ?

**R:**
- `.env` : Fichier source avec les vraies valeurs (jamais commité)
- `env.local.js` : Généré automatiquement pour mode legacy (jamais commité)

### Q: Puis-je utiliser d'autres providers (Infomaniak) ?

**R:** Oui ! Modifiez `VITE_ACTIVE_PROVIDER` dans `.env` :

```env
VITE_ACTIVE_PROVIDER=infomaniak
VITE_INFOMANIAK_API_URL=https://api-zikirmatik.jelastic.infomaniak.com
VITE_INFOMANIAK_API_KEY=votre_cle
```

### Q: Comment vérifier que mes variables sont chargées ?

**R:** Ouvrez la console du navigateur :

```javascript
// Mode Vite
console.log(import.meta.env.VITE_SUPABASE_URL);

// Mode Legacy
console.log(window.__ENV__.SUPABASE_URL);

// Mode unifié (via ENV)
console.log(ENV.SUPABASE_URL);
```

---

## 🆘 Dépannage

### Erreur : "SUPABASE_URL manquant"

```bash
# Vérifier que .env existe
ls -la .env

# Vérifier le contenu
cat .env

# Si mode legacy, régénérer env.local.js
npm run gen-env-local
```

### Erreur : "env.local.js not found" en mode legacy

```bash
# Générer le fichier
npm run gen-env-local

# Vérifier qu'il est chargé dans index.html
grep "env.local.js" index.html
```

### Variables non mises à jour

```bash
# Mode Vite : redémarrer le serveur
Ctrl+C
npm run dev

# Mode Legacy : régénérer env.local.js
npm run gen-env-local
```

---

## 📚 Architecture

```
📁 Projet
├── 📄 .env                    ← Vos vraies clés (JAMAIS commité)
├── 📄 .env.example            ← Modèle avec valeurs factices
├── 📂 src/config/
│   ├── 📄 env.js              ← Logique de chargement (mode hybride)
│   ├── 📄 env.local.js        ← Généré (mode legacy, JAMAIS commité)
│   └── 📄 backend.config.js   ← Configuration backend
├── 📂 scripts/
│   └── 📄 generate-env-local.cjs  ← Script générateur
└── 📄 vite.config.js          ← Config Vite
```

---

## ✅ Checklist Sécurité

- [ ] `.env` contient vos vraies clés
- [ ] `.env` est dans `.gitignore`
- [ ] `env.local.js` est dans `.gitignore`
- [ ] `.env.example` ne contient QUE des valeurs factices
- [ ] Aucune clé API hardcodée dans le code source
- [ ] `git status` ne montre pas `.env` ni `env.local.js`

---

🎉 **C'est tout !** Vos variables d'environnement sont maintenant sécurisées.
