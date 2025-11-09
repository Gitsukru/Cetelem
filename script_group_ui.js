/**
 * 📊 GROUPE UI - Gestion Sub-tabs & Banner
 * Logique d'affichage pour le nouveau layout groupe
 */

// ============================================
// UTILITAIRES DE GÉNÉRATION HTML
// ============================================

/**
 * Créer une ligne d'information (info-row)
 */
function createInfoRow(label, valueId, valueStyle = '') {
  const row = document.createElement('div');
  row.className = 'info-row';

  const labelSpan = document.createElement('span');
  labelSpan.className = 'info-label';
  labelSpan.textContent = label;

  const valueSpan = document.createElement('span');
  valueSpan.className = 'info-value';
  valueSpan.id = valueId;
  valueSpan.textContent = '-';
  if (valueStyle) valueSpan.style.cssText = valueStyle;

  row.appendChild(labelSpan);
  row.appendChild(valueSpan);

  return row;
}

/**
 * Générer la section Grup Bilgileri
 */
function renderGroupInfoSection() {
  const container = document.getElementById('groupInfoContainer');
  if (!container) return;

  // Vider le container
  container.innerHTML = '';

  // Créer la section
  const section = document.createElement('div');
  section.className = 'settings-section';

  const title = document.createElement('h3');
  title.className = 'settings-title';
  title.textContent = 'Grup Bilgileri';

  const infoDiv = document.createElement('div');
  infoDiv.className = 'settings-info';

  // Définir les lignes d'information
  const infoRows = [
    { label: 'Durum:', id: 'statusTitle', style: '' },
    { label: 'Grup Adı:', id: 'groupNameInfo', style: '' },
    { label: 'Grup Kodu:', id: 'groupCodeInfo', style: 'font-family: monospace; font-weight: 600; letter-spacing: 2px;' },
    { label: 'Üye Sayısı:', id: 'groupMembersCount', style: '' },
    { label: 'Oluşturulma:', id: 'groupCreatedDate', style: '' },
    { label: 'Son Senkron:', id: 'lastSyncTime', style: '' }
  ];

  // Créer et ajouter chaque ligne
  infoRows.forEach(row => {
    infoDiv.appendChild(createInfoRow(row.label, row.id, row.style));
  });

  section.appendChild(title);
  section.appendChild(infoDiv);
  container.appendChild(section);
}

/**
 * Créer un élément de section settings générique
 */
function createSettingsSection(title, contentHTML, className = 'settings-section') {
  const section = document.createElement('div');
  section.className = className;

  const titleEl = document.createElement('h3');
  titleEl.className = 'settings-title';
  titleEl.textContent = title;

  section.appendChild(titleEl);

  if (contentHTML) {
    const contentDiv = document.createElement('div');
    contentDiv.innerHTML = contentHTML;
    section.appendChild(contentDiv);
  }

  return section;
}

/**
 * Créer un bouton avec icône et texte
 */
function createIconButton(icon, text, onClick, className = 'btn-primary') {
  const button = document.createElement('button');
  button.className = className;
  button.onclick = onClick;

  const iconSpan = document.createElement('span');
  iconSpan.className = 'btn-icon';
  iconSpan.textContent = icon;

  const textSpan = document.createElement('span');
  textSpan.className = 'btn-text';
  textSpan.textContent = text;

  button.appendChild(iconSpan);
  button.appendChild(textSpan);

  return button;
}

// ============================================
// SUB-TABS NAVIGATION
// ============================================

/**
 * Basculer entre les sub-tabs (Sıralama / Sohbet / Ayarlar)
 */
