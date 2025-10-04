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
      '⚠️ Grup Değiştir',
      `Şu anda "${groupInfo.group.name}" grubundasınız. Yeni grup oluşturmak için mevcut gruptan ayrılmanız gerekir. Devam edilsin mi?`,
      async function() {
        await groupManager.leaveGroup()
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
      '⚠️ Grup Değiştir',
      `Şu anda "${groupInfo.group.name}" grubundasınız. Başka bir gruba katılmak için mevcut gruptan ayrılmanız gerekir. Devam edilsin mi?`,
      async function() {
        await groupManager.leaveGroup()
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
    showCustomAlert('⚠️ Lütfen adınızı girin!', 'warning', 2500)
    return
  }

  showStatus('🔄 Grup oluşturuluyor...', 'Lütfen bekleyin...')

  try {
    const result = await groupManager.createGroup(groupName, creatorName)

    showGroupInterface(result.code)
    saveGroupToHistory(result.code, groupName, true)
    showCustomAlert('✅ Grup başarıyla oluşturuldu!', 'success', 3000)

    // Mettre à jour immédiatement avec le score actuel
    const stats = getCurrentUserStats()
    await groupManager.updateMyScore(stats)
    await updateLeaderboard()

  } catch (error) {
    console.error('Erreur création groupe:', error)
    showCustomAlert(`❌ Grup oluşturulamadı!<br>${error.message}`, 'error', 4000)
    hideStatus()
  }
}

// Join an existing group
async function doJoinGroup() {
  const groupCode = document.getElementById('joinCodeInput').value.trim().toUpperCase()
  const participantName = document.getElementById('participantNameInput').value.trim()

  if (!groupCode) {
    showCustomAlert('⚠️ Lütfen grup kodunu girin!', 'warning', 2500)
    return
  }

  if (!participantName) {
    showCustomAlert('⚠️ Lütfen adınızı girin!', 'warning', 2500)
    return
  }

  showStatus('🔍 Grup aranıyor...', 'Kod kontrol ediliyor...')

  try {
    const result = await groupManager.joinGroup(groupCode, participantName)

    showGroupInterface(result.code)
    saveGroupToHistory(result.code, result.name, false)
    showCustomAlert(`✅ "${result.name}" grubuna katıldınız!`, 'success', 3000)

    // Mettre à jour immédiatement avec le score actuel
    const stats = getCurrentUserStats()
    await groupManager.updateMyScore(stats)
    await updateLeaderboard()

  } catch (error) {
    console.error('Erreur rejoindre groupe:', error)
    showCustomAlert(`❌ Gruba katılamadı!<br>${error.message}`, 'error', 4000)
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
    document.getElementById('statusIcon').textContent = '👑'
    document.getElementById('statusTitle').textContent = 'Grup Yöneticisi'
    document.getElementById('statusMessage').textContent = `${groupInfo.group.name} grubunu yönetiyorsunuz`
    document.getElementById('codeShare').style.display = 'block'
    document.getElementById('displayCode').textContent = code
  } else {
    document.getElementById('statusIcon').textContent = '👥'
    document.getElementById('statusTitle').textContent = 'Grup Üyesi'
    document.getElementById('statusMessage').textContent = `${groupInfo.group.name} grubundasınız`
    document.getElementById('codeShare').style.display = 'none'
  }
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

  // Calculer le max pour les barres de progression
  const maxToday = Math.max(...participants.map(p => p.todayCount), 1)

  let html = '<div class="leaderboard-list">'

  participants.forEach((participant, index) => {
    const isMe = groupInfo.participant && participant.id === groupInfo.participant.id
    const position = index + 1
    let medal = ''

    if (position === 1) medal = '🥇'
    else if (position === 2) medal = '🥈'
    else if (position === 3) medal = '🥉'
    else medal = position

    html += `
      <div class="participant-row ${isMe ? 'my-row' : ''}">
        <div class="rank-badge rank-${position <= 3 ? position : 'other'}">${medal}</div>
        <div class="participant-details">
          <div class="participant-name">${participant.name}${isMe ? ' <span class="you-badge">Sen</span>' : ''}</div>
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-label">📅 Bugün</span>
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${(participant.todayCount / maxToday) * 100}%"></div>
                <span class="stat-value">${participant.todayCount}</span>
              </div>
            </div>
            <div class="stat-item">
              <span class="stat-label">📊 Hafta</span>
              <span class="stat-value-small">${participant.weekCount}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">📆 Ay</span>
              <span class="stat-value-small">${participant.monthCount || 0}</span>
            </div>
          </div>
        </div>
        <div class="points-badge">${participant.points}<span class="pts-label">pts</span></div>
      </div>
    `
  })

  html += '</div>'
  container.innerHTML = html
}

