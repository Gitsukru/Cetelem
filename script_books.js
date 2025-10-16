/**
 * 📚 KITAP TAKİBİ - Book Tracking Module
 * Système de suivi de lecture de livres
 */

const BooksManager = {
  /**
   * Structure d'un livre:
   * {
   *   id: string (timestamp unique)
   *   name: string
   *   totalPages: number (optional, 0 = inconnu)
   *   history: {
   *     "YYYY-MM-DD": number (pages lues ce jour)
   *   }
   *   createdAt: timestamp
   * }
   */

  /**
   * Récupérer tous les livres depuis localStorage
   */
  getBooks() {
    const booksData = localStorage.getItem('books');
    return booksData ? JSON.parse(booksData) : [];
  },

  /**
   * Sauvegarder les livres dans localStorage
   */
  saveBooks(books) {
    localStorage.setItem('books', JSON.stringify(books));
    showSaveIndicator();
  },

  /**
   * Ajouter un nouveau livre
   */
  addBook(name, totalPages = 0) {
    const books = this.getBooks();

    const newBook = {
      id: `book_${Date.now()}`,
      name: name.trim(),
      totalPages: parseInt(totalPages) || 0,
      history: {},
      createdAt: Date.now()
    };

    books.push(newBook);
    this.saveBooks(books);
    this.renderBooks();
    this.updateStatsIfNeeded();

    return newBook;
  },

  /**
   * Supprimer un livre
   */
  deleteBook(bookId) {
    const books = this.getBooks();
    const filtered = books.filter(book => book.id !== bookId);
    this.saveBooks(filtered);
    this.renderBooks();
    this.updateStatsIfNeeded();
  },

  /**
   * Mettre à jour un livre
   */
  updateBook(bookId, updates) {
    const books = this.getBooks();
    const bookIndex = books.findIndex(b => b.id === bookId);

    if (bookIndex !== -1) {
      books[bookIndex] = { ...books[bookIndex], ...updates };
      this.saveBooks(books);
      this.renderBooks();
      this.updateStatsIfNeeded();
    }
  },

  /**
   * Ajouter des pages lues pour aujourd'hui
   */
  addPagesToday(bookId, pages) {
    const books = this.getBooks();
    const book = books.find(b => b.id === bookId);

    if (book) {
      const today = new Date().toISOString().split('T')[0];
      const currentPages = book.history[today] || 0;
      book.history[today] = currentPages + parseInt(pages);

      this.saveBooks(books);
      this.renderBooks();
      this.updateStatsIfNeeded();
    }
  },

  /**
   * Calculer le total de pages lues pour un livre
   */
  getTotalPagesRead(book) {
    return Object.values(book.history).reduce((sum, pages) => sum + pages, 0);
  },

  /**
   * Calculer les statistiques pour une période
   */
  getStatsForPeriod(book, startDate, endDate) {
    let total = 0;

    for (const [date, pages] of Object.entries(book.history)) {
      const dateObj = new Date(date);
      if (dateObj >= startDate && dateObj <= endDate) {
        total += pages;
      }
    }

    return total;
  },

  /**
   * Obtenir les statistiques complètes d'un livre
   */
  getBookStats(book) {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Aujourd'hui
    const todayPages = book.history[todayStr] || 0;

    // Cette semaine
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekPages = this.getStatsForPeriod(book, weekStart, today);

    // Ce mois
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthPages = this.getStatsForPeriod(book, monthStart, today);

    // Cette année
    const yearStart = new Date(today.getFullYear(), 0, 1);
    const yearPages = this.getStatsForPeriod(book, yearStart, today);

    // Total
    const totalPages = this.getTotalPagesRead(book);

    // Progression (si total_pages défini)
    const progress = book.totalPages > 0
      ? Math.min(100, Math.round((totalPages / book.totalPages) * 100))
      : null;

    return {
      today: todayPages,
      week: weekPages,
      month: monthPages,
      year: yearPages,
      total: totalPages,
      progress: progress
    };
  },

  /**
   * Afficher les livres dans l'interface
   */
  renderBooks() {
    const books = this.getBooks();
    const container = document.getElementById('booksList');
    const noBookMsg = document.getElementById('noBooksMessage');

    if (!container) return;

    if (books.length === 0) {
      container.innerHTML = '';
      if (noBookMsg) noBookMsg.style.display = 'block';
      return;
    }

    if (noBookMsg) noBookMsg.style.display = 'none';

    container.innerHTML = books.map(book => {
      const stats = this.getBookStats(book);
      const formatIcon = book.format === 'digital' ? '📱' : book.format === 'print' ? '📖' : '📚';
      const formatText = book.format === 'digital' ? 'Dijital' : book.format === 'print' ? 'Basılı' : '';

      return `
        <div class="book-card" data-book-id="${book.id}">
          <div class="book-header">
            <div class="book-info">
              <h3 class="book-title">${formatIcon} ${escapeHtml(book.name)}</h3>
              <p class="book-progress">
                ${formatText ? `<span style="color: #667eea; font-size: 12px; font-weight: 600;">${formatText}</span> • ` : ''}
                ${stats.total} sayfa okundu
                ${book.totalPages > 0 ? `/ ${book.totalPages} (${stats.progress}%)` : ''}
              </p>
            </div>
            <button class="book-delete-btn" onclick="deleteBookConfirm('${book.id}')" title="Sil">
              🗑️
            </button>
          </div>

          ${book.totalPages > 0 ? `
            <div class="book-progress-bar">
              <div class="book-progress-fill" style="width: ${stats.progress}%"></div>
            </div>
          ` : ''}

          <div class="book-stats">
            <div class="book-stat">
              <span class="book-stat-label">Bugün</span>
              <span class="book-stat-value">${stats.today}</span>
            </div>
            <div class="book-stat">
              <span class="book-stat-label">Bu Hafta</span>
              <span class="book-stat-value">${stats.week}</span>
            </div>
            <div class="book-stat">
              <span class="book-stat-label">Bu Ay</span>
              <span class="book-stat-value">${stats.month}</span>
            </div>
            <div class="book-stat">
              <span class="book-stat-label">Bu Yıl</span>
              <span class="book-stat-value">${stats.year}</span>
            </div>
          </div>

          <div class="book-actions">
            <button class="book-add-pages-btn" onclick="showAddPagesModal('${book.id}')">
              ➕ Sayfa Ekle
            </button>
            <button class="book-edit-btn" onclick="showEditBookModal('${book.id}')">
              ✏️ Düzenle
            </button>
          </div>
        </div>
      `;
    }).join('');
  },

  /**
   * Mettre à jour les statistiques globales si la page stats est visible
   */
  updateStatsIfNeeded() {
    // Si on est sur la page des statistiques, forcer une mise à jour
    if (typeof updateStats === 'function') {
      updateStats();
    }
  },

  /**
   * Initialiser le module
   */
  init() {
    this.renderBooks();
    console.log('📚 BooksManager initialisé');
  }
};

