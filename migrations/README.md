# 🗄️ Migrations SQL - Supabase

Ce dossier contient toutes les migrations SQL pour la base de données Supabase.

## 📋 Migrations disponibles

### Configuration initiale
- `supabase-setup.sql` - Configuration initiale des tables Supabase

### Ajout de fonctionnalités
- `migration-add-analytics.sql` - Ajout du système d'analytics
- `migration-add-category-notes.sql` - Notes par catégorie
- `migration-add-device-backup.sql` - Système de backup par code
- `migration-add-metadata.sql` - Métadonnées supplémentaires
- `migration-add-notes.sql` - Système de notes général
- `migration-add-private-category-notes.sql` - Notes privées par catégorie

### Corrections et améliorations
- `migration-fix-permissions.sql` - Correction des permissions
- `supabase-migration-month.sql` - Migration mensuelle

## 🚀 Comment utiliser

### 1. Accéder à Supabase Dashboard
1. Aller sur [https://app.supabase.com](https://app.supabase.com)
2. Sélectionner votre projet Çetelem
3. Aller dans **SQL Editor** (menu gauche)

### 2. Exécuter une migration
1. Cliquer sur **New Query**
2. Copier le contenu du fichier SQL souhaité
3. Coller dans l'éditeur
4. Cliquer sur **RUN** (bouton vert)
5. Vérifier qu'il n'y a **aucune erreur**

### 3. Vérifier le succès
```sql
-- Vérifier que les tables ont été créées
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

## ⚠️ Ordre d'exécution recommandé

Exécuter les migrations dans cet ordre :

1. `supabase-setup.sql` (obligatoire - base)
2. `migration-add-metadata.sql`
3. `migration-add-notes.sql`
4. `migration-add-category-notes.sql`
5. `migration-add-private-category-notes.sql`
6. `migration-add-device-backup.sql`
7. `migration-add-analytics.sql`
8. `migration-fix-permissions.sql` (important - sécurité)
9. `supabase-migration-month.sql` (périodique)

## 🔒 Sécurité

Pour les politiques RLS (Row Level Security), voir le dossier `/supabase` à la racine :
- `supabase/secure-rls-policies.sql` - **À exécuter IMPÉRATIVEMENT**

## 📝 Notes

- Les migrations sont **idempotentes** (peuvent être exécutées plusieurs fois)
- Toujours faire un **backup avant** d'exécuter une migration en production
- Tester d'abord dans un environnement de **développement**
- En cas d'erreur, consulter les logs Supabase

## 🆘 En cas de problème

Si une migration échoue :
1. Noter le message d'erreur complet
2. Vérifier que les tables/colonnes n'existent pas déjà
3. Consulter la documentation Supabase
4. Contacter l'équipe de développement

## 📧 Contact

Pour des questions sur les migrations :
- 📧 dev@zikirmatik.app
- 🐛 [GitHub Issues](https://github.com/Gitsukru/Cetelem/issues)
