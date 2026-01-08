# Système de Mise à Jour Automatique via WebSocket

## Vue d'ensemble

Le système de mise à jour automatique utilise **Supabase Realtime (WebSocket)** pour notifier instantanément tous les utilisateurs connectés lorsqu'une nouvelle version de l'application est déployée.

**Avantages:**
- Zéro polling (économie de batterie)
- Notifications instantanées
- Fonctionne sur iOS, Android et Desktop
- Entièrement automatisé via GitHub Actions

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────────┐     ┌─────────────┐
│  git push   │ ──▶ │   Netlify   │ ──▶ │ GitHub Action   │ ──▶ │  Supabase   │
│             │     │   Deploy    │     │ update version  │     │  Realtime   │
└─────────────┘     └─────────────┘     └─────────────────┘     └──────┬──────┘
                                                                       │
                                                                       ▼
                                                           ┌───────────────────┐
                                                           │   WebSocket Push  │
                                                           │   to all users    │
                                                           └─────────┬─────────┘
                                                                     │
                            ┌────────────────────────────────────────┼────────────────────────────────────────┐
                            ▼                                        ▼                                        ▼
                    ┌───────────────┐                        ┌───────────────┐                        ┌───────────────┐
                    │   User iOS    │                        │  User Android │                        │  User Desktop │
                    │   (Banner)    │                        │   (Banner)    │                        │  (Auto-apply) │
                    └───────────────┘                        └───────────────┘                        └───────────────┘
```

## Fichiers impliqués

| Fichier | Rôle |
|---------|------|
| `src/utils/version-listener.js` | Client WebSocket - écoute les MAJ |
| `.github/workflows/notify-update.yml` | GitHub Action - notifie après déploiement |
| `script.js` | Initialisation du VersionListener |

## Configuration Supabase

### Table `app_config`

```sql
CREATE TABLE IF NOT EXISTS app_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insérer la version initiale
INSERT INTO app_config (key, value)
VALUES ('app_version', '1.0.0')
ON CONFLICT (key) DO NOTHING;

-- Activer Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE app_config;

-- Permissions
GRANT SELECT ON app_config TO anon, authenticated;
```

### Permissions RLS

```sql
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read app_config" ON app_config
FOR SELECT TO anon, authenticated USING (true);
```

## Configuration GitHub Actions

### Secrets requis

Dans **GitHub → Settings → Secrets and variables → Actions**, ajouter:

| Secret | Description |
|--------|-------------|
| `SUPABASE_URL` | URL du projet Supabase (ex: `https://xxx.supabase.co`) |
| `SUPABASE_SERVICE_KEY` | Clé `service_role` (pas `anon`!) |

### Workflow `.github/workflows/notify-update.yml`

```yaml
name: Notify
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: sleep 60  # Attendre le déploiement Netlify
      - run: |
          curl -X PATCH \
            "${{ secrets.SUPABASE_URL }}/rest/v1/app_config?key=eq.app_version" \
            -H "apikey: ${{ secrets.SUPABASE_SERVICE_KEY }}" \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_KEY }}" \
            -H "Content-Type: application/json" \
            -d '{"value": "$(date +%Y%m%d)-${GITHUB_SHA::7}"}'
```

## Fonctionnement côté client

### Initialisation

```javascript
// Dans script.js - initializeBackend()
if (typeof VersionListener !== 'undefined') {
    VersionListener.init(provider.supabase)
}
```

### VersionListener

Le `VersionListener` (`src/utils/version-listener.js`) :

1. **S'abonne** à la table `app_config` via Supabase Realtime
2. **Détecte** les changements de version
3. **Affiche** un banner pour PWA / auto-applique pour navigateur
4. **Gère iOS** : reconnexion automatique après background

### Comportement selon plateforme

| Plateforme | Comportement |
|------------|--------------|
| **PWA (iOS/Android)** | Affiche banner "🚀 Yeni sürüm mevcut!" - clic pour MAJ |
| **Navigateur** | Applique automatiquement la MAJ |

## Gestion iOS

iOS tue les connexions WebSocket après ~90 secondes en arrière-plan. Le système gère cela via:

- `visibilitychange` - détecte retour au premier plan
- `pageshow` - détecte restauration depuis bfcache
- `focus` - safeguard supplémentaire (debounced)

À chaque retour au premier plan:
1. Re-fetch la version depuis la base de données
2. Compare avec la version connue
3. Affiche le banner si nouvelle version
4. Reconnecte le WebSocket

## Flux complet de mise à jour

1. **Développeur** fait un `git push`
2. **Netlify** déploie automatiquement (~1 min)
3. **GitHub Action** attend 60s puis met à jour `app_config.app_version`
4. **Supabase Realtime** envoie la notification à tous les clients WebSocket
5. **VersionListener** reçoit la notification
6. **PWA**: Affiche banner → User clique "Güncelle" → App se recharge
7. **Browser**: Applique automatiquement → Page se recharge

## Données utilisateur

Les données utilisateur sont **préservées** lors des mises à jour:

| Type | Stockage | Affecté? |
|------|----------|----------|
| Compteurs zikir | `localStorage` | Non |
| Groupes/Hatims | Supabase | Non |
| Préférences | `localStorage` | Non |

La MAJ ne supprime que le **cache des fichiers** (JS, CSS, HTML).

## Déclenchement manuel (test)

Pour tester manuellement:

```sql
UPDATE app_config
SET value = 'test-' || NOW()::TEXT,
    updated_at = NOW()
WHERE key = 'app_version';
```

## Dépannage

### Le banner n'apparaît pas

1. Vérifier que Realtime est activé sur `app_config`
2. Vérifier les permissions RLS
3. Vérifier la connexion réseau
4. Regarder les erreurs dans la console

### Erreurs réseau sur iOS

- Normal si l'app était en arrière-plan
- Le système reconnecte automatiquement au retour

### GitHub Action échoue

- Vérifier les secrets `SUPABASE_URL` et `SUPABASE_SERVICE_KEY`
- Vérifier que la clé est bien `service_role` (pas `anon`)

## Historique

- **Janvier 2026**: Implémentation initiale avec Supabase Realtime
- Remplace l'ancien système de polling (économie batterie)
- Ajout gestion iOS (reconnexion après background)
- Automatisation complète via GitHub Actions
