# 🔒 Guide de Sécurité - Çetelem

## ✅ Corrections de Sécurité Appliquées

### 1. **Protection des clés API**
- ✅ Les clés Supabase sont maintenant chargées depuis `src/config/env.js`
- ✅ Support des variables d'environnement (Vite)
- ✅ `.env` est dans `.gitignore` (protégé contre commit accidentel)
- ✅ Fichier `.env.example` fourni comme template

**Comment configurer** :
```bash
# 1. Copier le fichier exemple
cp .env.example .env

# 2. Éditer .env avec vos vraies valeurs
nano .env

# 3. NE JAMAIS commit .env !
```

### 2. **Gestion des erreurs robuste**
- ✅ `ErrorHandler` global capture toutes les erreurs non gérées
- ✅ `QuotaExceededError` détecté et géré gracieusement
- ✅ Notifications utilisateur pour erreurs critiques
- ✅ Dashboard de debug accessible (`errorHandler.showDashboard()`)

### 3. **Protection localStorage**
- ✅ Vérification du quota avant chaque sauvegarde
- ✅ Alertes utilisateur si stockage presque plein
- ✅ Gestion spécifique `QuotaExceededError`

### 4. **Synchronisation des versions**
- ✅ Version unique source : `package.json` (3.4.1)
- ✅ `manifest.json` et `sw.js` synchronisés

### 5. **Race conditions**
- ✅ `groupManager.updateMyScore()` avec gestion d'erreur asynchrone

---

## 🔐 Recommandations Supabase

### Row Level Security (RLS)

**⚠️ IMPORTANT** : Les politiques RLS doivent être activées sur Supabase pour une sécurité maximale.

#### Politique pour `groups` :
```sql
-- Tout le monde peut lire les groupes par code
CREATE POLICY "Anyone can read groups by code" ON groups
  FOR SELECT
  USING (true);

-- Seul le créateur peut modifier
CREATE POLICY "Creator can update group" ON groups
  FOR UPDATE
  USING (auth.uid() = creator_id);
```

#### Politique pour `participants` :
```sql
-- Participants peuvent lire leur groupe
CREATE POLICY "Read own group participants" ON participants
  FOR SELECT
  USING (
    group_id IN (
      SELECT group_id FROM participants
      WHERE id = auth.uid()
    )
  );

-- Chaque participant peut modifier ses propres données
CREATE POLICY "Update own participant data" ON participants
  FOR UPDATE
  USING (id = auth.uid());
```

#### Politique pour `category_notes` :
```sql
-- Lire les notes publiques de son groupe
CREATE POLICY "Read group notes" ON category_notes
  FOR SELECT
  USING (
    group_id IN (
      SELECT group_id FROM participants
      WHERE id = auth.uid()
    )
  );

-- Modifier ses propres notes
CREATE POLICY "Update own notes" ON category_notes
  FOR UPDATE
  USING (participant_id = auth.uid());
```

---

## 🚨 Points de Vigilance

### 1. **Clé ANON exposée**
Même avec RLS, la clé ANON reste visible côté client. C'est normal pour une clé publique, mais :
- ✅ RLS DOIT être activé sur toutes les tables
- ✅ Limiter les permissions de la clé ANON dans Supabase
- ✅ Monitorer les requêtes suspectes

### 2. **localStorage = Local uniquement**
- Les notes privées sont en `localStorage` (sécurisé ✅)
- Si l'utilisateur change d'appareil → notes privées perdues
- Solution : Exporter/importer ou utiliser le système de backup par code

### 3. **Pas de rate limiting**
Actuellement aucune protection contre spam. À implémenter :
- Limiter créations de groupes (max 5/jour)
- Limiter mises à jour score (debounce déjà en place ✅)

---

## 🔧 Migration vers Production

### Option 1 : Bundler (Vite) - **RECOMMANDÉ**
```bash
# Installer Vite
npm install -D vite

# Créer vite.config.js
# Les variables .env seront automatiquement injectées

# Build pour production
npm run build
```

### Option 2 : Sans bundler (actuel)
- Garder `src/config/env.js` comme fallback
- Documenter clairement : "Ne pas commit les vraies clés"
- Utiliser un script de build pour remplacer les clés

---

## 📊 Monitoring Recommandé

### Services gratuits :
1. **Sentry** (erreurs JavaScript)
   - 5k événements/mois gratuit
   - Intégration : 5 lignes de code

2. **LogRocket** (session replay)
   - 1k sessions/mois gratuit
   - Debug user issues

3. **Supabase Dashboard**
   - Logs SQL
   - Monitoring en temps réel

---

## ✅ Checklist Sécurité

Avant déploiement :
- [ ] RLS activé sur toutes les tables Supabase
- [ ] `.env` dans `.gitignore`
- [ ] Clés de production différentes de dev
- [ ] ErrorHandler en place
- [ ] Tests de quota localStorage
- [ ] Monitoring actif (Sentry ou équivalent)
- [ ] Backup automatique fonctionnel
- [ ] Rate limiting sur backend (futur)

---

## 🆘 En cas de Problème

### Clé API compromise
```bash
# 1. Générer nouvelle clé dans Supabase Dashboard
# 2. Révoquer l'ancienne
# 3. Mettre à jour .env (ou env.js si pas de bundler)
# 4. Redéployer
```

### Erreurs utilisateur
```javascript
// Voir dashboard erreurs
errorHandler.showDashboard()

// Exporter logs
console.log(errorHandler.exportErrors())
```

### localStorage plein
```javascript
// Vérifier utilisation
QuotaMonitor.dashboard()

// Nettoyer vieilles données
// (implémenter un système de rétention)
```

---

## 📞 Support

Pour questions sécurité : contact@zikirmatik.app
