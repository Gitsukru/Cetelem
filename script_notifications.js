/**
 * 🔔 INTÉGRATION NOTIFICATIONS/RAPPELS
 * Interface utilisateur pour le système de notifications
 */

// ============================================
// INITIALISATION
// ============================================

/**
 * Initialiser l'interface notifications au chargement
 */
function initializeNotificationsUI() {
  // Vérifier le statut de permission actuel
  const permission = notificationManager.getPermissionStatus()
  updateNotificationUI(permission)

  // Toujours afficher la liste et le bouton (permet configuration avant permission)
  document.getElementById('remindersList').style.display = 'block'
  document.getElementById('addReminderBtn').style.display = 'block'
  displayReminders()
}

// ============================================
// DEMANDE DE PERMISSION
// ============================================

/**
 * Activer les notifications (demander permission)
 */
async function enableNotifications() {
  const btn = document.getElementById('enableNotificationsBtn')

  // Désactiver le bouton pendant traitement
  btn.disabled = true
  btn.textContent = '⏳ Demande en cours...'

  try {
    const success = await notificationManager.requestPermission()

    if (success) {
      // Permission accordée
      updateNotificationUI('granted')
      notificationManager.startChecking()
      displayReminders()

      // Masquer le bouton activer
      btn.style.display = 'none'
    } else {
      // Permission refusée
      updateNotificationUI('denied')
      btn.disabled = false
      btn.textContent = '🔔 Bildirimleri Etkinleştir'

      // Afficher message d'aide
      alert('⚠️ Bildirimlere izin verilmedi.\n\nLütfen tarayıcı ayarlarından izinleri kontrol edin.')
    }
  } catch (error) {
    console.error('Erreur activation notifications:', error)
    btn.disabled = false
    btn.textContent = '❌ Hata - Tekrar Dene'
  }
}

// ============================================
// MISE À JOUR UI STATUT
// ============================================

/**
 * Mettre à jour l'interface selon le statut de permission
 */
function updateNotificationUI(permission) {
  const statusIcon = document.getElementById('statusIcon')
  const statusTitle = document.getElementById('statusTitle')
  const statusMessage = document.getElementById('statusMessage')
  const reminderStatus = document.querySelector('.reminder-status')

  if (permission === 'granted') {
    // Activé
    statusIcon.textContent = '🔔'
    statusTitle.textContent = 'Bildirimler Aktif ✅'
    statusMessage.textContent = 'Hatırlatmalarınız zamanında size ulaşacak'
    reminderStatus.classList.add('enabled')
  } else if (permission === 'denied') {
    // Refusé
    statusIcon.textContent = '🚫'
    statusTitle.textContent = 'Bildirimler Engellenmiş'
    statusMessage.textContent = 'Hatırlatmaları şimdi ayarlayabilirsiniz. Tarayıcı izni verdiğinde otomatik çalışacaklar.'
    reminderStatus.classList.remove('enabled')
  } else {
    // Par défaut (default)
    statusIcon.textContent = '🔕'
    statusTitle.textContent = 'Bildirimler Kapalı'
    statusMessage.textContent = 'Hatırlatmaları şimdi ayarlayabilirsiniz. Aktifleştirince çalışmaya başlayacaklar.'
    reminderStatus.classList.remove('enabled')
  }

  // ⚡ NOUVEAU: Afficher le toggle son tesbih
  updateTesbihSoundToggle()
}

/**
 * ⚡ NOUVEAU: Mettre à jour le toggle son tesbih
 */
