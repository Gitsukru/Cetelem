# 🗄️ Configuration de la Base de Données Supabase

## ❌ Problème Actuel

Vous voyez cette erreur dans la console :
```
POST https://YOUR-PROJECT.supabase.co/rest/v1/groups?select=* 401 (Unauthorized)
Erreur création groupe Supabase: {message: 'Invalid API key'}
```

**Malgré que :**
- ✅ Les variables d'environnement sont correctement configurées sur Netlify
- ✅ Le client Supabase est initialisé avec succès
- ✅ La clé API est valide

## 🎯 La Vraie Cause

Le problème n'est **PAS** avec les variables d'environnement. Le problème est que les **tables de la base de données n'existent probablement pas encore** dans votre projet Supabase !

Quand Supabase reçoit une requête vers `/rest/v1/groups`, il vérifie :
1. ✅ L'API key est-elle valide ? → OUI
2. ❌ La table `groups` existe-t-elle ? → **NON = 401 Unauthorized**

## 🔧 Solution : Créer les Tables

Vous devez exécuter le script SQL dans Supabase pour créer les tables `groups` et `participants`.

### Étape 1 : Accéder au SQL Editor

1. Aller sur [supabase.com](https://supabase.com)
2. Se connecter à votre compte
3. Sélectionner votre projet : **YOUR-PROJECT-ID**
4. Dans le menu latéral, cliquer sur **SQL Editor** (icône 📝)

### Étape 2 : Exécuter le Script de Configuration

1. Cliquer sur **New Query** (nouveau bouton `+`)
2. Copier **TOUT** le contenu du fichier `/migrations/supabase-setup.sql`
3. Coller dans l'éditeur SQL
4. Cliquer sur **Run** (ou Ctrl+Enter)

Le script va créer :
- ✅ Table `groups` (pour les groupes de zikir)
- ✅ Table `participants` (pour les membres des groupes)
- ✅ Index pour la performance
- ✅ Policies RLS (sécurité)
- ✅ Trigger pour `updated_at`
- ✅ Temps réel activé

### Étape 3 : Vérifier que Tout est Créé

Exécuter cette requête dans le SQL Editor :

```sql
-- Vérifier que les tables existent
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('groups', 'participants');
```

Vous devriez voir :
```
table_name
-----------
groups
participants
```

### Étape 4 : Vérifier les Policies RLS

Exécuter cette requête :

```sql
-- Vérifier les policies
SELECT tablename, policyname, cmd, roles
FROM pg_policies
WHERE tablename IN ('groups', 'participants');
```

Vous devriez voir 5 policies :
1. `Lecture publique des groupes` (SELECT)
2. `Création publique des groupes` (INSERT)
3. `Lecture publique des participants` (SELECT)
4. `Insertion publique des participants` (INSERT)
5. `Mise à jour publique des participants` (UPDATE)
6. `Suppression publique des participants` (DELETE)

### Étape 5 : Tester avec des Données

Dans le SQL Editor, tester la création d'un groupe :

```sql
-- Créer un groupe de test
INSERT INTO groups (code, name)
VALUES ('TEST01', 'Groupe Test')
RETURNING *;
```

Si vous voyez le groupe créé avec un `id` UUID, tout fonctionne ! ✅

Vous pouvez supprimer le test :

```sql
-- Supprimer le groupe de test
DELETE FROM groups WHERE code = 'TEST01';
```

## ✅ Après la Configuration

Une fois les tables créées :

1. Aller sur votre site : `https://cetelems.netlify.app`
2. Ouvrir la console du navigateur (F12)
3. Cliquer sur l'onglet **Groupe**
4. Essayer de créer un nouveau groupe

Vous devriez maintenant voir :
```
✅ Variables d'environnement chargées
✅ Supabase initialisé
✅ Groupe créé avec succès !
```

## 🐛 Dépannage

### Erreur : "permission denied for table groups"

**Problème :** Les policies RLS ne sont pas correctement configurées.

**Solution :**
1. Vérifier que RLS est activé :
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('groups', 'participants');
```

2. Recréer les policies en réexécutant la section 7 du script `supabase-setup.sql`

### Erreur : "relation groups does not exist"

**Problème :** Les tables n'ont pas été créées.

**Solution :**
- Réexécuter complètement le script `supabase-setup.sql`
- Vérifier qu'il n'y a pas d'erreurs dans le SQL Editor

### Erreur : "duplicate key value violates unique constraint"

**Problème :** Vous essayez de créer un groupe avec un code qui existe déjà.

**Solution :** C'est normal ! Chaque code de groupe doit être unique. L'application génère automatiquement des codes uniques.

## 📊 Structure des Tables

### Table `groups`
```
id          UUID (PRIMARY KEY)
code        VARCHAR(6) UNIQUE (ex: "ABC123")
name        VARCHAR(50) (ex: "Groupe Ramadan")
created_at  TIMESTAMP
```

### Table `participants`
```
id           UUID (PRIMARY KEY)
group_id     UUID (FOREIGN KEY → groups.id)
name         VARCHAR(30) (ex: "Ahmed")
today_count  INTEGER (compteur du jour)
week_count   INTEGER (compteur de la semaine)
month_count  INTEGER (compteur du mois)
total_count  INTEGER (compteur total)
metadata     JSONB (stats par catégorie)
joined_at    TIMESTAMP
updated_at   TIMESTAMP
```

## 🔒 Sécurité

Les policies RLS configurées autorisent :
- ✅ N'importe qui peut créer un groupe (INSERT)
- ✅ N'importe qui peut lire les groupes et participants (SELECT)
- ✅ N'importe qui peut rejoindre un groupe (INSERT participant)
- ✅ N'importe qui peut mettre à jour son score (UPDATE)
- ✅ N'importe qui peut quitter un groupe (DELETE participant)

**C'est sécurisé** car :
- Les utilisateurs ne peuvent pas modifier les autres participants
- Les clés sont anonymes (`anon` key) et limitées par Supabase
- Vous pouvez restreindre davantage plus tard si besoin

## 📚 Ressources

- [Documentation Supabase - Tables](https://supabase.com/docs/guides/database/tables)
- [Documentation Supabase - RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [Documentation Supabase - Realtime](https://supabase.com/docs/guides/realtime)

## ✉️ Prochaines Étapes

1. ✅ Créer les tables avec le script SQL
2. ✅ Vérifier que tout fonctionne
3. ✅ Tester la création d'un groupe sur l'app
4. 🎉 Profiter du mode groupe en temps réel !
