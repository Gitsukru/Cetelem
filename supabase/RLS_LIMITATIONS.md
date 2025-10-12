# ⚠️ Limitations Techniques des Politiques RLS

**Date:** 12 octobre 2025
**Sujet:** Pourquoi certaines validations ne peuvent pas être faites en SQL

---

## 🚫 Limitation #1: Pas d'accès à NEW dans WITH CHECK

### Le problème:

Dans PostgreSQL, les politiques RLS **ne peuvent pas accéder** aux valeurs de la ligne insérée via `NEW`:

```sql
-- ❌ NE FONCTIONNE PAS
CREATE POLICY "participants_insert_limited" ON participants
  FOR INSERT
  WITH CHECK (
    (SELECT COUNT(*) FROM participants
     WHERE group_id = NEW.group_id  -- ❌ ERROR: missing FROM-clause entry for table "new"
    ) < 100
  );
```

**Erreur PostgreSQL:**
```
ERROR: 42P01: missing FROM-clause entry for table "new"
```

### Pourquoi?

- `NEW` et `OLD` sont des variables spéciales disponibles **seulement dans les TRIGGERS**
- Les politiques RLS utilisent `USING` et `WITH CHECK` qui n'ont **pas accès à NEW/OLD**
- C'est une limitation fondamentale de PostgreSQL

### Solution de contournement:

**Option 1: Trigger (Complexe)**
```sql
CREATE TRIGGER check_participants_limit
  BEFORE INSERT ON participants
  FOR EACH ROW
  EXECUTE FUNCTION check_group_participant_limit();
```

**Option 2: Validation côté application (Recommandé)**
```javascript
// Dans script.js
async function addParticipant(groupId, name) {
  // Compter les participants existants
  const { count } = await supabase
    .from('participants')
    .select('id', { count: 'exact', head: true })
    .eq('group_id', groupId);

  if (count >= 100) {
    showCustomAlert('Ce groupe a atteint la limite de 100 participants', 'warning');
    return false;
  }

  // Procéder à l'insertion
  const { data, error } = await supabase
    .from('participants')
    .insert({ group_id: groupId, name: name });

  return !error;
}
```

---

## 🚫 Limitation #2: Pas de rate limiting par IP en SQL pur

### Le problème:

PostgreSQL RLS ne peut pas accéder à l'adresse IP du client:

```sql
-- ❌ NE FONCTIONNE PAS
CREATE POLICY "groups_rate_limit_by_ip" ON groups
  FOR INSERT
  WITH CHECK (
    (SELECT COUNT(*) FROM groups
     WHERE created_at > NOW() - INTERVAL '1 hour'
     AND client_ip = current_client_ip()  -- ❌ Fonction inexistante
    ) < 10
  );
```

### Solution:

**Option 1: Rate limiting global (Actuel)**
```sql
-- ✅ FONCTIONNE mais limite TOUS les utilisateurs ensemble
CREATE POLICY "groups_insert_rate_limited" ON groups
  FOR INSERT
  WITH CHECK (
    (SELECT COUNT(*) FROM groups
     WHERE created_at > NOW() - INTERVAL '1 hour'
    ) < 10  -- 10 groupes/h TOTAL (pas par IP)
  );
```

**Problème:** Si un utilisateur atteint la limite, **tous** les utilisateurs sont bloqués!

**Option 2: Edge Functions avec tracking IP (Recommandé)**
```typescript
// Supabase Edge Function
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const clientIp = req.headers.get('x-forwarded-for') || 'unknown';

  // Vérifier rate limit par IP dans une table dédiée
  const { count } = await supabase
    .from('rate_limits')
    .select('id', { count: 'exact' })
    .eq('ip_address', clientIp)
    .gt('created_at', new Date(Date.now() - 3600000).toISOString());

  if (count >= 10) {
    return new Response('Rate limit exceeded', { status: 429 });
  }

  // Procéder...
});
```

---

## 🚫 Limitation #3: Pas d'ownership sans authentification

### Le problème:

Les politiques RLS basées sur `auth.uid()` nécessitent que les utilisateurs soient **authentifiés**:

```sql
-- ❌ NE FONCTIONNE PAS dans une app anonyme
CREATE POLICY "groups_delete_own" ON groups
  FOR DELETE
  USING (created_by = auth.uid());  -- ❌ auth.uid() est NULL pour utilisateurs anonymes
```

