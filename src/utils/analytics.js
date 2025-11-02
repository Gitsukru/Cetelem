/**
 * Analytics Helper avec Supabase
 * 100% gratuit, tes données à toi !
 */

const Analytics = {
  // Vérifier si Supabase est prêt
  isReady() {
    return !!(groupManager && groupManager.provider && groupManager.provider.supabase)
  },

  // Track un événement dans Supabase
  async track(eventName, props = {}) {
    if (!this.isReady()) {
      logger.warn('Analytics non disponible (Supabase pas prêt)')
      return
    }

    try {
      // Insérer l'événement dans la table analytics_events
      const { error } = await groupManager.provider.supabase
        .from('analytics_events')
        .insert({
          event_name: eventName,
          event_data: props,
          user_agent: navigator.userAgent
        })

      if (error) {
        logger.error('Erreur analytics:', error)
      } else {
        logger.log(`📊 Event tracked: ${eventName}`, props)
      }
    } catch (error) {
      logger.error('Erreur tracking event:', error)
    }
  },

  // Events prédéfinis pour simplifier l'usage

  // Groupe créé
  groupCreated(groupName) {
    this.track('Groupe créé', {
      backend: 'supabase',
      groupName: groupName || 'Sans nom'
    })
  },

  // Groupe rejoint
  groupJoined(groupCode) {
    this.track('Groupe rejoint', {
      backend: 'supabase',
      code: groupCode
    })
  },

  // Groupe quitté
  groupLeft() {
    this.track('Groupe quitté')
  },

  // Zikir compté
  zikirCounted(category, count) {
    // On ne track que toutes les 10 pour éviter de spammer
    if (count % 10 === 0) {
      this.track('Zikir compté', {
        category,
        milestone: count
      })
    }
  },

  // Catégorie ajoutée
  categoryAdded(categoryName) {
    this.track('Catégorie ajoutée', {
      name: categoryName
    })
  },

  // Stats partagées
  statsShared(method) {
    this.track('Stats partagées', {
      method: method // 'SMS', 'WhatsApp', etc.
    })
  },

  // Export de données
  dataExported() {
    this.track('Données exportées')
  },

  // Import de données
  dataImported() {
    this.track('Données importées')
  },

  // Son activé/désactivé
  soundToggled(enabled) {
    this.track('Son togglé', {
      enabled: enabled ? 'oui' : 'non'
    })
  },

  // PWA installée
  pwaInstalled() {
    this.track('PWA installée')
  },

  // Offline détecté
  wentOffline() {
    this.track('Hors ligne')
  },

  // Retour online
  wentOnline() {
    this.track('Retour en ligne')
  },

  // Rappel déclenché
  reminderTriggered(reminderId) {
    this.track('Rappel déclenché', {
      reminderId: reminderId
    })
  },

  // ========================================
  // FONCTIONS UTILITAIRES POUR DASHBOARD
  // ========================================

  // Récupérer le résumé des stats
  async getSummary() {
    if (!this.isReady()) return null

    try {
      const { data, error } = await groupManager.provider.supabase
        .from('analytics_summary')
        .select('*')

      if (error) throw error
      return data
    } catch (error) {
      logger.error('Erreur récupération summary:', error)
      return null
    }
  },

  // Afficher les stats dans la console
  async showStats() {
    const summary = await this.getSummary()
    if (summary) {
      console.table(summary)
    }
  },

  // Récupérer les événements récents
  async getRecentEvents(limit = 50) {
    if (!this.isReady()) return []

    try {
      const { data, error } = await groupManager.provider.supabase
        .from('analytics_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data
    } catch (error) {
      logger.error('Erreur récupération events:', error)
      return []
    }
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Analytics
}

window.analytics = Analytics
