/**
 * Interface de groupe utilisant le nouveau système GroupManager
 * Compatible Supabase (actuel) et Infomaniak (futur)
 */

// Show create group section
function createGroup() {
  // Si déjà dans un groupe, demander confirmation
  if (groupManager && groupManager.hasActiveGroup()) {
    const groupInfo = groupManager.getCurrentGroup()
    showCustomConfirm(
      'Grup Değiştir',
      `Şu anda "${groupInfo.group.name}" grubundasınız. Yeni grup oluşturmak için bu gruptan geçici olarak ayrılacaksınız (verileriniz korunur). Devam edilsin mi?`,
      function() {
        groupManager.switchGroup() // Juste changer sans supprimer
        showCreateForm()
      }
    )
  } else {
    showCreateForm()
  }
}

function showCreateForm() {
  document.getElementById('createSection').style.display = 'block'
  document.getElementById('joinSection').style.display = 'none'
  document.getElementById('groupStatus').style.display = 'none'
  document.getElementById('leaderboard').style.display = 'none'
}

// Show join group section
function showJoinForm() {
  // Si déjà dans un groupe, demander confirmation
  if (groupManager && groupManager.hasActiveGroup()) {
    const groupInfo = groupManager.getCurrentGroup()
    showCustomConfirm(
      'Grup Değiştir',
      `Şu anda "${groupInfo.group.name}" grubundasınız. Başka bir gruba katılmak için bu gruptan geçici olarak ayrılacaksınız (verileriniz korunur). Devam edilsin mi?`,
      function() {
        groupManager.switchGroup() // Juste changer sans supprimer
        showJoinFormUI()
      }
    )
  } else {
    showJoinFormUI()
  }
}

function showJoinFormUI() {
  document.getElementById('createSection').style.display = 'none'
  document.getElementById('joinSection').style.display = 'block'
  document.getElementById('groupStatus').style.display = 'none'
  document.getElementById('leaderboard').style.display = 'none'
}

// Create a new group
async function doCreateGroup() {
  const groupName = document.getElementById('groupNameInput').value.trim() || 'Zikir Grubu'
  const creatorName = document.getElementById('creatorNameInput').value.trim()

  if (!creatorName) {
    showCustomAlert('Lütfen adınızı girin!', 'warning', 2500)
    return
  }

  showStatus('Grup oluşturuluyor...', 'Lütfen bekleyin...')

  try {
    const result = await groupManager.createGroup(groupName, creatorName)

    showGroupInterface(result.code)
    saveGroupToHistory(result.code, groupName, true)
    showCustomAlert('Grup başarıyla oluşturuldu!', 'success', 3000)

    // Analytics
    analytics.groupCreated(groupName)

    // Mettre à jour immédiatement avec le score actuel
    const stats = getCurrentUserStats()
    await groupManager.updateMyScore(stats)
    await updateLeaderboard()

  } catch (error) {
    console.error('Erreur création groupe:', error)
    showCustomAlert(`Grup oluşturulamadı!<br>${error.message}`, 'error', 4000)
    hideStatus()
  }
}

// Join an existing group
async function doJoinGroup() {
  const groupCode = document.getElementById('joinCodeInput').value.trim().toUpperCase()
  const participantName = document.getElementById('participantNameInput').value.trim()

  if (!groupCode) {
    showCustomAlert('Lütfen grup kodunu girin!', 'warning', 2500)
    return
  }

  if (!participantName) {
    showCustomAlert('Lütfen adınızı girin!', 'warning', 2500)
    return
  }

  showStatus('Grup aranıyor...', 'Kod kontrol ediliyor...')

  try {
    const result = await groupManager.joinGroup(groupCode, participantName)

    showGroupInterface(result.code)
    saveGroupToHistory(result.code, result.name, false)
    showCustomAlert(`"${result.name}" grubuna katıldınız!`, 'success', 3000)

    // Analytics
    analytics.groupJoined(result.code)

    // Mettre à jour immédiatement avec le score actuel
    const stats = getCurrentUserStats()
    await groupManager.updateMyScore(stats)
    await updateLeaderboard()

  } catch (error) {
    console.error('Erreur rejoindre groupe:', error)
    showCustomAlert(`Gruba katılamadı!<br>${error.message}`, 'error', 4000)
    hideStatus()
  }
}

