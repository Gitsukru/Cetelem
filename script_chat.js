/**
 * CHAT GROUPE - Logique
 * Gestion des messages en temps réel via Supabase
 */

// Variables globales chat
let chatSubscription = null;
let chatMessages = [];
let isChatCollapsed = false;

// Variables pour éviter doublons listeners
let chatInputInitialized = false;
let chatEnterHandler = null;

// Flag pour empêcher envoi multiple
let isSendingMessage = false;

// Compteur messages non lus
let unreadMessagesCount = 0;

/**
 * Initialiser le chat quand un groupe est actif
 */
function initializeChat() {
  console.log('🔧 Initialisation du chat...');

  // Vérifier qu'un groupe est actif
  const groupInfo = groupManager.getCurrentGroup();
  if (!groupInfo.group) {
    console.warn('⚠️ Pas de groupe actif - Chat non initialisé');
    return;
  }

  // ✅ Nouveau layout : pas besoin d'afficher/masquer #groupChat
  // Le chat est dans un tab et géré par le système sub-tabs

  // Charger les messages existants
  loadChatMessages();

  // S'abonner aux nouveaux messages (Realtime)
  subscribeToChatMessages();

  // Ajouter écouteur sur textarea (UNE SEULE FOIS)
  const input = document.getElementById('chatMessageInput');
  if (input && !chatInputInitialized) {
    // Compteur de caractères
    input.addEventListener('input', updateCharCount);

    // Enter pour envoyer (Shift+Enter pour nouvelle ligne)
    chatEnterHandler = function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendChatMessage();
      }
    };
    input.addEventListener('keydown', chatEnterHandler);

    chatInputInitialized = true;
    console.log('✅ Event listeners chat installés');
  }

  console.log('✅ Chat initialisé');
}

/**
 * Charger les messages existants (50 derniers)
 */
async function loadChatMessages() {
  try {
    const groupInfo = groupManager.getCurrentGroup();
    if (!groupInfo.group) return;

    const { data, error } = await groupManager.provider.supabase
      .from('group_messages')
      .select('*')
      .eq('group_id', groupInfo.group.id)
      .order('created_at', { ascending: true })
      .limit(50);

    if (error) throw error;

    console.log(`📥 ${data.length} messages chargés`);

    // Vider et afficher les messages
    chatMessages = data;
    await displayAllMessages();

  } catch (error) {
    console.error('❌ Erreur chargement messages:', error);
  }
}

/**
 * S'abonner aux nouveaux messages (Realtime)
 */
