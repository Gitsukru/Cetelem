# 🔒 Guide d'Activation Row Level Security (RLS)

## 📋 Vue d'ensemble

Row Level Security (RLS) est une fonctionnalité de PostgreSQL/Supabase qui permet de contrôler l'accès aux lignes de la base de données au niveau de chaque utilisateur.

**Pourquoi RLS est important:**
- ✅ Protection des données sensibles
- ✅ Contrôle d'accès granulaire
- ✅ Sécurité côté serveur (pas seulement client)
- ✅ Prévention des abus et manipulations

---

## 🎯 État Actuel

### Tables à sécuriser:

| Table | Utilisation | RLS Status |
|-------|-------------|------------|
| `groups` | Groupes de zikir | ❌ À activer |
| `participants` | Participants aux groupes | ❌ À activer |
| `device_backups` | Codes de transfert d'appareil | ❌ À activer |
| `analytics_events` | Événements de tracking | ❌ À activer |
| `analytics_summary` | Résumés analytics | ❌ À activer |
| `category_notes` | Notes des catégories | ❌ À activer |

---

## 🚀 Activation Étape par Étape

### Étape 1: Accéder à Supabase Dashboard

1. Ouvrir https://supabase.com/dashboard
2. Se connecter avec votre compte
3. Sélectionner le projet: **YOUR-PROJECT-ID**
4. Aller dans **"SQL Editor"** (icône 📝 dans la barre latérale)

### Étape 2: Vérifier la Structure des Tables

Avant d'activer RLS, vérifier que toutes les tables existent:

```sql
-- Lister toutes les tables publiques
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

✅ **Attendu:** `groups`, `participants`, `device_backups`, etc.

### Étape 3: Activer RLS sur Chaque Table

#### Option A: Via SQL Editor (Recommandé)

Ouvrir le fichier `supabase/rls-policies.sql` et exécuter les sections dans l'ordre:

1. **Groups Table** (Section 1)
   ```sql
   ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
   -- + policies
   ```

2. **Participants Table** (Section 2)
   ```sql
   ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
   -- + policies
   ```

3. **Device Backups Table** (Section 3)
   ```sql
   ALTER TABLE device_backups ENABLE ROW LEVEL SECURITY;
   -- + policies
   ```

4. **Analytics Tables** (Sections 4-5)

5. **Category Notes Table** (Section 6)

#### Option B: Via Dashboard UI

1. Aller dans **"Table Editor"**
2. Sélectionner une table (ex: `groups`)
3. Cliquer sur **"RLS"** en haut à droite
4. Activer **"Enable RLS"**
5. Cliquer **"Add Policy"**
6. Configurer selon `rls-policies.sql`

⚠️ **Note:** L'option SQL est plus rapide et reproductible.

### Étape 4: Créer les Index de Performance

Après avoir activé RLS, créer les index pour optimiser les requêtes:

```sql
-- Copier-coller la section "INDEXES POUR PERFORMANCE"
-- depuis rls-policies.sql
CREATE INDEX IF NOT EXISTS idx_groups_code ON groups(code);
CREATE INDEX IF NOT EXISTS idx_participants_group_id ON participants(group_id);
-- etc.
```

### Étape 5: Vérifier l'Activation

Exécuter les requêtes de vérification:

```sql
-- Vérifier RLS activé
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

✅ **Attendu:** Toutes les tables doivent avoir `rowsecurity = true`

```sql
-- Lister les politiques créées
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

✅ **Attendu:** Au moins 15-20 politiques créées

---

## 🧪 Tests de Validation

### Test 1: Créer un Groupe

```javascript
// Dans la console du navigateur (http://localhost:8888)
const { data, error } = await groupManager.provider.supabase
  .from('groups')
  .insert({ code: 'TEST01', name: 'Test Group' })
  .select()
  .single();

console.log('✅ Groupe créé:', data);
console.log('❌ Erreur:', error);
```

✅ **Attendu:** `data` contient le groupe créé, `error` est `null`

### Test 2: Lire les Groupes

```javascript
const { data, error } = await groupManager.provider.supabase
  .from('groups')
  .select('*')
  .limit(5);

console.log('✅ Groupes:', data);
console.log('❌ Erreur:', error);
```

✅ **Attendu:** `data` contient la liste des groupes

### Test 3: Backup d'Appareil

```javascript
const code = await DeviceBackup.createBackup();
console.log('✅ Code de backup:', code);

