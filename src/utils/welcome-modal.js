/**
 * 🎉 Modal de Bienvenue et Transparence
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
          <div class="welcome-icon">🤲</div>
          <h2>Çetelem'e Hoş Geldiniz</h2>
          <p class="welcome-subtitle">Dijital Tesbih - Gizliliğiniz Önceliğimiz</p>
        </div>

        <div class="welcome-content">
          <!-- Auto-scrolling text sections -->
          <div class="welcome-auto-section active" data-section="1">
            <div class="section-icon">✨</div>
            <h3>Çetelem Nedir?</h3>
            <p style="line-height: 1.7;">
              <strong>Çetelem</strong>, günlük zikirlerinizi kolayca takip etmenizi sağlayan modern bir dijital tesbih uygulamasıdır.
            </p>
            <p style="line-height: 1.7; margin-top: 12px;">
              📱 Basit kullanım - Ekrana dokunarak sayın<br>
              📊 Günlük, haftalık ve aylık istatistikler<br>
              👥 Arkadaşlarınızla hayırda yarışın<br>
              🎯 Hedeflerinize ulaşın
            </p>
          </div>

          <div class="welcome-auto-section" data-section="2">
            <div class="section-icon">🔒</div>
            <h3>Verileriniz Sizinle Kalır</h3>
            <p style="line-height: 1.7;">
              Çetelem'i kullanmak için <strong>hiçbir kayıt, giriş veya kişisel bilgi gerekmez</strong>.
              Tüm zikir sayılarınız telefonunuzun hafızasında (tarayıcıda) saklanır.
            </p>
            <p style="line-height: 1.7; margin-top: 12px;">
              🔐 Tamamen özel ve güvenli<br>
              📶 İnternet gereksiz - çevrim dışı çalışır<br>
              💾 Verilerinizi dilediğiniz zaman dışa aktarın
            </p>
          </div>

          <div class="welcome-auto-section" data-section="3">
            <div class="section-icon">🎯</div>
            <h3>Nasıl Kullanılır?</h3>
            <p style="line-height: 1.7;">
              <strong>1. Zikir Sayma:</strong> Ana ekrandaki büyük butona her tıkladığınızda sayaç artar.<br>
              <strong>2. Farklı Zikirler:</strong> "Yönetim" veya "Sayaç" bölümünden istediğiniz kadar kategori ekleyin.<br>
              <strong>3. Kitap Takibi:</strong> "Kitap" sekmesinden okuduğunuz kitapları takip edin.<br>
              <strong>4. Grup Özelliği:</strong> Arkadaşlarınızla grup kurup motivasyonunuzu artırın.
            </p>
          </div>

          <div class="welcome-auto-section" data-section="4">
            <div class="section-icon">👥</div>
            <h3>Grup Özelliği (İsteğe Bağlı)</h3>
            <p style="line-height: 1.7;">
              Arkadaşlarınızla birlikte zikir çekmek motivasyonunuzu artırır. Grup özelliğini kullandığınızda:
            </p>
            <p style="line-height: 1.7; margin-top: 12px;">
              📊 Grup sıralamasında adınız ve toplam sayınız görünür<br>
              🚪 İstediğiniz zaman gruptan ayrılabilirsiniz
            </p>
            <p style="line-height: 1.7; margin-top: 12px; font-size: 14px; color: #64748b;">
              💡 Grup kullanmak tamamen isteğe bağlıdır.
            </p>
          </div>

          <div class="welcome-auto-section" data-section="5">
            <div class="section-icon">⚙️</div>
            <h3>Teknik Altyapı</h3>
            <p style="line-height: 1.7;">
              Uygulama modern web teknolojileri kullanılarak geliştirilmiştir:
            </p>
            <p style="line-height: 1.7; margin-top: 12px;">
              🌐 <strong>Netlify:</strong> Uygulamanın barındırıldığı güvenli platform<br>
              🗄️ <strong>Supabase:</strong> Sadece grup özelliği için kullanılan veritabanı servisi
            </p>
          </div>

          <div class="welcome-auto-section" data-section="6">
            <div class="section-icon">📧</div>
            <h3>Bize Ulaşın</h3>
            <p style="line-height: 1.7;">
              Sorularınız, önerileriniz veya geri bildirimleriniz için:
            </p>
            <p style="font-size: 16px; margin-top: 12px;">
              <a href="mailto:suisse1022@gmail.com">
                📧 suisse1022@gmail.com
              </a>
            </p>
          </div>

          <!-- Navigation arrows -->
          <div class="welcome-nav-arrows">
            <button class="welcome-nav-arrow" id="prevSlide" onclick="WelcomeModal.prevSlide()" title="Précédent">
              ◀
            </button>
            <button class="welcome-nav-arrow" id="nextSlide" onclick="WelcomeModal.nextSlide()" title="Suivant">
              ▶
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
            <span>Bu mesajı bir daha gösterme</span>
          </label>
          <button class="welcome-btn-primary" onclick="WelcomeModal.close()">
            ✨ Başlayalım
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
    const intervalTime = 6000; // 6 secondes

    this.autoScrollInterval = setInterval(() => {
      // Passer à la section suivante
      this.currentSection++;

      if (this.currentSection > this.totalSections) {
        // Arrêter à la dernière slide
        clearInterval(this.autoScrollInterval);
        this.autoScrollInterval = null;
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

      // Réinitialiser l'auto-scroll
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

      // Réinitialiser l'auto-scroll
      this.resetAutoScroll();
    }
  },

  /**
   * Réinitialiser le timer auto-scroll après navigation manuelle
   */
  resetAutoScroll() {
    // Arrêter l'ancien interval
    if (this.autoScrollInterval) {
      clearInterval(this.autoScrollInterval);
      this.autoScrollInterval = null;
    }

    // Ne redémarrer que si on n'est pas à la dernière slide
    if (this.currentSection < this.totalSections) {
      const intervalTime = 6000;
      this.autoScrollInterval = setInterval(() => {
        this.currentSection++;

        if (this.currentSection > this.totalSections) {
          clearInterval(this.autoScrollInterval);
          this.autoScrollInterval = null;
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
    // Désactiver toutes les sections
    const sections = document.querySelectorAll('.welcome-auto-section');
    sections.forEach(section => {
      section.classList.remove('active');
    });

    // Activer la section demandée
    const targetSection = document.querySelector(`.welcome-auto-section[data-section="${sectionNumber}"]`);
    if (targetSection) {
      targetSection.classList.add('active');
    }

    // Mettre à jour les dots
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

    // Arrêter le défilement automatique
    if (this.autoScrollInterval) {
      clearInterval(this.autoScrollInterval);
      this.autoScrollInterval = null;
    }

    // Vérifier si "ne plus afficher" est coché
    const dontShowAgain = document.getElementById('dontShowAgain');
    if (dontShowAgain && dontShowAgain.checked) {
      this.markAsShown();
    }

    // Animation de sortie
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
    // Attendre que le DOM soit chargé
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
    // Attendre 1 seconde après le chargement pour ne pas être trop intrusif
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

  // Auto-initialisation au chargement
  WelcomeModal.init();
}