function updateTesbihSoundToggle() {
  let toggleContainer = document.getElementById('tesbihSoundToggle')

  // Créer le toggle s'il n'existe pas
  if (!toggleContainer) {
    toggleContainer = document.createElement('div')
    toggleContainer.id = 'tesbihSoundToggle'
    toggleContainer.className = 'tesbih-sound-toggle'
    toggleContainer.style.cssText = `
      margin-top: 16px;
      padding: 12px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    `

    // Insérer après le statut des notifications
    const reminderStatus = document.querySelector('.reminder-status')
    if (reminderStatus && reminderStatus.parentNode) {
      reminderStatus.parentNode.insertBefore(toggleContainer, reminderStatus.nextSibling)
    }
  }

  // État actuel
  const isEnabled = notificationManager.tesbihSoundEnabled

  // Contenu du toggle
  toggleContainer.innerHTML = `
    <div style="flex: 1;">
      <div style="font-weight: 600; font-size: 13px; color: #1e293b; margin-bottom: 4px;">
        🔊 Tesbih Sesi
      </div>
      <div style="font-size: 11px; color: #64748b;">
        Hatırlatmalarda tesbih sesi çal (5 kez)
      </div>
    </div>
    <label class="reminder-toggle">
      <input type="checkbox" ${isEnabled ? 'checked' : ''} onchange="toggleTesbihSound(this.checked)">
      <span class="toggle-slider"></span>
    </label>
  `
}

/**
 * ⚡ NOUVEAU: Toggle son tesbih
 */
function toggleTesbihSound(enabled) {
  notificationManager.toggleTesbihSound(enabled)
  const status = enabled ? 'açıldı' : 'kapatıldı'
  showToast(`🔊 Tesbih sesi ${status}`)
}

// ============================================
// AFFICHAGE LISTE RAPPELS
// ============================================

/**
 * Afficher tous les rappels
 */
function displayReminders() {
  const container = document.getElementById('remindersList')
  const reminders = notificationManager.getAllReminders()

  if (reminders.length === 0) {
    container.innerHTML = `
      <div class="reminders-empty">
        <div class="empty-icon">⏰</div>
        <p>Henüz hatırlatma eklenmedi</p>
      </div>
    `
    return
  }

  // Trier par heure
  reminders.sort((a, b) => {
    if (a.hour !== b.hour) return a.hour - b.hour
    return a.minute - b.minute
  })

  // Vérifier si notifications autorisées
  const permission = notificationManager.getPermissionStatus()
  const notificationsActive = permission === 'granted'

  // Générer HTML
  container.innerHTML = reminders.map(reminder => {
    const timeStr = `${String(reminder.hour).padStart(2, '0')}:${String(reminder.minute).padStart(2, '0')}`
    const disabledClass = reminder.enabled ? '' : 'disabled'
    const checkedAttr = reminder.enabled ? 'checked' : ''

    // Badge d'état si notifications non autorisées mais rappel activé
    let statusBadge = ''
    if (!notificationsActive && reminder.enabled) {
      statusBadge = '<span class="reminder-badge pending" title="En attente de permission">⏳</span>'
    } else if (notificationsActive && reminder.enabled) {
      statusBadge = '<span class="reminder-badge active" title="Actif">✓</span>'
    }

    return `
      <div class="reminder-item ${disabledClass}">
        <div class="reminder-info">
          <div class="reminder-time">${timeStr} ${statusBadge}</div>
          <p class="reminder-message">${escapeHtml(reminder.message)}</p>
        </div>
        <div class="reminder-actions">
          <label class="reminder-toggle">
            <input type="checkbox" ${checkedAttr} onchange="toggleReminderStatus('${reminder.id}')">
            <span class="toggle-slider"></span>
          </label>
          <button class="reminder-delete" onclick="deleteReminder('${reminder.id}')" title="Sil">
            🗑️
          </button>
        </div>
      </div>
    `
  }).join('')
}

// ============================================
// MODAL AJOUT RAPPEL
// ============================================

/**
 * Afficher le modal d'ajout de rappel
 */
