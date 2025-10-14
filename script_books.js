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

      return `
        <div class="book-card" data-book-id="${book.id}">
          <div class="book-header">
            <div class="book-info">
              <h3 class="book-title">${escapeHtml(book.name)}</h3>
              <p class="book-progress">
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
 * Afficher le modal d'ajout de livre
 */
function showAddBookModal() {
  const modalHTML = `
    <div class="custom-modal-overlay" onclick="if(event.target === this) this.remove()">
      <div class="custom-modal">
        <div class="modal-header">
          <h3>📚 Yeni Kitap Ekle</h3>
          <button class="modal-close" onclick="this.closest('.custom-modal-overlay').remove()">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Kitap İsmi *</label>
            <input type="text" id="bookNameInput" class="form-input" placeholder="Örn: İhya-u Ulumiddin" required>
          </div>
          <div class="form-group">
            <label class="form-label">Toplam Sayfa (İsteğe Bağlı)</label>
            <input type="number" id="bookTotalPagesInput" class="form-input" placeholder="0 = bilinmiyor" min="0">
            <small style="color: #64748b; font-size: 12px;">
              Toplam sayfa sayısını gir irseniz ilerleme çubuğu görünür
            </small>
          </div>
          <div class="form-group">
            <label class="form-label">Bugün Kaç Sayfa Okudunuz?</label>
            <input type="number" id="bookInitialPagesInput" class="form-input" placeholder="0" min="0" value="0">
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" onclick="this.closest('.custom-modal-overlay').remove()">
            İptal
          </button>
          <button class="btn-primary" onclick="addBookFromModal()">
            Kaydet
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);
  document.getElementById('bookNameInput').focus();
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
