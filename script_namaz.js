/**
 * NAMAZ TAKIBI - Prayer Tracking Module
 * Systeme de suivi des prieres surrerogatoires
 */

// Liste des prieres recommandees
const TAVSIYE_NAMAZLAR = [
    { name: 'Teheccud Namazi', detail: '1 defa' },
    { name: 'Evvabin Namazi', detail: '1 defa' },
    { name: 'Kusluk Namazi', detail: '1 defa' },
    { name: 'Teravih Namazi', detail: '1 defa' },
    { name: 'Tesbih Namazi', detail: '1 defa' },
    { name: 'Hacet Namazi', detail: '1 defa' }
];

const NamazManager = {
    /**
     * Structure des donnees:
     * namazCategories: ['Teheccud Namazi', 'Evvabin Namazi', ...]
     * namazCounters: { 'Teheccud Namazi': { '2025-01-03': 1, ... }, ... }
     * namazMetadata: { 'Teheccud Namazi': { createdAt, type: 'namaz' }, ... }
     * namazGoals: { 'Teheccud Namazi': { daily: 1, weekly: 7 }, ... }
     */

    // ========================================
    // GETTERS / SETTERS
    // ========================================

    getCategories() {
        try {
            const data = localStorage.getItem('namazCategories');
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Erreur parsing namazCategories:', error);
            return [];
        }
    },

    saveCategories(categories) {
        localStorage.setItem('namazCategories', JSON.stringify(categories));
        if (typeof showSaveIndicator === 'function') showSaveIndicator();
    },

    getCounters() {
        try {
            const data = localStorage.getItem('namazCounters');
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('Erreur parsing namazCounters:', error);
            return {};
        }
    },

    saveCounters(counters) {
        localStorage.setItem('namazCounters', JSON.stringify(counters));
    },

    getMetadata() {
        try {
            const data = localStorage.getItem('namazMetadata');
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('Erreur parsing namazMetadata:', error);
            return {};
        }
    },

    saveMetadata(metadata) {
        localStorage.setItem('namazMetadata', JSON.stringify(metadata));
    },

    getGoals() {
        try {
            const data = localStorage.getItem('namazGoals');
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('Erreur parsing namazGoals:', error);
            return {};
        }
    },

    saveGoals(goals) {
        localStorage.setItem('namazGoals', JSON.stringify(goals));
    },

    // ========================================
    // CATEGORY MANAGEMENT
    // ========================================

    addCategory(name) {
        const categories = this.getCategories();
        if (categories.includes(name)) {
            return false;
        }

        categories.push(name);
        this.saveCategories(categories);

        // Initialiser le compteur
        const counters = this.getCounters();
        if (!counters[name]) {
            counters[name] = {};
            this.saveCounters(counters);
        }

        // Ajouter les metadonnees
        const metadata = this.getMetadata();
        metadata[name] = {
            createdAt: new Date().toISOString(),
            type: 'namaz'
        };
        this.saveMetadata(metadata);

        this.renderNamazList();
        this.updateNamazSelect();
        this.updateGroupIfNeeded();

        return true;
    },

    deleteCategory(name) {
        const categories = this.getCategories();
        const index = categories.indexOf(name);
        if (index === -1) return false;

        categories.splice(index, 1);
        this.saveCategories(categories);

        // Supprimer le compteur
        const counters = this.getCounters();
        delete counters[name];
        this.saveCounters(counters);

        // Supprimer les metadonnees
        const metadata = this.getMetadata();
        delete metadata[name];
        this.saveMetadata(metadata);

        // Supprimer les objectifs
        const goals = this.getGoals();
        delete goals[name];
        this.saveGoals(goals);

        this.renderNamazList();
        this.updateNamazSelect();
        this.updateGroupIfNeeded();

        return true;
    },

    // ========================================
    // COUNTER MANAGEMENT
    // ========================================

    incrementCounter(categoryName, value = 1) {
        const categories = this.getCategories();
        if (!categories.includes(categoryName)) return false;

        const counters = this.getCounters();
        const today = new Date().toDateString();

        if (!counters[categoryName]) {
            counters[categoryName] = {};
        }

        counters[categoryName][today] = (counters[categoryName][today] || 0) + value;
        this.saveCounters(counters);

        this.updateNamazDisplay();
        this.updateGroupIfNeeded();

        // Jouer le son si active
        if (typeof playTickSound === 'function') {
            playTickSound();
        }

        return counters[categoryName][today];
    },

    getTodayCount(categoryName) {
        const counters = this.getCounters();
        const today = new Date().toDateString();
        return counters[categoryName]?.[today] || 0;
    },

    // ========================================
    // STATISTICS
    // ========================================

    getStatisticsForCategory(categoryName) {
        const counters = this.getCounters();
        const categoryCounters = counters[categoryName] || {};

        const today = new Date();
        const todayStr = today.toDateString();

        // Calcul de la semaine (Lundi a Dimanche)
        const dayOfWeek = today.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() + mondayOffset);
        weekStart.setHours(0, 0, 0, 0);

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        // Calcul du mois
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

        // Calcul de l'annee
        const yearStart = new Date(today.getFullYear(), 0, 1);
        const yearEnd = new Date(today.getFullYear(), 11, 31);

        let dayCount = 0, weekCount = 0, monthCount = 0, yearCount = 0, totalCount = 0;

        for (const [dateStr, count] of Object.entries(categoryCounters)) {
            const date = new Date(dateStr);
            totalCount += count;

            if (dateStr === todayStr) {
                dayCount += count;
            }

            if (date >= weekStart && date <= weekEnd) {
                weekCount += count;
            }

            if (date >= monthStart && date <= monthEnd) {
                monthCount += count;
            }

            if (date >= yearStart && date <= yearEnd) {
                yearCount += count;
            }
        }

        return {
            day: dayCount,
            week: weekCount,
            month: monthCount,
            year: yearCount,
            total: totalCount
        };
    },

    getAllStats() {
        const categories = this.getCategories();
        const stats = {
            today: 0,
            week: 0,
            month: 0,
            total: 0,
            categories: {}
        };

        categories.forEach(cat => {
            const catStats = this.getStatisticsForCategory(cat);
            const goals = this.getCategoryGoals(cat);

            stats.today += catStats.day;
            stats.week += catStats.week;
            stats.month += catStats.month;
            stats.total += catStats.total;

            stats.categories[cat] = {
                today: catStats.day,
                week: catStats.week,
                month: catStats.month,
                total: catStats.total,
                goals: goals
            };
        });

        return stats;
    },

    // ========================================
    // GOALS
    // ========================================

    getCategoryGoals(categoryName) {
        const goals = this.getGoals();
        return goals[categoryName] || { daily: 0, weekly: 0 };
    },

    setCategoryGoals(categoryName, daily, weekly) {
        const goals = this.getGoals();
        goals[categoryName] = { daily: parseInt(daily) || 0, weekly: parseInt(weekly) || 0 };
        this.saveGoals(goals);
    },

    // ========================================
    // UI RENDERING
    // ========================================

    updateNamazSelect() {
        const select = document.getElementById('namazCategorySelect');
        if (!select) return;

        const categories = this.getCategories();
        const currentValue = select.value;

        select.innerHTML = '<option value="">Namaz Seciniz</option>';
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            select.appendChild(option);
        });

        // Restaurer la selection
        if (currentValue && categories.includes(currentValue)) {
            select.value = currentValue;
        } else if (categories.length > 0) {
            select.value = categories[0];
        }

        this.updateNamazDisplay();
    },

    updateNamazDisplay() {
        const select = document.getElementById('namazCategorySelect');
        const counterDisplay = document.getElementById('namazCounterDisplay');
        const counterLabel = document.getElementById('namazCounterLabel');
        const statToday = document.getElementById('namazStatToday');
        const statTotal = document.getElementById('namazStatTotal');

        if (!select || !counterDisplay) return;

        const categoryName = select.value;
        if (!categoryName) {
            counterDisplay.textContent = '0';
            if (counterLabel) counterLabel.textContent = 'Namaz';
            if (statToday) statToday.textContent = '0';
            if (statTotal) statTotal.textContent = '0';
            return;
        }

        const stats = this.getStatisticsForCategory(categoryName);
        counterDisplay.textContent = stats.day;
        if (counterLabel) counterLabel.textContent = categoryName;
        if (statToday) statToday.textContent = stats.day;
        if (statTotal) statTotal.textContent = stats.total;
    },

    renderNamazList() {
        const list = document.getElementById('namazCategoriesList');
        if (!list) return;

        const categories = this.getCategories();

        if (categories.length === 0) {
            list.innerHTML = '<li style="color: #94a3b8; text-align: center; padding: 20px;">Henuz namaz eklemediniz</li>';
            return;
        }

        list.innerHTML = '';
        categories.forEach(cat => {
            const stats = this.getStatisticsForCategory(cat);
            const goals = this.getCategoryGoals(cat);

            const li = document.createElement('li');
            li.className = 'category-item';

            // Content div (like zikir)
            const contentDiv = document.createElement('div');

            const strongElement = document.createElement('strong');
            strongElement.textContent = cat;

            const smallElement = document.createElement('small');
            smallElement.style.color = '#666';
            smallElement.style.display = 'block';
            smallElement.textContent = `Toplam: ${stats.total} namaz`;

            // Progress info if goals exist
            if (goals.daily > 0 || goals.weekly > 0) {
                const progressText = [];
                if (goals.daily > 0) {
                    const dailyDone = stats.day >= goals.daily;
                    progressText.push(`Gunluk: ${stats.day}/${goals.daily}${dailyDone ? ' ✓' : ''}`);
                }
                if (goals.weekly > 0) {
                    const weeklyDone = stats.week >= goals.weekly;
                    progressText.push(`Haftalik: ${stats.week}/${goals.weekly}${weeklyDone ? ' ✓' : ''}`);
                }
                const progressSmall = document.createElement('small');
                progressSmall.style.color = '#667eea';
                progressSmall.style.display = 'block';
                progressSmall.style.marginTop = '4px';
                progressSmall.textContent = progressText.join(' | ');
                contentDiv.appendChild(strongElement);
                contentDiv.appendChild(smallElement);
                contentDiv.appendChild(progressSmall);
            } else {
                contentDiv.appendChild(strongElement);
                contentDiv.appendChild(smallElement);
            }

            // Buttons div (like zikir)
            const buttonsDiv = document.createElement('div');
            buttonsDiv.style.display = 'flex';
            buttonsDiv.style.gap = '8px';

            const editButton = document.createElement('button');
            editButton.className = 'edit-button';
            editButton.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Duzenle';
            editButton.onclick = () => this.showEditModal(cat);

            const deleteButton = document.createElement('button');
            deleteButton.className = 'delete-button';
            deleteButton.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg> Sil';
            deleteButton.onclick = () => this.confirmDelete(cat);

            buttonsDiv.appendChild(editButton);
            buttonsDiv.appendChild(deleteButton);

            li.appendChild(contentDiv);
            li.appendChild(buttonsDiv);
            list.appendChild(li);
        });
    },

    // ========================================
    // MODALS
    // ========================================

    showTavsiyeModal() {
        const categories = this.getCategories();

        const namazListHTML = TAVSIYE_NAMAZLAR.map((namaz, index) => {
            const alreadyExists = categories.includes(namaz.name);
            return `
                <label class="tavsiye-item ${alreadyExists ? 'already-added' : ''}" ${alreadyExists ? 'title="Bu namaz zaten ekli"' : ''}>
                    <input type="checkbox"
                           value="${index}"
                           ${alreadyExists ? 'disabled checked' : ''}
                           onchange="NamazManager.updateTavsiyeAddButton()">
                    <div class="tavsiye-item-info">
                        <span class="tavsiye-item-name">${namaz.name}</span>
                        <span class="tavsiye-item-detail">${namaz.detail}</span>
                    </div>
                    ${alreadyExists ? '<span class="tavsiye-item-badge">Eklendi</span>' : ''}
                </label>
            `;
        }).join('');

        const modalHTML = `
            <div class="tavsiye-modal-overlay" onclick="if(event.target === this) NamazManager.closeTavsiyeModal()">
                <div class="tavsiye-modal">
                    <div class="tavsiye-modal-header">
                        <h3>Tavsiye Edilen Namazlar</h3>
                        <button class="tavsiye-modal-close" onclick="NamazManager.closeTavsiyeModal()">X</button>
                    </div>
                    <div class="tavsiye-modal-body">
                        <p style="color: #64748b; font-size: 13px; margin-bottom: 16px;">
                            Eklemek istediginiz namazlari secin:
                        </p>
                        <div class="tavsiye-list">
                            ${namazListHTML}
                        </div>
                    </div>
                    <div class="tavsiye-modal-footer">
                        <button class="tavsiye-cancel-btn" onclick="NamazManager.closeTavsiyeModal()">Iptal</button>
                        <button class="tavsiye-add-btn" id="tavsiyeNamazAddBtn" onclick="NamazManager.addSelectedTavsiyeler()" disabled>
                            Secilenleri Ekle
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    },

    closeTavsiyeModal() {
        const overlay = document.querySelector('.tavsiye-modal-overlay');
        if (overlay) overlay.remove();
    },

    updateTavsiyeAddButton() {
        const checkboxes = document.querySelectorAll('.tavsiye-modal .tavsiye-item input[type="checkbox"]:not(:disabled):checked');
        const addBtn = document.getElementById('tavsiyeNamazAddBtn');
        if (addBtn) {
            addBtn.disabled = checkboxes.length === 0;
        }
    },

    addSelectedTavsiyeler() {
        const checkboxes = document.querySelectorAll('.tavsiye-modal .tavsiye-item input[type="checkbox"]:not(:disabled):checked');
        const categories = this.getCategories();
        const metadata = this.getMetadata();
        let addedCount = 0;

        checkboxes.forEach(checkbox => {
            const index = parseInt(checkbox.value);
            const namaz = TAVSIYE_NAMAZLAR[index];
            if (namaz && !categories.includes(namaz.name)) {
                categories.push(namaz.name);
                metadata[namaz.name] = {
                    createdAt: new Date().toISOString(),
                    type: 'namaz',
                    source: 'tavsiye'
                };
                addedCount++;
            }
        });

        if (addedCount > 0) {
            this.saveCategories(categories);
            this.saveMetadata(metadata);

            // Initialiser les compteurs
            const counters = this.getCounters();
            categories.forEach(cat => {
                if (!counters[cat]) counters[cat] = {};
            });
            this.saveCounters(counters);

            this.renderNamazList();
            this.updateNamazSelect();
            this.updateGroupIfNeeded();

            if (typeof showCustomAlert === 'function') {
                showCustomAlert(`${addedCount} namaz eklendi!`, 'success', 2000);
            }
        }

        this.closeTavsiyeModal();
    },

    showAddModal() {
        const modalHTML = `
            <div class="modal-overlay" onclick="if(event.target === this) NamazManager.closeAddModal()">
                <div class="modal-content" style="max-width: 400px;">
                    <div class="modal-header">
                        <h3>Yeni Namaz Ekle</h3>
                        <button class="modal-close" onclick="NamazManager.closeAddModal()">X</button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label>Namaz Adi</label>
                            <input type="text" id="newNamazName" placeholder="Ornegin: Teheccud Namazi" style="width: 100%; padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 16px;">
                        </div>
                    </div>
                    <div class="modal-footer" style="display: flex; gap: 10px; justify-content: flex-end; padding: 16px;">
                        <button onclick="NamazManager.closeAddModal()" style="padding: 10px 20px; border: 1px solid #e2e8f0; border-radius: 8px; background: white; cursor: pointer;">Iptal</button>
                        <button onclick="NamazManager.addFromModal()" style="padding: 10px 20px; border: none; border-radius: 8px; background: #667eea; color: white; cursor: pointer;">Ekle</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        document.getElementById('newNamazName').focus();
    },

    closeAddModal() {
        const overlay = document.querySelector('.modal-overlay');
        if (overlay) overlay.remove();
    },

    addFromModal() {
        const input = document.getElementById('newNamazName');
        const name = input.value.trim();

        if (!name) {
            if (typeof showCustomAlert === 'function') {
                showCustomAlert('Namaz adi bos olamaz!', 'warning', 2000);
            }
            return;
        }

        if (this.addCategory(name)) {
            this.closeAddModal();
            if (typeof showCustomAlert === 'function') {
                showCustomAlert(`"${name}" eklendi!`, 'success', 2000);
            }
        } else {
            if (typeof showCustomAlert === 'function') {
                showCustomAlert('Bu namaz zaten var!', 'warning', 2000);
            }
        }
    },

    confirmDelete(categoryName) {
        if (typeof showCustomConfirm === 'function') {
            showCustomConfirm(
                'Namaz Sil',
                `"${categoryName}" namazini ve tum gecmisini silmek istediginizden emin misiniz?`,
                () => {
                    this.deleteCategory(categoryName);
                    if (typeof showCustomAlert === 'function') {
                        showCustomAlert('Namaz silindi!', 'success', 2000);
                    }
                }
            );
        } else if (confirm(`"${categoryName}" namazini silmek istediginizden emin misiniz?`)) {
            this.deleteCategory(categoryName);
        }
    },

    showEditModal(categoryName) {
        const goals = this.getCategoryGoals(categoryName);

        const modalHTML = `
            <div class="modal-overlay" onclick="if(event.target === this) NamazManager.closeEditModal()">
                <div class="modal-content" style="max-width: 400px;">
                    <div class="modal-header">
                        <h3>${this.escapeHtml(categoryName)}</h3>
                        <button class="modal-close" onclick="NamazManager.closeEditModal()">X</button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group" style="margin-bottom: 16px;">
                            <label style="display: block; margin-bottom: 8px; font-weight: 500;">Gunluk Hedef</label>
                            <input type="number" id="editNamazDailyGoal" value="${goals.daily}" min="0" style="width: 100%; padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 16px;">
                        </div>
                        <div class="form-group">
                            <label style="display: block; margin-bottom: 8px; font-weight: 500;">Haftalik Hedef</label>
                            <input type="number" id="editNamazWeeklyGoal" value="${goals.weekly}" min="0" style="width: 100%; padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 16px;">
                        </div>
                    </div>
                    <div class="modal-footer" style="display: flex; gap: 10px; justify-content: flex-end; padding: 16px;">
                        <button onclick="NamazManager.closeEditModal()" style="padding: 10px 20px; border: 1px solid #e2e8f0; border-radius: 8px; background: white; cursor: pointer;">Iptal</button>
                        <button onclick="NamazManager.saveEditModal('${this.escapeHtml(categoryName)}')" style="padding: 10px 20px; border: none; border-radius: 8px; background: #667eea; color: white; cursor: pointer;">Kaydet</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    },

    closeEditModal() {
        const overlay = document.querySelector('.modal-overlay');
        if (overlay) overlay.remove();
    },

    saveEditModal(categoryName) {
        const daily = document.getElementById('editNamazDailyGoal').value;
        const weekly = document.getElementById('editNamazWeeklyGoal').value;

        this.setCategoryGoals(categoryName, daily, weekly);
        this.closeEditModal();

        if (typeof showCustomAlert === 'function') {
            showCustomAlert('Hedefler kaydedildi!', 'success', 2000);
        }
    },

    // ========================================
    // RESET FUNCTIONS
    // ========================================

    resetToday(categoryName) {
        const counters = this.getCounters();
        const today = new Date().toDateString();

        if (counters[categoryName] && counters[categoryName][today]) {
            counters[categoryName][today] = 0;
            this.saveCounters(counters);
            this.updateNamazDisplay();
            this.updateGroupIfNeeded();
        }
    },

    resetWeek(categoryName) {
        const counters = this.getCounters();
        const today = new Date();
        const dayOfWeek = today.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() + mondayOffset);
        weekStart.setHours(0, 0, 0, 0);

        if (counters[categoryName]) {
            for (const dateStr of Object.keys(counters[categoryName])) {
                const date = new Date(dateStr);
                if (date >= weekStart) {
                    counters[categoryName][dateStr] = 0;
                }
            }
            this.saveCounters(counters);
            this.updateNamazDisplay();
            this.updateGroupIfNeeded();
        }
    },

    resetMonth(categoryName) {
        const counters = this.getCounters();
        const today = new Date();
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

        if (counters[categoryName]) {
            for (const dateStr of Object.keys(counters[categoryName])) {
                const date = new Date(dateStr);
                if (date >= monthStart) {
                    counters[categoryName][dateStr] = 0;
                }
            }
            this.saveCounters(counters);
            this.updateNamazDisplay();
            this.updateGroupIfNeeded();
        }
    },

    resetAll(categoryName) {
        const counters = this.getCounters();
        if (counters[categoryName]) {
            counters[categoryName] = {};
            this.saveCounters(counters);
            this.updateNamazDisplay();
            this.updateGroupIfNeeded();
        }
    },

    // ========================================
    // HELPERS
    // ========================================

    // Utilise window.escapeHtml de sanitizer.js
    escapeHtml(text) {
        return window.escapeHtml ? window.escapeHtml(text) : text;
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
        // Initialiser les prieres recommandees au premier lancement
        const categories = this.getCategories();
        if (categories.length === 0) {
            // Ajouter toutes les prieres recommandees par defaut
            TAVSIYE_NAMAZLAR.forEach(namaz => {
                this.addCategory(namaz.name);
            });
            console.log('Namazlar initialises avec les prieres recommandees');
        }

        this.renderNamazList();
        this.updateNamazSelect();
        console.log('NamazManager initialise');
    }
};

// Fonctions globales pour l'interface
function incrementNamazCounter() {
    const select = document.getElementById('namazCategorySelect');
    if (select && select.value) {
        NamazManager.incrementCounter(select.value, 1);
    }
}

function showQuickAddNamaz() {
    const existingCategories = NamazManager.getCategories();

    // Generer les options du select
    const optionsHTML = TAVSIYE_NAMAZLAR
        .filter(n => !existingCategories.includes(n.name))
        .map(n => `<option value="${n.name}">${n.name}</option>`)
        .join('');

    const modalHTML = `
        <div class="custom-modal-overlay" onclick="if(event.target === this) this.remove()">
            <div class="custom-modal" style="min-height: 280px;">
                <div class="modal-header">
                    <h3 id="namaz-modal-title">Yeni Namaz Ekle</h3>
                    <button class="modal-close" onclick="this.closest('.custom-modal-overlay').remove()">X</button>
                </div>

                <!-- Indicateur de progression -->
                <div style="display: flex; gap: 8px; padding: 0 24px 16px; justify-content: center;">
                    <div id="namaz-step-indicator-1" class="step-indicator active"></div>
                    <div id="namaz-step-indicator-2" class="step-indicator"></div>
                </div>

                <div class="modal-body" id="namaz-modal-body-content">
                    <!-- Etape 1: Selection du namaz -->
                    <div id="namaz-step-1" class="modal-step">
                        <div class="form-group">
                            <label class="form-label" style="font-size: 16px; margin-bottom: 12px;">Namaz Seciniz</label>
                            ${optionsHTML.length > 0 ? `
                            <select id="namazSelectInput" class="form-input" style="width: 100%; padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 16px; background: white;">
                                <option value="">-- Listeden Seciniz --</option>
                                ${optionsHTML}
                                <option value="__custom__">Baska (Elle Yazin)</option>
                            </select>
                            ` : `
                            <p style="color: #64748b; font-size: 14px; margin-bottom: 12px;">Tum tavsiye edilen namazlar zaten eklenmis. Yeni bir namaz yazabilirsiniz:</p>
                            `}
                            <input type="text" id="namazCustomInput" class="form-input" placeholder="Ornegin: Israk Namazi" style="margin-top: 12px; ${optionsHTML.length > 0 ? 'display: none;' : ''}">
                        </div>
                    </div>

                    <!-- Etape 2: Objectifs -->
                    <div id="namaz-step-2" class="modal-step" style="display: none;">
                        <div class="form-group" style="margin-bottom: 20px;">
                            <label class="form-label" style="font-size: 16px; margin-bottom: 12px;">Gunluk Hedef</label>
                            <input type="number" id="namazDailyGoalInput" class="form-input" placeholder="Ornegin: 1" min="0" value="1">
                            <small style="color: #64748b; font-size: 12px; margin-top: 8px; display: block;">
                                Her gun bu sayiya ulasmayi hedefleyin
                            </small>
                        </div>
                        <div class="form-group">
                            <label class="form-label" style="font-size: 16px; margin-bottom: 12px;">Haftalik Hedef</label>
                            <input type="number" id="namazWeeklyGoalInput" class="form-input" placeholder="Ornegin: 7" min="0" value="7">
                            <small style="color: #64748b; font-size: 12px; margin-top: 8px; display: block;">
                                Her hafta bu sayiya ulasmayi hedefleyin
                            </small>
                        </div>
                    </div>
                </div>

                <div class="modal-footer">
                    <button class="btn-secondary" id="namaz-btn-back" onclick="previousStepAddNamaz()" style="display: none;">
                        Geri
                    </button>
                    <button class="btn-secondary" onclick="this.closest('.custom-modal-overlay').remove()">
                        Iptal
                    </button>
                    <button class="btn-primary" id="namaz-btn-next" onclick="nextStepAddNamaz()">
                        Devam
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Variables pour le formulaire
    window.namazFormData = {
        currentStep: 1,
        totalSteps: 2,
        name: '',
        dailyGoal: 1,
        weeklyGoal: 7
    };

    // Listener pour le select
    const selectEl = document.getElementById('namazSelectInput');
    const customInput = document.getElementById('namazCustomInput');
    if (selectEl) {
        selectEl.addEventListener('change', function() {
            if (this.value === '__custom__') {
                customInput.style.display = 'block';
                customInput.focus();
            } else {
                customInput.style.display = 'none';
            }
        });
    }

    // Gestion Enter
    const modalOverlay = document.querySelector('.custom-modal-overlay:last-of-type');
    modalOverlay.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            nextStepAddNamaz();
        }
    });
}