/**
 * MODALS - Gestion des modals
 */

/**
 * Afficher le modal d'ajout de livre (formulaire en étapes)
 */
function showAddBookModal() {
  const modalHTML = `
    <div class="custom-modal-overlay" onclick="if(event.target === this) this.remove()">
      <div class="custom-modal" style="min-height: 300px;">
        <div class="modal-header">
          <h3 id="modal-title">📚 Yeni Kitap Ekle</h3>
          <button class="modal-close" onclick="this.closest('.custom-modal-overlay').remove()">✕</button>
        </div>

        <!-- Indicateur de progression -->
        <div style="display: flex; gap: 8px; padding: 0 24px 16px; justify-content: center;">
          <div id="step-indicator-1" class="step-indicator active"></div>
          <div id="step-indicator-2" class="step-indicator"></div>
          <div id="step-indicator-3" class="step-indicator"></div>
          <div id="step-indicator-4" class="step-indicator"></div>
        </div>

        <div class="modal-body" id="modal-body-content">
          <!-- Étape 1: Nom du livre -->
          <div id="step-1" class="modal-step">
            <div class="form-group">
              <label class="form-label" style="font-size: 16px; margin-bottom: 12px;">Kitap İsmi Nedir?</label>
              <input type="text" id="bookNameInput" class="form-input" placeholder="Örn: İhya-u Ulumiddin" required autofocus>
            </div>
          </div>

          <!-- Étape 2: Format (digital/papier) -->
          <div id="step-2" class="modal-step" style="display: none;">
            <div class="form-group">
              <label class="form-label" style="font-size: 16px; margin-bottom: 16px;">Kitap Formatı Nedir?</label>
              <div style="display: flex; flex-direction: column; gap: 12px;">
                <button class="format-choice-btn" onclick="selectBookFormat('digital')" data-format="digital">
                  <span style="font-size: 24px;">📱</span>
                  <span style="margin-left: 12px;">Dijital (e-Kitap)</span>
                </button>
                <button class="format-choice-btn" onclick="selectBookFormat('print')" data-format="print">
                  <span style="font-size: 24px;">📖</span>
                  <span style="margin-left: 12px;">Basılı (Kağıt)</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Étape 3: Total pages -->
          <div id="step-3" class="modal-step" style="display: none;">
            <div class="form-group">
              <label class="form-label" style="font-size: 16px; margin-bottom: 12px;">Kitabın toplam kaç sayfa?</label>
              <input type="number" id="bookTotalPagesInput" class="form-input" placeholder="0 = bilinmiyor" min="0" value="0" onfocus="if(this.value==='0') this.value=''">
              <small style="color: #64748b; font-size: 12px; margin-top: 8px; display: block;">
                İlerleme çubuğunu görmek için toplam sayfa sayısını girin (isteğe bağlı)
              </small>
            </div>
          </div>

          <!-- Étape 4: Pages initiales -->
          <div id="step-4" class="modal-step" style="display: none;">
            <div class="form-group">
              <label class="form-label" style="font-size: 16px; margin-bottom: 12px;">Bugün Kaç Sayfa Okudunuz?</label>
              <input type="number" id="bookInitialPagesInput" class="form-input" placeholder="0" min="0" value="0" onfocus="if(this.value==='0') this.value=''">
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-secondary" id="btn-back" onclick="previousStepAddBook()" style="display: none;">
            ← Geri
          </button>
          <button class="btn-secondary" onclick="this.closest('.custom-modal-overlay').remove()">
            İptal
          </button>
          <button class="btn-primary" id="btn-next" onclick="nextStepAddBook()">
            Devam →
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);

  // Variables globales pour le formulaire en étapes
  window.bookFormData = {
    currentStep: 1,
    totalSteps: 4,
    name: '',
    format: '',
    totalPages: 0,
    initialPages: 0
  };

  // Gestion de la touche Enter pour passer à l'étape suivante
  const modalOverlay = document.querySelector('.custom-modal-overlay:last-of-type');
  modalOverlay.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      nextStepAddBook();
    }
  });

  document.getElementById('bookNameInput').focus();
}

/**
 * Passer à l'étape suivante
 */
function nextStepAddBook() {
  const data = window.bookFormData;

  // Validation de l'étape actuelle
  if (data.currentStep === 1) {
    const nameInput = document.getElementById('bookNameInput');
    const name = nameInput.value.trim();
    if (!name) {
      alert('Lütfen kitap ismini girin');
      nameInput.focus();
      return;
    }
    data.name = name;
  } else if (data.currentStep === 2) {
    if (!data.format) {
      alert('Lütfen kitap formatını seçin');
      return;
    }
  } else if (data.currentStep === 3) {
    const totalPagesInput = document.getElementById('bookTotalPagesInput');
    data.totalPages = parseInt(totalPagesInput.value) || 0;
  } else if (data.currentStep === 4) {
    const initialPagesInput = document.getElementById('bookInitialPagesInput');
    data.initialPages = parseInt(initialPagesInput.value) || 0;

    // Dernière étape : sauvegarder le livre
    saveBookFromSteps();
    return;
  }

  // Passer à l'étape suivante
  data.currentStep++;
  updateBookFormStep();
}

/**
 * Revenir à l'étape précédente
 */
function previousStepAddBook() {
  const data = window.bookFormData;
  if (data.currentStep > 1) {
    data.currentStep--;
    updateBookFormStep();
  }
}

/**
 * Sélectionner le format du livre
 */
function selectBookFormat(format) {
  window.bookFormData.format = format;

  // Highlight visuel
  document.querySelectorAll('.format-choice-btn').forEach(btn => {
    btn.classList.remove('selected');
  });
  event.target.closest('.format-choice-btn').classList.add('selected');

  // Passer automatiquement à l'étape suivante après 300ms
  setTimeout(() => nextStepAddBook(), 300);
}

/**
 * Mettre à jour l'affichage selon l'étape
 */
function updateBookFormStep() {
  const data = window.bookFormData;

  // Masquer toutes les étapes
  for (let i = 1; i <= data.totalSteps; i++) {
    document.getElementById(`step-${i}`).style.display = 'none';
    document.getElementById(`step-indicator-${i}`).classList.remove('active');
  }

  // Afficher l'étape actuelle
  document.getElementById(`step-${data.currentStep}`).style.display = 'block';
  document.getElementById(`step-indicator-${data.currentStep}`).classList.add('active');

  // Bouton Retour
  const btnBack = document.getElementById('btn-back');
  btnBack.style.display = data.currentStep > 1 ? 'inline-block' : 'none';

  // Texte du bouton Suivant
  const btnNext = document.getElementById('btn-next');
  btnNext.textContent = data.currentStep === data.totalSteps ? 'Kaydet' : 'Devam →';

  // Focus sur le champ approprié
  if (data.currentStep === 1) {
    document.getElementById('bookNameInput')?.focus();
  } else if (data.currentStep === 3) {
    document.getElementById('bookTotalPagesInput')?.focus();
  } else if (data.currentStep === 4) {
    document.getElementById('bookInitialPagesInput')?.focus();
  }
}

/**
 * Sauvegarder le livre avec toutes les données
 */
function saveBookFromSteps() {
  const data = window.bookFormData;

  const newBook = BooksManager.addBook(data.name, data.totalPages);

  // Ajouter le format (nouvelle propriété)
  BooksManager.updateBook(newBook.id, { format: data.format });

  // Ajouter les pages initiales si > 0
  if (data.initialPages > 0) {
    BooksManager.addPagesToday(newBook.id, data.initialPages);
  }

  // Fermer le modal
  document.querySelector('.custom-modal-overlay').remove();

  // Message de succès avec format
  const formatText = data.format === 'digital' ? '📱 Dijital' : '📖 Basılı';
  showNotification(`📚 "${data.name}" eklendi! (${formatText})`, 'success');

  // Nettoyer
  delete window.bookFormData;
}

/**
 * Ajouter un livre depuis le modal
 */
function addBookFromModal() {
  const nameInput = document.getElementById('bookNameInput');
  const totalPagesInput = document.getElementById('bookTotalPagesInput');
  const initialPagesInput = document.getElementById('bookInitialPagesInput');

  const name = nameInput.value.trim();
  const totalPages = parseInt(totalPagesInput.value) || 0;
  const initialPages = parseInt(initialPagesInput.value) || 0;

  if (!name) {
    alert('Lütfen kitap ismini girin');
    nameInput.focus();
    return;
  }

  const newBook = BooksManager.addBook(name, totalPages);

  // Ajouter les pages initiales si > 0
  if (initialPages > 0) {
    BooksManager.addPagesToday(newBook.id, initialPages);
  }

  // Fermer le modal
  document.querySelector('.custom-modal-overlay').remove();

  // Afficher un message de succès
  showNotification(`📚 "${name}" eklendi!`, 'success');
}

/**
 * Afficher le modal d'ajout de pages
 */
function showAddPagesModal(bookId) {
  const books = BooksManager.getBooks();
  const book = books.find(b => b.id === bookId);

  if (!book) return;

  const today = new Date().toISOString().split('T')[0];
  const todayPages = book.history[today] || 0;

  const modalHTML = `
    <div class="custom-modal-overlay" onclick="if(event.target === this) this.remove()">
      <div class="custom-modal">
        <div class="modal-header">
          <h3>➕ Sayfa Ekle</h3>
          <button class="modal-close" onclick="this.closest('.custom-modal-overlay').remove()">✕</button>
        </div>
        <div class="modal-body">
          <p style="margin-bottom: 16px; color: #475569;">
            <strong>${escapeHtml(book.name)}</strong>
          </p>
          <p style="margin-bottom: 16px; font-size: 13px; color: #64748b;">
            Bugün okuduğunuz sayfa: <strong>${todayPages}</strong>
          </p>
          <div class="form-group">
            <label class="form-label">Kaç sayfa okudunuz?</label>
            <input type="number" id="pagesToAddInput" class="form-input" placeholder="Örn: 10" min="1" required autofocus>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" onclick="this.closest('.custom-modal-overlay').remove()">
            İptal
          </button>
          <button class="btn-primary" onclick="addPagesFromModal('${bookId}')">
            Ekle
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);
  document.getElementById('pagesToAddInput').focus();
}

