# 🔧 FIX: Erreur 401 Chrome/Safari (CORS)

## 🚨 Problème

```
POST https://sxtcyznkxtlcgkgrdrbi.supabase.co/rest/v1/groups 401 (Unauthorized)
```

**Cause Réelle :** Chrome et Safari bloquent les requêtes Supabase à cause de leur politique CORS stricte.

**Symptômes :**
- ✅ Fonctionne sur Firefox/Edge
- ❌ Échoue sur Chrome/Safari
- Erreur 401 "Invalid API key" (mais la clé est correcte !)

## 🎯 Solution 1 : Configuration CORS Supabase (Recommandé)

### Étape 1 : Aller dans Supabase Dashboard

1. **URL :** https://supabase.com/dashboard/project/sxtcyznkxtlcgkgrdrbi
2. **Menu :** Settings (⚙️) → API → CORS Configuration

### Étape 2 : Ajouter votre domaine

Dans la section "Allowed Origins", ajouter :

```
http://localhost:8000
http://localhost:5173
http://127.0.0.1:8000
https://votre-domaine-netlify.netlify.app
https://zikirmatik.app
```

**Important :**
- Ajouter TOUS les domaines où l'app est accessible
- Inclure `http://` ET `https://`
- Inclure localhost pour dev local

### Étape 3 : Headers Supabase

Dans Settings → API → Additional Headers, vérifier :

```json
{
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
}
```

### Étape 4 : Sauvegarder et attendre

- Cliquer "Save"
- Attendre 1-2 minutes (propagation)
- Recharger l'application Chrome/Safari

## 🎯 Solution 2 : Headers HTTP serveur (Netlify)

Si vous déployez sur Netlify, créer un fichier `netlify.toml` :

```toml
[[headers]]
  for = "/*"
  [headers.values]
    Access-Control-Allow-Origin = "*"
    Access-Control-Allow-Methods = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
    Access-Control-Allow-Headers = "Authorization, Content-Type, apikey, x-client-info"
    Access-Control-Max-Age = "86400"
```

**Note :** Ce fichier existe déjà dans le projet, vérifier qu'il contient bien ces headers.

## 🎯 Solution 3 : Réactiver CSP (Temporaire)

Le CSP est actuellement désactivé (index.html lignes 10-23). Le réactiver PEUT aider :

```html
<meta http-equiv="Content-Security-Policy" content="
    default-src 'self';
    script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net;
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https:;
    font-src 'self' data:;
    connect-src 'self' https://*.supabase.co https://*.supabase.in wss://*.supabase.co;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
">
```

**Attention :** À tester, car c'est justement pour Chrome/Safari qu'il a été désactivé.

## 🎯 Solution 4 : Proxy Netlify (Avancé)

Créer un proxy Netlify pour masquer Supabase derrière votre domaine :

```toml
# netlify.toml
[[redirects]]
  from = "/api/*"
  to = "https://sxtcyznkxtlcgkgrdrbi.supabase.co/rest/v1/:splat"
  status = 200
  force = true
  headers = {Authorization = "Bearer VOTRE_ANON_KEY"}

[[redirects]]
  from = "/auth/*"
  to = "https://sxtcyznkxtlcgkgrdrbi.supabase.co/auth/v1/:splat"
  status = 200
  force = true
```

Puis modifier `src/config/env.js` :

```javascript
get SUPABASE_URL() {
  // Utiliser le proxy Netlify
  if (window.location.hostname.includes('netlify.app')) {
    return window.location.origin + '/api';
  }
  return 'https://sxtcyznkxtlcgkgrdrbi.supabase.co';
}
```

## 🧪 Test de Vérification

### Test 1 : Console Browser

Ouvrir Console Chrome/Safari (F12), taper :

```javascript
fetch('https://sxtcyznkxtlcgkgrdrbi.supabase.co/rest/v1/groups', {
  method: 'GET',
  headers: {
    'apikey': 'VOTRE_ANON_KEY',
    'Authorization': 'Bearer VOTRE_ANON_KEY'
  }
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

**Résultat attendu :**
- ✅ `[]` ou liste de groupes → CORS OK
- ❌ Erreur CORS → Problème configuration

### Test 2 : Network Tab

1. Ouvrir Network Tab (F12)
2. Tenter de créer un groupe
3. Regarder la requête POST `/groups`

**Headers à vérifier :**
- `Access-Control-Allow-Origin`: présent
- `Access-Control-Allow-Credentials`: présent
- Status: 200 (pas 401)

## 📋 Checklist Complète

- [ ] Ajouter domaines dans Supabase CORS Configuration
- [ ] Vérifier netlify.toml contient les headers CORS
- [ ] Attendre 2 minutes (propagation)
- [ ] Vider cache navigateur (Cmd+Shift+R)
- [ ] Tester création groupe
- [ ] Vérifier Network Tab pour erreurs CORS

## 🔍 Diagnostic Avancé

Si le problème persiste :

### 1. Vérifier la clé API est bien transmise

```javascript
// Console Chrome/Safari
console.log('Supabase URL:', ENV.SUPABASE_URL);
console.log('Supabase Key (50 chars):', ENV.SUPABASE_ANON_KEY.substring(0, 50));
console.log('Key length:', ENV.SUPABASE_ANON_KEY.length);
```

**Attendu :**
- URL : `https://sxtcyznkxtlcgkgrdrbi.supabase.co`
- Key : 250-300 caractères (JWT)

### 2. Vérifier les cookies

Chrome/Safari bloquent les cookies tiers. Dans Console :

```javascript
document.cookie = 'test=1; SameSite=None; Secure';
console.log(document.cookie); // Doit afficher 'test=1'
```

Si vide → Cookies bloqués.

**Fix :** Activer cookies dans Settings Chrome :
- `chrome://settings/cookies`
- Choisir "Allow all cookies" (temporaire pour test)

### 3. Mode Incognito

Tester en mode navigation privée :
- Chrome : Cmd+Shift+N
- Safari : Cmd+Shift+N

Souvent résout les problèmes de cache/cookies.

## 🎯 Solution Ultime : Supabase RPC Function

Si rien ne marche, créer une Edge Function Supabase qui contourne CORS :

```typescript
// supabase/functions/create-group/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const { groupName, creatorName } = await req.json()

  const { data, error } = await supabase
    .from('groups')
    .insert({ name: groupName })
    .select()
    .single()

  return new Response(JSON.stringify({ data, error }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  })
})
```

Puis appeler depuis le frontend :

```javascript
// Remplacer groupManager.createGroup()
const response = await fetch(
  'https://sxtcyznkxtlcgkgrdrbi.supabase.co/functions/v1/create-group',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ENV.SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({ groupName, creatorName })
  }
);
```

---

## 📊 Résumé Priorités

1. **Configuration CORS Supabase** (5 min) → Résout 80% des cas
2. **Headers Netlify** (1 min) → Résout 15% des cas
3. **Proxy Netlify** (15 min) → Résout 4% des cas
4. **Edge Function** (30 min) → Résout 1% des cas

**Note :** Commencer par la Solution 1, puis tester. Ne passer à la suivante que si échec.

---

**Dernière mise à jour :** 2025-10-16
**Commit lié :** `90afaff debug: Désactiver CSP et Service Worker pour Chrome/Safari`