function nextStepAddNamaz() {
    const currentStep = window.namazFormData.currentStep;

    // Validation etape 1: nom du namaz
    if (currentStep === 1) {
        const selectEl = document.getElementById('namazSelectInput');
        const customInput = document.getElementById('namazCustomInput');
        let namazName = '';

        if (selectEl && selectEl.value && selectEl.value !== '__custom__') {
            namazName = selectEl.value;
        } else if (customInput && customInput.value.trim()) {
            namazName = customInput.value.trim();
        }

        if (!namazName) {
            if (typeof showCustomAlert === 'function') {
                showCustomAlert('Lutfen bir namaz seciniz veya yaziniz!', 'warning', 2500);
            }
            return;
        }

        const existingCategories = NamazManager.getCategories();
        if (existingCategories.includes(namazName)) {
            if (typeof showCustomAlert === 'function') {
                showCustomAlert('Bu namaz zaten mevcut!', 'warning', 2500);
            }
            return;
        }

        window.namazFormData.name = namazName;
    }

    // Validation etape 2: objectifs et finalisation
    if (currentStep === 2) {
        const dailyGoal = parseInt(document.getElementById('namazDailyGoalInput').value) || 0;
        const weeklyGoal = parseInt(document.getElementById('namazWeeklyGoalInput').value) || 0;

        window.namazFormData.dailyGoal = dailyGoal;
        window.namazFormData.weeklyGoal = weeklyGoal;

        // Finaliser
        finalizeAddNamaz();
        return;
    }

    // Passer a l'etape suivante
    if (currentStep < window.namazFormData.totalSteps) {
        document.getElementById(`namaz-step-${currentStep}`).style.display = 'none';
        document.getElementById(`namaz-step-indicator-${currentStep}`).classList.remove('active');

        window.namazFormData.currentStep++;
        document.getElementById(`namaz-step-${window.namazFormData.currentStep}`).style.display = 'block';
        document.getElementById(`namaz-step-indicator-${window.namazFormData.currentStep}`).classList.add('active');

        document.getElementById('namaz-btn-back').style.display = 'inline-block';

        if (window.namazFormData.currentStep === window.namazFormData.totalSteps) {
            document.getElementById('namaz-btn-next').textContent = 'Ekle';
        }

        // Focus sur le premier input de l'etape
        const firstInput = document.getElementById('namazDailyGoalInput');
        if (firstInput) firstInput.focus();
    }
}