### Solution pour application anonyme:

**Option 1: Tout permettre (Actuel)**
```sql
-- ✅ FONCTIONNE mais moins sécurisé
CREATE POLICY "groups_delete_public" ON groups
  FOR DELETE
  USING (true);  -- Tout le monde peut supprimer n'importe quel groupe
```

**Risque:** Un utilisateur malveillant peut supprimer les groupes des autres!

**Option 2: Ajouter authentification optionnelle (Recommandé long terme)**
```javascript
// 1. Activer Supabase Auth
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google'
});

// 2. Ajouter colonne created_by
ALTER TABLE groups ADD COLUMN created_by UUID REFERENCES auth.users(id);

// 3. Activer ownership
CREATE POLICY "groups_delete_own" ON groups
  FOR DELETE
  USING (
    auth.uid() IS NOT NULL AND
    created_by = auth.uid()
  );
```

---

## 📊 Résumé des Limitations

| Fonctionnalité souhaitée | Possible en RLS? | Alternative |
|--------------------------|------------------|-------------|
| Limite par groupe (NEW.field) | ❌ Non | ✅ Validation app |
| Rate limit par IP | ❌ Non | ✅ Edge Functions |
| Ownership sans auth | ❌ Non | ✅ Ajouter auth |
| Rate limit global | ✅ Oui | - |
| Contraintes de taille | ✅ Oui | - |
| Lecture/Écriture publique | ✅ Oui | - |

---

## ✅ Ce Qui EST Possible en RLS

### 1. Rate Limiting Global

```sql
-- ✅ Limite TOTALE d'insertions (pas par utilisateur)
CREATE POLICY "analytics_rate_limited" ON analytics_events
  FOR INSERT
  WITH CHECK (
    (SELECT COUNT(*) FROM analytics_events
     WHERE created_at > NOW() - INTERVAL '1 hour'
    ) < 100
  );
```

### 2. Contraintes de Taille

```sql
-- ✅ Vérifier taille des données
ALTER TABLE device_backups
ADD CONSTRAINT backup_size_limit
CHECK (pg_column_size(backup_data) < 102400);
```

### 3. Expiration Temporelle

```sql
-- ✅ Supprimer seulement données expirées
CREATE POLICY "delete_expired" ON device_backups
  FOR DELETE
  USING (expires_at < NOW());
```

### 4. Désactivation Sélective

```sql
-- ✅ Bloquer complètement une opération
CREATE POLICY "no_analytics_read" ON analytics_events
  FOR SELECT
  USING (false);  -- Personne ne peut lire
```

---

## 🎯 Recommandations pour Çetelem

### Court terme (Actuel):

✅ **Implémenté:**
- Rate limiting global SQL (10 groups/h, 100 events/h)
- Contraintes de taille (100KB backups)
- Accès public maintenu (nécessaire)

⚠️ **À faire côté application:**
- Valider 100 participants max par groupe dans script.js
- Vérifier quotas avant insertions critiques

### Moyen terme (3-6 mois):

💡 **Recommandé:**
- Implémenter Edge Functions pour rate limiting par IP
- Ajouter table `rate_limits` (ip_address, action, created_at)
- Monitoring et alertes Supabase

### Long terme (6-12 mois):

🎯 **Évolution:**
- Ajouter authentification Google/Email optionnelle
- Implémenter ownership des groupes
- Activer politiques RLS strictes basées sur auth.uid()

---

## 📚 Références

**Documentation PostgreSQL:**
- [Row Security Policies](https://www.postgresql.org/docs/current/sql-createpolicy.html)
- [Trigger Procedures](https://www.postgresql.org/docs/current/plpgsql-trigger.html)

**Documentation Supabase:**
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Edge Functions](https://supabase.com/docs/guides/functions)
- [Rate Limiting](https://supabase.com/docs/guides/platform/rate-limits)

**Discussions:**
- [PostgreSQL: NEW in RLS policies](https://stackoverflow.com/questions/50371531)
- [Supabase: Rate limiting best practices](https://github.com/supabase/supabase/discussions/2667)

---

**Document créé par:** Claude Code Security Team
**Date:** 12 octobre 2025
**Version:** 1.0
