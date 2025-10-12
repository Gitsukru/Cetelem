# 🛡️ GUIDE DE SÉCURITÉ - Çetelem

**Pour les développeurs** | **Version 1.0** | **12 octobre 2025**

---

## 📚 TABLE DES MATIÈRES

1. [Introduction](#introduction)
2. [Règles d'or de la sécurité](#règles-dor)
3. [Protection XSS](#protection-xss)
4. [Politiques RLS Supabase](#politiques-rls)
5. [Validation des entrées](#validation-des-entrées)
6. [Content Security Policy](#content-security-policy)
7. [Tests de sécurité](#tests-de-sécurité)
8. [Checklist avant commit](#checklist)
9. [Ressources](#ressources)

---

## 🎯 INTRODUCTION

Ce guide explique comment maintenir la sécurité de l'application Çetelem après les correctifs appliqués le 12 octobre 2025.

### Vulnérabilités corrigées:
- ✅ XSS (Cross-Site Scripting)
- ✅ Politiques RLS trop permissives
- ✅ Absence de rate limiting
- ✅ Pas de Content Security Policy

---

## 🌟 RÈGLES D'OR

### 1. **JAMAIS DE innerHTML AVEC INPUT UTILISATEUR**

```javascript
// ❌ DANGEREUX - Ne JAMAIS faire
const userName = getUserInput();
element.innerHTML = `<p>${userName}</p>`; // XSS possible!

// ✅ SÉCURISÉ - Toujours faire
const userName = getUserInput();
element.textContent = userName; // Échappement automatique

// OU créer des éléments
const p = document.createElement('p');
p.textContent = userName;
element.appendChild(p);
```

### 2. **TOUJOURS VALIDER LES ENTRÉES**

```javascript
// ❌ DANGEREUX - Pas de validation
function addCategory(name) {
    categories.push(name); // N'importe quoi peut être ajouté!
}

// ✅ SÉCURISÉ - Validation stricte
function addCategory(name) {
    const validation = Validators.validateCategoryName(name);

    if (!validation.valid) {
        throw new Error(validation.error);
    }

    categories.push(validation.value);
}
```

### 3. **VÉRIFIER LES PERMISSIONS (RLS)**

```sql
-- ❌ DANGEREUX - Tout le monde peut supprimer
CREATE POLICY "delete_all" ON participants
  FOR DELETE
  USING (true);

-- ✅ SÉCURISÉ - Seulement le propriétaire
CREATE POLICY "delete_own" ON participants
  FOR DELETE
  USING (auth.uid() = user_id);
```

### 4. **UTILISER LES UTILITAIRES DE SÉCURITÉ**

```javascript
// Importer l'utilitaire de sanitisation
import {
    escapeHtml,
    createSecureElement,
    sanitizeCategoryName
} from './src/utils/sanitizer.js';

// Créer des éléments sécurisés
const safeDiv = createSecureElement('div', userInput, {
    class: 'user-content',
    style: { color: 'blue' }
});
```

---

## 🔒 PROTECTION XSS

### Qu'est-ce que le XSS?

**XSS (Cross-Site Scripting)** permet à un attaquant d'injecter du code JavaScript malveillant dans votre application.

**Exemple d'attaque:**
```javascript
// Utilisateur crée une catégorie nommée:
<img src=x onerror=alert('XSS')>

// Si vous utilisez innerHTML:
element.innerHTML = `<p>${categoryName}</p>`;
// Résultat: Le code JavaScript s'exécute! ❌

// Si vous utilisez textContent:
element.textContent = categoryName;
// Résultat: Le code est affiché comme texte ✅
```

### Comment se protéger?

#### 1. **Utiliser textContent au lieu de innerHTML**

```javascript
// ❌ VULNÉRABLE
function displayCategory(name) {
    const div = document.createElement('div');
    div.innerHTML = `<strong>${name}</strong>`; // XSS!
    return div;
}

// ✅ SÉCURISÉ
function displayCategory(name) {
    const div = document.createElement('div');
    const strong = document.createElement('strong');
    strong.textContent = name; // Safe!
    div.appendChild(strong);
    return div;
}
```

#### 2. **Éviter les événements inline**

```javascript
// ❌ VULNÉRABLE
element.innerHTML = `<button onclick="deleteItem(${id})">Supprimer</button>`;

// ✅ SÉCURISÉ
const button = document.createElement('button');
button.textContent = 'Supprimer';
button.addEventListener('click', () => deleteItem(id));
element.appendChild(button);
```

#### 3. **Utiliser l'utilitaire sanitizer.js**

```javascript
import { createSecureElement, escapeHtml } from './src/utils/sanitizer.js';

// Créer un élément sécurisé
const safeElement = createSecureElement('div', userInput, {
    class: 'category-item'
});

// Échapper du HTML si nécessaire
const safeHTML = escapeHtml(userInput);
```

### Zones à risque dans le code:

| Fonction | Fichier | Ligne | Risque | Statut |
|----------|---------|-------|--------|--------|
| `updateCategoriesList()` | script.js | 741 | ✅ CORRIGÉ | textContent |
| `updateStats()` | script.js | 1024 | ✅ CORRIGÉ | createElement |
| `showCustomConfirm()` | script.js | 352 | ✅ CORRIGÉ | DOM séparé |
| `resetAllData()` | script.js | 1203 | ✅ CORRIGÉ | createElement |

---

## 🗄️ POLITIQUES RLS SUPABASE

### Qu'est-ce que RLS?

**RLS (Row Level Security)** contrôle qui peut accéder à quelles données dans Supabase.

### Principes de base:

```sql
-- Structure d'une politique RLS
CREATE POLICY "nom_de_la_politique" ON nom_table
  FOR operation  -- SELECT, INSERT, UPDATE, DELETE
  USING (condition);  -- Qui peut lire?
  WITH CHECK (condition);  -- Qui peut écrire?
```

### Exemples de politiques sécurisées:

#### 1. **Lecture publique, écriture restreinte**

```sql
-- Tout le monde peut lire
CREATE POLICY "groups_select_all" ON groups
  FOR SELECT
  USING (true);

-- Seulement les authentifiés peuvent créer
CREATE POLICY "groups_insert_authenticated" ON groups
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
```

#### 2. **Seulement ses propres données**

```sql
-- Lire seulement ses participants
CREATE POLICY "participants_select_own" ON participants
  FOR SELECT
  USING (user_id = auth.uid() OR created_by = auth.uid());

-- Modifier seulement ses participants
CREATE POLICY "participants_update_own" ON participants
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Supprimer seulement ses participants
CREATE POLICY "participants_delete_own" ON participants
  FOR DELETE
  USING (user_id = auth.uid() OR created_by = auth.uid());
```

#### 3. **Rate limiting SQL**

```sql
-- Limiter à 100 insertions par heure
CREATE POLICY "analytics_rate_limited" ON analytics_events
  FOR INSERT
  WITH CHECK (
    (SELECT COUNT(*)
     FROM analytics_events
     WHERE created_at > NOW() - INTERVAL '1 hour'
    ) < 100
  );
```

### Appliquer les politiques:

1. **Ouvrir Supabase Dashboard**
2. **Aller dans SQL Editor**
3. **Copier le contenu de `supabase/secure-rls-policies.sql`**
4. **Exécuter le script**
5. **Vérifier qu'il n'y a pas d'erreurs**

### Tester les politiques:

```sql
-- Tester la lecture
SELECT * FROM participants WHERE user_id = 'test-user-id';

-- Tester la suppression (devrait échouer si pas le propriétaire)
DELETE FROM participants WHERE user_id != auth.uid();
```

---

## ✅ VALIDATION DES ENTRÉES

### Utiliser le module Validators

```javascript
import { Validators } from './src/utils/validators.js';

// Valider un nom de catégorie
function addCategory(name) {
    const validation = Validators.validateCategoryName(name);

    if (!validation.valid) {
        showCustomAlert(`❌ ${validation.error}`, 'warning');
        return;
    }

    // Utiliser validation.value (nettoyé)
    categories.push(validation.value);
}
```

### Règles de validation:

```javascript
// Nom de catégorie
- Longueur: 1-50 caractères
- Pas de caractères HTML: < > " ' `
- Trim automatique

// Nom d'utilisateur
- Longueur: 1-20 caractères
- Pas de caractères spéciaux dangereux

// Code de groupe
- Format: 6 caractères alphanumériques
- Majuscules seulement
```

### Créer vos propres validateurs:

```javascript
// Dans validators.js
validateEmail(email) {
    if (!email || typeof email !== 'string') {
        return { valid: false, error: 'Email requis' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return { valid: false, error: 'Email invalide' };
    }

    return { valid: true, value: email.trim().toLowerCase() };
}
```

---

## 🛡️ CONTENT SECURITY POLICY

### Qu'est-ce que CSP?

**CSP** est un header HTTP qui limite les sources de contenu autorisées, bloquant les attaques XSS.

### Configuration actuelle:

```html
<meta http-equiv="Content-Security-Policy" content="
    default-src 'self';
    script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net;
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https:;
    connect-src 'self' https://*.supabase.co wss://*.supabase.co;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
">
```

### Directives importantes:

| Directive | Valeur | Explication |
|-----------|--------|-------------|
| `default-src 'self'` | Même origine | Par défaut, seulement notre domaine |
| `script-src` | self + CDN | Scripts seulement de notre domaine et CDN |
| `object-src 'none'` | Aucun | Pas de Flash, Java, etc. |
| `frame-ancestors 'none'` | Aucun | Empêche l'inclusion en iframe |

### Modifier le CSP:

Si vous devez ajouter une nouvelle source (ex: nouvelle CDN):

```html
<!-- Avant -->
script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net;

<!-- Après (ajouter nouveau CDN) -->
script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://unpkg.com;
```

**⚠️ Ne jamais utiliser `'unsafe-eval'` ou relâcher les restrictions sans raison!**

---

## 🧪 TESTS DE SÉCURITÉ

### Tests manuels:

#### 1. **Tester XSS dans les catégories**

```
1. Ouvrir l'application
2. Ajouter une catégorie avec: <img src=x onerror=alert('XSS')>
3. ✅ Résultat attendu: Le texte s'affiche tel quel, sans alerte
4. ❌ Si alerte apparaît: XSS non corrigé!
```

#### 2. **Tester les politiques RLS**

```
1. Se connecter avec utilisateur A
2. Créer un participant dans un groupe
3. Se déconnecter et se connecter avec utilisateur B
4. Essayer de supprimer le participant de A
5. ✅ Résultat attendu: Erreur 403 Forbidden
6. ❌ Si suppression réussit: RLS non appliqué!
```

### Tests automatisés:

Ouvrir `tests/security.test.html` dans le navigateur:

```bash
# Servir le fichier localement
cd /Users/sukru/Documents/GitHub/zikirmatik
python3 -m http.server 8000

# Ouvrir dans le navigateur
open http://localhost:8000/tests/security.test.html
```

Les tests vérifieront automatiquement:
- ✅ Protection XSS (5 vecteurs d'attaque)
- ✅ Sanitisation DOM
- ✅ Présence du CSP
- ✅ Directives CSP strictes

### Tests avec OWASP ZAP (Recommandé):

```bash
# Installer OWASP ZAP
brew install --cask owasp-zap

# Lancer un scan
zap-cli quick-scan http://localhost:8000
```

---

## ✅ CHECKLIST AVANT COMMIT

Avant de commiter du code, vérifier:

### 🔍 Sécurité:

- [ ] Aucun `innerHTML` avec input utilisateur
- [ ] Tous les inputs sont validés avec `Validators`
- [ ] Aucun `eval()` ou `new Function()`
- [ ] Pas d'événements inline (`onclick`, `onerror`, etc.)
- [ ] Les politiques RLS sont à jour si nouvelles tables
- [ ] Pas de clés secrètes dans le code (utiliser `.env`)

### 🧪 Tests:

- [ ] Tests manuels XSS passés
- [ ] Tests automatisés passés (`security.test.html`)
- [ ] Pas de régression sur les fonctionnalités existantes

### 📝 Documentation:

- [ ] Code commenté si logique complexe
- [ ] SECURITY_GUIDE.md à jour si nouveaux patterns
- [ ] README à jour si nouvelles dépendances

### 🚀 Performance:

- [ ] Pas de boucles infinies
- [ ] Pas de requêtes Supabase non optimisées
- [ ] Debounce sur les événements fréquents

---

## 📚 RESSOURCES

### Documentation:

- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [MDN Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)

### Outils:

- [OWASP ZAP](https://www.zaproxy.org/) - Scanner de vulnérabilités
- [Burp Suite](https://portswigger.net/burp) - Test de sécurité avancé
- [DOMPurify](https://github.com/cure53/DOMPurify) - Sanitisation HTML

### Fichiers du projet:

- `SECURITY_AUDIT.md` - Audit de sécurité complet
- `SECURITY_FIXES_APPLIED.md` - Correctifs appliqués
- `src/utils/sanitizer.js` - Utilitaires de sécurisation
- `supabase/secure-rls-policies.sql` - Politiques RLS sécurisées
- `tests/security.test.html` - Tests de sécurité automatisés

---

## 🆘 SUPPORT

### Problème de sécurité détecté?

1. **NE PAS** créer d'issue publique GitHub
2. **NE PAS** exploiter la vulnérabilité
3. **CONTACTER** l'équipe en privé: security@zikirmatik.app
4. **FOURNIR** les détails: type, impact, reproduction
5. **ATTENDRE** la confirmation de correction

### Questions sur ce guide?

- Créer une issue GitHub avec le tag `[SECURITY-QUESTION]`
- Contacter sur email: dev@zikirmatik.app

---

**Dernière mise à jour:** 12 octobre 2025
**Version:** 1.0
**Maintenu par:** Équipe Sécurité Çetelem