// Show group interface
function showGroupInterface(code) {
  document.getElementById('createSection').style.display = 'none'
  document.getElementById('joinSection').style.display = 'none'
  document.getElementById('groupStatus').style.display = 'block'
  document.getElementById('leaderboard').style.display = 'block'

  const groupInfo = groupManager.getCurrentGroup()

  if (groupInfo.isCreator) {
    document.getElementById('statusTitle').textContent = 'Grup Yöneticisi'
    document.getElementById('statusMessage').textContent = `${groupInfo.group.name} grubunu yönetiyorsunuz`
  } else {
    document.getElementById('statusTitle').textContent = 'Grup Üyesi'
    document.getElementById('statusMessage').textContent = `${groupInfo.group.name} grubundasınız`
  }

  // Afficher le code pour tout le monde (créateur et membres)
  const codeShareEl = document.getElementById('codeShare')
  if (codeShareEl) codeShareEl.style.display = 'flex'

  const displayCodeEl = document.getElementById('displayCode')
  if (displayCodeEl) displayCodeEl.textContent = code
}

// Show status message
function showStatus(title, message) {
  document.getElementById('createSection').style.display = 'none'
  document.getElementById('joinSection').style.display = 'none'
  document.getElementById('groupStatus').style.display = 'block'
  document.getElementById('leaderboard').style.display = 'none'
  document.getElementById('statusTitle').textContent = title
  document.getElementById('statusMessage').textContent = message
  document.getElementById('codeShare').style.display = 'none'
}

// Hide status
function hideStatus() {
  document.getElementById('groupStatus').style.display = 'none'
}

// Update leaderboard
async function updateLeaderboard() {
  if (!groupManager.hasActiveGroup()) {
    console.log('Pas de groupe actif')
    return
  }

  try {
    const leaderboard = await groupManager.getLeaderboard()
    displayLeaderboard(leaderboard)
  } catch (error) {
    console.error('Erreur récupération classement:', error)
  }
}

// Display leaderboard
function displayLeaderboard(participants) {
  const container = document.getElementById('leaderboardContent')
  const groupInfo = groupManager.getCurrentGroup()

  if (!container) return

  if (participants.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: #666;">Henüz katılımcı yok</p>'
    return
  }

  let html = '<div class="leaderboard-list">'

  participants.forEach((participant, index) => {
    const isMe = groupInfo.participant && participant.id === groupInfo.participant.id
    const position = index + 1
    let medal = ''

    if (position === 1) medal = '#1'
    else if (position === 2) medal = '#2'
    else if (position === 3) medal = '#3'
    else medal = `#${position}`

    html += `
      <div class="participant-card ${isMe ? 'my-card' : ''}">
        <!-- Header horizontal avec toggle -->
        <div class="participant-header">
          <span class="expand-toggle" id="expand-${participant.id}" onclick="toggleParticipantDetails('${participant.id}')">▶</span>
          <div class="rank-badge rank-${position <= 3 ? position : 'other'}">${medal}</div>
          <div class="participant-name" onclick="toggleParticipantDetails('${participant.id}')">
            ${participant.name}${isMe ? ' <span class="you-badge">Sen</span>' : ''}
          </div>
          <div class="participant-stats-inline" onclick="toggleParticipantDetails('${participant.id}')">
            <span class="stat-inline"><span class="stat-label">Bugün:</span> ${participant.todayCount}</span>
            <span class="stat-inline"><span class="stat-label">Hafta:</span> ${participant.weekCount}</span>
            <span class="stat-inline"><span class="stat-label">Ay:</span> ${participant.monthCount || 0}</span>
          </div>
          <div class="points-badge" onclick="toggleParticipantDetails('${participant.id}')">${participant.points}<span class="pts-label">pts</span></div>
        </div>

        <!-- Détails dépliables -->
        <div class="participant-detail-stats" id="detail-${participant.id}" style="display: none;">
          <div class="detail-loading">Yükleniyor...</div>
        </div>
      </div>
    `
  })

  html += '</div>'
  container.innerHTML = html
}

