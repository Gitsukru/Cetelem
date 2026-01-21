/**
 * Modal de Bienvenue et Transparence
 * Explique le fonctionnement de l'app aux nouveaux utilisateurs
 */

const WelcomeModal = {
  /**
   * Vérifier si le modal doit être affiché
   */
  shouldShow() {
    // Afficher seulement si c'est la première visite
    return !localStorage.getItem('welcomeModalShown');
  },

  /**
   * Marquer le modal comme vu
   */
  markAsShown() {
    localStorage.setItem('welcomeModalShown', 'true');
    localStorage.setItem('welcomeModalShownDate', new Date().toISOString());
  },

  /**
   * Afficher le modal de bienvenue
   */
  show() {
    const modal = document.createElement('div');
    modal.className = 'welcome-modal-overlay';
    modal.innerHTML = `
      <div class="welcome-modal">
        <div class="welcome-header">
          <div class="welcome-icon">*</div>
          <h2>Cetelem'e Hos Geldiniz</h2>
          <p class="welcome-subtitle">Dijital Tesbih</p>
        </div>

        <div class="welcome-content">
          <!-- Auto-scrolling text sections -->
          <div class="welcome-auto-section active" data-section="1">
            <div class="section-icon">*</div>
            <h3>Cetelem Nedir?</h3>
            <p style="line-height: 1.7;">
              <strong>Cetelem</strong>, gunluk zikirlerinizi kolayca takip etmenizi saglayan modern bir dijital tesbih uygulamasidir.
            </p>
            <p style="line-height: 1.7; margin-top: 12px;">
              - Basit kullanim - Ekrana dokunarak sayin<br>
              - Gunluk, haftalik ve aylik istatistikler<br>
              - Arkadaslarinizla hayirda yarisin<br>
              - Hedeflerinize ulasin
            </p>
          </div>

          <div class="welcome-auto-section" data-section="2">
            <div class="section-icon">*</div>
            <h3>Verileriniz Sizinle Kalir</h3>
            <p style="line-height: 1.7;">
              Cetelem'i kullanmak icin hicbir kayit, giris veya kisisel bilgi gerekmez.
              Tum zikir sayilariniz telefonunuzun hafizasinda (tarayicida) saklanir.
            </p>
            <p style="line-height: 1.7; margin-top: 12px;">
              - Tamamen ozel ve guvenli<br>
              - Internet gereksiz - cevrim disi calisir<br>
              - Verilerinizi dilediginiz zaman disa aktarin<br>
              - Dilediginiz zaman hepsini silebilirsiniz
            </p>
          </div>

          <div class="welcome-auto-section" data-section="3">
            <div class="section-icon">*</div>
            <h3>Nasil Kullanilir?</h3>
            <p style="line-height: 1.7;">
              1. Zikir Sayma: Ana ekrandaki buyuk butona her tikladiginizda sayac artar.<br>
              2. Farkli Zikirler: "Yonetim" veya "Sayac" bolumunden istediginiz kadar kategori ekleyin.<br>
              3. Kitap Takibi: "Kitap" sekmesinden okudugunuz kitaplari takip edin.<br>
              4. Grup Ozelligi: Arkadaslarinizla grup kurup motivasyonunuzu artirin.
            </p>
          </div>

          <div class="welcome-auto-section" data-section="4">
            <div class="section-icon">*</div>
            <h3>Grup Ozelligi (Istege Bagli)</h3>
            <p style="line-height: 1.7;">
              Arkadaslarinizla birlikte zikir cekmek motivasyonunuzu artirir. Grup ozelligini kullandiginizda:
            </p>
            <p style="line-height: 1.7; margin-top: 12px;">
              - Grup siralamasinda adiniz ve toplam sayiniz gorunur.<br>
              - Istediginiz zaman gruptan ayrilabilirsiniz.<br>
              - Aranizda yaris yapabilirsiniz.<br>
              - Grup kullanmak tamamen istege baglidir.
            </p>
          </div>

          <div class="welcome-auto-section" data-section="5">
            <div class="section-icon">*</div>
            <h3>Teknik Altyapi</h3>
            <p style="line-height: 1.7;">
              Uygulama modern web teknolojileri kullanilarak gelistirilmistir:
            </p>
            <p style="line-height: 1.7; margin-top: 12px;">
              - Netlify: Uygulamanin barindirildigi guvenli platform<br>
              - Supabase: Sadece grup ozelligi icin kullanilan veritabani servisi
            </p>
          </div>

          <div class="welcome-auto-section" data-section="6">
            <div class="section-icon">*</div>
            <h3>Bize Ulasin</h3>
            <p style="line-height: 1.7;">
              Sorulariniz, onerileriniz veya geri bildirimleriniz icin:
            </p>
            <p style="font-size: 16px; margin-top: 12px;">
              <a href="mailto:suisse1022@gmail.com">
                suisse1022@gmail.com
              </a>
            </p>
          </div>

          <!-- Navigation arrows -->
          <div class="welcome-nav-arrows">
            <button class="welcome-nav-arrow" id="prevSlide" data-action="WelcomeModal.prevSlide()" title="Onceki">
              &lt;
            </button>
            <button class="welcome-nav-arrow" id="nextSlide" data-action="WelcomeModal.nextSlide()" title="Sonraki">
              &gt;
            </button>
          </div>

          <!-- Progress dots -->
          <div class="welcome-progress-dots">
            <span class="dot active" data-dot="1"></span>
            <span class="dot" data-dot="2"></span>
            <span class="dot" data-dot="3"></span>
            <span class="dot" data-dot="4"></span>
            <span class="dot" data-dot="5"></span>
            <span class="dot" data-dot="6"></span>
          </div>
        </div>

        <div class="welcome-footer">
          <label class="welcome-checkbox">
            <input type="checkbox" id="dontShowAgain">
            <span>Bu mesaji bir daha gosterme</span>
          </label>
          <button class="welcome-btn-primary" data-action="WelcomeModal.close()">
            Baslayalim
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Animation d'entrée
    setTimeout(() => {
      modal.classList.add('show');
    }, 100);

    // Démarrer le défilement automatique
    this.startAutoScroll();

    // Initialiser l'état des flèches
    setTimeout(() => {
      this.updateArrows();
    }, 200);
  },

  /**
   * Défilement automatique des sections
   */
  startAutoScroll() {
    this.currentSection = 1;
    this.totalSections = 6;
    this.autoScrollCompleted = false;
    const intervalTime = 6000;

    this.autoScrollInterval = setInterval(() => {
      this.currentSection++;

      if (this.currentSection > this.totalSections) {
        clearInterval(this.autoScrollInterval);
        this.autoScrollInterval = null;
        this.autoScrollCompleted = true;
        return;
      }

      this.showSection(this.currentSection);
      this.updateArrows();
    }, intervalTime);
  },

  /**
   * Aller à la slide précédente
   */
  prevSlide() {
    if (this.currentSection > 1) {
      this.currentSection--;
      this.showSection(this.currentSection);
      this.updateArrows();
      this.resetAutoScroll();
    }
  },

  /**
   * Aller à la slide suivante
   */
  nextSlide() {
    if (this.currentSection < this.totalSections) {
      this.currentSection++;
      this.showSection(this.currentSection);
      this.updateArrows();
      this.resetAutoScroll();
    }
  },

  /**
   * Réinitialiser le timer auto-scroll après navigation manuelle
   */
  resetAutoScroll() {
    if (this.autoScrollInterval) {
      clearInterval(this.autoScrollInterval);
      this.autoScrollInterval = null;
    }

    if (this.autoScrollCompleted) {
      return;
    }

    if (this.currentSection < this.totalSections) {
      const intervalTime = 6000;
      this.autoScrollInterval = setInterval(() => {
        this.currentSection++;

        if (this.currentSection > this.totalSections) {
          clearInterval(this.autoScrollInterval);
          this.autoScrollInterval = null;
          this.autoScrollCompleted = true;
          return;
        }

        this.showSection(this.currentSection);
        this.updateArrows();
      }, intervalTime);
    }
  },

  /**
   * Mettre à jour l'état des flèches
   */
  updateArrows() {
    const prevBtn = document.getElementById('prevSlide');
    const nextBtn = document.getElementById('nextSlide');

    if (prevBtn) {
      prevBtn.disabled = this.currentSection === 1;
    }

    if (nextBtn) {
      nextBtn.disabled = this.currentSection === this.totalSections;
    }
  },

  /**
   * Afficher une section spécifique
   */
  showSection(sectionNumber) {
    const sections = document.querySelectorAll('.welcome-auto-section');
    sections.forEach(section => {
      section.classList.remove('active');
    });

    const targetSection = document.querySelector(`.welcome-auto-section[data-section="${sectionNumber}"]`);
    if (targetSection) {
      targetSection.classList.add('active');
    }

    const dots = document.querySelectorAll('.welcome-progress-dots .dot');
    dots.forEach(dot => {
      dot.classList.remove('active');
    });
    const targetDot = document.querySelector(`.welcome-progress-dots .dot[data-dot="${sectionNumber}"]`);
    if (targetDot) {
      targetDot.classList.add('active');
    }
  },

  /**
   * Fermer le modal
   */
  close() {
    const modal = document.querySelector('.welcome-modal-overlay');
    if (!modal) return;

    if (this.autoScrollInterval) {
      clearInterval(this.autoScrollInterval);
      this.autoScrollInterval = null;
    }

    const dontShowAgain = document.getElementById('dontShowAgain');
    if (dontShowAgain && dontShowAgain.checked) {
      this.markAsShown();
    }

    modal.classList.remove('show');
    setTimeout(() => {
      modal.remove();
    }, 300);
  },

  /**
   * Réafficher le modal (depuis les paramètres par exemple)
   */
  forceShow() {
    this.show();
  },

  /**
   * Initialisation automatique
   */
  init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.checkAndShow();
      });
    } else {
      this.checkAndShow();
    }
  },

  /**
   * Vérifier et afficher si nécessaire
   */
  checkAndShow() {
    setTimeout(() => {
      if (this.shouldShow()) {
        this.show();
      }
    }, 1000);
  }
};

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WelcomeModal;
}

// Rendre disponible globalement
if (typeof window !== 'undefined') {
  window.WelcomeModal = WelcomeModal;
  WelcomeModal.init();
}
