/**
 * Service unifié de gestion des groupes
 * Abstraction qui utilise le provider configuré (Supabase ou Infomaniak)
 */

class GroupManager {
  constructor() {
    this.provider = null
    // NOUVEAU: Support multi-groupe (max 10)
    this.groups = new Map() // Map<groupId, {groupId, code, name, participantId, participantName, isCreator, provider}>
    this.activeGroupId = null // ID du groupe actuellement actif
    this.MAX_GROUPS = 10

    // LEGACY: Pour compatibilité temporaire
    this.currentGroup = null
    this.currentParticipant = null
    this.isCreator = false
  }

  /**
   * Initialiser avec le provider configuré
   * @param {BackendProvider} provider - Instance de SupabaseProvider ou InfomaniakProvider
   */
  initialize(provider) {
    this.provider = provider
    this.loadSavedGroup()
  }

  /**
   * Créer un nouveau groupe
   * @param {string} groupName - Nom du groupe
   * @param {string} creatorName - Nom du créateur
   * @returns {Promise<Object>}
   */
  async createGroup(groupName, creatorName) {
    if (!this.provider) {
      throw new Error('Provider non initialisé')
    }

    // Vérifier limite de groupes
    if (this.groups.size >= this.MAX_GROUPS) {
      throw new Error(`Maximum ${this.MAX_GROUPS} groupes atteint`)
    }

    try {
      const result = await this.provider.createGroup(groupName, creatorName)

      // Créer l'objet groupe complet
      const groupData = {
        groupId: result.groupId,
        code: result.code,
        name: result.name,
        participantId: result.participantId,
        participantName: creatorName,
        isCreator: true,
        provider: this.provider.constructor.name,
        lastSync: new Date().toISOString()
      }

      // Ajouter au Map
      this.groups.set(result.groupId, groupData)
      this.activeGroupId = result.groupId

      // LEGACY: Maintenir compatibilité
      this._updateLegacyProperties()

      this.saveGroup()
      this.subscribeToUpdates()

      return result

    } catch (error) {
      console.error('Erreur création groupe:', error)
      throw error
    }
  }

  /**
   * Rejoindre un groupe existant
   * @param {string} groupCode - Code à 6 caractères
   * @param {string} participantName - Nom du participant
   * @returns {Promise<Object>}
   */
  async joinGroup(groupCode, participantName) {
    if (!this.provider) {
      throw new Error('Provider non initialisé')
    }

    // Vérifier limite de groupes
    if (this.groups.size >= this.MAX_GROUPS) {
      throw new Error(`Maximum ${this.MAX_GROUPS} groupes atteint`)
    }

    // Vérifier si déjà dans ce groupe
    const existingGroup = Array.from(this.groups.values()).find(g => g.code === groupCode)
    if (existingGroup) {
      // Juste activer ce groupe
      this.activeGroupId = existingGroup.groupId
      this._updateLegacyProperties()
      this.saveGroup()
      return {
        groupId: existingGroup.groupId,
        code: existingGroup.code,
        name: existingGroup.name,
        participantId: existingGroup.participantId
      }
    }

    try {
      const result = await this.provider.joinGroup(groupCode, participantName)

      // Créer l'objet groupe complet
      const groupData = {
        groupId: result.groupId,
        code: result.code,
        name: result.name,
        participantId: result.participantId,
        participantName: participantName,
        isCreator: false,
        provider: this.provider.constructor.name,
        lastSync: new Date().toISOString()
      }

      // Ajouter au Map
      this.groups.set(result.groupId, groupData)
      this.activeGroupId = result.groupId

      // LEGACY: Maintenir compatibilité
      this._updateLegacyProperties()

      this.saveGroup()
      this.subscribeToUpdates()

      return result

    } catch (error) {
      console.error('Erreur rejoindre groupe:', error)
      throw error
    }
  }

  /**
   * Mettre à jour le score du participant actuel
   * @param {Object} stats - {today, week, total}
   * @param {boolean} syncAll - Si true, sync tous les groupes (défaut: false pour rétrocompatibilité)
   */
  async updateMyScore(stats, syncAll = false) {
    if (syncAll && this.groups.size > 0) {
      // NOUVEAU: Synchroniser TOUS les groupes
      console.log(`🔄 Sync ${this.groups.size} groupes...`)
      const promises = []

      for (const [groupId, groupData] of this.groups) {
        promises.push(
          this.provider.updateScore(groupId, groupData.participantId, stats)
            .then(() => {
              groupData.lastSync = new Date().toISOString()
              console.log(`✅ Sync ${groupData.name}`)
            })
            .catch(error => {
              console.error(`❌ Erreur sync ${groupData.name}:`, error)
            })
        )
      }

      await Promise.all(promises)
      this.saveGroup() // Sauvegarder les lastSync
      return
    }

    // Mode legacy: sync seulement le groupe actif
    if (!this.activeGroupId) {
      console.warn('Pas de groupe actif')
      return
    }

    const activeGroup = this.groups.get(this.activeGroupId)
    if (!activeGroup) {
      console.warn('Groupe actif introuvable')
      return
    }

    try {
      await this.provider.updateScore(
        activeGroup.groupId,
        activeGroup.participantId,
        stats
      )
      activeGroup.lastSync = new Date().toISOString()
      this.saveGroup()
    } catch (error) {
      console.error('Erreur mise à jour score:', error)
    }
  }

