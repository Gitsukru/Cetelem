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

  // Utilitaire : générer un code de groupe cryptographiquement sécurisé
  generateGroupCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    const codeLength = 8 // Increased from 6 to 8 for better security

    // Use cryptographically secure random number generator
    const randomValues = new Uint32Array(codeLength)
    crypto.getRandomValues(randomValues)

    let code = ''
    for (let i = 0; i < codeLength; i++) {
      code += chars.charAt(randomValues[i] % chars.length)
    }
    return code
  }
}

// Export pour utilisation dans d'autres fichiers
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BackendProvider
}