function switchGroupTab(tabName) {
  // Désactiver tous les tabs
  const tabs = document.querySelectorAll('.group-subtab');
  const panes = document.querySelectorAll('.group-tab-pane');

  tabs.forEach(tab => tab.classList.remove('active'));
  panes.forEach(pane => pane.classList.remove('active'));

  // Activer le tab sélectionné
  const selectedTab = document.querySelector(`[data-tab="${tabName}"]`);
  const selectedPane = document.getElementById(`tab${capitalize(tabName)}`);

  if (selectedTab) selectedTab.classList.add('active');
  if (selectedPane) selectedPane.classList.add('active');

  // Si on bascule vers Chat, scroll vers le bas ET reset badge
  if (tabName === 'chat') {
    setTimeout(() => {
      const messagesContainer = document.getElementById('chatMessages');
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    }, 100);

    // ✅ Reset le badge de messages non lus
    if (typeof resetUnreadBadge === 'function') {
      resetUnreadBadge();
    }
  }

  console.log(`📂 Tab actif: ${tabName}`);
}

/**
 * Helper: Capitaliser la première lettre
 */
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ============================================
// MISE À JOUR INFOS GROUPE
// ============================================

/**
 * Mettre à jour les infos du groupe dans le tab Settings
 */
function updateGroupInfo() {
  const groupInfo = groupManager.getCurrentGroup();
  if (!groupInfo || !groupInfo.group) return;

  // Mettre à jour statusTitle et les nouvelles informations
  const statusTitleEl = document.getElementById('statusTitle');
  const groupNameInfoEl = document.getElementById('groupNameInfo');
  const groupCodeInfoEl = document.getElementById('groupCodeInfo');
  const groupMembersCountEl = document.getElementById('groupMembersCount');
  const groupCreatedDateEl = document.getElementById('groupCreatedDate');
  const lastSyncTimeEl = document.getElementById('lastSyncTime');

  if (statusTitleEl) {
    const isManager = groupInfo.participant?.id === groupInfo.group.manager_id;
    statusTitleEl.textContent = isManager ? '👑 Grup Yöneticisi' : '👤 Grup Üyesi';
  }

  // Nom du groupe
  if (groupNameInfoEl) {
    groupNameInfoEl.textContent = groupInfo.group.name || '-';
  }

  // Code du groupe
  if (groupCodeInfoEl) {
    groupCodeInfoEl.textContent = groupInfo.group.code || '-';
  }

  // Nombre de membres (à récupérer depuis le leaderboard)
  if (groupMembersCountEl) {
    groupManager.provider.getLeaderboard(groupInfo.group.id).then(members => {
      groupMembersCountEl.textContent = `${members.length} üye`;
    }).catch(() => {
      groupMembersCountEl.textContent = '- üye';
    });
  }

  // Date de création
  if (groupCreatedDateEl && groupInfo.group.created_at) {
    const createdDate = new Date(groupInfo.group.created_at);
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    groupCreatedDateEl.textContent = createdDate.toLocaleDateString('tr-TR', options);
  }

  // Dernière synchronisation
  if (lastSyncTimeEl) {
    const updateSyncTime = () => {
      const now = new Date();
      const options = { hour: '2-digit', minute: '2-digit', second: '2-digit' };
      lastSyncTimeEl.textContent = now.toLocaleTimeString('tr-TR', options);
    };

    updateSyncTime();

    // Mettre à jour toutes les 10 secondes (éviter de créer plusieurs intervals)
    if (!window.syncTimeInterval) {
      window.syncTimeInterval = setInterval(updateSyncTime, 10000);
    }
  }

  // Afficher le code si yönetici
  const codeShareEl = document.getElementById('codeShare');
  const displayCodeEl = document.getElementById('displayCode');

  if (groupInfo.participant?.id === groupInfo.group.manager_id) {
    if (codeShareEl) codeShareEl.style.display = 'block';
    if (displayCodeEl) displayCodeEl.textContent = groupInfo.group.code;
  } else {
    if (codeShareEl) codeShareEl.style.display = 'none';
  }

  console.log('✅ Infos groupe mises à jour');
}

// ============================================
// BANNER GROUPE ACTIF
// ============================================

/**
 * Afficher le banner du groupe actif
 */