  /**
   * Récupérer le classement actuel
   * @param {string} groupId - ID du groupe (optionnel, utilise le groupe actif par défaut)
   * @returns {Promise<Array>}
   */
  async getLeaderboard(groupId = null) {
    const targetGroupId = groupId || this.activeGroupId

    if (!targetGroupId) {
      throw new Error('Pas de groupe actif')
    }

    try {
      return await this.provider.getLeaderboard(targetGroupId)
    } catch (error) {
      console.error('Erreur récupération classement:', error)
      throw error
    }
  }

  /**
   * Changer de groupe actif sans supprimer le participant
   * @param {string} groupId - ID du groupe à activer
   */
  switchActiveGroup(groupId) {
    if (!this.groups.has(groupId)) {
      console.error('Groupe introuvable:', groupId)
      return false
    }

    // Se désabonner du groupe actuel
    if (this.activeGroupId) {
      this.unsubscribeFromUpdates()
    }

    // Activer le nouveau groupe
    this.activeGroupId = groupId
    this._updateLegacyProperties()
    this.saveGroup()

    // S'abonner aux mises à jour du nouveau groupe
    this.subscribeToUpdates()

    console.log(`✅ Groupe actif changé: ${this.groups.get(groupId).name}`)
    return true
  }

  /**
   * LEGACY: Déconnecter sans supprimer (pour rétrocompatibilité)
   */
  switchGroup() {
    console.warn('[LEGACY] switchGroup() est déprécié, utilisez switchActiveGroup()')
    // Pour rétrocompatibilité: juste se désabonner
    this.unsubscribeFromUpdates()
  }

  /**
   * Quitter un groupe (supprime le participant de la DB et du Map local)
   * @param {string} groupId - ID du groupe à quitter (optionnel, utilise le groupe actif)
   */
  async leaveGroup(groupId = null) {
    const targetGroupId = groupId || this.activeGroupId

    if (!targetGroupId) {
      console.warn('Pas de groupe à quitter')
      return
    }

    const groupData = this.groups.get(targetGroupId)
    if (!groupData) {
      console.warn('Groupe introuvable')
      return
    }

    try {
      // Supprimer le participant de la DB
      await this.provider.leaveGroup(groupData.groupId, groupData.participantId)

      // Se désabonner si c'était le groupe actif
      if (this.activeGroupId === targetGroupId) {
        this.unsubscribeFromUpdates()
      }

      // Retirer du Map
      this.groups.delete(targetGroupId)

      // Si c'était le groupe actif, choisir un autre ou null
      if (this.activeGroupId === targetGroupId) {
        if (this.groups.size > 0) {
          const firstGroupId = this.groups.keys().next().value
          this.switchActiveGroup(firstGroupId)
        } else {
          this.activeGroupId = null
          this._updateLegacyProperties()
        }
      }

      this.saveGroup()
      console.log(`✅ Quitté le groupe: ${groupData.name}`)

    } catch (error) {
      console.error('Erreur quitter groupe:', error)
      throw error
    }
  }

  /**
   * S'abonner aux mises à jour temps réel
   */
  subscribeToUpdates() {
    if (!this.activeGroupId || !this.provider) return

    this.provider.subscribeToGroup(this.activeGroupId, (payload) => {
      // Déclencher un événement personnalisé pour l'UI
      const event = new CustomEvent('groupUpdate', {
        detail: payload
      })
      window.dispatchEvent(event)
    })
  }

  /**
   * Se désabonner des mises à jour
   */
  unsubscribeFromUpdates() {
    if (this.activeGroupId && this.provider) {
      this.provider.unsubscribeFromGroup(this.activeGroupId)
    }
  }

  /**
   * Sauvegarder l'état des groupes dans localStorage
   */
  saveGroup() {
    try {
      // Convertir Map en objet pour JSON
      const groupsObj = {}
      for (const [groupId, groupData] of this.groups) {
        groupsObj[groupId] = groupData
      }

      const multiGroupData = {
        activeGroupId: this.activeGroupId,
        groups: groupsObj
      }

      localStorage.setItem('multiGroups', JSON.stringify(multiGroupData))

      // LEGACY: Maintenir aussi l'ancien format pour compatibilité
      if (this.activeGroupId) {
        const activeGroup = this.groups.get(this.activeGroupId)
        if (activeGroup) {
          localStorage.setItem('currentGroup', JSON.stringify({
            id: activeGroup.groupId,
            code: activeGroup.code,
            name: activeGroup.name,
            provider: activeGroup.provider
          }))
          localStorage.setItem('currentParticipant', JSON.stringify({
            id: activeGroup.participantId,
            name: activeGroup.participantName
          }))
          localStorage.setItem('isCreator', activeGroup.isCreator.toString())
        }
      }

      console.log(`💾 Sauvegardé ${this.groups.size} groupe(s)`)
    } catch (error) {
      console.error('Erreur sauvegarde groupes:', error)
    }
  }

