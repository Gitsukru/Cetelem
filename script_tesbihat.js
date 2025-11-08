/**
 * TESBIHAT SLIDER - Navigation système pour tesbihat
 * Support: Swipe mobile, flèches, sélecteur de langue
 */

class TesbihatSlider {
  constructor() {
    this.currentLang = 'turkish'; // turkish ou arabic
    this.currentNamazIndex = 0; // 0-4 (sabah, ogle, ikindi, aksam, yatsi)
    this.currentSectionIndex = 0; // Section courante du namaz
    this.namazOrder = ['sabah', 'ogle', 'ikindi', 'aksam', 'yatsi'];

    // Touch/swipe handling
    this.touchStartX = 0;
    this.touchEndX = 0;
    this.touchStartY = 0;
    this.touchEndY = 0;
    this.minSwipeDistance = 50;
  }

  /**
   * Initialiser le slider
   */
  init() {
    if (!TESBIHAT_DATA) {
      console.error('TESBIHAT_DATA not loaded');
      return;
    }

    this.setupNavigation(); // Boutons prev/next - UNE SEULE FOIS
    this.setupSwipe();
    this.renderPage();
  }

  /**
   * Changer de langue
   */
  switchLanguage(lang) {
    if (lang === 'arabic' && !TESBIHAT_DATA.arabic.sabah) {
      showCustomAlert('Arapça versiyonu henüz hazır değil', 'info', 2000);
      return;
    }

    this.currentLang = lang;
    this.currentSectionIndex = 0; // Reset à la première section
    this.renderPage(); // renderPage appellera setupNamazButtons qui mettra à jour les boutons langue
  }

  /**
   * Mettre à jour l'apparence des boutons de langue
   */
  updateLanguageButtons() {
    const turkishBtn = document.getElementById('langTurkish');
    const arabicBtn = document.getElementById('langArabic');

    if (turkishBtn && arabicBtn) {
      if (this.currentLang === 'turkish') {
        turkishBtn.classList.add('active');
        arabicBtn.classList.remove('active');
      } else {
        turkishBtn.classList.remove('active');
        arabicBtn.classList.add('active');
      }
    }
  }

