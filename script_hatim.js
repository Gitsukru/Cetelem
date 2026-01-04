/**
 * HATIM VE DUA - Quran Hatim & Dua Sharing Module
 * Systeme de partage de hatim et dua
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

    // ========================================
    // NAVIGATION
    // ========================================

    showView(view) {
        this.currentView = view;

        // Update nav buttons
        document.querySelectorAll('.hatim-nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        const activeBtn = document.querySelector(`.hatim-nav-btn[data-view="${view}"]`);
        if (activeBtn) activeBtn.classList.add('active');

        // Update content
        this.renderContent();
    },

    renderContent() {
        const container = document.getElementById('hatimContent');
        if (!container) return;

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
    // KURAN HATIM
    // ========================================

    renderKuranHatim(container) {
        let html = `
            <div class="hatim-header">
                <h3 style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                    </svg>
                    Kur'an-i Kerim Hatmi
                </h3>
                <p style="color: #64748b; font-size: 14px;">Cuz secin ve paylasin</p>
            </div>

            <div class="hatim-table-container" style="margin-top: 16px; overflow-x: auto;">
                <table class="hatim-table" style="width: 100%; border-collapse: collapse; font-size: 14px;">
                    <thead>
                        <tr style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
                            <th style="padding: 12px 8px; text-align: center; border-radius: 8px 0 0 0;">Cuz</th>
                            <th style="padding: 12px 8px; text-align: center;">Sayfa</th>
                            <th style="padding: 12px 8px; text-align: left;">Baslica Sureler ve Bolumler</th>
                            <th style="padding: 12px 8px; text-align: center; border-radius: 0 8px 0 0;">Sec</th>
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
                    <td style="padding: 12px 8px; text-align: center;">
                        <button onclick="HatimManager.selectCuz(${cuz.cuz})"
                                class="hatim-select-btn"
                                style="padding: 6px 12px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px;">
                            Sec
                        </button>
                    </td>
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
        const cuz = KURAN_CUZLER.find(c => c.cuz === cuzNo);
        if (!cuz) return;

        // Pour l'instant, afficher une alerte. Le mecanisme de partage sera ajoute plus tard.
        if (typeof showCustomAlert === 'function') {
            showCustomAlert(`${cuzNo}. Cuz secildi!<br><small>${cuz.icerik}</small>`, 'success', 2000);
        } else {
            alert(`${cuzNo}. Cuz secildi!\n${cuz.icerik}`);
        }

        // TODO: Implementer le mecanisme de partage
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
                <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px; padding: 20px; text-align: center;">
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
                <h3 style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M12 6v6l4 2"></path>
                    </svg>
                    Cevsen-i Kebir Hatmi
                </h3>
                <p style="color: #64748b; font-size: 14px;">100 bab arasindan secin</p>
            </div>

            <div class="cevsen-grid" style="margin-top: 16px; display: grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap: 8px;">
        `;

        for (let i = 1; i <= 100; i++) {
            html += `
                <button onclick="HatimManager.selectBab(${i})"
                        class="cevsen-bab-btn"
                        style="padding: 12px 8px; background: white; border: 1px solid #e2e8f0; border-radius: 8px; cursor: pointer; font-weight: 500; color: #334155; transition: all 0.2s;">
                    ${i}. Bab
                </button>
            `;
        }

        html += `
            </div>
        `;

        container.innerHTML = html;

        // Add hover effect via JS
        container.querySelectorAll('.cevsen-bab-btn').forEach(btn => {
            btn.addEventListener('mouseenter', () => {
                btn.style.background = '#667eea';
                btn.style.color = 'white';
                btn.style.borderColor = '#667eea';
            });
            btn.addEventListener('mouseleave', () => {
                btn.style.background = 'white';
                btn.style.color = '#334155';
                btn.style.borderColor = '#e2e8f0';
            });
        });
    },

    selectBab(babNo) {
        if (typeof showCustomAlert === 'function') {
            showCustomAlert(`${babNo}. Bab secildi!`, 'success', 2000);
        } else {
            alert(`${babNo}. Bab secildi!`);
        }

        // TODO: Implementer le mecanisme de partage
    },

    // ========================================
    // INITIALIZATION
    // ========================================

    init() {
        this.renderContent();
        console.log('HatimManager initialise');
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