  /**
   * Charger les groupes sauvegardés (avec migration automatique de l'ancien format)
   */
  loadSavedGroup() {
    try {
      // Essayer de charger le nouveau format multi-groupe
      const multiGroupsData = localStorage.getItem('multiGroups')

      if (multiGroupsData) {
        const parsed = JSON.parse(multiGroupsData)
        this.activeGroupId = parsed.activeGroupId

        // Reconstituer le Map
        this.groups.clear()
        for (const [groupId, groupData] of Object.entries(parsed.groups)) {
          this.groups.set(groupId, groupData)
        }

        console.log(`✅ Chargé ${this.groups.size} groupe(s) depuis multiGroups`)
      } else {
        // MIGRATION: Charger l'ancien format single-group
        const savedGroup = localStorage.getItem('currentGroup')
        const savedParticipant = localStorage.getItem('currentParticipant')
        const savedIsCreator = localStorage.getItem('isCreator')

        if (savedGroup && savedParticipant) {
          const group = JSON.parse(savedGroup)
          const participant = JSON.parse(savedParticipant)
          const isCreator = savedIsCreator === 'true'

          // Migrer vers le nouveau format
          const groupData = {
            groupId: group.id,
            code: group.code,
            name: group.name,
            participantId: participant.id,
            participantName: participant.name,
            isCreator: isCreator,
            provider: group.provider || 'SupabaseProvider',
            lastSync: new Date().toISOString()
          }

          this.groups.set(group.id, groupData)
          this.activeGroupId = group.id

          console.log('🔄 Migration ancien format → multi-groupe')

          // Sauvegarder dans le nouveau format
          this.saveGroup()
        }
      }

      // Mettre à jour les propriétés legacy
      this._updateLegacyProperties()

      // Réabonnement aux mises à jour du groupe actif
      if (this.provider && this.activeGroupId) {
        this.subscribeToUpdates()
      }

    } catch (error) {
      console.error('Erreur chargement groupes:', error)
      this.clearGroup()
    }
  }

  /**
   * Effacer TOUS les groupes
   */
  clearGroup() {
    this.groups.clear()
    this.activeGroupId = null

    // LEGACY
    this.currentGroup = null
    this.currentParticipant = null
    this.isCreator = false

    localStorage.removeItem('multiGroups')
    localStorage.removeItem('currentGroup')
    localStorage.removeItem('currentParticipant')
    localStorage.removeItem('isCreator')
  }

  /**
   * Récupérer les infos du groupe actuel
   * @returns {Object} - {group, participant, isCreator}
   */
  getCurrentGroup() {
    if (!this.activeGroupId) {
      return {
        group: this.currentGroup,
        participant: this.currentParticipant,
        isCreator: this.isCreator
      }
    }

    const activeGroup = this.groups.get(this.activeGroupId)
    if (!activeGroup) {
      return {
        group: null,
        participant: null,
        isCreator: false
      }
    }

    return {
      group: {
        id: activeGroup.groupId,
        code: activeGroup.code,
        name: activeGroup.name,
        provider: activeGroup.provider
      },
      participant: {
        id: activeGroup.participantId,
        name: activeGroup.participantName
      },
      isCreator: activeGroup.isCreator
    }
  }

  /**
   * Récupérer tous les groupes
   * @returns {Array} - Liste des groupes
   */
  getAllGroups() {
    return Array.from(this.groups.values())
  }

  /**
   * Récupérer un groupe spécifique
   * @param {string} groupId - ID du groupe
   * @returns {Object|null}
   */
  getGroup(groupId) {
    return this.groups.get(groupId) || null
  }

  /**
   * Vérifier si un groupe est actif
   */
  hasActiveGroup() {
    return this.activeGroupId !== null && this.groups.has(this.activeGroupId)
  }

  /**
   * NOUVEAU: Mettre à jour les propriétés legacy pour compatibilité
   * @private
   */
  _updateLegacyProperties() {
    if (!this.activeGroupId || !this.groups.has(this.activeGroupId)) {
      this.currentGroup = null
      this.currentParticipant = null
      this.isCreator = false
      return
    }

    const activeGroup = this.groups.get(this.activeGroupId)

    this.currentGroup = {
      id: activeGroup.groupId,
      code: activeGroup.code,
      name: activeGroup.name,
      provider: activeGroup.provider
    }

    this.currentParticipant = {
      id: activeGroup.participantId,
      name: activeGroup.participantName
    }

    this.isCreator = activeGroup.isCreator
  }
}

// Instance singleton
const groupManager = new GroupManager()

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GroupManager
}
