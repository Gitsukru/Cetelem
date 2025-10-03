/**
 * Interface de groupe utilisant le nouveau système GroupManager
 * Compatible Supabase (actuel) et Infomaniak (futur)
 */

// Show create group section
function createGroup() {
  document.getElementById('createSection').style.display = 'block'
  document.getElementById('joinSection').style.display = 'none'
  document.getElementById('groupStatus').style.display = 'none'
  document.getElementById('leaderboard').style.display = 'none'
}

// Show join group section
function showJoinForm() {
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
    document.getElementById('statusTitle').textContent = '👑 Grup Yöneticisi'
    document.getElementById('statusMessage').textContent = `${groupInfo.group.name} grubunu yönetiyorsunuz`
    document.getElementById('codeShare').style.display = 'block'
    document.getElementById('displayCode').textContent = code
  } else {
    document.getElementById('statusTitle').textContent = '👥 Grup Üyesi'
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
      <div class="leaderboard-item ${isMe ? 'current-user' : ''}">
        <span class="position">${medal}</span>
        <div class="participant-info">
          <div class="name">${participant.name}${isMe ? ' (Siz)' : ''}</div>
          <div class="details">
            Bugün: ${participant.todayCount} •
            Hafta: ${participant.weekCount} •
            Toplam: ${participant.totalCount}
          </div>
        </div>
        <div class="score">${participant.points} pts</div>
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

// La restauration du groupe est maintenant gérée dans script.js > initializeBackend()
// Ce code n'est plus nécessaire ici
