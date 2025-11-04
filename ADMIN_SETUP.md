# 👑 Configuration Admin Dashboard - Çetelem

Guide complet pour configurer et utiliser le dashboard admin.

---

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Prérequis](#prérequis)
3. [Étape 1 : Créer le compte admin](#étape-1--créer-le-compte-admin)
4. [Étape 2 : Configurer Row Level Security (RLS)](#étape-2--configurer-row-level-security-rls)
5. [Étape 3 : Accéder au dashboard](#étape-3--accéder-au-dashboard)
6. [Étape 4 : Ajouter d'autres admins](#étape-4--ajouter-dautres-admins)
7. [Fonctionnalités du dashboard](#fonctionnalités-du-dashboard)
8. [Sécurité](#sécurité)
9. [Dépannage](#dépannage)

---

## 🎯 Vue d'ensemble

Le dashboard admin est une interface sécurisée qui permet de :

- ✅ Monitorer l'utilisation de l'application en temps réel
- ✅ Voir les statistiques (utilisateurs, groupes, livres, etc.)
- ✅ Analyser les tendances et l'engagement
- ✅ Gérer les performances et quotas
- ✅ Exécuter des actions admin (export, nettoyage, etc.)
- ✅ Consulter les logs et erreurs

**Sécurité** :
- Authentification via Supabase Auth (email/password)
- Row Level Security (RLS) protège les données
- Session JWT sécurisée (7 jours)
- Seuls les emails autorisés peuvent se connecter

---

## ⚙️ Prérequis

- ✅ Projet Supabase actif
- ✅ Accès au dashboard Supabase
- ✅ Tables analytics créées (voir section Configuration RLS)

---

## 🔐 Étape 1 : Créer le compte admin

### 1.1 Aller dans Supabase Dashboard

1. Connectez-vous à [https://supabase.com](https://supabase.com)
2. Sélectionnez votre projet **Çetelem**
3. Dans le menu de gauche, cliquez sur **Authentication**

### 1.2 Créer l'utilisateur admin

1. Cliquez sur **"Users"** dans le sous-menu
2. Cliquez sur **"Add user"** (ou "Invite user")
3. Remplissez le formulaire :

```
Email: suisse1022@gmail.com
Password: [choisir un mot de passe FORT]
☑️ Auto Confirm User (cocher cette case)
```

4. Cliquez sur **"Create user"**

### 1.3 Vérifier la création

Vous devriez voir l'utilisateur dans la liste avec :
- Email : `suisse1022@gmail.com`
- Status : **Confirmed** ✅
- Created at : Date du jour

---

## 🔒 Étape 2 : Configurer Row Level Security (RLS)

**IMPORTANT** : C'est cette étape qui sécurise vos données. Sans RLS, n'importe qui pourrait lire les analytics.

### 2.1 Activer RLS sur les tables

Allez dans **SQL Editor** dans Supabase et exécutez :

```sql
-- Activer RLS sur analytics_events
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Activer RLS sur groups
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

-- Activer RLS sur group_participants
ALTER TABLE group_participants ENABLE ROW LEVEL SECURITY;
```

### 2.2 Créer les policies RLS

Exécutez ce SQL pour autoriser UNIQUEMENT votre email admin :

```sql
-- ====================================
-- POLICY 1: Admin peut tout lire dans analytics_events
-- ====================================

CREATE POLICY "Admin read analytics"
ON analytics_events
FOR SELECT
TO authenticated
USING (
  auth.jwt() ->> 'email' IN (
    'suisse1022@gmail.com'
    -- Ajoutez d'autres emails admin ici si besoin
  )
);

-- ====================================
-- POLICY 2: Admin peut tout lire dans groups
-- ====================================

CREATE POLICY "Admin read groups"
ON groups
FOR SELECT
TO authenticated
USING (
  auth.jwt() ->> 'email' IN (
    'suisse1022@gmail.com'
  )
);

-- ====================================
-- POLICY 3: Admin peut tout lire dans group_participants
-- ====================================

CREATE POLICY "Admin read group_participants"
ON group_participants
FOR SELECT
TO authenticated
USING (
  auth.jwt() ->> 'email' IN (
    'suisse1022@gmail.com'
  )
);

-- ====================================
-- POLICY 4: Admin peut DELETE (pour nettoyage)
-- ====================================

CREATE POLICY "Admin delete old groups"
ON groups
FOR DELETE
TO authenticated
USING (
  auth.jwt() ->> 'email' IN (
    'suisse1022@gmail.com'
  )
);
```

### 2.3 Vérifier RLS

Retournez dans **Table Editor** et vérifiez :

Pour chaque table (`analytics_events`, `groups`, `group_participants`) :
1. Cliquez sur la table
2. Allez dans l'onglet **"Policies"**
3. Vous devriez voir les policies créées ✅

---

## 🚀 Étape 3 : Accéder au dashboard

### 3.1 En local (développement)

1. Ouvrez votre navigateur
2. Allez sur : `http://localhost:5500/admin.html` (ou votre port)
3. Vous verrez le formulaire de connexion

### 3.2 En production

1. Déployez votre site (Netlify, Vercel, etc.)
2. Accédez à : `https://votresite.com/admin.html`
3. Connexion avec vos identifiants

### 3.3 Se connecter

```
Email : suisse1022@gmail.com
Password : [votre mot de passe]
```

Cliquez sur **"Se connecter"** 🔓

Si tout est correct, vous verrez le dashboard ! 🎉

---

## 👥 Étape 4 : Ajouter d'autres admins

### 4.1 Créer le compte dans Supabase Auth

Répétez l'[Étape 1](#étape-1--créer-le-compte-admin) avec le nouvel email.

### 4.2 Ajouter l'email dans admin-auth.js

Éditez le fichier `admin/admin-auth.js` :

```javascript
this.ADMIN_EMAILS = [
    'suisse1022@gmail.com',
    'nouveau-admin@example.com',  // ← Ajouter ici
    // Ajouter d'autres emails admin ici si besoin
];
```

### 4.3 Ajouter l'email dans les policies RLS

Éditez les policies dans Supabase SQL Editor :

```sql
-- Modifier chaque policy pour ajouter le nouvel email

DROP POLICY IF EXISTS "Admin read analytics" ON analytics_events;

CREATE POLICY "Admin read analytics"
ON analytics_events
FOR SELECT
TO authenticated
USING (
  auth.jwt() ->> 'email' IN (
    'suisse1022@gmail.com',
    'nouveau-admin@example.com'  -- ← Ajouter ici
  )
);

-- Répéter pour chaque policy
```

### 4.4 Redéployer

Si vous êtes en production, redéployez le site pour appliquer les changements.

---

## 📊 Fonctionnalités du dashboard

### 1️⃣ **Vue d'ensemble**

- Utilisateurs actifs (24h, 30j)
- Total zikirlers comptés
- Groupes actifs
- Livres complétés
- **Taux d'engagement** : % de devices actifs sur l'ensemble

### 2️⃣ **Usage Application**

- Graphique activité (7j, 30j, 90j)
- Usage des features (Groupes, Livres, Tesbihat, Notifications, Sauvegardes)
- Heures de pic d'utilisation

### 3️⃣ **Analytics Groupes**

- Total groupes créés
- Taille moyenne des groupes
- Durée de vie moyenne
- Taux d'abandon
- Top 10 groupes les plus actifs

### 4️⃣ **Analytics Livres**

- Total livres créés
- Taux de complétion
- Livres actifs vs complétés
- Chart types de livres

### 5️⃣ **Performance & Santé**

- Temps de chargement
- Quota Supabase (% utilisé)
- Cache Service Worker
- Erreurs JavaScript (24h)
- Alertes automatiques

### 6️⃣ **Outils Admin**

- 🔄 Forcer mise à jour globale
- 🧹 Vider cache global
- 📢 Notification globale
- 🚨 Mode maintenance
- 📥 Export base de données (JSON)
- 🧹 Nettoyage données obsolètes

### 7️⃣ **Tendances & Insights**

- Graphique croissance utilisateurs (30j)
- Taux de rétention (J1, J7, J30)
- Parcours utilisateur

### 8️⃣ **Debug & Logs**

- Console erreurs JavaScript
- Logs système (Service Worker, Supabase, Sync)
- Export logs JSON
- Filtrage par type

### 9️⃣ **Analytics Avancées**

- Heatmap clics UI
- Funnels de conversion (Catégorie → Groupe → Livre)
- A/B tests actifs

### 🔟 **Sécurité**

- Tentatives de connexion échouées
- IPs suspectes
- Requêtes bloquées
- Vérification intégrité données
- Blacklist IP

---

## 🔐 Sécurité

### Ce qui protège le dashboard :

1. **Authentification obligatoire** : Email/password via Supabase Auth
2. **Liste blanche d'emails** : Seuls les emails dans `ADMIN_EMAILS` peuvent accéder
3. **RLS Supabase** : Même avec le token JWT, seuls les emails autorisés peuvent lire les données
4. **Session expirante** : JWT expire après 7 jours
5. **Pas de données sensibles** : Toutes les analytics sont anonymes (device IDs, pas d'infos personnelles)

### Ce que vous DEVEZ faire :

✅ **Utilisez un mot de passe FORT** (20+ caractères, majuscules, chiffres, symboles)
✅ **Activez 2FA sur votre compte Supabase** (Settings → Account)
✅ **Ne partagez JAMAIS vos identifiants**
✅ **Déconnectez-vous après utilisation** (bouton Déconnexion en bas du sidebar)

❌ **N'ajoutez PAS d'emails non fiables** dans ADMIN_EMAILS
❌ **Ne commitez PAS vos credentials** dans git
❌ **Ne désactivez PAS RLS** sur les tables

---

## 🐛 Dépannage

### Problème : "Email ou mot de passe incorrect"

**Solutions** :
1. Vérifiez que le compte existe dans **Authentication → Users**
2. Vérifiez que le status est **"Confirmed"** ✅
3. Vérifiez que l'email est EXACTEMENT le même (majuscules/minuscules)
4. Réinitialisez le mot de passe si besoin

### Problème : "Cet email n'a pas les droits d'administrateur"

**Solutions** :
1. Vérifiez que l'email est dans `admin/admin-auth.js` → `ADMIN_EMAILS`
2. Redéployez le site si vous avez modifié le fichier
3. Videz le cache du navigateur (Cmd+Shift+R)

### Problème : "Erreur de connexion à la base de données"

**Solutions** :
1. Vérifiez que `config.json` contient les bons credentials Supabase
2. Vérifiez que votre projet Supabase est actif
3. Vérifiez la console navigateur (F12) pour plus de détails

### Problème : Le dashboard charge mais affiche "Aucune donnée"

**Solutions** :
1. Vérifiez que RLS est configuré (voir [Étape 2](#étape-2--configurer-row-level-security-rls))
2. Vérifiez les policies dans **Table Editor → Policies**
3. Testez une requête SQL directement :

```sql
SELECT * FROM analytics_events LIMIT 10;
```

Si ça fonctionne en SQL mais pas dans le dashboard → Problème de policy RLS

### Problème : "Quota Supabase à 100%"

**Solutions** :
1. Allez dans **Database → Usage**
2. Vérifiez le nombre de rows
3. Utilisez l'outil **"Nettoyage données"** dans le dashboard
4. Ou exécutez manuellement :

```sql
-- Supprimer events > 1 an
DELETE FROM analytics_events
WHERE created_at < NOW() - INTERVAL '1 year';

-- Supprimer groupes vides > 90 jours
DELETE FROM groups
WHERE participant_count = 0
AND updated_at < NOW() - INTERVAL '90 days';
```

5. Envisagez un upgrade vers un plan payant si nécessaire

### Problème : Charts ne s'affichent pas

**Solutions** :
1. Vérifiez que Chart.js est chargé (console F12)
2. Videz le cache et rechargez
3. Vérifiez qu'il y a des données (les charts vides ne s'affichent pas)

---

## 📞 Support

Si vous rencontrez un problème non résolu :

1. **Consultez la console navigateur** (F12) pour voir les erreurs
2. **Consultez les logs Supabase** (Dashboard → Logs)
3. **Contactez-moi** : suisse1022@gmail.com

---

## 🎉 Félicitations !

Vous avez maintenant un dashboard admin professionnel et sécurisé ! 👑

**Prochaines étapes** :
- Explorez les 10 sections du dashboard
- Configurez des alertes personnalisées
- Exportez des rapports réguliers
- Ajoutez d'autres admins si nécessaire

---

**Créé avec ❤️ pour Çetelem**

*Version 1.0.0 - 2025*