  /**
   * Setup navigation (boutons prev/next sections) - appelé UNE SEULE FOIS
   */
  setupNavigation() {
    const prevBtn = document.getElementById('tesbihatPrevBtn');
    const nextBtn = document.getElementById('tesbihatNextBtn');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => this.previousSection());
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.nextSection());
    }
  }

  /**
   * Setup boutons namaz et langue - appelé à chaque render
   */
  setupNamazButtons() {
    // Setup boutons navbar
    const namazButtons = document.querySelectorAll('.namaz-btn');
    namazButtons.forEach((btn, index) => {
      btn.addEventListener('click', () => {
        this.currentNamazIndex = index;
        this.currentSectionIndex = 0;

        // 📊 Analytics: Tesbihat utilisé (changement de namaz)
        if (typeof analytics !== 'undefined') {
          const namazName = this.namazOrder[index];
          const namaz = TESBIHAT_DATA[this.currentLang][namazName];
          if (namaz) {
            analytics.tesbihatUsed(namazName, namaz.name);
          }
        }

        this.renderPage();
      });
    });

    // Setup boutons langue
    const turkishBtn = document.getElementById('langTurkish');
    const arabicBtn = document.getElementById('langArabic');

    if (turkishBtn) {
      turkishBtn.addEventListener('click', () => {
        this.switchLanguage('turkish');
      });
    }

    if (arabicBtn) {
      arabicBtn.addEventListener('click', () => {
        this.switchLanguage('arabic');
      });
    }

    this.updateLanguageButtons();
  }

  /**
   * Setup swipe gestures
   */
  setupSwipe() {
    const slider = document.getElementById('tesbihatSlider');
    if (!slider) return;

    slider.addEventListener('touchstart', (e) => {
      this.touchStartX = e.changedTouches[0].screenX;
      this.touchStartY = e.changedTouches[0].screenY;
    });

    slider.addEventListener('touchend', (e) => {
      this.touchEndX = e.changedTouches[0].screenX;
      this.touchEndY = e.changedTouches[0].screenY;
      this.handleSwipe();
    });
  }

  /**
   * Gérer les swipes
   */
  handleSwipe() {
    const diffX = this.touchStartX - this.touchEndX;
    const diffY = this.touchStartY - this.touchEndY;

    // Vérifier si c'est un swipe horizontal (pas vertical)
    if (Math.abs(diffX) > Math.abs(diffY)) {
      if (Math.abs(diffX) > this.minSwipeDistance) {
        if (diffX > 0) {
          // Swipe gauche -> section suivante
          this.nextSection();
        } else {
          // Swipe droite -> section précédente
          this.previousSection();
        }
      }
    }
  }

  /**
   * Namaz précédent
   */
  previousNamaz() {
    if (this.currentNamazIndex > 0) {
      this.currentNamazIndex--;
      this.currentSectionIndex = 0;
      this.renderPage();
    }
  }

  /**
   * Namaz suivant
   */
  nextNamaz() {
    if (this.currentNamazIndex < this.namazOrder.length - 1) {
      this.currentNamazIndex++;
      this.currentSectionIndex = 0;
      this.renderPage();
    }
  }

  /**
   * Section précédente (reste dans le namaz sélectionné)
   */
  previousSection() {
    const namaz = this.getCurrentNamaz();
    if (!namaz) return;

    if (this.currentSectionIndex > 0) {
      this.currentSectionIndex--;
      this.renderPage();
    }
    // Ne change plus de namaz - reste dans le namaz sélectionné
  }

  /**
   * Section suivante (reste dans le namaz sélectionné)
   */
  nextSection() {
    const namaz = this.getCurrentNamaz();
    if (!namaz) return;

    if (this.currentSectionIndex < namaz.sections.length - 1) {
      this.currentSectionIndex++;
      this.renderPage();

      // 📊 Analytics: Tesbihat utilisé
      if (typeof analytics !== 'undefined') {
        const namazName = this.namazOrder[this.currentNamazIndex];
        analytics.tesbihatUsed(namazName, namaz.name);

        // Si on atteint la dernière section, tracker la complétion
        if (this.currentSectionIndex === namaz.sections.length - 1) {
          analytics.tesbihatCompleted(namazName, namaz.sections.length);
        }
      }
    }
    // Ne change plus de namaz - reste dans le namaz sélectionné
  }

  /**
   * Obtenir le namaz actuel
   */
  getCurrentNamaz() {
    const namazId = this.namazOrder[this.currentNamazIndex];
    return TESBIHAT_DATA[this.currentLang][namazId];
  }

  /**
   * Obtenir la section actuelle
   */
  getCurrentSection() {
    const namaz = this.getCurrentNamaz();
    if (!namaz || !namaz.sections) return null;
    return namaz.sections[this.currentSectionIndex];
  }

  /**
   * Calculer le nombre total de sections
   */
  getTotalSections() {
    const namaz = this.getCurrentNamaz();
    return namaz ? namaz.sections.length : 0;
  }

  /**
   * Rendu de la page
   */
  renderPage() {
    const namaz = this.getCurrentNamaz();
    const section = this.getCurrentSection();

    if (!namaz || !section) {
      console.error('Namaz ou section introuvable');
      return;
    }

    // Mettre à jour le compteur
    this.updateCounter();

    // Mettre à jour le contenu (inclut les boutons namaz)
    this.updateContent(section);

    // Mettre à jour les boutons de navigation
    this.updateNavigationButtons();
  }

  /**
   * Mettre à jour le compteur de sections
   */
  updateCounter() {
    const counterEl = document.getElementById('tesbihatCounter');
    if (counterEl) {
      const totalSections = this.getTotalSections();
      counterEl.textContent = `${this.currentSectionIndex + 1} / ${totalSections}`;
    }
  }

  /**
   * Mettre à jour le contenu
   */
  updateContent(section) {
    const container = document.getElementById('tesbihatContent');
    if (!container) return;

    // Conteneur pour boutons namaz + langue
    let html = '<div class="namaz-lang-wrapper">';

    // Boutons namaz (centrés)
    html += '<div class="namaz-buttons-inline" id="namazButtons">';
    this.namazOrder.forEach((namazId, index) => {
      const namazData = TESBIHAT_DATA[this.currentLang][namazId];
      const activeClass = index === this.currentNamazIndex ? 'active' : '';
      html += `<button class="namaz-btn ${activeClass}" data-namaz="${index}">${namazData.title.split(' ')[0]}</button>`;
    });
    html += '</div>';

    // Boutons de langue (à droite, plus petits)
    html += '<div class="lang-toggle-inline">';
    const trActive = this.currentLang === 'turkish' ? 'active' : '';
    const arActive = this.currentLang === 'arabic' ? 'active' : '';
    html += `<button class="lang-inline ${trActive}" id="langTurkish" title="Türkçe">TR</button>`;
    html += `<button class="lang-inline ${arActive}" id="langArabic" title="Arapça">AR</button>`;
    html += '</div>';

    html += '</div>';

    // Titre de section
    html += `<h3 class="section-title">${section.title}</h3>`;

    // Items de la section
    section.items.forEach(item => {
      html += this.renderItem(item);
    });

    container.innerHTML = html;

    // Re-setup les événements sur les boutons namaz et langue
    this.setupNamazButtons();

    // Animation d'entrée
    container.style.animation = 'none';
    setTimeout(() => {
      container.style.animation = 'slideIn 0.2s ease-out';
    }, 10);
  }

  /**
   * Rendu d'un item
   */
  renderItem(item) {
    switch (item.type) {
      case 'instruction':
        return `<div class="tesbihat-instruction">${item.text}</div>`;

      case 'repeat':
        return `
          <div class="tesbihat-repeat">
            <div class="repeat-count">${item.count}×</div>
            <div class="repeat-text">${item.text}</div>
            ${item.note ? `<div class="repeat-note">${item.note}</div>` : ''}
          </div>`;

      case 'prayer':
        return `<div class="tesbihat-prayer">${item.text}</div>`;

      case 'verse':
        return `<div class="tesbihat-verse"><span class="verse-number">${item.number}.</span> ${item.text}</div>`;

      case 'verses':
        const versesText = item.verses.map(v =>
          `<span class="verse-number">${v.number}.</span> ${v.text}`
        ).join(' ');
        return `<div class="tesbihat-verses-container">${versesText}</div>`;

      case 'note':
        return `<div class="tesbihat-note">ℹ️ ${item.text}</div>`;

      case 'table':
        return this.renderTable(item.rows);

      default:
        return `<div class="tesbihat-prayer">${item.text || ''}</div>`;
    }
  }

  /**
   * Rendu d'un tableau (pour Duâ-i İsm-i Âzam)
   */
  renderTable(rows) {
    let html = '<div class="tesbihat-table"><table><tbody>';

    rows.forEach(row => {
      html += '<tr>';
      row.forEach(cell => {
        if (cell) {
          html += `<td>${cell}</td>`;
        }
      });
      html += '</tr>';
    });

    html += '</tbody></table></div>';
    return html;
  }

  /**
   * Mettre à jour les boutons de navigation sections (uniquement dans le namaz sélectionné)
   */
  updateNavigationButtons() {
    const prevBtn = document.getElementById('tesbihatPrevBtn');
    const nextBtn = document.getElementById('tesbihatNextBtn');

    // Navigation uniquement dans le namaz actuel (ne change plus de namaz)
    const isFirstSection = this.currentSectionIndex === 0;
    const isLastSection = this.currentSectionIndex === this.getTotalSections() - 1;

    if (prevBtn) prevBtn.disabled = isFirstSection;
    if (nextBtn) nextBtn.disabled = isLastSection;
  }
}

// Instance globale
let tesbihatSlider;

// Initialiser quand l'onglet Tesbihat est affiché
const originalShowTab = window.showTab;
window.showTab = function(tabName, event) {
  if (originalShowTab) {
    originalShowTab(tabName, event);
  }

  if (tabName === 'competition' && !tesbihatSlider) {
    // Attendre que le DOM soit prêt
    setTimeout(() => {
      if (typeof TESBIHAT_DATA !== 'undefined') {
        tesbihatSlider = new TesbihatSlider();
        tesbihatSlider.init();
      } else {
        console.error('TESBIHAT_DATA non chargé');
      }
    }, 100);
  }
};
