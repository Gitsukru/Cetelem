# Configuration Netlify pour le Mode Groupe

## Variables d'environnement à configurer

Pour activer le mode groupe avec Supabase, vous devez configurer les variables d'environnement sur Netlify.

### Étapes :

1. **Aller sur Netlify Dashboard**
   - https://app.netlify.com/sites/cetelems/settings

2. **Aller dans Build & deploy → Environment**
   - Cliquer sur "Environment variables"
   - Cliquer sur "Add a variable"

3. **Ajouter les variables suivantes :**

   **Variable 1 : VITE_SUPABASE_URL**
   ```
   Clé : VITE_SUPABASE_URL
   Valeur : https://sxtcyznkxtlcgkgrdrbi.supabase.co
   ```

   **Variable 2 : VITE_SUPABASE_ANON_KEY**
   ```
   Clé : VITE_SUPABASE_ANON_KEY
   Valeur : eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4dGN5em5reHRsY2drZ3JkcmJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0ODgyMjQsImV4cCI6MjA3NTA2NDIyNH0.09FRK2S1zaauEp5tV6g6-7YmynOVNV44pRSGwqpeG8A
   ```

   **Variable 3 : VITE_ACTIVE_PROVIDER**
   ```
   Clé : VITE_ACTIVE_PROVIDER
   Valeur : supabase
   ```

4. **Redéployer l'application**
   - Aller dans "Deploys"
   - Cliquer sur "Trigger deploy" → "Clear cache and deploy site"

5. **Vérifier que ça fonctionne**
   - Ouvrir https://cetelems.netlify.app/
   - Aller sur l'onglet "Grup"
   - Vous devriez pouvoir créer un groupe !

## Comment ça marche ?

- Le script `inject-env.cjs` lit les variables d'environnement de Netlify
- Il les injecte dans `index.html` avant le déploiement
- L'application peut alors se connecter à Supabase

## Sécurité

✅ Les clés sont stockées dans les variables d'environnement Netlify (sécurisé)
✅ Elles ne sont jamais commitées dans Git
✅ La clé ANON est publique par design Supabase (sécurisé avec Row Level Security)