/**
 * Ajouter des pages depuis le modal
 */
function addPagesFromModal(bookId) {
  const input = document.getElementById('pagesToAddInput');
  const pages = parseInt(input.value);

  if (!pages || pages < 1) {
    alert('Lütfen geçerli bir sayfa sayısı girin');
    input.focus();
    return;
  }

  BooksManager.addPagesToday(bookId, pages);

  // Fermer le modal
  document.querySelector('.custom-modal-overlay').remove();

  // Afficher un message de succès
  showNotification(`✅ ${pages} sayfa eklendi!`, 'success');
}

/**
 * Afficher le modal d'édition de livre
 */
function showEditBookModal(bookId) {
  const books = BooksManager.getBooks();
  const book = books.find(b => b.id === bookId);

  if (!book) return;

  const modalHTML = `
    <div class="custom-modal-overlay" onclick="if(event.target === this) this.remove()">
      <div class="custom-modal">
        <div class="modal-header">
          <h3>✏️ Kitabı Düzenle</h3>
          <button class="modal-close" onclick="this.closest('.custom-modal-overlay').remove()">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Kitap İsmi</label>
            <input type="text" id="editBookNameInput" class="form-input" value="${escapeHtml(book.name)}" required>
          </div>
          <div class="form-group">
            <label class="form-label">Toplam Sayfa</label>
            <input type="number" id="editBookTotalPagesInput" class="form-input" value="${book.totalPages}" min="0">
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" onclick="this.closest('.custom-modal-overlay').remove()">
            İptal
          </button>
          <button class="btn-primary" onclick="updateBookFromModal('${bookId}')">
            Kaydet
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);
  document.getElementById('editBookNameInput').focus();
}

/**
 * Mettre à jour un livre depuis le modal
 */
function updateBookFromModal(bookId) {
  const nameInput = document.getElementById('editBookNameInput');
  const totalPagesInput = document.getElementById('editBookTotalPagesInput');

  const name = nameInput.value.trim();
  const totalPages = parseInt(totalPagesInput.value) || 0;

  if (!name) {
    alert('Lütfen kitap ismini girin');
    nameInput.focus();
    return;
  }

  BooksManager.updateBook(bookId, {
    name: name,
    totalPages: totalPages
  });

  // Fermer le modal
  document.querySelector('.custom-modal-overlay').remove();

  showNotification('✅ Kitap güncellendi!', 'success');
}

/**
 * Demander confirmation avant de supprimer un livre
 */
function deleteBookConfirm(bookId) {
  const books = BooksManager.getBooks();
  const book = books.find(b => b.id === bookId);

  if (!book) return;

  const confirmed = confirm(
    `"${book.name}" kitabını silmek istediğinizden emin misiniz?\n\n` +
    `Tüm okuma geçmişi silinecektir. Bu işlem geri alınamaz!`
  );

  if (confirmed) {
    BooksManager.deleteBook(bookId);
    showNotification('🗑️ Kitap silindi', 'info');
  }
}

/**
 * Échapper les caractères HTML
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Afficher une notification
 */
function showNotification(message, type = 'info') {
  // Utiliser le système de notification existant si disponible
  if (typeof showSaveIndicator === 'function') {
    const indicator = document.getElementById('saveIndicator');
    if (indicator) {
      indicator.textContent = message;
      indicator.style.display = 'block';
      setTimeout(() => {
        indicator.style.display = 'none';
        indicator.textContent = '✅ Kaydedildi';
      }, 2000);
    }
  } else {
    // Fallback simple
    alert(message);
  }
}

/**
 * Initialisation au chargement de la page
 */
if (typeof window !== 'undefined') {
  window.BooksManager = BooksManager;

  // Init après chargement du DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => BooksManager.init());
  } else {
    BooksManager.init();
  }
}