// Toggle detailed stats for a participant
async function toggleParticipantDetails(participantId) {
  const detailDiv = document.getElementById(`detail-${participantId}`)
  const expandIcon = document.getElementById(`expand-${participantId}`)

  if (!detailDiv) return

  if (detailDiv.style.display === 'none') {
    // Ouvrir et charger les détails
    detailDiv.style.display = 'block'
    expandIcon.textContent = '▼'
    expandIcon.classList.add('expanded')

    // Charger les statistiques détaillées
    await loadParticipantDetailedStats(participantId, detailDiv)
  } else {
    // Fermer
    detailDiv.style.display = 'none'
    expandIcon.textContent = '▶'
    expandIcon.classList.remove('expanded')
  }
}

// Load detailed stats from localStorage (stored by the participant)
async function loadParticipantDetailedStats(participantId, container) {
  try {
    // Récupérer les métadonnées du participant depuis Supabase
    const { data: participant } = await groupManager.provider.supabase
      .from('participants')
      .select('metadata')
      .eq('id', participantId)
      .single()

    // Les statistiques détaillées sont stockées dans metadata JSON
    const detailedStats = participant?.metadata?.categories || null

    if (!detailedStats || Object.keys(detailedStats).length === 0) {
      container.innerHTML = '<div class="detail-empty">Henüz detaylı istatistik paylaşılmadı</div>'
      return
    }

    // Créer un tableau des catégories
    let html = '<div class="detail-stats-table">'
    html += '<div class="detail-header">Detaylı İstatistikler</div>'
    html += '<table class="stats-breakdown-table">'
    html += '<thead><tr><th>Kategori</th><th>Bugün</th><th>Hafta</th><th>Ay</th><th style="width: 50px;">Not</th></tr></thead>'
    html += '<tbody>'

    const groupInfo = groupManager.getCurrentGroup()
    const groupId = groupInfo?.group?.id

    for (const [category, stats] of Object.entries(detailedStats)) {
      html += `
        <tr>
          <td class="category-name">${category}</td>
          <td class="stat-num">${stats.today || 0}</td>
          <td class="stat-num">${stats.week || 0}</td>
          <td class="stat-num">${stats.month || 0}</td>
          <td style="text-align: center;">
            <button class="note-btn"
              onclick="showGroupCategoryNoteModal('${groupId}', '${participantId}', '${category.replace(/'/g, "\\'")}', event)"
              title="Not ekle/görüntüle">
              Not
            </button>
          </td>
        </tr>
      `
    }

    html += '</tbody></table></div>'
    container.innerHTML = html

  } catch (error) {
    console.error('Erreur chargement détails:', error)
    container.innerHTML = '<div class="detail-error">Yükleme hatası</div>'
  }
}

// Refresh leaderboard manually
function refreshLeaderboard() {
  if (!groupManager.hasActiveGroup()) return

  showCustomAlert('Güncelleniyor...', 'info', 1000)
  updateLeaderboard()
}

// Leave group
function leaveGroup() {
  showCustomConfirm(
    'Gruptan Ayrıl',
    'Gruptan ayrılmak istediğinizden emin misiniz?',
    async function() {
      try {
        await groupManager.leaveGroup()

        // Reset UI
        document.getElementById('createSection').style.display = 'none'
        document.getElementById('joinSection').style.display = 'none'
        document.getElementById('groupStatus').style.display = 'none'
        document.getElementById('leaderboard').style.display = 'none'

        displayGroupHistory()
        showCustomAlert('Gruptan ayrıldınız', 'success', 2000)
      } catch (error) {
        console.error('Erreur quitter groupe:', error)
        showCustomAlert('Hata!', 'error', 2000)
      }
    }
  )
}

