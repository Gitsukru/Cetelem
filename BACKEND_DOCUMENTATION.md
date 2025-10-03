# 📚 Documentation Backend Zikirmatik

## 🎯 Architecture Hybride

Cette documentation explique comment fonctionne le système de backend modulaire qui permet de basculer entre **Supabase** (actuel) et **Infomaniak** (futur) en changeant une seule ligne de code.

---

## 📁 Structure des fichiers

```
zikirmatik/
├── src/
│   ├── config/
│   │   └── backend.config.js     # ⚙️ Configuration centralisée
│   └── services/
│       ├── BackendProvider.js    # 🏗️ Interface abstraite
│       ├── SupabaseProvider.js   # ☁️ Implémentation Supabase
│       ├── InfomaniakProvider.js # 🇨🇭 Implémentation Infomaniak (futur)
│       └── GroupManager.js       # 🎮 Service unifié
├── index.html
├── script.js
└── BACKEND_DOCUMENTATION.md      # 📖 Ce fichier
```

---

## 🚀 Démarrage rapide

### Étape 1: Configurer Supabase (Gratuit)

#### 1.1 Créer un compte Supabase

1. Va sur [https://supabase.com](https://supabase.com)
2. Clique sur "Start your project"
3. Connecte-toi avec GitHub
4. Crée un nouveau projet :
   - **Name**: `zikirmatik`
   - **Database Password**: Génère un mot de passe fort (sauvegarde-le)
   - **Region**: `Europe (eu-central-1)`

#### 1.2 Créer les tables

Dans le SQL Editor de Supabase, exécute ce script :

```sql
-- Table des groupes
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(6) UNIQUE NOT NULL,
  name VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des participants
CREATE TABLE participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  name VARCHAR(30) NOT NULL,
  today_count INTEGER DEFAULT 0,
  week_count INTEGER DEFAULT 0,
  total_count INTEGER DEFAULT 0,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, name)
);

-- Index pour performance
CREATE INDEX idx_participants_group_id ON participants(group_id);
CREATE INDEX idx_groups_code ON groups(code);

-- Activer le temps réel (Realtime)
ALTER PUBLICATION supabase_realtime ADD TABLE participants;
```

#### 1.3 Configurer les clés API

1. Va dans **Project Settings** → **API**
2. Copie :
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbG...` (longue clé)

3. Ouvre `src/config/backend.config.js` et remplis :

```javascript
supabase: {
  url: 'https://xxxxx.supabase.co',     // ← Colle ici
  key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6...',  // ← Colle ici
  enabled: true
}
```

#### 1.4 Charger la librairie Supabase

Ajoute dans `index.html` (avant `</head>`) :

```html
<!-- Supabase Client -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

<!-- Services backend -->
<script src="src/config/backend.config.js"></script>
<script src="src/services/BackendProvider.js"></script>
<script src="src/services/SupabaseProvider.js"></script>
<script src="src/services/GroupManager.js"></script>
```

---

## 🔧 Utilisation dans le code

### Initialisation (à ajouter dans script.js)

```javascript
// Initialiser le backend au chargement
document.addEventListener('DOMContentLoaded', function() {
  // ... ton code existant ...

  // Initialiser le backend
  initializeBackend()
})

function initializeBackend() {
  try {
    const config = BackendConfig.getActiveProvider()

    let provider
    if (config.type === 'supabase') {
      provider = new SupabaseProvider(config.url, config.key)
    } else if (config.type === 'infomaniak') {
      provider = new InfomaniakProvider(config.apiUrl, config.apiKey)
    }

    groupManager.initialize(provider)
    console.log('✅ Backend initialisé:', config.type)

  } catch (error) {
    console.error('❌ Erreur initialisation backend:', error)
  }
}
```

### Créer un groupe

```javascript
async function doCreateGroup() {
  const groupName = document.getElementById('groupNameInput').value.trim() || 'Zikir Grubu'
  const creatorName = document.getElementById('creatorNameInput').value.trim()

  if (!creatorName) {
    showCustomAlert('⚠️ Lütfen adınızı girin!', 'warning', 2500)
    return
  }

  showStatus('🔄 Grup oluşturuluyor...', 'Lütfen bekleyin...')

  try {
    // Utilise le GroupManager (abstrait)
    const result = await groupManager.createGroup(groupName, creatorName)

    showGroupInterface(result.code)
    showCustomAlert('✅ Grup başarıyla oluşturuldu!', 'success', 3000)

  } catch (error) {
    console.error('Erreur:', error)
    showCustomAlert('❌ Grup oluşturulamadı!', 'error', 4000)
    hideStatus()
  }
}
```

### Rejoindre un groupe

```javascript
async function doJoinGroup() {
  const groupCode = document.getElementById('joinCodeInput').value.trim().toUpperCase()
  const participantName = document.getElementById('participantNameInput').value.trim()

  if (!groupCode || !participantName) {
    showCustomAlert('⚠️ Kod ve isim gerekli!', 'warning', 2500)
    return
  }

  showStatus('🔍 Grup aranıyor...', 'Kod kontrol ediliyor...')

  try {
    const result = await groupManager.joinGroup(groupCode, participantName)

    showGroupInterface(result.code)
    showCustomAlert(`✅ "${result.name}" grubuna katıldınız!`, 'success', 3000)

  } catch (error) {
    console.error('Erreur:', error)
    showCustomAlert('❌ Gruba katılamadı!', 'error', 4000)
    hideStatus()
  }
}
```

### Mettre à jour le score

```javascript
// Appelé quand l'utilisateur clique sur +1
function incrementCounter() {
  // ... ton code existant ...

  // Mettre à jour le groupe si actif
  if (groupManager.hasActiveGroup()) {
    const stats = getCurrentUserStats() // ta fonction existante
    groupManager.updateMyScore(stats)
  }
}
```

### Écouter les mises à jour temps réel

```javascript
// Écouter les changements
window.addEventListener('groupUpdate', async (event) => {
  console.log('Mise à jour reçue:', event.detail)

  // Rafraîchir le classement
  await updateLeaderboard()
})

async function updateLeaderboard() {
  try {
    const leaderboard = await groupManager.getLeaderboard()
    displayLeaderboard(leaderboard)
  } catch (error) {
    console.error('Erreur classement:', error)
  }
}
```

### Quitter le groupe

```javascript
async function leaveGroup() {
  showCustomConfirm(
    '🚪 Gruptan Ayrıl',
    'Gruptan ayrılmak istediğinizden emin misiniz?',
    async function() {
      try {
        await groupManager.leaveGroup()

        // Reset UI
        document.getElementById('createSection').style.display = 'none'
        document.getElementById('joinSection').style.display = 'none'
        document.getElementById('groupStatus').style.display = 'none'
        document.getElementById('leaderboard').style.display = 'none'

        showCustomAlert('👋 Gruptan ayrıldınız', 'success', 2000)
      } catch (error) {
        showCustomAlert('❌ Hata!', 'error', 2000)
      }
    }
  )
}
```

---

## 🔄 Migration vers Infomaniak (future)

### Quand migrer ?

- Tu as > 500 utilisateurs actifs
- Tu veux 100% souveraineté suisse
- Budget disponible (~20-30 CHF/mois)

### Étape 1: Préparer le backend Infomaniak

Tu devras créer une API Node.js sur Jelastic Cloud :

```javascript
// server.js (Node.js + Express + Socket.io)
const express = require('express')
const { createServer } = require('http')
const { Server } = require('socket.io')
const { Pool } = require('pg')

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer)

