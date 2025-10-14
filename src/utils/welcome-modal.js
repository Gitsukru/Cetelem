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
          <!-- Section 1: Çetelem Nedir? -->
          <div class="welcome-section highlight">
            <div class="section-icon">✨</div>
            <h3>Çetelem Nedir?</h3>
            <p style="line-height: 1.7;">
              <strong>Çetelem</strong>, günlük zikirlerinizi kolayca takip etmenizi sağlayan modern bir dijital tesbih uygulamasıdır.
              İster evde, ister yolda, ister camide olun - telefonunuz her zaman yanınızda olduğu için zikirlerinizi hiç kaçırmazsınız.
            </p>
            <p style="line-height: 1.7; margin-top: 12px;">
              📱 <strong>Basit kullanım:</strong> Ekrana dokunarak sayın, otomatik olarak kaydedilir.<br>
              📊 <strong>İlerlemenizi görün:</strong> Günlük, haftalık ve aylık istatistikler.<br>
              👥 <strong>Arkadaşlarınızla hayırda yarışın:</strong> Grup oluşturup motivasyonunuzu artırın.<br>
              🎯 <strong>Hedeflerinize ulaşın:</strong> Her gün biraz daha maneviyatta ilerleme kaydedin.
            </p>
          </div>

          <!-- Section 2: Nasıl Kullanılır? -->
          <div class="welcome-section">
            <div class="section-icon">🎯</div>
            <h3>Nasıl Kullanılır?</h3>
            <ul class="welcome-list">
              <li>
                <strong>1. Zikir Sayma:</strong>
                Ana ekrandaki büyük butona her tıkladığınızda sayaç artar. Ses efektini açıp kapatabilirsiniz.
              </li>
              <li>
                <strong>2. Farklı Zikirler:</strong>
                "Yönetim" veya "Sayaç" bölümünden istediğiniz kadar zikir kategorisi ekleyebilirsiniz.
                Her biri ayrı ayrı sayılır ve kaydedilir.
              </li>
              <li>
                <strong>3. Kitap Takibi:</strong>
                "Kitap" sekmesinden okuduğunuz kitapları takip edebilirsiniz. Günlük kaç sayfa okuduğunuzu kaydedin,
                ilerlemenizi görün ve okuma hedefinize ulaşın.
              </li>
              <li>
                <strong>4. Grup Özelliği:</strong>
                Arkadaşlarınızla grup kurup birlikte zikir çekebilirsiniz. Sıralamada kim önde görürsünüz.
                Bu, motivasyonunuzu artırır ve ibadet ederken sosyal bir deneyim yaşarsınız.
              </li>
              <li>
                <strong>5. İstatistikler:</strong>
                İlerlemenizi "İstatistikler" sekmesinden takip edin. Bugün, bu hafta, bu ay ne kadar zikir çektiğinizi
                ve kaç sayfa okuduğunuzu görün.
              </li>
            </ul>
          </div>

          <!-- Section 3: Verileriniz Sizinle Kalır -->
          <div class="welcome-section">
            <div class="section-icon">🔒</div>
            <h3>Verileriniz Sizinle Kalır</h3>
            <p style="line-height: 1.7;">
              Çetelem'i kullanmak için <strong>hiçbir kayıt, giriş veya kişisel bilgi gerekmez</strong>.
              Tüm zikir sayılarınız telefonunuzun hafızasında (tarayıcıda) saklanır.
            </p>
            <ul class="welcome-list" style="margin-top: 12px;">
              <li>
                <strong>Tamamen özel:</strong>
                Hangi zikirleri çektiğiniz ve ne kadar sayı yaptığınız sadece kurduğunuz grupta ve sizin bilgisayarınızda kalır.
              </li>
              <li>
                <strong>İnternet gereksiz:</strong>
                Çevrim dışıyken bile çalışır. Sayılarınız kaybolmaz.
              </li>
              <li>
                <strong>Siz kontrol edersiniz:</strong>
                Verilerinizi dışa aktarabilir, cihaz değiştirebilir veya dilediğiniz zaman tamamen silebilirsiniz.
              </li>
            </ul>
          </div>

          <!-- Section 4: Grup Özelliği -->
          <div class="welcome-section">
            <div class="section-icon">👥</div>
            <h3>Grup Özelliği (İsteğe Bağlı)</h3>
            <p style="line-height: 1.7;">
              Arkadaşlarınızla birlikte zikir çekmek motivasyonunuzu artırır. Grup özelliğini kullandığınızda:
            </p>
            <ul class="welcome-list" style="margin-top: 12px;">
              <li>
                Grup sıralamasında adınız ve toplam sayınız görünür
              </li>
              <li>
                İstediğiniz zaman gruptan ayrılabilirsiniz
              </li>
            </ul>
            <p style="line-height: 1.7; margin-top: 12px; font-size: 13px; color: #64748b;">
              💡 Grup kullanmak tamamen isteğe bağlıdır. Kullanmasanız da uygulama aynı şekilde çalışır.
            </p>
          </div>

          <!-- Section 5: Teknik Altyapı -->
          <div class="welcome-section">
            <div class="section-icon">⚙️</div>
            <h3>Teknik Altyapı</h3>
            <p style="line-height: 1.7; margin-bottom: 12px;">
              Uygulama modern web teknolojileri kullanılarak geliştirilmiştir:
            </p>
            <ul class="welcome-list">
              <li>
                <strong>Netlify:</strong> Uygulamanın barındırıldığı güvenli platform
              </li>
              <li>
                <strong>Supabase:</strong> Sadece grup özelliği için kullanılan veritabanı servisi
              </li>
            </ul>
          </div>

          <!-- Section 6: Bize Ulaşın -->
          <div class="welcome-section">
            <div class="section-icon">📧</div>
            <h3>Bize Ulaşın</h3>
            <p style="line-height: 1.7;">
              Sorularınız, önerileriniz veya geri bildirimleriniz için:
            </p>
            <p style="font-size: 14px; margin-top: 8px;">
              <a href="mailto:suisse1022@gmail.com" style="color: #667eea; font-weight: 500;">
                📧 suisse1022@gmail.com
              </a>
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
