/**
 * Tests pour les utilitaires
 * Pour lancer: npm test (après avoir installé Jest)
 */

// Mock de window pour Node.js
global.window = {
  location: {
    hostname: 'localhost',
    port: '8000'
  }
}

// Import des modules
const { debounce, throttle } = require('../src/utils/debounce')
const { sleep } = require('../src/utils/retry')

describe('Debounce', () => {
  test('Ne devrait s\'exécuter qu\'une fois après plusieurs appels', async () => {
    let counter = 0
    const increment = debounce(() => counter++, 100)

    // Appeler 5 fois rapidement
    increment()
    increment()
    increment()
    increment()
    increment()

    // Attendre que le debounce s'exécute
    await sleep(150)

    // Ne devrait avoir été appelé qu'une seule fois
    expect(counter).toBe(1)
  })

  test('Devrait s\'exécuter avec les bons arguments', async () => {
    let result = null
    const saveValue = debounce((val) => { result = val }, 50)

    saveValue(42)
    await sleep(100)

    expect(result).toBe(42)
  })
})

describe('Throttle', () => {
  test('Devrait limiter le nombre d\'exécutions', async () => {
    let counter = 0
    const increment = throttle(() => counter++, 100)

    // Appeler 5 fois
    increment() // 1ère exécution
    await sleep(20)
    increment() // Ignorée
    await sleep(20)
    increment() // Ignorée
    await sleep(70) // Total 110ms
    increment() // 2ème exécution

    expect(counter).toBe(2)
  })
})

describe('Sleep', () => {
  test('Devrait attendre le temps spécifié', async () => {
    const start = Date.now()
    await sleep(100)
    const elapsed = Date.now() - start

    // Devrait avoir attendu au moins 100ms (avec marge)
    expect(elapsed).toBeGreaterThanOrEqual(90)
  })
})