// Share group code
function shareCode() {
  const groupInfo = groupManager.getCurrentGroup()

  if (!groupInfo.group) {
    showCustomAlert('Grup bilgisi bulunamadı', 'error', 2000)
    return
  }

  const message = `Çetelem Grup Yarışmasına katıl!\n\nGrup: ${groupInfo.group.name}\nKod: ${groupInfo.group.code}\n\nÇetelem uygulamasını aç\n"Grup" sekmesinde "Gruba Katıl"\nKodu gir: ${groupInfo.group.code}`

  if (navigator.share) {
    navigator.share({
      title: 'Çetelem Grup Kodu',
      text: message
    }).catch(console.error)
  } else if (navigator.clipboard) {
    navigator.clipboard.writeText(message).then(() => {
      showCustomAlert('Grup kodu panoya kopyalandı!<br>WhatsApp\'ta paylaşabilirsiniz', 'success', 4000)
    }).catch(() => {
      showCustomAlert('Kopyalama hatası<br>Kod: ' + groupInfo.group.code, 'warning', 4000)
    })
  }
}

// ========================================
// HISTORIQUE DES GROUPES
// ========================================

// Sauvegarder un groupe dans l'historique
function saveGroupToHistory(groupCode, groupName, isCreator) {
  const history = JSON.parse(localStorage.getItem('groupHistory') || '[]')

  // Vérifier si ce groupe existe déjà
  const existingIndex = history.findIndex(item => item.code === groupCode)

  const historyItem = {
    code: groupCode,
    name: groupName,
    isCreator: isCreator,
    lastAccess: new Date().toISOString()
  }

  if (existingIndex >= 0) {
    // Supprimer l'ancien et remettre en premier
    history.splice(existingIndex, 1)
  }

  // Ajouter en premier (max 5 groupes)
  history.unshift(historyItem)
  if (history.length > 5) history.pop()

  localStorage.setItem('groupHistory', JSON.stringify(history))
  displayGroupHistory()
}

// Afficher l'historique des groupes
async function displayGroupHistory() {
  const historyContainer = document.getElementById('groupHistory')
  if (!historyContainer) return

  const history = JSON.parse(localStorage.getItem('groupHistory') || '[]')

  if (history.length === 0) {
    historyContainer.innerHTML = ''
    return
  }

  let html = '<div class="history-title">Önceki Gruplar</div><div class="history-list">'

  for (const item of history) {
    // Vérifier si le groupe existe toujours
    let statusClass = 'inactive'
    let statusText = 'Kapalı'

    try {
      if (groupManager && groupManager.provider && groupManager.provider.supabase) {
        const { data } = await groupManager.provider.supabase
          .from('groups')
          .select('id')
          .eq('code', item.code)
          .single()

        if (data) {
          statusClass = 'active'
          statusText = 'Aktif'
        }
      }
    } catch (e) {
      // Groupe n'existe plus
    }

    const timeAgo = getTimeAgo(item.lastAccess)

    html += `
      <div class="history-item" onclick="rejoinGroup('${item.code}')">
        <div class="history-item-info">
          <div class="history-item-name">${item.name}</div>
          <div class="history-item-meta">${item.isCreator ? 'Yönetici' : 'Üye'} • ${timeAgo}</div>
        </div>
        <div class="history-item-status ${statusClass}">${statusText}</div>
      </div>
    `
  }

  html += '</div>'
  historyContainer.innerHTML = html
}

// Rejoindre un groupe depuis l'historique
async function rejoinGroup(code) {
  try {
    if (!groupManager || !groupManager.provider) {
      showCustomAlert('Backend henüz hazır değil', 'error', 2000)
      return
    }

    // Récupérer les infos du groupe cible
    const { data: groupData, error } = await groupManager.provider.supabase
      .from('groups')
      .select('*')
      .eq('code', code)
      .single()

    if (error || !groupData) {
      showCustomAlert('Bu grup artık mevcut değil', 'error', 3000)
      return
    }

    // Récupérer le nom de l'utilisateur depuis l'historique
    const history = JSON.parse(localStorage.getItem('groupHistory') || '[]')
    const historyItem = history.find(item => item.code === code)

    if (!historyItem) return

    // Si déjà dans un groupe, vérifier si c'est le même
    if (groupManager.hasActiveGroup()) {
      const currentGroup = groupManager.getCurrentGroup()

      // Si c'est le même groupe, ne rien faire
      if (currentGroup.group.code === code) {
        showCustomAlert('Zaten bu grupta bulunuyorsunuz', 'info', 2000)
        return
      }

      // Sinon, demander confirmation pour changer de groupe
      showCustomConfirm(
        'Grup Değiştir',
        `Şu anda "${currentGroup.group.name}" grubundasınız. "${groupData.name}" grubuna geçmek için bu gruptan geçici olarak ayrılacaksınız (verileriniz korunur). Devam edilsin mi?`,
        async function() {
          groupManager.switchGroup() // Juste changer sans supprimer
          await doRejoinGroup(code, groupData, historyItem)
        }
      )
    } else {
      await doRejoinGroup(code, groupData, historyItem)
    }
  } catch (error) {
    console.error('Erreur rejoin:', error)
    showCustomAlert('Hata oluştu', 'error', 2000)
  }
}

