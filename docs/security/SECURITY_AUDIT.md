# 🔒 AUDIT DE SÉCURITÉ - Çetelem (Zikirmatik)

**Date:** 12 octobre 2025
**Application:** Çetelem - Application de compteur de zikir
**Version:** v3.5.1
**Audité par:** Claude Code

---

## 📋 RÉSUMÉ EXÉCUTIF

### ✅ Niveau de sécurité global : **MOYEN-BON**

L'application présente une architecture relativement sûre pour une PWA, mais comporte **3 vulnérabilités critiques** et **5 points d'amélioration** à corriger rapidement.

---

## 🚨 VULNÉRABILITÉS CRITIQUES

### 1. ⚠️ CLÉ API SUPABASE EXPOSÉE PUBLIQUEMENT
**Gravité:** CRITIQUE
**Localisation:** `src/config/env.local.js:16`

**Problème:**
```javascript
SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

La clé `anon` Supabase est visible dans le code source côté client. Bien que ce soit normal pour Supabase, cela expose l'API à :
- **Abus de quotas** : Un attaquant peut spammer vos endpoints
- **Injection de données** : Insertion massive de fausses analytics
- **Denial of Service** : Saturation de la base de données

**Impact utilisateur:**
- ❌ Coûts Supabase augmentés
- ❌ Performance dégradée
- ❌ Données corrompues

**Solution:**
✅ **DÉJÀ APPLIQUÉE** : Row Level Security (RLS) activé
⚠️ **À AJOUTER** :
- Rate limiting côté Supabase Edge Functions
- Monitoring des quotas
- Alertes sur abus détectés

---

### 2. ⚠️ POLITIQUES RLS TROP PERMISSIVES
**Gravité:** HAUTE
**Localisation:** `supabase/fix-401-errors.sql`

**Problème:**
```sql
-- TOUTES les opérations sont publiques (USING true)
CREATE POLICY "participants_delete_all" ON participants
  FOR DELETE
  USING (true);  -- ❌ N'IMPORTE QUI peut supprimer N'IMPORTE QUEL participant!
```

**Attaques possibles:**
- 🔴 Suppression malveillante de participants de groupe
- 🔴 Modification de scores (UPDATE sans vérification)
- 🔴 Pollution de données analytics

**Impact utilisateur:**
- ❌ Perte de données de groupe
- ❌ Scores manipulés
- ❌ Expérience utilisateur sabotée

**Solution:**
```sql
-- Limiter DELETE aux propriétaires seulement
CREATE POLICY "participants_delete_own" ON participants
  FOR DELETE
  USING (user_id = auth.uid() OR created_by = auth.uid());

-- Limiter UPDATE aux données propres
CREATE POLICY "participants_update_own" ON participants
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

---

### 3. ⚠️ INJECTION XSS POTENTIELLE
**Gravité:** MOYENNE-HAUTE
**Localisation:** `script.js` (lignes 352, 402, 741, 993, 1203)

**Problème:**
```javascript
// ❌ Injection directe de contenu utilisateur
confirmDiv.innerHTML = `<h3>${title}</h3><p>${message}</p>`;
li.innerHTML = `<strong>${cat}</strong>`; // cat = nom de catégorie saisi par l'utilisateur
```

**Attaque possible:**
1. Utilisateur crée une catégorie nommée: `<img src=x onerror=alert('XSS')>`
2. Le code l'insère via `innerHTML`
3. Script malveillant exécuté → vol de localStorage, redirection, etc.

**Impact utilisateur:**
- ❌ Vol de données localStorage (compteurs, stats)
- ❌ Redirection vers sites malveillants
- ❌ Injection de malware

**Solution:**
```javascript
// ✅ Utiliser textContent au lieu de innerHTML
const title = document.createElement('h3');
title.textContent = cat; // Échappement automatique
li.appendChild(title);

// OU utiliser une fonction de sanitization
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
```

---

## ⚠️ VULNÉRABILITÉS MOYENNES

### 4. localStorage NON CHIFFRÉ
**Gravité:** MOYENNE
**Localisation:** Tout `script.js`

**Problème:**
- Toutes les données (compteurs, catégories, notes) sont stockées en clair dans localStorage
- Accessible via DevTools ou extensions malveillantes
- Pas de chiffrement

**Impact utilisateur:**
- ❌ Données personnelles lisibles (noms de zikirs, notes privées)
- ❌ Extensions Chrome malveillantes peuvent voler les données
- ❌ Malware peut exfiltrer l'historique complet

**Solution:**
```javascript
// Chiffrer avant stockage
import CryptoJS from 'crypto-js';

function saveEncrypted(key, data) {
  const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), 'user-device-id').toString();
  localStorage.setItem(key, encrypted);
}
```

---

### 5. PAS DE VALIDATION CÔTÉ SERVEUR
**Gravité:** MOYENNE
**Localisation:** Supabase policies

**Problème:**
- Aucune validation de format dans les politiques RLS
- Un attaquant peut insérer n'importe quoi dans `analytics_events`

**Exemple d'attaque:**
```javascript
// Injection de 1 million d'événements
for(let i=0; i<1000000; i++) {
  supabase.from('analytics_events').insert({event_name: 'spam', event_data: {}})
}
```

**Impact:**
- ❌ Base de données saturée
- ❌ Coûts Supabase explosés
- ❌ Application inutilisable

**Solution:**
- Ajouter rate limiting (max 100 events/minute/IP)
- Valider format des données avant INSERT
- Limiter taille de `event_data` (max 5KB)

---

## ℹ️ POINTS D'AMÉLIORATION

### 6. Pas de CSP (Content Security Policy)
**Recommandation:** Ajouter dans `index.html`:
```html
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self';
               script-src 'self' https://cdn.jsdelivr.net;
               style-src 'self' 'unsafe-inline';
               img-src 'self' data:;">
```

### 7. Service Worker peut être détourné
**Recommandation:** Ajouter vérification d'intégrité dans `sw.js`

### 8. Pas de HTTPS Force
**Recommandation:** Forcer HTTPS dans Netlify headers

### 9. Pas d'authentification pour device_backups
**Recommandation:** Ajouter PIN code + expiration 7 jours

### 10. Analytics track trop de données
**Recommandation:** Minimiser les données collectées (RGPD)

---

## 🎯 PLAN D'ACTION PRIORITAIRE

### 🔴 URGENT (< 48h)
1. ✅ Corriger politiques RLS (participants_delete, participants_update)
2. ✅ Sanitiser toutes les injections innerHTML → textContent
3. ✅ Ajouter rate limiting Supabase (100 req/min/IP)

### 🟠 IMPORTANT (< 1 semaine)
4. Chiffrer localStorage avec clé dérivée de deviceId
5. Ajouter CSP headers
6. Implémenter monitoring quotas Supabase

### 🟡 RECOMMANDÉ (< 1 mois)
7. Audit externe par OWASP ZAP
8. Penetration testing
9. Documentation politique de sécurité

---

## 🛡️ CONCLUSION

**L'application est utilisable en production MAIS nécessite les corrections urgentes ci-dessus.**

### Risques pour l'utilisateur final:
- **FAIBLE** : Vol direct de données (localStorage non sensible)
- **MOYEN** : Manipulation de groupes/scores par des tiers
- **FAIBLE** : Injection XSS (nécessite action utilisateur)

### Risques pour le propriétaire:
- **ÉLEVÉ** : Abus de quotas Supabase → coûts
- **MOYEN** : Pollution de base de données
- **FAIBLE** : Réputation

---

**Rapport généré par:** Claude Code Security Audit
**Contact:** Appliquer les correctifs listés ci-dessus immédiatement
