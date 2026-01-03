/**
 * SOHBET TAKIBI - Talk/Video Tracking Module
 * Systeme de suivi des sohbets (discussions/videos)
 */

// Liste des sources predefinies
const SOHBET_SOURCES = [
    {
        id: 'herkul',
        name: 'Herkul.org',
        url: 'https://herkul.org/',
        icon: 'globe',
        description: 'Ana sayfa'
    },
    {
        id: 'bamteli',
        name: 'Bamteli',
        url: 'https://herkul.org/bamteli/bamteli-yeni-hadiseleri-tevil-ve-mesveret/',
        icon: 'video',
        description: 'Video sohbetler'
    },
    {
        id: 'kirik-testi',
        name: 'Kirik Testi',
        url: 'https://herkul.org/kirik-testi/kuran-ve-sunnet-isiginda-cevre-bilinci/',
        icon: 'book',
        description: 'Yazilar'
    },
    {
        id: 'herkul-nagme',
        name: 'Herkul Nagme',
        url: 'https://herkul.org/herkul-nagme/kamp-ve-hizmet/',
        icon: 'music',
        description: 'Ses kayitlari'
    },
    {
        id: 'besinci-kat',
        name: 'Besinci Kat',
        url: 'https://herkul.org/besinci-kat/tevil-i-ehadisin-farkli-bir-buudu/',
        icon: 'layers',
        description: 'Ozel icerikler'
    },
    {
        id: 'vaazlar',
        name: 'Vaazlar',
        url: 'https://herkul.org/category/kursu/vaazlar/',
        icon: 'mic',
        description: 'Vaaz arsivi'
    },
    {
        id: 'herkul-radyo',
        name: 'Herkul Radyo',
        url: 'https://herkul.org/herkul-radyo/',
        icon: 'radio',
        description: 'Canli radyo'
    }
];

