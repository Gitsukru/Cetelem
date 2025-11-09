/**
 * Device Backup System
 * Permet de transférer les données entre appareils sans login
 * Via un code temporaire de 6 caractères
 */

const DeviceBackup = {
  // Générer ou récupérer l'identifiant unique de l'appareil
  getDeviceId() {
    let deviceId = localStorage.getItem('deviceId')
    if (!deviceId) {
      // Générer un UUID simple et unique pour cet appareil
      deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11)
      localStorage.setItem('deviceId', deviceId)
      logger.log('🆔 Nouvel ID appareil créé:', deviceId)
    }
    return deviceId
  },

  // Générer un code aléatoire de 6 caractères (lettres + chiffres)
  generateCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Sans I, O, 0, 1 pour éviter confusion
    let code = ''
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  },

  // Sauvegarder les données avec un code
  async createBackup() {
    if (!groupManager || !groupManager.provider || !groupManager.provider.supabase) {
      throw new Error('Bağlantı başlatılıyor, lütfen 5 saniye bekleyip tekrar deneyin')
    }

    try {
      // Préparer les données à sauvegarder - TOUTES les données importantes
      const backupData = {
        // Compteurs et catégories
        counters: counters || {},
        categories: categories || [],

        // Livres et objectifs de livres (TOUJOURS un tableau [])
        books: (() => {
          let booksData = (typeof books !== 'undefined') ? books : JSON.parse(localStorage.getItem('books') || '[]')
          // Garantir que books est un tableau, sinon []
          return Array.isArray(booksData) ? booksData : []
        })(),
        bookGoals: JSON.parse(localStorage.getItem('bookGoals') || '{}'),

        // Métadonnées et objectifs des catégories
        categoryMetadata: (typeof categoryMetadata !== 'undefined') ? categoryMetadata : JSON.parse(localStorage.getItem('categoryMetadata') || '{}'),
        categoryGoals: JSON.parse(localStorage.getItem('categoryGoals') || '{}'),
        goalsAchievedToday: JSON.parse(localStorage.getItem('goalsAchievedToday') || '{}'),

        // ⚡ NOUVEAU: Système multi-groupe
        multiGroups: JSON.parse(localStorage.getItem('multiGroups') || 'null'),

        // Groupe et participant (ancien système - pour compatibilité)
        currentGroup: JSON.parse(localStorage.getItem('currentGroup') || 'null'),
        currentParticipant: JSON.parse(localStorage.getItem('currentParticipant') || 'null'),
        isCreator: localStorage.getItem('isCreator') === 'true',
        groupHistory: JSON.parse(localStorage.getItem('groupHistory') || '[]'),

        // Notifications et rappels
        notifications_reminders: JSON.parse(localStorage.getItem('notifications_reminders') || '[]'),

        // Settings
        settings: {
          soundEnabled: (typeof soundEnabled !== 'undefined') ? soundEnabled : localStorage.getItem('soundEnabled') !== 'false',
          currentCategory: (typeof currentCategory !== 'undefined') ? currentCategory : null,
          lastActiveTab: localStorage.getItem('lastActiveTab') || null,
          lastSelectedCategory: localStorage.getItem('lastSelectedCategory') || null,
        },

        timestamp: new Date().toISOString(),
        version: window.APP_VERSION ? window.APP_VERSION.number : '3.5.1',
        deviceId: this.getDeviceId(), // ID unique de l'appareil source
      }

      // Générer un code unique
      let code = this.generateCode()
      let attempts = 0
      let inserted = false

      while (!inserted && attempts < 10) {
        try {
          const { error } = await groupManager.provider.supabase
            .from('device_backups')
            .insert({
              backup_code: code,
              backup_data: backupData,
            })

          if (error) {
            if (error.code === '23505') {
              // Code déjà utilisé, générer un nouveau
              code = this.generateCode()
              attempts++
              continue
            }
            throw error
          }

          inserted = true
        } catch (err) {
          if (attempts >= 9) throw err
          attempts++
        }
      }

      logger.log('✅ Backup créé avec le code:', code)
      analytics.track('Backup créé', { code })

      return {
        success: true,
        code,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours
      }
    } catch (error) {
      logger.error('Erreur création backup:', error)
      throw error
    }
  },

  // Restaurer les données avec un code
  async restoreBackup(code) {
    if (!groupManager || !groupManager.provider || !groupManager.provider.supabase) {
      throw new Error('Bağlantı başlatılıyor, lütfen 5 saniye bekleyip tekrar deneyin')
    }

    try {
      const { data, error } = await groupManager.provider.supabase
        .from('device_backups')
        .select('*')
        .eq('backup_code', code.toUpperCase())
        .gt('expires_at', new Date().toISOString()) // Pas expiré
        .maybeSingle() // ⚡ FIX: maybeSingle au lieu de single pour éviter 406

      if (error) {
        console.error('Erreur Supabase restore:', error)
        throw new Error('Veritabanı hatası')
      }

      if (!data) {
        throw new Error('Kod geçersiz veya süresi dolmuş')
      }

      // Restaurer les données
      const backupData = data.backup_data

      // ⚠️ VÉRIFICATION : Empêcher la restauration sur le même appareil
      const currentDeviceId = this.getDeviceId()
      if (backupData.deviceId && backupData.deviceId === currentDeviceId) {
        logger.warn('🚫 Tentative de restauration sur le même appareil bloquée')
        analytics.track('Backup restauration bloquée', { reason: 'same_device' })
        throw new Error('SAME_DEVICE')
      }

      // 1. Compteurs et catégories
      if (backupData.counters) {
        counters = backupData.counters
        if (typeof saveCounters === 'function') {
          saveCounters()
        } else {
          localStorage.setItem('counters', JSON.stringify(counters))
        }
      }

      if (backupData.categories) {
        categories = backupData.categories
        if (typeof saveCategories === 'function') {
          saveCategories()
        } else {
          localStorage.setItem('categories', JSON.stringify(categories))
        }
      }

      // 2. Livres et objectifs de livres
      if (backupData.books) {
        // Garantir que books est un tableau, sinon []
        const booksArray = Array.isArray(backupData.books) ? backupData.books : []
        if (typeof books !== 'undefined') {
          books = booksArray
        }
        localStorage.setItem('books', JSON.stringify(booksArray))
      }

      if (backupData.bookGoals) {
        if (typeof bookGoals !== 'undefined') {
          bookGoals = backupData.bookGoals
        }
        localStorage.setItem('bookGoals', JSON.stringify(backupData.bookGoals))
      }

      // 3. Métadonnées et objectifs des catégories
      if (backupData.categoryMetadata) {
        if (typeof categoryMetadata !== 'undefined') {
          categoryMetadata = backupData.categoryMetadata
        }
        localStorage.setItem('categoryMetadata', JSON.stringify(backupData.categoryMetadata))
      }

      if (backupData.categoryGoals) {
        if (typeof categoryGoals !== 'undefined') {
          categoryGoals = backupData.categoryGoals
        }
        localStorage.setItem('categoryGoals', JSON.stringify(backupData.categoryGoals))
      }

      if (backupData.goalsAchievedToday) {
        localStorage.setItem('goalsAchievedToday', JSON.stringify(backupData.goalsAchievedToday))
      }

      // 4. Système multi-groupe (NOUVEAU)
      if (backupData.multiGroups) {
        localStorage.setItem('multiGroups', JSON.stringify(backupData.multiGroups))
        // Recharger le GroupManager avec les nouvelles données
        if (typeof groupManager !== 'undefined' && groupManager.loadSavedGroup) {
          groupManager.loadSavedGroup()
        }
      }

      // 5. Groupe et participant (ancien système - pour compatibilité)
      if (backupData.currentGroup) {
        localStorage.setItem('currentGroup', JSON.stringify(backupData.currentGroup))
      }

      if (backupData.currentParticipant) {
        localStorage.setItem('currentParticipant', JSON.stringify(backupData.currentParticipant))
      }

      if (backupData.isCreator !== undefined) {
        localStorage.setItem('isCreator', backupData.isCreator.toString())
      }

      if (backupData.groupHistory) {
        localStorage.setItem('groupHistory', JSON.stringify(backupData.groupHistory))
      }

      // 6. Notifications et rappels
      if (backupData.notifications_reminders) {
        localStorage.setItem('notifications_reminders', JSON.stringify(backupData.notifications_reminders))
      }

      // 7. Settings
      if (backupData.settings) {
        if (backupData.settings.soundEnabled !== undefined) {
          if (typeof soundEnabled !== 'undefined') {
            soundEnabled = backupData.settings.soundEnabled
          }
          localStorage.setItem('soundEnabled', backupData.settings.soundEnabled ? 'true' : 'false')
        }
        if (backupData.settings.currentCategory) {
          if (typeof currentCategory !== 'undefined') {
            currentCategory = backupData.settings.currentCategory
          }
        }
        if (backupData.settings.lastActiveTab) {
          localStorage.setItem('lastActiveTab', backupData.settings.lastActiveTab)
        }
        if (backupData.settings.lastSelectedCategory) {
          localStorage.setItem('lastSelectedCategory', backupData.settings.lastSelectedCategory)
        }
      }

      // 8. Rafraîchir l'interface
      if (typeof updateCategorySelect === 'function') {
        updateCategorySelect()
      }
      if (typeof updateCategoriesList === 'function') {
        updateCategoriesList()
      }
      if (typeof updateCounterDisplay === 'function') {
        updateCounterDisplay()
      }
      if (typeof updateStats === 'function') {
        updateStats()
      }
      if (typeof loadBooks === 'function') {
        loadBooks()
      }
      if (typeof updateBookDisplay === 'function') {
        updateBookDisplay()
      }
      if (typeof renderBooksManagementList === 'function') {
        renderBooksManagementList()
      }
      if (typeof displayGroupHistory === 'function') {
        displayGroupHistory()
      }
      if (typeof initializeGroupUI === 'function') {
        initializeGroupUI()
      }
      if (typeof renderMultiGroupTabs === 'function') {
        renderMultiGroupTabs()
      }

      logger.log('✅ Données restaurées depuis le backup')
      analytics.track('Backup restauré', { code })

      return {
        success: true,
        timestamp: backupData.timestamp,
      }
    } catch (error) {
      logger.error('Erreur restauration backup:', error)
      throw error
    }
  },

  // Interface UI pour créer un backup
  showCreateBackupDialog() {
    const html = `
      <div class="custom-modal-overlay" id="backupModal">
        <div class="custom-modal">
          <div class="modal-header">
            <h3>📱 Cihaz Yedekleme</h3>
            <button class="modal-close" onclick="document.getElementById('backupModal').remove()">✕</button>
          </div>
          <div class="modal-body">
            <p style="margin-bottom: 16px;">Verilerinizi yeni cihaza aktarmak için bir yedekleme kodu oluşturun.</p>
            <div id="backupResult" style="text-align: center;"></div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" onclick="document.getElementById('backupModal').remove()">İptal</button>
            <button class="btn-primary" onclick="DeviceBackup.executeCreateBackup()">Kod Oluştur</button>
          </div>
        </div>
      </div>
    `
    document.body.insertAdjacentHTML('beforeend', html)
  },

  // Exécuter la création du backup
  async executeCreateBackup() {
    const resultDiv = document.getElementById('backupResult')
    resultDiv.innerHTML = '<p>⏳ Yükleniyor...</p>'

    try {
      const result = await this.createBackup()

      resultDiv.innerHTML = `
        <div style="background: #f0fdf4; border: 2px solid #22c55e; border-radius: 12px; padding: 20px; margin: 16px 0;">
          <div style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #16a34a; font-family: monospace;">
            ${result.code}
          </div>
          <p style="font-size: 14px; color: #15803d; margin-top: 12px;">
            Bu kodu 7 gün içinde yeni cihazınıza girin
          </p>
          <button onclick="navigator.clipboard.writeText('${result.code}')" class="btn-primary" style="margin-top: 12px;">
            📋 Kodu Kopyala
          </button>
        </div>
      `

      showCustomAlert('✅ Yedekleme kodu oluşturuldu!', 'success', 3000)
    } catch (error) {
      resultDiv.innerHTML = `<p style="color: #dc2626;">❌ Hata: ${error.message}</p>`
    }
  },

  // Interface UI pour restaurer un backup
  showRestoreBackupDialog() {
    const html = `
      <div class="custom-modal-overlay" id="restoreModal">
        <div class="custom-modal">
          <div class="modal-header">
            <h3>📲 Veri Geri Yükleme</h3>
            <button class="modal-close" onclick="document.getElementById('restoreModal').remove()">✕</button>
          </div>
          <div class="modal-body">
            <p style="margin-bottom: 16px;">Eski cihazınızdan aldığınız 6 haneli kodu girin:</p>
            <input type="text" id="restoreCode" class="form-input" placeholder="ABC123" maxlength="6"
              style="text-align: center; font-size: 24px; letter-spacing: 4px; text-transform: uppercase; font-family: monospace;">
            <div id="restoreResult" style="margin-top: 16px; text-align: center;"></div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" onclick="document.getElementById('restoreModal').remove()">İptal</button>
            <button class="btn-primary" onclick="DeviceBackup.executeRestoreBackup()">Geri Yükle</button>
          </div>
        </div>
      </div>
    `
    document.body.insertAdjacentHTML('beforeend', html)
    setTimeout(() => document.getElementById('restoreCode').focus(), 100)
  },

  // Exécuter la restauration du backup
  async executeRestoreBackup() {
    const code = document.getElementById('restoreCode').value.trim()
    const resultDiv = document.getElementById('restoreResult')

    if (!code || code.length !== 6) {
      resultDiv.innerHTML = '<p style="color: #dc2626;">⚠️ 6 haneli kod girin</p>'
      return
    }

    resultDiv.innerHTML = '<p>⏳ Yükleniyor...</p>'

    try {
      await this.restoreBackup(code)

      resultDiv.innerHTML = `<p style="color: #16a34a;">✅ Veriler geri yüklendi!</p>`

      setTimeout(() => {
        document.getElementById('restoreModal').remove()
        showCustomAlert('✅ Tüm verileriniz geri yüklendi!', 'success', 4000)
      }, 1500)
    } catch (error) {
      // Gestion spéciale pour la restauration sur le même appareil
      if (error.message === 'SAME_DEVICE') {
        resultDiv.innerHTML = `
          <div style="background: #fef2f2; border: 2px solid #dc2626; border-radius: 8px; padding: 16px; text-align: left;">
            <p style="color: #dc2626; font-weight: 600; margin-bottom: 8px;">⚠️ Aynı Cihaz Hatası</p>
            <p style="color: #7f1d1d; font-size: 13px; line-height: 1.5;">
              Bu kodu <strong>aynı cihazda</strong> kullanamazsınız.<br><br>
              Bu işlem verilerinizi kopyalar ve istatistiklerinizi bozar.<br><br>
              👉 Farklı bir cihazda geri yükleme yapın.
            </p>
          </div>
        `
      } else {
        resultDiv.innerHTML = `<p style="color: #dc2626;">❌ ${error.message}</p>`
      }
    }
  },
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DeviceBackup
}

window.DeviceBackup = DeviceBackup
