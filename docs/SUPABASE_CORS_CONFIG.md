# 🔧 Configuration CORS Supabase pour cetelems.netlify.app

## 📋 Instructions Étape par Étape

### 1. Ouvrir Supabase Dashboard

**URL directe :**
```
https://supabase.com/dashboard/project/sxtcyznkxtlcgkgrdrbi/settings/api
```

### 2. Aller dans la section CORS

1. Cliquer sur **Settings** (⚙️) dans la barre latérale gauche
2. Cliquer sur **API**
3. Scroller vers le bas jusqu'à **"CORS Configuration"**

### 3. Ajouter les domaines autorisés

Dans le champ **"Allowed origins"**, ajouter ces lignes (UNE PAR LIGNE) :

```
http://localhost:8000
http://localhost:5173
http://127.0.0.1:8000
http://127.0.0.1:5173
https://cetelems.netlify.app
```

**Important :**
- ✅ Inclure `http://` pour localhost (pas de HTTPS en local)
- ✅ Inclure `https://` pour Netlify (HTTPS uniquement)
- ✅ PAS de slash final `/` à la fin des URLs

### 4. Vérifier les Additional Headers (Optionnel)

Dans la même page, section **"Additional Headers"**, vérifier que ces headers sont présents :

```
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
Access-Control-Allow-Headers: authorization, x-client-info, apikey, content-type
```

**Note :** Ces headers sont normalement présents par défaut. Si absents, les ajouter.

### 5. Sauvegarder

1. Cliquer sur **"Save"** en bas de la page
2. Attendre 1-2 minutes pour la propagation

### 6. Vérification (Console Browser)

Après sauvegarde, tester dans la console Chrome/Safari :

```javascript
fetch('https://sxtcyznkxtlcgkgrdrbi.supabase.co/rest/v1/groups', {
  method: 'GET',
  headers: {
    'apikey': ENV.SUPABASE_ANON_KEY,
    'Authorization': 'Bearer ' + ENV.SUPABASE_ANON_KEY
  }
})
.then(r => {
  console.log('Status:', r.status);
  return r.json();
})
.then(data => console.log('Data:', data))
.catch(err => console.error('Error:', err));
```

**Résultat attendu :**
- ✅ Status: 200
- ✅ Data: [] (liste vide ou groupes existants)
- ❌ Si erreur CORS → Vérifier domaines bien ajoutés

## 📸 Screenshots

### Étape 1 : Settings → API
```
[Dashboard] → Settings (⚙️) → API
```

### Étape 2 : CORS Configuration
```
Scroller vers le bas jusqu'à "CORS Configuration"
```

### Étape 3 : Allowed Origins
```
[Champ texte avec liste des domaines]
http://localhost:8000
http://localhost:5173
http://127.0.0.1:8000
http://127.0.0.1:5173
https://cetelems.netlify.app
```

## ⏱️ Timeline

1. **Maintenant** : Configurer CORS Supabase (5 min)
2. **Pendant ce temps** : Netlify redéploie automatiquement (1-2 min)
3. **Après** : Tester sur https://cetelems.netlify.app (Chrome/Safari)

## 🔍 Dépannage

### Erreur : "Invalid API key" persiste

1. **Vérifier les domaines** :
   - Aller dans Supabase → Settings → API → CORS Configuration
   - Vérifier que `https://cetelems.netlify.app` est bien dans la liste
   - Pas de typo, pas de slash final

2. **Attendre la propagation** :
   - Changements CORS peuvent prendre 2-3 minutes
   - Vider cache navigateur (Cmd+Shift+R)

3. **Vérifier les headers Netlify** :
   - Aller sur https://cetelems.netlify.app
   - F12 → Network → Sélectionner une requête
   - Vérifier présence header `Access-Control-Allow-Origin`

### Test rapide CORS

```bash
curl -I -X OPTIONS https://cetelems.netlify.app \
  -H "Origin: https://cetelems.netlify.app" \
  -H "Access-Control-Request-Method: POST"
```

**Résultat attendu :**
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
```

## ✅ Checklist Complète

- [ ] Ouvrir Supabase Dashboard → Settings → API
- [ ] Scroller vers CORS Configuration
- [ ] Ajouter les 5 domaines (localhost + cetelems.netlify.app)
- [ ] Cliquer "Save"
- [ ] Attendre 2 minutes
- [ ] Aller sur https://cetelems.netlify.app
- [ ] Vider cache (Cmd+Shift+R)
- [ ] Tester création groupe

## 📞 Support

Si le problème persiste après ces étapes :

1. Vérifier que le déploiement Netlify est terminé
2. Vérifier les logs Netlify pour erreurs
3. Tester en mode navigation privée (Cmd+Shift+N)
4. Vérifier console browser pour messages CORS

---

**Dernière mise à jour :** 2025-10-16
**Domaine :** cetelems.netlify.app
**Projet Supabase :** sxtcyznkxtlcgkgrdrbi
