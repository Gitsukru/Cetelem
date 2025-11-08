# Audit XSS - innerHTML Usage

Total détecté: 72 occurrences dans 16 fichiers

## Catégorisation par risque

### 🔴 CRITIQUE - Données utilisateur non échappées (HAUTE PRIORITÉ)

| Fichier | Ligne | Code | Risque |
|---------|-------|------|--------|
| script_chat.js | 228 | `messageDiv.innerHTML = ...` | Message chat utilisateur |
| script_chat.js | 434 | `separator.innerHTML = ...` | Label date (probablement sûr) |
| script_group.js | 330 | `container.innerHTML = html` | Leaderboard avec noms participants |
| script_group.js | 460 | `container.innerHTML = html` | Détails participants |
| script_group.js | 611 | `historyContainer.innerHTML = html` | Historique groupes |
| script_books.js | 244 | `container.innerHTML = books.map(...)` | Liste livres (contenu JSON) |
| script_notifications.js | 131 | `container.innerHTML = reminders.map(...)` | Rappels utilisateur |
| admin/admin-dashboard.js | 303 | `container.innerHTML = recentEvents.map(...)` | Events analytics |
| admin/admin-dashboard.js | 342 | `container.innerHTML = topCategories.map(...)` | Catégories zikir |
| admin/admin-dashboard.js | 764 | `container.innerHTML = sortedCategories.map(...)` | Catégories triées |
| admin/admin-dashboard.js | 1017 | `container.innerHTML = topGroups.map(...)` | Liste groupes |
| admin/admin-dashboard.js | 1296 | `container.innerHTML = alerts.map(...)` | Alertes système |
| admin/admin-dashboard.js | 1828 | `container.innerHTML = errors.map(...)` | Erreurs système |

**Action requise:** Vérifier chaque cas et échapper avec `escapeHtml()` si données utilisateur.

---

### 🟡 MOYEN - Templates statiques avec variables

| Fichier | Ligne | Code | Type |
|---------|-------|------|------|
| script_chat.js | 172 | Empty state message | Template statique |
| script_chat.js | 466 | Chat error message | Template statique |
| script_notifications.js | 111 | Notification UI | Template statique |
| script_notifications.js | 181 | Modal content | Template statique |
| src/utils/welcome-modal.js | 29 | Welcome modal HTML | Template statique |
| src/utils/modal-utils.js | 32 | Confirm dialog | Template statique |
| src/utils/modal-utils.js | 125 | Custom modal | Template statique |
| src/utils/device-backup.js | 320, 336, 390, 401 | Status messages | Messages système |
| script.js | 375 | Message element | Comment dit "provient du code" |
| admin/admin-auth.js | 121, 345, 363, 502, 539 | Auth UI templates | Templates statiques |
| admin/admin-dashboard.js | 274, 299, 338, 760, 1013, 1294, 1787, 1824, 1893 | Dashboard UI | Templates statiques |

**Action:** Acceptable si AUCUNE donnée utilisateur. Vérifier variables interpolées.

---

### 🟢 FAIBLE - Clear operations / Contenu sûr

| Fichier | Ligne | Code | Raison |
|---------|-------|------|--------|
| script_chat.js | 168 | `container.innerHTML = ''` | Clear DOM |
| script_books.js | 236, 324 | `container.innerHTML = ''` | Clear DOM |
| script_group_ui.js | 41 | `container.innerHTML = ''` | Clear DOM |
| script_calendar.js | 64 | `container.innerHTML = ''` | Clear DOM |
| script.js | 804, 815, 830, 1757, 3335 | Clear DOM / Options statiques | Clear ou template |
| script.js | 1354, 1382 | Button text | Texte statique |
| script.js | 2364 | Confirmation text | Texte statique avec <strong> |
| src/utils/sanitizer.js | 82, 120 | `safeHTML` function | Fonction de sanitization |
| src/utils/modal-utils.js | 86 | `alertDiv.innerHTML = message` | Message pré-validé |
| tests/validators.test.js | 152 | Test code | Code de test |

**Action:** Aucune (sûr).

---

## Corrections prioritaires

### 1. script_chat.js:228 - Message utilisateur

**Avant:**
```javascript
messageDiv.innerHTML = `
  <div class="message-content">${escapeHtml(message.content)}</div>
  <div class="message-meta">
    <span class="message-author">${message.participant_name}</span>
  </div>
`
```

**Problème:** `message.participant_name` n'est pas échappé !

**Après:**
```javascript
const safeName = escapeHtml(message.participant_name);
const safeContent = escapeHtml(message.content);

messageDiv.innerHTML = `
  <div class="message-content">${safeContent}</div>
  <div class="message-meta">
    <span class="message-author">${safeName}</span>
  </div>
`
```

---

### 2. script_group.js - Déjà partiellement corrigé

**Status:** participant.name échappé dans leaderboard (Phase 1)
**Restant:** Vérifier autres usages dans détails et historique

---

### 3. script_books.js:244 - Liste livres

**Analyse:** Livres proviennent de `tesbihat.js` (données statiques JSON)

**Verdict:** FAIBLE risque (contenu contrôlé par développeur)

---

### 4. admin/admin-dashboard.js - Multiples occurrences

**Analyse:** Dashboard admin avec données analytics
- event_name: vient du code
- group names: vient de Supabase (peut contenir données utilisateur!)
- error messages: vient du système

**Action:** Vérifier `topGroups.map()` ligne 1017 → group.name doit être échappé

---

## Résumé par priorité

| Priorité | Fichiers | Occurrences | Action |
|----------|----------|-------------|--------|
| 🔴 CRITIQUE | 4 | ~10 | Échapper immédiatement |
| 🟡 MOYEN | 8 | ~30 | Audit détaillé, échapper si nécessaire |
| 🟢 FAIBLE | 10 | ~32 | Aucune action |

---

## Checklist corrections

- [ ] script_chat.js:228 - Échapper participant_name
- [ ] script_group.js:330 - Vérifier tous les champs participants
- [ ] script_group.js:460 - Vérifier détails participants
- [ ] script_group.js:611 - Vérifier historique groupes
- [ ] script_notifications.js:131 - Vérifier contenu rappels
- [ ] admin/admin-dashboard.js:1017 - Échapper group.name
- [ ] admin/admin-dashboard.js:342 - Vérifier noms catégories (probablement sûr)
- [ ] Audit complet script.js:375 - Vérifier source de `message`
- [ ] Audit device-backup.js - Vérifier messages d'erreur

---

## Méthodologie

Pour chaque innerHTML:
1. Identifier source des données (utilisateur vs code)
2. Si utilisateur: échapper avec `escapeHtml()`
3. Si code: acceptable
4. Si mixte: échapper uniquement parties utilisateur
5. Préférer template literals avec escapeHtml() vs innerHTML raw

**Fonction disponible:** `window.escapeHtml(str)` (déjà chargée globalement)
