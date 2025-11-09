/**
 * 🔔 SYSTÈME DE NOTIFICATIONS / RAPPELS
 * Gestion des notifications push navigateur pour rappels quotidiens
 */

class NotificationManager {
  constructor() {
    console.log('🔧 NotificationManager: Initialisation...')
    this.reminders = this.loadReminders()
    this.checkInterval = null
    this.isSupported = 'Notification' in window
    this.permission = this.isSupported ? Notification.permission : 'denied'
    // ⚡ NOUVEAU: Option son tesbih pour les rappels
    this.tesbihSoundEnabled = localStorage.getItem('reminderTesbihSound') !== 'false'

    console.log('🔧 NotificationManager: État initial', {
      isSupported: this.isSupported,
      permission: this.permission,
      tesbihSoundEnabled: this.tesbihSoundEnabled,
      nombreRappels: Object.keys(this.reminders).length,
      rappels: this.reminders
    })
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
   * Afficher une notification IN-APP (visible dans l'application)
   */
  showInAppNotification(title, body) {
    console.log('📱 Affichage notification in-app')

    // Créer l'élément de notification
    const notificationEl = document.createElement('div')
    notificationEl.className = 'in-app-notification'
    notificationEl.innerHTML = `
      <div class="in-app-notification-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
      </div>
      <div class="in-app-notification-content">
        <div class="in-app-notification-title">${this.escapeHtml(title)}</div>
        <div class="in-app-notification-body">${this.escapeHtml(body)}</div>
      </div>
      <button class="in-app-notification-close" onclick="this.parentElement.remove()">✕</button>
    `

    // Ajouter au DOM
    document.body.appendChild(notificationEl)

    // Animation d'entrée
    setTimeout(() => {
      notificationEl.classList.add('show')
    }, 10)

    // Vibration mobile
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200])
    }

    // Auto-fermer après 8 secondes
    setTimeout(() => {
      notificationEl.classList.remove('show')
      setTimeout(() => notificationEl.remove(), 300)
    }, 8000)

