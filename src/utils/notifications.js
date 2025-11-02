/**
 * 🔔 SYSTÈME DE NOTIFICATIONS / RAPPELS
 * Gestion des notifications push navigateur pour rappels quotidiens
 */

class NotificationManager {
  constructor() {
    this.reminders = this.loadReminders()
    this.checkInterval = null
    this.isSupported = 'Notification' in window
    this.permission = this.isSupported ? Notification.permission : 'denied'
  }

  /**
   * Demander la permission notifications
   */
  async requestPermission() {
    if (!this.isSupported) {
      throw new Error('Notifications non supportées par ce navigateur')
    }

    if (this.permission === 'granted') {
      return true
    }

    try {
      const result = await Notification.requestPermission()
      this.permission = result

      if (result === 'granted') {
        console.log('✅ Permission notifications accordée')
        this.showTestNotification()
        return true
      } else {
        console.warn('⚠️ Permission notifications refusée')
        return false
      }
    } catch (error) {
      console.error('❌ Erreur demande permission:', error)
      return false
    }
  }

  /**
   * Afficher notification de test
   */
  showTestNotification() {
    this.sendNotification(
      'Çetelem - Bildirimlər Aktiv! 🎉',
      'Hatırlatmalar başarıyla ayarlandı',
      '/assets/icons/icon-192x192.png'
    )
  }

  /**
   * Envoyer une notification
   */
  sendNotification(title, body, icon = '/assets/icons/icon-192x192.png') {
    if (!this.isSupported || this.permission !== 'granted') {
      console.warn('⚠️ Notifications non autorisées')
      return null
    }

    try {
      const notification = new Notification(title, {
        body: body,
        icon: icon,
        badge: '/assets/icons/favicon-32x32.png',
        vibrate: [200, 100, 200],
        requireInteraction: false,
        tag: 'zikirmatik-reminder',
        renotify: true
      })

      notification.onclick = () => {
        window.focus()
        notification.close()
      }

      // Auto-fermer après 10 secondes
      setTimeout(() => notification.close(), 10000)

      return notification
    } catch (error) {
      console.error('❌ Erreur envoi notification:', error)
      return null
    }
  }

  /**
   * Ajouter un rappel
   */
  addReminder(hour, minute, message, enabled = true) {
    const id = `${hour}:${minute}`

    const reminder = {
      id: id,
      hour: hour,
      minute: minute,
      message: message || 'Zikir zamanı! 🤲',
      enabled: enabled,
      createdAt: new Date().toISOString()
    }

    this.reminders[id] = reminder
    this.saveReminders()

    console.log('✅ Rappel ajouté:', reminder)
    return reminder
  }

  /**
   * Supprimer un rappel
   */
  removeReminder(id) {
    if (this.reminders[id]) {
      delete this.reminders[id]
      this.saveReminders()
      console.log('🗑️ Rappel supprimé:', id)
      return true
    }
    return false
  }

  /**
   * Activer/désactiver un rappel
   */
  toggleReminder(id) {
    if (this.reminders[id]) {
      this.reminders[id].enabled = !this.reminders[id].enabled
      this.saveReminders()
      console.log('🔄 Rappel basculé:', id, this.reminders[id].enabled)
      return this.reminders[id].enabled
    }
    return false
  }

  /**
   * Obtenir tous les rappels
   */
  getAllReminders() {
    return Object.values(this.reminders)
  }

  /**
   * Obtenir rappels actifs
   */
  getActiveReminders() {
    return Object.values(this.reminders).filter(r => r.enabled)
  }

