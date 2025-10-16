# 🔧 FIX: Clé API Supabase Invalide (Erreur 401)

## 🚨 Problème Identifié

```
POST https://sxtcyznkxtlcgkgrdrbi.supabase.co/rest/v1/groups 401 (Unauthorized)
Error: Invalid API key
```

**Cause :** La clé `VITE_SUPABASE_ANON_KEY` dans `.env` est invalide ou expirée.

## ✅ Solution (5 minutes)

### Étape 1: Récupérer la VRAIE clé Supabase

1. **Aller sur Supabase Dashboard:**
   https://supabase.com/dashboard/project/sxtcyznkxtlcgkgrdrbi

2. **Navigation:**
   - Cliquer sur "Settings" (⚙️ en bas gauche)
   - Cliquer sur "API"
   - Trouver la section "Project API keys"

3. **Copier la clé:**
   ```
   anon public
   ────────────────────────────────────────
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3M...
   [COPIER LA CLÉ COMPLÈTE]
   ```

### Étape 2: Mettre à jour `.env`

```bash
# Ouvrir .env
nano .env

# OU
code .env
```

Remplacer la ligne `VITE_SUPABASE_ANON_KEY=...` par la nouvelle clé :

```bash
# .env
VITE_SUPABASE_URL=https://sxtcyznkxtlcgkgrdrbi.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4dGN5em5reHRsY2drZ3JkcmJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODkyMjk5MzQsImV4cCI6MjAwNDgwNTkzNH0.VOTRE_NOUVELLE_CLE_ICI
VITE_ACTIVE_PROVIDER=supabase
```

### Étape 3: Régénérer env.local.js

```bash
npm run gen-env-local
```

**Résultat attendu :**
```
✅ Variables d'environnement chargées depuis env.local.js
```

### Étape 4: Recharger la page

```bash
# Si dev serveur actif (Vite)
# Le hot-reload devrait se faire automatiquement

# Sinon, recharger manuellement le navigateur
Cmd+R (Mac) ou Ctrl+R (Windows)
```

### Étape 5: Tester

1. Ouvrir l'onglet "Groupe"
2. Cliquer "Yeni Grup Oluştur"
3. Entrer un nom et créer

**Si ça fonctionne :**
```
✅ Grup başarıyla oluşturuldu!
Code: ABC123
```

## 🔍 Vérification Console

Ouvrir la console navigateur (F12), vous devriez voir :

```
✅ Variables d'environnement chargées depuis env.local.js
🔍 BackendConfig.supabase appelé
📍 ENV.SUPABASE_URL: https://sxtcyznkxtlcgkgrdrbi.supabase.co
🔑 ENV.SUPABASE_ANON_KEY (50 premiers): eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzd...
🔑 Key length: 267 (ou plus)
🔑 Key contient des espaces? false
✅ Client Supabase créé
✅ Supabase initialisé
```

## ⚠️ Si le problème persiste

### Vérifier RLS (Row Level Security)

Les tables Supabase doivent avoir RLS activé :

```bash
# Aller dans Supabase Dashboard > SQL Editor
# Exécuter:
```

```sql
-- Vérifier RLS
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('groups', 'participants');

-- Résultat attendu:
-- tablename   | rowsecurity
-- ------------|------------
-- groups      | t (true)
-- participants| t (true)
```

**Si RLS désactivé:**

```sql
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;

-- Créer policies (voir supabase/rls-policies.sql)
CREATE POLICY "groups_insert_all" ON groups FOR INSERT WITH CHECK (true);
CREATE POLICY "participants_insert_all" ON participants FOR INSERT WITH CHECK (true);
-- etc.
```

### Vérifier les tables existent

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('groups', 'participants');
```

**Si vide, créer les tables:**

```bash
# Aller dans le dossier supabase/
cd /Users/sukru/Documents/GitHub/zikirmatik/supabase

# Exécuter dans SQL Editor Supabase:
cat create-tables.sql
```

## 📞 Support

Si le problème persiste après ces étapes:

1. **Vérifier URL projet:** `https://supabase.com/dashboard/project/sxtcyznkxtlcgkgrdrbi`
2. **Vérifier projet actif** (pas pausé)
3. **Vérifier billing** (plan gratuit OK, mais vérifier quota)

---

**Temps de résolution estimé:** 5-10 minutes
**Dernière mise à jour:** 2025-10-16
