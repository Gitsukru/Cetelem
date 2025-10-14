# 🛠️ Scripts - Utilitaires et automatisation

Ce dossier contient les scripts utilitaires pour le build, le déploiement et la maintenance.

## 📜 Scripts disponibles

### `inject-env.py`
Script Python pour injecter les variables d'environnement dans le code.

**Usage:**
```bash
python3 scripts/inject-env.py
```

**Fonction:**
- Lit les variables d'environnement (.env)
- Injecte dans les fichiers de configuration
- Génère src/config/env.local.js

**Quand l'utiliser:**
- Avant le build de production
- Lors du changement de configuration
- En CI/CD

### `netlify-build.sh`
Script de build pour Netlify (déploiement automatique).

**Usage:**
```bash
bash scripts/netlify-build.sh
```

**Fonction:**
- Exécute les étapes de build
- Copie les fichiers nécessaires
- Prépare le dossier de déploiement

**Configuration:**
- Défini dans `netlify.toml`
- Exécuté automatiquement par Netlify
- Ne pas exécuter manuellement (sauf debug)

### `tesbih-click.js`
Script pour générer/tester les sons de clic du tesbih.

**Usage:**
```javascript
// Dans la console du navigateur
<script src="scripts/tesbih-click.js"></script>
```

**Fonction:**
- Génère des sons de clic synthétiques (Web Audio API)
- Teste la latence audio
- Aide au debugging audio

**Utile pour:**
- Développement des effets sonores
- Tests de performance audio
- Debug de latence

## 🚀 Utilisation en développement

### Build local
```bash
# Si vous utilisez Vite
npm run build

# Netlify build (simulation)
bash scripts/netlify-build.sh
```

### Injection des variables d'environnement
```bash
# Créer .env depuis .env.example
cp .env.example .env

# Éditer avec vos valeurs
nano .env

# Injecter dans le code
python3 scripts/inject-env.py
```

## 📦 Scripts npm (package.json)

Ces scripts sont définis dans `package.json` à la racine :

```bash
# Développement
npm run dev          # Serveur de développement Vite

# Production
npm run build        # Build optimisé avec Vite
npm run preview      # Prévisualiser le build

# Tests
npm test             # Lancer Jest (si configuré)
npm run test:watch   # Tests en mode watch
npm run test:coverage # Rapport de couverture

# Serveur simple
npm run serve        # Serveur HTTP simple (port 8000)
```

## 🔧 Personnalisation

### Ajouter un nouveau script

1. **Créer le fichier:**
```bash
touch scripts/mon-script.sh
chmod +x scripts/mon-script.sh
```

2. **Ajouter dans package.json:**
```json
{
  "scripts": {
    "mon-script": "bash scripts/mon-script.sh"
  }
}
```

3. **Utiliser:**
```bash
npm run mon-script
```

### Script bash template:
```bash
#!/bin/bash
# Description du script

set -e  # Arrêter en cas d'erreur

echo "🚀 Démarrage du script..."

# Votre code ici

echo "✅ Script terminé avec succès"
```

### Script Python template:
```python
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Description du script"""

import os
import sys

def main():
    print("🚀 Démarrage du script...")

    # Votre code ici

    print("✅ Script terminé avec succès")

if __name__ == "__main__":
    main()
```

## ⚙️ Configuration CI/CD

### GitHub Actions
Si vous configurez GitHub Actions, créez `.github/workflows/deploy.yml`:

```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node
        uses: actions/setup-node@v2
        with:
          node-version: '16'
      - name: Install
        run: npm install
      - name: Build
        run: npm run build
```

### Netlify
Configuration dans `netlify.toml` (déjà configuré):
```toml
[build]
  command = "bash scripts/netlify-build.sh"
  publish = "."
```

## 🐛 Debugging

### Script ne s'exécute pas?
```bash
# Vérifier les permissions
ls -la scripts/

# Donner les droits d'exécution
chmod +x scripts/mon-script.sh

# Vérifier le shebang
head -1 scripts/mon-script.sh
```

### Variables d'environnement manquantes?
```bash
# Vérifier que .env existe
ls -la .env

# Vérifier le contenu (sans afficher les secrets!)
grep "VITE_" .env | sed 's/=.*/=***/'

# Réinjecter
python3 scripts/inject-env.py
```

## 📝 Bonnes pratiques

1. **Toujours utiliser `set -e`** dans les scripts bash (arrêt en cas d'erreur)
2. **Ajouter des logs clairs** (🚀 début, ✅ succès, ❌ erreur)
3. **Documenter les arguments** requis
4. **Tester localement** avant de commit
5. **Versionner les scripts** avec git
6. **Ne jamais commit de secrets** dans les scripts

## 📧 Contact

Pour questions sur les scripts :
- 📧 dev@zikirmatik.app
- 🐛 [GitHub Issues](https://github.com/Gitsukru/Cetelem/issues)
