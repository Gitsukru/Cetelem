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
            <div style="margin-bottom: 20px;">
                <h4 style="margin: 0 0 12px; color: #334155; display: flex; align-items: center; gap: 8px;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                        <path d="M2 17l10 5 10-5"></path>
                    </svg>
                    Hatimlerim
                </h4>
                <div style="display: flex; flex-direction: column; gap: 8px;">
        `;

        myHatims.slice(0, 5).forEach(h => {
            const typeLabel = h.type === 'kuran' ? 'Kuran' : 'Cevsen';
            const icon = h.isCreator ? '👑' : '📖';
            html += `
                <div onclick="HatimManager.openHatim('${h.code}')"
                     style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: white; border: 1px solid #e2e8f0; border-radius: 10px; cursor: pointer; transition: all 0.2s;"
                     onmouseover="this.style.borderColor='#667eea'; this.style.background='#f8fafc';"
                     onmouseout="this.style.borderColor='#e2e8f0'; this.style.background='white';">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="font-size: 20px;">${icon}</span>
                        <div>
                            <div style="font-weight: 600; color: #1e293b;">${typeLabel} Hatmi</div>
                            <div style="font-size: 12px; color: #64748b;">Kod: ${h.code}</div>
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
            </div>
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
                                style="padding: 10px 20px; background: #f1f5f9; color: #475569; border: none; border-radius: 8px; cursor: pointer; font-weight: 500;">
                            Iptal
                        </button>
                        <button onclick="HatimManager.doCreateHatim('${type}')"
                                style="padding: 10px 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 500;">
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
        const typeLabel = type === 'kuran' ? "Kur'an Hatmi" : 'Cevsen Hatmi';
        const shareUrl = typeof URLRouter !== 'undefined'
            ? URLRouter.generateShareURL(type, code)
            : `${window.location.origin}${window.location.pathname}#${type}=${code}`;

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
                            ${code}
                        </div>
                        <p style="font-size: 13px; color: #94a3b8; margin: 0;">
                            Bu kodu veya linki paylasarak digerlerini davet edin
                        </p>
                    </div>
                    <div class="modal-footer" style="padding: 16px 20px; border-top: 1px solid #e2e8f0; display: flex; flex-direction: column; gap: 10px;">
                        <button onclick="HatimManager.shareVia('${code}', '${type}')"
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
                        <button onclick="HatimManager.copyShareLink('${shareUrl}')"
                                style="width: 100%; padding: 12px; background: #f1f5f9; color: #475569; border: none; border-radius: 8px; cursor: pointer; font-weight: 500;">
                            Linki Kopyala
                        </button>
                        <button onclick="document.getElementById('shareHatimModal').remove(); HatimManager.openHatim('${code}')"
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
        const typeLabel = type === 'kuran' ? "Kur'an Hatmi" : 'Cevsen Hatmi';
        const shareUrl = typeof URLRouter !== 'undefined'
            ? URLRouter.generateShareURL(type, code)
            : `${window.location.origin}${window.location.pathname}#${type}=${code}`;

        const shareText = `${typeLabel}ne katil!

Kod: ${code}

Link: ${shareUrl}

Cetelem uygulamasini ac ve bu kodla katil!`;

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

    // ========================================
    // VUE DE PARTICIPATION
    // ========================================

    async renderParticipationView(hatim) {
        const container = document.getElementById('hatimContent');
        if (!container) return;

        const participations = await this.provider.getParticipations(hatim.id, hatim.current_round);
        const claimedMap = new Map(participations.map(p => [p.unit_number, p]));

        const isKuran = hatim.type === 'kuran';
        const totalUnits = isKuran ? 30 : 100;
        const unitLabel = isKuran ? 'Cuz' : 'Bab';
        const typeLabel = isKuran ? "Kur'an Hatmi" : 'Cevsen Hatmi';

        // Progress
        const claimed = participations.length;
        const progressPercent = Math.round((claimed / totalUnits) * 100);

        // Escape HTML helper
        const escapeHtml = (text) => {
            if (!text) return '';
            return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        };

        let html = `
            <div class="hatim-participation-view">
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
                    <h3 style="margin: 0 0 8px; display: flex; align-items: center; gap: 10px;">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                        </svg>
                        ${typeLabel}
                    </h3>
                    <p style="margin: 0; opacity: 0.9;">Kod: <strong style="letter-spacing: 2px;">${hatim.code}</strong></p>
                    ${hatim.description ? `<p style="margin: 10px 0 0; font-size: 14px; opacity: 0.85;">${escapeHtml(hatim.description)}</p>` : ''}
                    ${hatim.deadline ? `<p style="margin: 6px 0 0; font-size: 13px; opacity: 0.8;">Hedef: ${new Date(hatim.deadline).toLocaleDateString('tr-TR')}</p>` : ''}
                </div>

                <!-- Progress -->
                <div style="background: #f8fafc; padding: 16px; border-radius: 10px; margin-bottom: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <span style="font-weight: 600; color: #334155;">Tur ${hatim.current_round}</span>
                        <span style="color: #64748b;">${claimed}/${totalUnits} alinmis</span>
                    </div>
                    <div style="height: 12px; background: #e2e8f0; border-radius: 6px; overflow: hidden;">
                        <div style="width: ${progressPercent}%; height: 100%; background: linear-gradient(90deg, #667eea, #764ba2); transition: width 0.3s;"></div>
                    </div>
                    ${hatim.current_round > 1 ? `<p style="margin: 10px 0 0; font-size: 13px; color: #10b981;">${hatim.current_round - 1} tur tamamlandi</p>` : ''}
                </div>

                <!-- Share button -->
                <button onclick="HatimManager.shareVia('${hatim.code}', '${hatim.type}')"
                        style="width: 100%; padding: 14px; background: #10b981; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; margin-bottom: 20px; display: flex; align-items: center; justify-content: center; gap: 8px;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="18" cy="5" r="3"></circle>
                        <circle cx="6" cy="12" r="3"></circle>
                        <circle cx="18" cy="19" r="3"></circle>
                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                    </svg>
                    Paylas
                </button>

                <!-- Units grid -->
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(${isKuran ? '100%' : '90px'}, 1fr)); gap: 10px;">
        `;

        // Render units
        for (let i = 1; i <= totalUnits; i++) {
            const participation = claimedMap.get(i);
            const unitInfo = isKuran ? KURAN_CUZLER.find(c => c.cuz === i) : null;

            if (participation) {
                // Claimed unit
                const bgColor = participation.is_completed ? '#dcfce7' : '#fef3c7';
                const borderColor = participation.is_completed ? '#10b981' : '#f59e0b';

                if (isKuran) {
                    html += `
                        <div style="background: ${bgColor}; border: 2px solid ${borderColor}; border-radius: 10px; padding: 12px; display: flex; align-items: center; justify-content: space-between;">
                            <div>
                                <div style="font-weight: 600; color: #1e293b;">${i}. ${unitLabel}</div>
                                <div style="font-size: 12px; color: #64748b; margin: 4px 0;">${unitInfo?.icerik || ''}</div>
                            </div>
                            <div style="text-align: right;">
                                <div style="font-weight: 600; color: #374151;">${escapeHtml(participation.participant_name)}</div>
                                ${participation.is_completed ? '<span style="color: #10b981; font-size: 13px;">✓ Tamamlandi</span>' : ''}
                            </div>
                        </div>
                    `;
                } else {
                    html += `
                        <div style="background: ${bgColor}; border: 2px solid ${borderColor}; border-radius: 10px; padding: 12px; text-align: center;">
                            <div style="font-weight: 600; color: #1e293b; margin-bottom: 6px;">${i}. ${unitLabel}</div>
                            <div style="font-size: 12px; color: #374151;">${escapeHtml(participation.participant_name)}</div>
                            ${participation.is_completed ? '<div style="color: #10b981; margin-top: 4px;">✓</div>' : ''}
                        </div>
                    `;
                }
            } else {
                // Available unit
                if (isKuran) {
                    html += `
                        <div onclick="HatimManager.showClaimModal('${hatim.id}', ${hatim.current_round}, ${i}, '${unitLabel}')"
                             style="background: white; border: 2px dashed #cbd5e1; border-radius: 10px; padding: 12px; cursor: pointer; display: flex; align-items: center; justify-content: space-between; transition: all 0.2s;"
                             onmouseover="this.style.borderColor='#667eea'; this.style.background='#f0f4ff';"
                             onmouseout="this.style.borderColor='#cbd5e1'; this.style.background='white';">
                            <div>
                                <div style="font-weight: 600; color: #1e293b;">${i}. ${unitLabel}</div>
                                <div style="font-size: 12px; color: #64748b; margin: 4px 0;">${unitInfo?.icerik || ''}</div>
                            </div>
                            <div style="color: #667eea; font-weight: 500;">Sec →</div>
                        </div>
                    `;
                } else {
                    html += `
                        <div onclick="HatimManager.showClaimModal('${hatim.id}', ${hatim.current_round}, ${i}, '${unitLabel}')"
                             style="background: white; border: 2px dashed #cbd5e1; border-radius: 10px; padding: 12px; text-align: center; cursor: pointer; transition: all 0.2s;"
                             onmouseover="this.style.borderColor='#667eea'; this.style.background='#f0f4ff';"
                             onmouseout="this.style.borderColor='#cbd5e1'; this.style.background='white';">
                            <div style="font-weight: 600; color: #1e293b;">${i}. ${unitLabel}</div>
                            <div style="font-size: 12px; color: #667eea; margin-top: 6px;">Sec</div>
                        </div>
                    `;
                }
            }
        }

        html += `
                </div>

                <!-- Back button -->
                <button onclick="HatimManager.backToList()"
                        style="margin-top: 24px; padding: 12px 24px; background: #f1f5f9; color: #475569; border: none; border-radius: 8px; cursor: pointer; font-weight: 500; display: flex; align-items: center; gap: 8px;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                    Geri
                </button>
            </div>
        `;

        container.innerHTML = html;
    },

    backToList() {
        if (this.currentHatim && this.provider) {
            this.provider.unsubscribeFromHatim(this.currentHatim.id);
        }
        this.currentHatim = null;
        this.renderContent();
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
                                style="padding: 10px 20px; background: #f1f5f9; color: #475569; border: none; border-radius: 8px; cursor: pointer; font-weight: 500;">
                            Iptal
                        </button>
                        <button onclick="HatimManager.doClaim('${hatimId}', ${roundNumber}, ${unitNumber})"
                                style="padding: 10px 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 500;">
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

        try {
            await this.provider.claimUnit({
                hatimId,
                roundNumber,
                unitNumber,
                participantName
            });

            document.getElementById('claimModal')?.remove();
            showCustomAlert('Basariyla secildi!', 'success', 2000);

            // Refresh view
            this.refreshCurrentHatim();

        } catch (error) {
            console.error('Claim error:', error);
            showCustomAlert(error.message || 'Bir hata olustu', 'error', 2500);
        }
    },

    // ========================================
    // KURAN HATIM (Liste de base)
    // ========================================

    renderKuranHatim(container) {
        let html = `
            <div class="hatim-header">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 16px;">
                    <div>
                        <h3 style="display: flex; align-items: center; gap: 8px; margin: 0 0 4px;">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                            </svg>
                            Kur'an-i Kerim Hatmi
                        </h3>
                        <p style="color: #64748b; font-size: 14px; margin: 0;">Hatim olusturun veya mevcut bir hatime katilin</p>
                    </div>
                    <button onclick="HatimManager.showCreateModal('kuran')"
                            style="padding: 12px 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; display: flex; align-items: center; gap: 8px;">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Hatim Paylas
                    </button>
                </div>
            </div>

            <div class="hatim-table-container" style="margin-top: 16px; overflow-x: auto;">
                <table class="hatim-table" style="width: 100%; border-collapse: collapse; font-size: 14px;">
                    <thead>
                        <tr style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
                            <th style="padding: 12px 8px; text-align: center; border-radius: 8px 0 0 0;">Cuz</th>
                            <th style="padding: 12px 8px; text-align: center;">Sayfa</th>
                            <th style="padding: 12px 8px; text-align: left; border-radius: 0 8px 0 0;">Baslica Sureler ve Bolumler</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        KURAN_CUZLER.forEach((cuz, index) => {
            const bgColor = index % 2 === 0 ? '#f8fafc' : '#ffffff';
            html += `
                <tr style="background: ${bgColor}; border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 12px 8px; text-align: center; font-weight: 600; color: #667eea;">${cuz.cuz}. Cuz</td>
                    <td style="padding: 12px 8px; text-align: center; color: #64748b;">${cuz.sayfa}</td>
                    <td style="padding: 12px 8px; color: #334155;">${cuz.icerik}</td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
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
        let html = `
            <div class="hatim-header">
                <h3 style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                        <path d="M2 17l10 5 10-5"></path>
                        <path d="M2 12l10 5 10-5"></path>
                    </svg>
                    Dua Paylasimi
                </h3>
                <p style="color: #64748b; font-size: 14px;">Dua isteklerinizi paylasin</p>
            </div>

            <div class="dua-content" style="margin-top: 20px;">
                <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px; padding: 24px; text-align: center;">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#0369a1" stroke-width="1.5" style="margin-bottom: 12px;">
                        <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                        <path d="M2 17l10 5 10-5"></path>
                        <path d="M2 12l10 5 10-5"></path>
                    </svg>
                    <h4 style="color: #0369a1; margin-bottom: 8px;">Dua Paylasimi</h4>
                    <p style="color: #64748b; font-size: 14px; margin-bottom: 16px;">
                        Yakinlariniz icin dua talep edin veya dua listesine katilin
                    </p>
                    <p style="color: #94a3b8; font-size: 13px;">
                        (Paylasim mekanizmasi yakinda eklenecek)
                    </p>
                </div>
            </div>
        `;

        container.innerHTML = html;
    },

    // ========================================
    // CEVSEN HATIM
    // ========================================

    renderCevsenHatim(container) {
        let html = `
            <div class="hatim-header">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 16px;">
                    <div>
                        <h3 style="display: flex; align-items: center; gap: 8px; margin: 0 0 4px;">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <path d="M12 6v6l4 2"></path>
                            </svg>
                            Cevsen-i Kebir Hatmi
                        </h3>
                        <p style="color: #64748b; font-size: 14px; margin: 0;">100 bab paylasimi</p>
                    </div>
                    <button onclick="HatimManager.showCreateModal('cevsen')"
                            style="padding: 12px 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; display: flex; align-items: center; gap: 8px;">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Hatim Paylas
                    </button>
                </div>
            </div>

            <div class="cevsen-grid" style="margin-top: 16px; display: grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap: 8px;">
        `;

        for (let i = 1; i <= 100; i++) {
            html += `
                <div style="padding: 12px 8px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; text-align: center; font-weight: 500; color: #334155;">
                    ${i}. Bab
                </div>
            `;
        }

        html += `
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