// Connection PostgreSQL (DBaaS Infomaniak)
const pool = new Pool({
  host: 'postgres.jelastic.infomaniak.com',
  database: 'zikirmatik',
  user: 'admin',
  password: process.env.DB_PASSWORD,
  port: 5432
})

// Endpoint: Créer un groupe
app.post('/api/groups', async (req, res) => {
  const { code, name, creator } = req.body

  const groupResult = await pool.query(
    'INSERT INTO groups (code, name) VALUES ($1, $2) RETURNING *',
    [code, name]
  )

  const participantResult = await pool.query(
    'INSERT INTO participants (group_id, name) VALUES ($1, $2) RETURNING *',
    [groupResult.rows[0].id, creator]
  )

  res.json({
    group: groupResult.rows[0],
    participant: participantResult.rows[0]
  })
})

// Socket.io pour temps réel
io.on('connection', (socket) => {
  socket.on('join-group', (groupId) => {
    socket.join(`group_${groupId}`)
  })

  socket.on('update-score', async (data) => {
    // Mettre à jour en DB
    await pool.query(
      'UPDATE participants SET today_count = $1 WHERE id = $2',
      [data.score, data.participantId]
    )

    // Broadcast à tous
    io.to(`group_${data.groupId}`).emit(`group-${data.groupId}-update`, {
      type: 'UPDATE',
      participant: data
    })
  })
})