function showActiveGroupBanner() {
  const groupInfo = groupManager.getCurrentGroup();
  if (!groupInfo || !groupInfo.group) {
    hideActiveGroupBanner();
    return;
  }

  // Mettre à jour les infos du banner
  const bannerGroupName = document.getElementById('bannerGroupName');
  const bannerGroupCode = document.getElementById('bannerGroupCode');
  const bannerUserRole = document.getElementById('bannerUserRole');

  if (bannerGroupName) {
    bannerGroupName.textContent = groupInfo.group.name || 'Grup';
  }

  if (bannerGroupCode) {
    bannerGroupCode.textContent = `Kod: ${groupInfo.group.code}`;
  }

  if (bannerUserRole) {
    const isManager = groupInfo.participant?.id === groupInfo.group.manager_id;
    bannerUserRole.textContent = isManager ? 'Yönetici' : 'Üye';
  }

  // Afficher le banner
  const banner = document.getElementById('activeGroupBanner');
  if (banner) {
    banner.style.display = 'flex';
  }

  console.log('✅ Banner groupe actif affiché');
}

/**
 * Masquer le banner du groupe actif
 */
function hideActiveGroupBanner() {
  const banner = document.getElementById('activeGroupBanner');
  if (banner) {
    banner.style.display = 'none';
  }
}

/**
 * Copier le code du groupe actif
 */
function copyGroupCode() {
  const groupInfo = groupManager.getCurrentGroup();
  if (!groupInfo || !groupInfo.group || !groupInfo.group.code) {
    showCustomAlert('Grup kodu bulunamadı', 'error', 2000);
    return;
  }

  const code = groupInfo.group.code;

  // Copier dans le presse-papier
  navigator.clipboard.writeText(code).then(() => {
    showCustomAlert(`📋 Kod kopyalandı: ${code}`, 'success', 2000);

    // Analytics
    if (typeof window !== 'undefined' && window.analytics?.track) {
      window.analytics.track('Kod kopyalandı', {
        groupId: groupInfo.group.id,
        code: code
      });
    }
  }).catch(err => {
    console.error('Erreur copie code:', err);
    showCustomAlert('Kopyalama başarısız', 'error', 2000);
  });
}

/**
 * Partager le code du groupe actif via Web Share API
 */
function shareGroupCode() {
  const groupInfo = groupManager.getCurrentGroup();
  if (!groupInfo || !groupInfo.group) {
    showCustomAlert('Grup bilgisi bulunamadı', 'error', 2000);
    return;
  }

  const code = groupInfo.group.code;
  const groupName = groupInfo.group.name || 'Grup';
  const shareText = `🕌 "${groupName}" grubuna katıl!\n\nGrup Kodu: ${code}\n\nÇetelem uygulamasında "Grup Yönetimi" > "Gruba Katıl" bölümünden bu kodu kullanarak katılabilirsin.\n\nhttps://cetelem.netlify.app`;

  // Vérifier si Web Share API est disponible
  if (navigator.share) {
    navigator.share({
      title: `${groupName} - Çetelem Grup`,
      text: shareText
    }).then(() => {
      console.log('✅ Code partagé avec succès');

      // Analytics
      if (typeof window !== 'undefined' && window.analytics?.track) {
        window.analytics.track('Kod paylaşıldı', {
          groupId: groupInfo.group.id,
          code: code,
          method: 'web_share_api'
        });
      }
    }).catch(err => {
      // Utilisateur a annulé le partage ou erreur
      if (err.name !== 'AbortError') {
        console.error('Erreur partage:', err);
      }
    });
  } else {
    // Fallback: copier dans le presse-papier
    navigator.clipboard.writeText(shareText).then(() => {
      showCustomAlert('📋 Paylaşım metni kopyalandı!', 'success', 3000);

      // Analytics
      if (typeof window !== 'undefined' && window.analytics?.track) {
        window.analytics.track('Kod paylaşıldı', {
          groupId: groupInfo.group.id,
          code: code,
          method: 'clipboard_fallback'
        });
      }
    }).catch(err => {
      console.error('Erreur copie:', err);
      showCustomAlert('Paylaşım başarısız', 'error', 2000);
    });
  }
}

// ============================================
// AFFICHAGE DES SECTIONS
// ============================================

/**
 * Afficher les sub-tabs quand un groupe est actif
 */
