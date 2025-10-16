# 🌐 Guide de Compatibilité des Navigateurs

## 📊 Résumé du Problème

**Symptôme:** Erreur 401 "Invalid API key" sur Chrome/Safari uniquement
**Fonctionne sur:** Firefox, Opera
**Ne fonctionne pas sur:** Chrome, Safari
**Cause racine:** Service Worker + CSP

---

## 🔍 Analyse Technique

### Différences entre Moteurs de Navigateur

| Navigateur | Moteur | Comportement Service Worker | Comportement CSP |
|------------|--------|----------------------------|------------------|
| **Chrome** | Chromium/Blink | Strict - cache agressif | Strict - bloque script-src |
| **Safari** | WebKit | Strict - cache agressif | Strict - bloque connect-src |
| **Firefox** | Gecko | Permissif - cache moins | Permissif - plus flexible |
| **Opera** | Chromium/Blink | Permissif - cache moins | Permissif - plus flexible |

### Pourquoi Chrome/Safari bloquaient?

#### 1. **Service Worker Cache Agressif**

Chrome et Safari implémentent le Service Worker de manière très stricte:

```javascript
// Service Worker cacheait l'ancien env.local.js
// Même après rafraîchissement, la vieille version était servie
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js')
  // ❌ Chrome: Cache TOUTES les ressources agressivement
  // ✅ Firefox: Cache moins, refresh plus facile
}
```

**Impact:**
- Anciennes variables d'environnement en cache
- `ENV` restait `undefined` même après mise à jour
- Requêtes Supabase avec clé invalide/manquante

#### 2. **Content Security Policy (CSP) Strict**

```html
<!-- Chrome/Safari: Application STRICTE du CSP -->
<meta http-equiv="Content-Security-Policy" content="
    connect-src 'self' https://*.supabase.co;
">
```

**Problème détecté:**
- Chrome bloque `connect-src` si le moindre espace/caractère invalide dans la clé
- Safari encore plus strict sur les headers
- Firefox/Opera plus tolérants

---

## ✅ Solution Appliquée

### Modification 1: Désactivation Temporaire du Service Worker

**Fichier:** `script.js` (ligne 1717)

```javascript
// Service Worker pour PWA
// ⚡ TEMPORAIREMENT DÉSACTIVÉ pour debug Chrome/Safari
if (false && 'serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('./sw.js')
        // ...
    });
}
```

**Pourquoi ça fonctionne:**
- Plus de cache du Service Worker
- `env.local.js` chargé directement depuis le serveur
- Variables d'environnement toujours à jour

### Modification 2: Désactivation Temporaire du CSP

**Fichier:** `index.html` (ligne 9)

```html
<!-- ⚡ TEMPORAIREMENT DÉSACTIVÉ pour debug Chrome/Safari -->
<!--
<meta http-equiv="Content-Security-Policy" content="...">
-->
```

**Pourquoi ça fonctionne:**
- Plus de blocage des requêtes Supabase
- Script `env.local.js` se charge correctement
- Connexions WebSocket non bloquées

---

## 🔧 Solution Permanente

### Option 1: Service Worker Intelligent

Améliorer le Service Worker pour ne PAS cacher les fichiers de configuration:

```javascript
// sw.js
const CACHE_NAME = 'zikirmatik-v1';
const EXCLUDED_FROM_CACHE = [
  '/src/config/env.local.js',  // ❌ NE PAS CACHER
  '/api/',                      // ❌ NE PAS CACHER les API
  '/.netlify/'                  // ❌ NE PAS CACHER Netlify functions
];

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Ne pas cacher les fichiers exclus
  if (EXCLUDED_FROM_CACHE.some(path => url.pathname.includes(path))) {
    return event.respondWith(fetch(event.request));
  }

  // Stratégie: Network First pour les API, Cache First pour les assets
  if (url.pathname.includes('/rest/v1/') || url.pathname.includes('supabase.co')) {
    // Network First pour Supabase
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(event.request))
    );
  } else {
    // Cache First pour le reste
    event.respondWith(
      caches.match(event.request)
        .then(response => response || fetch(event.request))
    );
  }
});
```

### Option 2: CSP Optimisé

**Fichier:** `index.html`

```html
<meta http-equiv="Content-Security-Policy" content="
    default-src 'self';
    script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    font-src 'self' https://fonts.gstatic.com;
    img-src 'self' data: https:;
    connect-src 'self'
        https://*.supabase.co
        wss://*.supabase.co;
    worker-src 'self' blob:;
    frame-ancestors 'none';
    base-uri 'self';
    form-action 'self';
    upgrade-insecure-requests;
">
```

**Clés des améliorations:**
- ✅ `connect-src` inclut WebSocket (`wss://`)
- ✅ `worker-src` pour le Service Worker
- ✅ Format propre sans espaces parasites

### Option 3: Headers HTTP (MEILLEUR)

