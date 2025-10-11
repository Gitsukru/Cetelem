#!/bin/bash
# Script de build pour Netlify
# Injecte les variables d'environnement directement dans index.html

echo "🔧 Netlify Build Script"
echo "======================="

# Utiliser Python pour injecter les variables (plus robuste que sed)
python3 inject-env.py

if [ $? -eq 0 ]; then
  echo ""
  echo "🚀 Build terminé!"
else
  echo ""
  echo "❌ Erreur lors de l'injection des variables"
  exit 1
fi