function subscribeToChatMessages() {
  const groupInfo = groupManager.getCurrentGroup();
  if (!groupInfo.group) return;

  // Se désabonner si déjà abonné
  if (chatSubscription) {
    groupManager.provider.supabase.removeChannel(chatSubscription);
  }

  // S'abonner aux messages de ce groupe
  chatSubscription = groupManager.provider.supabase
    .channel(`chat_${groupInfo.group.id}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'group_messages',
        filter: `group_id=eq.${groupInfo.group.id}`
      },
      (payload) => {
        console.log('💬 Nouveau message reçu:', payload);
        handleNewMessage(payload.new);
      }
    )
    .subscribe();

  console.log('👂 Abonné aux messages temps réel');
}

/**
 * Gérer un nouveau message reçu
 */
function handleNewMessage(message) {
  // Ajouter à la liste si pas déjà présent
  if (!chatMessages.find(m => m.id === message.id)) {
    const container = document.getElementById('chatMessages');

    // Vérifier si on doit ajouter un séparateur de date
    if (container && chatMessages.length > 0) {
      const lastMessage = chatMessages[chatMessages.length - 1];
      const lastDate = new Date(lastMessage.created_at);
      const newDate = new Date(message.created_at);

      const lastDateLabel = getDateLabel(lastDate);
      const newDateLabel = getDateLabel(newDate);

      // Si différent jour, ajouter séparateur
      if (lastDateLabel !== newDateLabel) {
        insertDateSeparator(container, newDateLabel);
      }
    }

    chatMessages.push(message);
    displayMessage(message, true); // true = animer
    scrollToBottom();

    // ✅ Incrémenter badge si pas sur tab chat
    if (!isOnChatTab()) {
      incrementUnreadBadge();
    }
  }
}

/**
 * Afficher tous les messages avec séparateurs de date
 */
async function displayAllMessages() {
  const container = document.getElementById('chatMessages');
  if (!container) return;

  // Vider le container
  container.innerHTML = '';

  if (chatMessages.length === 0) {
    // Vérifier le nombre de participants pour afficher le bon message
    let emptyMessage = '';

    try {
      if (groupManager && groupManager.hasActiveGroup()) {
        const leaderboard = await groupManager.getLeaderboard();
        const participantCount = leaderboard ? leaderboard.length : 0;

        if (participantCount <= 1) {
          // Seul dans le groupe
          emptyMessage = `
            <div class="chat-empty">
              <span class="empty-icon">👥</span>
              <p>Henüz grubunuzda katılımcı yok</p>
              <small>Grup kodunu paylaşarak arkadaşlarınızı davet edin</small>
            </div>
          `;
        } else {
          // Il y a des participants mais pas de messages
          emptyMessage = `
            <div class="chat-empty">
              <span class="empty-icon">💭</span>
              <p>Henüz mesaj yok</p>
              <small>İlk mesajı siz gönderin!</small>
            </div>
          `;
        }
      } else {
        // Pas de groupe actif
        emptyMessage = `
          <div class="chat-empty">
            <span class="empty-icon">💭</span>
            <p>Henüz mesaj yok</p>
            <small>İlk mesajı siz gönderin!</small>
          </div>
        `;
      }
    } catch (error) {
      console.error('Erreur vérification participants:', error);
      // Message par défaut en cas d'erreur
      emptyMessage = `
        <div class="chat-empty">
          <span class="empty-icon">💭</span>
          <p>Henüz mesaj yok</p>
          <small>İlk mesajı siz gönderin!</small>
        </div>
      `;
    }

    container.innerHTML = emptyMessage;
    return;
  }

  // Grouper les messages par date
  let currentDateLabel = null;

  chatMessages.forEach(message => {
    const messageDate = new Date(message.created_at);
    const dateLabel = getDateLabel(messageDate);

    // Si nouvelle date, ajouter un séparateur
    if (dateLabel !== currentDateLabel) {
      insertDateSeparator(container, dateLabel);
      currentDateLabel = dateLabel;
    }

    displayMessage(message, false); // false = pas d'animation
  });

  scrollToBottom();
}

/**
 * Afficher un message
 */
function displayMessage(message, animate = false) {
  const container = document.getElementById('chatMessages');
  if (!container) return;

  // Supprimer le message vide si présent
  const emptyDiv = container.querySelector('.chat-empty');
  if (emptyDiv) {
    emptyDiv.remove();
  }

  const groupInfo = groupManager.getCurrentGroup();
  const isMe = message.participant_id === groupInfo.participant?.id;

  // Formater la date
  const date = new Date(message.created_at);
  const timeStr = formatMessageTime(date);

  // Créer le HTML du message
  const messageDiv = document.createElement('div');
  messageDiv.className = `chat-message ${isMe ? 'me' : 'other'}`;
  if (animate) {
    messageDiv.style.animation = 'slideIn 0.3s ease';
  }

  messageDiv.innerHTML = `
    <div class="message-bubble">
      ${!isMe ? `<div class="message-sender">${escapeHtml(message.participant_name)}</div>` : ''}
      <p class="message-content">${escapeHtml(message.message)}</p>
      <div class="message-time">${timeStr}</div>
    </div>
  `;

  container.appendChild(messageDiv);
}

/**
 * Envoyer un message
 */
async function sendChatMessage() {
  // Empêcher envoi multiple
  if (isSendingMessage) {
    console.warn('⏳ Envoi déjà en cours...');
    return;
  }

  const input = document.getElementById('chatMessageInput');
  if (!input) return;

  const message = input.value.trim();

  // Validation
  if (!message) {
    return;
  }

  if (message.length > 500) {
    if (typeof showCustomAlert === 'function') {
      showCustomAlert('⚠️ Mesaj çok uzun (max 500 karakter)', 'warning', 2000);
    }
    return;
  }

  // Marquer comme en cours d'envoi
  isSendingMessage = true;

  try {
    const groupInfo = groupManager.getCurrentGroup();
    if (!groupInfo.group || !groupInfo.participant) {
      throw new Error('Grup aktif değil');
    }

    // Désactiver le bouton d'envoi
    const sendBtn = document.querySelector('.chat-send-btn');
    if (sendBtn) {
      sendBtn.disabled = true;
    }

    // Insérer le message dans Supabase
    const { data, error } = await groupManager.provider.supabase
      .from('group_messages')
      .insert({
        group_id: groupInfo.group.id,
        participant_id: groupInfo.participant.id,
        participant_name: groupInfo.participant.name,
        message: message
      })
      .select()
      .single();

    if (error) throw error;

    console.log('✅ Message envoyé:', data);

    // Vider l'input
    input.value = '';
    updateCharCount();

    // Le message sera ajouté automatiquement via Realtime

  } catch (error) {
    console.error('❌ Erreur envoi message:', error);
    if (typeof showCustomAlert === 'function') {
      showCustomAlert('❌ Mesaj gönderilemedi', 'error', 2000);
    }
  } finally {
    // Réactiver le bouton et réinitialiser le flag
    const sendBtn = document.querySelector('.chat-send-btn');
    if (sendBtn) {
      sendBtn.disabled = false;
    }
    isSendingMessage = false;
  }
}

/**
 * Basculer l'état du chat (ouvert/fermé)
 */
function toggleChat() {
  const chatBody = document.getElementById('chatBody');
  const toggleIcon = document.getElementById('chatToggleIcon');

  if (!chatBody || !toggleIcon) return;

  isChatCollapsed = !isChatCollapsed;

  if (isChatCollapsed) {
    chatBody.classList.add('collapsed');
    toggleIcon.textContent = '▶';
  } else {
    chatBody.classList.remove('collapsed');
    toggleIcon.textContent = '▼';
    scrollToBottom();
  }
}

/**
 * Mettre à jour le compteur de caractères
 */
function updateCharCount() {
  const input = document.getElementById('chatMessageInput');
  const counter = document.getElementById('chatCharCount');

  if (!input || !counter) return;

  const length = input.value.length;
  counter.textContent = `${length}/500`;

  if (length > 500) {
    counter.classList.add('over-limit');
  } else {
    counter.classList.remove('over-limit');
  }
}

/**
 * Scroller vers le bas des messages
 */
function scrollToBottom() {
  const container = document.getElementById('chatMessages');
  if (!container) return;

  setTimeout(() => {
    container.scrollTop = container.scrollHeight;
  }, 100);
}

/**
 * Formater le temps d'un message
 */
function formatMessageTime(date) {
  const now = new Date();
  const diff = now - date;

  // Moins de 1 minute
  if (diff < 60000) {
    return 'Şimdi';
  }

  // Moins de 1 heure
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes} dk önce`;
  }

  // Aujourd'hui
  if (date.toDateString() === now.toDateString()) {
    return `Bugün ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }

  // Hier
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return `Dün ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }

  // Autre jour
  return `${date.getDate()}/${date.getMonth() + 1} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

/**
 * Obtenir le label de date pour un message
 */
function getDateLabel(date) {
  const now = new Date();

  // Aujourd'hui
  if (date.toDateString() === now.toDateString()) {
    return 'Bugün';
  }

  // Hier
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Dün';
  }

  // Autre jour - format: "25 Ekim 2025"
  const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
                  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

/**
 * Insérer un séparateur de date dans le chat
 */
function insertDateSeparator(container, label) {
  const separator = document.createElement('div');
  separator.className = 'date-separator';
  separator.innerHTML = `<span class="date-label">${label}</span>`;
  container.appendChild(separator);
}

/**
 * Échapper HTML pour sécurité
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Se désabonner du chat
 */
function unsubscribeFromChat() {
  if (chatSubscription) {
    groupManager.provider.supabase.removeChannel(chatSubscription);
    chatSubscription = null;
    console.log('👋 Désabonné du chat');
  }
}

/**
 * Réinitialiser le chat (quand on quitte le groupe)
 */
function resetChat() {
  unsubscribeFromChat();
  chatMessages = [];
  const container = document.getElementById('chatMessages');
  if (container) {
    container.innerHTML = `
      <div class="chat-empty">
        <span class="empty-icon">💭</span>
        <p>Henüz mesaj yok</p>
        <small>İlk mesajı siz gönderin!</small>
      </div>
    `;
  }

  // Reset le badge
  resetUnreadBadge();

  // ✅ Nouveau layout : pas besoin de masquer #groupChat
  // Le chat est dans un tab et géré par hideGroupTabs()
}

// ============================================
// BADGE NOTIFICATIONS (Messages non lus)
// ============================================

/**
 * Vérifier si on est sur le tab chat
 */
function isOnChatTab() {
  const chatTab = document.querySelector('[data-tab="chat"]');
  return chatTab && chatTab.classList.contains('active');
}

/**
 * Incrémenter le badge de messages non lus
 */
function incrementUnreadBadge() {
  unreadMessagesCount++;
  updateChatBadge();
}

/**
 * Reset le badge de messages non lus
 */
function resetUnreadBadge() {
  unreadMessagesCount = 0;
  updateChatBadge();
}

/**
 * Mettre à jour l'affichage du badge
 */
function updateChatBadge() {
  const badge = document.getElementById('chatBadge');
  if (!badge) return;

  if (unreadMessagesCount > 0) {
    badge.textContent = unreadMessagesCount > 99 ? '99+' : unreadMessagesCount;
    badge.style.display = 'flex';
  } else {
    badge.style.display = 'none';
  }
}

// Export pour utilisation
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initializeChat,
    sendChatMessage,
    toggleChat,
    resetChat
  };
}