const restored = await DeviceBackup.restoreBackup(code);
console.log('✅ Données restaurées:', restored);
```

✅ **Attendu:** Backup créé et restauré avec succès

### Test 4: Analytics

```javascript
await analytics.track('Test Event', { test: true });
console.log('✅ Événement analytics enregistré');
```

✅ **Attendu:** Pas d'erreur dans la console

---

## 📊 Monitoring Post-Activation

### Dashboard Supabase

1. **Métriques à surveiller:**
   - **Database** > **Activity**: Requêtes par seconde
   - **Database** > **Logs**: Erreurs RLS denied
   - **API** > **Usage**: Nombre de requêtes

2. **Alertes recommandées:**
   - Taux d'erreur > 5%
   - CPU database > 80%
   - Stockage > 90%

### Console JavaScript

Ajouter ce code pour logger les erreurs RLS:

```javascript
// Dans src/utils/error-handler.js
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason?.message?.includes('RLS')) {
    console.error('🔒 Erreur RLS détectée:', event.reason);
    analytics.track('RLS Error', {
      message: event.reason.message,
      table: event.reason.table || 'unknown'
    });
  }
});
```

---

## 🛠️ Dépannage

### Erreur: "new row violates row-level security policy"

**Cause:** La politique RLS bloque l'insertion/mise à jour

**Solution:**
1. Vérifier que la politique `INSERT` existe et permet l'opération
2. Vérifier que `WITH CHECK (true)` est bien défini
3. Tester la requête manuellement dans SQL Editor

```sql
-- Vérifier les politiques INSERT
SELECT * FROM pg_policies
WHERE tablename = 'groups'
  AND cmd = 'INSERT';
```

### Erreur: "permission denied for table"

**Cause:** RLS activé mais aucune politique créée

**Solution:**
1. Créer au minimum une politique SELECT:
   ```sql
   CREATE POLICY "allow_read" ON groups
     FOR SELECT USING (true);
   ```

### Performances Dégradées

**Cause:** Politiques RLS complexes ou manque d'index

**Solution:**
1. Vérifier les index sur les colonnes filtrées dans les politiques
2. Simplifier les politiques si possible
3. Utiliser `EXPLAIN ANALYZE` pour analyser les requêtes

```sql
EXPLAIN ANALYZE
SELECT * FROM participants
WHERE group_id = 'xxx';
```

### Erreur: "could not serialize access"

**Cause:** Conflit de transaction avec RLS

**Solution:**
1. Utiliser `retry` avec exponential backoff (déjà implémenté)
2. Réduire le nombre d'opérations concurrentes

---

## 🔐 Amélioration Future: Authentification

Actuellement, l'app fonctionne en mode **anonyme** (pas de login). Les politiques RLS permettent tout (`USING true`).

### Migration vers Supabase Auth

Pour renforcer la sécurité à l'avenir:

#### 1. Ajouter l'authentification

```javascript
// Authentification anonyme (pas de login requis)
const { data, error } = await supabase.auth.signInAnonymously();
```

#### 2. Modifier les politiques RLS

```sql
-- Exemple: Seul le créateur peut modifier le groupe
CREATE POLICY "groups_update_owner" ON groups
  FOR UPDATE
  USING (auth.uid() = creator_user_id);

-- Exemple: Seul le participant peut mettre à jour son score
CREATE POLICY "participants_update_own" ON participants
  FOR UPDATE
  USING (auth.uid()::text = user_id);
```

#### 3. Ajouter user_id aux tables

```sql
-- Migration: Ajouter colonne user_id
ALTER TABLE participants
ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Mettre à jour les politiques
CREATE POLICY "participants_select_own" ON participants
  FOR SELECT
  USING (auth.uid() = user_id OR group_id IN (
    SELECT group_id FROM participants WHERE user_id = auth.uid()
  ));
```

---

## ✅ Checklist de Déploiement

Avant de mettre en production:

- [ ] RLS activé sur toutes les tables sensibles
- [ ] Politiques créées et testées
- [ ] Index de performance ajoutés
- [ ] Tests fonctionnels passés (groupes, backups, analytics)
- [ ] Monitoring configuré (logs, alertes)
- [ ] Documentation mise à jour
- [ ] Fonction de nettoyage des backups expirés configurée
- [ ] Rate limiting activé sur Supabase (Settings > API)
- [ ] Backups automatiques de la base activés

---

## 📚 Ressources

- [Documentation Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Guide](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/platform/going-into-prod)
- [SQL Policies Examples](https://supabase.com/docs/guides/database/postgres/row-level-security#policies)

---

## 🆘 Support

En cas de problème:

1. Vérifier les logs Supabase: **Database** > **Logs**
2. Tester les requêtes dans **SQL Editor**
3. Consulter la documentation officielle
4. Ouvrir un ticket sur le [GitHub du projet](https://github.com/anthropics/claude-code/issues)

---

🎉 **C'est tout !** Une fois RLS activé, votre base de données est sécurisée.
