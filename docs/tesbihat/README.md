# Tesbihat - Documentation

## Vue d'ensemble

Le module Tesbihat fournit un guide interactif des prières après les 5 namaz quotidiennes (Sabah, Öğlen, İkindi, Akşam, Yatsi). Il est conçu pour être utilisé principalement sur mobile avec une navigation optimale et un affichage en plein écran.

## Architecture

### Structure des fichiers

```
zikirmatik/
├── data/
│   └── tesbihat.js              # Contenu des tesbihat (turc + arabe)
├── script_tesbihat.js           # Contrôleur de navigation
├── styles/pages/
│   └── tesbihat.css             # Styles responsive mobile-first
└── index.html                   # UI intégrée dans l'onglet "Tesbihat"
```

### Composants

#### 1. **data/tesbihat.js** - Données structurées

Le fichier contient l'objet global `TESBIHAT_DATA` avec la structure suivante :

```javascript
const TESBIHAT_DATA = {
  turkish: {
    sabah: {
      id: 'sabah',
      title: 'SABAH NAMAZI Tesbihati',
      color: '#667eea',
      sections: [
        {
          title: 'Başlangıç',
          items: [
            { type: 'instruction', text: '...' },
            { type: 'repeat', count: 5, text: '...', note: '...' },
            { type: 'prayer', text: '...' },
            { type: 'note', text: '...' },
            { type: 'table', rows: [[...]] }
          ]
        }
      ]
    },
    ogle: { ... },
    ikindi: { ... },
    aksam: { ... },
    yatsi: { ... }
  },
  arabic: {
    // Même structure que turkish
  }
}
```

**Types d'items disponibles :**

| Type | Description | Propriétés |
|------|-------------|------------|
| `instruction` | Instruction pour l'utilisateur | `text` |
| `repeat` | Prière avec répétition | `count`, `text`, `note` (optionnel) |
| `prayer` | Texte de prière long | `text` |
| `note` | Note informative | `text` |
| `table` | Tableau spécial (ex: Duâ-i İsm-i Âzam) | `rows` (array 2D) |

#### 2. **script_tesbihat.js** - Contrôleur

Classe `TesbihatSlider` qui gère :

- **Navigation multi-niveaux** :
  - Niveau 1 : Entre les 5 namaz (sabah ↔ öğlen ↔ ikindi ↔ akşam ↔ yatsi)
  - Niveau 2 : Entre les sections de chaque namaz
- **Gestes tactiles** : Swipe horizontal (>50px) pour naviguer entre sections
- **Toggle de langue** : Basculer entre turc et arabe
- **Indicateurs visuels** : Points de navigation, compteur de sections
- **Rendu dynamique** : Génération HTML selon le type d'item

**Méthodes principales :**

```javascript
init()                    // Initialiser le slider
setupSwipe()              // Configurer les gestes tactiles
switchLanguage(lang)      // Changer la langue
nextSection()             // Section suivante
previousSection()         // Section précédente
nextNamaz()               // Namaz suivant
previousNamaz()           // Namaz précédent
renderPage()              // Re-render complet
renderItem(item)          // Render un item selon son type
```

#### 3. **styles/pages/tesbihat.css** - Styles responsive

Stratégie **mobile-first** avec :

- **Full-screen layout** : `calc(100vh - 140px)` pour maximiser l'espace
- **Fonts adaptatifs** :
  - Portrait : 16px content, 18px titles
  - Landscape : +2-4px sur tous les textes
  - Mobile < 640px : -1-2px
- **Touch-friendly** : Boutons 60px × 60px (50px sur petit mobile)
- **Animations** : `slideIn` pour transitions fluides
- **Direction RTL** : Support pour textes arabes

### Intégration HTML

L'UI est intégrée dans l'onglet `competition` :

```html
<div class="tesbihat-container">
  <div class="tesbihat-header">...</div>
  <div class="language-toggle">...</div>
  <div class="namaz-navigation">...</div>
  <div class="tesbihat-slider">
    <div class="tesbihat-content"><!-- Contenu dynamique --></div>
  </div>
  <div class="section-navigation">...</div>
</div>
```

## Comment ajouter du contenu

### Ajouter une section à un namaz existant

1. Ouvrir `data/tesbihat.js`
2. Trouver le namaz (ex: `turkish.sabah.sections`)
3. Ajouter un nouvel objet section :

```javascript
{
  title: 'Nouveau titre',
  items: [
    { type: 'instruction', text: 'Faites ceci...' },
    { type: 'repeat', count: 33, text: 'Subhanallah' },
    { type: 'prayer', text: 'Bismillahirrahmanirrahim...' }
  ]
}
```

### Ajouter un nouveau namaz

```javascript
turkish: {
  // ... autres namaz
  nouveauNamaz: {
    id: 'nouveauNamaz',
    title: 'NOUVEAU NAMAZ Tesbihati',
    color: '#667eea', // Couleur du header
    sections: [
      {
        title: 'Section 1',
        items: [...]
      }
    ]
  }
}
```

Puis mettre à jour `script_tesbihat.js` :

```javascript
this.namazOrder = ['sabah', 'ogle', 'ikindi', 'aksam', 'yatsi', 'nouveauNamaz'];
```

### Ajouter la version arabe

1. Dupliquer la structure turque dans `TESBIHAT_DATA.arabic`
2. Remplacer tous les textes par l'arabe
3. Le système basculera automatiquement avec le bouton "Arapça tesbihat"

Exemple :