function previousStepAddNamaz() {
    const currentStep = window.namazFormData.currentStep;

    if (currentStep > 1) {
        document.getElementById(`namaz-step-${currentStep}`).style.display = 'none';
        document.getElementById(`namaz-step-indicator-${currentStep}`).classList.remove('active');

        window.namazFormData.currentStep--;
        document.getElementById(`namaz-step-${window.namazFormData.currentStep}`).style.display = 'block';
        document.getElementById(`namaz-step-indicator-${window.namazFormData.currentStep}`).classList.add('active');

        if (window.namazFormData.currentStep === 1) {
            document.getElementById('namaz-btn-back').style.display = 'none';
        }

        document.getElementById('namaz-btn-next').textContent = 'Devam';
    }
}

function finalizeAddNamaz() {
    const data = window.namazFormData;

    // Ajouter la categorie
    NamazManager.addCategory(data.name);

    // Definir les objectifs
    if (data.dailyGoal > 0 || data.weeklyGoal > 0) {
        NamazManager.setCategoryGoals(data.name, data.dailyGoal, data.weeklyGoal);
    }

    // Fermer le modal
    const modal = document.querySelector('.custom-modal-overlay');
    if (modal) modal.remove();

    // Notification
    if (typeof showCustomAlert === 'function') {
        showCustomAlert(`"${data.name}" eklendi!`, 'success', 2500);
    }
}

function showNamazTavsiyeModal() {
    NamazManager.showTavsiyeModal();
}

// Exposition globale
window.NamazManager = NamazManager;

// Init apres chargement du DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        NamazManager.init();
    });
} else {
    NamazManager.init();
}