const SohbetManager = {
    /**
     * Structure des donnees:
     * sohbetHistory: { 'bamteli': { '2025-01-03': 30 }, ... } // minutes
     * sohbetMetadata: { 'bamteli': { lastWatched, totalMinutes }, ... }
     */

    // ========================================
    // GETTERS / SETTERS
    // ========================================

    getHistory() {
        try {
            const data = localStorage.getItem('sohbetHistory');
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('Erreur parsing sohbetHistory:', error);
            return {};
        }
    },

    saveHistory(history) {
        localStorage.setItem('sohbetHistory', JSON.stringify(history));
        if (typeof showSaveIndicator === 'function') showSaveIndicator();
    },

    getMetadata() {
        try {
            const data = localStorage.getItem('sohbetMetadata');
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('Erreur parsing sohbetMetadata:', error);
            return {};
        }
    },

    saveMetadata(metadata) {
        localStorage.setItem('sohbetMetadata', JSON.stringify(metadata));
    },

    // ========================================
    // TIME TRACKING
    // ========================================

    addMinutes(sourceId, minutes) {
        const history = this.getHistory();
        const today = new Date().toISOString().split('T')[0];

        if (!history[sourceId]) {
            history[sourceId] = {};
        }

        history[sourceId][today] = (history[sourceId][today] || 0) + parseInt(minutes);
        this.saveHistory(history);

        // Mettre a jour les metadonnees
        const metadata = this.getMetadata();
        if (!metadata[sourceId]) {
            metadata[sourceId] = {};
        }
        metadata[sourceId].lastWatched = new Date().toISOString();
        this.saveMetadata(metadata);

        this.renderSohbetList();
        this.updateGroupIfNeeded();

        return history[sourceId][today];
    },

    getTodayMinutes(sourceId) {
        const history = this.getHistory();
        const today = new Date().toISOString().split('T')[0];
        return history[sourceId]?.[today] || 0;
    },

    // ========================================
    // STATISTICS
    // ========================================

    getStatisticsForSource(sourceId) {
        const history = this.getHistory();
        const sourceHistory = history[sourceId] || {};

        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];

        // Calcul de la semaine (Lundi a Dimanche)
        const dayOfWeek = today.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() + mondayOffset);
        weekStart.setHours(0, 0, 0, 0);

        // Calcul du mois
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

        // Calcul de l'annee
        const yearStart = new Date(today.getFullYear(), 0, 1);

        let dayMinutes = 0, weekMinutes = 0, monthMinutes = 0, yearMinutes = 0, totalMinutes = 0;

        for (const [dateStr, minutes] of Object.entries(sourceHistory)) {
            const date = new Date(dateStr);
            totalMinutes += minutes;

            if (dateStr === todayStr) {
                dayMinutes += minutes;
            }

            if (date >= weekStart) {
                weekMinutes += minutes;
            }

            if (date >= monthStart) {
                monthMinutes += minutes;
            }

            if (date >= yearStart) {
                yearMinutes += minutes;
            }
        }

        return {
            day: dayMinutes,
            week: weekMinutes,
            month: monthMinutes,
            year: yearMinutes,
            total: totalMinutes
        };
    },

    getAllStats() {
        const stats = {
            today: 0,
            week: 0,
            month: 0,
            total: 0,
            sources: {}
        };

        SOHBET_SOURCES.forEach(source => {
            const sourceStats = this.getStatisticsForSource(source.id);

            stats.today += sourceStats.day;
            stats.week += sourceStats.week;
            stats.month += sourceStats.month;
            stats.total += sourceStats.total;

            stats.sources[source.name] = {
                today: sourceStats.day,
                week: sourceStats.week,
                month: sourceStats.month,
                total: sourceStats.total
            };
        });

        return stats;
    },

    // ========================================
    // UI RENDERING
    // ========================================

    getIconSVG(iconType) {
        const icons = {
            'globe': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>',
            'video': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>',
            'book': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>',
            'music': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>',
            'layers': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>',
            'mic': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>',
            'radio': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="2"></circle><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"></path></svg>'
        };
        return icons[iconType] || icons['globe'];
    },

    formatMinutes(minutes) {
        if (minutes < 60) {
            return `${minutes} dk`;
        }
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hours} sa ${mins} dk` : `${hours} sa`;
    },

    renderSohbetList() {
        const container = document.getElementById('sohbetList');
        if (!container) return;

        const totalStats = this.getAllStats();

        // Header avec stats globaux
        let html = `
            <div class="sohbet-stats-header" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; padding: 16px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; color: white;">
                <div style="text-align: center;">
                    <div style="font-size: 24px; font-weight: 700;">${this.formatMinutes(totalStats.today)}</div>
                    <div style="font-size: 12px; opacity: 0.9;">Bugun</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 24px; font-weight: 700;">${this.formatMinutes(totalStats.week)}</div>
                    <div style="font-size: 12px; opacity: 0.9;">Bu Hafta</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 24px; font-weight: 700;">${this.formatMinutes(totalStats.month)}</div>
                    <div style="font-size: 12px; opacity: 0.9;">Bu Ay</div>
                </div>
            </div>
        `;

        // Liste des sources
        html += '<div class="sohbet-sources-list" style="display: flex; flex-direction: column; gap: 12px;">';

        SOHBET_SOURCES.forEach(source => {
            const stats = this.getStatisticsForSource(source.id);
            const todayMinutes = stats.day;

            html += `
                <div class="sohbet-source-card" style="background: white; border-radius: 12px; padding: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white;">
                                ${this.getIconSVG(source.icon)}
                            </div>
                            <div>
                                <div style="font-weight: 600; color: #1e293b;">${source.name}</div>
                                <div style="font-size: 12px; color: #64748b;">${source.description}</div>
                            </div>
                        </div>
                        <a href="${source.url}" target="_blank" rel="noopener noreferrer"
                           style="display: flex; align-items: center; gap: 4px; padding: 8px 12px; background: #f1f5f9; border-radius: 8px; color: #475569; text-decoration: none; font-size: 13px; font-weight: 500;">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                <polyline points="15 3 21 3 21 9"></polyline>
                                <line x1="10" y1="14" x2="21" y2="3"></line>
                            </svg>
                            Ziyaret Et
                        </a>
                    </div>

                    <div style="display: flex; align-items: center; gap: 8px; padding-top: 12px; border-top: 1px solid #e2e8f0;">
                        <div style="flex: 1; display: flex; gap: 16px; font-size: 13px; color: #64748b;">
                            <span>Bugun: <strong style="color: #1e293b;">${this.formatMinutes(todayMinutes)}</strong></span>
                            <span>Toplam: <strong style="color: #1e293b;">${this.formatMinutes(stats.total)}</strong></span>
                        </div>
                        <button onclick="SohbetManager.showAddTimeModal('${source.id}', '${source.name}')"
                                style="display: flex; align-items: center; gap: 4px; padding: 8px 12px; background: #667eea; color: white; border: none; border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer;">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                            Sure Ekle
                        </button>
                    </div>
                </div>
            `;
        });

        html += '</div>';

        container.innerHTML = html;
    },

    // ========================================
    // MODALS
    // ========================================

    showAddTimeModal(sourceId, sourceName) {
        const modalHTML = `
            <div class="modal-overlay" onclick="if(event.target === this) SohbetManager.closeModal()">
                <div class="modal-content" style="max-width: 400px;">
                    <div class="modal-header">
                        <h3>Sure Ekle - ${this.escapeHtml(sourceName)}</h3>
                        <button class="modal-close" onclick="SohbetManager.closeModal()">X</button>
                    </div>
                    <div class="modal-body">
                        <p style="color: #64748b; font-size: 14px; margin-bottom: 16px;">
                            Izlediginiz/dinlediginiz sureyi dakika olarak girin:
                        </p>
                        <div class="form-group">
                            <div style="display: flex; gap: 8px; margin-bottom: 16px;">
                                <button onclick="SohbetManager.setQuickTime(15)" class="quick-time-btn" style="flex: 1; padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px; background: white; cursor: pointer; font-weight: 500;">15 dk</button>
                                <button onclick="SohbetManager.setQuickTime(30)" class="quick-time-btn" style="flex: 1; padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px; background: white; cursor: pointer; font-weight: 500;">30 dk</button>
                                <button onclick="SohbetManager.setQuickTime(60)" class="quick-time-btn" style="flex: 1; padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px; background: white; cursor: pointer; font-weight: 500;">1 sa</button>
                            </div>
                            <label style="display: block; margin-bottom: 8px; font-weight: 500;">Veya manuel girin (dakika):</label>
                            <input type="number" id="sohbetMinutesInput" placeholder="Ornegin: 45" min="1" style="width: 100%; padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 16px;">
                        </div>
                    </div>
                    <div class="modal-footer" style="display: flex; gap: 10px; justify-content: flex-end; padding: 16px;">
                        <button onclick="SohbetManager.closeModal()" style="padding: 10px 20px; border: 1px solid #e2e8f0; border-radius: 8px; background: white; cursor: pointer;">Iptal</button>
                        <button onclick="SohbetManager.addTimeFromModal('${sourceId}')" style="padding: 10px 20px; border: none; border-radius: 8px; background: #667eea; color: white; cursor: pointer;">Ekle</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        document.getElementById('sohbetMinutesInput').focus();
    },

    setQuickTime(minutes) {
        const input = document.getElementById('sohbetMinutesInput');
        if (input) {
            input.value = minutes;
        }
    },

    closeModal() {
        const overlay = document.querySelector('.modal-overlay');
        if (overlay) overlay.remove();
    },

    addTimeFromModal(sourceId) {
        const input = document.getElementById('sohbetMinutesInput');
        const minutes = parseInt(input.value);

        if (!minutes || minutes < 1) {
            if (typeof showCustomAlert === 'function') {
                showCustomAlert('Gecerli bir sure girin!', 'warning', 2000);
            }
            return;
        }

        this.addMinutes(sourceId, minutes);
        this.closeModal();

        if (typeof showCustomAlert === 'function') {
            showCustomAlert(`${this.formatMinutes(minutes)} eklendi!`, 'success', 2000);
        }
    },

    // ========================================
    // RESET FUNCTIONS
    // ========================================

    resetToday(sourceId) {
        const history = this.getHistory();
        const today = new Date().toISOString().split('T')[0];

        if (history[sourceId] && history[sourceId][today]) {
            history[sourceId][today] = 0;
            this.saveHistory(history);
            this.renderSohbetList();
            this.updateGroupIfNeeded();
        }
    },

    resetAll(sourceId) {
        const history = this.getHistory();
        if (history[sourceId]) {
            history[sourceId] = {};
            this.saveHistory(history);
            this.renderSohbetList();
            this.updateGroupIfNeeded();
        }
    },

    resetAllSources() {
        localStorage.removeItem('sohbetHistory');
        localStorage.removeItem('sohbetMetadata');
        this.renderSohbetList();
        this.updateGroupIfNeeded();
    },

    // ========================================
    // HELPERS
    // ========================================

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    updateGroupIfNeeded() {
        if (typeof groupManager !== 'undefined' && groupManager.hasActiveGroup()) {
            if (typeof getCurrentUserStats === 'function') {
                const stats = getCurrentUserStats();
                groupManager.updateMyScore(stats).catch(err => {
                    console.error('Erreur mise a jour groupe:', err);
                });
            }
        }
    },

    // ========================================
    // INITIALIZATION
    // ========================================

    init() {
        this.renderSohbetList();
        console.log('SohbetManager initialise');
    }
};

// Exposition globale
window.SohbetManager = SohbetManager;

// Init apres chargement du DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        SohbetManager.init();
    });
} else {
    SohbetManager.init();
}
