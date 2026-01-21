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

/**
 * Helper function to get page range for a cüz
 * @param {number} cuzNumber - Cuz number (1-30)
 * @param {number|null} halfPosition - null=full, 1=first half, 2=second half
 * @returns {Object} {start, end} page numbers
 */
function getCuzPageRange(cuzNumber, halfPosition = null) {
    if (cuzNumber < 1 || cuzNumber > 30) {
        return { start: 0, end: 0 };
    }

    const cuzInfo = KURAN_CUZLER[cuzNumber - 1];
    const startPage = cuzInfo.sayfa;

    // Calculate end page (next cuz start - 1, or 604 for last cuz)
    const nextCuzStart = cuzNumber < 30 ? KURAN_CUZLER[cuzNumber].sayfa : 605;
    const endPage = nextCuzStart - 1;

    // Calculate total pages and midpoint
    const totalPages = endPage - startPage + 1;
    const midPage = startPage + Math.floor(totalPages / 2) - 1;

    if (halfPosition === 1) {
        // First half: start to mid
        return { start: startPage, end: midPage };
    } else if (halfPosition === 2) {
        // Second half: mid+1 to end
        return { start: midPage + 1, end: endPage };
    }

    // Full cuz
    return { start: startPage, end: endPage };
}

const HatimManager = {
    currentView: 'kuran', // 'kuran', 'dua', 'cevsen'
    provider: null,
    currentHatim: null,
    _refreshTimeout: null, // Pour debouncing

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

    // Utilise window.escapeHtml de sanitizer.js
    escapeHtml(text) {
        return window.escapeHtml ? window.escapeHtml(text) : String(text || '');
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

        // Cleanup subscriptions on page unload
        window.addEventListener('beforeunload', () => {
            if (this.provider) {
                this.provider.unsubscribeAll();
            }
        });

        console.log('HatimManager initialise');
    },

    // Debounced refresh (max 1 refresh per 500ms)
    debouncedRefresh() {
        if (this._refreshTimeout) {
            clearTimeout(this._refreshTimeout);
        }
        this._refreshTimeout = setTimeout(() => {
            this.refreshCurrentHatim();
        }, 500);
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
            container.innerHTML = `
                <div style="text-align: center; padding: 20px; color: #94a3b8; font-size: 13px;">
                    Henüz hatim yok
                </div>
            `;
            return;
        }

        let html = `
            <div class="hatim-sidebar-list-header">
                <span>📚 Hatimlerim (${myHatims.length})</span>
                <button data-action="HatimManager.showManageHatimsModal()">⚙️</button>
            </div>
            <div class="hatim-sidebar-list-content">
        `;

        myHatims.forEach(h => {
            const typeLabel = h.type === 'kuran' ? "Kur'an Hatmi" : 'Cevşen Hatmi';
            const icon = h.type === 'kuran' ? '📖' : '🌙';
            const safeHCode = this.safeCode(h.code);
            const isActive = this.currentHatim && this.currentHatim.code === h.code;

            // Données enrichies
            const creatorName = h.creatorName ? this.escapeHtml(h.creatorName) : 'Anonim';
            const description = h.description ? this.escapeHtml(h.description) : '';
            const currentRound = h.currentRound || 1;

            // Deadline
            let deadlineHtml = '';
            if (h.deadline) {
                const deadlineDate = new Date(h.deadline);
                deadlineDate.setHours(23, 59, 59, 999);
                const now = new Date();
                const daysLeft = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));

                if (daysLeft < 0) {
                    deadlineHtml = `<span style="background: #fee2e2; color: #dc2626; padding: 2px 6px; border-radius: 4px; font-weight: 600;">⚠️ Süre doldu</span>`;
                } else if (daysLeft === 0) {
                    deadlineHtml = `<span style="background: #fef3c7; color: #d97706; padding: 2px 6px; border-radius: 4px; font-weight: 600;">📅 Bugün son!</span>`;
                } else if (daysLeft <= 3) {
                    deadlineHtml = `<span style="background: #fef3c7; color: #d97706; padding: 2px 6px; border-radius: 4px; font-weight: 600;">📅 ${daysLeft} gün</span>`;
                } else {
                    deadlineHtml = `<span>📅 ${deadlineDate.toLocaleDateString('tr-TR')}</span>`;
                }
            }

            html += `
                <div class="hatim-sidebar-item ${isActive ? 'active' : ''}"
                     data-action="HatimManager.openHatim('${safeHCode}')" tabindex="0">
                    <div class="hatim-sidebar-item-header">
                        <h4 style="margin: 0 0 4px; font-size: 15px; font-weight: 600;">${icon} ${typeLabel}</h4>
                        <span class="hatim-sidebar-item-code">${safeHCode}</span>
                    </div>
                    ${description ? `<p style="margin: 0 0 8px; font-size: 12px; color: #475569;">${description}</p>` : ''}
                    <div class="hatim-sidebar-item-meta">
                        <span>👤 ${creatorName}</span>
                        ${deadlineHtml}
                        <span>🔄 Tur ${currentRound}</span>
                    </div>
                </div>
            `;
        });

        html += `</div>`;
        container.innerHTML = html;
    },

    // ========================================
    // HATIM MANAGEMENT MODAL
    // ========================================

    async showManageHatimsModal() {
        if (!this.provider) {
            showCustomAlert('Bağlantı hatası', 'error', 2500);
            return;
        }

        const myDeviceId = this.provider.getDeviceId();
        const localHatims = this.provider.getMyHatims();
        let createdHatims = [];

        try {
            createdHatims = await this.provider.getMyCreatedHatims();
        } catch (error) {
            console.error('Error fetching created hatims:', error);
        }

        // Create a set of hatim codes that are confirmed as mine (from Supabase)
        const myCreatedCodes = new Set(createdHatims.map(h => h.code));

        // Merge: show all from Supabase + local ones not in Supabase
        const allHatims = [...createdHatims];
        localHatims.forEach(local => {
            if (!allHatims.find(h => h.code === local.code)) {
                allHatims.push({ ...local, localOnly: true });
            }
        });

        let listHtml = '';
        if (allHatims.length === 0) {
            listHtml = '<p style="color: #64748b; text-align: center; padding: 20px;">Henüz hatim bulunmuyor.</p>';
        } else {
            allHatims.forEach(h => {
                const typeLabel = h.type === 'kuran' ? "Kur'an Hatmi" : 'Cevşen Hatmi';
                const icon = h.type === 'kuran' ? '📖' : '🌙';
                // Only show delete button if we can confirm ownership via device_id match
                const isCreator = h.created_by_device === myDeviceId || myCreatedCodes.has(h.code);
                const safeHCode = this.safeCode(h.code);
                const safeHId = this.safeId(h.id);

                listHtml += `
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 8px;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <span style="font-size: 20px;">${icon}</span>
                            <div>
                                <div style="font-weight: 600; color: #1e293b; font-size: 14px;">${typeLabel}</div>
                                <div style="font-size: 11px; color: #64748b;">
                                    Kod: ${safeHCode}
                                    ${h.description ? ` • ${this.escapeHtml(h.description).substring(0, 30)}...` : ''}
                                </div>
                                ${h.localOnly ? '<span style="font-size: 10px; color: #f59e0b;">⚠️ Sadece yerel</span>' : ''}
                            </div>
                        </div>
                        <div style="display: flex; gap: 6px;">
                            ${isCreator ? `
                                <button data-action="HatimManager.confirmDeleteHatim('${safeHId}', '${safeHCode}')"
                                        style="padding: 6px 10px; background: #fee2e2; color: #dc2626; border: none; border-radius: 6px; cursor: pointer; font-size: 12px;">
                                    🗑️ Sil
                                </button>
                            ` : `
                                <button data-action="HatimManager.removeFromLocal('${safeHCode}')"
                                        style="padding: 6px 10px; background: #f1f5f9; color: #64748b; border: none; border-radius: 6px; cursor: pointer; font-size: 12px;">
                                    ✕ Listeden Çıkar
                                </button>
                            `}
                        </div>
                    </div>
                `;
            });
        }

        const html = `
            <div class="custom-modal-overlay" id="manageHatimsModal" data-action="closeModalOnOverlay(event)">
                <div class="custom-modal modern-modal" style="max-width: 500px;">
                    <div class="modal-header" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 12px 12px 0 0;">
                        <h3 style="margin: 0; display: flex; align-items: center; gap: 10px;">
                            <span style="font-size: 24px;">⚙️</span>
                            Hatim Yönetimi
                        </h3>
                    </div>
                    <div class="modal-body" style="padding: 20px; max-height: 60vh; overflow-y: auto;">
                        <p style="color: #64748b; margin-bottom: 16px; font-size: 13px;">
                            Oluşturduğunuz hatimleri silebilir veya katıldığınız hatimleri listeden çıkarabilirsiniz.
                        </p>
                        ${listHtml}
                    </div>
                    <div class="modal-footer" style="padding: 16px 20px; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end;">
                        <button data-action="closeModalById('manageHatimsModal')"
                                style="padding: 12px 20px; min-height: 44px; background: #f1f5f9; color: #475569; border: none; border-radius: 8px; cursor: pointer; font-weight: 500;">
                            Kapat
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', html);
    },

    confirmDeleteHatim(hatimId, code) {
        if (!confirm(`"${code}" kodlu hatimi silmek istediğinize emin misiniz?\n\nBu işlem geri alınamaz ve tüm katılımcıların verileri silinecektir.`)) {
            return;
        }

        this.deleteHatim(hatimId, code);
    },

    async deleteHatim(hatimId, code) {
        if (!this.provider) {
            showCustomAlert('Bağlantı hatası', 'error', 2500);
            return;
        }

        try {
            showCustomAlert('Hatim siliniyor...', 'info', 1500);
            await this.provider.deleteHatim(hatimId, code);
            showCustomAlert('Hatim başarıyla silindi!', 'success', 2000);

            // Refresh modal and list
            document.getElementById('manageHatimsModal')?.remove();
            this.showManageHatimsModal();
            this.renderMyHatimsList();
        } catch (error) {
            console.error('Delete hatim error:', error);
            showCustomAlert(error.message || 'Hatim silinemedi', 'error', 3000);
        }
    },

    removeFromLocal(code) {
        if (!this.provider) return;

        this.provider.removeHatimLocally(code);
        showCustomAlert('Hatim listeden çıkarıldı', 'info', 2000);

        // Refresh modal and list
        document.getElementById('manageHatimsModal')?.remove();
        this.showManageHatimsModal();
        this.renderMyHatimsList();
    },

    // ========================================
    // CREATION DE HATIM
    // ========================================

    showCreateModal(type = 'kuran') {
        const typeLabel = type === 'kuran' ? "Kur'an Hatmi" : 'Cevşen Hatmi';
        const totalUnits = type === 'kuran' ? 30 : 100;
        const unitLabel = type === 'kuran' ? 'Cüz' : 'Bab';
        const subtitle = type === 'kuran'
            ? "30 cüz'ü paylaşarak birlikte hatim yapın"
            : "100 bab'ı paylaşarak birlikte okuyun";
        const icon = type === 'kuran' ? '📖' : '🌙';

        const html = `
            <div class="custom-modal-overlay" id="createHatimModal" data-action="closeModalOnOverlay(event)">
                <div class="custom-modal modern-modal" style="max-width: 450px;">
                    <div class="modal-header" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 12px 12px 0 0;">
                        <h3 style="margin: 0 0 6px; display: flex; align-items: center; gap: 10px;">
                            <span style="font-size: 24px;">${icon}</span>
                            ${typeLabel} Oluştur
                        </h3>
                        <p style="margin: 0; font-size: 13px; opacity: 0.9;">${subtitle}</p>
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
                        <button data-action="closeModalById('createHatimModal')"
                                style="padding: 12px 20px; min-height: 44px; background: #f1f5f9; color: #475569; border: none; border-radius: 8px; cursor: pointer; font-weight: 500;">
                            Iptal
                        </button>
                        <button data-action="HatimManager.doCreateHatim('${type}')"
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

            // Save locally with full data
            this.provider.saveHatimLocally({
                id: result.id,
                code: result.code,
                type,
                creatorName,
                description,
                deadline,
                currentRound: 1,
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
                        <button data-action="HatimManager.shareVia('${safeCodeVal}', '${safeType}')"
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
                        <button data-action="HatimManager.copyShareLink('${this.escapeHtml(shareUrl)}')"
                                style="width: 100%; padding: 12px; background: #f1f5f9; color: #475569; border: none; border-radius: 8px; cursor: pointer; font-weight: 500;">
                            Linki Kopyala
                        </button>
                        <button data-action="closeModalById('shareHatimModal'); HatimManager.openHatim('${safeCodeVal}')"
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

    toggleJoinInput() {
        const container = document.getElementById('hatimJoinInputContainer');
        if (container) {
            const isVisible = container.style.display !== 'none';
            container.style.display = isVisible ? 'none' : 'flex';
            if (!isVisible) {
                const input = container.querySelector('input');
                if (input) {
                    input.focus();
                    input.value = '';
                }
            }
        }
    },

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

            // Save locally with full data
            this.provider.saveHatimLocally({
                id: hatim.id,
                code: hatim.code,
                type: hatim.type,
                creatorName: hatim.creator_name,
                description: hatim.description,
                deadline: hatim.deadline,
                currentRound: hatim.current_round,
                isCreator: false
            });

            // Subscribe to real-time updates (with debouncing)
            this.provider.subscribeToHatim(hatim.id, () => {
                this.debouncedRefresh();
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
            console.log('Refreshing hatim, current round was:', this.currentHatim.current_round);
            const hatim = await this.provider.getHatimByCode(this.currentHatim.code);
            console.log('Fetched hatim, new round:', hatim.current_round, 'participations:', hatim.participations?.length);
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

        // Empêcher les doubles-clics
        if (this._startingNewRound) {
            return;
        }

        // Sauvegarder le round actuel pour la vérification optimiste
        const expectedRound = this.currentHatim?.current_round;

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

        this._startingNewRound = true;

        try {
            const newRound = await this.provider.startNewRound(hatimId, expectedRound);
            showCustomAlert(`🎉 Tur ${newRound} başlatıldı!`, 'success', 2500);
            await this.refreshCurrentHatim();
        } catch (error) {
            console.error('Start new round error:', error);
            // Si race condition détectée, rafraîchir automatiquement
            if (error.message && error.message.includes('zaten başlatılmış')) {
                showCustomAlert('ℹ️ Tur zaten başlatılmış. Sayfa güncelleniyor...', 'info', 2500);
                await this.refreshCurrentHatim();
            } else {
                showCustomAlert(error.message || 'Yeni tur başlatılamadı', 'error', 2500);
            }
        } finally {
            this._startingNewRound = false;
        }
    },

    /**
     * Mark hatim as finished (no more rounds)
     */
    async finishHatim(hatimId) {
        // Just show a confirmation that the hatim is finished
        // The hatim stays on current round, people can still mark as read
        const modal = document.createElement('div');
        modal.innerHTML = `
            <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 10000; display: flex; align-items: center; justify-content: center;">
                <div style="background: white; padding: 24px; border-radius: 16px; max-width: 320px; margin: 20px; text-align: center;">
                    <div style="font-size: 40px; margin-bottom: 12px;">✅</div>
                    <h3 style="margin: 0 0 12px; color: #1f2937;">Hatim Paylaşımı Tamamlandı</h3>
                    <p style="margin: 0 0 20px; color: #6b7280; font-size: 14px;">
                        Yeni tur açılmayacak. Katılımcılar okuma durumlarını güncellemeye devam edebilir.
                    </p>
                    <button data-action="closeFixedParent(event)" style="width: 100%; padding: 12px; background: #10b981; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                        Tamam
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        showCustomAlert('✅ Hatim paylaşımı tamamlandı', 'success', 2500);
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

        // Map unit_number to array of participations (for half cüz support)
        const claimedMap = new Map();
        participations.forEach(p => {
            if (!claimedMap.has(p.unit_number)) {
                claimedMap.set(p.unit_number, []);
            }
            claimedMap.get(p.unit_number).push(p);
        });

        // Store for use by showClaimModal
        this.currentParticipations = participations;

        const isKuran = hatim.type === 'kuran';
        const totalUnits = isKuran ? 30 : 100;
        const unitLabel = isKuran ? 'Cüz' : 'Bab';

        // Progress - count full units as 1, halves as 0.5
        let claimedUnits = 0;
        let completedUnits = 0;
        participations.forEach(p => {
            const weight = p.half_position ? 0.5 : 1;
            claimedUnits += weight;
            if (p.is_completed) completedUnits += weight;
        });
        const claimed = Math.floor(claimedUnits);
        const completed = Math.floor(completedUnits);
        const available = totalUnits - Math.ceil(claimedUnits);
        const progressPercent = Math.round((claimed / totalUnits) * 100);
        const allCompleted = completed === totalUnits; // All units READ, not just claimed

        // Current user's device ID
        const myDeviceId = this.provider.getDeviceId();

        // Check if current user is the creator
        const isCreator = hatim.created_by_device === myDeviceId;

        // Deadline status (only need 'passed' for warning)
        let deadlineStatus = null;
        if (hatim.deadline) {
            const deadlineDate = new Date(hatim.deadline);
            deadlineDate.setHours(23, 59, 59, 999);
            const now = new Date();
            const daysLeft = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));

            if (daysLeft < 0) {
                deadlineStatus = 'passed';
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

        let html = `
            <div class="hatim-participation-view">

                <!-- Deadline warning -->
                ${deadlineStatus === 'passed' ? `
                <div style="padding: 12px 16px; background: #fee2e2; border: 1px solid #fecaca; border-radius: 10px; margin-bottom: 16px;">
                    <span style="color: #dc2626; font-weight: 600;">⚠️ Son tarih geçti. Yeni katılım kabul edilmiyor.</span>
                </div>
                ` : ''}

                <!-- Active Previous Rounds (with uncompleted readings) - Will be populated by JS -->
                <div id="activePreviousRoundsContainer"></div>

                <!-- Completed Previous Rounds History -->
                ${hatim.current_round > 1 ? `
                <details class="hatim-previous-rounds" id="completedRoundsSection" style="display: none;">
                    <summary>
                        <svg class="details-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                        <span>🏆</span> Tamamlanan Turlar
                        <span style="font-weight: 400; font-size: 11px; color: #166534; margin-left: auto;" id="completedRoundsCount"></span>
                    </summary>
                    <div id="completedRoundsContainer" style="padding: 16px;">
                        <p style="color: #166534; font-size: 13px; margin: 0;">Yükleniyor...</p>
                    </div>
                </details>
                ` : ''}

                <!-- CARD 4: Actions -->
                <div class="hatim-actions">
                    <button data-action="HatimManager.shareVia('${safeCode(hatim.code)}', '${hatim.type === 'cevsen' ? 'cevsen' : 'kuran'}')"
                            class="hatim-btn hatim-btn-success">
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
                <details open class="hatim-grid-section">
                    <summary>
                        <svg class="details-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                        <span>📋</span> ${unitLabel} Seç ${hatim.current_round > 1 ? `<span style="font-weight: 600; color: #667eea; font-size: 11px; background: rgba(102,126,234,0.1); padding: 2px 6px; border-radius: 4px; margin-left: 4px;">Tur ${hatim.current_round}</span>` : ''}<span style="font-weight: 400; color: #64748b; font-size: 12px; margin-left: 6px;">(${available} müsait)</span>
                    </summary>

                    <!-- Progress -->
                    <div class="hatim-progress">
                        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                            <div class="hatim-progress-bar">
                                <div style="width: ${progressPercent}%; height: 100%; background: linear-gradient(90deg, #667eea, #764ba2); transition: width 0.3s;"></div>
                            </div>
                            <span style="font-weight: 600; color: #334155; font-size: 14px;">${progressPercent}%</span>
                        </div>
                        <div style="display: flex; flex-wrap: wrap; gap: 24px; font-size: 13px; color: #64748b;">
                            <span>📋 ${claimed} alındı</span>
                            <span>✅ ${completed} okundu</span>
                            <span>⏳ ${available} müsait</span>
                        </div>
                        ${available === 0 && isCreator ? `
                        <div style="margin-top: 12px; padding: 12px; background: #eff6ff; border-radius: 8px; border: 1px solid #3b82f6;">
                            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                                <span style="font-size: 20px;">📋</span>
                                <span style="font-weight: 600; color: #1e40af;">Tüm ${unitLabel}ler dağıtıldı!</span>
                            </div>
                            <p style="margin: 0 0 12px; font-size: 13px; color: #1e40af;">${completed}/${totalUnits} okundu. Paylaşıma devam etmek ister misiniz?</p>
                            <div style="display: flex; gap: 8px;">
                                <button data-action="HatimManager.startNewRound('${safeId(hatim.id)}')"
                                        style="flex: 1; padding: 12px; background: #3b82f6; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 14px;">
                                    🔄 Devam (Tur ${hatim.current_round + 1})
                                </button>
                                <button data-action="HatimManager.finishHatim('${safeId(hatim.id)}')"
                                        style="flex: 1; padding: 12px; background: #6b7280; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 14px;">
                                    ✓ Bitti
                                </button>
                            </div>
                        </div>
                        ` : ''}
                    </div>

                    <div class="hatim-grid-content">
                        <div class="hatim-cuz-grid ${isKuran ? '' : 'cevsen'}">
        `;

        // Helper to render a half cell
        const renderHalfCell = (p, halfNum, unitNum, pageRange, isMine) => {
            const halfLabel = halfNum === 1 ? 'İlk' : 'Son';
            if (p) {
                const isCompleted = p.is_completed;
                const cellClass = isMine ? `mine ${isCompleted ? 'read' : 'reading'}` : (isCompleted ? 'completed' : 'taken');
                return `
                    <div class="hatim-half-cell ${cellClass}"
                         ${isMine ? `data-action="HatimManager.toggleReadStatus('${safeId(p.id)}', ${!!isCompleted}, ${unitNum})"` : ''}
                         title="${escapeHtml(p.participant_name)}">
                        <div class="hatim-half-label">${halfLabel} 10</div>
                        <div class="hatim-half-pages">S. ${pageRange.start}-${pageRange.end}</div>
                        <div class="hatim-half-name">${escapeHtml(p.participant_name).substring(0, 8)}</div>
                        <div class="hatim-half-status ${isCompleted ? 'completed' : ''}">${isCompleted ? '✓' : '...'}</div>
                        ${isMine ? `<button class="hatim-half-release" data-action="releaseHatimUnit('${safeId(p.id)}', ${unitNum}, event)" title="Vazgeç">✕</button>` : ''}
                    </div>
                `;
            } else {
                // Available half
                if (deadlineStatus === 'passed') {
                    return `
                        <div class="hatim-half-cell" style="opacity: 0.5; cursor: not-allowed;">
                            <div class="hatim-half-label">${halfLabel} 10</div>
                            <div class="hatim-half-pages">S. ${pageRange.start}-${pageRange.end}</div>
                            <div class="hatim-half-status">-</div>
                        </div>
                    `;
                }
                return `
                    <div class="hatim-half-cell available"
                         data-action="HatimManager.showClaimModal('${safeId(hatim.id)}', ${parseInt(hatim.current_round) || 1}, ${unitNum}, '${unitLabel}')"
                         tabindex="0" role="button">
                        <div class="hatim-half-label">${halfLabel} 10</div>
                        <div class="hatim-half-pages">S. ${pageRange.start}-${pageRange.end}</div>
                        <div class="hatim-half-status available-text">Müsait</div>
                    </div>
                `;
            }
        };

        // Render units as numbered grid
        for (let i = 1; i <= totalUnits; i++) {
            const unitParticipations = claimedMap.get(i) || [];
            // Get cüz content info (only for kuran)
            const cuzInfo = isKuran && i <= 30 ? KURAN_CUZLER[i - 1] : null;
            const contentText = cuzInfo ? cuzInfo.icerik : '';
            const fullPageRange = getCuzPageRange(i, null);
            const pageText = cuzInfo ? `Sayfa ${fullPageRange.start}-${fullPageRange.end}` : '';

            // Check if any participation is a full claim (half_position = null/undefined)
            // Use == for null check (catches both null and undefined)
            // Use == for half position check (handles string "1" vs number 1)
            const fullClaim = unitParticipations.find(p => p.half_position == null);
            const firstHalf = unitParticipations.find(p => p.half_position == 1);
            const secondHalf = unitParticipations.find(p => p.half_position == 2);
            const hasHalfClaims = firstHalf || secondHalf;

            if (fullClaim) {
                // Full cüz taken - render as single cell
                const isMine = fullClaim.device_id === myDeviceId;
                const isCompleted = fullClaim.is_completed;

                if (isMine) {
                    const statusClass = isCompleted ? 'read' : 'reading';
                    html += `
                        <div class="hatim-cuz-cell mine ${statusClass}"
                             data-action="HatimManager.toggleReadStatus('${safeId(fullClaim.id)}', ${!!isCompleted}, ${i})"
                             tabindex="0" role="button"
                             aria-label="${unitLabel} ${i} - ${isCompleted ? 'Okundu' : 'Okuyor'}">
                            <div class="hatim-cuz-header">
                                <span class="hatim-cuz-number">${i}</span>
                                <span class="hatim-cuz-name">${escapeHtml(fullClaim.participant_name).substring(0, 10)}</span>
                                <span class="hatim-cuz-status ${isCompleted ? 'completed' : 'reading'}">${isCompleted ? '✓' : 'Okunuyor..'}</span>
                            </div>
                            ${contentText ? `<span class="hatim-cuz-content">${contentText}</span>` : ''}
                            <div class="hatim-cuz-footer">
                                ${pageText ? `<span class="hatim-cuz-page">${pageText}</span>` : ''}
                                <button class="hatim-cuz-release" data-action="releaseHatimUnit('${safeId(fullClaim.id)}', ${i}, event)" title="Vazgeç">✕</button>
                            </div>
                        </div>
                    `;
                } else {
                    const cellClass = isCompleted ? 'completed' : 'taken';
                    const statusText = isCompleted ? '✓' : 'Okunuyor..';
                    html += `
                        <div class="hatim-cuz-cell ${cellClass}" title="${escapeHtml(fullClaim.participant_name)}">
                            <div class="hatim-cuz-header">
                                <span class="hatim-cuz-number">${i}</span>
                                <span class="hatim-cuz-name">${escapeHtml(fullClaim.participant_name).substring(0, 10)}</span>
                                <span class="hatim-cuz-status ${isCompleted ? 'completed' : 'reading'}">${statusText}</span>
                            </div>
                            ${contentText ? `<span class="hatim-cuz-content">${contentText}</span>` : ''}
                            <div class="hatim-cuz-footer">
                                ${pageText ? `<span class="hatim-cuz-page">${pageText}</span>` : ''}
                            </div>
                        </div>
                    `;
                }
            } else if (hasHalfClaims) {
                // Split cell - at least one half is claimed
                const firstHalfRange = getCuzPageRange(i, 1);
                const secondHalfRange = getCuzPageRange(i, 2);
                const isFirstMine = firstHalf && firstHalf.device_id === myDeviceId;
                const isSecondMine = secondHalf && secondHalf.device_id === myDeviceId;

                html += `
                    <div class="hatim-cuz-cell split">
                        <div class="hatim-cuz-header">
                            <span class="hatim-cuz-number">${i}</span>
                            <span class="hatim-cuz-name">${contentText || unitLabel}</span>
                        </div>
                        <div class="hatim-split-container">
                            ${renderHalfCell(firstHalf, 1, i, firstHalfRange, isFirstMine)}
                            ${renderHalfCell(secondHalf, 2, i, secondHalfRange, isSecondMine)}
                        </div>
                    </div>
                `;
            } else {
                // Available - clickable (unless deadline passed)
                if (deadlineStatus === 'passed') {
                    html += `
                        <div class="hatim-cuz-cell" style="opacity: 0.6; cursor: not-allowed; border-style: dashed;">
                            <div class="hatim-cuz-header">
                                <span class="hatim-cuz-number" style="color: #94a3b8;">${i}</span>
                            </div>
                            ${contentText ? `<span class="hatim-cuz-content">${contentText}</span>` : ''}
                            ${pageText ? `<div class="hatim-cuz-footer"><span class="hatim-cuz-page">${pageText}</span></div>` : ''}
                        </div>
                    `;
                } else {
                    html += `
                        <div class="hatim-cuz-cell available"
                             data-action="HatimManager.showClaimModal('${safeId(hatim.id)}', ${parseInt(hatim.current_round) || 1}, ${i}, '${unitLabel}')"
                             onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();HatimManager.showClaimModal('${safeId(hatim.id)}', ${parseInt(hatim.current_round) || 1}, ${i}, '${unitLabel}');}"
                             tabindex="0" role="button" aria-label="${unitLabel} ${i} seç">
                            <div class="hatim-cuz-header">
                                <span class="hatim-cuz-number" style="color: #667eea;">${i}</span>
                            </div>
                            ${contentText ? `<span class="hatim-cuz-content">${contentText}</span>` : ''}
                            ${pageText ? `<div class="hatim-cuz-footer"><span class="hatim-cuz-page">${pageText}</span></div>` : ''}
                        </div>
                    `;
                }
            }
        }

        html += `
                        </div>
                        <div class="hatim-legend">
                            <span class="hatim-legend-item"><span class="hatim-legend-color available"></span> Müsait</span>
                            <span class="hatim-legend-item"><span class="hatim-legend-color taken"></span> Alındı</span>
                            <span class="hatim-legend-item"><span class="hatim-legend-color completed"></span> Tamamlandı</span>
                            <span class="hatim-legend-item"><span class="hatim-legend-color mine"></span> Benim</span>
                        </div>
                        ${available > 1 && deadlineStatus !== 'passed' ? `
                        <button data-action="HatimManager.showMultiClaimModal('${safeId(hatim.id)}', ${parseInt(hatim.current_round) || 1}, ${totalUnits}, '${unitLabel}')"
                                class="hatim-btn hatim-btn-multi" style="width: 100%;">
                            <span>☑️</span> Çoklu Seçim (${available} müsait)
                        </button>
                        ` : ''}
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
            showCustomAlert('❌ Sunucuya bağlanılamadı. Sayfayı yenileyin.', 'error', 3000);
            return;
        }

        // Déterminer le label correct (Cüz ou Bab)
        const unitLabel = this.currentHatim?.type === 'cevsen' ? 'Bab' : 'Cüz';

        if (isCurrentlyCompleted) {
            // Already read - show options: mark as unread OR release
            this.showUnreadOptionsModal(participationId, unitNumber, unitLabel);
        } else {
            // Not read - confirm to mark as read
            this.showConfirmModal(
                `${unitNumber}. ${unitLabel}'ü "Okundu" olarak işaretlemek istiyor musunuz?`,
                'Okundu ✓',
                async () => {
                    try {
                        await this.provider.markComplete(participationId);
                        showCustomAlert('✓ Okundu olarak işaretlendi!', 'success', 2000);
                        await this.refreshCurrentHatim();
                    } catch (error) {
                        console.error('Mark complete error:', error);
                        // If participation not found, refresh automatically
                        if (error.message === 'Katılım bulunamadı') {
                            showCustomAlert('⚠️ Katılım bulunamadı. Veriler güncelleniyor...', 'warning', 2500);
                            await this.refreshCurrentHatim();
                        } else {
                            showCustomAlert('❌ Durum güncellenemedi. İnternet bağlantınızı kontrol edin.', 'error', 3000);
                        }
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
            showCustomAlert('❌ Sunucuya bağlanılamadı. Sayfayı yenileyin.', 'error', 3000);
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
                    await this.refreshCurrentHatim();
                } catch (error) {
                    console.error('Release unit error:', error);
                    showCustomAlert('❌ Vazgeçme işlemi başarısız. İnternet bağlantınızı kontrol edin.', 'error', 3000);
                }
            }
        );
    },

    async loadPreviousRounds(hatimId, currentRound, totalUnits, unitLabel) {
        const activeContainer = document.getElementById('activePreviousRoundsContainer');
        const completedSection = document.getElementById('completedRoundsSection');
        const completedContainer = document.getElementById('completedRoundsContainer');
        const completedCountSpan = document.getElementById('completedRoundsCount');

        if (!activeContainer || !this.provider) return;

        // Helper function for safe ID
        const safeId = (id) => {
            if (!id) return '';
            return String(id).replace(/[^a-f0-9-]/gi, '').substring(0, 36);
        };

        try {
            const myDeviceId = this.provider.getDeviceId();
            const isKuran = this.currentHatim?.type === 'kuran';

            // Get all previous rounds participations
            const roundsMap = await this.provider.getAllPreviousRoundsParticipations(hatimId, currentRound);
            const roundNumbers = Object.keys(roundsMap).map(Number).sort((a, b) => b - a);

            if (roundNumbers.length === 0) {
                activeContainer.innerHTML = '';
                return;
            }

            // Separate rounds into active (uncompleted) and completed
            const activeRounds = [];
            const completedRounds = [];

            for (const round of roundNumbers) {
                const participations = roundsMap[round] || [];
                const completedCount = participations.filter(p => p.is_completed).length;
                const isRoundComplete = completedCount === totalUnits;

                if (isRoundComplete) {
                    completedRounds.push({ round, participations });
                } else {
                    activeRounds.push({ round, participations });
                }
            }

            // Render ACTIVE rounds as full grid sections (like current round)
            let activeHtml = '';
            for (const { round, participations } of activeRounds) {
                // Map unit_number to array of participations (for half cüz support)
                const claimedMap = new Map();
                participations.forEach(p => {
                    if (!claimedMap.has(p.unit_number)) {
                        claimedMap.set(p.unit_number, []);
                    }
                    claimedMap.get(p.unit_number).push(p);
                });

                // Count units (half = 0.5)
                let claimedUnits = 0;
                let completedUnits = 0;
                participations.forEach(p => {
                    const weight = p.half_position ? 0.5 : 1;
                    claimedUnits += weight;
                    if (p.is_completed) completedUnits += weight;
                });
                const claimed = Math.floor(claimedUnits);
                const completed = Math.floor(completedUnits);
                const available = totalUnits - Math.ceil(claimedUnits);
                const progressPercent = Math.round((claimed / totalUnits) * 100);

                activeHtml += `
                    <details open class="hatim-grid-section" style="border-color: #f59e0b; background: linear-gradient(to bottom, #fffbeb, white);">
                        <summary style="background: #fef3c7;">
                            <svg class="details-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="9 18 15 12 9 6"></polyline>
                            </svg>
                            <span>📖</span> ${unitLabel} Seç
                            <span style="font-weight: 600; color: #d97706; font-size: 11px; background: rgba(217,119,6,0.15); padding: 2px 6px; border-radius: 4px; margin-left: 4px;">Tur ${round} - Devam ediyor</span>
                            <span style="font-weight: 400; color: #92400e; font-size: 12px; margin-left: 6px;">(${completed}/${claimed} okundu)</span>
                        </summary>

                        <div class="hatim-progress">
                            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                                <div class="hatim-progress-bar" style="background: #fef3c7;">
                                    <div style="width: ${Math.round((completed / totalUnits) * 100)}%; height: 100%; background: linear-gradient(90deg, #f59e0b, #d97706); transition: width 0.3s;"></div>
                                </div>
                                <span style="font-weight: 600; color: #92400e; font-size: 14px;">${Math.round((completed / totalUnits) * 100)}%</span>
                            </div>
                            <div style="display: flex; flex-wrap: wrap; gap: 24px; font-size: 13px; color: #92400e;">
                                <span>📋 ${claimed} alındı</span>
                                <span>✅ ${completed} okundu</span>
                                <span>⏳ ${totalUnits - completed} bekliyor</span>
                            </div>
                        </div>

                        <div class="hatim-grid-content">
                            <div class="hatim-cuz-grid ${isKuran ? '' : 'cevsen'}">
                `;

                // Render each cell (with half cüz support)
                for (let i = 1; i <= totalUnits; i++) {
                    const unitParticipations = claimedMap.get(i) || [];
                    const cuzInfo = isKuran && i <= 30 ? KURAN_CUZLER[i - 1] : null;
                    const contentText = cuzInfo ? cuzInfo.icerik : '';
                    const fullPageRange = getCuzPageRange(i, null);
                    const pageText = cuzInfo ? `Sayfa ${fullPageRange.start}-${fullPageRange.end}` : '';

                    const fullClaim = unitParticipations.find(p => p.half_position == null);
                    const firstHalf = unitParticipations.find(p => p.half_position == 1);
                    const secondHalf = unitParticipations.find(p => p.half_position == 2);
                    const hasHalfClaims = firstHalf || secondHalf;

                    if (fullClaim) {
                        const isMine = fullClaim.device_id === myDeviceId;
                        const isCompleted = fullClaim.is_completed;

                        if (isMine) {
                            const statusClass = isCompleted ? 'read' : 'reading';
                            activeHtml += `
                                <div class="hatim-cuz-cell mine ${statusClass}"
                                     data-action="HatimManager.toggleReadStatus('${safeId(fullClaim.id)}', ${!!isCompleted}, ${i})"
                                     tabindex="0" role="button"
                                     aria-label="${unitLabel} ${i} - ${isCompleted ? 'Okundu' : 'Okuyor'}">
                                    <div class="hatim-cuz-header">
                                        <span class="hatim-cuz-number">${i}</span>
                                        <span class="hatim-cuz-name">${this.escapeHtml(fullClaim.participant_name).substring(0, 10)}</span>
                                        <span class="hatim-cuz-status ${isCompleted ? 'completed' : 'reading'}">${isCompleted ? '✓' : 'Okunuyor..'}</span>
                                    </div>
                                    ${contentText ? `<span class="hatim-cuz-content">${contentText}</span>` : ''}
                                    <div class="hatim-cuz-footer">
                                        ${pageText ? `<span class="hatim-cuz-page">${pageText}</span>` : ''}
                                        <button class="hatim-cuz-release" data-action="releaseHatimUnit('${safeId(fullClaim.id)}', ${i}, event)" title="Vazgeç">✕</button>
                                    </div>
                                </div>
                            `;
                        } else {
                            const cellClass = isCompleted ? 'completed' : 'taken';
                            const statusText = isCompleted ? '✓' : 'Okunuyor..';
                            activeHtml += `
                                <div class="hatim-cuz-cell ${cellClass}" title="${this.escapeHtml(fullClaim.participant_name)}">
                                    <div class="hatim-cuz-header">
                                        <span class="hatim-cuz-number">${i}</span>
                                        <span class="hatim-cuz-name">${this.escapeHtml(fullClaim.participant_name).substring(0, 10)}</span>
                                        <span class="hatim-cuz-status ${isCompleted ? 'completed' : 'reading'}">${statusText}</span>
                                    </div>
                                    ${contentText ? `<span class="hatim-cuz-content">${contentText}</span>` : ''}
                                    <div class="hatim-cuz-footer">
                                        ${pageText ? `<span class="hatim-cuz-page">${pageText}</span>` : ''}
                                    </div>
                                </div>
                            `;
                        }
                    } else if (hasHalfClaims) {
                        // Split cell for previous rounds - simplified view
                        const renderPrevHalf = (p, halfNum) => {
                            const halfLabel = halfNum === 1 ? 'İlk' : 'Son';
                            const halfRange = getCuzPageRange(i, halfNum);
                            if (p) {
                                const isMine = p.device_id === myDeviceId;
                                const isCompleted = p.is_completed;
                                const cellClass = isMine ? `mine ${isCompleted ? 'read' : 'reading'}` : (isCompleted ? 'completed' : 'taken');
                                return `
                                    <div class="hatim-half-cell ${cellClass}"
                                         ${isMine ? `data-action="HatimManager.toggleReadStatus('${safeId(p.id)}', ${!!isCompleted}, ${i})"` : ''}
                                         title="${this.escapeHtml(p.participant_name)}">
                                        <div class="hatim-half-label">${halfLabel}</div>
                                        <div class="hatim-half-pages">S.${halfRange.start}-${halfRange.end}</div>
                                        <div class="hatim-half-name">${this.escapeHtml(p.participant_name).substring(0, 8)}</div>
                                        <div class="hatim-half-status ${isCompleted ? 'completed' : ''}">${isCompleted ? '✓' : '...'}</div>
                                        ${isMine ? `<button class="hatim-half-release" data-action="releaseHatimUnit('${safeId(p.id)}', ${i}, event)" title="Vazgeç">✕</button>` : ''}
                                    </div>
                                `;
                            }
                            return `
                                <div class="hatim-half-cell" style="opacity: 0.5;">
                                    <div class="hatim-half-label">${halfLabel}</div>
                                    <div class="hatim-half-pages">S.${halfRange.start}-${halfRange.end}</div>
                                    <div class="hatim-half-status">-</div>
                                </div>
                            `;
                        };

                        activeHtml += `
                            <div class="hatim-cuz-cell split">
                                <div class="hatim-cuz-header">
                                    <span class="hatim-cuz-number">${i}</span>
                                    <span class="hatim-cuz-name">${contentText || unitLabel}</span>
                                </div>
                                <div class="hatim-split-container">
                                    ${renderPrevHalf(firstHalf, 1)}
                                    ${renderPrevHalf(secondHalf, 2)}
                                </div>
                            </div>
                        `;
                    } else {
                        // Not claimed in this round - show as empty/unavailable
                        activeHtml += `
                            <div class="hatim-cuz-cell" style="opacity: 0.5; border-style: dashed; background: #f8fafc;">
                                <div class="hatim-cuz-header">
                                    <span class="hatim-cuz-number" style="color: #94a3b8;">${i}</span>
                                </div>
                                ${contentText ? `<span class="hatim-cuz-content" style="color: #94a3b8;">${contentText}</span>` : ''}
                                ${pageText ? `<div class="hatim-cuz-footer"><span class="hatim-cuz-page" style="color: #94a3b8;">${pageText}</span></div>` : ''}
                            </div>
                        `;
                    }
                }

                activeHtml += `
                            </div>
                            <div class="hatim-legend">
                                <span class="hatim-legend-item"><span class="hatim-legend-color taken"></span> Alındı</span>
                                <span class="hatim-legend-item"><span class="hatim-legend-color completed"></span> Tamamlandı</span>
                                <span class="hatim-legend-item"><span class="hatim-legend-color mine"></span> Benim</span>
                            </div>
                        </div>
                    </details>
                `;
            }
            activeContainer.innerHTML = activeHtml;

            // Render COMPLETED rounds in the collapsible history section
            if (completedRounds.length > 0 && completedSection && completedContainer) {
                completedSection.style.display = 'block';
                if (completedCountSpan) {
                    completedCountSpan.textContent = `${completedRounds.length} tur`;
                }

                let completedHtml = '';
                for (const { round, participations } of completedRounds) {
                    const myInThisRound = participations.filter(p => p.device_id === myDeviceId);

                    completedHtml += `
                        <div style="margin-bottom: 12px; padding: 12px; background: #f0fdf4; border-radius: 8px; border: 2px solid #10b981;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                <span style="font-weight: 600; color: #166534;">✅ Tur ${round}</span>
                                <span style="font-size: 12px; color: #166534; font-weight: 500;">Tamamlandı</span>
                            </div>
                            <div style="display: grid; grid-template-columns: repeat(${totalUnits <= 30 ? 5 : 7}, 1fr); gap: 4px;">
                    `;

                    for (let i = 1; i <= totalUnits; i++) {
                        const p = participations.find(x => x.unit_number === i);
                        const isMine = p && p.device_id === myDeviceId;
                        const cellBgColor = isMine ? '#dbeafe' : '#dcfce7';
                        const cellBorderColor = isMine ? '#3b82f6' : '#10b981';
                        const textColor = isMine ? '#1e40af' : '#166534';
                        const name = p ? this.escapeHtml(p.participant_name).substring(0, 8) : '';

                        completedHtml += `
                            <div style="padding: 6px 4px; display: flex; flex-direction: column; align-items: center; justify-content: center; background: ${cellBgColor}; border: 1px solid ${cellBorderColor}; border-radius: 4px; min-height: 40px;">
                                <span style="font-size: 11px; font-weight: 700; color: ${textColor};">${i}</span>
                                <span style="font-size: 8px; color: ${textColor}; text-align: center; line-height: 1.1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 100%;">${name}</span>
                            </div>
                        `;
                    }

                    completedHtml += `
                            </div>
                            ${myInThisRound.length > 0 ? `
                            <div style="margin-top: 8px; font-size: 11px; color: #1e40af; font-weight: 500;">
                                🙋 Benim: ${myInThisRound.map(p => `${unitLabel} ${p.unit_number}`).join(', ')}
                            </div>
                            ` : ''}
                        </div>
                    `;
                }
                completedContainer.innerHTML = completedHtml;
            } else if (completedSection) {
                completedSection.style.display = 'none';
            }

        } catch (error) {
            console.error('Load previous rounds error:', error);
            activeContainer.innerHTML = '<p style="color: #dc2626; font-size: 13px; margin: 0;">Yüklenemedi.</p>';
        }
    },

    showConfirmModal(message, confirmText, onConfirm) {
        const html = `
            <div class="custom-modal-overlay" id="confirmModal" data-action="closeModalOnOverlay(event)">
                <div class="custom-modal modern-modal" style="max-width: 340px;">
                    <div class="modal-body" style="padding: 24px; text-align: center;">
                        <div style="font-size: 40px; margin-bottom: 12px;">📖</div>
                        <p style="margin: 0; color: #334155; font-size: 15px;">${message}</p>
                    </div>
                    <div class="modal-footer" style="padding: 16px 20px; border-top: 1px solid #e2e8f0; display: flex; gap: 10px; justify-content: center;">
                        <button data-action="closeModalById('confirmModal')"
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

    /**
     * Show modal with options: mark as unread OR release unit
     */
    showUnreadOptionsModal(participationId, unitNumber, unitLabel) {
        const html = `
            <div class="custom-modal-overlay" id="unreadOptionsModal" data-action="closeModalOnOverlay(event)">
                <div class="custom-modal modern-modal" style="max-width: 360px;">
                    <div class="modal-body" style="padding: 24px; text-align: center;">
                        <div style="font-size: 40px; margin-bottom: 12px;">📖</div>
                        <p style="margin: 0 0 8px; color: #334155; font-size: 15px; font-weight: 600;">${unitNumber}. ${unitLabel}</p>
                        <p style="margin: 0; color: #64748b; font-size: 13px;">Ne yapmak istiyorsunuz?</p>
                    </div>
                    <div class="modal-footer" style="padding: 16px 20px; border-top: 1px solid #e2e8f0; display: flex; flex-direction: column; gap: 10px;">
                        <button id="markUnreadBtn"
                                style="padding: 14px 20px; min-height: 48px; background: #fef3c7; color: #92400e; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 8px;">
                            ↩️ Okunmadı olarak işaretle
                        </button>
                        <button id="releaseUnitBtn"
                                style="padding: 14px 20px; min-height: 48px; background: #fee2e2; color: #dc2626; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 8px;">
                            ✕ Vazgeç (başkalarına aç)
                        </button>
                        <button data-action="closeModalById('unreadOptionsModal')"
                                style="padding: 12px 20px; min-height: 44px; background: #f1f5f9; color: #475569; border: none; border-radius: 8px; cursor: pointer; font-weight: 500; margin-top: 4px;">
                            İptal
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', html);

        // Mark as unread
        document.getElementById('markUnreadBtn').onclick = async () => {
            document.getElementById('unreadOptionsModal')?.remove();
            try {
                await this.provider.markIncomplete(participationId);
                showCustomAlert('↩️ Okunmadı olarak işaretlendi', 'info', 2000);
                await this.refreshCurrentHatim();
            } catch (error) {
                console.error('Mark incomplete error:', error);
                if (error.message === 'Katılım bulunamadı') {
                    showCustomAlert('⚠️ Katılım bulunamadı. Veriler güncelleniyor...', 'warning', 2500);
                    await this.refreshCurrentHatim();
                } else {
                    showCustomAlert('❌ Durum güncellenemedi.', 'error', 3000);
                }
            }
        };

        // Release unit
        document.getElementById('releaseUnitBtn').onclick = async () => {
            document.getElementById('unreadOptionsModal')?.remove();
            try {
                const deviceId = this.provider.getDeviceId();
                await this.provider.releaseUnit(participationId, deviceId);
                showCustomAlert('✓ Birim serbest bırakıldı', 'success', 2000);
                await this.refreshCurrentHatim();
            } catch (error) {
                console.error('Release unit error:', error);
                showCustomAlert('❌ ' + (error.message || 'Serbest bırakılamadı'), 'error', 3000);
            }
        };
    },

    // ========================================
    // CLAIM UNIT
    // ========================================

    showClaimModal(hatimId, roundNumber, unitNumber, unitLabel) {
        // Get existing participations for this unit from stored data
        const existingParticipations = (this.currentParticipations || []).filter(p => p.unit_number === unitNumber);

        // Get page ranges for display
        const fullRange = getCuzPageRange(unitNumber, null);
        const firstHalfRange = getCuzPageRange(unitNumber, 1);
        const secondHalfRange = getCuzPageRange(unitNumber, 2);

        // Check what's already taken
        const hasFullClaim = existingParticipations.some(p => p.half_position == null);
        const hasFirstHalf = existingParticipations.some(p => p.half_position == 1);
        const hasSecondHalf = existingParticipations.some(p => p.half_position == 2);

        // Build option HTML
        // Determine which option should be pre-selected
        let defaultChecked = 'full';
        if (hasFirstHalf && !hasSecondHalf) {
            defaultChecked = 'half2'; // First half taken, select second half
        } else if (hasSecondHalf && !hasFirstHalf) {
            defaultChecked = 'half1'; // Second half taken, select first half
        }

        const buildOption = (value, label, pageRange, disabled, takenBy = null) => {
            const disabledAttr = disabled ? 'disabled' : '';
            const disabledStyle = disabled ? 'opacity: 0.5; cursor: not-allowed;' : 'cursor: pointer;';
            const checkedAttr = !disabled && value === defaultChecked ? 'checked' : '';
            const takenInfo = takenBy ? `<span style="color: #ef4444; font-size: 12px; margin-left: 8px;">(${takenBy})</span>` : '';

            return `
                <label style="display: flex; align-items: flex-start; gap: 12px; padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px; ${disabledStyle} margin-bottom: 8px; ${!disabled ? 'background: #f8fafc;' : ''}">
                    <input type="radio" name="claimType" value="${value}" ${checkedAttr} ${disabledAttr}
                           style="margin-top: 3px; width: 18px; height: 18px;">
                    <div style="flex: 1;">
                        <div style="font-weight: 500; color: ${disabled ? '#94a3b8' : '#334155'};">${label}${takenInfo}</div>
                        <div style="font-size: 13px; color: ${disabled ? '#cbd5e1' : '#64748b'};">Sayfa ${pageRange.start}-${pageRange.end}</div>
                    </div>
                </label>
            `;
        };

        // Determine which options to show
        let optionsHtml = '';

        if (hasFullClaim) {
            // Full cüz already taken - show info only
            const fullClaimOwner = existingParticipations.find(p => p.half_position == null)?.participant_name;
            optionsHtml = `
                <div style="padding: 16px; background: #fef3c7; border-radius: 8px; color: #92400e;">
                    Bu cüz tamamen alınmış (${fullClaimOwner})
                </div>
            `;
        } else if (hasFirstHalf || hasSecondHalf) {
            // One half taken - can only take the other half, full not available
            const firstHalfOwner = existingParticipations.find(p => p.half_position == 1)?.participant_name;
            const secondHalfOwner = existingParticipations.find(p => p.half_position == 2)?.participant_name;

            optionsHtml += buildOption('full', 'Tam Cüz (20 sayfa)', fullRange, true, 'yarısı alınmış');
            optionsHtml += buildOption('half1', '1/2 Cüz - İlk 10 sayfa', firstHalfRange, hasFirstHalf, firstHalfOwner);
            optionsHtml += buildOption('half2', '1/2 Cüz - Son 10 sayfa', secondHalfRange, hasSecondHalf, secondHalfOwner);
        } else {
            // Nothing taken - all options available
            optionsHtml += buildOption('full', 'Tam Cüz (20 sayfa)', fullRange, false);
            optionsHtml += buildOption('half1', '1/2 Cüz - İlk 10 sayfa', firstHalfRange, false);
            optionsHtml += buildOption('half2', '1/2 Cüz - Son 10 sayfa', secondHalfRange, false);
        }

        const html = `
            <div class="custom-modal-overlay" id="claimModal" data-action="closeModalOnOverlay(event)">
                <div class="custom-modal modern-modal" style="max-width: 400px;">
                    <div class="modal-header" style="padding: 20px; border-bottom: 1px solid #e2e8f0;">
                        <h3 style="margin: 0; display: flex; align-items: center; gap: 10px;">
                            <span style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 8px 12px; border-radius: 8px; font-size: 14px;">${unitNumber}. Cüz</span>
                            ${unitLabel}
                        </h3>
                    </div>
                    <div class="modal-body" style="padding: 20px;">
                        ${!hasFullClaim ? `
                        <div style="margin-bottom: 16px;">
                            <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #334155;">Ne kadar okumak istiyorsunuz?</label>
                            ${optionsHtml}
                        </div>
                        <div style="margin-bottom: 16px;">
                            <label style="display: block; margin-bottom: 6px; font-weight: 500; color: #334155;">İsminiz *</label>
                            <input type="text" id="claimParticipantName"
                                   style="width: 100%; padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 15px;"
                                   placeholder="Adınızı girin" maxlength="30"
                                   value="${localStorage.getItem('lastHatimName') || ''}">
                        </div>
                        ` : optionsHtml}
                    </div>
                    <div class="modal-footer" style="padding: 16px 20px; border-top: 1px solid #e2e8f0; display: flex; gap: 10px; justify-content: flex-end;">
                        <button data-action="closeModalById('claimModal')"
                                style="padding: 12px 20px; min-height: 44px; background: #f1f5f9; color: #475569; border: none; border-radius: 8px; cursor: pointer; font-weight: 500;">
                            İptal
                        </button>
                        ${!hasFullClaim ? `
                        <button data-action="HatimManager.doClaim('${hatimId}', ${roundNumber}, ${unitNumber})"
                                style="padding: 12px 20px; min-height: 44px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 500;">
                            Seç
                        </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', html);
        if (!hasFullClaim) {
            document.getElementById('claimParticipantName')?.focus();
        }
    },

    async doClaim(hatimId, roundNumber, unitNumber) {
        if (!this.provider) {
            showCustomAlert('❌ Sunucuya bağlanılamadı. Sayfayı yenileyin.', 'error', 3000);
            return;
        }

        const participantName = document.getElementById('claimParticipantName')?.value?.trim();
        const claimBtn = document.querySelector('#claimModal button[data-action*="doClaim"]');

        // Get selected claim type (full, half1, half2)
        const selectedType = document.querySelector('input[name="claimType"]:checked')?.value || 'full';
        let halfPosition = null;
        if (selectedType === 'half1') halfPosition = 1;
        else if (selectedType === 'half2') halfPosition = 2;

        // Validation
        if (!participantName || participantName.length < 2) {
            showCustomAlert('Lütfen geçerli bir isim girin (min 2 karakter)', 'warning', 2500);
            return;
        }

        if (participantName.length > 30) {
            showCustomAlert('İsim 30 karakterden uzun olamaz', 'warning', 2500);
            return;
        }

        // Save name
        localStorage.setItem('lastHatimName', participantName);

        // Show loading state
        if (claimBtn) {
            claimBtn.disabled = true;
            claimBtn.innerHTML = '<span style="display: inline-block; animation: spin 1s linear infinite;">⏳</span> Seçiliyor...';
            claimBtn.style.opacity = '0.7';
        }

        try {
            await this.provider.claimUnit({
                hatimId,
                roundNumber,
                unitNumber,
                participantName,
                halfPosition
            });

            document.getElementById('claimModal')?.remove();
            showCustomAlert('✅ Basariyla secildi!', 'success', 2000);

            // Refresh view
            await this.refreshCurrentHatim();

        } catch (error) {
            console.error('Claim error:', error);
            const errorMsg = error.message || '';

            // Handle specific error cases
            if (errorMsg === 'Bu birim zaten alinmis' || errorMsg === 'Bu cüz tamamen alinmis') {
                showCustomAlert('⚠️ Bu cüz az önce başkası tarafından alındı! Başka bir cüz seçin.', 'warning', 3500);
                document.getElementById('claimModal')?.remove();
                await this.refreshCurrentHatim();
            } else if (errorMsg.includes('yarisi zaten alinmis')) {
                // Half already taken - need to select the other half
                showCustomAlert('⚠️ Bu cüzün bir yarısı alınmış. Lütfen diğer yarıyı seçin veya başka cüz seçin.', 'warning', 3500);
                document.getElementById('claimModal')?.remove();
                await this.refreshCurrentHatim();
            } else if (errorMsg === 'Bu yarim cüz zaten alinmis') {
                showCustomAlert('⚠️ Bu yarım cüz az önce alındı! Diğer yarıyı deneyin.', 'warning', 3500);
                document.getElementById('claimModal')?.remove();
                await this.refreshCurrentHatim();
            } else {
                // Generic error
                let displayMsg = errorMsg;
                if (errorMsg.includes('network') || errorMsg.includes('fetch')) {
                    displayMsg = 'İnternet bağlantınızı kontrol edin';
                }
                showCustomAlert(`❌ Seçim başarısız: ${displayMsg}`, 'error', 3500);
                // Reset button
                if (claimBtn) {
                    claimBtn.disabled = false;
                    claimBtn.innerHTML = 'Seç';
                    claimBtn.style.opacity = '1';
                }
            }
        }
    },

    // ========================================
    // MULTI-SELECT CLAIM
    // ========================================

    _selectedUnits: [],

    showMultiClaimModal(hatimId, roundNumber, totalUnits, unitLabel) {
        if (!this.currentHatim || !this.provider) {
            showCustomAlert('Bağlantı hatası', 'error', 2500);
            return;
        }

        // Get current participations to find available units
        const participations = this.currentHatim.participations || [];
        const takenUnits = new Set(participations.map(p => p.unit_number));

        // Build available units list
        const availableUnits = [];
        for (let i = 1; i <= totalUnits; i++) {
            if (!takenUnits.has(i)) {
                availableUnits.push(i);
            }
        }

        if (availableUnits.length === 0) {
            showCustomAlert('Müsait birim yok!', 'warning', 2500);
            return;
        }

        this._selectedUnits = [];

        const gridHtml = availableUnits.map(unit => `
            <div class="multi-claim-unit" data-unit="${unit}"
                 data-action="toggleHatimUnitSelection(${unit}, event)"
                 style="aspect-ratio: 1; display: flex; align-items: center; justify-content: center; background: white; border: 2px solid #e2e8f0; border-radius: 8px; cursor: pointer; transition: all 0.2s; font-weight: 700; font-size: 14px; color: #667eea; min-width: 40px;">
                ${unit}
            </div>
        `).join('');

        const html = `
            <div class="custom-modal-overlay" id="multiClaimModal" data-action="closeModalOnOverlay(event)">
                <div class="custom-modal modern-modal" style="max-width: 450px;">
                    <div class="modal-header" style="background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); color: white; padding: 20px; border-radius: 12px 12px 0 0;">
                        <h3 style="margin: 0; display: flex; align-items: center; gap: 10px;">
                            <span style="font-size: 24px;">☑️</span>
                            Çoklu ${unitLabel} Seç
                        </h3>
                        <p style="margin: 8px 0 0; font-size: 13px; opacity: 0.9;">${availableUnits.length} müsait ${unitLabel.toLowerCase()} - birden fazla seçebilirsiniz</p>
                    </div>
                    <div class="modal-body" style="padding: 20px;">
                        <div style="margin-bottom: 16px;">
                            <label style="display: block; margin-bottom: 6px; font-weight: 500; color: #334155;">İsminiz *</label>
                            <input type="text" id="multiClaimParticipantName"
                                   style="width: 100%; padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 15px;"
                                   placeholder="Adınızı girin" maxlength="30"
                                   value="${localStorage.getItem('lastHatimName') || ''}">
                        </div>

                        <div style="margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
                            <label style="font-weight: 500; color: #334155;">${unitLabel} Seçin:</label>
                            <div style="display: flex; gap: 8px;">
                                <button data-action="HatimManager.selectAllUnits()" style="padding: 4px 10px; font-size: 11px; background: #e0e7ff; color: #4f46e5; border: none; border-radius: 4px; cursor: pointer;">Tümünü Seç</button>
                                <button data-action="HatimManager.clearUnitSelection()" style="padding: 4px 10px; font-size: 11px; background: #f1f5f9; color: #64748b; border: none; border-radius: 4px; cursor: pointer;">Temizle</button>
                            </div>
                        </div>

                        <div id="multiClaimGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(45px, 1fr)); gap: 6px; max-height: 250px; overflow-y: auto; padding: 4px;">
                            ${gridHtml}
                        </div>

                        <div id="selectedCount" style="margin-top: 12px; padding: 8px 12px; background: #f8fafc; border-radius: 6px; font-size: 13px; color: #64748b; text-align: center;">
                            Seçilen: <span id="selectedCountNum">0</span> ${unitLabel.toLowerCase()}
                        </div>
                    </div>
                    <div class="modal-footer" style="padding: 16px 20px; border-top: 1px solid #e2e8f0; display: flex; gap: 10px; justify-content: flex-end;">
                        <button data-action="closeModalById('multiClaimModal')"
                                style="padding: 12px 20px; min-height: 44px; background: #f1f5f9; color: #475569; border: none; border-radius: 8px; cursor: pointer; font-weight: 500;">
                            İptal
                        </button>
                        <button id="multiClaimBtn" data-action="HatimManager.doMultiClaim('${hatimId}', ${roundNumber}, '${unitLabel}')"
                                style="padding: 12px 20px; min-height: 44px; background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 500;">
                            Seç
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', html);
        document.getElementById('multiClaimParticipantName').focus();
    },

    toggleUnitSelection(unit, element) {
        const index = this._selectedUnits.indexOf(unit);
        if (index === -1) {
            this._selectedUnits.push(unit);
            element.style.background = '#8b5cf6';
            element.style.color = 'white';
            element.style.borderColor = '#8b5cf6';
        } else {
            this._selectedUnits.splice(index, 1);
            element.style.background = 'white';
            element.style.color = '#667eea';
            element.style.borderColor = '#e2e8f0';
        }
        this.updateSelectedCount();
    },

    selectAllUnits() {
        const grid = document.getElementById('multiClaimGrid');
        if (!grid) return;

        this._selectedUnits = [];
        grid.querySelectorAll('.multi-claim-unit').forEach(el => {
            const unit = parseInt(el.dataset.unit);
            this._selectedUnits.push(unit);
            el.style.background = '#8b5cf6';
            el.style.color = 'white';
            el.style.borderColor = '#8b5cf6';
        });
        this.updateSelectedCount();
    },

    clearUnitSelection() {
        const grid = document.getElementById('multiClaimGrid');
        if (!grid) return;

        this._selectedUnits = [];
        grid.querySelectorAll('.multi-claim-unit').forEach(el => {
            el.style.background = 'white';
            el.style.color = '#667eea';
            el.style.borderColor = '#e2e8f0';
        });
        this.updateSelectedCount();
    },

    updateSelectedCount() {
        const countEl = document.getElementById('selectedCountNum');
        if (countEl) {
            countEl.textContent = this._selectedUnits.length;
        }
    },

    async doMultiClaim(hatimId, roundNumber, unitLabel) {
        if (!this.provider) {
            showCustomAlert('❌ Sunucuya bağlanılamadı.', 'error', 3000);
            return;
        }

        const participantName = document.getElementById('multiClaimParticipantName')?.value?.trim();
        const claimBtn = document.getElementById('multiClaimBtn');

        // Validation
        if (!participantName || participantName.length < 2) {
            showCustomAlert('Lütfen geçerli bir isim girin (min 2 karakter)', 'warning', 2500);
            return;
        }

        if (this._selectedUnits.length === 0) {
            showCustomAlert(`En az bir ${unitLabel.toLowerCase()} seçin`, 'warning', 2500);
            return;
        }

        // Save name
        localStorage.setItem('lastHatimName', participantName);

        // Show loading state
        if (claimBtn) {
            claimBtn.disabled = true;
            claimBtn.innerHTML = '<span style="display: inline-block; animation: spin 1s linear infinite;">⏳</span> Seçiliyor...';
            claimBtn.style.opacity = '0.7';
        }

        let successCount = 0;
        let failedUnits = [];

        // Sort units for better UX
        const sortedUnits = [...this._selectedUnits].sort((a, b) => a - b);

        for (const unitNumber of sortedUnits) {
            try {
                await this.provider.claimUnit({
                    hatimId,
                    roundNumber,
                    unitNumber,
                    participantName
                });
                successCount++;
            } catch (error) {
                console.error(`Claim unit ${unitNumber} failed:`, error);
                failedUnits.push(unitNumber);
            }
        }

        document.getElementById('multiClaimModal')?.remove();

        // Show result
        if (failedUnits.length === 0) {
            showCustomAlert(`✅ ${successCount} ${unitLabel.toLowerCase()} başarıyla seçildi!`, 'success', 2500);
        } else if (successCount > 0) {
            showCustomAlert(`✅ ${successCount} seçildi, ⚠️ ${failedUnits.length} başarısız (${failedUnits.join(', ')})`, 'warning', 4000);
        } else {
            showCustomAlert('❌ Seçim başarısız. Birimler başkası tarafından alınmış olabilir.', 'error', 3500);
        }

        // Refresh view
        await this.refreshCurrentHatim();
    },

    // ========================================
    // KURAN HATIM (Liste de base)
    // ========================================

    renderKuranHatim(container) {
        // Empty view - user should create or join a hatim via sidebar buttons
        container.innerHTML = `
            <div class="hatim-main-view">
                <div style="text-align: center; padding: 60px 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px; margin: 20px;">
                    <div style="font-size: 72px; margin-bottom: 20px;">📖</div>
                    <p style="margin: 0; font-size: 18px; color: white; font-weight: 500;">Kur'an hatmi başlatmak veya katılmak için soldaki butonları kullanın.</p>
                </div>
            </div>
        `;
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
            <div class="hatim-main-view">
                <div class="hatim-create-card dua">
                    <div class="hatim-create-card-header">
                        <div class="hatim-create-icon dua">
                            <span>🤲</span>
                        </div>
                        <div>
                            <h3 class="hatim-create-title" style="color: #0369a1;">Dua Paylaşımı</h3>
                            <p class="hatim-create-subtitle">Yakında eklenecek...</p>
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
        // Coming soon - Cevşen sharing will be different from Kur'an hatim
        container.innerHTML = `
            <div class="hatim-main-view">
                <div style="text-align: center; padding: 60px 20px; color: #64748b;">
                    <div style="font-size: 64px; margin-bottom: 20px;">🚧</div>
                    <h3 style="margin: 0 0 12px 0; font-size: 18px; color: #475569;">Yapım Aşamasında</h3>
                    <p style="margin: 0; font-size: 15px; color: #94a3b8;">Cevşen Paylaşımı Yakında eklenecek...</p>
                </div>
            </div>
        `;
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

