/**
 * Quota Monitor - Surveille les limites Supabase & Netlify
 * Affiche des alertes si proche des limites
 */

const QuotaMonitor = {
  // Limites du plan gratuit Supabase
  limits: {
    supabase: {
      dbStorage: 500 * 1024 * 1024, // 500 MB
      bandwidth: 2 * 1024 * 1024 * 1024, // 2 GB/mois
      fileStorage: 1 * 1024 * 1024 * 1024, // 1 GB
    },
    netlify: {
      bandwidth: 100 * 1024 * 1024 * 1024, // 100 GB/mois
    },
  },

  // Vérifier les quotas Supabase (via API)
  async checkSupabaseQuotas() {
    if (!groupManager || !groupManager.provider || !groupManager.provider.supabase) {
      logger.warn('Supabase non initialisé')
      return null
    }

    try {
      // Compter les rows dans les tables principales
      const { count: groupsCount } = await groupManager.provider.supabase
        .from('groups')
        .select('*', { count: 'exact', head: true })

      const { count: participantsCount } = await groupManager.provider.supabase
        .from('participants')
        .select('*', { count: 'exact', head: true })

      const { count: analyticsCount } = await groupManager.provider.supabase
        .from('analytics_events')
        .select('*', { count: 'exact', head: true })
        .then(res => res)
        .catch(() => ({ count: 0 })) // Si la table n'existe pas encore

      // Estimation de la taille (approximative)
      const estimatedDbSize =
        (groupsCount || 0) * 1024 + // ~1 KB par groupe
        (participantsCount || 0) * 512 + // ~0.5 KB par participant
        (analyticsCount || 0) * 256 // ~0.25 KB par event

      const dbUsagePercent = (estimatedDbSize / this.limits.supabase.dbStorage) * 100

      return {
        groups: groupsCount || 0,
        participants: participantsCount || 0,
        analyticsEvents: analyticsCount || 0,
        estimatedDbSize,
        dbUsagePercent: Math.round(dbUsagePercent * 10) / 10,
        limits: this.limits.supabase,
      }
    } catch (error) {
      logger.error('Erreur vérification quotas:', error)
      return null
    }
  },

  // Afficher les stats dans la console
  async showQuotas() {
    const quotas = await this.checkSupabaseQuotas()
    if (!quotas) return

    console.log('📊 === QUOTAS SUPABASE ===')
    console.log(`📦 Groupes: ${quotas.groups}`)
    console.log(`👥 Participants: ${quotas.participants}`)
    console.log(`📈 Events analytics: ${quotas.analyticsEvents}`)
    console.log(`💾 Stockage estimé: ${this.formatBytes(quotas.estimatedDbSize)} / ${this.formatBytes(quotas.limits.dbStorage)}`)
    console.log(`📊 Usage DB: ${quotas.dbUsagePercent}%`)

    // Alerte si > 80%
    if (quotas.dbUsagePercent > 80) {
      console.warn('⚠️ ATTENTION: Plus de 80% du stockage utilisé!')
    }

    return quotas
  },

  // Vérifier automatiquement (à exécuter périodiquement)
  async autoCheck() {
    const quotas = await this.checkSupabaseQuotas()
    if (!quotas) return

    // Alerte si proche des limites
    if (quotas.dbUsagePercent > 90) {
      this.showAlert('critical', `Stockage DB à ${quotas.dbUsagePercent}%! Contactez le support.`)
    } else if (quotas.dbUsagePercent > 75) {
      this.showAlert('warning', `Stockage DB à ${quotas.dbUsagePercent}%. Surveillez l'usage.`)
    }
  },

  // Afficher une alerte visuelle
  showAlert(level, message) {
    const color = level === 'critical' ? '#ef4444' : '#f59e0b'
    const icon = level === 'critical' ? '🚨' : '⚠️'

    console.warn(`${icon} ${message}`)

    // Optionnel: Afficher dans l'UI
    if (typeof showCustomAlert === 'function') {
      showCustomAlert(`${icon} ${message}`, level === 'critical' ? 'error' : 'warning', 5000)
    }
  },

  // Formater les octets en MB/GB
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  },

  // Fonction pour dashboard admin (à appeler depuis la console)
  async dashboard() {
    console.clear()
    console.log('🎯 === DASHBOARD ZIKIRMATIK ===\n')

    const quotas = await this.showQuotas()

    console.log('\n📋 === COMMANDES UTILES ===')
    console.log('QuotaMonitor.showQuotas()     - Afficher les quotas')
    console.log('QuotaMonitor.autoCheck()      - Vérifier les alertes')
    console.log('analytics.showStats()         - Stats analytics')

    return quotas
  },
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = QuotaMonitor
}

window.QuotaMonitor = QuotaMonitor

// Auto-check toutes les heures (si connecté)
setInterval(() => {
  if (groupManager && groupManager.provider && groupManager.provider.supabase) {
    QuotaMonitor.autoCheck()
  }
}, 3600000) // 1 heure
