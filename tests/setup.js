/**
 * Configuration globale des tests Jest
 */

// Mock localStorage pour tous les tests
const localStorageMock = (() => {
  let store = {}

  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString()
    },
    removeItem: (key) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
    get length() {
      return Object.keys(store).length
    },
    key: (index) => {
      const keys = Object.keys(store)
      return keys[index] || null
    }
  }
})()

global.localStorage = localStorageMock
global.sessionStorage = localStorageMock

// Reset avant chaque test
beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  jest.clearAllMocks()
})

// Nettoyer après chaque test
afterEach(() => {
  jest.restoreAllMocks()
})
