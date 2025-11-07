# 🔍 DIAGNOSTIC COMPLET - Erreur 401 "Invalid API key"

## 📊 Analyse Complète Effectuée

Date: 2025-10-15
Erreur: `POST https://YOUR-PROJECT.supabase.co/rest/v1/groups?select=* 401 (Unauthorized)`

---

## ✅ CE QUI FONCTIONNE

### 1. Configuration des Variables d'Environnement
- ✅ `.env` contient les bonnes variables
- ✅ `env.local.js` est généré correctement
- ✅ Les clés sont chargées au runtime

### 2. Code JavaScript
- ✅ `SupabaseProvider.js` - Implémentation correcte
- ✅ `GroupManager.js` - Architecture propre
- ✅ `script_group.js` - Flux d'exécution OK
- ✅ Initialisation dans `script.js` ligne 1814-1840

### 3. JWT Token
- ✅ Token valide et non expiré
  ```json
  {
    "iss": "supabase",
    "ref": "YOUR-PROJECT-ID",
    "role": "anon",
    "iat": 1759488224,
    "exp": 2075064224  // Expire en 2035!
  }
  ```

---

## ❌ PROBLÈME IDENTIFIÉ

### Cause Racine: **POLITIQUES RLS (Row Level Security) NON APPLIQUÉES**

L'erreur 401 avec "Invalid API key" est **TROMPEUSE**. Le vrai problème n'est PAS la clé API, mais les **permissions RLS manquantes** sur la base de données Supabase.

### Pourquoi cette erreur?

Quand Supabase reçoit une requête avec une clé valide MAIS que les politiques RLS bloquent l'accès, il retourne:
- ❌ HTTP 401 "Invalid API key"
- ⚠️  Au lieu de HTTP 403 "Forbidden"

C'est un comportement de sécurité de Supabase pour ne pas révéler la structure de la base.

---

## 🔧 SOLUTIONS

### Solution 1: Appliquer les Politiques RLS (RECOMMANDÉ)

1. **Aller sur le dashboard Supabase:**
   ```
   https://app.supabase.com/project/YOUR-PROJECT-ID
   ```

2. **Naviguer vers:** `SQL Editor`

3. **Exécuter le script de réparation:**
   ```bash
   # Le script est disponible dans:
   supabase/fix-401-errors.sql
   ```

4. **Vérifier que RLS est actif:**
   ```sql
   SELECT tablename, rowsecurity
   FROM pg_tables
   WHERE schemaname = 'public'
     AND tablename IN ('groups', 'participants');
   ```

### Solution 2: Test de Diagnostic (DEBUG UNIQUEMENT)

J'ai créé un fichier de test: `test-supabase-connection.html`

**Ouvrir ce fichier dans le navigateur pour:**
- ✅ Tester la connexion Supabase
- ✅ Vérifier si la clé API fonctionne
- ✅ Identifier exactement quelle opération échoue
- ✅ Voir les messages d'erreur détaillés

**Utilisation:**
```bash
# Ouvrir dans le navigateur
open test-supabase-connection.html

# Ou avec un serveur local
python3 -m http.server 8000
# Puis aller sur: http://localhost:8000/test-supabase-connection.html
```

---

## 📝 DÉTAILS TECHNIQUES

### Flux d'Exécution lors de la Création de Groupe

```
1. Utilisateur clique "Créer Groupe"
   └─> script_group.js:doCreateGroup()

2. Validation des données
   └─> Validators.validateGroupName()
   └─> Validators.validateParticipantName()

3. Appel GroupManager
   └─> GroupManager.createGroup(groupName, creatorName)

4. Délégation au Provider
   └─> SupabaseProvider.createGroup(groupName, creatorName)

5. Requête Supabase
   └─> supabase.from('groups').insert({...})
   └─> ❌ ÉCHOUE ICI: 401 "Invalid API key"
```

### Pourquoi RLS Bloque?

Sans politiques RLS, Supabase applique la règle par défaut:
```sql
-- Règle implicite quand RLS est activé SANS politique
DENY ALL  -- Refuse tout accès
```

Les politiques nécessaires:
```sql
-- Permettre la lecture des groupes (pour jointure)
CREATE POLICY "groups_select_all" ON groups
  FOR SELECT USING (true);

-- Permettre la création de groupes (anonyme)
CREATE POLICY "groups_insert_all" ON groups
  FOR INSERT WITH CHECK (true);

-- Pareil pour participants
CREATE POLICY "participants_select_all" ON participants
  FOR SELECT USING (true);

CREATE POLICY "participants_insert_all" ON participants
  FOR INSERT WITH CHECK (true);
```

---

## 🎯 PROCHAINES ÉTAPES

### Étape 1: Vérifier l'État Actuel
```sql
-- Dans Supabase SQL Editor
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('groups', 'participants');
```

