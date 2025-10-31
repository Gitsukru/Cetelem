# 📊 Analytics Respectueux de la Vie Privée

## 🎯 Objectif

Collecter des statistiques d'usage **SANS** identifier les utilisateurs :
- ✅ Nombre d'utilisateurs actifs
- ✅ Durée d'utilisation moyenne
- ✅ Fonctionnalités les plus utilisées
- ❌ **AUCUNE donnée personnelle**

## 🔒 Protection de la Vie Privée

### Ce qui EST collecté (anonyme) :
- **ID anonyme** : UUID aléatoire généré localement (exemple: `user_a3b8c9d2-...`)
- **Sessions** : début, fin, durée
- **Actions** : onglets visités, fonctionnalités utilisées
- **Infos techniques** : type d'appareil, navigateur, taille écran

### Ce qui N'EST PAS collecté :
- ❌ Adresse IP (pas stockée)
- ❌ Nom, email, téléphone
- ❌ Localisation GPS
- ❌ Contenu personnel (textes, notes, zikirs)
- ❌ Historique de navigation

## 🛡️ Conformité RGPD

1. **Consentement** : L'utilisateur doit accepter explicitement
2. **Anonymat** : Impossible de remonter à l'identité réelle
3. **Transparence** : L'utilisateur sait ce qui est collecté
4. **Contrôle** : L'utilisateur peut refuser ou désactiver

## 📖 Utilisation

### 1. Inclure le script

```html
<script src="src/utils/privacy-analytics.js"></script>
```

### 2. Tracker des événements

```javascript
// Page vue
PrivacyAnalytics.pageView('Zikir');

// Fonctionnalité utilisée
PrivacyAnalytics.featureUsed('Compteur');

// Milestone de comptage
PrivacyAnalytics.zikirCounted(100);
```

### 3. Voir les statistiques (pour vous)

```javascript
// Dans la console développeur
await PrivacyAnalytics.showStats();

// Résultat exemple :
// {
//   total_users: 245,
//   total_sessions: 1523,
//   avg_session_duration_minutes: 12.3
// }
```

## 🎨 Personnaliser le consentement

L'utilisateur voit ce message au premier lancement :

```
📊 Statistiques d'usage (anonymes)

Pour améliorer l'application, nous collectons des statistiques anonymes :
• Nombre d'utilisateurs
• Durée d'utilisation
• Fonctionnalités utilisées

✅ 100% anonyme (ID aléatoire, pas d'IP, pas de données personnelles)
✅ Vous pouvez refuser sans impact sur l'app

Acceptez-vous ?
```

## 💾 Structure des données

### Table Supabase : `analytics_events`

```sql
CREATE TABLE analytics_events (
  id BIGSERIAL PRIMARY KEY,
  anonymous_id TEXT NOT NULL,  -- ID anonyme (UUID)
  event_name TEXT NOT NULL,     -- Nom de l'événement
  event_data JSONB,              -- Données de l'événement
  user_agent TEXT,               -- Navigateur
  screen_width INTEGER,          -- Largeur écran
  screen_height INTEGER,         -- Hauteur écran
  language TEXT,                 -- Langue du navigateur
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index pour performances
CREATE INDEX idx_anonymous_id ON analytics_events(anonymous_id);
CREATE INDEX idx_event_name ON analytics_events(event_name);
CREATE INDEX idx_created_at ON analytics_events(created_at);
```

## 📊 Exemples de requêtes analytics

### Nombre d'utilisateurs actifs aujourd'hui

```sql
SELECT COUNT(DISTINCT anonymous_id) as users_today
FROM analytics_events
WHERE created_at >= CURRENT_DATE;
```

### Durée moyenne de session

```sql
SELECT AVG((event_data->>'duration_minutes')::float) as avg_minutes
FROM analytics_events
WHERE event_name = 'session_end'
  AND created_at >= CURRENT_DATE - INTERVAL '7 days';
```

### Fonctionnalités les plus utilisées

```sql
SELECT
  event_data->>'feature' as feature,
  COUNT(*) as usage_count
FROM analytics_events
WHERE event_name = 'feature_used'
GROUP BY feature
ORDER BY usage_count DESC
LIMIT 10;
```

## ⚠️ Bonnes Pratiques

1. **Ne JAMAIS** ajouter de données personnelles
2. **Toujours** demander le consentement
3. **Expliquer clairement** ce qui est collecté
4. **Permettre** de désactiver à tout moment
5. **Supprimer** les anciennes données (rétention 90 jours max)

## 🔄 Désactiver les analytics

L'utilisateur peut désactiver à tout moment :

```javascript
PrivacyAnalytics.setAnalyticsConsent(false);
```

## 📝 Politique de rétention

**Recommandation** : Supprimer les événements de plus de 90 jours

```sql
-- Script de nettoyage (à exécuter régulièrement)
DELETE FROM analytics_events
WHERE created_at < NOW() - INTERVAL '90 days';
```

## ✅ Avantages de cette approche

1. ✅ **Respect total de la vie privée**
2. ✅ **Conforme RGPD** (consentement + anonymat)
3. ✅ **Statistiques utiles** pour améliorer l'app
4. ✅ **Transparence** avec les utilisateurs
5. ✅ **Pas de coûts** (Supabase gratuit jusqu'à 50k lignes/mois)

## 🚀 Alternative : Analytics sans backend

Si vous ne voulez PAS utiliser Supabase, utilisez **Plausible Analytics** ou **Simple Analytics** :
- 100% respectueux de la vie privée
- Conforme RGPD sans consentement
- Payant mais abordable (~9€/mois)
- Aucun cookie, aucune identification

---

**Questions ?** Voir [docs/SECURITY_GUIDE.md](./security/SECURITY_GUIDE.md)