// Fonction helper pour rejoindre
async function doRejoinGroup(code, groupData, historyItem) {
  try {
    // Chercher tous les participants du groupe
    const { data: participants } = await groupManager.provider.supabase
      .from('participants')
      .select('*')
      .eq('group_id', groupData.id)

    // Trouver le participant actuel
    let myParticipant = null

    if (historyItem.isCreator) {
      // Si créateur, prendre le premier participant ou en créer un
      myParticipant = participants?.[0]

      // Si aucun participant n'existe, créer un participant pour le créateur
      if (!myParticipant) {
        const creatorName = 'Admin' // Nom par défaut
        const { data: newParticipant, error } = await groupManager.provider.supabase
          .from('participants')
          .insert({
            group_id: groupData.id,
            name: creatorName,
            today_count: 0,
            week_count: 0,
            month_count: 0,
            total_count: 0
          })
          .select()
          .single()

        if (error) {
          console.error('Erreur création participant:', error)
          showCustomAlert('Katılımcı oluşturulamadı', 'error', 3000)
          return
        }
        myParticipant = newParticipant
      }
    } else {
      // Si membre, chercher par nom (approximatif)
      myParticipant = participants?.find(p => p.name) || participants?.[0]

      if (!myParticipant) {
        showCustomAlert('Bu grupta katılımcı bulunamadı', 'error', 3000)
        return
      }
    }

    // Reconnecter au groupe avec le format GroupManager
    groupManager.currentGroup = {
      id: groupData.id,
      code: groupData.code,
      name: groupData.name,
      provider: 'SupabaseProvider'
    }

    groupManager.currentParticipant = {
      id: myParticipant.id,
      name: myParticipant.name
    }

    groupManager.isCreator = historyItem.isCreator

    // Sauvegarder dans localStorage
    localStorage.setItem('currentGroup', JSON.stringify(groupManager.currentGroup))
    localStorage.setItem('currentParticipant', JSON.stringify(groupManager.currentParticipant))
    localStorage.setItem('isCreator', historyItem.isCreator)

    // S'abonner aux mises à jour temps réel
    groupManager.subscribeToUpdates()

    showGroupInterface(code)
    saveGroupToHistory(code, groupData.name, historyItem.isCreator)

    // Mettre à jour le score
    const stats = getCurrentUserStats()
    await groupManager.updateMyScore(stats)

    await updateLeaderboard()

    showCustomAlert('Gruba yeniden katıldınız', 'success', 2000)
  } catch (error) {
    console.error('Erreur doRejoin:', error)
    showCustomAlert('Hata oluştu', 'error', 2000)
  }
}

// Calculer le temps écoulé
function getTimeAgo(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date

  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 60) return `${minutes}dk önce`
  if (hours < 24) return `${hours}s önce`
  return `${days}g önce`
}

// Afficher l'historique au chargement
if (typeof window !== 'undefined') {
  setTimeout(() => displayGroupHistory(), 100)
}

// La restauration du groupe est maintenant gérée dans script.js > initializeBackend()
// Ce code n'est plus nécessaire ici

// ============================================
// NOTES SYSTÈME
// ============================================