httpServer.listen(8080)
```

### Étape 2: Déployer sur Jelastic Cloud

1. Crée un environnement Node.js sur Jelastic
2. Upload ton code
3. Configure les variables d'environnement
4. Deploy

### Étape 3: Basculer le provider

Ouvre `src/config/backend.config.js` :

```javascript
const BackendConfig = {
  ACTIVE_PROVIDER: 'infomaniak', // ← Change juste cette ligne !

  infomaniak: {
    apiUrl: 'https://api-zikirmatik.jelastic.infomaniak.com',
    apiKey: 'ton-api-key-secret',
    enabled: true
  }
}
```

### Étape 4: Charger Socket.io

Ajoute dans `index.html` :

```html
<script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
```

**C'EST TOUT !** Le reste du code fonctionne sans modification.

---

## 🔒 Sécurité

### Supabase

- ✅ Row Level Security (RLS) activé par défaut
- ✅ Clés API publiques safe (anon key)
- ✅ HTTPS/TLS 1.2+
- ⚠️ Pas de certification SOC2 propre (infra AWS/GCP certifiée)

### Infomaniak

- ✅ Souveraineté suisse (RGPD strict)
- ✅ Certification ISO 27001
- ✅ Tu contrôles 100% des données
- ⚠️ Tu gères la sécurité applicative (JWT, validation, etc.)

### Bonnes pratiques

```javascript
// Validation côté client
function validateGroupCode(code) {
  return /^[A-Z0-9]{6}$/.test(code)
}

// Sanitization
function sanitizeName(name) {
  return name.trim().slice(0, 30).replace(/[<>]/g, '')
}
```

---

## 💰 Coûts estimés

### Supabase (actuel)

| Plan | Prix | Limites |
|------|------|---------|
| **Gratuit** | 0€ | 500MB DB, 2GB bande passante, 50k utilisateurs |
| **Pro** | 25$/mois | 8GB DB, 250GB bande passante, 100k utilisateurs |
| **Team** | 599$/mois | Illimité |

### Infomaniak (futur)

| Service | Prix estimé |
|---------|-------------|
| Jelastic Cloud (Node.js) | ~10 CHF/mois |
| DBaaS PostgreSQL | ~15 CHF/mois |
| Bande passante | Inclus (jusqu'à 100GB) |
| **TOTAL** | **~25 CHF/mois** |

---

## 🧪 Tests

### Tester en local

```javascript
// Test création groupe
async function testCreateGroup() {
  try {
    const result = await groupManager.createGroup('Test Groupe', 'Ahmed')
    console.log('✅ Groupe créé:', result)
  } catch (error) {
    console.error('❌ Erreur:', error)
  }
}

// Test rejoindre
async function testJoinGroup() {
  const result = await groupManager.joinGroup('ABC123', 'Fatima')
  console.log('✅ Rejoint:', result)
}

// Test score
groupManager.updateMyScore({
  today: 450,
  week: 2340,
  total: 12500
})
```

---

## 🐛 Dépannage

### Erreur: "Provider non initialisé"

**Cause**: `groupManager.initialize()` pas appelé

**Solution**:
```javascript
initializeBackend() // Appeler au chargement
```

### Erreur: "Groupe introuvable"

**Cause**: Code invalide ou typo

**Solution**:
```javascript
// Toujours convertir en majuscules
const code = groupCode.toUpperCase()
```

### Pas de mise à jour temps réel

**Cause**: Realtime pas activé sur Supabase

**Solution**:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE participants;
```

---

## 📞 Support

### Documentation officielle

- **Supabase**: https://supabase.com/docs
- **Infomaniak**: https://www.infomaniak.com/en/support

### Logs de debug

Active les logs détaillés :

```javascript
// En haut de script.js
const DEBUG = true

if (DEBUG) {
  console.log('🔍 Debug mode activé')
}
```

---

## 🎯 Checklist de déploiement

### Phase 1: Supabase (Maintenant)

- [ ] Créer compte Supabase
- [ ] Créer projet et tables SQL
- [ ] Copier URL + API key
- [ ] Remplir `backend.config.js`
- [ ] Charger librairie Supabase dans `index.html`
- [ ] Initialiser `groupManager` dans `script.js`
- [ ] Tester création/jointure groupe
- [ ] Tester temps réel
- [ ] Deploy sur Vercel/Netlify

### Phase 2: Migration Infomaniak (Plus tard)

- [ ] Créer compte Jelastic Cloud
- [ ] Coder API Node.js + Socket.io
- [ ] Configurer DBaaS PostgreSQL
- [ ] Déployer sur Jelastic
- [ ] Tester API endpoints
- [ ] Changer `ACTIVE_PROVIDER` vers 'infomaniak'
- [ ] Tester migration
- [ ] Monitorer performances

---

## 🚀 Prochaines étapes

1. **Maintenant**: Configure Supabase (30 min)
2. **Cette semaine**: Teste le système de groupe
3. **Mois prochain**: Analyse les métriques (nombre d'utilisateurs, coûts)
4. **Si succès**: Prépare migration Infomaniak

---

*Documentation créée le 2025-10-03*
*Dernière mise à jour: 2025-10-03*
