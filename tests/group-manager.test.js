/**
 * Tests pour GroupManager - Gestion Multi-Groupes
 * Tests complets avec mocking du provider
 */

const GroupManager = require('../src/services/GroupManager.js')

describe('GroupManager - Gestion Multi-Groupes', () => {
  let groupManager
  let mockProvider

  beforeEach(() => {
    // Nettoyer localStorage
    localStorage.clear()

    // Créer un nouveau GroupManager
    groupManager = new GroupManager()

    // Mock provider
    mockProvider = {
      constructor: { name: 'MockProvider' },
      createGroup: jest.fn(),
      joinGroup: jest.fn(),
      updateScore: jest.fn(),
      getLeaderboard: jest.fn(),
      leaveGroup: jest.fn(),
      subscribeToGroup: jest.fn(),
      unsubscribeFromGroup: jest.fn()
    }
  })

  afterEach(() => {
    localStorage.clear()
    jest.clearAllMocks()
  })

  // =======================
  // 1. INITIALISATION
  // =======================

  describe('Initialisation', () => {
    test('should initialize with default values', () => {
      expect(groupManager.provider).toBeNull()
      expect(groupManager.groups).toBeInstanceOf(Map)
      expect(groupManager.groups.size).toBe(0)
      expect(groupManager.activeGroupId).toBeNull()
      expect(groupManager.MAX_GROUPS).toBe(10)
    })

    test('should have legacy properties for compatibility', () => {
      expect(groupManager.currentGroup).toBeNull()
      expect(groupManager.currentParticipant).toBeNull()
      expect(groupManager.isCreator).toBe(false)
    })

    test('should initialize with provider', () => {
      groupManager.initialize(mockProvider)

      expect(groupManager.provider).toBe(mockProvider)
    })

    test('should load saved groups on initialize', () => {
      // Préparer données sauvegardées
      const savedData = {
        activeGroupId: 'group-123',
        groups: {
          'group-123': {
            groupId: 'group-123',
            code: 'ABC123',
            name: 'Test Group',
            participantId: 'part-456',
            participantName: 'User',
            isCreator: true,
            provider: 'MockProvider'
          }
        }
      }
      localStorage.setItem('multiGroups', JSON.stringify(savedData))

      groupManager.initialize(mockProvider)

      expect(groupManager.groups.size).toBe(1)
      expect(groupManager.activeGroupId).toBe('group-123')
    })
  })

  // =======================
  // 2. CRÉER UN GROUPE
  // =======================

  describe('createGroup()', () => {
    beforeEach(() => {
      groupManager.initialize(mockProvider)
    })

    test('should create a new group successfully', async () => {
      mockProvider.createGroup.mockResolvedValue({
        groupId: 'group-123',
        code: 'ABC123',
        name: 'Test Group',
        participantId: 'part-456'
      })

      const result = await groupManager.createGroup('Test Group', 'Creator')

      expect(result.groupId).toBe('group-123')
      expect(result.code).toBe('ABC123')
      expect(mockProvider.createGroup).toHaveBeenCalledWith('Test Group', 'Creator')
    })

    test('should add group to Map', async () => {
      mockProvider.createGroup.mockResolvedValue({
        groupId: 'group-123',
        code: 'ABC123',
        name: 'Test Group',
        participantId: 'part-456'
      })

      await groupManager.createGroup('Test Group', 'Creator')

      expect(groupManager.groups.size).toBe(1)
      expect(groupManager.groups.has('group-123')).toBe(true)
    })

    test('should set as active group', async () => {
      mockProvider.createGroup.mockResolvedValue({
        groupId: 'group-123',
        code: 'ABC123',
        name: 'Test Group',
        participantId: 'part-456'
      })

      await groupManager.createGroup('Test Group', 'Creator')

      expect(groupManager.activeGroupId).toBe('group-123')
    })

    test('should mark creator as isCreator', async () => {
      mockProvider.createGroup.mockResolvedValue({
        groupId: 'group-123',
        code: 'ABC123',
        name: 'Test Group',
        participantId: 'part-456'
      })

      await groupManager.createGroup('Test Group', 'Creator')

      const group = groupManager.groups.get('group-123')
      expect(group.isCreator).toBe(true)
    })

    test('should save to localStorage', async () => {
      mockProvider.createGroup.mockResolvedValue({
        groupId: 'group-123',
        code: 'ABC123',
        name: 'Test Group',
        participantId: 'part-456'
      })

      await groupManager.createGroup('Test Group', 'Creator')

      const saved = localStorage.getItem('multiGroups')
      expect(saved).not.toBeNull()

      const parsed = JSON.parse(saved)
      expect(parsed.activeGroupId).toBe('group-123')
    })

    test('should throw error if provider not initialized', async () => {
      const newManager = new GroupManager()

      await expect(
        newManager.createGroup('Test', 'Creator')
      ).rejects.toThrow('Provider non initialisé')
    })

    test('should throw error if max groups reached', async () => {
      // Ajouter 10 groupes
      for (let i = 0; i < 10; i++) {
        groupManager.groups.set(`group-${i}`, {
          groupId: `group-${i}`,
          code: `CODE${i}`,
          name: `Group ${i}`
        })
      }

      await expect(
        groupManager.createGroup('Too Many', 'User')
      ).rejects.toThrow('Maximum 10 groupes atteint')
    })

    test('should handle provider errors', async () => {
      mockProvider.createGroup.mockRejectedValue(new Error('Network error'))

      await expect(
        groupManager.createGroup('Test', 'Creator')
      ).rejects.toThrow('Network error')
    })
  })

  // =======================
  // 3. REJOINDRE UN GROUPE
  // =======================

  describe('joinGroup()', () => {
    beforeEach(() => {
      groupManager.initialize(mockProvider)
    })

    test('should join a group successfully', async () => {
      mockProvider.joinGroup.mockResolvedValue({
        groupId: 'group-789',
        code: 'XYZ789',
        name: 'Existing Group',
        participantId: 'part-999'
      })

      const result = await groupManager.joinGroup('XYZ789', 'Participant')

      expect(result.groupId).toBe('group-789')
      expect(mockProvider.joinGroup).toHaveBeenCalledWith('XYZ789', 'Participant')
    })

    test('should add group to Map', async () => {
      mockProvider.joinGroup.mockResolvedValue({
        groupId: 'group-789',
        code: 'XYZ789',
        name: 'Existing Group',
        participantId: 'part-999'
      })

      await groupManager.joinGroup('XYZ789', 'Participant')

      expect(groupManager.groups.size).toBe(1)
      expect(groupManager.groups.has('group-789')).toBe(true)
    })

    test('should mark as NOT creator', async () => {
      mockProvider.joinGroup.mockResolvedValue({
        groupId: 'group-789',
        code: 'XYZ789',
        name: 'Existing Group',
        participantId: 'part-999'
      })

      await groupManager.joinGroup('XYZ789', 'Participant')

      const group = groupManager.groups.get('group-789')
      expect(group.isCreator).toBe(false)
    })

    test('should activate existing group if already joined', async () => {
      // Ajouter un groupe existant
      groupManager.groups.set('group-123', {
        groupId: 'group-123',
        code: 'ABC123',
        name: 'Existing',
        participantId: 'part-456',
        participantName: 'User',
        isCreator: false
      })

      const result = await groupManager.joinGroup('ABC123', 'User')

      expect(result.groupId).toBe('group-123')
      expect(groupManager.activeGroupId).toBe('group-123')
      expect(mockProvider.joinGroup).not.toHaveBeenCalled()
    })

    test('should throw error if provider not initialized', async () => {
      const newManager = new GroupManager()

      await expect(
        newManager.joinGroup('CODE', 'User')
      ).rejects.toThrow('Provider non initialisé')
    })

    test('should throw error if max groups reached', async () => {
      for (let i = 0; i < 10; i++) {
        groupManager.groups.set(`group-${i}`, {
          groupId: `group-${i}`,
          code: `CODE${i}`
        })
      }

      await expect(
        groupManager.joinGroup('NEWCODE', 'User')
      ).rejects.toThrow('Maximum 10 groupes atteint')
    })
  })

  // =======================
  // 4. MISE À JOUR DES SCORES
  // =======================

  describe('updateMyScore()', () => {
    beforeEach(() => {
      groupManager.initialize(mockProvider)
    })

    test('should update score for active group (legacy mode)', async () => {
      groupManager.groups.set('group-123', {
        groupId: 'group-123',
        code: 'ABC123',
        participantId: 'part-456',
        name: 'Test Group'
      })
      groupManager.activeGroupId = 'group-123'

      const stats = { today: 10, week: 50, total: 100 }
      await groupManager.updateMyScore(stats)

      expect(mockProvider.updateScore).toHaveBeenCalledWith(
        'group-123',
        'part-456',
        stats
      )
    })

    test('should update all groups when syncAll=true', async () => {
      groupManager.groups.set('group-1', {
        groupId: 'group-1',
        participantId: 'part-1',
        name: 'Group 1'
      })
      groupManager.groups.set('group-2', {
        groupId: 'group-2',
        participantId: 'part-2',
        name: 'Group 2'
      })

      mockProvider.updateScore.mockResolvedValue()

      const stats = { today: 5, week: 25, total: 50 }
      await groupManager.updateMyScore(stats, true)

      expect(mockProvider.updateScore).toHaveBeenCalledTimes(2)
      expect(mockProvider.updateScore).toHaveBeenCalledWith('group-1', 'part-1', stats)
      expect(mockProvider.updateScore).toHaveBeenCalledWith('group-2', 'part-2', stats)
    })

    test('should update lastSync timestamp', async () => {
      groupManager.groups.set('group-123', {
        groupId: 'group-123',
        participantId: 'part-456',
        name: 'Test'
      })
      groupManager.activeGroupId = 'group-123'

      const beforeSync = new Date().toISOString()
      await groupManager.updateMyScore({ today: 1 })

      const group = groupManager.groups.get('group-123')
      expect(group.lastSync).toBeDefined()
      expect(group.lastSync >= beforeSync).toBe(true)
    })

    test('should warn if no active group', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      await groupManager.updateMyScore({ today: 1 })

      expect(consoleSpy).toHaveBeenCalledWith('Pas de groupe actif')
      consoleSpy.mockRestore()
    })

    test('should handle provider errors gracefully', async () => {
      groupManager.groups.set('group-123', {
        groupId: 'group-123',
        participantId: 'part-456'
      })
      groupManager.activeGroupId = 'group-123'

      mockProvider.updateScore.mockRejectedValue(new Error('Sync failed'))

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      await groupManager.updateMyScore({ today: 1 })

      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })

  // =======================
  // 5. CLASSEMENT
  // =======================

  describe('getLeaderboard()', () => {
    beforeEach(() => {
      groupManager.initialize(mockProvider)
    })

    test('should get leaderboard for active group', async () => {
      groupManager.activeGroupId = 'group-123'

      const mockLeaderboard = [
        { name: 'User1', points: 100 },
        { name: 'User2', points: 50 }
      ]
      mockProvider.getLeaderboard.mockResolvedValue(mockLeaderboard)

      const result = await groupManager.getLeaderboard()

      expect(result).toEqual(mockLeaderboard)
      expect(mockProvider.getLeaderboard).toHaveBeenCalledWith('group-123')
    })

    test('should get leaderboard for specific group', async () => {
      const mockLeaderboard = [{ name: 'User', points: 75 }]
      mockProvider.getLeaderboard.mockResolvedValue(mockLeaderboard)

      const result = await groupManager.getLeaderboard('group-456')

      expect(result).toEqual(mockLeaderboard)
      expect(mockProvider.getLeaderboard).toHaveBeenCalledWith('group-456')
    })

    test('should throw error if no active group', async () => {
      await expect(
        groupManager.getLeaderboard()
      ).rejects.toThrow('Pas de groupe actif')
    })
  })

  // =======================
  // 6. CHANGER DE GROUPE ACTIF
  // =======================

  describe('switchActiveGroup()', () => {
    beforeEach(() => {
      groupManager.initialize(mockProvider)

      groupManager.groups.set('group-1', {
        groupId: 'group-1',
        code: 'GRP001',
        name: 'Group 1'
      })
      groupManager.groups.set('group-2', {
        groupId: 'group-2',
        code: 'GRP002',
        name: 'Group 2'
      })
      groupManager.activeGroupId = 'group-1'
    })

    test('should switch to different group', () => {
      const result = groupManager.switchActiveGroup('group-2')

      expect(result).toBe(true)
      expect(groupManager.activeGroupId).toBe('group-2')
    })

    test('should unsubscribe from old group', () => {
      groupManager.switchActiveGroup('group-2')

      expect(mockProvider.unsubscribeFromGroup).toHaveBeenCalledWith('group-1')
    })

    test('should subscribe to new group', () => {
      groupManager.switchActiveGroup('group-2')

      expect(mockProvider.subscribeToGroup).toHaveBeenCalled()
    })

    test('should save after switching', () => {
      groupManager.switchActiveGroup('group-2')

      const saved = localStorage.getItem('multiGroups')
      const parsed = JSON.parse(saved)

      expect(parsed.activeGroupId).toBe('group-2')
    })

    test('should return false if group not found', () => {
      const result = groupManager.switchActiveGroup('nonexistent')

      expect(result).toBe(false)
      expect(groupManager.activeGroupId).toBe('group-1') // Unchanged
    })
  })

  // =======================
  // 7. QUITTER UN GROUPE
  // =======================

  describe('leaveGroup()', () => {
    beforeEach(() => {
      groupManager.initialize(mockProvider)
      mockProvider.leaveGroup.mockResolvedValue()
    })

    test('should leave the active group', async () => {
      groupManager.groups.set('group-123', {
        groupId: 'group-123',
        participantId: 'part-456',
        name: 'Test Group'
      })
      groupManager.activeGroupId = 'group-123'

      await groupManager.leaveGroup()

      expect(mockProvider.leaveGroup).toHaveBeenCalledWith('group-123', 'part-456')
      expect(groupManager.groups.has('group-123')).toBe(false)
    })

    test('should leave a specific group', async () => {
      groupManager.groups.set('group-123', {
        groupId: 'group-123',
        participantId: 'part-456',
        name: 'Test'
      })

      await groupManager.leaveGroup('group-123')

      expect(groupManager.groups.has('group-123')).toBe(false)
    })

    test('should switch to another group if leaving active', async () => {
      groupManager.groups.set('group-1', {
        groupId: 'group-1',
        participantId: 'part-1',
        name: 'Group 1'
      })
      groupManager.groups.set('group-2', {
        groupId: 'group-2',
        participantId: 'part-2',
        name: 'Group 2'
      })
      groupManager.activeGroupId = 'group-1'

      await groupManager.leaveGroup('group-1')

      expect(groupManager.activeGroupId).toBe('group-2')
    })

    test('should set activeGroupId to null if last group', async () => {
      groupManager.groups.set('group-123', {
        groupId: 'group-123',
        participantId: 'part-456'
      })
      groupManager.activeGroupId = 'group-123'

      await groupManager.leaveGroup()

      expect(groupManager.activeGroupId).toBeNull()
    })

    test('should unsubscribe if leaving active group', async () => {
      groupManager.groups.set('group-123', {
        groupId: 'group-123',
        participantId: 'part-456'
      })
      groupManager.activeGroupId = 'group-123'

      await groupManager.leaveGroup()

      expect(mockProvider.unsubscribeFromGroup).toHaveBeenCalledWith('group-123')
    })
  })

  // =======================
  // 8. PERSISTENCE
  // =======================

  describe('saveGroup() & loadSavedGroup()', () => {
    beforeEach(() => {
      groupManager.initialize(mockProvider)
    })

    test('should save groups to localStorage', () => {
      groupManager.groups.set('group-123', {
        groupId: 'group-123',
        code: 'ABC123',
        name: 'Test'
      })
      groupManager.activeGroupId = 'group-123'

      groupManager.saveGroup()

      const saved = localStorage.getItem('multiGroups')
      expect(saved).not.toBeNull()

      const parsed = JSON.parse(saved)
      expect(parsed.activeGroupId).toBe('group-123')
      expect(parsed.groups['group-123']).toBeDefined()
    })

    test('should load groups from localStorage', () => {
      const savedData = {
        activeGroupId: 'group-789',
        groups: {
          'group-789': {
            groupId: 'group-789',
            code: 'XYZ789',
            name: 'Loaded Group',
            participantId: 'part-999',
            isCreator: false
          }
        }
      }
      localStorage.setItem('multiGroups', JSON.stringify(savedData))

      const newManager = new GroupManager()
      newManager.initialize(mockProvider)

      expect(newManager.groups.size).toBe(1)
      expect(newManager.activeGroupId).toBe('group-789')
      expect(newManager.groups.get('group-789').name).toBe('Loaded Group')
    })

    test('should migrate from old format to new format', () => {
      // Ancien format (single group)
      localStorage.setItem('currentGroup', JSON.stringify({
        id: 'old-group',
        code: 'OLD123',
        name: 'Old Group'
      }))
      localStorage.setItem('currentParticipant', JSON.stringify({
        id: 'old-part',
        name: 'Old User'
      }))
      localStorage.setItem('isCreator', 'true')

      const newManager = new GroupManager()
      newManager.initialize(mockProvider)

      expect(newManager.groups.size).toBe(1)
      expect(newManager.activeGroupId).toBe('old-group')

      const group = newManager.groups.get('old-group')
      expect(group.code).toBe('OLD123')
      expect(group.isCreator).toBe(true)
    })

    test('should save legacy format for compatibility', () => {
      groupManager.groups.set('group-123', {
        groupId: 'group-123',
        code: 'ABC123',
        name: 'Test',
        participantId: 'part-456',
        participantName: 'User',
        isCreator: true
      })
      groupManager.activeGroupId = 'group-123'

      groupManager.saveGroup()

      const legacyGroup = localStorage.getItem('currentGroup')
      expect(legacyGroup).not.toBeNull()

      const parsed = JSON.parse(legacyGroup)
      expect(parsed.id).toBe('group-123')
      expect(parsed.code).toBe('ABC123')
    })

    test('should handle corrupted data gracefully', () => {
      localStorage.setItem('multiGroups', 'invalid{json')

      const newManager = new GroupManager()
      newManager.initialize(mockProvider)

      expect(newManager.groups.size).toBe(0)
      expect(newManager.activeGroupId).toBeNull()
    })
  })

  // =======================
  // 9. RÉCUPÉRATION D'INFOS
  // =======================

  describe('getCurrentGroup(), getAllGroups(), getGroup()', () => {
    beforeEach(() => {
      groupManager.initialize(mockProvider)
    })

    test('getCurrentGroup() should return active group info', () => {
      groupManager.groups.set('group-123', {
        groupId: 'group-123',
        code: 'ABC123',
        name: 'Test',
        participantId: 'part-456',
        participantName: 'User',
        isCreator: true,
        provider: 'MockProvider'
      })
      groupManager.activeGroupId = 'group-123'
      groupManager._updateLegacyProperties()

      const result = groupManager.getCurrentGroup()

      expect(result.group.id).toBe('group-123')
      expect(result.group.code).toBe('ABC123')
      expect(result.participant.id).toBe('part-456')
      expect(result.isCreator).toBe(true)
    })

    test('getCurrentGroup() should return null if no active group', () => {
      const result = groupManager.getCurrentGroup()

      expect(result.group).toBeNull()
      expect(result.participant).toBeNull()
      expect(result.isCreator).toBe(false)
    })

    test('getAllGroups() should return all groups', () => {
      groupManager.groups.set('group-1', { groupId: 'group-1', name: 'G1' })
      groupManager.groups.set('group-2', { groupId: 'group-2', name: 'G2' })

      const result = groupManager.getAllGroups()

      expect(result.length).toBe(2)
      expect(result[0].groupId).toBeDefined()
      expect(result[1].groupId).toBeDefined()
    })

    test('getGroup() should return specific group', () => {
      groupManager.groups.set('group-123', {
        groupId: 'group-123',
        name: 'Specific'
      })

      const result = groupManager.getGroup('group-123')

      expect(result.groupId).toBe('group-123')
      expect(result.name).toBe('Specific')
    })

    test('getGroup() should return null if not found', () => {
      const result = groupManager.getGroup('nonexistent')

      expect(result).toBeNull()
    })
  })

  // =======================
  // 10. UTILITAIRES
  // =======================

  describe('hasActiveGroup(), clearGroup()', () => {
    beforeEach(() => {
      groupManager.initialize(mockProvider)
    })

    test('hasActiveGroup() should return true if active', () => {
      groupManager.groups.set('group-123', { groupId: 'group-123' })
      groupManager.activeGroupId = 'group-123'

      expect(groupManager.hasActiveGroup()).toBe(true)
    })

    test('hasActiveGroup() should return false if no active', () => {
      expect(groupManager.hasActiveGroup()).toBe(false)
    })

    test('clearGroup() should remove all groups', () => {
      groupManager.groups.set('group-1', { groupId: 'group-1' })
      groupManager.groups.set('group-2', { groupId: 'group-2' })
      groupManager.activeGroupId = 'group-1'

      groupManager.clearGroup()

      expect(groupManager.groups.size).toBe(0)
      expect(groupManager.activeGroupId).toBeNull()
    })

    test('clearGroup() should remove from localStorage', () => {
      localStorage.setItem('multiGroups', '{}')
      localStorage.setItem('currentGroup', '{}')

      groupManager.clearGroup()

      expect(localStorage.getItem('multiGroups')).toBeNull()
      expect(localStorage.getItem('currentGroup')).toBeNull()
    })
  })

  // =======================
  // 11. SUBSCRIPTIONS
  // =======================

  describe('subscribeToUpdates(), unsubscribeFromUpdates()', () => {
    beforeEach(() => {
      groupManager.initialize(mockProvider)
    })

    test('should subscribe to active group', () => {
      groupManager.activeGroupId = 'group-123'

      groupManager.subscribeToUpdates()

      expect(mockProvider.subscribeToGroup).toHaveBeenCalled()
      expect(mockProvider.subscribeToGroup.mock.calls[0][0]).toBe('group-123')
    })

    test('should trigger custom event on update', () => {
      groupManager.activeGroupId = 'group-123'

      const eventSpy = jest.fn()
      window.addEventListener('groupUpdate', eventSpy)

      groupManager.subscribeToUpdates()

      // Simuler un callback du provider
      const callback = mockProvider.subscribeToGroup.mock.calls[0][1]
      callback({ type: 'update', data: {} })

      expect(eventSpy).toHaveBeenCalled()

      window.removeEventListener('groupUpdate', eventSpy)
    })

    test('should not subscribe if no active group', () => {
      groupManager.subscribeToUpdates()

      expect(mockProvider.subscribeToGroup).not.toHaveBeenCalled()
    })

    test('should unsubscribe from active group', () => {
      groupManager.activeGroupId = 'group-123'

      groupManager.unsubscribeFromUpdates()

      expect(mockProvider.unsubscribeFromGroup).toHaveBeenCalledWith('group-123')
    })
  })

  // =======================
  // 12. EDGE CASES
  // =======================

  describe('Edge Cases', () => {
    beforeEach(() => {
      groupManager.initialize(mockProvider)
    })

    test('should handle empty group name', async () => {
      mockProvider.createGroup.mockResolvedValue({
        groupId: 'group-123',
        code: 'ABC123',
        name: '',
        participantId: 'part-456'
      })

      const result = await groupManager.createGroup('', 'User')

      expect(result.name).toBe('')
    })

    test('should handle special characters in names', async () => {
      mockProvider.createGroup.mockResolvedValue({
        groupId: 'group-123',
        code: 'ABC123',
        name: 'Test <script>',
        participantId: 'part-456'
      })

      const result = await groupManager.createGroup('Test <script>', 'User')

      expect(result.name).toBe('Test <script>')
    })

    test('should handle exactly 10 groups', async () => {
      for (let i = 0; i < 9; i++) {
        groupManager.groups.set(`group-${i}`, {
          groupId: `group-${i}`
        })
      }

      mockProvider.createGroup.mockResolvedValue({
        groupId: 'group-10',
        code: 'CODE10',
        name: 'Tenth',
        participantId: 'part-10'
      })

      // 10ème groupe OK
      await groupManager.createGroup('Tenth', 'User')
      expect(groupManager.groups.size).toBe(10)

      // 11ème bloqué
      await expect(
        groupManager.createGroup('Eleventh', 'User')
      ).rejects.toThrow('Maximum 10 groupes atteint')
    })

    test('should handle concurrent updates', async () => {
      groupManager.groups.set('group-1', {
        groupId: 'group-1',
        participantId: 'part-1',
        name: 'G1'
      })
      groupManager.groups.set('group-2', {
        groupId: 'group-2',
        participantId: 'part-2',
        name: 'G2'
      })

      mockProvider.updateScore.mockResolvedValue()

      const stats = { today: 5 }
      await groupManager.updateMyScore(stats, true)

      // Les deux groupes doivent être synchronisés
      expect(mockProvider.updateScore).toHaveBeenCalledTimes(2)
    })

    test('should handle provider returning null', async () => {
      mockProvider.getLeaderboard.mockResolvedValue(null)
      groupManager.activeGroupId = 'group-123'

      const result = await groupManager.getLeaderboard()

      expect(result).toBeNull()
    })
  })
})
