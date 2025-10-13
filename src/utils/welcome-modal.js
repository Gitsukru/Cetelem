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
          <!-- Section 1: Privacy First -->
          <div class="welcome-section">
            <div class="section-icon">🔒</div>
            <h3>Tamamen Özel ve Güvenli</h3>
            <ul class="welcome-list">
              <li>
                <strong>Kayıt yok, giriş yok:</strong>
                Hiçbir kişisel bilgi istenmez. E-posta, şifre veya telefon numarası gerekmez.
              </li>
              <li>
                <strong>Verileriniz cihazınızda:</strong>
                Tüm zikir sayılarınız telefonunuzda localStorage'da saklanır.
                Kimse verilerinize erişemez.
              </li>
              <li>
                <strong>Siz kontrol edersiniz:</strong>
                İstediğiniz zaman verilerinizi dışa aktarabilir veya silebilirsiniz.
              </li>
            </ul>
          </div>

          <!-- Section 2: How It Works -->
          <div class="welcome-section">
            <div class="section-icon">⚙️</div>
            <h3>Nasıl Çalışır?</h3>
            <ul class="welcome-list">
              <li>
                <strong>Yerel Depolama (localStorage):</strong>
                Tüm sayılarınız tarayıcınızda saklanır. İnternet olmadan çalışır.
              </li>
              <li>
                <strong>Grup Özelliği (isteğe bağlı):</strong>
                Bir grup oluşturur veya katılırsanız, SADECE toplam sayınız
                arkadaşlarınızla paylaşılır. Hangi zikirleri saydığınız gizli kalır.
              </li>
              <li>
                <strong>Yedekleme Kodu:</strong>
                Cihaz değiştirmek için 6 harfli kod oluşturabilirsiniz.
                Kod 7 gün geçerlidir, sonra otomatik silinir.
              </li>
            </ul>
          </div>

          <!-- Section 3: Technical Transparency -->
          <div class="welcome-section">
            <div class="section-icon">🛠️</div>
            <h3>Teknik Şeffaflık</h3>
            <ul class="welcome-list">
              <li>
                <strong>Supabase (Backend):</strong>
                Sadece grup özelliği için kullanılır. Zikir sayılarınız ASLA
                sunucuya gönderilmez. Sadece grup katılımınız ve toplam sayınız paylaşılır.
              </li>
              <li>
                <strong>Netlify (Hosting):</strong>
                Uygulama dosyaları Netlify'da barındırılır. Hiçbir kişisel veri
                toplanmaz veya izlenmez. Sadece standart web trafiği logları (IP, tarih).
              </li>
              <li>
                <strong>GitHub (Açık Kaynak):</strong>
                Tüm kod açık kaynak ve GitHub'da görülebilir. Gizli bir şey yok!
                İnceleyebilir, güvenliğini doğrulayabilirsiniz.
              </li>
              <li>
                <strong>Analytics (minimal):</strong>
                Sadece önemli olaylar kaydedilir (grup oluşturma, veri dışa aktarma).
                Hangi zikirleri saydığınız ASLA toplanmaz.
              </li>
            </ul>
          </div>

          <!-- Section 4: Your Rights -->
          <div class="welcome-section">
            <div class="section-icon">✅</div>
            <h3>Haklarınız</h3>
            <ul class="welcome-list">
              <li>
                <strong>Tam Kontrol:</strong>
                Verilerinizi istediğiniz zaman dışa aktarın (JSON dosyası).
              </li>
              <li>
                <strong>Tam Silme:</strong>
                "Yönetim" sekmesinden tüm verilerinizi kalıcı olarak silebilirsiniz.
              </li>
              <li>
                <strong>Çevrim Dışı Çalışma:</strong>
                İnternet bağlantısı olmadan tamamen çalışır. Verileriniz her zaman erişilebilir.
              </li>
              <li>
                <strong>Ücretsiz ve Reklamsız:</strong>
                Tamamen ücretsiz. Hiç reklam yok. Verileriniz satılmaz.
              </li>
            </ul>
          </div>

          <!-- Section 5: Open Source -->
          <div class="welcome-section highlight">
            <div class="section-icon">💻</div>
            <h3>Açık Kaynak ve Şeffaf</h3>
            <p style="margin-bottom: 12px;">
              Bu uygulama %100 açık kaynak kodludur. Tüm kodu inceleyebilir,
              güvenliğini doğrulayabilir ve hatta katkıda bulunabilirsiniz.
            </p>
            <p style="font-size: 13px; color: #64748b;">
              📦 GitHub:
              <a href="https://github.com/Gitsukru/Cetelem" target="_blank" rel="noopener">
                github.com/Gitsukru/Cetelem
              </a>
            </p>
          </div>

          <!-- Section 6: Questions -->
          <div class="welcome-section">
            <div class="section-icon">❓</div>
            <h3>Sorularınız mı Var?</h3>
            <p style="margin-bottom: 12px;">
              Herhangi bir sorunuz veya endişeniz varsa bizimle iletişime geçin:
            </p>
            <p style="font-size: 13px; color: #64748b;">
              📧 E-posta:
              <a href="mailto:contact@zikirmatik.app">contact@zikirmatik.app</a>
            </p>
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
  },

  /**
   * Fermer le modal
   */
  close() {
    const modal = document.querySelector('.welcome-modal-overlay');
    if (!modal) return;

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