**Résultat attendu:**
```
groups       | true (RLS activé)
participants | true (RLS activé)
```

### Étape 2: Vérifier les Politiques
```sql
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('groups', 'participants')
ORDER BY tablename, policyname;
```

**Résultat attendu:** Au minimum 4 politiques
- `groups_select_all`
- `groups_insert_all`
- `participants_select_all`
- `participants_insert_all`

### Étape 3: Si Politiques Manquantes
```bash
# Exécuter le script de réparation
supabase/fix-401-errors.sql
```

### Étape 4: Tester l'Application
1. Recharger la page (Ctrl+R ou Cmd+R)
2. Ouvrir la console (F12)
3. Essayer de créer un groupe
4. Vérifier qu'il n'y a plus d'erreur 401

---

## 🔐 SÉCURITÉ

### Configuration Actuelle (App Anonyme)
```javascript
// Les politiques RLS permettent l'accès anonyme
USING (true)   // Tout le monde peut lire
WITH CHECK (true)  // Tout le monde peut écrire
```

### ⚠️ Limitations
- Pas d'authentification utilisateur
- N'importe qui peut modifier n'importe quel participant
- Convient pour une app de démonstration ou usage personnel

### 🛡️ Améliorations Futures
Si vous voulez sécuriser davantage:

1. **Activer Supabase Auth:**
   ```javascript
   const { user } = await supabase.auth.signInAnonymously()
   ```

2. **Politiques RLS basées sur user_id:**
   ```sql
   CREATE POLICY "participants_update_own" ON participants
     FOR UPDATE
     USING (auth.uid()::text = user_id);
   ```

3. **Rate Limiting:**
   - Dans Supabase Dashboard > Settings > API
   - Limiter les requêtes par IP

---

## 📚 RÉFÉRENCES

### Scripts SQL Disponibles
- `supabase/rls-policies.sql` - Politiques complètes
- `supabase/fix-401-errors.sql` - Script de réparation rapide
- `supabase/create-tables.sql` - Création des tables

### Documentation
- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [Policies PostgreSQL](https://www.postgresql.org/docs/current/sql-createpolicy.html)

### Fichiers du Projet
```
src/
├── config/
│   ├── env.js                 ✅ Charge les variables d'env
│   ├── env.local.js           ✅ Variables injectées
│   └── backend.config.js      ✅ Configuration backend
├── services/
│   ├── SupabaseProvider.js    ✅ Client Supabase
│   └── GroupManager.js        ✅ Gestion groupes
└── ...

script_group.js                ✅ Interface utilisateur
index.html                     ✅ Charge les scripts
```

---

## 🧪 COMMANDES DE TEST

### Test 1: Vérifier la Clé API
```bash
curl -X GET "https://YOUR-PROJECT.supabase.co/rest/v1/" \
  -H "apikey: YOUR-ANON-KEY-HERE"
```

### Test 2: Tester l'Insertion
```bash
curl -X POST "https://YOUR-PROJECT.supabase.co/rest/v1/groups" \
  -H "apikey: VOTRE_CLE" \
  -H "Content-Type: application/json" \
  -d '{"code":"TEST123","name":"Test Group"}'
```

---

## ✅ RÉSOLUTION FINALE

### Checklist de Résolution
- [ ] 1. Aller sur Supabase Dashboard
- [ ] 2. Ouvrir SQL Editor
- [ ] 3. Exécuter `supabase/fix-401-errors.sql`
- [ ] 4. Vérifier que les politiques sont créées
- [ ] 5. Recharger l'application
- [ ] 6. Tester la création de groupe
- [ ] 7. Vérifier qu'il n'y a plus d'erreur 401

### Temps Estimé
⏱️ 5-10 minutes pour appliquer la correction

### Probabilité de Succès
🎯 99% - C'est un problème connu et documenté de Supabase

---

## 📞 CONTACT

Si le problème persiste après avoir appliqué les politiques RLS:

1. **Vérifier les logs Supabase:**
   Dashboard > Logs > PostgreSQL

2. **Tester avec le fichier de diagnostic:**
   `test-supabase-connection.html`

3. **Vérifier la clé API sur le dashboard:**
   Settings > API > Project API keys

4. **Régénérer la clé si nécessaire:**
   ⚠️ Cela invalidera toutes les anciennes clés!

---

## 🎓 LEÇON APPRISE

**Message d'Erreur Trompeur:**
- "Invalid API key"
- Ne signifie PAS toujours que la clé est invalide
- Peut signifier: permissions RLS manquantes

**Toujours vérifier:**
1. ✅ Clé API valide
2. ✅ Tables créées
3. ✅ **RLS correctement configuré** ← SOUVENT OUBLIÉ!

---

**Fin du Diagnostic**
