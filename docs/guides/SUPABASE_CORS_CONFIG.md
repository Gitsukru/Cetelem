# 🌐 Configuration CORS pour Supabase

## 🎯 Problème

**Symptôme:** Erreur 401 "Invalid API key" sur Chrome/Safari uniquement
**Cause:** Configuration CORS manquante ou trop stricte dans Supabase

Chrome et Safari appliquent les politiques CORS beaucoup plus strictement que Firefox/Opera.

---

## ✅ Solution: Configurer CORS dans Supabase

### Étape 1: Accéder aux Paramètres Supabase

1. **Ouvrir le Dashboard Supabase:**
   ```
   https://app.supabase.com/project/sxtcyznkxtlcgkgrdrbi
   ```

2. **Naviguer vers:** `Settings` → `API` → `CORS Settings`

### Étape 2: Ajouter les Domaines Autorisés

Dans la section **"CORS Settings"** ou **"Allowed Origins"**, ajoutez:

#### Pour Développement Local:

```
http://localhost:3000
http://localhost:8080
http://localhost:5173
http://127.0.0.1:3000
http://127.0.0.1:8080
http://127.0.0.1:5173
file://
```

#### Pour Production (Netlify):

```
https://cetelem.netlify.app
https://www.cetelem.netlify.app
https://*.netlify.app
```

#### Configuration Complète Recommandée:

Si l'option existe, configurez comme ceci:

```json
{
  "allowedOrigins": [
    "http://localhost:3000",
    "http://localhost:8080",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:8080",
    "http://127.0.0.1:5173",
    "file://",
    "https://cetelem.netlify.app",
    "https://*.netlify.app"
  ],
  "allowedMethods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  "allowedHeaders": ["*"],
  "exposedHeaders": ["*"],
  "maxAge": 3600,
  "allowCredentials": true
}
```

### Étape 3: Vérifier la Configuration Auth

1. **Naviguer vers:** `Authentication` → `URL Configuration`

2. **Ajouter les URLs autorisées:**
   - **Site URL:** `https://cetelem.netlify.app`
   - **Redirect URLs:**
     ```
     http://localhost:3000
     http://localhost:8080
     http://localhost:5173
     http://127.0.0.1:3000
     https://cetelem.netlify.app
     https://*.netlify.app
     ```

### Étape 4: Headers CORS pour Realtime

Si vous utilisez les **Realtime subscriptions**, vérifiez aussi:

1. **Naviguer vers:** `Settings` → `API` → `Realtime`

2. **Activer:**
   - ✅ Enable Realtime
   - ✅ Allow WebSocket connections

3. **Ajouter les origines autorisées** (même liste que CORS)

---

## 🔍 Vérification

### Test 1: Vérifier CORS avec curl

```bash
# Test preflight request (OPTIONS)
curl -X OPTIONS "https://sxtcyznkxtlcgkgrdrbi.supabase.co/rest/v1/groups" \
  -H "Origin: https://cetelem.netlify.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: apikey,content-type" \
  -v
```

**Résultat attendu:**
```
< HTTP/2 204
< access-control-allow-origin: https://cetelem.netlify.app
< access-control-allow-methods: GET, POST, PUT, PATCH, DELETE
< access-control-allow-headers: apikey, content-type
< access-control-max-age: 3600
```

### Test 2: Vérifier dans Chrome DevTools

1. **Ouvrir DevTools** (F12)
2. **Onglet Network**
3. **Essayer de créer un groupe**
4. **Chercher la requête vers Supabase**
5. **Vérifier les headers de réponse:**

```
Response Headers:
  access-control-allow-origin: https://cetelem.netlify.app
  access-control-allow-credentials: true
```

### Test 3: Console Browser

Dans la console Chrome, vérifier s'il y a des erreurs CORS:

```javascript
// ❌ Erreur CORS typique:
Access to fetch at 'https://sxtcyznkxtlcgkgrdrbi.supabase.co/rest/v1/groups'
from origin 'https://cetelem.netlify.app' has been blocked by CORS policy:
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

---

## 🐛 Problèmes Fréquents

### Problème 1: Wildcard (*) ne fonctionne pas

**Symptôme:** `Access-Control-Allow-Origin: *` ne fonctionne pas avec credentials

**Solution:** Spécifier les domaines explicitement au lieu de `*`

```diff
- allowedOrigins: ["*"]
+ allowedOrigins: [
+   "http://localhost:3000",
+   "https://cetelem.netlify.app"
+ ]
```

### Problème 2: file:// ne fonctionne pas

**Symptôme:** Erreur CORS quand on ouvre `index.html` directement

**Solution:** Utiliser un serveur local au lieu de `file://`

```bash
# Option 1: Python
python3 -m http.server 8080

# Option 2: Node.js
npx http-server -p 8080

# Option 3: PHP
php -S localhost:8080
```

### Problème 3: Sous-domaine Netlify non autorisé

**Symptôme:** Fonctionne sur `cetelem.netlify.app` mais pas sur `deploy-preview-123--cetelem.netlify.app`

**Solution:** Utiliser un wildcard Netlify

```
https://*.netlify.app
```

---

## 🔧 Alternative: Headers CORS dans Netlify

Si Supabase ne permet pas de configurer CORS facilement, ajoutez les headers dans Netlify:

**Fichier:** `netlify.toml`

```toml
[[headers]]
  for = "/api/*"
  [headers.values]
    Access-Control-Allow-Origin = "*"
    Access-Control-Allow-Methods = "GET, POST, PUT, DELETE, OPTIONS"
    Access-Control-Allow-Headers = "Content-Type, Authorization, apikey"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

**⚠️ Note:** Cela ne résout PAS le problème si Supabase bloque lui-même les requêtes CORS.

---

## 📊 Différences Chrome vs Firefox

| Comportement | Chrome/Safari | Firefox/Opera |
|--------------|---------------|---------------|
| **CORS Preflight** | Systématique pour POST/PUT/DELETE | Moins strict, cache plus |
| **Credentials** | Requiert origin explicite | Accepte wildcard parfois |
| **file:// protocol** | Bloque tout | Plus permissif |
| **WebSocket Origin** | Vérifie strictement | Plus permissif |

C'est pourquoi **Firefox/Opera fonctionnent** mais **Chrome/Safari ne fonctionnent pas**!

---

## ✅ Checklist de Configuration

- [ ] 1. Aller sur Supabase Dashboard
- [ ] 2. Settings → API → CORS Settings
- [ ] 3. Ajouter `http://localhost:*`
- [ ] 4. Ajouter `https://cetelem.netlify.app`
- [ ] 5. Ajouter `https://*.netlify.app`
- [ ] 6. Authentication → URL Configuration
- [ ] 7. Ajouter les mêmes URLs dans Redirect URLs
- [ ] 8. Sauvegarder les modifications
- [ ] 9. Attendre 1-2 minutes (propagation)
- [ ] 10. Tester sur Chrome avec hard refresh (Cmd+Shift+R)

---

## 🎯 Résultat Attendu

Après configuration:

```javascript
// Console Chrome - AVANT:
❌ POST https://...supabase.co/rest/v1/groups 401 (Unauthorized)
❌ Access to fetch blocked by CORS policy

// Console Chrome - APRÈS:
✅ POST https://...supabase.co/rest/v1/groups 201 (Created)
✅ Response headers include Access-Control-Allow-Origin
```

---

## 📞 Support

Si le problème persiste après configuration CORS:

1. **Vérifier les logs Supabase:**
   - Dashboard → Logs → API Logs
   - Chercher les requêtes 401

2. **Contacter le support Supabase:**
   - https://supabase.com/support
   - Mentionner: "CORS issue with Chrome/Safari, works on Firefox"

3. **Vérifier la documentation:**
   - https://supabase.com/docs/guides/api/cors

---

**Document créé:** 2025-10-16
**Problème:** Erreur 401 Chrome/Safari uniquement
**Solution:** Configuration CORS dans Supabase Dashboard
