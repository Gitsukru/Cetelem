# 🚀 Démarrage Rapide Supabase - Zikirmatik

## ⏱️ Temps estimé: 10 minutes

---

## Étape 1: Créer un compte Supabase (2 min)

### 1.1 Aller sur Supabase
👉 **https://supabase.com**

### 1.2 S'inscrire
- Clique sur **"Start your project"** (bouton vert)
- Choisis **"Sign in with GitHub"** (recommandé)
- Ou crée un compte avec email

---

## Étape 2: Créer le projet (3 min)

### 2.1 Nouveau projet
Après connexion, clique sur **"New Project"**

### 2.2 Remplir les infos

```
Organization: [Laisse celle par défaut ou crée-en une]

Project Name: zikirmatik

Database Password: [Clique sur "Generate a password"]
                   ⚠️ SAUVEGARDE CE MOT DE PASSE dans un fichier texte !

Region: Europe (Frankfurt) - eu-central-1
        OU
        Europe (Paris) - eu-west-3

Pricing Plan: Free (0$/mois)
```

### 2.3 Lancer la création
- Clique sur **"Create new project"**
- ⏳ Attends 1-2 minutes (ça va créer la base de données)

---

## Étape 3: Créer les tables SQL (2 min)

### 3.1 Ouvrir le SQL Editor
Dans le menu gauche, clique sur :
📊 **SQL Editor** (icône de base de données)

### 3.2 Nouvelle requête
- Clique sur **"+ New query"**

### 3.3 Copier/Coller le script
1. Ouvre le fichier `supabase-setup.sql` que j'ai créé
2. **Copie TOUT le contenu** (Ctrl+A puis Ctrl+C)
3. **Colle** dans l'éditeur SQL de Supabase
4. Clique sur **"Run"** (bouton vert en bas à droite)

### 3.4 Vérification
Tu devrais voir :
```
✅ Success. No rows returned
```

C'est normal ! Ça veut dire que les tables sont créées.

---

## Étape 4: Récupérer les clés API (2 min)

### 4.1 Ouvrir les settings
Dans le menu gauche, clique sur :
⚙️ **Project Settings** (icône d'engrenage en bas)

### 4.2 Aller dans API
Clique sur **"API"** dans le sous-menu

### 4.3 Copier les clés

Tu vas voir 2 informations importantes :

#### 📍 Project URL
```
https://xxxxxxxxxxxxx.supabase.co
```
👆 Copie cette URL

#### 🔑 anon public key
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJ...
(très longue clé)
```
👆 Copie cette clé (elle est PUBLIQUE, pas de danger)

---

## Étape 5: Configurer l'app (1 min)

### 5.1 Ouvrir backend.config.js
Ouvre le fichier : `src/config/backend.config.js`

### 5.2 Remplir les clés

Remplace les valeurs vides :

```javascript
supabase: {
  url: 'https://xxxxxxxxxxxxx.supabase.co',  // ← COLLE ICI ton Project URL
  key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6...',    // ← COLLE ICI ta anon key
  enabled: true
}
```

### 5.3 Sauvegarder
Ctrl+S (ou Cmd+S sur Mac)

---

## Étape 6: Vérifier que ça marche

### 6.1 Ouvrir Table Editor
Dans Supabase, menu gauche : **Table Editor**

### 6.2 Voir les tables
Tu devrais voir :
- ✅ **groups** (vide pour l'instant)
- ✅ **participants** (vide pour l'instant)

### 6.3 Vérifier le Realtime
1. Clique sur la table **participants**
2. En haut à droite, regarde si "Realtime" est **ON** ✅
3. Si c'est OFF, active-le

---

## ✅ Configuration terminée !

### Ce que tu as maintenant :

✅ Compte Supabase créé
✅ Base de données PostgreSQL
✅ 2 tables (groups + participants)
✅ Temps réel activé
✅ Clés API configurées

### Prochaine étape :

Je vais maintenant **intégrer le code** dans ton app pour que le système de groupe fonctionne !

---

## 🐛 Dépannage

### Erreur "Row Level Security"
Si tu vois une erreur RLS :
1. Va dans **Authentication** → **Policies**
2. Vérifie que les policies sont créées
3. Si non, réexécute le script SQL

### Erreur "Publication not found"
Si le Realtime ne marche pas :
```sql
-- Exécute cette ligne dans SQL Editor
ALTER PUBLICATION supabase_realtime ADD TABLE participants;
```

### Mot de passe oublié
1. Va dans **Project Settings** → **Database**
2. Clique sur **"Reset database password"**
3. Génère un nouveau mot de passe

---

## 📊 Utilisation (après intégration)

### Tester la création de groupe

```javascript
// Ouvre la console du navigateur (F12)
// Tape :
await groupManager.createGroup('Test Mosque', 'Ahmed')

// Tu devrais voir dans Supabase Table Editor :
// groups: 1 ligne ajoutée
// participants: 1 ligne ajoutée
```

### Voir les données en temps réel

1. Ouvre 2 onglets de ton app
2. Dans l'onglet 1 : Crée un groupe
3. Dans l'onglet 2 : Rejoins le groupe avec le code
4. Incrémente le compteur dans l'onglet 1
5. 🎉 L'onglet 2 voit la mise à jour en temps réel !

---

## 💰 Limites du plan gratuit

| Ressource | Limite gratuite |
|-----------|----------------|
| Base de données | 500 MB |
| Bande passante | 2 GB/mois |
| Utilisateurs actifs | 50,000/mois |
| Temps réel (connexions) | 200 simultanées |

👉 **Largement suffisant** pour commencer !

Quand tu passes 1000 utilisateurs, on migrera vers le plan Pro (25$/mois).

---

## 🔐 Sécurité

### Les clés que tu as copiées sont PUBLIQUES
- `anon key` = clé publique ✅
- Pas de danger de la partager
- Row Level Security (RLS) protège les données

### NE JAMAIS partager :
- ❌ `service_role` key (admin)
- ❌ Database password
- ❌ JWT secret

---

*Guide créé le 2025-10-03*
*Prochaine étape: Intégration dans l'app*