  /**
   * Démarrer la vérification des rappels
   */
  startChecking() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
    }

    // Vérifier toutes les 30 secondes
    this.checkInterval = setInterval(() => {
      this.checkReminders()
    }, 30000)

    // Vérifier immédiatement
    this.checkReminders()

    console.log('⏰ Vérification rappels démarrée (toutes les 30s)')

    // Reprendre la vérification quand l'app revient au premier plan
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.permission === 'granted') {
        console.log('👁️ App visible - Vérification rappels')
        this.checkReminders()
      }
    })
  }

  /**
   * Arrêter la vérification
   */
  stopChecking() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
      console.log('⏹️ Vérification rappels arrêtée')
    }
  }

  /**
   * Vérifier si un rappel doit être déclenché
   */
  checkReminders() {
    if (this.permission !== 'granted') {
      console.log('⚠️ Vérification rappels annulée: permission non granted')
      return
    }

    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()

    const activeReminders = this.getActiveReminders()

    console.log(`⏰ Vérification rappels - ${currentHour}:${String(currentMinute).padStart(2, '0')} - ${activeReminders.length} rappels actifs`)

    activeReminders.forEach(reminder => {
      console.log(`  Rappel: ${reminder.hour}:${String(reminder.minute).padStart(2, '0')} - "${reminder.message}"`)

      if (reminder.hour === currentHour && reminder.minute === currentMinute) {
        // Vérifier si déjà notifié dans les 2 dernières minutes
        const lastNotified = localStorage.getItem(`notified_${reminder.id}`)
        const lastNotifiedTime = lastNotified ? parseInt(lastNotified) : 0
        const timeSinceLastNotif = Date.now() - lastNotifiedTime

        console.log(`  ✓ Correspondance trouvée! Dernier envoi: ${Math.floor(timeSinceLastNotif / 1000)}s`)

        // Ne notifier qu'une fois toutes les 2 minutes (éviter spam)
        if (timeSinceLastNotif > 120000) {
          console.log('🔔 Déclenchement rappel:', reminder)
          this.sendNotification(
            'Çetelem - Hatırlatma ⏰',
            reminder.message,
            '/assets/icons/icon-192x192.png'
          )

          // Enregistrer l'heure de notification
          localStorage.setItem(`notified_${reminder.id}`, Date.now().toString())

          // Analytics (optionnel)
          if (typeof analytics !== 'undefined' && typeof analytics.reminderTriggered === 'function') {
            analytics.reminderTriggered(reminder.id)
          }
        } else {
          console.log(`  ⏸️ Rappel déjà envoyé récemment (attendre ${Math.ceil((120000 - timeSinceLastNotif) / 1000)}s)`)
        }
      }
    })
  }

  /**
   * Sauvegarder les rappels dans localStorage
   */
  saveReminders() {
    try {
      localStorage.setItem('notifications_reminders', JSON.stringify(this.reminders))
    } catch (error) {
      console.error('❌ Erreur sauvegarde rappels:', error)
    }
  }

  /**
   * Charger les rappels depuis localStorage
   */
  loadReminders() {
    try {
      const saved = localStorage.getItem('notifications_reminders')
      if (saved) {
        return JSON.parse(saved)
      }
    } catch (error) {
      console.error('❌ Erreur chargement rappels:', error)
    }

    // Rappels par défaut
    return {
      '9:0': {
        id: '9:0',
        hour: 9,
        minute: 0,
        message: 'Günaydın! Sabah zikri zamanı 🌅',
        enabled: false
      },
      '14:0': {
        id: '14:0',
        hour: 14,
        minute: 0,
        message: 'Öğleden sonra zikri 🤲',
        enabled: false
      },
      '20:0': {
        id: '20:0',
        hour: 20,
        minute: 0,
        message: 'Akşam zikri zamanı 🌙',
        enabled: false
      }
    }
  }

  /**
   * Vérifier si les notifications sont supportées
   */
  isNotificationSupported() {
    return this.isSupported
  }

  /**
   * Obtenir le statut de permission
   */
  getPermissionStatus() {
    return this.permission
  }

  /**
   * Réinitialiser tous les rappels
   */
  resetAllReminders() {
    this.reminders = {}
    this.saveReminders()
    console.log('🔄 Tous les rappels réinitialisés')
  }
}

// Instance globale
const notificationManager = new NotificationManager()

// Démarrer automatiquement si permission accordée
if (notificationManager.getPermissionStatus() === 'granted') {
  notificationManager.startChecking()
  console.log('✅ Notifications actives - Vérification automatique démarrée')
} else {
  console.log('⚠️ Notifications non actives - Permission requise')
}

// Redémarrer si permission accordée ultérieurement
window.addEventListener('focus', () => {
  if (notificationManager.getPermissionStatus() === 'granted' && !notificationManager.checkInterval) {
    console.log('🔄 Redémarrage vérification notifications (focus window)')
    notificationManager.startChecking()
  }
})

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NotificationManager
}
