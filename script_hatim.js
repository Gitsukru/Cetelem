/**
 * HATIM VE DUA - Quran Hatim & Dua Sharing Module
 * Systeme de partage de hatim et dua collaboratif
 */

// Donnees des Cuz du Coran
const KURAN_CUZLER = [
    { cuz: 1, sayfa: 1, icerik: 'Fatiha (Tumu) ve Bakara (1-141)' },
    { cuz: 2, sayfa: 21, icerik: 'Bakara (142-252)' },
    { cuz: 3, sayfa: 41, icerik: 'Bakara (253-286) ve Al-i Imran (1-92)' },
    { cuz: 4, sayfa: 61, icerik: 'Al-i Imran (93-200) ve Nisa (1-23)' },
    { cuz: 5, sayfa: 81, icerik: 'Nisa (24-147)' },
    { cuz: 6, sayfa: 101, icerik: 'Nisa (148-176) ve Maide (1-81)' },
    { cuz: 7, sayfa: 121, icerik: 'Maide (82-120) ve En\'am (1-110)' },
    { cuz: 8, sayfa: 141, icerik: 'En\'am (111-165) ve A\'raf (1-87)' },
    { cuz: 9, sayfa: 161, icerik: 'A\'raf (88-206) ve Enfal (1-40)' },
    { cuz: 10, sayfa: 181, icerik: 'Enfal (41-75) ve Tevbe (1-92)' },
    { cuz: 11, sayfa: 201, icerik: 'Tevbe (93-129), Yunus ve Hud (1-5)' },
    { cuz: 12, sayfa: 221, icerik: 'Hud (6-123) ve Yusuf (1-52)' },
    { cuz: 13, sayfa: 241, icerik: 'Yusuf (53-111), Ra\'d ve Ibrahim' },
    { cuz: 14, sayfa: 261, icerik: 'Hicr ve Nahl' },
    { cuz: 15, sayfa: 281, icerik: 'Isra ve Kehf (1-74)' },
    { cuz: 16, sayfa: 301, icerik: 'Kehf (75-110), Meryem ve Taha' },
    { cuz: 17, sayfa: 321, icerik: 'Enbiya ve Hac' },
    { cuz: 18, sayfa: 341, icerik: 'Mu\'minun, Nur ve Furkan (1-20)' },
    { cuz: 19, sayfa: 361, icerik: 'Furkan (21-77), Suara ve Neml (1-55)' },
    { cuz: 20, sayfa: 381, icerik: 'Neml (56-93), Kasas ve Ankebut (1-45)' },
    { cuz: 21, sayfa: 401, icerik: 'Ankebut (46-69), Rum, Lokman, Secde ve Ahzab (1-30)' },
    { cuz: 22, sayfa: 421, icerik: 'Ahzab (31-73), Sebe, Fatir ve Yasin (1-27)' },
    { cuz: 23, sayfa: 441, icerik: 'Yasin (28-83), Saffat, Sad ve Zumer (1-31)' },
    { cuz: 24, sayfa: 461, icerik: 'Zumer (32-75), Mu\'min ve Fussilet (1-46)' },
    { cuz: 25, sayfa: 481, icerik: 'Fussilet (47-54), Sura, Zuhruf, Duhan ve Casiye' },
    { cuz: 26, sayfa: 501, icerik: 'Ahkaf, Muhammed, Fetih, Hucurat, Kaf ve Zariyat (1-30)' },
    { cuz: 27, sayfa: 521, icerik: 'Zariyat (31-60), Tur, Necm, Kamer, Rahman, Vakia ve Hadid' },
    { cuz: 28, sayfa: 541, icerik: 'Mucadele\'den Tahrim suresine kadar olan sureler' },
    { cuz: 29, sayfa: 561, icerik: 'Mulk suresinden Murselat suresine kadar olan sureler' },
    { cuz: 30, sayfa: 581, icerik: 'Nebe suresinden Nas suresine kadar olan kisa sureler' }
];

// Donnees des Bab du Cevsen
const CEVSEN_BABLAR = [];
for (let i = 1; i <= 100; i++) {
    CEVSEN_BABLAR.push({ bab: i });
}