function showGroupTabs() {
  // Masquer les boutons Créer/Rejoindre
  const modeSelection = document.getElementById('modeSelection');
  if (modeSelection) {
    modeSelection.style.display = 'none';
  }

  // Masquer les formulaires
  const createSection = document.getElementById('createSection');
  const joinSection = document.getElementById('joinSection');
  if (createSection) createSection.style.display = 'none';
  if (joinSection) joinSection.style.display = 'none';

  // Masquer le header "no group"
  const noGroupHeader = document.getElementById('noGroupHeader');
  if (noGroupHeader) {
    noGroupHeader.style.display = 'none';
  }

  // Afficher les sub-tabs
  const groupTabs = document.getElementById('groupTabs');
  if (groupTabs) {
    groupTabs.style.display = 'block';
  }

  // Afficher le banner
  showActiveGroupBanner();

  // Mettre à jour les infos du groupe dans tab Settings
  updateGroupInfo();

  // Par défaut, afficher le tab "Sıralama"
  switchGroupTab('ranking');

  console.log('✅ Sub-tabs affichés');
}

/**
 * Masquer les sub-tabs (quand pas de groupe actif)
 */
function hideGroupTabs() {
  // Afficher les boutons Créer/Rejoindre
  const modeSelection = document.getElementById('modeSelection');
  if (modeSelection) {
    modeSelection.style.display = 'flex';
  }

  // Afficher le header "no group"
  const noGroupHeader = document.getElementById('noGroupHeader');
  if (noGroupHeader) {
    noGroupHeader.style.display = 'block';
  }

  // Masquer les formulaires si affichés
  const createSection = document.getElementById('createSection');
  const joinSection = document.getElementById('joinSection');
  if (createSection) createSection.style.display = 'none';
  if (joinSection) joinSection.style.display = 'none';

  // Masquer les sub-tabs
  const groupTabs = document.getElementById('groupTabs');
  if (groupTabs) {
    groupTabs.style.display = 'none';
  }

  // Masquer le banner
  hideActiveGroupBanner();

  console.log('✅ Sub-tabs masqués');
}

// ============================================
// HOOKS D'INTÉGRATION
// ============================================

/**
 * Hook appelé après création/join groupe
 * Remplace l'ancienne logique d'affichage
 */
function onGroupJoined() {
  showGroupTabs();

  // Rafraîchir le leaderboard
  if (typeof refreshLeaderboard === 'function') {
    refreshLeaderboard();
  }

  // Initialiser le chat
  if (typeof initializeChat === 'function') {
    initializeChat();
  }
}

/**
 * Hook appelé après leave groupe
 */
function onGroupLeft() {
  hideGroupTabs();

  // Réinitialiser le chat
  if (typeof resetChat === 'function') {
    resetChat();
  }
}

/**
 * Mettre à jour l'UI du banner (appelé lors de refresh leaderboard)
 */
function updateActiveGroupUI() {
  const groupInfo = groupManager.getCurrentGroup();
  if (groupInfo && groupInfo.group) {
    showActiveGroupBanner();
  } else {
    hideActiveGroupBanner();
  }
}

// ============================================
// INITIALISATION AU CHARGEMENT
// ============================================

/**
 * Vérifier au chargement si un groupe est actif
 */
function initializeGroupUI() {
  // Générer la structure HTML des sections
  renderGroupInfoSection();

  const groupInfo = groupManager.getCurrentGroup();

  if (groupInfo && groupInfo.group) {
    // Groupe actif : afficher les tabs
    showGroupTabs();

    // Initialiser le chat si disponible
    if (typeof initializeChat === 'function') {
      initializeChat();
    }
  } else {
    // Pas de groupe : afficher les boutons Créer/Rejoindre
    hideGroupTabs();
  }

  console.log('✅ Groupe UI initialisé');
}

// Auto-initialiser au chargement
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    // Attendre que groupManager soit disponible
    if (typeof groupManager !== 'undefined') {
      initializeGroupUI();
    } else {
      window.addEventListener('load', initializeGroupUI);
    }
  });
} else {
  if (typeof groupManager !== 'undefined') {
    initializeGroupUI();
  } else {
    window.addEventListener('load', initializeGroupUI);
  }
}
