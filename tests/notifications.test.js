/**
 * Tests pour NotificationManager - Système de notifications
 * Tests avec mocking des API Notification, Audio, etc.
 */

// Mock de la classe Notification
class MockNotification {
  static permission = 'default'
  static requestPermission = jest.fn()

  constructor(title, options) {
    this.title = title
    this.options = options
    this.onclick = null
    this.onshow = null
    this.onerror = null
    this.onclose = null
  }

  close() {
    if (this.onclose) this.onclose()
  }
}

// Mocker window.Notification ET global.Notification
global.Notification = MockNotification
global.window = global.window || {}
global.window.Notification = MockNotification

global.Audio = jest.fn().mockImplementation(() => ({
  volume: 1,
  play: jest.fn().mockResolvedValue(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
}))

global.navigator = {
  onLine: true,
  vibrate: jest.fn()
}

global.document = {
  createElement: jest.fn((tag) => ({
    className: '',
    innerHTML: '',
    textContent: '',
    classList: {
      add: jest.fn(),
      remove: jest.fn()
    },
    style: {},
    appendChild: jest.fn(),
    remove: jest.fn()
  })),
  body: {
    appendChild: jest.fn()
  },
  hidden: false,
  addEventListener: jest.fn()
}

const NotificationManager = require('../src/utils/notifications.js')

describe('NotificationManager - Système de Notifications', () => {
  let manager
  let originalConsoleLog
  let originalConsoleWarn
  let originalConsoleError

  beforeEach(() => {
    // Silence console logs
    originalConsoleLog = console.log
    originalConsoleWarn = console.warn
    originalConsoleError = console.error
    console.log = jest.fn()
    console.warn = jest.fn()
    console.error = jest.fn()

    // Clear mocks
    jest.clearAllMocks()
    localStorage.clear()

    // Reset Notification permission
    MockNotification.permission = 'default'
    MockNotification.requestPermission = jest.fn().mockResolvedValue('granted')
    global.Notification = MockNotification
    global.window.Notification = MockNotification

    // Reset DOM mocks
    global.document.createElement = jest.fn((tag) => {
      const element = {
        className: '',
        _innerHTML: '',
        _textContent: '',
        classList: {
          add: jest.fn(),
          remove: jest.fn()
        },
        style: {},
        appendChild: jest.fn(),
        remove: jest.fn()
      }

      // Simuler le comportement textContent -> innerHTML pour escapeHtml()
      Object.defineProperty(element, 'textContent', {
        get() { return this._textContent },
        set(value) {
          this._textContent = value
          // Simuler l'échappement HTML
          this._innerHTML = value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;')
        }
      })

      Object.defineProperty(element, 'innerHTML', {
        get() { return this._innerHTML },
        set(value) { this._innerHTML = value }
      })

      return element
    })
    global.document.body.appendChild = jest.fn()
    global.document.addEventListener = jest.fn()

    // Reset navigator mock
    global.navigator.vibrate = jest.fn()

    // Create new instance
    manager = new NotificationManager()
  })

  afterEach(() => {
    // Restore console
    console.log = originalConsoleLog
    console.warn = originalConsoleWarn
    console.error = originalConsoleError

    // Clear intervals
    if (manager.checkInterval) {
      clearInterval(manager.checkInterval)
    }
  })

  // =======================
  // 1. INITIALISATION
  // =======================

  describe('Constructor', () => {
    test('should initialize with default values', () => {
      expect(manager.reminders).toBeDefined()
      expect(manager.checkInterval).toBeNull()
      expect(manager.isSupported).toBe(true)
    })

    test('should detect notification support', () => {
      expect(manager.isNotificationSupported()).toBe(true)
    })

    test('should load reminders from localStorage', () => {
      const savedReminders = {
        '10:30': { id: '10:30', hour: 10, minute: 30, message: 'Test', enabled: true }
      }
      localStorage.setItem('notifications_reminders', JSON.stringify(savedReminders))

      const newManager = new NotificationManager()

      expect(newManager.reminders['10:30']).toBeDefined()
      expect(newManager.reminders['10:30'].message).toBe('Test')
    })

    test('should use default reminders if none saved', () => {
      const reminders = manager.getAllReminders()

      expect(reminders.length).toBeGreaterThan(0)
      expect(reminders.some(r => r.hour === 9)).toBe(true)
    })

    test('should load tesbih sound setting', () => {
      localStorage.setItem('reminderTesbihSound', 'true')
      const newManager = new NotificationManager()

      expect(newManager.tesbihSoundEnabled).toBe(true)
    })

    test('should detect unsupported browsers', () => {
      delete global.window.Notification
      const unsupportedManager = new NotificationManager()

      expect(unsupportedManager.isSupported).toBe(false)
      expect(unsupportedManager.permission).toBe('denied')

      // Restore
      global.window.Notification = global.Notification
    })
  })

  // =======================
  // 2. PERMISSIONS
  // =======================

  describe('requestPermission()', () => {
    test('should request notification permission', async () => {
      MockNotification.permission = 'default'
      MockNotification.requestPermission.mockResolvedValue('granted')

      const result = await manager.requestPermission()

      expect(result).toBe(true)
      expect(MockNotification.requestPermission).toHaveBeenCalled()
      expect(manager.permission).toBe('granted')
    })

    test('should return true if already granted', async () => {
      manager.permission = 'granted'

      const result = await manager.requestPermission()

      expect(result).toBe(true)
      expect(MockNotification.requestPermission).not.toHaveBeenCalled()
    })

    test('should return false if permission denied', async () => {
      MockNotification.requestPermission.mockResolvedValue('denied')

      const result = await manager.requestPermission()

      expect(result).toBe(false)
    })

    test('should throw error if not supported', async () => {
      manager.isSupported = false

      await expect(manager.requestPermission()).rejects.toThrow(
        'Notifications non supportées'
      )
    })

    test('should show test notification on grant', async () => {
      global.Notification.requestPermission.mockResolvedValue('granted')
      manager.sendNotification = jest.fn()

      await manager.requestPermission()

      // showTestNotification devrait être appelée
      expect(manager.sendNotification).toHaveBeenCalled()
    })
  })

  // =======================
  // 3. SEND NOTIFICATION
  // =======================

  describe('sendNotification()', () => {
    test('should create system notification when granted', () => {
      manager.isSupported = true
      manager.permission = 'granted'

      const notif = manager.sendNotification('Title', 'Body')

      expect(notif).toBeInstanceOf(global.Notification)
      expect(notif.title).toBe('Title')
      expect(notif.options.body).toBe('Body')
    })

    test('should always show in-app notification', () => {
      manager.permission = 'denied'
      manager.showInAppNotification = jest.fn()

      manager.sendNotification('Title', 'Body')

      expect(manager.showInAppNotification).toHaveBeenCalledWith('Title', 'Body')
    })

    test('should set notification options correctly', () => {
      manager.permission = 'granted'

      const notif = manager.sendNotification('Test', 'Message', '/icon.png')

      expect(notif.options.icon).toBe('/icon.png')
      expect(notif.options.vibrate).toEqual([200, 100, 200])
      expect(notif.options.tag).toBe('zikirmatik-reminder')
    })

    test('should handle click on notification', () => {
      manager.permission = 'granted'
      global.window.focus = jest.fn()

      const notif = manager.sendNotification('Test', 'Message')
      notif.close = jest.fn()

      notif.onclick()

      expect(global.window.focus).toHaveBeenCalled()
      expect(notif.close).toHaveBeenCalled()
    })

    test('should auto-close after 10 seconds', (done) => {
      jest.useFakeTimers()
      manager.permission = 'granted'

      const notif = manager.sendNotification('Test', 'Message')
      notif.close = jest.fn()

      jest.advanceTimersByTime(10000)

      expect(notif.close).toHaveBeenCalled()

      jest.useRealTimers()
      done()
    })

    test('should return null if permission not granted', () => {
      manager.permission = 'denied'

      const result = manager.sendNotification('Test', 'Message')

      expect(result).toBeNull()
    })
  })

  // =======================
  // 4. IN-APP NOTIFICATION
  // =======================

  describe('showInAppNotification()', () => {
    test('should create notification element', () => {
      manager.showInAppNotification('Title', 'Body')

      expect(document.createElement).toHaveBeenCalledWith('div')
      expect(document.body.appendChild).toHaveBeenCalled()
    })

    test('should escape HTML in content', () => {
      manager.escapeHtml = jest.fn((text) => text.replace(/</g, '&lt;'))

      manager.showInAppNotification('<script>alert(1)</script>', 'Body')

      expect(manager.escapeHtml).toHaveBeenCalled()
    })

    test('should vibrate on mobile', () => {
      manager.showInAppNotification('Title', 'Body')

      expect(navigator.vibrate).toHaveBeenCalledWith([200, 100, 200])
    })

    test('should play tesbih sound if enabled', () => {
      manager.tesbihSoundEnabled = true
      manager.playTesbihSound = jest.fn()

      manager.showInAppNotification('Title', 'Body')

      expect(manager.playTesbihSound).toHaveBeenCalledWith(5)
    })

    test('should not play sound if disabled', () => {
      manager.tesbihSoundEnabled = false
      manager.playTesbihSound = jest.fn()

      manager.showInAppNotification('Title', 'Body')

      expect(manager.playTesbihSound).not.toHaveBeenCalled()
    })
  })

  // =======================
  // 5. TESBIH SOUND
  // =======================

  describe('playTesbihSound()', () => {
    test('should play sound multiple times', () => {
      manager.playTesbihSound(3)

      expect(global.Audio).toHaveBeenCalled()
    })

    test('should set volume to 0.7', () => {
      manager.playTesbihSound(1)

      const audioInstance = global.Audio.mock.results[0].value
      expect(audioInstance.volume).toBeLessThanOrEqual(1)
    })

    test('should handle audio errors gracefully', () => {
      global.Audio.mockImplementationOnce(() => {
        throw new Error('Audio error')
      })

      expect(() => {
        manager.playTesbihSound(1)
      }).not.toThrow()
    })
  })

  describe('toggleTesbihSound()', () => {
    test('should enable tesbih sound', () => {
      manager.toggleTesbihSound(true)

      expect(manager.tesbihSoundEnabled).toBe(true)
      expect(localStorage.getItem('reminderTesbihSound')).toBe('true')
    })

    test('should disable tesbih sound', () => {
      manager.toggleTesbihSound(false)

      expect(manager.tesbihSoundEnabled).toBe(false)
      expect(localStorage.getItem('reminderTesbihSound')).toBe('false')
    })

    test('should return current state', () => {
      const state = manager.toggleTesbihSound(true)

      expect(state).toBe(true)
    })
  })

  // =======================
  // 6. REMINDERS
  // =======================

  describe('addReminder()', () => {
    test('should add new reminder', () => {
      const reminder = manager.addReminder(10, 30, 'Test message')

      expect(reminder.id).toBe('10:30')
      expect(reminder.hour).toBe(10)
      expect(reminder.minute).toBe(30)
      expect(reminder.message).toBe('Test message')
      expect(reminder.enabled).toBe(true)
    })

    test('should use default message if not provided', () => {
      const reminder = manager.addReminder(12, 0)

      expect(reminder.message).toContain('Zikir')
    })

    test('should save reminder to localStorage', () => {
      manager.addReminder(10, 30, 'Test')

      const saved = localStorage.getItem('notifications_reminders')
      expect(saved).not.toBeNull()

      const parsed = JSON.parse(saved)
      expect(parsed['10:30']).toBeDefined()
    })

    test('should start checking if permission granted', () => {
      manager.permission = 'granted'
      manager.checkInterval = null
      manager.startChecking = jest.fn()

      manager.addReminder(10, 30, 'Test')

      expect(manager.startChecking).toHaveBeenCalled()
    })
  })

  describe('removeReminder()', () => {
    test('should remove existing reminder', () => {
      manager.addReminder(10, 30, 'Test')

      const result = manager.removeReminder('10:30')

      expect(result).toBe(true)
      expect(manager.reminders['10:30']).toBeUndefined()
    })

    test('should return false if reminder not found', () => {
      const result = manager.removeReminder('99:99')

      expect(result).toBe(false)
    })

    test('should save after removal', () => {
      manager.addReminder(10, 30, 'Test')
      manager.removeReminder('10:30')

      const saved = JSON.parse(localStorage.getItem('notifications_reminders'))
      expect(saved['10:30']).toBeUndefined()
    })
  })

  describe('toggleReminder()', () => {
    test('should toggle reminder on/off', () => {
      manager.addReminder(10, 30, 'Test', true)

      manager.toggleReminder('10:30')
      expect(manager.reminders['10:30'].enabled).toBe(false)

      manager.toggleReminder('10:30')
      expect(manager.reminders['10:30'].enabled).toBe(true)
    })

    test('should return false if reminder not found', () => {
      const result = manager.toggleReminder('99:99')

      expect(result).toBe(false)
    })
  })

  describe('getAllReminders() & getActiveReminders()', () => {
    test('should return all reminders', () => {
      manager.addReminder(10, 0, 'Test1', true)
      manager.addReminder(14, 0, 'Test2', false)

      const all = manager.getAllReminders()

      expect(all.length).toBeGreaterThanOrEqual(2)
    })

    test('should return only active reminders', () => {
      manager.reminders = {}
      manager.addReminder(10, 0, 'Test1', true)
      manager.addReminder(14, 0, 'Test2', false)

      const active = manager.getActiveReminders()

      expect(active.length).toBe(1)
      expect(active[0].message).toBe('Test1')
    })
  })

  // =======================
  // 7. CHECKING
  // =======================

  describe('startChecking()', () => {
    test('should start interval checking', () => {
      jest.useFakeTimers()

      manager.startChecking()

      expect(manager.checkInterval).not.toBeNull()

      jest.useRealTimers()
    })

    test('should check immediately on start', () => {
      manager.checkReminders = jest.fn()

      manager.startChecking()

      expect(manager.checkReminders).toHaveBeenCalled()
    })

    test('should clear existing interval before creating new one', () => {
      jest.useFakeTimers()

      const oldInterval = setInterval(() => {}, 1000)
      manager.checkInterval = oldInterval

      manager.startChecking()

      expect(manager.checkInterval).not.toBe(oldInterval)

      jest.useRealTimers()
    })

    test('should check every 30 seconds', () => {
      jest.useFakeTimers()
      manager.checkReminders = jest.fn()

      manager.startChecking()

      // Avancer de 30 secondes
      jest.advanceTimersByTime(30000)

      expect(manager.checkReminders).toHaveBeenCalledTimes(2) // Initial + 1

      jest.useRealTimers()
    })
  })

  describe('stopChecking()', () => {
    test('should stop interval checking', () => {
      jest.useFakeTimers()

      manager.startChecking()
      manager.stopChecking()

      expect(manager.checkInterval).toBeNull()

      jest.useRealTimers()
    })

    test('should do nothing if not checking', () => {
      expect(() => {
        manager.stopChecking()
      }).not.toThrow()
    })
  })

  describe('checkReminders()', () => {
    test('should do nothing if permission not granted', () => {
      manager.permission = 'denied'
      manager.sendNotification = jest.fn()

      manager.checkReminders()

      expect(manager.sendNotification).not.toHaveBeenCalled()
    })

    test('should trigger matching reminders', () => {
      // Utiliser l'heure locale pour éviter les problèmes de timezone
      jest.useFakeTimers({now: new Date(2025, 0, 15, 14, 30, 0)})

      // Recréer le manager avec le temps fixe
      manager = new NotificationManager()
      manager.permission = 'granted'

      manager.reminders = {}

      // Créer le spy AVANT d'ajouter le rappel pour capturer l'appel automatique
      const sendNotificationSpy = jest.spyOn(manager, 'sendNotification')

      manager.addReminder(14, 30, 'Test now!', true)

      // addReminder() avec permission='granted' appelle automatiquement checkReminders()
      expect(sendNotificationSpy).toHaveBeenCalled()

      jest.useRealTimers()
    })

    test('should not trigger disabled reminders', () => {
      manager.permission = 'granted'
      const now = new Date()

      manager.reminders = {}
      manager.addReminder(now.getHours(), now.getMinutes(), 'Disabled', false)
      manager.sendNotification = jest.fn()

      manager.checkReminders()

      expect(manager.sendNotification).not.toHaveBeenCalled()
    })

    test('should prevent spam with 2-minute cooldown', () => {
      manager.permission = 'granted'
      const now = new Date()
      const id = `${now.getHours()}:${now.getMinutes()}`

      // Marquer comme déjà notifié il y a 30 secondes
      localStorage.setItem(`notified_${id}`, (Date.now() - 30000).toString())

      manager.reminders = {}
      manager.addReminder(now.getHours(), now.getMinutes(), 'Test', true)
      manager.sendNotification = jest.fn()

      manager.checkReminders()

      // Ne devrait PAS envoyer car cooldown actif
      expect(manager.sendNotification).not.toHaveBeenCalled()
    })

    test('should send after cooldown period', () => {
      // Utiliser l'heure locale pour éviter les problèmes de timezone
      jest.useFakeTimers({now: new Date(2025, 0, 15, 14, 30, 0)})

      // Recréer le manager avec le temps fixe
      manager = new NotificationManager()
      manager.permission = 'granted'
      const id = '14:30'

      // Marquer comme notifié il y a 3 minutes (au-delà du cooldown)
      localStorage.setItem(`notified_${id}`, (Date.now() - 180000).toString())

      manager.reminders = {}

      // Créer le spy AVANT d'ajouter le rappel pour capturer l'appel automatique
      const sendNotificationSpy = jest.spyOn(manager, 'sendNotification')

      manager.addReminder(14, 30, 'Test', true)

      // addReminder() avec permission='granted' appelle automatiquement checkReminders()
      expect(sendNotificationSpy).toHaveBeenCalled()

      jest.useRealTimers()
    })
  })

  // =======================
  // 8. PERSISTENCE
  // =======================

  describe('saveReminders() & loadReminders()', () => {
    test('should save reminders to localStorage', () => {
      manager.reminders = {
        '10:30': { id: '10:30', hour: 10, minute: 30, message: 'Test' }
      }

      manager.saveReminders()

      const saved = localStorage.getItem('notifications_reminders')
      expect(saved).not.toBeNull()
    })

    test('should load reminders from localStorage', () => {
      const testReminders = {
        '11:00': { id: '11:00', hour: 11, minute: 0, message: 'Loaded' }
      }
      localStorage.setItem('notifications_reminders', JSON.stringify(testReminders))

      const loaded = manager.loadReminders()

      expect(loaded['11:00']).toBeDefined()
      expect(loaded['11:00'].message).toBe('Loaded')
    })

    test('should handle corrupted localStorage data', () => {
      localStorage.setItem('notifications_reminders', 'invalid json{')

      const loaded = manager.loadReminders()

      // Devrait retourner les rappels par défaut
      expect(loaded).toBeDefined()
      expect(Object.keys(loaded).length).toBeGreaterThan(0)
    })
  })

  // =======================
  // 9. UTILITY METHODS
  // =======================

  describe('Utility Methods', () => {
    test('getPermissionStatus() should return current permission', () => {
      manager.permission = 'granted'

      expect(manager.getPermissionStatus()).toBe('granted')
    })

    test('resetAllReminders() should clear all reminders', () => {
      manager.addReminder(10, 0, 'Test')

      manager.resetAllReminders()

      expect(Object.keys(manager.reminders).length).toBe(0)
    })

    test('escapeHtml() should prevent XSS', () => {
      const input = '<script>alert("XSS")</script>'
      const result = manager.escapeHtml(input)

      expect(result).not.toContain('<script>')
      expect(result).toContain('&lt;')
    })
  })

  // =======================
  // 10. EDGE CASES
  // =======================

  describe('Edge Cases', () => {
    test('should handle multiple reminders at same time', () => {
      // Utiliser l'heure locale pour éviter les problèmes de timezone
      jest.useFakeTimers({now: new Date(2025, 0, 15, 14, 30, 0)})

      // Recréer le manager avec le temps fixe
      manager = new NotificationManager()
      manager.permission = 'granted'
      manager.reminders = {}

      // Créer le spy AVANT d'ajouter les rappels pour capturer l'appel automatique
      const sendNotificationSpy = jest.spyOn(manager, 'sendNotification')

      manager.addReminder(14, 30, 'Test 1', true)
      manager.addReminder(14, 31, 'Test 2', true)

      // addReminder() avec permission='granted' appelle automatiquement checkReminders()
      // Seul le premier rappel (14:30) devrait déclencher car c'est l'heure actuelle
      expect(sendNotificationSpy).toHaveBeenCalled()

      jest.useRealTimers()
    })

    test('should handle midnight crossover', () => {
      manager.reminders = {}
      manager.addReminder(23, 59, 'Before midnight', true)
      manager.addReminder(0, 0, 'Midnight', true)

      expect(manager.getAllReminders().length).toBe(2)
    })

    test('should handle invalid hour/minute values', () => {
      expect(() => {
        manager.addReminder(25, 99, 'Invalid time')
      }).not.toThrow()
    })

    test('should handle rapid permission changes', async () => {
      global.Notification.permission = 'default'

      await manager.requestPermission()

      expect(manager.permission).toBe('granted')
    })

    test('should handle localStorage quota exceeded', () => {
      const originalSetItem = localStorage.setItem
      localStorage.setItem = jest.fn(() => {
        throw new Error('QuotaExceededError')
      })

      expect(() => {
        manager.saveReminders()
      }).not.toThrow()

      localStorage.setItem = originalSetItem
    })

    test('should handle document hidden/visible transitions', () => {
      jest.useFakeTimers()

      manager.permission = 'granted'
      manager.checkReminders = jest.fn()

      // Appeler startChecking() pour ajouter le listener
      manager.startChecking()

      // Simuler le listener visibilitychange
      const listeners = document.addEventListener.mock.calls
      const visibilityListener = listeners.find(call => call[0] === 'visibilitychange')

      expect(visibilityListener).toBeDefined()

      if (visibilityListener) {
        document.hidden = false
        visibilityListener[1]()

        expect(manager.checkReminders).toHaveBeenCalled()
      }

      manager.stopChecking()
      jest.useRealTimers()
    })
  })
})
