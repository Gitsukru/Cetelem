# 🎨 Assets - Images, Icônes et Audio

Ce dossier contient tous les fichiers statiques (assets) utilisés dans l'application.

## 📁 Structure

### `/icons` - Icônes de l'application
Icônes pour PWA, favicon et plateformes diverses.

**Fichiers:**
- `favicon.ico` - Favicon classique (16x16, 32x32)
- `favicon-32x32.png` - Favicon PNG 32x32
- `apple-touch-icon.png` - Icône pour iOS (180x180)
- `icon-192x192.png` - PWA icon 192x192
- `icon-512x512.png` - PWA icon 512x512

**Utilisé dans:**
- `index.html` (liens favicon et apple-touch-icon)
- `manifest.json` (icônes PWA)

### `/images` - Images de l'application
Images utilisées dans l'interface utilisateur.

**Fichiers:**
- `tesbih.png` - Image principale du tesbih (utilisée dans le compteur)
- `tesbih_img.png` - Variante d'image tesbih
- `tesbih_no_bg.png` - Tesbih sans fond
- `tesbih_old.png` - Ancienne version (archive)
- `Capture_centrage.png` - Capture d'écran de debug (centrage)
- `screenshoot.png` - Capture d'écran de l'app

**Utilisé dans:**
- `index.html` (background du compteur)
- Documentation

### `/audio` - Fichiers audio
Sons et effets sonores de l'application.

**Fichiers:**
- `tesbih_variant_1.mp3` - Son de clic du tesbih (effet réaliste)

**Utilisé dans:**
- `script.js` (fonction `initSound()`)

## 🔧 Référencement dans le code

### Images
```html
<!-- Dans index.html -->
<div class="tesbih-bg" style="background-image: url('assets/images/tesbih.png?v=2025101202');"></div>
```

### Icônes
```html
<!-- Dans index.html -->
<link rel="icon" type="image/png" sizes="32x32" href="/assets/icons/favicon-32x32.png">
<link rel="apple-touch-icon" href="/assets/icons/apple-touch-icon.png">
```

```json
// Dans manifest.json
{
  "icons": [
    {
      "src": "/assets/icons/icon-192x192.png",
      "sizes": "192x192"
    }
  ]
}
```

### Audio
```javascript
// Dans script.js
tickSound = new Audio('./assets/audio/tesbih_variant_1.mp3');
```

## 📐 Spécifications des icônes

| Fichier | Taille | Format | Usage |
|---------|--------|--------|-------|
| favicon.ico | 16x16, 32x32 | ICO | Navigateurs classiques |
| favicon-32x32.png | 32x32 | PNG | Favicon moderne |
| apple-touch-icon.png | 180x180 | PNG | iOS home screen |
| icon-192x192.png | 192x192 | PNG | PWA Android |
| icon-512x512.png | 512x512 | PNG | PWA splash screen |

## 🎵 Spécifications audio

| Fichier | Format | Durée | Qualité |
|---------|--------|-------|---------|
| tesbih_variant_1.mp3 | MP3 | ~0.5s | 128kbps |

**Optimisations:**
- Préchargement dans un pool audio (voir `script.js`)
- Volume par défaut: 0.7
- Latence cible: < 30ms

## 🖼️ Spécifications images

### tesbih.png
- **Taille:** Variable (responsive)
- **Usage:** Background du compteur principal
- **Style:** Semi-transparent (opacity: 0.77), avec drop-shadow
- **Position:** Centre avec offset léger
- **Cache-busting:** Paramètre `?v=` dans l'URL

## 📝 Ajout de nouveaux assets

### Pour ajouter une icône:
1. Générer aux bonnes dimensions (voir tableau ci-dessus)
2. Placer dans `/assets/icons/`
3. Référencer dans `index.html` ou `manifest.json`
4. Tester sur mobile et desktop

### Pour ajouter une image:
1. Optimiser la taille (< 100KB si possible)
2. Placer dans `/assets/images/`
3. Référencer dans HTML/CSS
4. Ajouter cache-busting si nécessaire: `?v=YYYYMMDD`

### Pour ajouter un audio:
1. Format MP3 recommandé (compatibilité maximale)
2. Durée courte (< 1s pour effets)
3. Qualité 128kbps suffisante
4. Placer dans `/assets/audio/`
5. Précharger dans le pool audio

## 🔄 Optimisations

### Images
- Utiliser WebP avec fallback PNG pour production
- Lazy loading pour images non critiques
- Cache-busting avec version parameter

### Audio
- Pool audio préchargé (6 instances)
- Compression adaptée au web
- Format compatible tous navigateurs

### Icônes
- Formats multiples pour compatibilité
- Tailles optimales selon usage
- Cache longue durée (static assets)

## 📧 Contact

Pour questions sur les assets :
- 📧 dev@zikirmatik.app
