# 🧪 Tests Zikirmatik

## Installation

```bash
npm install
```

## Lancer les tests

```bash
# Tous les tests
npm test

# Mode watch (re-teste automatiquement)
npm run test:watch

# Avec coverage
npm run test:coverage
```

## Tests actuels

### ✅ utils.test.js
- Debounce : Vérifie que la fonction n'est appelée qu'une fois
- Throttle : Vérifie la limitation d'exécution
- Sleep : Vérifie le délai correct

## Ajouter des tests

Créer un fichier `*.test.js` dans `/tests/` :

```javascript
describe('Ma fonctionnalité', () => {
  test('Devrait faire quelque chose', () => {
    expect(maFonction()).toBe(résultatAttendu)
  })
})
```

## TODO

- [ ] Tests pour calculatePoints()
- [ ] Tests pour getStatisticsForCategory()
- [ ] Tests pour GroupManager
- [ ] Tests pour SupabaseProvider (avec mocks)
- [ ] Tests d'intégration