const HatimManager = {
    currentView: 'kuran', // 'kuran', 'dua', 'cevsen'
    provider: null,
    currentHatim: null,

    // ========================================
    // UTILITAIRES DE SÉCURITÉ
    // ========================================

    // Valider code hatim (alphanumérique seulement)
    safeCode(code) {
        if (!code) return '';
        return String(code).replace(/[^A-Z0-9]/gi, '').substring(0, 8);
    },

    // Valider ID (UUID format)
    safeId(id) {
        if (!id) return '';
        return String(id).replace(/[^a-f0-9-]/gi, '').substring(0, 36);
    },

    // Échapper HTML (inclut apostrophes)
    escapeHtml(text) {
        if (!text) return '';
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    },

    // ========================================
    // INITIALIZATION
    // ========================================

    initProvider(supabaseClient) {
        if (supabaseClient && typeof HatimProvider !== 'undefined') {
            this.provider = new HatimProvider(supabaseClient);
            console.log('HatimProvider initialise');
        }
    },

    init() {
        this.renderContent();
        this.renderMyHatimsList();
        console.log('HatimManager initialise');
    },

    // ========================================
    // NAVIGATION
    // ========================================

    showView(view) {
        this.currentView = view;
        this.currentHatim = null;

        // Update nav buttons
        document.querySelectorAll('.hatim-nav-btn').forEach(btn => {
            btn.classList.remove('active');
            btn.style.background = '#f1f5f9';
            btn.style.color = '#334155';
        });
        const activeBtn = document.querySelector(`.hatim-nav-btn[data-view="${view}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
            activeBtn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            activeBtn.style.color = 'white';
        }

        // Update content
        this.renderContent();
    },

    renderContent() {
        const container = document.getElementById('hatimContent');
        if (!container) return;

        // Si on affiche un hatim specifique
        if (this.currentHatim) {
            this.renderParticipationView(this.currentHatim);
            return;
        }

        switch (this.currentView) {
            case 'kuran':
                this.renderKuranHatim(container);
                break;
            case 'dua':
                this.renderDua(container);
                break;
            case 'cevsen':
                this.renderCevsenHatim(container);
                break;
        }
    },

    // ========================================
    // MES HATIMS
    // ========================================

    renderMyHatimsList() {
        const container = document.getElementById('myHatimsList');
        if (!container) return;

        const myHatims = this.provider ? this.provider.getMyHatims() : [];

        if (myHatims.length === 0) {
            container.innerHTML = '';
            container.style.display = 'none';
            return;
        }

        container.style.display = 'block';

        let html = `
            <details open style="max-width: 500px; background: white; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 12px;">
                <summary style="cursor: pointer; padding: 16px; display: flex; align-items: center; gap: 8px; list-style: none; font-weight: 600; color: #334155; font-size: 14px;">
                    <svg class="details-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="transition: transform 0.2s;">
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                    <span>📚</span> Katıldığım Hatimler (${myHatims.length})
                </summary>
                <div style="padding: 0 16px 16px; display: flex; flex-direction: column; gap: 8px;">
        `;

        myHatims.slice(0, 5).forEach(h => {
            const typeLabel = h.type === 'kuran' ? "Kur'an Hatmi" : 'Cevşen Hatmi';
            const icon = h.type === 'kuran' ? '📖' : '🌙';
            const roleLabel = h.isCreator ? '👑 Oluşturan' : '👤 Katılımcı';
            const safeHCode = this.safeCode(h.code);
            html += `
                <div onclick="HatimManager.openHatim('${safeHCode}')"
                     style="display: flex; align-items: center; justify-content: space-between; padding: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; cursor: pointer; transition: all 0.2s;"
                     onmouseover="this.style.borderColor='#667eea'; this.style.background='#eef2ff';"
                     onmouseout="this.style.borderColor='#e2e8f0'; this.style.background='#f8fafc';">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="font-size: 20px;">${icon}</span>
                        <div>
                            <div style="font-weight: 600; color: #1e293b; font-size: 14px;">${typeLabel}</div>
                            <div style="font-size: 11px; color: #64748b;">${roleLabel} • Kod: ${safeHCode}</div>
                        </div>
                    </div>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2">
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                </div>
            `;
        });

        html += `
                </div>
            </details>
        `;

        container.innerHTML = html;
    },

    // ========================================
    // CREATION DE HATIM
    // ========================================

    showCreateModal(type = 'kuran') {
        const typeLabel = type === 'kuran' ? "Kur'an Hatmi" : 'Cevsen Hatmi';
        const totalUnits = type === 'kuran' ? 30 : 100;
        const unitLabel = type === 'kuran' ? 'Cuz' : 'Bab';

        const html = `
            <div class="custom-modal-overlay" id="createHatimModal" onclick="if(event.target===this) this.remove()">
                <div class="custom-modal modern-modal" style="max-width: 450px;">
                    <div class="modal-header" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 12px 12px 0 0;">
                        <h3 style="margin: 0; display: flex; align-items: center; gap: 10px;">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                            </svg>
                            ${typeLabel} Olustur
                        </h3>
                    </div>
                    <div class="modal-body" style="padding: 20px;">
                        <div style="margin-bottom: 16px;">
                            <label style="display: block; margin-bottom: 6px; font-weight: 500; color: #334155;">Isminiz *</label>
                            <input type="text" id="hatimCreatorName"
                                   style="width: 100%; padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 15px;"
                                   placeholder="Adinizi girin" maxlength="30"
                                   value="${localStorage.getItem('lastHatimName') || ''}">
                        </div>
                        <div style="margin-bottom: 16px;">
                            <label style="display: block; margin-bottom: 6px; font-weight: 500; color: #334155;">Bitis Tarihi (Opsiyonel)</label>
                            <input type="date" id="hatimDeadline"
                                   style="width: 100%; padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 15px;"
                                   min="${new Date().toISOString().split('T')[0]}">
                        </div>
                        <div style="margin-bottom: 16px;">
                            <label style="display: block; margin-bottom: 6px; font-weight: 500; color: #334155;">Aciklama (Kimin icin?)</label>
                            <textarea id="hatimDescription"
                                      style="width: 100%; padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 15px; min-height: 80px; resize: vertical;"
                                      placeholder="Bu hatim kimin icin? (opsiyonel)"
                                      maxlength="500"></textarea>
                        </div>
                        <p style="color: #64748b; font-size: 13px; margin: 0;">
                            ${totalUnits} ${unitLabel} paylastirilacak
                        </p>
                    </div>
                    <div class="modal-footer" style="padding: 16px 20px; border-top: 1px solid #e2e8f0; display: flex; gap: 10px; justify-content: flex-end;">
                        <button onclick="document.getElementById('createHatimModal').remove()"
                                style="padding: 12px 20px; min-height: 44px; background: #f1f5f9; color: #475569; border: none; border-radius: 8px; cursor: pointer; font-weight: 500;">
                            Iptal
                        </button>
                        <button onclick="HatimManager.doCreateHatim('${type}')"
                                style="padding: 12px 20px; min-height: 44px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 500;">
                            Olustur ve Paylas
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', html);
        document.getElementById('hatimCreatorName').focus();
    },

    async doCreateHatim(type) {
        if (!this.provider) {
            showCustomAlert('Baglanti hatasi. Lutfen sayfayi yenileyin.', 'error', 3000);
            return;
        }

        const creatorName = document.getElementById('hatimCreatorName')?.value?.trim();
        const deadline = document.getElementById('hatimDeadline')?.value || null;
        const description = document.getElementById('hatimDescription')?.value?.trim() || '';

        // Validation
        if (!creatorName || creatorName.length < 2) {
            showCustomAlert('Lutfen gecerli bir isim girin (min 2 karakter)', 'warning', 2500);
            return;
        }

        if (creatorName.length > 30) {
            showCustomAlert('Isim 30 karakterden uzun olamaz', 'warning', 2500);
            return;
        }

        // Rate limiting
        if (typeof rateLimiter !== 'undefined') {
            const rateCheck = rateLimiter.check('createHatim', { maxAttempts: 5, windowMs: 300000 });
            if (!rateCheck.allowed) {
                showCustomAlert('Cok fazla hatim olusturdunuz. Lutfen bekleyin.', 'warning', 3000);
                return;
            }
        }

        try {
            showCustomAlert('Hatim olusturuluyor...', 'info', 1500);

            const result = await this.provider.createHatim({
                type,
                creatorName,
                description,
                deadline
            });

            // Save locally
            this.provider.saveHatimLocally({
                id: result.id,
                code: result.code,
                type,
                creatorName,
                isCreator: true
            });

            // Save name for next time
            localStorage.setItem('lastHatimName', creatorName);

            document.getElementById('createHatimModal')?.remove();

            // Show share dialog
            this.showShareDialog(result.code, type);

            // Refresh list
            this.renderMyHatimsList();

        } catch (error) {
            console.error('Hatim creation error:', error);
            showCustomAlert('Hatim olusturulamadi: ' + error.message, 'error', 3000);
        }
    },

    // ========================================
    // PARTAGE
    // ========================================

    showShareDialog(code, type) {
        // Valider les inputs
        const safeCodeVal = this.safeCode(code);
        const safeType = type === 'cevsen' ? 'cevsen' : 'kuran';
        const typeLabel = safeType === 'kuran' ? "Kur'an Hatmi" : 'Cevsen Hatmi';
        const shareUrl = typeof URLRouter !== 'undefined'
            ? URLRouter.generateShareURL(safeType, safeCodeVal)
            : `${window.location.origin}${window.location.pathname}#${safeType}=${safeCodeVal}`;

        const html = `
            <div class="custom-modal-overlay" id="shareHatimModal">
                <div class="custom-modal modern-modal" style="max-width: 400px;">
                    <div class="modal-header" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
                        <div style="font-size: 48px; margin-bottom: 10px;">✓</div>
                        <h3 style="margin: 0;">Hatim Olusturuldu!</h3>
                    </div>
                    <div class="modal-body" style="padding: 24px; text-align: center;">
                        <p style="color: #64748b; margin: 0 0 16px;">Paylasim kodu:</p>
                        <div style="font-size: 28px; font-weight: 700; color: #1e293b; letter-spacing: 4px; font-family: monospace; background: #f8fafc; padding: 16px; border-radius: 10px; margin-bottom: 16px;">
                            ${safeCodeVal}
                        </div>
                        <p style="font-size: 13px; color: #94a3b8; margin: 0;">
                            Bu kodu veya linki paylasarak digerlerini davet edin
                        </p>
                    </div>
                    <div class="modal-footer" style="padding: 16px 20px; border-top: 1px solid #e2e8f0; display: flex; flex-direction: column; gap: 10px;">
                        <button onclick="HatimManager.shareVia('${safeCodeVal}', '${safeType}')"
                                style="width: 100%; padding: 14px; background: #10b981; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 15px; display: flex; align-items: center; justify-content: center; gap: 8px;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="18" cy="5" r="3"></circle>
                                <circle cx="6" cy="12" r="3"></circle>
                                <circle cx="18" cy="19" r="3"></circle>
                                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                            </svg>
                            Paylas (WhatsApp, SMS...)
                        </button>
                        <button onclick="HatimManager.copyShareLink('${this.escapeHtml(shareUrl)}')"
                                style="width: 100%; padding: 12px; background: #f1f5f9; color: #475569; border: none; border-radius: 8px; cursor: pointer; font-weight: 500;">
                            Linki Kopyala
                        </button>
                        <button onclick="document.getElementById('shareHatimModal').remove(); HatimManager.openHatim('${safeCodeVal}')"
                                style="width: 100%; padding: 12px; background: white; color: #667eea; border: 1px solid #667eea; border-radius: 8px; cursor: pointer; font-weight: 500;">
                            Hatimi Ac
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', html);
    },

    shareVia(code, type) {
        const typeLabel = type === 'kuran' ? "Kur'an Hatmi" : 'Cevşen Hatmi';
        const shareUrl = typeof URLRouter !== 'undefined'
            ? URLRouter.generateShareURL(type, code)
            : `${window.location.origin}${window.location.pathname}#${type}=${code}`;

        const shareText = `📖 ${typeLabel}'ne Davet!

🔗 Link: ${shareUrl}

📋 Hatim Kodu: ${code}

━━━━━━━━━━━━━━━━━━
📱 Uygulama zaten yüklüyse:
1. Çetelem uygulamasını açın
2. "Hatim/Dua" sekmesine gidin
3. "Kod ile Katıl" kısmına bu kodu yapıştırın: ${code}

📲 Uygulama yüklü değilse:
Linke tıklayın ve uygulamayı yükleyin
━━━━━━━━━━━━━━━━━━`;

        if (navigator.share) {
            navigator.share({
                title: `${typeLabel} Daveti`,
                text: shareText,
                url: shareUrl
            }).catch(() => {
                // User cancelled
            });
        } else if (navigator.clipboard) {
            navigator.clipboard.writeText(shareText).then(() => {
                showCustomAlert('Paylasim metni kopyalandi!', 'success', 2000);
            });
        }
    },

    copyShareLink(url) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(url).then(() => {
                showCustomAlert('Link kopyalandi!', 'success', 2000);
            });
        }
    },

    // ========================================
    // REJOINDRE UN HATIM
    // ========================================

    joinByCode() {
        const codeInput = document.getElementById('hatimJoinCode');
        const code = codeInput?.value?.trim().toUpperCase();

        if (!code || code.length !== 8) {
            showCustomAlert('Lutfen 8 haneli bir kod girin', 'warning', 2500);
            return;
        }

        this.openHatim(code);
    },

    async openHatim(code) {
        if (!this.provider) {
            showCustomAlert('Baglanti hatasi. Lutfen sayfayi yenileyin.', 'error', 3000);
            return;
        }

        try {
            showCustomAlert('Hatim yukleniyor...', 'info', 1500);

            const hatim = await this.provider.getHatimByCode(code);
            this.currentHatim = hatim;

            // Save locally
            this.provider.saveHatimLocally({
                id: hatim.id,
                code: hatim.code,
                type: hatim.type,
                isCreator: false
            });

            // Subscribe to real-time updates
            this.provider.subscribeToHatim(hatim.id, () => {
                this.refreshCurrentHatim();
            });

            // Switch to hatim view
            this.currentView = hatim.type;
            this.renderParticipationView(hatim);

            // Refresh my hatims list
            this.renderMyHatimsList();

        } catch (error) {
            console.error('Open hatim error:', error);
            showCustomAlert('Hatim bulunamadi', 'error', 2500);
        }
    },

    async refreshCurrentHatim() {
        if (!this.currentHatim || !this.provider) return;

        try {
            const hatim = await this.provider.getHatimByCode(this.currentHatim.code);
            this.currentHatim = hatim;
            this.renderParticipationView(hatim);
        } catch (error) {
            console.error('Refresh error:', error);
        }
    },

    /**
     * Démarrer un nouveau tour pour le hatim actuel
     * @param {string} hatimId - ID du hatim
     */
    async startNewRound(hatimId) {
        if (!this.provider) {
            showCustomAlert('Bağlantı hatası', 'error', 2500);
            return;
        }

        // Confirmation avant de démarrer
        const confirmed = await new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.innerHTML = `
                <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 10000; display: flex; align-items: center; justify-content: center;">
                    <div style="background: white; padding: 24px; border-radius: 16px; max-width: 320px; margin: 20px; text-align: center;">
                        <div style="font-size: 40px; margin-bottom: 12px;">🔄</div>
                        <h3 style="margin: 0 0 12px; color: #1f2937;">Yeni Tur Başlat</h3>
                        <p style="margin: 0 0 20px; color: #6b7280; font-size: 14px;">
                            Mevcut tur tamamlandı. Yeni tur başlatmak istediğinize emin misiniz?
                        </p>
                        <div style="display: flex; gap: 12px;">
                            <button id="cancelNewRound" style="flex: 1; padding: 12px; background: #f1f5f9; border: none; border-radius: 8px; cursor: pointer; font-weight: 500;">
                                İptal
                            </button>
                            <button id="confirmNewRound" style="flex: 1; padding: 12px; background: #10b981; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                                Başlat
                            </button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            modal.querySelector('#cancelNewRound').onclick = () => {
                modal.remove();
                resolve(false);
            };
            modal.querySelector('#confirmNewRound').onclick = () => {
                modal.remove();
                resolve(true);
            };
        });

        if (!confirmed) return;

        try {
            const newRound = await this.provider.startNewRound(hatimId);
            showCustomAlert(`🎉 Tur ${newRound} başlatıldı!`, 'success', 2500);
            this.refreshCurrentHatim();
        } catch (error) {
            console.error('Start new round error:', error);
            showCustomAlert(error.message || 'Yeni tur başlatılamadı', 'error', 2500);
        }
    },

    // ========================================
    // VUE DE PARTICIPATION
    // ========================================

    async renderParticipationView(hatim) {
        const container = document.getElementById('hatimContent');
        if (!container) return;

        // Vérifier provider
        if (!this.provider) {
            container.innerHTML = '<div style="padding: 20px; text-align: center; color: #dc2626;">Bağlantı hatası. Sayfayı yenileyin.</div>';
            return;
        }

        // Utiliser participations du cache si disponibles, sinon fetch
        let participations;
        if (hatim.participations && Array.isArray(hatim.participations)) {
            participations = hatim.participations;
        } else {
            try {
                participations = await this.provider.getParticipations(hatim.id, hatim.current_round);
            } catch (error) {
                console.error('Participations fetch error:', error);
                container.innerHTML = '<div style="padding: 20px; text-align: center; color: #dc2626;">Veriler yüklenemedi. Lütfen tekrar deneyin.</div>';
                return;
            }
        }

        const claimedMap = new Map(participations.map(p => [p.unit_number, p]));

        const isKuran = hatim.type === 'kuran';
        const totalUnits = isKuran ? 30 : 100;
        const unitLabel = isKuran ? 'Cüz' : 'Bab';
        const typeLabel = isKuran ? "Kur'an Hatmi" : 'Cevşen Hatmi';

        // Progress
        const claimed = participations.length;
        const available = totalUnits - claimed;
        const progressPercent = Math.round((claimed / totalUnits) * 100);

        // Current user's device ID
        const myDeviceId = this.provider.getDeviceId();
        const myParticipations = participations.filter(p => p.device_id === myDeviceId);

        // Deadline status
        let deadlineStatus = null; // null, 'ok', 'soon', 'passed'
        let deadlineMessage = '';
        if (hatim.deadline) {
            const deadlineDate = new Date(hatim.deadline);
            deadlineDate.setHours(23, 59, 59, 999); // Fin de la journée
            const now = new Date();
            const daysLeft = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));

            if (daysLeft < 0) {
                deadlineStatus = 'passed';
                deadlineMessage = 'Süre doldu!';
            } else if (daysLeft === 0) {
                deadlineStatus = 'soon';
                deadlineMessage = 'Bugün son gün!';
            } else if (daysLeft <= 3) {
                deadlineStatus = 'soon';
                deadlineMessage = `${daysLeft} gün kaldı`;
            } else {
                deadlineStatus = 'ok';
                deadlineMessage = new Date(hatim.deadline).toLocaleDateString('tr-TR');
            }
        }

        // Escape HTML helper (inclut apostrophes pour attributs onclick)
        const escapeHtml = (text) => {
            if (!text) return '';
            return text
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        };

        // Valider code hatim (alphanumérique seulement)
        const safeCode = (code) => {
            if (!code) return '';
            return String(code).replace(/[^A-Z0-9]/gi, '').substring(0, 8);
        };

        // Valider ID (UUID format)
        const safeId = (id) => {
            if (!id) return '';
            return String(id).replace(/[^a-f0-9-]/gi, '').substring(0, 36);
        };

        // Card style
        const cardStyle = 'background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 12px;';
        const cardTitleStyle = 'margin: 0 0 12px; font-size: 14px; font-weight: 600; color: #334155; display: flex; align-items: center; gap: 8px;';

        let html = `
            <div class="hatim-participation-view" style="max-width: 500px;">

                <!-- CARD 1: Hatim Info -->
                <div style="${cardStyle} background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none;">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
                        <div>
                            <h3 style="margin: 0 0 4px; font-size: 18px; font-weight: 600;">📖 ${typeLabel}</h3>
                            <p style="margin: 0; opacity: 0.9; font-size: 13px;">Kod: <strong style="letter-spacing: 2px; font-size: 15px;">${hatim.code}</strong></p>
                        </div>
                        <button onclick="HatimManager.backToList()"
                                style="padding: 6px 12px; background: rgba(255,255,255,0.2); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px;">
                            ← Geri
                        </button>
                    </div>
                    ${hatim.description ? `<p style="margin: 0 0 8px; font-size: 13px; opacity: 0.9;">${escapeHtml(hatim.description)}</p>` : ''}
                    <div style="display: flex; flex-wrap: wrap; gap: 12px; font-size: 12px; opacity: 0.85;">
                        <span>👤 ${escapeHtml(hatim.creator_name)}</span>
                        ${deadlineStatus ? `
                            <span style="${deadlineStatus === 'passed' ? 'background: #fee2e2; color: #dc2626; padding: 2px 6px; border-radius: 4px; font-weight: 600;' :
                                          deadlineStatus === 'soon' ? 'background: #fef3c7; color: #d97706; padding: 2px 6px; border-radius: 4px; font-weight: 600;' :
                                          ''}">
                                ${deadlineStatus === 'passed' ? '⚠️' : '📅'} ${deadlineMessage}
                            </span>
                        ` : ''}
                        <span>🔄 Tur ${hatim.current_round}</span>
                    </div>
                    ${deadlineStatus === 'passed' ? `
                    <div style="margin-top: 10px; padding: 8px 12px; background: rgba(220, 38, 38, 0.2); border-radius: 6px; font-size: 12px;">
                        ⚠️ Son tarih geçti. Yeni katılım kabul edilmiyor.
                    </div>
                    ` : ''}
                </div>

                <!-- CARD 2: Progress -->
                <div style="${cardStyle}">
                    <div style="${cardTitleStyle}">
                        <span>📊</span> İlerleme
                    </div>
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                        <div style="flex: 1; height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden;">
                            <div style="width: ${progressPercent}%; height: 100%; background: linear-gradient(90deg, #667eea, #764ba2); transition: width 0.3s;"></div>
                        </div>
                        <span style="font-weight: 600; color: #334155; font-size: 14px;">${progressPercent}%</span>
                    </div>
                    <div style="display: flex; flex-wrap: wrap; gap: 12px; font-size: 13px; color: #64748b;">
                        <span>✅ ${claimed} alındı</span>
                        <span>⏳ ${available} kaldı</span>
                        ${hatim.current_round > 1 ? `<span style="color: #10b981;">🏆 ${hatim.current_round - 1} tur tamamlandı</span>` : ''}
                    </div>
                    ${available === 0 ? `
                    <div style="margin-top: 12px; padding: 12px; background: #dcfce7; border-radius: 8px; border: 1px solid #10b981;">
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                            <span style="font-size: 20px;">🎉</span>
                            <span style="font-weight: 600; color: #166534;">Bu tur tamamlandı!</span>
                        </div>
                        <p style="margin: 0 0 12px; font-size: 13px; color: #166534;">Tüm ${unitLabel}ler alındı. Yeni tur başlatabilirsiniz.</p>
                        <button onclick="HatimManager.startNewRound('${safeId(hatim.id)}')"
                                style="width: 100%; padding: 12px; background: #10b981; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 14px;">
                            🔄 Tur ${hatim.current_round + 1} Başlat
                        </button>
                    </div>
                    ` : ''}
                </div>

                <!-- CARD 3: My Cüz (if any) - Collapsible -->
                ${myParticipations.length > 0 ? `
                <details open style="${cardStyle} background: #f0fdf4; border-color: #bbf7d0; padding: 0;">
                    <summary style="cursor: pointer; padding: 16px; display: flex; align-items: center; gap: 8px; list-style: none; font-weight: 600; color: #166534; font-size: 14px;">
                        <svg class="details-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="transition: transform 0.2s;">
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                        <span>🙋</span> Benim ${unitLabel}lerim (${myParticipations.length})
                        <span style="font-weight: 400; font-size: 11px; color: #64748b; margin-left: auto;">Tıkla → Değiştir</span>
                    </summary>
                    <div style="padding: 0 16px 16px; display: flex; flex-wrap: wrap; gap: 8px;">
                        ${myParticipations.map(p => `
                            <div style="display: flex; align-items: center; gap: 4px; background: white; border: 2px solid ${p.is_completed ? '#10b981' : '#f59e0b'}; border-radius: 8px; padding: 6px 8px 6px 12px; transition: all 0.2s;">
                                <div onclick="HatimManager.toggleReadStatus('${safeId(p.id)}', ${!!p.is_completed}, ${parseInt(p.unit_number) || 0})"
                                     style="display: flex; align-items: center; gap: 6px; cursor: pointer; flex: 1;"
                                     onmouseover="this.parentElement.style.background='${p.is_completed ? '#dcfce7' : '#fef3c7'}';"
                                     onmouseout="this.parentElement.style.background='white';">
                                    <span style="font-weight: 700; color: #1e293b; font-size: 15px;">${parseInt(p.unit_number) || 0}</span>
                                    <span style="font-size: 12px; color: ${p.is_completed ? '#10b981' : '#f59e0b'};">${p.is_completed ? '✓ Okundu' : '📖 Okuyor...'}</span>
                                </div>
                                <button onclick="event.stopPropagation(); HatimManager.releaseUnit('${safeId(p.id)}', ${parseInt(p.unit_number) || 0})"
                                        style="width: 24px; height: 24px; border: none; background: #fee2e2; color: #dc2626; border-radius: 4px; cursor: pointer; font-size: 12px; display: flex; align-items: center; justify-content: center;"
                                        title="Vazgeç">✕</button>
                            </div>
                        `).join('')}
                    </div>
                </details>
                ` : ''}

                <!-- CARD 3b: Previous Rounds History -->
                ${hatim.current_round > 1 ? `
                <details style="${cardStyle} background: #fefce8; border-color: #fde047; padding: 0;">
                    <summary style="cursor: pointer; padding: 16px; display: flex; align-items: center; gap: 8px; list-style: none; font-weight: 600; color: #854d0e; font-size: 14px;">
                        <svg class="details-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="transition: transform 0.2s;">
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                        <span>🏆</span> Önceki Turlar (${hatim.current_round - 1} tamamlandı)
                        <span style="font-weight: 400; font-size: 11px; color: #a16207; margin-left: auto;">Tıkla → Göster</span>
                    </summary>
                    <div id="previousRoundsContainer" style="padding: 0 16px 16px;">
                        <p style="color: #854d0e; font-size: 13px; margin: 0;">Yükleniyor...</p>
                    </div>
                </details>
                ` : ''}

                <!-- CARD 4: Actions -->
                <div style="display: flex; gap: 8px; margin-bottom: 12px;">
                    <button onclick="HatimManager.shareVia('${safeCode(hatim.code)}', '${hatim.type === 'cevsen' ? 'cevsen' : 'kuran'}')"
                            style="flex: 1; padding: 12px; background: #10b981; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 14px; display: flex; align-items: center; justify-content: center; gap: 8px;">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="18" cy="5" r="3"></circle>
                            <circle cx="6" cy="12" r="3"></circle>
                            <circle cx="18" cy="19" r="3"></circle>
                            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                        </svg>
                        Paylaş
                    </button>
                </div>

                <!-- CARD 5: Cüz Selection Grid - Collapsible -->
                <details open style="${cardStyle} padding: 0;">
                    <summary style="cursor: pointer; padding: 16px; display: flex; align-items: center; gap: 8px; list-style: none; font-weight: 600; color: #334155; font-size: 14px;">
                        <svg class="details-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="transition: transform 0.2s;">
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                        <span>📋</span> ${unitLabel} Seç <span style="font-weight: 400; color: #64748b; font-size: 12px;">(${available} müsait)</span>
                    </summary>
                    <div style="padding: 0 16px 16px;">
                        <div style="display: grid; grid-template-columns: repeat(${isKuran ? 6 : 10}, 1fr); gap: 6px;">
        `;

        // Render units as numbered grid
        for (let i = 1; i <= totalUnits; i++) {
            const participation = claimedMap.get(i);
            const isMine = participation && participation.device_id === myDeviceId;

            if (participation) {
                // Taken - show with name
                const bgColor = isMine ? '#dbeafe' : (participation.is_completed ? '#dcfce7' : '#fef3c7');
                const borderColor = isMine ? '#3b82f6' : (participation.is_completed ? '#10b981' : '#f59e0b');
                html += `
                    <div style="aspect-ratio: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; background: ${bgColor}; border: 2px solid ${borderColor}; border-radius: 8px; font-size: 11px; position: relative;" title="${escapeHtml(participation.participant_name)}">
                        <span style="font-weight: 700; font-size: 14px; color: #1e293b;">${i}</span>
                        <span style="color: #64748b; font-size: 9px; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding: 0 2px;">${escapeHtml(participation.participant_name).substring(0, 6)}</span>
                        ${isMine ? '<span style="position: absolute; top: 2px; right: 2px; font-size: 8px;">🙋</span>' : ''}
                    </div>
                `;
            } else {
                // Available - clickable (unless deadline passed)
                if (deadlineStatus === 'passed') {
                    html += `
                        <div style="aspect-ratio: 1; display: flex; align-items: center; justify-content: center; background: #f8fafc; border: 2px dashed #e2e8f0; border-radius: 8px; opacity: 0.6; cursor: not-allowed;">
                            <span style="font-weight: 700; font-size: 14px; color: #94a3b8;">${i}</span>
                        </div>
                    `;
                } else {
                    html += `
                        <div onclick="HatimManager.showClaimModal('${safeId(hatim.id)}', ${parseInt(hatim.current_round) || 1}, ${i}, '${unitLabel}')"
                             style="aspect-ratio: 1; display: flex; align-items: center; justify-content: center; background: white; border: 2px dashed #cbd5e1; border-radius: 8px; cursor: pointer; transition: all 0.2s;"
                             onmouseover="this.style.borderColor='#667eea'; this.style.background='#eef2ff'; this.style.borderStyle='solid';"
                             onmouseout="this.style.borderColor='#cbd5e1'; this.style.background='white'; this.style.borderStyle='dashed';">
                            <span style="font-weight: 700; font-size: 14px; color: #667eea;">${i}</span>
                        </div>
                    `;
                }
            }
        }

        html += `
                        </div>
                        <div style="margin-top: 12px; display: flex; flex-wrap: wrap; gap: 12px; font-size: 11px; color: #64748b;">
                            <span style="display: flex; align-items: center; gap: 4px;"><span style="width: 12px; height: 12px; background: white; border: 2px dashed #cbd5e1; border-radius: 3px;"></span> Müsait</span>
                            <span style="display: flex; align-items: center; gap: 4px;"><span style="width: 12px; height: 12px; background: #fef3c7; border: 2px solid #f59e0b; border-radius: 3px;"></span> Alındı</span>
                            <span style="display: flex; align-items: center; gap: 4px;"><span style="width: 12px; height: 12px; background: #dcfce7; border: 2px solid #10b981; border-radius: 3px;"></span> Tamamlandı</span>
                            <span style="display: flex; align-items: center; gap: 4px;"><span style="width: 12px; height: 12px; background: #dbeafe; border: 2px solid #3b82f6; border-radius: 3px;"></span> Benim</span>
                        </div>
                    </div>
                </details>

            </div>
        `;

        container.innerHTML = html;

        // Load previous rounds if any (after DOM is ready)
        if (hatim.current_round > 1) {
            this.loadPreviousRounds(hatim.id, hatim.current_round, totalUnits, unitLabel);
        }
    },

    backToList() {
        if (this.currentHatim && this.provider) {
            this.provider.unsubscribeFromHatim(this.currentHatim.id);
        }
        this.currentHatim = null;
        this.renderContent();
    },

    // ========================================
    // TOGGLE READ STATUS
    // ========================================

    toggleReadStatus(participationId, isCurrentlyCompleted, unitNumber) {
        if (!this.provider) {
            showCustomAlert('Bağlantı hatası', 'error', 2500);
            return;
        }

        // Déterminer le label correct (Cüz ou Bab)
        const unitLabel = this.currentHatim?.type === 'cevsen' ? 'Bab' : 'Cüz';

        if (isCurrentlyCompleted) {
            // Already read - confirm to mark as unread
            this.showConfirmModal(
                `${unitNumber}. ${unitLabel}'ü "Okunmadı" olarak işaretlemek istiyor musunuz?`,
                'Geri Al',
                async () => {
                    try {
                        await this.provider.markIncomplete(participationId);
                        showCustomAlert('↩️ Okunmadı olarak işaretlendi', 'info', 2000);
                        this.refreshCurrentHatim();
                    } catch (error) {
                        console.error('Mark incomplete error:', error);
                        showCustomAlert('Hata oluştu', 'error', 2500);
                    }
                }
            );
        } else {
            // Not read - confirm to mark as read
            this.showConfirmModal(
                `${unitNumber}. ${unitLabel}'ü "Okundu" olarak işaretlemek istiyor musunuz?`,
                'Okundu ✓',
                async () => {
                    try {
                        await this.provider.markComplete(participationId);
                        showCustomAlert('✓ Okundu olarak işaretlendi!', 'success', 2000);
                        this.refreshCurrentHatim();
                    } catch (error) {
                        console.error('Mark complete error:', error);
                        showCustomAlert('Hata oluştu', 'error', 2500);
                    }
                }
            );
        }
    },

    /**
     * Libérer une unité prise par erreur
     * @param {string} participationId - ID de la participation
     * @param {number} unitNumber - Numéro de l'unité
     */
    releaseUnit(participationId, unitNumber) {
        if (!this.provider) {
            showCustomAlert('Bağlantı hatası', 'error', 2500);
            return;
        }

        const unitLabel = this.currentHatim?.type === 'cevsen' ? 'Bab' : 'Cüz';
        const deviceId = this.provider.getDeviceId();

        this.showConfirmModal(
            `${unitNumber}. ${unitLabel}'den vazgeçmek istiyor musunuz?`,
            'Evet, Vazgeç',
            async () => {
                try {
                    await this.provider.releaseUnit(participationId, deviceId);
                    showCustomAlert('✓ Vazgeçildi, başkası alabilir', 'info', 2000);
                    this.refreshCurrentHatim();
                } catch (error) {
                    console.error('Release unit error:', error);
                    showCustomAlert('Hata oluştu', 'error', 2500);
                }
            }
        );
    },

    async loadPreviousRounds(hatimId, currentRound, totalUnits, unitLabel) {
        const container = document.getElementById('previousRoundsContainer');
        if (!container || !this.provider) return;

        try {
            const myDeviceId = this.provider.getDeviceId();

            // Optimisé: une seule requête pour tous les rounds précédents
            const roundsMap = await this.provider.getAllPreviousRoundsParticipations(hatimId, currentRound);
            const roundNumbers = Object.keys(roundsMap).map(Number).sort((a, b) => b - a);

            if (roundNumbers.length === 0) {
                container.innerHTML = '<p style="color: #854d0e; font-size: 13px; margin: 0;">Önceki tur bulunamadı.</p>';
                return;
            }

            let html = '';
            for (const round of roundNumbers) {
                const participations = roundsMap[round] || [];
                const completedCount = participations.filter(p => p.is_completed).length;
                const myInThisRound = participations.filter(p => p.device_id === myDeviceId);

                html += `
                    <div style="margin-bottom: 12px; padding: 12px; background: white; border-radius: 8px; border: 1px solid #fde047;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <span style="font-weight: 600; color: #854d0e;">Tur ${round}</span>
                            <span style="font-size: 12px; color: #a16207;">✅ ${completedCount}/${totalUnits} okundu</span>
                        </div>
                        <div style="display: grid; grid-template-columns: repeat(${totalUnits <= 30 ? 10 : 10}, 1fr); gap: 3px;">
                `;

                for (let i = 1; i <= totalUnits; i++) {
                    const p = participations.find(x => x.unit_number === i);
                    const isMine = p && p.device_id === myDeviceId;
                    const bgColor = p ? (p.is_completed ? '#dcfce7' : '#fef3c7') : '#f1f5f9';
                    const borderColor = isMine ? '#3b82f6' : (p ? (p.is_completed ? '#10b981' : '#f59e0b') : '#e2e8f0');

                    html += `
                        <div style="aspect-ratio: 1; display: flex; align-items: center; justify-content: center; background: ${bgColor}; border: 1px solid ${borderColor}; border-radius: 4px; font-size: 9px; font-weight: 600; color: #64748b;" title="${p ? this.escapeHtml(p.participant_name) : 'Boş'}">
                            ${i}
                        </div>
                    `;
                }

                html += `
                        </div>
                        ${myInThisRound.length > 0 ? `
                        <div style="margin-top: 8px; font-size: 11px; color: #64748b;">
                            🙋 Benim: ${myInThisRound.map(p => `${unitLabel} ${p.unit_number}`).join(', ')}
                        </div>
                        ` : ''}
                    </div>
                `;
            }

            container.innerHTML = html;

        } catch (error) {
            console.error('Load previous rounds error:', error);
            container.innerHTML = '<p style="color: #dc2626; font-size: 13px; margin: 0;">Yüklenemedi.</p>';
        }
    },

    showConfirmModal(message, confirmText, onConfirm) {
        const html = `
            <div class="custom-modal-overlay" id="confirmModal" onclick="if(event.target===this) this.remove()">
                <div class="custom-modal modern-modal" style="max-width: 340px;">
                    <div class="modal-body" style="padding: 24px; text-align: center;">
                        <div style="font-size: 40px; margin-bottom: 12px;">📖</div>
                        <p style="margin: 0; color: #334155; font-size: 15px;">${message}</p>
                    </div>
                    <div class="modal-footer" style="padding: 16px 20px; border-top: 1px solid #e2e8f0; display: flex; gap: 10px; justify-content: center;">
                        <button onclick="document.getElementById('confirmModal').remove()"
                                style="padding: 12px 20px; min-height: 44px; background: #f1f5f9; color: #475569; border: none; border-radius: 8px; cursor: pointer; font-weight: 500;">
                            İptal
                        </button>
                        <button id="confirmModalBtn"
                                style="padding: 12px 20px; min-height: 44px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 500;">
                            ${confirmText}
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', html);

        document.getElementById('confirmModalBtn').onclick = async () => {
            document.getElementById('confirmModal')?.remove();
            await onConfirm();
        };
    },

    // ========================================
    // CLAIM UNIT
    // ========================================

    showClaimModal(hatimId, roundNumber, unitNumber, unitLabel) {
        const html = `
            <div class="custom-modal-overlay" id="claimModal" onclick="if(event.target===this) this.remove()">
                <div class="custom-modal modern-modal" style="max-width: 380px;">
                    <div class="modal-header" style="padding: 20px; border-bottom: 1px solid #e2e8f0;">
                        <h3 style="margin: 0; display: flex; align-items: center; gap: 10px;">
                            <span style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 8px 12px; border-radius: 8px; font-size: 14px;">${unitNumber}. ${unitLabel}</span>
                            Sec
                        </h3>
                    </div>
                    <div class="modal-body" style="padding: 20px;">
                        <div style="margin-bottom: 16px;">
                            <label style="display: block; margin-bottom: 6px; font-weight: 500; color: #334155;">Isminiz *</label>
                            <input type="text" id="claimParticipantName"
                                   style="width: 100%; padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 15px;"
                                   placeholder="Adinizi girin" maxlength="30"
                                   value="${localStorage.getItem('lastHatimName') || ''}">
                        </div>
                    </div>
                    <div class="modal-footer" style="padding: 16px 20px; border-top: 1px solid #e2e8f0; display: flex; gap: 10px; justify-content: flex-end;">
                        <button onclick="document.getElementById('claimModal').remove()"
                                style="padding: 12px 20px; min-height: 44px; background: #f1f5f9; color: #475569; border: none; border-radius: 8px; cursor: pointer; font-weight: 500;">
                            Iptal
                        </button>
                        <button onclick="HatimManager.doClaim('${hatimId}', ${roundNumber}, ${unitNumber})"
                                style="padding: 12px 20px; min-height: 44px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 500;">
                            Sec
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', html);
        document.getElementById('claimParticipantName').focus();
    },

    async doClaim(hatimId, roundNumber, unitNumber) {
        if (!this.provider) {
            showCustomAlert('Baglanti hatasi', 'error', 2500);
            return;
        }

        const participantName = document.getElementById('claimParticipantName')?.value?.trim();
        const claimBtn = document.querySelector('#claimModal button[onclick*="doClaim"]');

        // Validation
        if (!participantName || participantName.length < 2) {
            showCustomAlert('Lutfen gecerli bir isim girin (min 2 karakter)', 'warning', 2500);
            return;
        }

        if (participantName.length > 30) {
            showCustomAlert('Isim 30 karakterden uzun olamaz', 'warning', 2500);
            return;
        }

        // Save name
        localStorage.setItem('lastHatimName', participantName);

        // Show loading state
        if (claimBtn) {
            claimBtn.disabled = true;
            claimBtn.innerHTML = '<span style="display: inline-block; animation: spin 1s linear infinite;">⏳</span> Seciliyor...';
            claimBtn.style.opacity = '0.7';
        }

        try {
            await this.provider.claimUnit({
                hatimId,
                roundNumber,
                unitNumber,
                participantName
            });

            document.getElementById('claimModal')?.remove();
            showCustomAlert('✅ Basariyla secildi!', 'success', 2000);

            // Refresh view
            this.refreshCurrentHatim();

        } catch (error) {
            console.error('Claim error:', error);

            // Better error message for race condition
            if (error.message === 'Bu birim zaten alinmis') {
                showCustomAlert('⚠️ Bu cüz az önce başkası tarafından alındı! Başka bir cüz seçin.', 'warning', 3500);
                document.getElementById('claimModal')?.remove();
                // Auto-refresh to show updated grid
                this.refreshCurrentHatim();
            } else {
                showCustomAlert(error.message || 'Bir hata olustu', 'error', 2500);
                // Reset button
                if (claimBtn) {
                    claimBtn.disabled = false;
                    claimBtn.innerHTML = 'Sec';
                    claimBtn.style.opacity = '1';
                }
            }
        }
    },

    // ========================================
    // KURAN HATIM (Liste de base)
    // ========================================

    renderKuranHatim(container) {
        const cardStyle = 'background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 12px;';

        let html = `
            <div style="max-width: 500px;">
                <!-- Card: Create New Hatim -->
                <div style="${cardStyle}">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                        <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                            <span style="font-size: 24px;">📖</span>
                        </div>
                        <div>
                            <h3 style="margin: 0 0 4px; font-size: 16px; color: #1e293b;">Kur'an Hatmi Paylaş</h3>
                            <p style="margin: 0; font-size: 13px; color: #64748b;">30 cüz'ü paylaşarak birlikte hatim yapın</p>
                        </div>
                    </div>
                    <button onclick="HatimManager.showCreateModal('kuran')"
                            style="width: 100%; padding: 12px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 14px; display: flex; align-items: center; justify-content: center; gap: 8px;">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Yeni Hatim Oluştur
                    </button>
                </div>

                <!-- Card: Cüz Reference (collapsible) -->
                <details style="${cardStyle} padding: 0;">
                    <summary style="cursor: pointer; padding: 16px; display: flex; align-items: center; gap: 8px; list-style: none; font-weight: 600; color: #334155;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="transition: transform 0.2s;">
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                        📚 30 Cüz Listesi (Referans)
                    </summary>
                    <div style="padding: 0 16px 16px; max-height: 300px; overflow-y: auto;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                            <thead>
                                <tr style="background: #f1f5f9; position: sticky; top: 0;">
                                    <th style="padding: 8px; text-align: center; font-weight: 600;">Cüz</th>
                                    <th style="padding: 8px; text-align: center; font-weight: 600;">Sayfa</th>
                                    <th style="padding: 8px; text-align: left;">İçerik</th>
                                </tr>
                            </thead>
                            <tbody>
        `;

        KURAN_CUZLER.forEach((cuz, index) => {
            html += `
                <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 6px 8px; text-align: center; font-weight: 600; color: #667eea;">${cuz.cuz}</td>
                    <td style="padding: 6px 8px; text-align: center; color: #64748b;">${cuz.sayfa}</td>
                    <td style="padding: 6px 8px; color: #64748b; font-size: 11px;">${cuz.icerik}</td>
                </tr>
            `;
        });

        html += `
                            </tbody>
                        </table>
                    </div>
                </details>
            </div>
        `;

        container.innerHTML = html;
    },

    selectCuz(cuzNo) {
        // Deprecated - now using shared hatims
        showCustomAlert('Hatim paylasma icin "Hatim Paylas" butonunu kullanin', 'info', 2500);
    },

    // ========================================
    // DUA
    // ========================================

    renderDua(container) {
        const cardStyle = 'background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 12px;';

        let html = `
            <div style="max-width: 500px;">
                <div style="${cardStyle} background: #f0f9ff; border-color: #bae6fd;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="width: 48px; height: 48px; background: #0369a1; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                            <span style="font-size: 24px;">🤲</span>
                        </div>
                        <div>
                            <h3 style="margin: 0 0 4px; font-size: 16px; color: #0369a1;">Dua Paylaşımı</h3>
                            <p style="margin: 0; font-size: 13px; color: #64748b;">Yakında eklenecek...</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;
    },

    // ========================================
    // CEVSEN HATIM
    // ========================================

    renderCevsenHatim(container) {
        const cardStyle = 'background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 12px;';

        let html = `
            <div style="max-width: 500px;">
                <!-- Card: Create Cevsen Hatim -->
                <div style="${cardStyle}">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                        <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                            <span style="font-size: 24px;">🌙</span>
                        </div>
                        <div>
                            <h3 style="margin: 0 0 4px; font-size: 16px; color: #1e293b;">Cevşen Hatmi Paylaş</h3>
                            <p style="margin: 0; font-size: 13px; color: #64748b;">100 bab'ı paylaşarak birlikte okuyun</p>
                        </div>
                    </div>
                    <button onclick="HatimManager.showCreateModal('cevsen')"
                            style="width: 100%; padding: 12px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 14px; display: flex; align-items: center; justify-content: center; gap: 8px;">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Yeni Hatim Oluştur
                    </button>
                </div>

                <!-- Card: 100 Bab Reference (collapsible) -->
                <details style="${cardStyle} padding: 0;">
                    <summary style="cursor: pointer; padding: 16px; display: flex; align-items: center; gap: 8px; list-style: none; font-weight: 600; color: #334155;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                        📜 100 Bab Listesi (Referans)
                    </summary>
                    <div style="padding: 0 16px 16px;">
                        <div style="display: grid; grid-template-columns: repeat(10, 1fr); gap: 4px;">
        `;

        for (let i = 1; i <= 100; i++) {
            html += `
                <div style="aspect-ratio: 1; display: flex; align-items: center; justify-content: center; background: #fef3c7; border: 1px solid #f59e0b; border-radius: 4px; font-size: 11px; font-weight: 600; color: #92400e;">
                    ${i}
                </div>
            `;
        }

        html += `
                        </div>
                    </div>
                </details>
            </div>
        `;

        container.innerHTML = html;
    },

    selectBab(babNo) {
        // Deprecated - now using shared hatims
        showCustomAlert('Hatim paylasma icin "Hatim Paylas" butonunu kullanin', 'info', 2500);
    }
};

// Exposition globale
window.HatimManager = HatimManager;

// Init apres chargement du DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        HatimManager.init();
    });
} else {
    HatimManager.init();
}
