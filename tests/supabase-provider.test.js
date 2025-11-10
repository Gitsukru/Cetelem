/**
 * Tests pour SupabaseProvider - Backend Supabase
 * Tests complets avec mocking du client Supabase
 */

// Mock des dépendances globales AVANT l'import
global.supabase = {
  createClient: jest.fn()
}

global.window = {
  analytics: {
    getDeviceId: jest.fn(() => 'device-123')
  }
}

global.logger = {
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}

global.retrySupabase = jest.fn((fn) => fn())

global.offlineManager = {
  checkOnline: jest.fn(() => true),
  addToQueue: jest.fn()
}

// Mock de BackendProvider
class BackendProvider {
  generateGroupCode() {
    return 'ABC123'
  }
}
global.BackendProvider = BackendProvider

const SupabaseProvider = require('../src/services/SupabaseProvider.js')

describe('SupabaseProvider - Backend Supabase', () => {
  let provider
  let mockSupabaseClient
  let mockFrom
  let mockSelect
  let mockInsert
  let mockUpdate
  let mockDelete
  let mockChannel

  beforeEach(() => {
    // Reset tous les mocks
    jest.clearAllMocks()

    // Mock de la chaîne Supabase
    mockSelect = {
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      maybeSingle: jest.fn()
    }

    mockInsert = {
      select: jest.fn().mockReturnValue(mockSelect)
    }

    // Mock pour update avec double .eq()
    mockUpdate = {
      eq: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: null }))
      }))
    }

    // Mock pour delete avec double .eq()
    mockDelete = {
      eq: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: null }))
      }))
    }

    mockFrom = jest.fn((table) => ({
      select: jest.fn().mockReturnValue(mockSelect),
      insert: jest.fn().mockReturnValue(mockInsert),
      update: jest.fn().mockReturnValue(mockUpdate),
      delete: jest.fn().mockReturnValue(mockDelete)
    }))

    mockChannel = {
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockReturnThis()
    }

    mockSupabaseClient = {
      from: mockFrom,
      channel: jest.fn().mockReturnValue(mockChannel),
      removeChannel: jest.fn()
    }

    global.supabase.createClient.mockReturnValue(mockSupabaseClient)

    // Mock console pour éviter les logs pendant les tests
    jest.spyOn(console, 'log').mockImplementation()
    jest.spyOn(console, 'error').mockImplementation()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  // =======================
  // 1. INITIALISATION
  // =======================

  describe('Constructor', () => {
    test('should create Supabase client with URL and key', () => {
      provider = new SupabaseProvider('https://test.supabase.co', 'test-key')

      expect(global.supabase.createClient).toHaveBeenCalledWith(
        'https://test.supabase.co',
        'test-key'
      )
      expect(provider.supabase).toBe(mockSupabaseClient)
    })

    test('should initialize subscriptions Map', () => {
      provider = new SupabaseProvider('https://test.supabase.co', 'test-key')

      expect(provider.subscriptions).toBeInstanceOf(Map)
      expect(provider.subscriptions.size).toBe(0)
    })

    test('should throw error if URL is missing', () => {
      expect(() => {
        new SupabaseProvider(null, 'test-key')
      }).toThrow('URL et clé Supabase requis')
    })

    test('should throw error if key is missing', () => {
      expect(() => {
        new SupabaseProvider('https://test.supabase.co', null)
      }).toThrow('URL et clé Supabase requis')
    })

    test('should throw error if both are missing', () => {
      expect(() => {
        new SupabaseProvider(null, null)
      }).toThrow('URL et clé Supabase requis')
    })
  })

  // =======================
  // 2. CREATE GROUP
  // =======================

  describe('createGroup()', () => {
    beforeEach(() => {
      provider = new SupabaseProvider('https://test.supabase.co', 'test-key')
    })

    test('should create group and add creator', async () => {
      // Mock création du groupe
      mockSelect.single.mockResolvedValueOnce({
        data: {
          id: 'group-123',
          code: 'ABC123',
          name: 'Test Group',
          created_at: '2025-01-01T00:00:00Z'
        },
        error: null
      })

      // Mock ajout du participant
      mockSelect.single.mockResolvedValueOnce({
        data: {
          id: 'part-456',
          group_id: 'group-123',
          name: 'Creator',
          today_count: 0
        },
        error: null
      })

      const result = await provider.createGroup('Test Group', 'Creator')

      expect(result).toEqual({
        groupId: 'group-123',
        participantId: 'part-456',
        code: 'ABC123',
        name: 'Test Group',
        creatorName: 'Creator'
      })
    })

    test('should insert group with correct data', async () => {
      mockSelect.single.mockResolvedValue({
        data: { id: 'group-123', code: 'ABC123', name: 'Test' },
        error: null
      })

      await provider.createGroup('Test Group', 'Creator')

      const insertCall = mockFrom.mock.results[0].value.insert.mock.calls[0][0]

      expect(insertCall.code).toBe('ABC123')
      expect(insertCall.name).toBe('Test Group')
      expect(insertCall.created_at).toBeDefined()
      // created_by_device peut être device-123 ou null selon le mock analytics
    })

    test('should use default name if not provided', async () => {
      mockSelect.single.mockResolvedValue({
        data: { id: 'group-123', code: 'ABC123', name: 'Zikir Grubu' },
        error: null
      })

      await provider.createGroup('', 'Creator')

      const insertCall = mockFrom.mock.results[0].value.insert.mock.calls[0][0]
      expect(insertCall.name).toBe('Zikir Grubu')
    })

    test('should add creator as participant', async () => {
      mockSelect.single.mockResolvedValueOnce({
        data: { id: 'group-123', code: 'ABC123', name: 'Test' },
        error: null
      })

      mockSelect.single.mockResolvedValueOnce({
        data: { id: 'part-456', name: 'Creator' },
        error: null
      })

      await provider.createGroup('Test', 'Creator')

      const participantInsert = mockFrom.mock.results[1].value.insert.mock.calls[0][0]

      expect(participantInsert.group_id).toBe('group-123')
      expect(participantInsert.name).toBe('Creator')
      expect(participantInsert.today_count).toBe(0)
      expect(participantInsert.week_count).toBe(0)
      expect(participantInsert.total_count).toBe(0)
    })

    test('should throw error if group creation fails', async () => {
      mockSelect.single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      })

      await expect(
        provider.createGroup('Test', 'Creator')
      ).rejects.toThrow('Impossible de créer le groupe')
    })

    test('should throw error if participant creation fails', async () => {
      mockSelect.single.mockResolvedValueOnce({
        data: { id: 'group-123', code: 'ABC123', name: 'Test' },
        error: null
      })

      mockSelect.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Participant error' }
      })

      await expect(
        provider.createGroup('Test', 'Creator')
      ).rejects.toThrow('Impossible de créer le groupe')
    })
  })

  // =======================
  // 3. JOIN GROUP
  // =======================

  describe('joinGroup()', () => {
    beforeEach(() => {
      provider = new SupabaseProvider('https://test.supabase.co', 'test-key')
    })

    test('should join existing group', async () => {
      // Mock groupe existant
      mockSelect.single.mockResolvedValueOnce({
        data: {
          id: 'group-789',
          code: 'XYZ789',
          name: 'Existing Group'
        },
        error: null
      })

      // Mock vérification nom (pas de doublon)
      mockSelect.maybeSingle.mockResolvedValueOnce({
        data: null,
        error: null
      })

      // Mock ajout participant
      mockSelect.single.mockResolvedValueOnce({
        data: {
          id: 'part-999',
          group_id: 'group-789',
          name: 'Participant'
        },
        error: null
      })

      const result = await provider.joinGroup('xyz789', 'Participant')

      expect(result).toEqual({
        groupId: 'group-789',
        participantId: 'part-999',
        name: 'Existing Group',
        code: 'XYZ789'
      })
    })

    test('should convert code to uppercase', async () => {
      mockSelect.single.mockResolvedValue({
        data: { id: 'group-789', code: 'XYZ789', name: 'Test' },
        error: null
      })

      mockSelect.maybeSingle.mockResolvedValue({ data: null })
      mockSelect.single.mockResolvedValue({
        data: { id: 'part-999' },
        error: null
      })

      await provider.joinGroup('xyz789', 'User')

      expect(mockSelect.eq).toHaveBeenCalledWith('code', 'XYZ789')
    })

    test('should throw error if group not found', async () => {
      mockSelect.single.mockResolvedValue({
        data: null,
        error: { message: 'Not found' }
      })

      await expect(
        provider.joinGroup('INVALID', 'User')
      ).rejects.toThrow('Impossible de rejoindre le groupe')
    })

    test('should throw error if name already taken', async () => {
      mockSelect.single.mockResolvedValueOnce({
        data: { id: 'group-789', code: 'XYZ789' },
        error: null
      })

      mockSelect.maybeSingle.mockResolvedValueOnce({
        data: { name: 'ExistingUser' },
        error: null
      })

      await expect(
        provider.joinGroup('XYZ789', 'ExistingUser')
      ).rejects.toThrow('Ce nom est déjà utilisé dans ce groupe')
    })

    test('should add participant with correct data', async () => {
      mockSelect.single.mockResolvedValueOnce({
        data: { id: 'group-789', code: 'XYZ789', name: 'Test' },
        error: null
      })

      mockSelect.maybeSingle.mockResolvedValueOnce({ data: null })

      mockSelect.single.mockResolvedValueOnce({
        data: { id: 'part-999' },
        error: null
      })

      await provider.joinGroup('XYZ789', 'NewUser')

      const participantInsert = mockFrom.mock.results[2].value.insert.mock.calls[0][0]

      expect(participantInsert.group_id).toBe('group-789')
      expect(participantInsert.name).toBe('NewUser')
      expect(participantInsert.today_count).toBe(0)
    })
  })

  // =======================
  // 4. UPDATE SCORE
  // =======================

  describe('updateScore()', () => {
    beforeEach(() => {
      provider = new SupabaseProvider('https://test.supabase.co', 'test-key')
    })

    test('should update participant score', async () => {
      mockUpdate.eq.mockResolvedValue({ error: null })

      const score = {
        today: 10,
        week: 50,
        month: 200,
        total: 1000
      }

      await provider.updateScore('group-123', 'part-456', score)

      const updateCall = mockFrom.mock.results[0].value.update.mock.calls[0][0]

      expect(updateCall.today_count).toBe(10)
      expect(updateCall.week_count).toBe(50)
      expect(updateCall.month_count).toBe(200)
      expect(updateCall.total_count).toBe(1000)
      expect(updateCall.updated_at).toBeDefined()
    })

    test('should include categories in metadata', async () => {
      mockUpdate.eq.mockResolvedValue({ error: null })

      const score = {
        today: 10,
        total: 100,
        categories: {
          'Namaz': { count: 50 },
          'Kuran': { count: 30 }
        }
      }

      await provider.updateScore('group-123', 'part-456', score)

      const updateCall = mockFrom.mock.results[0].value.update.mock.calls[0][0]

      expect(updateCall.metadata).toBeDefined()
      expect(updateCall.metadata.categories).toEqual(score.categories)
    })

    test('should include books in metadata', async () => {
      mockUpdate.eq.mockResolvedValue({ error: null })

      const score = {
        today: 5,
        total: 50,
        books: {
          'book-1': { count: 25 }
        }
      }

      await provider.updateScore('group-123', 'part-456', score)

      const updateCall = mockFrom.mock.results[0].value.update.mock.calls[0][0]

      expect(updateCall.metadata.books).toEqual(score.books)
    })

    test('should use retrySupabase wrapper', async () => {
      mockUpdate.eq.mockResolvedValue({ error: null })

      await provider.updateScore('group-123', 'part-456', { today: 1 })

      expect(global.retrySupabase).toHaveBeenCalled()
    })

    test('should throw error if update fails', async () => {
      global.retrySupabase.mockImplementation(async (fn) => {
        throw new Error('Update failed')
      })

      await expect(
        provider.updateScore('group-123', 'part-456', { today: 1 })
      ).rejects.toThrow()
    })

    test('should queue update if offline', async () => {
      global.offlineManager.checkOnline.mockReturnValue(false)
      global.retrySupabase.mockImplementation(async () => {
        throw new Error('Offline')
      })

      await provider.updateScore('group-123', 'part-456', { today: 1 })

      expect(global.offlineManager.addToQueue).toHaveBeenCalled()
    })

    test('should handle score with default values', async () => {
      await provider.updateScore('group-123', 'part-456', {})

      // Vérifier que update a été appelé avec des valeurs par défaut
      const updateCalls = mockFrom.mock.calls.filter(call => call[0] === 'participants')
      expect(updateCalls.length).toBeGreaterThan(0)

      const lastUpdateCall = mockFrom.mock.results.slice(-1)[0].value.update.mock.calls[0][0]

      expect(lastUpdateCall.today_count).toBe(0)
      expect(lastUpdateCall.week_count).toBe(0)
      expect(lastUpdateCall.total_count).toBe(0)
    })
  })

  // =======================
  // 5. GET LEADERBOARD
  // =======================

  describe('getLeaderboard()', () => {
    beforeEach(() => {
      provider = new SupabaseProvider('https://test.supabase.co', 'test-key')
    })

    test('should get leaderboard sorted by today_count', async () => {
      const mockData = [
        {
          id: 'part-1',
          name: 'User1',
          today_count: 100,
          week_count: 500,
          total_count: 2000,
          updated_at: '2025-01-01T00:00:00Z'
        },
        {
          id: 'part-2',
          name: 'User2',
          today_count: 50,
          week_count: 300,
          total_count: 1000,
          updated_at: '2025-01-01T01:00:00Z'
        }
      ]

      mockSelect.eq.mockReturnThis()

      const mockOrder = jest.fn().mockResolvedValue({
        data: mockData,
        error: null
      })

      mockSelect.order = mockOrder

      const result = await provider.getLeaderboard('group-123')

      expect(result.length).toBe(2)
      expect(result[0].name).toBe('User1')
      expect(result[0].todayCount).toBe(100)
      expect(result[1].name).toBe('User2')
    })

    test('should calculate points correctly', async () => {
      const mockData = [{
        id: 'part-1',
        name: 'User',
        today_count: 10,
        week_count: 20,
        total_count: 150,
        updated_at: '2025-01-01T00:00:00Z'
      }]

      mockSelect.eq.mockReturnThis()

      const mockOrder = jest.fn().mockResolvedValue({
        data: mockData,
        error: null
      })

      mockSelect.order = mockOrder

      const result = await provider.getLeaderboard('group-123')

      // Points = (today * 10) + (week * 2) + floor(total / 10)
      // = (10 * 10) + (20 * 2) + floor(150 / 10)
      // = 100 + 40 + 15 = 155
      expect(result[0].points).toBe(155)
    })

    test('should throw error if query fails', async () => {
      mockSelect.eq.mockReturnThis()

      const mockOrder = jest.fn().mockResolvedValue({
        data: null,
        error: new Error('Query error')
      })

      mockSelect.order = mockOrder

      await expect(
        provider.getLeaderboard('group-123')
      ).rejects.toThrow('Query error')
    })

    test('should return empty array if no participants', async () => {
      mockSelect.eq.mockReturnThis()

      const mockOrder = jest.fn().mockResolvedValue({
        data: [],
        error: null
      })

      mockSelect.order = mockOrder

      const result = await provider.getLeaderboard('group-123')

      expect(result).toEqual([])
    })
  })

  // =======================
  // 6. LEAVE GROUP
  // =======================

  describe('leaveGroup()', () => {
    beforeEach(() => {
      provider = new SupabaseProvider('https://test.supabase.co', 'test-key')
    })

    test('should delete participant', async () => {
      mockDelete.eq.mockResolvedValue({ error: null })

      await provider.leaveGroup('group-123', 'part-456')

      expect(mockFrom).toHaveBeenCalledWith('participants')
      expect(mockDelete.eq).toHaveBeenCalledWith('id', 'part-456')
      expect(mockDelete.eq).toHaveBeenCalledWith('group_id', 'group-123')
    })

    test('should throw error if delete fails', async () => {
      mockDelete.eq.mockResolvedValue({
        error: { message: 'Delete error' }
      })

      await expect(
        provider.leaveGroup('group-123', 'part-456')
      ).rejects.toThrow()
    })
  })

  // =======================
  // 7. SUBSCRIPTIONS
  // =======================

  describe('subscribeToGroup()', () => {
    beforeEach(() => {
      provider = new SupabaseProvider('https://test.supabase.co', 'test-key')
    })

    test('should create subscription channel', () => {
      const callback = jest.fn()

      provider.subscribeToGroup('group-123', callback)

      expect(mockSupabaseClient.channel).toHaveBeenCalledWith('group_group-123')
      expect(mockChannel.on).toHaveBeenCalled()
      expect(mockChannel.subscribe).toHaveBeenCalled()
    })

    test('should listen to postgres changes', () => {
      const callback = jest.fn()

      provider.subscribeToGroup('group-123', callback)

      const onCall = mockChannel.on.mock.calls[0]

      expect(onCall[0]).toBe('postgres_changes')
      expect(onCall[1].event).toBe('*')
      expect(onCall[1].table).toBe('participants')
      expect(onCall[1].filter).toBe('group_id=eq.group-123')
    })

    test('should trigger callback on updates', () => {
      const callback = jest.fn()

      provider.subscribeToGroup('group-123', callback)

      const onCallback = mockChannel.on.mock.calls[0][2]
      const mockPayload = { type: 'UPDATE', record: { id: 'part-1' } }

      onCallback(mockPayload)

      expect(callback).toHaveBeenCalledWith(mockPayload)
    })

    test('should store subscription in Map', () => {
      provider.subscribeToGroup('group-123', jest.fn())

      expect(provider.subscriptions.has('group-123')).toBe(true)
      expect(provider.subscriptions.get('group-123')).toBe(mockChannel)
    })

    test('should unsubscribe from existing subscription first', () => {
      const existingChannel = { on: jest.fn().mockReturnThis(), subscribe: jest.fn() }
      provider.subscriptions.set('group-123', existingChannel)

      provider.subscribeToGroup('group-123', jest.fn())

      expect(mockSupabaseClient.removeChannel).toHaveBeenCalledWith(existingChannel)
    })
  })

  describe('unsubscribeFromGroup()', () => {
    beforeEach(() => {
      provider = new SupabaseProvider('https://test.supabase.co', 'test-key')
    })

    test('should remove channel subscription', () => {
      provider.subscriptions.set('group-123', mockChannel)

      provider.unsubscribeFromGroup('group-123')

      expect(mockSupabaseClient.removeChannel).toHaveBeenCalledWith(mockChannel)
      expect(provider.subscriptions.has('group-123')).toBe(false)
    })

    test('should do nothing if no subscription exists', () => {
      provider.unsubscribeFromGroup('nonexistent')

      expect(mockSupabaseClient.removeChannel).not.toHaveBeenCalled()
    })
  })

  // =======================
  // 8. CALCULATE POINTS
  // =======================

  describe('calculatePoints()', () => {
    beforeEach(() => {
      provider = new SupabaseProvider('https://test.supabase.co', 'test-key')
    })

    test('should calculate points correctly', () => {
      const participant = {
        today_count: 10,
        week_count: 20,
        total_count: 150
      }

      const points = provider.calculatePoints(participant)

      // (10 * 10) + (20 * 2) + floor(150 / 10) = 100 + 40 + 15
      expect(points).toBe(155)
    })

    test('should handle zero counts', () => {
      const participant = {
        today_count: 0,
        week_count: 0,
        total_count: 0
      }

      const points = provider.calculatePoints(participant)
      expect(points).toBe(0)
    })

    test('should floor total count division', () => {
      const participant = {
        today_count: 0,
        week_count: 0,
        total_count: 99 // Should give 9 points, not 9.9
      }

      const points = provider.calculatePoints(participant)
      expect(points).toBe(9)
    })

    test('should handle large numbers', () => {
      const participant = {
        today_count: 1000,
        week_count: 5000,
        total_count: 100000
      }

      const points = provider.calculatePoints(participant)
      // (1000 * 10) + (5000 * 2) + floor(100000 / 10)
      // = 10000 + 10000 + 10000
      expect(points).toBe(30000)
    })
  })

  // =======================
  // 9. EDGE CASES
  // =======================

  describe('Edge Cases', () => {
    beforeEach(() => {
      provider = new SupabaseProvider('https://test.supabase.co', 'test-key')
    })

    test('should handle empty group name', async () => {
      mockSelect.single.mockResolvedValue({
        data: { id: 'group-123', code: 'ABC123', name: 'Zikir Grubu' },
        error: null
      })

      await provider.createGroup(null, 'Creator')

      const insertCall = mockFrom.mock.results[0].value.insert.mock.calls[0][0]
      expect(insertCall.name).toBe('Zikir Grubu')
    })

    test('should handle special characters in names', async () => {
      mockSelect.single.mockResolvedValueOnce({
        data: { id: 'group-123', code: 'ABC123', name: "Test's <Group>" },
        error: null
      })

      mockSelect.single.mockResolvedValueOnce({
        data: { id: 'part-456' },
        error: null
      })

      const result = await provider.createGroup("Test's <Group>", 'Creator')

      expect(result.name).toBe("Test's <Group>")
    })

    test('should handle concurrent subscriptions', () => {
      provider.subscribeToGroup('group-1', jest.fn())
      provider.subscribeToGroup('group-2', jest.fn())
      provider.subscribeToGroup('group-3', jest.fn())

      expect(provider.subscriptions.size).toBe(3)
      expect(provider.subscriptions.has('group-1')).toBe(true)
      expect(provider.subscriptions.has('group-2')).toBe(true)
      expect(provider.subscriptions.has('group-3')).toBe(true)
    })

    test('should handle re-subscription to same group', () => {
      // Première souscription
      const firstChannel = { on: jest.fn().mockReturnThis(), subscribe: jest.fn() }
      mockSupabaseClient.channel.mockReturnValueOnce(firstChannel)
      provider.subscribeToGroup('group-123', jest.fn())

      // Deuxième souscription (re-subscription)
      const newChannel = { on: jest.fn().mockReturnThis(), subscribe: jest.fn() }
      mockSupabaseClient.channel.mockReturnValueOnce(newChannel)
      provider.subscribeToGroup('group-123', jest.fn())

      expect(mockSupabaseClient.removeChannel).toHaveBeenCalledWith(firstChannel)
      expect(provider.subscriptions.get('group-123')).toBe(newChannel)
    })

    test('should handle missing analytics', async () => {
      global.window.analytics = undefined

      mockSelect.single.mockResolvedValue({
        data: { id: 'group-123', code: 'ABC123', name: 'Test' },
        error: null
      })

      await provider.createGroup('Test', 'Creator')

      const insertCall = mockFrom.mock.results[0].value.insert.mock.calls[0][0]
      expect(insertCall.created_by_device).toBeNull()

      // Restaurer analytics
      global.window.analytics = { getDeviceId: jest.fn(() => 'device-123') }
    })
  })
})
