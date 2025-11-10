/**
 * Tests pour OfflineManager - Gestion mode hors-ligne
 * Tests avec mocking des événements réseau et DOM
 */

// Mock des dépendances globales
global.navigator = {
  onLine: true
}

global.logger = {
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}

global.showCustomAlert = jest.fn()

// Mock document avec getElementById
if (!global.document) {
  global.document = {}
}
global.document.getElementById = jest.fn()

const OfflineManager = require('../src/utils/offline-manager.js')

describe('OfflineManager - Gestion Hors-Ligne', () => {
  let offlineManager
  let onlineListener
  let offlineListener

  beforeEach(() => {
    // Reset tous les mocks
    jest.clearAllMocks()
    localStorage.clear()

    // Reset navigator.onLine
    global.navigator.onLine = true

    // Mock du badge DOM - retourne un nouvel objet à chaque appel
    document.getElementById.mockImplementation(() => ({
      style: { display: 'none' }
    }))

    // Capturer les event listeners
    const originalAddEventListener = window.addEventListener
    window.addEventListener = jest.fn((event, handler) => {
      if (event === 'online') onlineListener = handler
      if (event === 'offline') offlineListener = handler
      originalAddEventListener.call(window, event, handler)
    })

    // Créer nouvelle instance
    offlineManager = new OfflineManager()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  // =======================
  // 1. INITIALISATION
  // =======================

  describe('Constructor', () => {
    test('should initialize with online status from navigator', () => {
      global.navigator.onLine = true
      const manager = new OfflineManager()

      expect(manager.isOnline).toBe(true)
    })

    test('should respect navigator.onLine at construction', () => {
      // Note: navigator.onLine est lu au moment de la construction
      // L'état initial est basé sur la valeur de navigator.onLine
      expect(offlineManager.isOnline).toBe(global.navigator.onLine)
    })

    test('should initialize empty sync queue', () => {
      expect(offlineManager.syncQueue).toEqual([])
    })

    test('should initialize empty listeners array', () => {
      expect(offlineManager.listeners).toEqual([])
    })

    test('should setup event listeners', () => {
      expect(window.addEventListener).toHaveBeenCalledWith('online', expect.any(Function))
      expect(window.addEventListener).toHaveBeenCalledWith('offline', expect.any(Function))
    })
  })

  // =======================
  // 2. HANDLE ONLINE
  // =======================

  describe('handleOnline()', () => {
    test('should set isOnline to true', () => {
      offlineManager.isOnline = false

      offlineManager.handleOnline()

      expect(offlineManager.isOnline).toBe(true)
    })

    test('should update UI to online state', () => {
      const mockBadge = { style: { display: 'flex' } }
      document.getElementById.mockReturnValue(mockBadge)

      offlineManager.handleOnline()

      expect(mockBadge.style.display).toBe('none')
    })

    test('should show success notification', () => {
      offlineManager.handleOnline()

      expect(global.showCustomAlert).toHaveBeenCalledWith(
        '✅ Connexion rétablie',
        'success',
        2000
      )
    })

    test('should process sync queue', async () => {
      const mockAction = jest.fn().mockResolvedValue()
      offlineManager.syncQueue = [{ action: mockAction, timestamp: Date.now() }]

      await offlineManager.handleOnline()

      // Attendre que processSyncQueue se termine
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(mockAction).toHaveBeenCalled()
    })

    test('should notify listeners', () => {
      const listener = jest.fn()
      offlineManager.listeners = [listener]

      offlineManager.handleOnline()

      expect(listener).toHaveBeenCalledWith('online')
    })

    test('should log online status', () => {
      offlineManager.handleOnline()

      expect(global.logger.log).toHaveBeenCalledWith('🟢 Connexion rétablie')
    })
  })

  // =======================
  // 3. HANDLE OFFLINE
  // =======================

  describe('handleOffline()', () => {
    test('should set isOnline to false', () => {
      offlineManager.isOnline = true

      offlineManager.handleOffline()

      expect(offlineManager.isOnline).toBe(false)
    })

    test('should update UI to offline state', () => {
      const mockBadge = { style: { display: 'none' } }
      document.getElementById.mockReturnValue(mockBadge)

      offlineManager.handleOffline()

      expect(mockBadge.style.display).toBe('flex')
    })

    test('should show warning notification', () => {
      offlineManager.handleOffline()

      expect(global.showCustomAlert).toHaveBeenCalledWith(
        '📶 Mode hors ligne - Vos données sont sauvegardées localement',
        'warning',
        4000
      )
    })

    test('should notify listeners', () => {
      const listener = jest.fn()
      offlineManager.listeners = [listener]

      offlineManager.handleOffline()

      expect(listener).toHaveBeenCalledWith('offline')
    })

    test('should log offline status', () => {
      offlineManager.handleOffline()

      expect(global.logger.warn).toHaveBeenCalledWith('🔴 Connexion perdue')
    })
  })

  // =======================
  // 4. UPDATE UI
  // =======================

  describe('updateUI()', () => {
    test('should hide badge when online', () => {
      const mockBadge = { style: { display: 'flex' } }
      document.getElementById.mockReturnValue(mockBadge)

      offlineManager.updateUI(true)

      expect(mockBadge.style.display).toBe('none')
    })

    test('should show badge when offline', () => {
      const mockBadge = { style: { display: 'none' } }
      document.getElementById.mockReturnValue(mockBadge)

      offlineManager.updateUI(false)

      expect(mockBadge.style.display).toBe('flex')
    })

    test('should handle missing badge gracefully', () => {
      document.getElementById.mockReturnValue(null)

      expect(() => {
        offlineManager.updateUI(true)
      }).not.toThrow()
    })

    test('should show online notification', () => {
      offlineManager.updateUI(true)

      expect(global.showCustomAlert).toHaveBeenCalledWith(
        '✅ Connexion rétablie',
        'success',
        2000
      )
    })

    test('should show offline notification', () => {
      offlineManager.updateUI(false)

      expect(global.showCustomAlert).toHaveBeenCalledWith(
        expect.stringContaining('Mode hors ligne'),
        'warning',
        4000
      )
    })
  })

  // =======================
  // 5. SYNC QUEUE
  // =======================

  describe('addToQueue()', () => {
    test('should add action to queue', () => {
      const action = jest.fn()

      offlineManager.addToQueue(action)

      expect(offlineManager.syncQueue.length).toBe(1)
      expect(offlineManager.syncQueue[0].action).toBe(action)
    })

    test('should add timestamp to queued action', () => {
      const beforeTime = Date.now()
      const action = jest.fn()

      offlineManager.addToQueue(action)

      const timestamp = offlineManager.syncQueue[0].timestamp
      expect(timestamp).toBeGreaterThanOrEqual(beforeTime)
      expect(timestamp).toBeLessThanOrEqual(Date.now())
    })

    test('should save queue to localStorage', () => {
      const action = jest.fn()

      offlineManager.addToQueue(action)

      const saved = localStorage.getItem('syncQueue')
      expect(saved).not.toBeNull()

      const parsed = JSON.parse(saved)
      expect(parsed.length).toBe(1)
      expect(parsed[0].timestamp).toBeDefined()
    })

    test('should log action added', () => {
      const action = jest.fn()

      offlineManager.addToQueue(action)

      expect(global.logger.log).toHaveBeenCalledWith(
        '📝 Action ajoutée à la file de sync:',
        action
      )
    })

    test('should handle multiple actions', () => {
      const action1 = jest.fn()
      const action2 = jest.fn()
      const action3 = jest.fn()

      offlineManager.addToQueue(action1)
      offlineManager.addToQueue(action2)
      offlineManager.addToQueue(action3)

      expect(offlineManager.syncQueue.length).toBe(3)
    })
  })

  describe('processSyncQueue()', () => {
    test('should do nothing if queue is empty', async () => {
      offlineManager.syncQueue = []

      await offlineManager.processSyncQueue()

      expect(global.logger.log).not.toHaveBeenCalledWith(
        expect.stringContaining('Synchronisation')
      )
    })

    test('should execute all queued actions', async () => {
      const action1 = jest.fn().mockResolvedValue()
      const action2 = jest.fn().mockResolvedValue()

      offlineManager.syncQueue = [
        { action: action1, timestamp: Date.now() },
        { action: action2, timestamp: Date.now() }
      ]

      await offlineManager.processSyncQueue()

      expect(action1).toHaveBeenCalled()
      expect(action2).toHaveBeenCalled()
    })

    test('should clear queue after successful sync', async () => {
      const action = jest.fn().mockResolvedValue()
      offlineManager.syncQueue = [{ action, timestamp: Date.now() }]

      await offlineManager.processSyncQueue()

      expect(offlineManager.syncQueue.length).toBe(0)
    })

    test('should remove from localStorage after successful sync', async () => {
      const action = jest.fn().mockResolvedValue()
      offlineManager.syncQueue = [{ action, timestamp: Date.now() }]
      localStorage.setItem('syncQueue', JSON.stringify(offlineManager.syncQueue))

      await offlineManager.processSyncQueue()

      expect(localStorage.getItem('syncQueue')).toBeNull()
    })

    test('should log sync progress', async () => {
      const action = jest.fn().mockResolvedValue()
      offlineManager.syncQueue = [{ action, timestamp: Date.now() }]

      await offlineManager.processSyncQueue()

      expect(global.logger.log).toHaveBeenCalledWith(
        '🔄 Synchronisation de 1 actions...'
      )
    })

    test('should keep failed actions in queue', async () => {
      const failedAction = jest.fn().mockRejectedValue(new Error('Sync failed'))
      const successAction = jest.fn().mockResolvedValue()

      offlineManager.syncQueue = [
        { action: failedAction, timestamp: Date.now() },
        { action: successAction, timestamp: Date.now() }
      ]

      await offlineManager.processSyncQueue()

      expect(offlineManager.syncQueue.length).toBe(1)
      expect(offlineManager.syncQueue[0].action).toBe(failedAction)
    })

    test('should log error for failed actions', async () => {
      const error = new Error('Network error')
      const action = jest.fn().mockRejectedValue(error)

      offlineManager.syncQueue = [{ action, timestamp: Date.now() }]

      await offlineManager.processSyncQueue()

      expect(global.logger.error).toHaveBeenCalledWith(
        '❌ Échec sync action:',
        error
      )
    })

    test('should save failed actions back to localStorage', async () => {
      const action = jest.fn().mockRejectedValue(new Error('Failed'))

      offlineManager.syncQueue = [{ action, timestamp: Date.now() }]

      await offlineManager.processSyncQueue()

      const saved = localStorage.getItem('syncQueue')
      expect(saved).not.toBeNull()
    })

    test('should warn about unsynced actions', async () => {
      const action = jest.fn().mockRejectedValue(new Error('Failed'))

      offlineManager.syncQueue = [{ action, timestamp: Date.now() }]

      await offlineManager.processSyncQueue()

      expect(global.logger.warn).toHaveBeenCalledWith(
        '⚠️ 1 actions non synchronisées'
      )
    })
  })

  // =======================
  // 6. LOAD QUEUE
  // =======================

  describe('loadQueue()', () => {
    test('should load queue from localStorage', () => {
      const savedQueue = [
        { timestamp: Date.now() - 1000 },
        { timestamp: Date.now() }
      ]
      localStorage.setItem('syncQueue', JSON.stringify(savedQueue))

      offlineManager.loadQueue()

      expect(global.logger.log).toHaveBeenCalledWith(
        '📥 2 actions en attente chargées'
      )
    })

    test('should do nothing if no saved queue', () => {
      localStorage.removeItem('syncQueue')

      offlineManager.loadQueue()

      expect(global.logger.log).not.toHaveBeenCalledWith(
        expect.stringContaining('actions en attente chargées')
      )
    })

    test('should handle corrupted data gracefully', () => {
      localStorage.setItem('syncQueue', 'invalid json{]')

      expect(() => {
        offlineManager.loadQueue()
      }).not.toThrow()

      expect(global.logger.error).toHaveBeenCalledWith(
        'Erreur chargement queue:',
        expect.any(Error)
      )
    })
  })

  // =======================
  // 7. LISTENERS
  // =======================

  describe('onStatusChange() & notifyListeners()', () => {
    test('should add listener', () => {
      const callback = jest.fn()

      offlineManager.onStatusChange(callback)

      expect(offlineManager.listeners.length).toBe(1)
      expect(offlineManager.listeners[0]).toBe(callback)
    })

    test('should notify all listeners', () => {
      const listener1 = jest.fn()
      const listener2 = jest.fn()

      offlineManager.onStatusChange(listener1)
      offlineManager.onStatusChange(listener2)

      offlineManager.notifyListeners('online')

      expect(listener1).toHaveBeenCalledWith('online')
      expect(listener2).toHaveBeenCalledWith('online')
    })

    test('should handle listener errors gracefully', () => {
      const errorListener = jest.fn(() => {
        throw new Error('Listener error')
      })
      const goodListener = jest.fn()

      offlineManager.onStatusChange(errorListener)
      offlineManager.onStatusChange(goodListener)

      offlineManager.notifyListeners('offline')

      expect(errorListener).toHaveBeenCalled()
      expect(goodListener).toHaveBeenCalled()
      expect(global.logger.error).toHaveBeenCalledWith(
        'Erreur notification listener:',
        expect.any(Error)
      )
    })

    test('should support multiple listeners', () => {
      const listeners = [jest.fn(), jest.fn(), jest.fn()]

      listeners.forEach(l => offlineManager.onStatusChange(l))

      offlineManager.notifyListeners('online')

      listeners.forEach(l => {
        expect(l).toHaveBeenCalledWith('online')
      })
    })
  })

  // =======================
  // 8. CHECK ONLINE
  // =======================

  describe('checkOnline()', () => {
    test('should return true when online', () => {
      offlineManager.isOnline = true

      expect(offlineManager.checkOnline()).toBe(true)
    })

    test('should return false when offline', () => {
      offlineManager.isOnline = false

      expect(offlineManager.checkOnline()).toBe(false)
    })
  })

  // =======================
  // 9. EVENT LISTENERS
  // =======================

  describe('Event Listeners Integration', () => {
    test('should trigger handleOnline on window online event', () => {
      offlineManager.isOnline = false

      // Simuler événement online
      if (onlineListener) {
        onlineListener()
      }

      expect(offlineManager.isOnline).toBe(true)
    })

    test('should trigger handleOffline on window offline event', () => {
      offlineManager.isOnline = true

      // Simuler événement offline
      if (offlineListener) {
        offlineListener()
      }

      expect(offlineManager.isOnline).toBe(false)
    })
  })

  // =======================
  // 10. EDGE CASES
  // =======================

  describe('Edge Cases', () => {
    test('should handle rapid online/offline switches', () => {
      offlineManager.handleOffline()
      offlineManager.handleOnline()
      offlineManager.handleOffline()
      offlineManager.handleOnline()

      expect(offlineManager.isOnline).toBe(true)
    })

    test('should handle sync queue overflow', () => {
      for (let i = 0; i < 1000; i++) {
        offlineManager.addToQueue(jest.fn())
      }

      expect(offlineManager.syncQueue.length).toBe(1000)
    })

    test('should handle async action errors', async () => {
      const action = jest.fn(async () => {
        throw new Error('Async error')
      })

      offlineManager.syncQueue = [{ action, timestamp: Date.now() }]

      await offlineManager.processSyncQueue()

      expect(offlineManager.syncQueue.length).toBe(1)
    })

    test('should handle missing showCustomAlert', () => {
      const originalAlert = global.showCustomAlert
      global.showCustomAlert = undefined

      // Devrait lancer une erreur car showCustomAlert n'est pas défini
      expect(() => {
        offlineManager.updateUI(true)
      }).toThrow(TypeError)

      // Restaurer
      global.showCustomAlert = originalAlert
    })

    test('should handle concurrent queue processing', async () => {
      const action1 = jest.fn().mockResolvedValue()
      const action2 = jest.fn().mockResolvedValue()

      offlineManager.syncQueue = [
        { action: action1, timestamp: Date.now() },
        { action: action2, timestamp: Date.now() }
      ]

      // Lancer deux traitements en parallèle
      await Promise.all([
        offlineManager.processSyncQueue(),
        offlineManager.processSyncQueue()
      ])

      expect(action1).toHaveBeenCalled()
      expect(action2).toHaveBeenCalled()
    })

    test('should handle no listeners gracefully', () => {
      offlineManager.listeners = []

      expect(() => {
        offlineManager.notifyListeners('online')
      }).not.toThrow()
    })
  })
})
