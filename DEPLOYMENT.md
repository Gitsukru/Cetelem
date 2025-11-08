# Guide de Déploiement - Phase 1 (10k utilisateurs)

## Actions requises avant déploiement

### 1. Exécuter les scripts SQL dans Supabase

**Script 1: Ajouter updated_at aux groupes**
- Fichier: `supabase/add-groups-updated-at.sql`
- Raison: Corriger la métrique "Durée Vie Moyenne" qui affiche 0 jours
- Accès: Supabase Dashboard > SQL Editor
- Actions:
  - Ajoute colonne `updated_at` à la table `groups`
  - Crée trigger automatique pour mise à jour
  - Initialise `updated_at = created_at` pour groupes existants

**Script 2: Scalabilité RLS pour 10k utilisateurs**
- Fichier: `supabase/rls-for-10k-users.sql`
- Raison: Augmenter limites RLS pour supporter 10 000 utilisateurs simultanés
- Accès: Supabase Dashboard > SQL Editor
- Modifications:
  - Groupes: 10/h → 500/h (pour 5% de 10k users créant groupes)
  - Analytics: 100/h → 5000/h (pour 10k × 2 événements/jour)
  - Index performance sur `created_at`, `updated_at`
  - Nettoyage automatique: groupes inactifs >365 jours supprimés

**Procédure:**
```
1. Se connecter à Supabase Dashboard
2. Aller dans SQL Editor
3. Copier-coller le contenu de supabase/add-groups-updated-at.sql
4. Exécuter (Run)
5. Vérifier le résultat (2 requêtes SELECT à la fin pour confirmation)
6. Répéter pour supabase/rls-for-10k-users.sql
```

### 2. Configuration Sentry (Optionnel - Recommandé)

**Prérequis:**
- Recommandé pour 10k+ utilisateurs
- Gratuit jusqu'à 5000 erreurs/mois

**Étapes:**
```
1. Créer compte sur https://sentry.io
2. Créer nouveau projet type "JavaScript"
3. Copier le DSN fourni (format: https://key@sentry.io/project-id)
4. Créer fichier .env à la racine (copier .env.example)
5. Ajouter: VITE_SENTRY_DSN=votre_dsn_ici
6. Redéployer sur Netlify avec la variable d'environnement
```

**Sans configuration:**
- Sentry reste inactif (détection automatique DSN manquant)
- Pas d'impact sur fonctionnement de l'app
- Console.error reste actif en production (limité 50 messages)

### 3. Déployer le code

```bash
# Pousser vers GitHub
git push origin main

# Netlify déploie automatiquement depuis main
# Vérifier sur: https://app.netlify.com/sites/votre-site/deploys
```

### 4. Vérifications post-déploiement

**Dashboard Admin:**
```
1. Aller sur /admin.html
2. Se connecter avec code admin
3. Vérifier "Analytics Groupes":
   - ✅ Groupes Actifs: doit afficher nombre > 0
   - ✅ Taille Moyenne: doit afficher X.X participants/groupe
   - ✅ Durée Vie Moyenne: doit afficher X jours
```

**Bouton Mise à jour:**
```
1. Ouvrir l'app dans navigateur (Chrome, Opera, Safari)
2. Faire un changement mineur et redéployer
3. Attendre 30 secondes
4. Cliquer sur bouton "MAJ" qui apparaît
5. Page doit se recharger automatiquement avec nouvelle version
6. Pas besoin de Ctrl+Shift+R
```

**Console en production:**
```
1. Ouvrir DevTools (F12)
2. Vérifier que console.log() ne s'affiche plus
3. console.error() et console.warn() restent visibles
```

**Sentry (si configuré):**
```
1. Déclencher une erreur volontaire (ex: modifier code temporairement)
2. Vérifier sur sentry.io > Issues
3. Erreur doit apparaître avec contexte (user-agent, langue, etc)
```

## Résumé des améliorations Phase 1

### Scalabilité
- RLS policies: 10/h → 500/h (groupes), 100/h → 5000/h (analytics)
- Index performance ajoutés sur colonnes temporelles
- Nettoyage automatique groupes inactifs >365 jours

### Sécurité
- Console.log désactivé en production (359 occurrences)
- XSS critique corrigé: participant.name échappé dans leaderboard
- 20 innerHTML restants (non-critiques, contenu statique)

### Monitoring
- Sentry intégré avec filtrage intelligent (NetworkError, extensions ignorées)
- Échantillonnage 10% pour économiser quota gratuit
- Breadcrumbs pour tracer navigation utilisateur

### Conformité
- Politique RGPD complète: privacy-policy.html
- Données collectées, usage, droits utilisateur documentés
- Services tiers listés (Supabase, Sentry, Netlify)

## Support

**Problèmes déploiement:**
- Vérifier Netlify Build Log pour erreurs
- Vérifier Supabase SQL Editor pour erreurs d'exécution
- Vérifier Console navigateur pour erreurs JavaScript

**Métriques toujours à 0:**
- Confirmer que add-groups-updated-at.sql a été exécuté
- Vérifier que trigger existe: `SELECT * FROM information_schema.triggers WHERE trigger_name = 'set_updated_at'`
- Attendre 24h pour données analytics (calcul quotidien)

**Bouton MAJ ne fonctionne pas:**
- Vider cache navigateur manuellement une fois (Ctrl+Shift+R)
- Netlify headers doivent être actifs (vérifier netlify.toml présent)
- Service Worker doit être enregistré (vérifier Application > Service Workers)
