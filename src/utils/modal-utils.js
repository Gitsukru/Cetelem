/**
 * 📦 Utilitaires de gestion des modales
 *
 * Système unifié de modales pour éviter les duplications
 * Supporte: confirmations, alertes, modales personnalisées
 */

const ModalUtils = {
  /**
   * Afficher une boîte de confirmation
   * @param {string} title - Titre de la confirmation
   * @param {string} message - Message (HTML supporté)
   * @param {Function} onConfirm - Callback si "Oui" cliqué
   * @param {Function} onCancel - Callback si "Non" cliqué (optionnel)
   * @param {Object} options - Options additionnelles
   * @returns {HTMLElement} L'élément modal créé
   */
  showConfirm(title, message, onConfirm, onCancel = null, options = {}) {
    const {
      confirmText = 'Evet',
      cancelText = 'Hayır',
      confirmClass = 'confirm-yes',
      cancelClass = 'confirm-no'
    } = options;

    // Supprimer toute confirmation existante
    this.removeExisting('.custom-confirm');

    // Créer la boîte de confirmation
    const confirmDiv = document.createElement('div');
    confirmDiv.className = 'custom-confirm';
    confirmDiv.innerHTML = `
      <h3>${title}</h3>
      <p>${message}</p>
      <div class="confirm-buttons">
        <button class="confirm-btn ${confirmClass}">${confirmText}</button>
        <button class="confirm-btn ${cancelClass}">${cancelText}</button>
      </div>
    `;
    document.body.appendChild(confirmDiv);

    const yesBtn = confirmDiv.querySelector(`.${confirmClass}`);
    const noBtn = confirmDiv.querySelector(`.${cancelClass}`);

    const closeConfirm = () => {
      confirmDiv.classList.remove('show');
      setTimeout(() => {
        if (confirmDiv && confirmDiv.parentNode) {
          confirmDiv.remove();
        }
      }, 300);
    };

    yesBtn.addEventListener('click', () => {
      closeConfirm();
      if (onConfirm) onConfirm();
    });

    noBtn.addEventListener('click', () => {
      closeConfirm();
      if (onCancel) onCancel();
    });

    // Afficher avec animation
    setTimeout(() => {
      confirmDiv.classList.add('show');
    }, 100);

    return confirmDiv;
  },

  /**
   * Afficher une notification/alerte
   * @param {string} message - Message à afficher (HTML supporté)
   * @param {string} type - Type: 'error', 'success', 'warning', 'info'
   * @param {number} duration - Durée d'affichage en ms (défaut: 3000)
   * @returns {HTMLElement} L'élément alert créé
   */
  showAlert(message, type = 'error', duration = 3000) {
    // Supprimer toute notification existante
    this.removeExisting('.custom-alert');

    // Créer la nouvelle notification
    const alertDiv = document.createElement('div');
    alertDiv.className = `custom-alert ${type}`;
    alertDiv.innerHTML = message;
    document.body.appendChild(alertDiv);

    // Afficher avec animation
    setTimeout(() => {
      alertDiv.classList.add('show');
    }, 100);

    // Masquer après le délai
    setTimeout(() => {
      alertDiv.classList.remove('show');
      setTimeout(() => {
        if (alertDiv && alertDiv.parentNode) {
          alertDiv.remove();
        }
      }, 300);
    }, duration);

    return alertDiv;
  },

  /**
   * Afficher une modale personnalisée
   * @param {Object} config - Configuration de la modale
   * @returns {HTMLElement} L'élément modal créé
   */
  showModal(config) {
    const {
      title,
      body,
      footer = null,
      onClose = null,
      className = '',
      maxWidth = '500px'
    } = config;

    // Créer l'overlay
    const overlay = document.createElement('div');
    overlay.className = 'custom-modal-overlay';
    overlay.innerHTML = `
      <div class="custom-modal ${className}" style="max-width: ${maxWidth};">
        <div class="modal-header">
          <h3>${title}</h3>
          <button class="modal-close">✕</button>
        </div>
        <div class="modal-body">
          ${body}
        </div>
        ${footer ? `<div class="modal-footer">${footer}</div>` : ''}
      </div>
    `;
    document.body.appendChild(overlay);

    const closeBtn = overlay.querySelector('.modal-close');
    const modal = overlay.querySelector('.custom-modal');

    const closeModal = () => {
      overlay.remove();
      if (onClose) onClose();
    };

    closeBtn.addEventListener('click', closeModal);

    // Fermer si clic sur overlay
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeModal();
      }
    });

    return overlay;
  },

  /**
   * Afficher une modale avec textarea (pour notes)
   * @param {Object} config - Configuration
   * @returns {HTMLElement} L'élément modal créé
   */
  showNoteModal(config) {
    const {
      title,
      description = '',
      placeholder = '',
      initialValue = '',
      onSave,
      onCancel = null
    } = config;

    const modalId = `note-modal-${Date.now()}`;
    const textareaId = `note-textarea-${Date.now()}`;

    const body = `
      ${description ? `<p style="font-size: 13px; color: #64748b; margin-bottom: 12px;">${description}</p>` : ''}
      <textarea id="${textareaId}" class="notes-textarea"
        placeholder="${placeholder}"
        style="min-height: 100px;">${initialValue}</textarea>
    `;

    const footer = `
      <button class="btn-secondary" data-action="cancel">İptal</button>
      <button class="btn-primary" data-action="save">💾 Kaydet</button>
    `;

    const overlay = this.showModal({
      title,
      body,
      footer,
      className: 'note-modal',
      onClose: onCancel
    });

    overlay.id = modalId;

    const textarea = document.getElementById(textareaId);
    const saveBtn = overlay.querySelector('[data-action="save"]');
    const cancelBtn = overlay.querySelector('[data-action="cancel"]');

    // Auto-expand textarea
    const autoExpand = () => {
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    };

    autoExpand();
    textarea.addEventListener('input', autoExpand);
    textarea.focus();

    // Handlers
    const handleSave = () => {
      const value = textarea.value.trim();
      overlay.remove();
      if (onSave) onSave(value);
    };

    const handleCancel = () => {
      overlay.remove();
      if (onCancel) onCancel();
    };

    saveBtn.addEventListener('click', handleSave);
    cancelBtn.addEventListener('click', handleCancel);

    // Enter avec Ctrl pour sauvegarder
    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.ctrlKey) {
        handleSave();
      }
    });

    return overlay;
  },

  /**
   * Afficher une modale avec input texte simple
   * @param {Object} config - Configuration
   * @returns {HTMLElement} L'élément modal créé
   */
  showInputModal(config) {
    const {
      title,
      description = '',
      placeholder = '',
      initialValue = '',
      inputType = 'text',
      onSubmit,
      onCancel = null,
      submitText = '✅ Valider',
      cancelText = 'Annuler'
    } = config;

    const modalId = `input-modal-${Date.now()}`;
    const inputId = `input-${Date.now()}`;

    const body = `
      ${description ? `<p style="font-size: 13px; color: #64748b; margin-bottom: 12px;">${description}</p>` : ''}
      <input type="${inputType}" id="${inputId}" class="form-input"
        placeholder="${placeholder}" value="${initialValue}"
        style="width: 100%;">
    `;

    const footer = `
      <button class="btn-secondary" data-action="cancel">${cancelText}</button>
      <button class="btn-primary" data-action="submit">${submitText}</button>
    `;

    const overlay = this.showModal({
      title,
      body,
      footer,
      className: 'input-modal modern-modal',
      onClose: onCancel
    });

    overlay.id = modalId;

    const input = document.getElementById(inputId);
    const submitBtn = overlay.querySelector('[data-action="submit"]');
    const cancelBtn = overlay.querySelector('[data-action="cancel"]');

    input.focus();

    // Handlers
    const handleSubmit = () => {
      const value = input.value.trim();
      overlay.remove();
      if (onSubmit) onSubmit(value);
    };

    const handleCancel = () => {
      overlay.remove();
      if (onCancel) onCancel();
    };

    submitBtn.addEventListener('click', handleSubmit);
    cancelBtn.addEventListener('click', handleCancel);

    // Enter pour soumettre
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        handleSubmit();
      }
    });

    return overlay;
  },

  /**
   * Supprimer les modales existantes d'un type
   * @param {string} selector - Sélecteur CSS
   */
  removeExisting(selector) {
    const existing = document.querySelector(selector);
    if (existing) {
      existing.remove();
    }
  },

  /**
   * Fermer toutes les modales ouvertes
   */
  closeAll() {
    const modals = document.querySelectorAll('.custom-confirm, .custom-alert, .custom-modal-overlay');
    modals.forEach(modal => modal.remove());
  }
};

// Export pour utilisation dans modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ModalUtils;
}

// Export pour utilisation dans navigateur
if (typeof window !== 'undefined') {
  window.ModalUtils = ModalUtils;

  // ⚡ COMPATIBILITÉ: Créer des fonctions globales pour maintenir l'API existante
  // Cela évite de devoir refactoriser tout le code immédiatement

  /**
   * @deprecated Utiliser ModalUtils.showConfirm() à la place
   */
  window.showCustomConfirm = function(title, message, onYes, onNo = null) {
    return ModalUtils.showConfirm(title, message, onYes, onNo);
  };

  /**
   * @deprecated Utiliser ModalUtils.showAlert() à la place
   */
  window.showCustomAlert = function(message, type = 'error', duration = 3000) {
    return ModalUtils.showAlert(message, type, duration);
  };

  /**
   * Helper pour auto-expand textarea (utilisé dans les modales de notes)
   */
  window.autoExpandTextarea = function(textarea) {
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    }
  };
}