// Afficher le modal de notes
async function showNotesModal(participantId, participantName, isMe) {
  const groupInfo = groupManager.getCurrentGroup()
  if (!groupInfo) return

  try {
    // Récupérer les notes actuelles
    const { data: participant, error } = await groupManager.provider.supabase
      .from('participants')
      .select('notes, public_notes')
      .eq('id', participantId)
      .single()

    if (error) throw error

    const personalNotes = participant?.notes || ''
    const publicNotes = participant?.public_notes || ''

    const html = `
      <div class="custom-modal-overlay" id="notesModal">
        <div class="custom-modal" style="max-width: 600px;">
          <div class="modal-header">
            <h3>Notlar - ${participantName}</h3>
            <button class="modal-close" onclick="document.getElementById('notesModal').remove()">✕</button>
          </div>
          <div class="modal-body">
            ${isMe ? `
              <div class="notes-section">
                <label class="notes-label">Kişisel Notlarım (Sadece sen görürsün)</label>
                <textarea id="personalNotes" class="notes-textarea" placeholder="Kişisel notlarınızı buraya yazın...">${personalNotes}</textarea>
              </div>
            ` : ''}
            
            <div class="notes-section" style="margin-top: 16px;">
              <label class="notes-label">${isMe ? 'Herkese Açık Notlarım' : 'Açık Notlar'}</label>
              <textarea id="publicNotes" class="notes-textarea" placeholder="${isMe ? 'Gruba görünecek notlarınızı yazın...' : 'Not yok'}" ${isMe ? '' : 'readonly'}>${publicNotes}</textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" onclick="document.getElementById('notesModal').remove()">İptal</button>
            ${isMe ? `<button class="btn-primary" onclick="saveNotes('${participantId}')">Kaydet</button>` : ''}
          </div>
        </div>
      </div>
    `

    document.body.insertAdjacentHTML('beforeend', html)

    // Auto-expand textareas
    const textareas = document.querySelectorAll('.notes-textarea')
    textareas.forEach(textarea => {
      autoExpandTextarea(textarea)
      textarea.addEventListener('input', () => autoExpandTextarea(textarea))
    })
  } catch (error) {
    console.error('Erreur chargement notes:', error)
    showCustomAlert('Notlar yüklenemedi', 'error', 3000)
  }
}

// Auto-expand textarea
function autoExpandTextarea(textarea) {
  textarea.style.height = 'auto'
  textarea.style.height = Math.max(60, textarea.scrollHeight) + 'px'
}

// Sauvegarder les notes
async function saveNotes(participantId) {
  const personalNotes = document.getElementById('personalNotes')?.value || ''
  const publicNotes = document.getElementById('publicNotes')?.value || ''

  try {
    const { error } = await groupManager.provider.supabase
      .from('participants')
      .update({
        notes: personalNotes,
        public_notes: publicNotes
      })
      .eq('id', participantId)

    if (error) throw error

    document.getElementById('notesModal').remove()
    showCustomAlert('Notlar kaydedildi!', 'success', 3000)

    // Rafraîchir le leaderboard pour mettre à jour l'icône
    await updateLeaderboard()
  } catch (error) {
    console.error('Erreur sauvegarde notes:', error)
    showCustomAlert('Kaydetme hatası', 'error', 3000)
  }
}

// ============================================
// NOTES DE CATÉGORIE (GROUPE)
// ============================================