```javascript
arabic: {
  sabah: {
    id: 'sabah',
    title: 'تسبيحات صلاة الصبح',
    color: '#667eea',
    sections: [
      {
        title: 'البداية',
        items: [
          { type: 'instruction', text: 'بعد صلاة الصبح...' },
          { type: 'repeat', count: 5, text: 'استغفر الله' }
        ]
      }
    ]
  },
  // ... autres namaz
}
```

## Navigation utilisateur

### Contrôles disponibles

1. **Boutons de langue** : Basculer entre turc/arabe
2. **Flèches namaz** (< >) : Changer de namaz (haut de page)
3. **Points de navigation** : Clic direct sur un namaz
4. **Flèches sections** (< >) : Naviguer entre les sections (bas de page)
5. **Swipe mobile** : Glisser horizontalement (gauche = suivant, droite = précédent)

### Flux de navigation

```
┌─────────────────────────────────────────┐
│ SABAH ● ○ ○ ○ ○ (Points namaz)        │
│ Section 1/18                            │
├─────────────────────────────────────────┤
│                                         │
│   [Contenu de la section]               │
│                                         │
├─────────────────────────────────────────┤
│  <  (Section précédente | suivante)  >  │
└─────────────────────────────────────────┘

Swipe gauche  → Section suivante
Swipe droite  → Section précédente
Fin de namaz  → Passe au namaz suivant automatiquement
```

## Personnalisation

### Modifier les couleurs

Dans `data/tesbihat.js`, changer la propriété `color` de chaque namaz :

```javascript
sabah: {
  color: '#667eea', // Violet (par défaut)
}
```

Dans `styles/pages/tesbihat.css`, modifier le gradient du header :

```css
.tesbihat-header {
    background: linear-gradient(135deg, #007bff, #764ba2);
}
```

### Modifier les tailles de texte

Dans `tesbihat.css` :

```css
/* Mobile portrait */
.tesbihat-prayer {
    font-size: 16px;
}

/* Paysage (landscape) */
@media (orientation: landscape) {
    .tesbihat-prayer {
        font-size: 18px; /* +2px */
    }
}
```

### Ajouter un nouveau type d'item

1. Définir le type dans `data/tesbihat.js` :

```javascript
items: [
  { type: 'nouveauType', propriete1: '...', propriete2: '...' }
]
```

2. Ajouter le rendu dans `script_tesbihat.js` :

```javascript
renderItem(item) {
  switch (item.type) {
    // ... autres types
    case 'nouveauType':
      return `<div class="tesbihat-nouveauType">
        ${item.propriete1} - ${item.propriete2}
      </div>`;
  }
}
```

3. Ajouter le style dans `tesbihat.css` :

```css
.tesbihat-nouveauType {
    font-size: 16px;
    padding: 12px;
    /* ... autres styles */
}
```

## Compatibilité

- **Mobile** : iOS 9+, Android 4.4+
- **Desktop** : Tous navigateurs modernes
- **PWA** : Fonctionne hors ligne une fois chargé
- **Touch** : Support natif des gestes tactiles
- **RTL** : Support arabe avec `direction: rtl`

## Maintenance

### Tâches courantes

1. **Ajouter du contenu arabe** : Compléter `TESBIHAT_DATA.arabic`
2. **Corriger des textes** : Modifier directement `data/tesbihat.js`
3. **Améliorer le design** : Ajuster `styles/pages/tesbihat.css`
4. **Ajouter des features** : Étendre `script_tesbihat.js`

### Tests recommandés

- [ ] Navigation entre les 5 namaz
- [ ] Navigation entre sections de chaque namaz
- [ ] Swipe gauche/droite sur mobile
- [ ] Toggle langue turc ↔ arabe
- [ ] Affichage portrait vs landscape
- [ ] Responsive sur différentes tailles d'écran
- [ ] Boutons désactivés en début/fin de contenu

## Exemples de contenu

### Exemple complet d'une section

```javascript
{
  title: 'Après les 2 rek\'at de Fajr',
  items: [
    {
      type: 'instruction',
      text: 'Après avoir terminé les 2 rek\'at de la prière du Fajr, récitez:'
    },
    {
      type: 'repeat',
      count: 3,
      text: 'Subhanallahi ve bihamdihi',
      note: 'À voix basse'
    },
    {
      type: 'prayer',
      text: 'Allahumme ente selâmu ve minke selâm...'
    },
    {
      type: 'note',
      text: 'ℹ️ Cette prière purifie le cœur et apporte la paix'
    }
  ]
}
```

### Exemple de tableau (Duâ-i İsm-i Âzam)

```javascript
{
  type: 'table',
  rows: [
    ['Allah', 'El-Ehad', 'Es-Samed'],
    ['El-Melik', 'El-Kuddüs', 'Es-Selam'],
    // ... autres lignes
  ]
}
```

## Performance

- **Rendu conditionnel** : Seule la section courante est visible
- **Animations CSS** : GPU-accelerated avec `transform`
- **Lazy loading** : Contenu chargé à la demande
- **Taille totale** : ~50KB (data + script + css)

## Roadmap

- [x] Version turque complète (5 namaz)
- [ ] Version arabe complète
- [ ] Audio des prières
- [ ] Mode nuit
- [ ] Favoris / Signets
- [ ] Recherche de contenu
- [ ] Export PDF

## Support

Pour toute question ou amélioration :
- Modifier les fichiers directement
- Tester sur mobile réel
- Vérifier la console pour les erreurs

---

**Dernière mise à jour** : 19 octobre 2025
**Version** : 1.0.0