    // ⚡ NOUVEAU: Son tesbih (si activé)
    if (this.tesbihSoundEnabled) {
      this.playTesbihSound(5) // Jouer 5 fois
    }
  }

  /**
   * ⚡ NOUVEAU: Jouer le son tesbih N fois
   */
  playTesbihSound(times = 5) {
    console.log(`🔊 Jouer son tesbih ${times}x`)

    let playCount = 0

    const playNext = () => {
      if (playCount >= times) {
        console.log('✅ Son tesbih terminé')
        return
      }

      try {
        const audio = new Audio('./assets/audio/tesbih_variant_1.mp3')
        audio.volume = 0.7

        audio.addEventListener('ended', () => {
          playCount++
          console.log(`🔊 Son ${playCount}/${times} terminé`)
          // Petit délai entre chaque son (200ms)
          setTimeout(playNext, 200)
        })

        audio.addEventListener('error', (e) => {
          console.error('❌ Erreur chargement son tesbih:', e)
        })

        audio.play().catch((err) => {
          console.error('❌ Erreur lecture son tesbih:', err)
        })
      } catch (error) {
        console.error('❌ Erreur création audio tesbih:', error)
      }
    }

    playNext()
  }

  /**
   * ⚡ NOUVEAU: Activer/Désactiver le son tesbih
   */
  toggleTesbihSound(enabled) {
    this.tesbihSoundEnabled = enabled
    localStorage.setItem('reminderTesbihSound', enabled.toString())
    console.log('🔊 Son tesbih rappels:', enabled ? 'ACTIVÉ' : 'DÉSACTIVÉ')
    return this.tesbihSoundEnabled
  }

  /**
   * Escape HTML pour éviter XSS
   */
  escapeHtml(text) {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  /**
   * Envoyer une notification (système + in-app)
   */
  sendNotification(title, body, icon = '/assets/icons/icon-192x192.png') {
    console.log('📤 sendNotification() appelé', { title, body, icon })
    console.log('  - isSupported:', this.isSupported)
    console.log('  - permission:', this.permission)

    // TOUJOURS afficher la notification in-app
    this.showInAppNotification(title, body)

    if (!this.isSupported || this.permission !== 'granted') {
      console.warn('⚠️ Notifications système non autorisées, seule notification in-app affichée')
      return null
    }

    try {
      console.log('🔨 Création de la notification système...')

      const notificationOptions = {
        body: body,
        icon: icon,
        badge: '/assets/icons/favicon-32x32.png',
        vibrate: [200, 100, 200],
        requireInteraction: false,
        tag: 'zikirmatik-reminder',
        renotify: true
      }

      console.log('  - Options:', notificationOptions)

      const notification = new Notification(title, notificationOptions)

      console.log('✅ Notification système créée:', notification)

      notification.onclick = () => {
        console.log('👆 Notification système cliquée')
        window.focus()
        notification.close()
      }

      notification.onshow = () => {
        console.log('👁️ Notification système affichée')
      }

      notification.onerror = (error) => {
        console.error('❌ Erreur notification système:', error)
      }

      notification.onclose = () => {
        console.log('🚪 Notification système fermée')
      }

      // Auto-fermer après 10 secondes
      setTimeout(() => {
        console.log('⏰ Auto-fermeture notification système')
        notification.close()
      }, 10000)

      console.log('✅ sendNotification() terminé avec succès')
      return notification
    } catch (error) {
      console.error('❌ Erreur notification système:', error)
      console.error('  - Type:', error.name)
      console.error('  - Message:', error.message)
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
    console.log('📋 Tous les rappels actuels:', this.reminders)
    console.log('🔔 Rappels actifs:', this.getActiveReminders())

    // Démarrer la vérification si ce n'est pas déjà fait
    if (this.permission === 'granted' && !this.checkInterval) {
      console.log('🚀 Démarrage automatique de la vérification...')
      this.startChecking()
    }

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
    console.log('🚀 startChecking() appelé')
    console.log('  - checkInterval existe déjà ?', !!this.checkInterval)
    console.log('  - permission:', this.permission)
    console.log('  - nombre de rappels:', Object.keys(this.reminders).length)

    if (this.checkInterval) {
      console.log('⚠️ Nettoyage de l\'ancien interval')
      clearInterval(this.checkInterval)
    }

    // Vérifier toutes les 30 secondes
    this.checkInterval = setInterval(() => {
      console.log('⏱️ Timer 30s déclenché - Appel checkReminders()')
      this.checkReminders()
    }, 30000)

    console.log('✅ setInterval créé, ID:', this.checkInterval)

    // Vérifier immédiatement
    console.log('🔍 Vérification immédiate...')
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
    console.log('📂 loadReminders() appelé')
    try {
      const saved = localStorage.getItem('notifications_reminders')
      console.log('  - localStorage raw:', saved)
      if (saved) {
        const parsed = JSON.parse(saved)
        console.log('  - Rappels parsés:', parsed)
        return parsed
      }
    } catch (error) {
      console.error('❌ Erreur chargement rappels:', error)
    }

    // Rappels par défaut (désactivés)
    console.log('  - Utilisation des rappels par défaut (désactivés)')
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

// Fonction de test manuelle (accessible depuis console)
window.testNotifications = function() {
  console.log('🧪 === TEST NOTIFICATIONS ===')
  console.log('1. État du système:')
  console.log('  - isSupported:', notificationManager.isSupported)
  console.log('  - permission:', notificationManager.permission)
  console.log('  - checkInterval actif:', !!notificationManager.checkInterval)
  console.log('')

  console.log('2. Rappels enregistrés:')
  console.log('  - Tous les rappels:', notificationManager.reminders)
  console.log('  - Rappels actifs:', notificationManager.getActiveReminders())
  console.log('')

  console.log('3. Heure actuelle:')
  const now = new Date()
  console.log(`  - ${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`)
  console.log('')

  console.log('4. Test de notification immédiate:')
  if (notificationManager.permission === 'granted') {
    notificationManager.sendNotification('🧪 Test', 'Si vous voyez ceci, les notifications fonctionnent!')
    console.log('  ✅ Notification de test envoyée')
  } else {
    console.log('  ❌ Permission non accordée')
  }
  console.log('')

  console.log('5. Forcer vérification des rappels:')
  notificationManager.checkReminders()
  console.log('  ✅ checkReminders() exécuté')
  console.log('')

  console.log('💡 ASTUCE: Pour tester un rappel dans 2 minutes:')
  const testTime = new Date(Date.now() + 2 * 60 * 1000)
  console.log(`  notificationManager.addReminder(${testTime.getHours()}, ${testTime.getMinutes()}, "Test dans 2 min!", true)`)
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NotificationManager
}
