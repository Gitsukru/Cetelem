# Tesbihat - Architecture technique

## Vue d'ensemble

Le module Tesbihat utilise une architecture **MVC simplifiée** avec séparation claire des responsabilités :

```
┌─────────────────┐
│  data/          │  ← Model (données pures)
│  tesbihat.js    │
└─────────────────┘
         ↓
┌─────────────────┐
│  script_        │  ← Controller (logique métier)
│  tesbihat.js    │
└─────────────────┘
         ↓
┌─────────────────┐
│  index.html     │  ← View (structure DOM)
│  +               │
│  tesbihat.css   │  ← Présentation
└─────────────────┘
```

## Modèle de données

### Structure hiérarchique

```
TESBIHAT_DATA
└── [langue: turkish|arabic]
    └── [namazId: sabah|ogle|ikindi|aksam|yatsi]
        ├── id: string
        ├── title: string
        ├── color: string (hex)
        └── sections: Array<Section>
            ├── title: string
            └── items: Array<Item>
                ├── type: string
                └── [propriétés selon type]
```

### Types d'items (polymorphisme)

Chaque item a un `type` qui détermine son rendu :

```typescript
type Item =
  | { type: 'instruction', text: string }
  | { type: 'repeat', count: number, text: string, note?: string }
  | { type: 'prayer', text: string }
  | { type: 'note', text: string }
  | { type: 'table', rows: string[][] }
```

### Exemple de chemin d'accès

```javascript
// Accéder à la 3ème section du namaz Sabah en turc
const section = TESBIHAT_DATA['turkish']['sabah'].sections[2]

// Accéder au 2ème item de cette section
const item = section.items[1]
```

## Contrôleur (TesbihatSlider)

### État de l'application

```javascript
class TesbihatSlider {
  // État principal
  currentLang: 'turkish' | 'arabic'      // Langue active
  currentNamazIndex: 0..4                 // Index dans namazOrder
  currentSectionIndex: 0..N               // Section dans le namaz courant

  // Configuration
  namazOrder: ['sabah', 'ogle', ...]     // Ordre des namaz

  // Interaction tactile
  touchStartX: number
  touchEndX: number
  touchStartY: number
  touchEndY: number
  minSwipeDistance: 50                    // Seuil de détection swipe
}
```

### Flux de navigation

```
User Action → Event Handler → Update State → Render
```

**Exemples de flux :**

1. **Swipe gauche** :
```
touchstart → Capturer touchStartX
touchend   → Capturer touchEndX
           → handleSwipe()
           → diffX > 50 ? nextSection()
           → currentSectionIndex++
           → renderPage()
```

2. **Changement de namaz** :
```
Click point → currentNamazIndex = newIndex
            → currentSectionIndex = 0 (reset)
            → renderPage()
```

3. **Toggle langue** :
```
Click langButton → switchLanguage('arabic')
                 → currentLang = 'arabic'
                 → currentSectionIndex = 0 (reset)
                 → renderPage()
```

### Méthodes clés

#### Navigation
```javascript
// Navigation linéaire section par section
nextSection()       // Si fin de namaz → passe au namaz suivant
previousSection()   // Si début de namaz → retour au namaz précédent

// Navigation par namaz (saute toutes les sections)
nextNamaz()         // currentNamazIndex++, reset section
previousNamaz()     // currentNamazIndex--, reset section
```

#### Rendu
```javascript
renderPage()           // Re-render complet (header + content + nav)
  └→ getCurrentNamaz()      // Récupère le namaz actuel
  └→ getCurrentSection()    // Récupère la section actuelle
  └→ updateHeader()         // Titre + compteur
  └→ updateContent()        // Contenu de la section
      └→ renderItem()       // Render chaque item selon son type
  └→ updateNavigationButtons()  // Activer/désactiver boutons
  └→ updateIndicators()     // Points de navigation
```

#### Helpers
```javascript
getCurrentNamaz()    // TESBIHAT_DATA[lang][namazId]
getCurrentSection()  // namaz.sections[index]
getTotalSections()   // namaz.sections.length
```

### Gestion des événements

**Setup unique au `init()` :**

```javascript
init() {
  setupLanguageToggle()    // Click sur boutons langue
  setupNavigation()        // Click sur flèches et points
  setupSwipe()             // Touchstart/touchend
  renderPage()             // Affichage initial
}
```

**Détection de swipe (algorithme) :**

```javascript
handleSwipe() {
  diffX = touchStartX - touchEndX
  diffY = touchStartY - touchEndY

  // Vérifier que c'est horizontal (pas vertical)
  if (abs(diffX) > abs(diffY)) {
    if (abs(diffX) > minSwipeDistance) {
      diffX > 0 ? nextSection() : previousSection()
    }
  }
}
```

## Vue (HTML + CSS)

### Structure DOM

```html
<div class="tesbihat-container">                  ← Conteneur flex vertical
  <div class="tesbihat-header">                   ← Header fixe (flex-shrink: 0)
    <h2 id="tesbihatTitle">...</h2>              ← Titre namaz (dynamique)
    <div id="tesbihatCounter">1/18</div>         ← Compteur (dynamique)
  </div>

  <div class="language-toggle">                   ← Toggle langue (fixe)
    <button id="langTurkish">...</button>
    <button id="langArabic">...</button>
  </div>

  <div class="namaz-navigation">                  ← Nav namaz (fixe)
    <button id="namazPrevBtn">‹</button>
    <div id="namazDots">...</div>                ← Points dynamiques
    <button id="namazNextBtn">›</button>
  </div>

  <div class="tesbihat-slider">                   ← Zone scrollable (flex: 1)
    <div id="tesbihatContent">...</div>          ← Contenu dynamique
  </div>

  <div class="section-navigation">                ← Nav sections (fixe)
    <button id="tesbihatPrevBtn">‹</button>
    <button id="tesbihatNextBtn">›</button>
  </div>
</div>
```

