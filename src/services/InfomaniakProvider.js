/**
 * Implémentation Infomaniak (future) du backend de groupe
 *
 * CETTE CLASSE EST UN PLACEHOLDER pour la migration future vers Infomaniak
 * Elle sera complétée quand tu passeras à Jelastic Cloud
 *
 * Architecture prévue:
 * - Node.js + Express sur Jelastic Cloud
 * - PostgreSQL (DBaaS Infomaniak)
 * - Socket.io pour temps réel
 * - API REST endpoints: /groups, /participants, /scores
 */

class InfomaniakProvider extends BackendProvider {
  constructor(apiBaseUrl, apiKey) {
    super()

    this.apiUrl = apiBaseUrl // Ex: https://api-zikirmatik.jelastic.infomaniak.com
    this.apiKey = apiKey
    this.socket = null
  }

  /**
   * Créer un groupe via l'API Infomaniak
   *
   * Requête future:
   * POST /api/groups
   * {
   *   "name": "Groupe Mosquée",
   *   "creator": "Ahmed"
   * }
   */
  async createGroup(groupName, creatorName) {
    try {
      const code = this.generateGroupCode()

      const response = await fetch(`${this.apiUrl}/api/groups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          code: code,
          name: groupName,
          creator: creatorName
        })
      })

      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`)
      }

      const data = await response.json()

      return {
        groupId: data.group.id,
        participantId: data.participant.id,
        code: data.group.code,
        name: data.group.name,
        creatorName: creatorName
      }

    } catch (error) {
      console.error('Erreur création groupe Infomaniak:', error)
      throw new Error(`Impossible de créer le groupe: ${error.message}`)
    }
  }

  /**
   * Rejoindre un groupe via l'API Infomaniak
   *
   * POST /api/groups/{code}/join
   * {
   *   "participantName": "Fatima"
   * }
   */
  async joinGroup(groupCode, participantName) {
    try {
      const response = await fetch(`${this.apiUrl}/api/groups/${groupCode}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          participantName: participantName
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erreur inconnue')
      }

      const data = await response.json()

      return {
        groupId: data.group.id,
        participantId: data.participant.id,
        name: data.group.name,
        code: data.group.code
      }

    } catch (error) {
      console.error('Erreur rejoindre groupe Infomaniak:', error)
      throw new Error(`Impossible de rejoindre le groupe: ${error.message}`)
    }
  }

  /**
   * Mettre à jour le score
   *
   * PUT /api/participants/{participantId}/score
   * {
   *   "today": 450,
   *   "week": 2340,
   *   "total": 12500
   * }
   */
  async updateScore(groupId, participantId, score) {
    try {
      const response = await fetch(`${this.apiUrl}/api/participants/${participantId}/score`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          groupId: groupId,
          today: score.today,
          week: score.week,
          total: score.total
        })
      })

      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`)
      }

    } catch (error) {
      console.error('Erreur mise à jour score Infomaniak:', error)
      throw error
    }
  }

  /**
   * Récupérer le classement
   *
   * GET /api/groups/{groupId}/leaderboard
   */
  async getLeaderboard(groupId) {
    try {
      const response = await fetch(`${this.apiUrl}/api/groups/${groupId}/leaderboard`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      })

      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`)
      }

      const data = await response.json()
      return data.participants

    } catch (error) {
      console.error('Erreur récupération classement Infomaniak:', error)
      throw error
    }
  }

  /**
   * Quitter un groupe
   *
   * DELETE /api/participants/{participantId}
   */
  async leaveGroup(groupId, participantId) {
    try {
      const response = await fetch(`${this.apiUrl}/api/participants/${participantId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({ groupId })
      })

      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`)
      }

    } catch (error) {
      console.error('Erreur quitter groupe Infomaniak:', error)
      throw error
    }
  }

  /**
   * S'abonner aux mises à jour temps réel via Socket.io
   *
   * Connection Socket.io au serveur Infomaniak
   */
  subscribeToGroup(groupId, callback) {
    // Charger Socket.io si pas déjà fait
    if (!window.io) {
      console.error('Socket.io non chargé')
      return
    }

    // Se connecter au serveur Socket.io
    if (!this.socket) {
      this.socket = io(this.apiUrl, {
        auth: {
          token: this.apiKey
        }
      })
    }

    // Rejoindre la room du groupe
    this.socket.emit('join-group', groupId)

    // Écouter les mises à jour
    this.socket.on(`group-${groupId}-update`, (data) => {
      console.log('Mise à jour temps réel Infomaniak:', data)
      callback({
        eventType: data.type, // 'INSERT', 'UPDATE', 'DELETE'
        new: data.participant
      })
    })
  }

  /**
   * Se désabonner des mises à jour
   */
  unsubscribeFromGroup(groupId) {
    if (this.socket) {
      this.socket.emit('leave-group', groupId)
      this.socket.off(`group-${groupId}-update`)
    }
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = InfomaniakProvider
}
