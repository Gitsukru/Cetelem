/**
 * 📊 GROUPE UI - Gestion Sub-tabs & Banner
 * Logique d'affichage pour le nouveau layout groupe
 */

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