function showAddReminderModal() {
  const modal = document.createElement('div')
  modal.className = 'modal-overlay'
  modal.id = 'addReminderModal'

  // Heure et minute par défaut (maintenant + 1h)
  const now = new Date()
  const defaultHour = (now.getHours() + 1) % 24
  const defaultMinute = 0

  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>🔔 Yeni Hatırlatma</h3>
        <button class="modal-close" onclick="closeAddReminderModal()">×</button>
      </div>

      <div class="form-group">
        <label>⏰ Zaman</label>
        <div class="time-inputs">
          <select id="reminderHour">
            ${Array.from({length: 24}, (_, i) => {
              const selected = i === defaultHour ? 'selected' : ''
              return `<option value="${i}" ${selected}>${String(i).padStart(2, '0')}</option>`
            }).join('')}
          </select>
          <span class="time-separator">:</span>
          <select id="reminderMinute">
            ${Array.from({length: 60}, (_, i) => {
              const selected = i === defaultMinute ? 'selected' : ''
              return `<option value="${i}" ${selected}>${String(i).padStart(2, '0')}</option>`
            }).join('')}
          </select>
        </div>
      </div>

      <div class="form-group">
        <label>💬 Mesaj</label>
        <textarea id="reminderMessage" placeholder="Örnek: Sabah zikri zamanı 🤲" maxlength="100">Zikir zamanı! 🤲</textarea>
        <small>Maksimum 100 karakter</small>
      </div>

      <div class="modal-actions">
        <button class="modal-btn modal-btn-cancel" onclick="closeAddReminderModal()">
          İptal
        </button>
        <button class="modal-btn modal-btn-save" onclick="saveNewReminder()">
          💾 Kaydet
        </button>
      </div>
    </div>
  `

  document.body.appendChild(modal)

  // Fermer au clic sur overlay
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeAddReminderModal()
    }
  })
}

/**
 * Fermer le modal d'ajout
 */
function closeAddReminderModal() {
  const modal = document.getElementById('addReminderModal')
  if (modal) {
    modal.remove()
  }
}

/**
 * Sauvegarder le nouveau rappel
 */
function saveNewReminder() {
  const hour = parseInt(document.getElementById('reminderHour').value)
  const minute = parseInt(document.getElementById('reminderMinute').value)
  const message = document.getElementById('reminderMessage').value.trim()

  // Validation
  if (!message) {
    alert('⚠️ Lütfen bir mesaj girin')
    return
  }

  // Ajouter le rappel
  notificationManager.addReminder(hour, minute, message, true)

  // Rafraîchir l'affichage
  displayReminders()

  // Fermer le modal
  closeAddReminderModal()

  // Feedback visuel
  showToast('✅ Hatırlatma eklendi!')
}

// ============================================
// ACTIONS SUR RAPPELS
// ============================================

/**
 * Basculer l'état activé/désactivé d'un rappel
 */
function toggleReminderStatus(reminderId) {
  const enabled = notificationManager.toggleReminder(reminderId)
  displayReminders()

  const status = enabled ? 'aktif' : 'devre dışı'
  showToast(`🔄 Hatırlatma ${status}`)
}

/**
 * Supprimer un rappel
 */
function deleteReminder(reminderId) {
  // Confirmation
  if (!confirm('🗑️ Bu hatırlatmayı silmek istediğinizden emin misiniz?')) {
    return
  }

  notificationManager.removeReminder(reminderId)
  displayReminders()
  showToast('🗑️ Hatırlatma silindi')
}

// ============================================
// UTILITAIRES
// ============================================

/**
 * Escape HTML pour prévenir XSS
 */
function escapeHtml(text) {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

/**
 * Afficher un toast de notification
 */
function showToast(message) {
  // Vérifier si toast existe déjà
  let toast = document.getElementById('notificationToast')
  if (!toast) {
    toast = document.createElement('div')
    toast.id = 'notificationToast'
    toast.style.cssText = `
      position: fixed;
      bottom: 80px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.85);
      color: white;
      padding: 12px 24px;
      border-radius: 25px;
      font-size: 14px;
      font-weight: 600;
      z-index: 10001;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      animation: slideUpFade 0.3s ease;
      pointer-events: none;
    `
    document.body.appendChild(toast)
  }

  toast.textContent = message
  toast.style.display = 'block'

  // Masquer après 3 secondes
  setTimeout(() => {
    toast.style.display = 'none'
  }, 3000)
}

// ============================================
// AUTO-INITIALISATION
// ============================================

// Initialiser l'UI dès que le DOM est chargé
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeNotificationsUI)
} else {
  initializeNotificationsUI()
}
