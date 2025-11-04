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
   * Garantit TOUJOURS le retour d'un tableau []
   */
  getBooks() {
    const booksData = localStorage.getItem('books');
    if (!booksData) return [];

    try {
      const parsed = JSON.parse(booksData);
      // Si ce n'est pas un tableau, retourner un tableau vide
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Erreur parsing books:', error);
      return [];
    }
  },

  /**
   * Sauvegarder les livres dans localStorage
   * Valide que books est bien un tableau avant sauvegarde
   */
  saveBooks(books) {
    // Garantir que books est un tableau
    const booksArray = Array.isArray(books) ? books : [];
    localStorage.setItem('books', JSON.stringify(booksArray));
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

    // Mettre à jour le groupe si actif
    if (typeof groupManager !== 'undefined' && groupManager.hasActiveGroup()) {
      const stats = getCurrentUserStats();
      groupManager.updateMyScore(stats).catch(err => {
        console.error('Erreur mise à jour groupe après ajout livre:', err);
      });
    }

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

    // Mettre à jour le groupe si actif
    if (typeof groupManager !== 'undefined' && groupManager.hasActiveGroup()) {
      const stats = getCurrentUserStats();
      groupManager.updateMyScore(stats).catch(err => {
        console.error('Erreur mise à jour groupe après suppression livre:', err);
      });
    }
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

      // Mettre à jour le groupe si actif
      if (typeof groupManager !== 'undefined' && groupManager.hasActiveGroup()) {
        const stats = getCurrentUserStats();
        groupManager.updateMyScore(stats).catch(err => {
          console.error('Erreur mise à jour groupe après modification livre:', err);
        });
      }
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
      const previousTotalPages = this.getTotalPagesRead(book);
      book.history[today] = currentPages + parseInt(pages);
      const newTotalPages = this.getTotalPagesRead(book);

      // 📊 Analytics: Livre complété (si on vient de terminer)
      if (typeof PrivacyAnalytics !== 'undefined' && book.totalPages > 0) {
        if (previousTotalPages < book.totalPages && newTotalPages >= book.totalPages) {
          PrivacyAnalytics.trackEvent('book_completed', {
            bookName: book.name,
            totalPages: book.totalPages,
            daysToComplete: Object.keys(book.history).length
          });
        }
      }

      this.saveBooks(books);
      this.renderBooks();
      this.updateStatsIfNeeded();

      // Mettre à jour le groupe si actif
      if (typeof groupManager !== 'undefined' && groupManager.hasActiveGroup()) {
        const stats = getCurrentUserStats();
        groupManager.updateMyScore(stats).catch(err => {
          console.error('Erreur mise à jour groupe après ajout pages:', err);
        });
      }
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
      this.updateBooksManagementList();
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

    // Mettre à jour aussi la liste de gestion dans l'onglet Yönetim
    this.updateBooksManagementList();
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
   * Mettre à jour la liste des livres dans l'onglet Yönetim
   */
  updateBooksManagementList() {
    const list = document.getElementById('booksManagementList');
    if (!list) return;

    const books = this.getBooks();
    list.innerHTML = '';

    books.forEach((book) => {
      const li = document.createElement('li');
      li.className = 'category-item';

      const stats = this.getBookStats(book);

      // Créer la structure DOM de manière sécurisée
      const contentDiv = document.createElement('div');

      const strongElement = document.createElement('strong');
      strongElement.textContent = `📚 ${book.name}`;

      const smallElement = document.createElement('small');
      smallElement.style.color = '#666';
      smallElement.style.display = 'block';
      smallElement.textContent = `${stats.total} sayfa okundu`;
      if (book.totalPages > 0) {
        smallElement.textContent += ` / ${book.totalPages} (${stats.progress}%)`;
      }

      contentDiv.appendChild(strongElement);
      contentDiv.appendChild(smallElement);

      // Container pour les boutons
      const buttonsDiv = document.createElement('div');
      buttonsDiv.style.display = 'flex';
      buttonsDiv.style.gap = '8px';

      // Bouton de modification
      const editButton = document.createElement('button');
      editButton.className = 'edit-button';
      editButton.textContent = '✏️ Düzenle';
      editButton.onclick = () => showEditBookModal(book.id);

      // Bouton de suppression
      const deleteButton = document.createElement('button');
      deleteButton.className = 'delete-button';
      deleteButton.textContent = 'Kitabı sil';
      deleteButton.onclick = () => deleteBookConfirm(book.id);

      buttonsDiv.appendChild(editButton);
      buttonsDiv.appendChild(deleteButton);

      li.appendChild(contentDiv);
      li.appendChild(buttonsDiv);
      list.appendChild(li);
    });
  },

  /**
   * Initialiser le module
   */
  init() {
    this.renderBooks();
    this.updateBooksManagementList();
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
          <div id="step-indicator-5" class="step-indicator"></div>
          <div id="step-indicator-6" class="step-indicator"></div>
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

          <!-- Étape 5: Objectif quotidien -->
          <div id="step-5" class="modal-step" style="display: none;">
            <div class="form-group">
              <label class="form-label" style="font-size: 16px; margin-bottom: 12px;">Günlük Okuma Hedefiniz Kaç Sayfadır?</label>
              <input type="number" id="bookDailyGoalInput" class="form-input" placeholder="Örn: 10" min="0" value="0" onfocus="if(this.value==='0') this.value=''">
              <small style="color: #64748b; font-size: 12px; margin-top: 8px; display: block;">
                Her gün bu sayfa sayısına ulaşmayı hedefleyin (isteğe bağlı)
              </small>
            </div>
          </div>

          <!-- Étape 6: Objectif hebdomadaire -->
          <div id="step-6" class="modal-step" style="display: none;">
            <div class="form-group">
              <label class="form-label" style="font-size: 16px; margin-bottom: 12px;">Haftalık Okuma Hedefiniz Kaç Sayfadır?</label>
              <input type="number" id="bookWeeklyGoalInput" class="form-input" placeholder="Örn: 70" min="0" value="0" onfocus="if(this.value==='0') this.value=''">
              <small style="color: #64748b; font-size: 12px; margin-top: 8px; display: block;">
                Her hafta bu sayfa sayısına ulaşmayı hedefleyin (isteğe bağlı)
              </small>
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
    totalSteps: 6,
    name: '',
    format: '',
    totalPages: 0,
    initialPages: 0,
    dailyGoal: 0,
    weeklyGoal: 0
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
  } else if (data.currentStep === 5) {
    const dailyGoalInput = document.getElementById('bookDailyGoalInput');
    data.dailyGoal = parseInt(dailyGoalInput.value) || 0;
  } else if (data.currentStep === 6) {
    const weeklyGoalInput = document.getElementById('bookWeeklyGoalInput');
    data.weeklyGoal = parseInt(weeklyGoalInput.value) || 0;

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
  } else if (data.currentStep === 5) {
    document.getElementById('bookDailyGoalInput')?.focus();
  } else if (data.currentStep === 6) {
    document.getElementById('bookWeeklyGoalInput')?.focus();
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

  // Sauvegarder les objectifs de lecture
  if (data.dailyGoal > 0 || data.weeklyGoal > 0) {
    saveBookGoals(newBook.id, data.dailyGoal, data.weeklyGoal);
  }

  // 📊 Analytics: Livre créé
  if (typeof PrivacyAnalytics !== 'undefined') {
    PrivacyAnalytics.trackEvent('book_created', {
      bookName: data.name,
      totalPages: data.totalPages,
      format: data.format,
      dailyGoal: data.dailyGoal,
      weeklyGoal: data.weeklyGoal
    });
  }

  // Fermer le modal
  document.querySelector('.custom-modal-overlay').remove();

  // Message de succès avec format et objectifs
  const formatText = data.format === 'digital' ? '📱 Dijital' : '📖 Basılı';
  let message = `📚 "${data.name}" eklendi! (${formatText})`;
  if (data.dailyGoal > 0) message += `<br>Günlük hedef: ${data.dailyGoal} sayfa`;
  if (data.weeklyGoal > 0) message += `<br>Haftalık hedef: ${data.weeklyGoal} sayfa`;
  showCustomAlert(message, 'success', 3000);

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

  const goals = getBookGoals(bookId);

  const modalHTML = `
    <div class="custom-modal-overlay" onclick="if(event.target === this) this.remove()">
      <div class="custom-modal" style="min-height: 300px;">
        <div class="modal-header">
          <h3 id="modal-title">✏️ Kitabı Düzenle</h3>
          <button class="modal-close" onclick="this.closest('.custom-modal-overlay').remove()">✕</button>
        </div>

        <!-- Indicateur de progression -->
        <div style="display: flex; gap: 8px; padding: 0 24px 16px; justify-content: center;">
          <div id="edit-step-indicator-1" class="step-indicator active"></div>
          <div id="edit-step-indicator-2" class="step-indicator"></div>
          <div id="edit-step-indicator-3" class="step-indicator"></div>
          <div id="edit-step-indicator-4" class="step-indicator"></div>
          <div id="edit-step-indicator-5" class="step-indicator"></div>
        </div>

        <div class="modal-body" id="modal-body-content">
          <!-- Étape 1: Nom du livre -->
          <div id="edit-step-1" class="modal-step">
            <div class="form-group">
              <label class="form-label" style="font-size: 16px; margin-bottom: 12px;">Kitap İsmi</label>
              <input type="text" id="editBookNameInput" class="form-input" value="${escapeHtml(book.name)}" required autofocus>
            </div>
          </div>

          <!-- Étape 2: Format (digital/papier) -->
          <div id="edit-step-2" class="modal-step" style="display: none;">
            <div class="form-group">
              <label class="form-label" style="font-size: 16px; margin-bottom: 16px;">Kitap Formatı</label>
              <div style="display: flex; flex-direction: column; gap: 12px;">
                <button class="format-choice-btn ${book.format === 'digital' ? 'selected' : ''}" onclick="selectEditBookFormat('digital')" data-format="digital">
                  <span style="font-size: 24px;">📱</span>
                  <span style="margin-left: 12px;">Dijital (e-Kitap)</span>
                </button>
                <button class="format-choice-btn ${book.format === 'print' ? 'selected' : ''}" onclick="selectEditBookFormat('print')" data-format="print">
                  <span style="font-size: 24px;">📖</span>
                  <span style="margin-left: 12px;">Basılı (Kağıt)</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Étape 3: Total pages -->
          <div id="edit-step-3" class="modal-step" style="display: none;">
            <div class="form-group">
              <label class="form-label" style="font-size: 16px; margin-bottom: 12px;">Toplam Sayfa Sayısı</label>
              <input type="number" id="editBookTotalPagesInput" class="form-input" placeholder="0 = bilinmiyor" min="0" value="${book.totalPages}" onfocus="if(this.value==='0') this.value=''">
              <small style="color: #64748b; font-size: 12px; margin-top: 8px; display: block;">
                İlerleme çubuğunu görmek için toplam sayfa sayısını girin (isteğe bağlı)
              </small>
            </div>
          </div>

          <!-- Étape 4: Objectif quotidien -->
          <div id="edit-step-4" class="modal-step" style="display: none;">
            <div class="form-group">
              <label class="form-label" style="font-size: 16px; margin-bottom: 12px;">Günlük Okuma Hedefiniz</label>
              <input type="number" id="editBookDailyGoalInput" class="form-input" placeholder="Örn: 10" min="0" value="${goals.daily || 0}" onfocus="if(this.value==='0') this.value=''">
              <small style="color: #64748b; font-size: 12px; margin-top: 8px; display: block;">
                Her gün bu sayfa sayısına ulaşmayı hedefleyin (isteğe bağlı)
              </small>
            </div>
          </div>

          <!-- Étape 5: Objectif hebdomadaire -->
          <div id="edit-step-5" class="modal-step" style="display: none;">
            <div class="form-group">
              <label class="form-label" style="font-size: 16px; margin-bottom: 12px;">Haftalık Okuma Hedefiniz</label>
              <input type="number" id="editBookWeeklyGoalInput" class="form-input" placeholder="Örn: 70" min="0" value="${goals.weekly || 0}" onfocus="if(this.value==='0') this.value=''">
              <small style="color: #64748b; font-size: 12px; margin-top: 8px; display: block;">
                Her hafta bu sayfa sayısına ulaşmayı hedefleyin (isteğe bağlı)
              </small>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-secondary" id="edit-book-btn-back" onclick="previousStepEditBook()" style="display: none;">
            ← Geri
          </button>
          <button class="btn-primary" id="edit-book-btn-next" onclick="nextStepEditBook()">
            İleri →
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);

  // Initialiser les données du formulaire
  window.editBookFormData = {
    currentStep: 1,
    totalSteps: 5,
    bookId: bookId,
    name: book.name,
    format: book.format || 'digital',
    totalPages: book.totalPages || 0,
    dailyGoal: goals.daily || 0,
    weeklyGoal: goals.weekly || 0
  };

  // Gestion de la touche Enter
  const modalOverlay = document.querySelector('.custom-modal-overlay:last-of-type');
  modalOverlay.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
      e.preventDefault();
      nextStepEditBook();
    }
  });

  document.getElementById('editBookNameInput').focus();
}

/**
 * Sélectionner le format du livre (édition)
 */
function selectEditBookFormat(format) {
  window.editBookFormData.format = format;

  // Mettre à jour le style des boutons
  document.querySelectorAll('.format-choice-btn').forEach(btn => {
    btn.classList.remove('selected');
  });
  event.target.closest('.format-choice-btn').classList.add('selected');

  // Passer à l'étape suivante automatiquement
  setTimeout(() => nextStepEditBook(), 300);
}

/**
 * Passer à l'étape suivante (édition)
 */
function nextStepEditBook() {
  const data = window.editBookFormData;
  const currentStep = data.currentStep;

  // Validation étape 1: nom du livre
  if (currentStep === 1) {
    const nameInput = document.getElementById('editBookNameInput');
    const name = nameInput.value.trim();

    if (!name) {
      showCustomAlert('Lütfen kitap ismini girin', 'warning', 2000);
      nameInput.focus();
      return;
    }

    data.name = name;
  }

  // Validation étape 3: total pages
  if (currentStep === 3) {
    const totalPagesInput = document.getElementById('editBookTotalPagesInput');
    data.totalPages = parseInt(totalPagesInput.value) || 0;
  }

  // Validation étape 4: objectif quotidien
  if (currentStep === 4) {
    const dailyGoalInput = document.getElementById('editBookDailyGoalInput');
    data.dailyGoal = parseInt(dailyGoalInput.value) || 0;
  }

  // Validation étape 5: objectif hebdomadaire et finalisation
  if (currentStep === 5) {
    const weeklyGoalInput = document.getElementById('editBookWeeklyGoalInput');
    data.weeklyGoal = parseInt(weeklyGoalInput.value) || 0;

    // Dernière étape : sauvegarder le livre
    finalizeEditBook();
    return;
  }

  // Passer à l'étape suivante
  data.currentStep++;

  // Masquer l'étape actuelle
  document.getElementById(`edit-step-${currentStep}`).style.display = 'none';
  document.getElementById(`edit-step-indicator-${currentStep}`).classList.remove('active');

  // Afficher l'étape suivante
  document.getElementById(`edit-step-${data.currentStep}`).style.display = 'block';
  document.getElementById(`edit-step-indicator-${data.currentStep}`).classList.add('active');

  // Mettre à jour les boutons
  document.getElementById('edit-book-btn-back').style.display = 'block';
  if (data.currentStep === data.totalSteps) {
    document.getElementById('edit-book-btn-next').textContent = '✓ Kaydet';
  }

  // Focus sur le champ approprié
  focusEditBookField();
}

/**
 * Revenir à l'étape précédente (édition)
 */
function previousStepEditBook() {
  const data = window.editBookFormData;
  const currentStep = data.currentStep;

  if (currentStep === 1) return;

  // Masquer l'étape actuelle
  document.getElementById(`edit-step-${currentStep}`).style.display = 'none';
  document.getElementById(`edit-step-indicator-${currentStep}`).classList.remove('active');

  // Revenir à l'étape précédente
  data.currentStep--;

  // Afficher l'étape précédente
  document.getElementById(`edit-step-${data.currentStep}`).style.display = 'block';
  document.getElementById(`edit-step-indicator-${data.currentStep}`).classList.add('active');

  // Mettre à jour les boutons
  if (data.currentStep === 1) {
    document.getElementById('edit-book-btn-back').style.display = 'none';
  }
  document.getElementById('edit-book-btn-next').textContent = 'İleri →';

  // Focus sur le champ approprié
  focusEditBookField();
}

/**
 * Focus sur le bon champ selon l'étape (édition)
 */
function focusEditBookField() {
  const step = window.editBookFormData.currentStep;

  if (step === 1) {
    document.getElementById('editBookNameInput')?.focus();
  } else if (step === 3) {
    document.getElementById('editBookTotalPagesInput')?.focus();
  } else if (step === 4) {
    document.getElementById('editBookDailyGoalInput')?.focus();
  } else if (step === 5) {
    document.getElementById('editBookWeeklyGoalInput')?.focus();
  }
}

/**
 * Finaliser l'édition du livre
 */
function finalizeEditBook() {
  const data = window.editBookFormData;

  // Mettre à jour le livre
  BooksManager.updateBook(data.bookId, {
    name: data.name,
    format: data.format,
    totalPages: data.totalPages
  });

  // Sauvegarder les objectifs
  if (data.dailyGoal > 0 || data.weeklyGoal > 0) {
    saveBookGoals(data.bookId, data.dailyGoal, data.weeklyGoal);
  }

  // Fermer le modal
  document.querySelector('.custom-modal-overlay').remove();

  // Message de confirmation
  let message = `✅ "${data.name}" güncellendi!`;
  const formatText = data.format === 'digital' ? '📱 Dijital' : '📖 Basılı';
  message += `<br>${formatText}`;
  if (data.dailyGoal > 0) message += `<br>Günlük hedef: ${data.dailyGoal} sayfa`;
  if (data.weeklyGoal > 0) message += `<br>Haftalık hedef: ${data.weeklyGoal} sayfa`;

  showCustomAlert(message, 'success', 3000);

  // Nettoyer
  delete window.editBookFormData;
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
 * ========================================
 * GESTION DES OBJECTIFS DE LECTURE
 * ========================================
 */

// Objet pour stocker les objectifs de lecture par livre
let bookGoals = {};

/**
 * Charger les objectifs de lecture depuis localStorage
 */
function loadBookGoals() {
  const saved = localStorage.getItem('bookGoals');
  if (saved) {
    try {
      bookGoals = JSON.parse(saved);
    } catch (e) {
      console.error('Erreur chargement objectifs livres:', e);
      bookGoals = {};
    }
  }
}

/**
 * Sauvegarder les objectifs de lecture d'un livre
 * @param {string} bookId - ID du livre
 * @param {number} dailyGoal - Objectif quotidien en pages
 * @param {number} weeklyGoal - Objectif hebdomadaire en pages
 */
function saveBookGoals(bookId, dailyGoal, weeklyGoal) {
  bookGoals[bookId] = {
    daily: dailyGoal || 0,
    weekly: weeklyGoal || 0
  };
  localStorage.setItem('bookGoals', JSON.stringify(bookGoals));
}

/**
 * Récupérer les objectifs d'un livre
 * @param {string} bookId - ID du livre
 * @returns {Object} { daily: number, weekly: number }
 */
function getBookGoals(bookId) {
  return bookGoals[bookId] || { daily: 0, weekly: 0 };
}

/**
 * Initialisation au chargement de la page
 */
if (typeof window !== 'undefined') {
  window.BooksManager = BooksManager;

  // Init après chargement du DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      loadBookGoals(); // Charger les objectifs
      BooksManager.init();
    });
  } else {
    loadBookGoals(); // Charger les objectifs
    BooksManager.init();
  }
}