// Refresh leaderboard manually
function refreshLeaderboard() {
  if (!groupManager.hasActiveGroup()) return

  showCustomAlert('🔄 Güncelleniyor...', 'info', 1000)
  updateLeaderboard()
}

// Leave group
function leaveGroup() {
  showCustomConfirm(
    '🚪 Gruptan Ayrıl',
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
        showCustomAlert('👋 Gruptan ayrıldınız', 'success', 2000)
      } catch (error) {
        console.error('Erreur quitter groupe:', error)
        showCustomAlert('❌ Hata!', 'error', 2000)
      }
    }
  )
}

// Share group code
function shareCode() {
  const groupInfo = groupManager.getCurrentGroup()

  if (!groupInfo.group) {
    showCustomAlert('❌ Grup bilgisi bulunamadı', 'error', 2000)
    return
  }

  const message = `🕌 Zikirmatik Grup Yarışmasına katıl!\n\nGrup: ${groupInfo.group.name}\nKod: ${groupInfo.group.code}\n\n📱 Zikirmatik uygulamasını aç\n👥 "Grup" sekmesinde "Gruba Katıl"\n🔤 Kodu gir: ${groupInfo.group.code}`

  if (navigator.share) {
    navigator.share({
      title: 'Zikirmatik Grup Kodu',
      text: message
    }).catch(console.error)
  } else if (navigator.clipboard) {
    navigator.clipboard.writeText(message).then(() => {
      showCustomAlert('📋 Grup kodu panoya kopyalandı!<br>WhatsApp\'ta paylaşabilirsiniz', 'success', 4000)
    }).catch(() => {
      showCustomAlert('❌ Kopyalama hatası<br>Kod: ' + groupInfo.group.code, 'warning', 4000)
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
          <div class="history-item-meta">${item.isCreator ? '👑 Yönetici' : '👥 Üye'} • ${timeAgo}</div>
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
      showCustomAlert('❌ Backend henüz hazır değil', 'error', 2000)
      return
    }

    // Récupérer les infos du groupe cible
    const { data: groupData, error } = await groupManager.provider.supabase
      .from('groups')
      .select('*')
      .eq('code', code)
      .single()

    if (error || !groupData) {
      showCustomAlert('❌ Bu grup artık mevcut değil', 'error', 3000)
      return
    }

    // Récupérer le nom de l'utilisateur depuis l'historique
    const history = JSON.parse(localStorage.getItem('groupHistory') || '[]')
    const historyItem = history.find(item => item.code === code)

    if (!historyItem) return

    // Si déjà dans un groupe, demander confirmation
    if (groupManager.hasActiveGroup()) {
      const currentGroup = groupManager.getCurrentGroup()
      showCustomConfirm(
        '⚠️ Grup Değiştir',
        `Şu anda "${currentGroup.group.name}" grubundasınız. "${groupData.name}" grubuna geçmek için mevcut gruptan ayrılmanız gerekir. Devam edilsin mi?`,
        async function() {
          await groupManager.leaveGroup()
          await doRejoinGroup(code, groupData, historyItem)
        }
      )
    } else {
      await doRejoinGroup(code, groupData, historyItem)
    }
  } catch (error) {
    console.error('Erreur rejoin:', error)
    showCustomAlert('❌ Hata oluştu', 'error', 2000)
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

    // Trouver le participant actuel (premier trouvé ou créateur)
    let myParticipant = null

    if (historyItem.isCreator) {
      // Si créateur, prendre le premier participant
      myParticipant = participants?.[0]
    } else {
      // Si membre, chercher par nom (approximatif)
      myParticipant = participants?.find(p => p.name) || participants?.[0]
    }

    // Reconnecter au groupe
    groupManager.currentGroup = {
      group: groupData,
      participant: myParticipant,
      isCreator: historyItem.isCreator
    }

    localStorage.setItem('currentGroup', JSON.stringify(groupManager.currentGroup))

    showGroupInterface(code)
    saveGroupToHistory(code, groupData.name, historyItem.isCreator)

    // Mettre à jour le classement seulement si on a un participant
    if (myParticipant) {
      const stats = getCurrentUserStats()
      await groupManager.updateMyScore(stats)
    }

    await updateLeaderboard()

    showCustomAlert('✅ Gruba yeniden katıldınız', 'success', 2000)
  } catch (error) {
    console.error('Erreur doRejoin:', error)
    showCustomAlert('❌ Hata oluştu', 'error', 2000)
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
