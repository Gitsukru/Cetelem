/**
 * Service unifié de gestion des groupes
 * Abstraction qui utilise le provider configuré (Supabase ou Infomaniak)
 */

class GroupManager {
  constructor() {
    this.provider = null
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

    try {
      const result = await this.provider.createGroup(groupName, creatorName)

      this.currentGroup = {
        id: result.groupId,
        code: result.code,
        name: result.name,
        provider: this.provider.constructor.name
      }

      this.currentParticipant = {
        id: result.participantId,
        name: creatorName
      }

      this.isCreator = true

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

    try {
      const result = await this.provider.joinGroup(groupCode, participantName)

      this.currentGroup = {
        id: result.groupId,
        code: result.code,
        name: result.name,
        provider: this.provider.constructor.name
      }

      this.currentParticipant = {
        id: result.participantId,
        name: participantName
      }

      this.isCreator = false

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
   */
  async updateMyScore(stats) {
    if (!this.currentGroup || !this.currentParticipant) {
      console.warn('Pas de groupe actif')
      return
    }

    try {
      await this.provider.updateScore(
        this.currentGroup.id,
        this.currentParticipant.id,
        stats
      )
    } catch (error) {
      console.error('Erreur mise à jour score:', error)
    }
  }

  /**
   * Récupérer le classement actuel
   * @returns {Promise<Array>}
   */
  async getLeaderboard() {
    if (!this.currentGroup) {
      throw new Error('Pas de groupe actif')
    }

    try {
      return await this.provider.getLeaderboard(this.currentGroup.id)
    } catch (error) {
      console.error('Erreur récupération classement:', error)
      throw error
    }
  }

  /**
   * Quitter le groupe actuel
   */
  async leaveGroup() {
    if (!this.currentGroup || !this.currentParticipant) {
      return
    }

    try {
      await this.provider.leaveGroup(
        this.currentGroup.id,
        this.currentParticipant.id
      )

      this.unsubscribeFromUpdates()
      this.clearGroup()

    } catch (error) {
      console.error('Erreur quitter groupe:', error)
      throw error
    }
  }

  /**
   * S'abonner aux mises à jour temps réel
   */
  subscribeToUpdates() {
    if (!this.currentGroup || !this.provider) return

    this.provider.subscribeToGroup(this.currentGroup.id, (payload) => {
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
    if (this.currentGroup && this.provider) {
      this.provider.unsubscribeFromGroup(this.currentGroup.id)
    }
  }

  /**
   * Sauvegarder l'état du groupe dans localStorage
   */
  saveGroup() {
    localStorage.setItem('currentGroup', JSON.stringify(this.currentGroup))
    localStorage.setItem('currentParticipant', JSON.stringify(this.currentParticipant))
    localStorage.setItem('isCreator', this.isCreator.toString())
  }

  /**
   * Charger le groupe sauvegardé
   */
  loadSavedGroup() {
    try {
      const savedGroup = localStorage.getItem('currentGroup')
      const savedParticipant = localStorage.getItem('currentParticipant')
      const savedIsCreator = localStorage.getItem('isCreator')

      if (savedGroup && savedParticipant) {
        this.currentGroup = JSON.parse(savedGroup)
        this.currentParticipant = JSON.parse(savedParticipant)
        this.isCreator = savedIsCreator === 'true'

        // Réabonnement aux mises à jour
        if (this.provider) {
          this.subscribeToUpdates()
        }
      }
    } catch (error) {
      console.error('Erreur chargement groupe:', error)
      this.clearGroup()
    }
  }

  /**
   * Effacer le groupe actuel
   */
  clearGroup() {
    this.currentGroup = null
    this.currentParticipant = null
    this.isCreator = false

    localStorage.removeItem('currentGroup')
    localStorage.removeItem('currentParticipant')
    localStorage.removeItem('isCreator')
  }

  /**
   * Récupérer les infos du groupe actuel
   */
  getCurrentGroup() {
    return {
      group: this.currentGroup,
      participant: this.currentParticipant,
      isCreator: this.isCreator
    }
  }

  /**
   * Vérifier si un groupe est actif
   */
  hasActiveGroup() {
    return this.currentGroup !== null
  }
}

// Instance singleton
const groupManager = new GroupManager()

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GroupManager
}
