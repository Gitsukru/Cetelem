/**
 * Offline Manager - Gère la détection et la sync offline
 */

class OfflineManager {
  constructor() {
    this.isOnline = navigator.onLine
    this.syncQueue = []
    this.listeners = []
    this.setupListeners()
  }

  setupListeners() {
    window.addEventListener('online', () => this.handleOnline())
    window.addEventListener('offline', () => this.handleOffline())
  }

  handleOnline() {
    logger.log('🟢 Connexion rétablie')
    this.isOnline = true
    this.updateUI(true)
    this.processSyncQueue()
    this.notifyListeners('online')
  }

  handleOffline() {
    logger.warn('🔴 Connexion perdue')
    this.isOnline = false
    this.updateUI(false)
    this.notifyListeners('offline')
  }

  updateUI(online) {
    const badge = document.getElementById('offlineBadge')
    if (badge) {
      badge.style.display = online ? 'none' : 'flex'
    }

    // Afficher une notification
    if (online) {
      showCustomAlert('✅ Connexion rétablie', 'success', 2000)
    } else {
      showCustomAlert('📶 Mode hors ligne - Vos données sont sauvegardées localement', 'warning', 4000)
    }
  }

  // Ajouter une action à synchroniser plus tard
  addToQueue(action) {
    this.syncQueue.push({
      action,
      timestamp: Date.now()
    })

    // Sauvegarder dans localStorage au cas où
    localStorage.setItem('syncQueue', JSON.stringify(this.syncQueue))
    logger.log('📝 Action ajoutée à la file de sync:', action)
  }

  // Traiter toutes les actions en attente
  async processSyncQueue() {
    if (this.syncQueue.length === 0) return

    logger.log(`🔄 Synchronisation de ${this.syncQueue.length} actions...`)

    const queue = [...this.syncQueue]
    this.syncQueue = []
    localStorage.removeItem('syncQueue')

    for (const item of queue) {
      try {
        await item.action()
        logger.log('✅ Action synchronisée')
      } catch (error) {
        logger.error('❌ Échec sync action:', error)
        // Remettre en queue si échec
        this.syncQueue.push(item)
      }
    }

    if (this.syncQueue.length > 0) {
      logger.warn(`⚠️ ${this.syncQueue.length} actions non synchronisées`)
      localStorage.setItem('syncQueue', JSON.stringify(this.syncQueue))
    }
  }

  // Charger les actions en attente depuis le dernier offline
  loadQueue() {
    try {
      const saved = localStorage.getItem('syncQueue')
      if (saved) {
        const queue = JSON.parse(saved)
        logger.log(`📥 ${queue.length} actions en attente chargées`)
        // Note: Les fonctions ne peuvent pas être sérialisées
        // On doit gérer ça différemment dans l'implémentation réelle
      }
    } catch (error) {
      logger.error('Erreur chargement queue:', error)
    }
  }

  // S'abonner aux changements de statut
  onStatusChange(callback) {
    this.listeners.push(callback)
  }

  notifyListeners(status) {
    this.listeners.forEach(listener => {
      try {
        listener(status)
      } catch (error) {
        logger.error('Erreur notification listener:', error)
      }
    })
  }

  // Vérifier si on est online
  checkOnline() {
    return this.isOnline
  }
}

// Instance singleton
const offlineManager = new OfflineManager()

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = OfflineManager
}

window.offlineManager = offlineManager