// Afficher le modal pour ajouter/modifier une note de catégorie
async function showGroupCategoryNoteModal(groupId, participantId, category, event) {
  if (event) event.stopPropagation()

  try {
    // Récupérer toutes les notes existantes pour cette catégorie dans ce groupe
    const { data: notes, error } = await groupManager.provider.supabase
      .from('category_notes')
      .select('*, participants(name)')
      .eq('group_id', groupId)
      .eq('category', category)

    if (error) throw error

    // Trouver la note du participant actuel
    const myNote = notes?.find(n => n.participant_id === participantId)

    // Créer la liste des notes des autres
    const otherNotes = notes?.filter(n => n.participant_id !== participantId) || []

    const html = `
      <div class="custom-modal-overlay" id="categoryNoteModal" onclick="if(event.target === this) this.remove()">
        <div class="custom-modal-content modern-modal">
          <div class="modal-header">
            <h3>${category}</h3>
            <button class="modal-close" onclick="document.getElementById('categoryNoteModal').remove()">✕</button>
          </div>
          <div class="modal-body">
            <!-- Note privée -->
            <div class="notes-section">
              <label class="notes-label">Kişisel Notunuz (Sadece sen görürsün)</label>
              <textarea id="myPrivateCategoryNote" class="notes-textarea"
                placeholder="Kişisel notunuzu buraya yazın..."
                style="min-height: 60px;">${myNote?.private_note || ''}</textarea>
            </div>

            <!-- Note publique -->
            <div class="notes-section" style="margin-top: 16px;">
              <label class="notes-label">Herkese Açık Notunuz</label>
              <textarea id="myPublicCategoryNote" class="notes-textarea"
                placeholder="Gruba görünecek notunuzu yazın..."
                style="min-height: 60px;">${myNote?.note || ''}</textarea>
            </div>

            <!-- Notes des autres participants -->
            ${otherNotes.length > 0 ? `
              <div class="notes-section" style="margin-top: 20px;">
                <label class="notes-label">Diğer Katılımcılar</label>
                <div class="other-notes-list">
                  ${otherNotes.map(note => `
                    <div class="other-note-item">
                      <div class="note-author">${note.participants.name}</div>
                      <div class="note-text">${note.note}</div>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" onclick="document.getElementById('categoryNoteModal').remove()">İptal</button>
            <button class="btn-primary" onclick="saveGroupCategoryNote('${groupId}', '${participantId}', '${category.replace(/'/g, "\\'")}')">Kaydet</button>
          </div>
        </div>
      </div>
    `

    document.body.insertAdjacentHTML('beforeend', html)

    // Auto-expand textareas
    const textareas = [
      document.getElementById('myPrivateCategoryNote'),
      document.getElementById('myPublicCategoryNote')
    ]
    textareas.forEach(textarea => {
      if (textarea) {
        autoExpandTextarea(textarea)
        textarea.addEventListener('input', () => autoExpandTextarea(textarea))
      }
    })
    document.getElementById('myPrivateCategoryNote')?.focus()
  } catch (error) {
    console.error('Erreur chargement notes catégorie:', error)
    showCustomAlert('Notlar yüklenemedi', 'error', 3000)
  }
}

// Sauvegarder une note de catégorie
async function saveGroupCategoryNote(groupId, participantId, category) {
  const privateNote = document.getElementById('myPrivateCategoryNote').value.trim()
  const publicNote = document.getElementById('myPublicCategoryNote').value.trim()

  try {
    if (privateNote || publicNote) {
      // Vérifier si une note existe déjà (sans .single() qui cause 406)
      const { data: existing, error: selectError } = await groupManager.provider.supabase
        .from('category_notes')
        .select('id')
        .eq('group_id', groupId)
        .eq('participant_id', participantId)
        .eq('category', category)
        .maybeSingle()

      if (selectError && selectError.code !== 'PGRST116') {
        throw selectError
      }

      if (existing) {
        // UPDATE si existe
        const { error } = await groupManager.provider.supabase
          .from('category_notes')
          .update({
            private_note: privateNote,
            note: publicNote
          })
          .eq('group_id', groupId)
          .eq('participant_id', participantId)
          .eq('category', category)

        if (error) throw error
      } else {
        // INSERT si n'existe pas
        const { error } = await groupManager.provider.supabase
          .from('category_notes')
          .insert({
            group_id: groupId,
            participant_id: participantId,
            category: category,
            private_note: privateNote,
            note: publicNote
          })

        if (error) throw error
      }
    } else {
      // Supprimer la note si les deux sont vides
      await groupManager.provider.supabase
        .from('category_notes')
        .delete()
        .eq('group_id', groupId)
        .eq('participant_id', participantId)
        .eq('category', category)
    }

    document.getElementById('categoryNoteModal').remove()
    showCustomAlert('Not kaydedildi!', 'success', 2000)
  } catch (error) {
    console.error('Erreur sauvegarde note catégorie:', error)
    showCustomAlert('Kaydetme hatası', 'error', 3000)
  }
}
