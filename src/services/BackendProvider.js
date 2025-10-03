/**
 * Interface abstraite pour les backends de groupe
 * Permet de changer de provider (Supabase, Infomaniak, etc.) sans toucher au code métier
 */

class BackendProvider {
  constructor() {
    if (new.target === BackendProvider) {
      throw new Error('BackendProvider est une classe abstraite')
    }
  }

  // Méthodes à implémenter par chaque provider
  async createGroup(groupName, creatorName) {
    throw new Error('Méthode createGroup() non implémentée')
  }

  async joinGroup(groupCode, participantName) {
    throw new Error('Méthode joinGroup() non implémentée')
  }

  async updateScore(groupId, participantId, score) {
    throw new Error('Méthode updateScore() non implémentée')
  }

  async getLeaderboard(groupId) {
    throw new Error('Méthode getLeaderboard() non implémentée')
  }

  async leaveGroup(groupId, participantId) {
    throw new Error('Méthode leaveGroup() non implémentée')
  }

  // Méthode pour s'abonner aux mises à jour temps réel
  subscribeToGroup(groupId, callback) {
    throw new Error('Méthode subscribeToGroup() non implémentée')
  }

  unsubscribeFromGroup(groupId) {
    throw new Error('Méthode unsubscribeFromGroup() non implémentée')
  }

  // Utilitaire : générer un code de groupe
  generateGroupCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let code = ''
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }
}

// Export pour utilisation dans d'autres fichiers
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BackendProvider
}
