# 📊 Statistiques Détaillées - Groupe

## Nouvelle fonctionnalité ajoutée

Les participants dans un groupe peuvent maintenant partager leurs statistiques détaillées par catégorie. Plus besoin de deviner ce que font les autres - tout est transparent !

## Comment ça fonctionne

### 1. **Partage automatique**
Chaque fois que tu mets à jour ton score dans un groupe, tes statistiques détaillées sont automatiquement partagées avec tous les membres du groupe :
- Subhan Allah : 100 aujourd'hui, 500 cette semaine
- Elhamdulillah : 50 aujourd'hui, 300 cette semaine
- Allahu Ekber : 75 aujourd'hui, 400 cette semaine
- etc.

### 2. **Voir les détails**
Dans l'onglet **Grup** > **Classement** :
- Clique sur n'importe quel participant
- Un tableau détaillé s'affiche montrant toutes ses catégories
- Tu peux voir exactement ce que chaque personne compte

### 3. **Données stockées**
Les statistiques sont stockées dans Supabase dans la colonne `metadata` au format JSON :
```json
{
  "categories": {
    "Subhan Allah": {
      "today": 100,
      "week": 500,
      "month": 2000,
      "total": 10000
    },
    "Elhamdulillah": {
      "today": 50,
      "week": 300,
      "month": 1000,
      "total": 5000
    }
  },
  "lastUpdated": "2025-10-04T12:34:56Z"
}
```

## Installation

### Étape 1: Exécuter la migration SQL
Dans le **SQL Editor** de Supabase, exécute le fichier :
```bash
migration-add-metadata.sql
```

Cela va ajouter la colonne `metadata` à la table `participants`.

### Étape 2: Actualiser l'application
Recharge simplement la page, le code est déjà en place !

## Utilisation

1. **Rejoins ou crée un groupe** comme d'habitude
2. **Compte tes zikirmatiks** normalement
3. **Regarde le classement** - tu verras une petite flèche ▼ à côté de chaque nom
4. **Clique sur un participant** pour voir ses détails
5. **Clique à nouveau** pour refermer les détails

## Avantages

✅ **Transparence totale** - Tu sais exactement ce que font tes concurrents
✅ **Motivation** - Voir les détails motive à faire plus
✅ **Comparaison équitable** - On peut comparer les mêmes catégories
✅ **Automatique** - Rien à faire, tout se partage automatiquement
✅ **Temps réel** - Les mises à jour sont instantanées via Supabase

## Design

Le design reste **sobre et minimaliste** :
- Gris clair #f8fafc pour le fond
- Bordures fines #e2e8f0
- Texte sombre #475569
- Tableau compact et lisible
- Animation fluide à l'ouverture/fermeture

## Questions fréquentes

**Q: Puis-je cacher mes statistiques ?**
R: Non, la transparence est le but de cette fonctionnalité. Si tu es dans un groupe, tes stats sont visibles.

**Q: Les données sont-elles sécurisées ?**
R: Oui, elles sont stockées dans Supabase avec les mêmes protections que le reste.

**Q: Que se passe-t-il si je n'ai pas de catégories ?**
R: Un message s'affiche : "📊 Henüz detaylı istatistik paylaşılmadı"

**Q: Les anciennes données sont-elles perdues ?**
R: Non, la migration ajoute juste une colonne. Toutes les données existantes restent intactes.