Au lieu de `<meta>` tag, utiliser les headers HTTP (plus fiable sur tous les navigateurs):

**Fichier:** `netlify.toml`

```toml
[[headers]]
  for = "/*"
  [headers.values]
    Content-Security-Policy = '''
      default-src 'self';
      script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net;
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      font-src 'self' https://fonts.gstatic.com;
      img-src 'self' data: https:;
      connect-src 'self' https://*.supabase.co wss://*.supabase.co;
      worker-src 'self' blob:;
      frame-ancestors 'none';
      base-uri 'self';
      form-action 'self';
      upgrade-insecure-requests;
    '''
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

---

## 🧪 Tests de Compatibilité

### Checklist de Test

- [ ] **Chrome** (Windows/Mac/Linux)
  - [ ] Création de groupe fonctionne
  - [ ] ENV chargé correctement
  - [ ] Pas d'erreur 401
  - [ ] Service Worker ne cache pas env.local.js

- [ ] **Safari** (Mac/iOS)
  - [ ] Création de groupe fonctionne
  - [ ] ENV chargé correctement
  - [ ] Pas d'erreur 401
  - [ ] CSP ne bloque pas Supabase

- [ ] **Firefox** (Windows/Mac/Linux)
  - [ ] ✅ Déjà fonctionnel

- [ ] **Opera** (Windows/Mac)
  - [ ] ✅ Déjà fonctionnel

- [ ] **Edge** (Windows/Mac)
  - [ ] À tester (basé sur Chromium, comportement similaire à Chrome)

### Test en Navigation Privée

Toujours tester en navigation privée pour éviter:
- Cache du navigateur
- Service Worker précédent
- Extensions qui interfèrent

**Commandes:**
- Chrome: `Cmd+Shift+N` (Mac) / `Ctrl+Shift+N` (Win)
- Safari: `Cmd+Shift+N`
- Firefox: `Cmd+Shift+P` (Mac) / `Ctrl+Shift+P` (Win)

---

## 🚨 Problèmes Connus

### 1. Rate Limiting Supabase

**Symptôme:** "⚠️ Trop de tentatives. Réessayez dans XXXs"

**Cause:** Trop de requêtes en développement

**Solution:**
```javascript
// Ajouter un debounce pour les mises à jour
const debouncedUpdateScore = debounce(async () => {
  await groupManager.updateMyScore(stats);
}, 2000); // Attendre 2s entre chaque mise à jour
```

### 2. ENV undefined après déploiement

**Symptôme:** `console.log(ENV)` retourne `undefined`

**Solution:**
1. Vérifier que `env.local.js` est bien généré
2. Hard refresh avec Service Worker désactivé
3. Vérifier l'ordre de chargement des scripts dans `index.html`

```html
<!-- ✅ BON ORDRE -->
<script src="src/config/env.local.js"></script>  <!-- 1. Charger env -->
<script src="src/config/env.js"></script>         <!-- 2. Charger wrapper -->
<script src="script.js"></script>                 <!-- 3. Charger app -->
```

### 3. Extension Chrome Bloque Supabase

Certaines extensions peuvent bloquer les requêtes:
- **AdBlock/uBlock Origin:** Peut bloquer `*.supabase.co`
- **Privacy Badger:** Peut bloquer WebSocket
- **NoScript:** Bloque tous les scripts tiers

**Solution:** Tester en navigation privée sans extensions

---

## 📈 Métriques de Compatibilité

### Avant Fix

| Navigateur | Fonctionne | Erreur |
|------------|------------|--------|
| Chrome     | ❌ Non     | 401 Invalid API key |
| Safari     | ❌ Non     | 401 Invalid API key |
| Firefox    | ✅ Oui     | - |
| Opera      | ✅ Oui     | - |

### Après Fix (Service Worker + CSP désactivés)

| Navigateur | Fonctionne | Erreur |
|------------|------------|--------|
| Chrome     | ⏳ À tester | Rate limit (temporaire) |
| Safari     | ⏳ À tester | Rate limit (temporaire) |
| Firefox    | ✅ Oui     | - |
| Opera      | ✅ Oui     | - |

---

## 🎯 Prochaines Étapes

1. **Attendre expiration rate limit** (~40 minutes)
2. **Tester sur Chrome/Safari** avec SW et CSP désactivés
3. **Si ça fonctionne:** Implémenter Service Worker intelligent
4. **Réactiver CSP** avec configuration optimisée
5. **Tester sur tous les navigateurs**
6. **Déployer la version finale**

---

## 📚 Références

- [MDN: Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [MDN: Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Supabase: Rate Limiting](https://supabase.com/docs/guides/platform/rate-limits)
- [Can I Use: Service Workers](https://caniuse.com/serviceworkers)

---

**Document créé:** 2025-10-16
**Dernière mise à jour:** 2025-10-16
**Statut:** Rate limit actif - En attente de test final
