/**
 * Analytics Helper pour Plausible
 * Wrapper simple pour tracker les événements importants
 */

const Analytics = {
  // Vérifier si Plausible est chargé
  isReady() {
    return typeof window.plausible === 'function'
  },

  // Track un événement personnalisé
  track(eventName, props = {}) {
    if (!this.isReady()) {
      logger.warn('Analytics non disponible (Plausible pas chargé)')
      return
    }

    try {
      window.plausible(eventName, { props })
      logger.log(`📊 Event tracked: ${eventName}`, props)
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
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Analytics
}

window.analytics = Analytics