### Layout CSS (Flexbox vertical)

```css
.tesbihat-container {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 140px);    /* Full viewport minus header/footer */
  overflow: hidden;
}

/* Elements fixes (ne scrollent pas) */
.tesbihat-header,
.language-toggle,
.namaz-navigation,
.section-navigation {
  flex-shrink: 0;                 /* Ne se compressent pas */
}

/* Zone scrollable (prend tout l'espace restant) */
.tesbihat-slider {
  flex: 1;                        /* Prend l'espace disponible */
  overflow-y: auto;               /* Scroll vertical */
  overflow-x: hidden;
}
```

### Responsive (media queries)

```css
/* Mobile portrait (défaut) */
.tesbihat-prayer { font-size: 16px; }

/* Landscape (écran horizontal) */
@media (orientation: landscape) {
  .tesbihat-prayer { font-size: 18px; }  /* +2px */
}

/* Petit mobile */
@media (max-width: 640px) {
  .tesbihat-prayer { font-size: 15px; }  /* -1px */
}

/* Très petit mobile */
@media (max-width: 380px) {
  .tesbihat-prayer { font-size: 14px; }  /* -2px */
}
```

### Direction RTL (support arabe)

```css
.repeat-text,
.tesbihat-prayer,
.tesbihat-table td {
  direction: rtl;       /* Right-to-left pour arabe */
  text-align: right;
}
```

## Intégration avec l'application

### Chargement au showTab

```javascript
// script_tesbihat.js (lignes 404-420)
const originalShowTab = window.showTab
window.showTab = function(tabName, event) {
  // Appeler la fonction originale
  if (originalShowTab) {
    originalShowTab(tabName, event)
  }

  // Initialiser Tesbihat au premier affichage
  if (tabName === 'competition' && !tesbihatSlider) {
    setTimeout(() => {
      if (typeof TESBIHAT_DATA !== 'undefined') {
        tesbihatSlider = new TesbihatSlider()
        tesbihatSlider.init()
      }
    }, 100)
  }
}
```

### Lazy loading

- Le script ne s'exécute que quand l'onglet est affiché
- Les données sont chargées au premier accès
- Une seule instance de `TesbihatSlider` est créée (singleton)

## Patterns et bonnes pratiques

### 1. Séparation Model-View-Controller

- **Model** (`data/tesbihat.js`) : Données pures, aucune logique
- **Controller** (`script_tesbihat.js`) : Logique métier, événements
- **View** (`index.html` + `tesbihat.css`) : Présentation uniquement

### 2. État centralisé

Tout l'état est dans la classe `TesbihatSlider` :
```javascript
this.currentLang
this.currentNamazIndex
this.currentSectionIndex
```

Pas de variables globales en dehors de :
- `TESBIHAT_DATA` (constant, readonly)
- `tesbihatSlider` (instance singleton)

### 3. Rendu déclaratif

Chaque `renderItem()` retourne du HTML pur :
```javascript
renderItem(item) {
  switch (item.type) {
    case 'prayer':
      return `<div class="tesbihat-prayer">${item.text}</div>`
  }
}
```

Pas de manipulation DOM directe dans le rendu.

### 4. Event delegation

Les événements sont attachés au `init()` :
```javascript
button.addEventListener('click', () => this.nextSection())
```

Pas de `onclick` inline sauf pour les points de navigation dynamiques.

### 5. Progressive enhancement

- Fonctionne sans JavaScript (contenu minimal visible)
- Amélioration progressive avec swipe, animations
- Dégradation gracieuse sur vieux navigateurs

## Améliorations futures

### Features

1. **Persistance de l'état** :
```javascript
// Sauvegarder position
localStorage.setItem('tesbihat_position', JSON.stringify({
  lang: this.currentLang,
  namazIndex: this.currentNamazIndex,
  sectionIndex: this.currentSectionIndex
}))

// Restaurer au chargement
const saved = JSON.parse(localStorage.getItem('tesbihat_position'))
if (saved) {
  this.currentLang = saved.lang
  this.currentNamazIndex = saved.namazIndex
  this.currentSectionIndex = saved.sectionIndex
}
```

2. **Audio des prières** :
```javascript
{
  type: 'prayer',
  text: '...',
  audio: '/audio/prayers/subhanallah.mp3'  // Nouveau champ
}

// Dans renderItem
if (item.audio) {
  html += `<button onclick="playAudio('${item.audio}')">🔊</button>`
}
```

3. **Favoris** :
```javascript
// Ajouter propriété aux sections
{
  title: '...',
  isFavorite: false,  // Nouveau champ
  items: [...]
}

// Sauvegarder dans localStorage
saveFavorites() {
  const favorites = this.getAllSections()
    .filter(s => s.isFavorite)
    .map(s => s.id)
  localStorage.setItem('tesbihat_favorites', JSON.stringify(favorites))
}
```

### Performance

1. **Virtual scrolling** pour sections très longues
2. **Web Workers** pour traitement données lourdes
3. **Service Worker** pour cache offline

### Accessibilité

1. **ARIA labels** pour navigation
2. **Keyboard shortcuts** (flèches clavier)
3. **Screen reader** support
4. **Contraste élevé** mode

---

**Dernière mise à jour** : 19 octobre 2025
**Version** : 1.0.0
