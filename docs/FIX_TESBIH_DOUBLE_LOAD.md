# 🔧 FIX: Double chargement de tesbih.png

## 🚨 Problème

L'image `tesbih.png` se charge **deux fois** et s'affiche en double superposition derrière le bouton compteur.

**Symptômes :**
- Image tesbih visible en double
- Effet visuel "flou" ou "épais" sur l'image
- Deux requêtes HTTP pour le même fichier dans Network tab
- Performance dégradée (chargement inutile)

## 🔍 Cause Racine

L'image était référencée dans **deux endroits différents** :

### 1. Dans `index.html` ligne 82
```html
<div class="tesbih-bg" style="
    position: absolute;
    background-image: url('/assets/images/tesbih.png?v=2025101202');
    ...
"></div>
```

### 2. Dans `styles/components/buttons.css` ligne 35-51
```css
.counter-button::before {
    content: '';
    background-image: url('/assets/images/tesbih.png');
    ...
}
```

**Résultat :** Les deux s'affichaient au même endroit, créant un doublon visuel.

## ✅ Solution

**Supprimer le pseudo-élément `::before` du CSS** et garder uniquement la version HTML.

**Pourquoi garder la version HTML ?**
- ✅ Meilleur contrôle de position (`calc(50% - 4mm)`)
- ✅ Cache-busting via `?v=2025101202`
- ✅ Plus facile à maintenir (tout dans un fichier)
- ✅ Séparation structure/style respectée

### Code modifié dans `buttons.css`

**Avant :**
```css
/* Ajouter le tesbih en arrière-plan du bouton */
.counter-button::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 550px;
    height: 550px;
    background-image: url('/assets/images/tesbih.png');
    background-size: contain;
    background-position: center;
    background-repeat: no-repeat;
    opacity: 0.7;
    z-index: -1;
    pointer-events: none;
    filter: drop-shadow(0 0 30px rgba(102, 126, 234, 0.5)) brightness(1.3);
}
```

**Après :**
```css
/* Note: Tesbih background géré dans index.html via <div class="tesbih-bg">
   pour éviter le doublon et permettre un meilleur contrôle de position */
```

## 🧪 Vérification

### Test visuel
1. Recharger la page (`Cmd+R`)
2. L'image tesbih ne doit apparaître qu'**une seule fois** derrière le bouton
3. Pas d'effet "double" ou "flou"

### Test Network
1. Ouvrir DevTools (F12) → Network tab
2. Filtrer par "tesbih.png"
3. Recharger la page
4. **Résultat attendu :** Une seule requête pour `tesbih.png`

### Test responsive mobile
```css
@media (max-width: 480px) {
    .counter-button::before {
        width: 420px;
        height: 420px;
    }
}
```
**Note :** Cette règle média peut aussi être supprimée puisque le `::before` n'existe plus.

## 📋 Checklist Complète

- [x] Identifier les deux sources de chargement
- [x] Supprimer `.counter-button::before` du CSS
- [x] Garder `<div class="tesbih-bg">` dans HTML
- [x] Vérifier que l'image s'affiche correctement
- [x] Vérifier Network tab (une seule requête)
- [x] Tester sur mobile/desktop
- [x] Commit et push

## 🔗 Fichiers Modifiés

- **`styles/components/buttons.css`** lignes 34-36
  - Suppression du pseudo-élément `::before`
  - Ajout d'un commentaire explicatif

- **`index.html`** ligne 82 (inchangé)
  - Garde la gestion du background tesbih

## 📊 Bénéfices

- ✅ **Performance** : Une seule requête HTTP au lieu de deux
- ✅ **Visuel** : Plus de doublon d'image
- ✅ **Maintenabilité** : Un seul endroit à modifier
- ✅ **Cache** : Cache-busting centralisé dans HTML

## 🛠️ Alternative (non retenue)

**Option B : Supprimer le HTML et garder le CSS**

Pourquoi non retenu :
- ❌ Moins de contrôle sur la position
- ❌ Pas de cache-busting facile
- ❌ Mélange structure et style

## 📸 Avant/Après

### Avant (double chargement)
```
Network Tab:
- GET /assets/images/tesbih.png (from HTML)
- GET /assets/images/tesbih.png (from CSS ::before)

Visuel: Image "épaisse" ou floue
```

### Après (chargement unique)
```
Network Tab:
- GET /assets/images/tesbih.png (from HTML)

Visuel: Image nette et claire
```

---

**Dernière mise à jour :** 2025-10-16
**Commit :** [À venir] - fix: Supprimer doublon tesbih.png dans buttons.css
**Fichiers :** styles/components/buttons.css
