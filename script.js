// Variables globales - SYSTÈME SIMPLIFIÉ
let categories = JSON.parse(localStorage.getItem('categories')) || ['Subhan Allah', 'Elhamdulillah', 'Allahu Ekber'];
let counters = JSON.parse(localStorage.getItem('counters')) || {};
let currentCategory = '';
let currentDate = new Date().toDateString();
let visualOffset = 0; // Décalage visuel pour l'affichage

// Timer variables
let startTime = Date.now();
let timerInterval = null;

// Sound variables
let soundEnabled = localStorage.getItem('soundEnabled') !== 'false';
let tickSound = null;

// Group variables
let isHost = false;
let connections = new Map();
let currentGroup = null;

// Timer functions
function startTimer() {
    startTime = Date.now();
    updateTimer();
    timerInterval = setInterval(updateTimer, 1000);
}

function updateTimer() {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const hours = Math.floor(elapsed / 3600);
    const minutes = Math.floor((elapsed % 3600) / 60);
    const seconds = elapsed % 60;

    const display = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    const timerElement = document.getElementById('timerDisplay');
    if (timerElement) {
        timerElement.textContent = display;
    }
}

// Sound functions
function initSound() {
    // Use the real tesbih sound file
    try {
        tickSound = new Audio('./tesbih_variant_1.mp3');
        tickSound.volume = 0.7;
        tickSound.preload = 'auto';

        // Test if the audio loads properly
        tickSound.addEventListener('canplaythrough', function() {
            console.log('Tesbih sound loaded successfully');
        });

        tickSound.addEventListener('error', function(e) {
            console.log('Error loading tesbih sound:', e);
            // Fallback to Web Audio if file fails to load
            createTickSoundWithWebAudio();
        });

    } catch (e) {
        console.log('Audio creation failed, using Web Audio fallback');
        createTickSoundWithWebAudio();
    }

    // Update button state
    const soundBtn = document.getElementById('soundToggle');
    if (soundBtn) {
        soundBtn.textContent = soundEnabled ? 'SES' : 'SESsiz';
        soundBtn.classList.toggle('muted', !soundEnabled);
    }
}

function createTickSoundWithWebAudio() {
    // We'll create the sound dynamically when needed
    tickSound = {
        play: function() {
            if (!soundEnabled) return Promise.resolve();

            try {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                const audioContext = new AudioContext();

                // Create multiple components for realistic tesbih sound
                const masterGain = audioContext.createGain();
                masterGain.connect(audioContext.destination);
                masterGain.gain.setValueAtTime(0.4, audioContext.currentTime);

                // Component 1: Sharp click (wood/stone contact)
                const click1 = audioContext.createOscillator();
                const clickGain1 = audioContext.createGain();
                click1.connect(clickGain1);
                clickGain1.connect(masterGain);

                click1.frequency.setValueAtTime(800, audioContext.currentTime);
                click1.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.02);
                clickGain1.gain.setValueAtTime(0.6, audioContext.currentTime);
                clickGain1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.02);

                // Component 2: Wooden resonance
                const wood = audioContext.createOscillator();
                const woodGain = audioContext.createGain();
                wood.connect(woodGain);
                woodGain.connect(masterGain);

                wood.frequency.setValueAtTime(300, audioContext.currentTime);
                wood.frequency.exponentialRampToValueAtTime(150, audioContext.currentTime + 0.08);
                woodGain.gain.setValueAtTime(0, audioContext.currentTime);
                woodGain.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.005);
                woodGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.08);

                // Component 3: String/cord friction (very subtle)
                const friction = audioContext.createOscillator();
                const frictionGain = audioContext.createGain();
                friction.connect(frictionGain);
                frictionGain.connect(masterGain);

                friction.frequency.setValueAtTime(1200, audioContext.currentTime);
                friction.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.01);
                frictionGain.gain.setValueAtTime(0.1, audioContext.currentTime);
                frictionGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.01);

                // Start all oscillators
                const now = audioContext.currentTime;
                click1.start(now);
                click1.stop(now + 0.02);

                wood.start(now);
                wood.stop(now + 0.08);

                friction.start(now);
                friction.stop(now + 0.01);

                return Promise.resolve();
            } catch (e) {
                console.log('Web Audio error:', e);
                return Promise.reject(e);
            }
        },
        currentTime: 0,
        volume: 0.7
    };
}

function createSimpleTickSound() {
    // Fallback: create a realistic tesbih sound wav file
    const sampleRate = 22050;
    const duration = 0.15;
    const samples = sampleRate * duration;
    const buffer = new ArrayBuffer(44 + samples * 2);
    const view = new DataView(buffer);

    // WAV header
    const writeString = (offset, string) => {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + samples * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, samples * 2, true);

    // Generate realistic tesbih bead click sound
    for (let i = 0; i < samples; i++) {
        const t = i / sampleRate;
        let sample = 0;

        // Sharp click component (bead collision)
        if (t < 0.02) {
            const clickFreq = 800 - (t / 0.02) * 400;
            const clickAmp = Math.exp(-t * 100) * 0.8;
            sample += Math.sin(2 * Math.PI * clickFreq * t) * clickAmp;
        }

        // Wooden resonance component
        if (t < 0.08) {
            const woodFreq = 300 - (t / 0.08) * 150;
            const woodAmp = Math.exp(-t * 15) * 0.4;
            sample += Math.sin(2 * Math.PI * woodFreq * t) * woodAmp;
        }

        // Add some natural randomness (texture)
        if (t < 0.03) {
            sample += (Math.random() - 0.5) * 0.1 * Math.exp(-t * 50);
        }

        view.setInt16(44 + i * 2, Math.max(-32767, Math.min(32767, sample * 32767)), true);
    }

    const blob = new Blob([buffer], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    tickSound = new Audio(url);
    tickSound.volume = 0.6;
}

function playTickSound() {
    if (!soundEnabled || !tickSound) return;

    try {
        // For real audio files - use cloneNode for rapid clicks
        if (tickSound.currentTime !== undefined) {
            // Clone the audio for simultaneous playback
            const sound = tickSound.cloneNode();
            sound.volume = tickSound.volume;

            const playPromise = sound.play();
            if (playPromise !== undefined) {
                playPromise.catch(e => {
                    console.log('Sound play failed:', e);
                    if (!audioEnabled) {
                        enableAudioOnInteraction();
                    }
                });
            }
        }
        // For Web Audio API generated sounds
        else if (tickSound.play) {
            tickSound.play().catch(e => {
                console.log('Web Audio play failed:', e);
                if (!audioEnabled) {
                    enableAudioOnInteraction();
                }
            });
        }
    } catch (e) {
        console.log('Sound error:', e);
    }
}

// Enable audio on first user interaction (for mobile)
let audioEnabled = false;
function enableAudioOnInteraction() {
    if (!audioEnabled) {
        const enableAudio = async () => {
            try {
                if (tickSound) {
                    // For real audio files
                    if (tickSound.currentTime !== undefined) {
                        await tickSound.play();
                        tickSound.pause();
                        tickSound.currentTime = 0;
                    }
                    // For Web Audio
                    else if (tickSound.play) {
                        await tickSound.play();
                    }
                    audioEnabled = true;
                    console.log('Audio context enabled for mobile');
                    showCustomAlert('🔊 Ses etkinleştirildi!', 'success', 1500);
                }
            } catch (e) {
                console.log('Audio enable error:', e);
                audioEnabled = true; // Mark as attempted
            }
        };

        document.addEventListener('touchstart', enableAudio, { once: true });
        document.addEventListener('click', enableAudio, { once: true });
        document.addEventListener('touchend', enableAudio, { once: true });
    }
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    localStorage.setItem('soundEnabled', soundEnabled);

    const soundBtn = document.getElementById('soundToggle');
    if (soundBtn) {
        soundBtn.textContent = soundEnabled ? 'SES' : 'SESsiz';
        soundBtn.classList.toggle('muted', !soundEnabled);
    }

    // Show status message and try to enable audio immediately
    if (soundEnabled) {
        showCustomAlert('🔊 Ses açıldı!', 'success', 2000);

        // Try to enable audio immediately when user clicks sound button
        if (!audioEnabled && tickSound) {
            try {
                if (tickSound.currentTime !== undefined) {
                    tickSound.play().then(() => {
                        tickSound.pause();
                        tickSound.currentTime = 0;
                        audioEnabled = true;
                        console.log('Audio enabled via sound button');
                    }).catch(() => {
                        enableAudioOnInteraction();
                    });
                } else {
                    enableAudioOnInteraction();
                }
            } catch (e) {
                enableAudioOnInteraction();
            }
        }
    } else {
        showCustomAlert('🔇 Ses kapatıldı', 'info', 1500);
    }
}

// Fonction pour afficher une confirmation personnalisée
function showCustomConfirm(title, message, onYes, onNo = null) {
    // Supprimer toute confirmation existante
    const existingConfirm = document.querySelector('.custom-confirm');
    if (existingConfirm) {
        existingConfirm.remove();
    }

    // Créer la boîte de confirmation
    const confirmDiv = document.createElement('div');
    confirmDiv.className = 'custom-confirm';
    confirmDiv.innerHTML = `
        <h3>${title}</h3>
        <p>${message}</p>
        <div class="confirm-buttons">
            <button class="confirm-btn confirm-yes">Evet</button>
            <button class="confirm-btn confirm-no">Hayır</button>
        </div>
    `;
    document.body.appendChild(confirmDiv);

    // Gestionnaires d'événements
    const yesBtn = confirmDiv.querySelector('.confirm-yes');
    const noBtn = confirmDiv.querySelector('.confirm-no');

    function closeConfirm() {
        confirmDiv.classList.remove('show');
        setTimeout(() => {
            if (confirmDiv && confirmDiv.parentNode) {
                confirmDiv.remove();
            }
        }, 300);
    }

    yesBtn.addEventListener('click', () => {
        closeConfirm();
        if (onYes) onYes();
    });

    noBtn.addEventListener('click', () => {
        closeConfirm();
        if (onNo) onNo();
    });

    // Afficher avec animation
    setTimeout(() => {
        confirmDiv.classList.add('show');
    }, 100);
}

// Fonction pour afficher une notification personnalisée
function showCustomAlert(message, type = 'error', duration = 3000) {
    // Supprimer toute notification existante
    const existingAlert = document.querySelector('.custom-alert');
    if (existingAlert) {
        existingAlert.remove();
    }

    // Créer la nouvelle notification
    const alertDiv = document.createElement('div');
    alertDiv.className = `custom-alert ${type}`;
    alertDiv.innerHTML = message;
    document.body.appendChild(alertDiv);

    // Afficher avec animation
    setTimeout(() => {
        alertDiv.classList.add('show');
    }, 100);

    // Masquer après le délai
    setTimeout(() => {
        alertDiv.classList.remove('show');
        setTimeout(() => {
            if (alertDiv && alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 300);
    }, duration);
}

// Utilitaires de date
function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
}

function getWeekEnd(date) {
    const weekStart = getWeekStart(date);
    return new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
}

function getMonthStart(date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getMonthEnd(date) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function getYearStart(date) {
    return new Date(date.getFullYear(), 0, 1);
}

function getYearEnd(date) {
    return new Date(date.getFullYear(), 11, 31);
}

// Initialiser les compteurs - SYSTÈME SIMPLIFIÉ ET FIABLE
function initializeCounters() {
    categories.forEach(cat => {
        if (!counters[cat]) {
            counters[cat] = {};
        }
        if (!counters[cat][currentDate]) {
            counters[cat][currentDate] = 0;
        }
    });
    saveCounters();
}

// Calculer les statistiques pour toutes les périodes à partir des données quotidiennes
function getStatisticsForCategory(category) {
    if (!counters[category]) {
        return { day: 0, week: 0, month: 0, year: 0, total: 0 };
    }

    const today = new Date();
    const todayKey = today.toDateString();

    // Calculer les bornes des périodes
    const weekStart = getWeekStart(today);
    const weekEnd = getWeekEnd(today);
    const monthStart = getMonthStart(today);
    const monthEnd = getMonthEnd(today);
    const yearStart = getYearStart(today);
    const yearEnd = getYearEnd(today);

    let dayCount = counters[category][todayKey] || 0;
    let weekCount = 0;
    let monthCount = 0;
    let yearCount = 0;
    let totalCount = 0;

    // Parcourir tous les jours enregistrés pour cette catégorie
    Object.keys(counters[category]).forEach(dateKey => {
        const date = new Date(dateKey);
        const count = counters[category][dateKey] || 0;

        // Ajouter au total général
        totalCount += count;

        // Vérifier si c'est dans la semaine courante
        if (date >= weekStart && date <= weekEnd) {
            weekCount += count;
        }

        // Vérifier si c'est dans le mois courant
        if (date >= monthStart && date <= monthEnd) {
            monthCount += count;
        }

        // Vérifier si c'est dans l'année courante
        if (date >= yearStart && date <= yearEnd) {
            yearCount += count;
        }
    });

    return {
        day: dayCount,
        week: weekCount,
        month: monthCount,
        year: yearCount,
        total: totalCount
    };
}

// Sauvegardes
function saveCategories() {
    try {
        localStorage.setItem('categories', JSON.stringify(categories));
        localStorage.setItem('lastSave', new Date().toISOString());
        showSaveIndicator();
        updateSaveStatus();
        return true;
    } catch (error) {
        console.error('Erreur sauvegarde catégories:', error);
        return false;
    }
}

function saveCounters() {
    try {
        localStorage.setItem('counters', JSON.stringify(counters));
        localStorage.setItem('lastSave', new Date().toISOString());
        showSaveIndicator();
        updateSaveStatus();
        return true;
    } catch (error) {
        console.error('Erreur sauvegarde compteurs:', error);
        return false;
    }
}

// Indicateur de sauvegarde
function showSaveIndicator() {
    let indicator = document.getElementById('saveIndicator');
    if (!indicator) {
        const div = document.createElement('div');
        div.id = 'saveIndicator';
        div.className = 'save-indicator';
        div.textContent = 'Kaydedildi';
        document.body.appendChild(div);
        indicator = div;
    }

    indicator.classList.add('show');
    setTimeout(() => {
        indicator.classList.remove('show');
    }, 2000);
}

function updateSaveStatus() {
    const lastSave = localStorage.getItem('lastSave');
    if (lastSave) {
        const date = new Date(lastSave);
        const now = new Date();
        const diff = Math.floor((now - date) / 1000);

        let timeText = '';
        if (diff < 60) {
            timeText = 'birkaç saniye önce';
        } else if (diff < 3600) {
            timeText = `${Math.floor(diff / 60)} dakika önce`;
        } else {
            timeText = date.toLocaleDateString('tr-TR');
        }

        const lastSaveElement = document.getElementById('lastSave');
        if (lastSaveElement) {
            lastSaveElement.textContent = `Son yedekleme: ${timeText}`;
        }
    }
}

// Changer d'onglet
function showTab(tabName, event) {
    console.log('showTab called:', tabName, 'event:', event);

    // Remove active class from all tabs and buttons
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });

    // Activate the target tab content
    const targetTab = document.getElementById(tabName);
    if (targetTab) {
        targetTab.classList.add('active');
        console.log('Tab content activated:', tabName);
    }

    // Activate the clicked button
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
        console.log('Button activated:', event.currentTarget.textContent);
    } else {
        console.warn('No event or currentTarget:', event);
    }

    setTimeout(() => {
        if (tabName === 'stats') {
            updateStats();
        } else if (tabName === 'management') {
            updateCategoriesList();
            updateCategorySelect();
        } else if (tabName === 'group') {
            // Restore group interface if a group is active
            if (groupManager && groupManager.hasActiveGroup()) {
                const groupInfo = groupManager.getCurrentGroup();
                console.log('Changement onglet groupe - Restauration:', groupInfo.group.name);
                showGroupInterface(groupInfo.group.code);
                updateLeaderboard();
            } else {
                // Reset group interface when switching to group tab
                console.log('Changement onglet groupe - Pas de groupe actif');
                const createSection = document.getElementById('createSection');
                const joinSection = document.getElementById('joinSection');
                const leaderboard = document.getElementById('leaderboard');
                const groupStatus = document.getElementById('groupStatus');

                if (createSection) createSection.style.display = 'none';
                if (joinSection) joinSection.style.display = 'none';
                if (leaderboard) leaderboard.style.display = 'none';
                if (groupStatus) groupStatus.style.display = 'none';

                // Afficher l'historique des groupes
                if (typeof displayGroupHistory === 'function') {
                    displayGroupHistory();
                }
            }
        }
    }, 100);
}

// Mettre à jour les sélecteurs
function updateCategorySelect() {
    const select = document.getElementById('categorySelect');
    const resetSelect = document.getElementById('categoryToReset');

    // Sélecteur principal
    if (select) {
        select.innerHTML = '<option value="">Zikir</option>';
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            select.appendChild(option);
        });
    }

    // Sélecteur pour l'effacement
    if (resetSelect) {
        resetSelect.innerHTML = '<option value="">Zikir</option>';
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            resetSelect.appendChild(option);
        });
    }
}

// Mettre à jour la liste des catégories
function updateCategoriesList() {
    const list = document.getElementById('categoriesList');
    if (!list) return;

    list.innerHTML = '';

    categories.forEach((cat, index) => {
        const li = document.createElement('li');
        li.className = 'category-item';

        // Calculer le total pour cette catégorie
        const stats = getStatisticsForCategory(cat);

        li.innerHTML = `
            <div>
                <strong>${cat}</strong>
                <small style="color: #666; display: block;">Toplam: ${stats.total} zikir</small>
            </div>
            <button class="delete-button" onclick="deleteCategory(${index})">Kategoriyi sil</button>
        `;
        list.appendChild(li);
    });
}

// Ajouter une catégorie
function addCategory() {
    const input = document.getElementById('newCategoryInput');
    if (!input) return;

    const newCategory = input.value.trim();

    if (newCategory && !categories.includes(newCategory)) {
        categories.push(newCategory);
        saveCategories();
        initializeCounters();
        updateCategorySelect();
        updateCategoriesList();
        updateStats();
        input.value = '';
        showCustomAlert(`Kategori "${newCategory}" eklendi!`, 'success', 2000);
    } else if (categories.includes(newCategory)) {
        showCustomAlert('Bu kategori zaten mevcut!', 'warning', 2500);
    } else {
        showCustomAlert('Lütfen bir kategori adı girin!', 'warning', 2500);
    }
}

// Supprimer une catégorie
function deleteCategory(index) {
    const categoryName = categories[index];

    showCustomConfirm(
        'Kategoriyi Sil',
        `"${categoryName}" kategorisini silmek istediğinizden emin misiniz?<br><br>Bu işlem tüm verilerini de silecektir.`,
        function() {
            // Confirmation "Oui"
            categories.splice(index, 1);
            delete counters[categoryName];
            saveCategories();
            saveCounters();
            updateCategorySelect();
            updateCategoriesList();
            updateStats();

            if (currentCategory === categoryName) {
                currentCategory = '';
                visualOffset = 0;
                const counterDisplay = document.getElementById('counterDisplay');
                const counterLabel = document.getElementById('counterLabel');
                if (counterDisplay) counterDisplay.textContent = '0';
                if (counterLabel) counterLabel.textContent = 'Zikir';
            }

            showCustomAlert(`Kategori "${categoryName}" silindi!`, 'success', 2000);
        }
    );
}

// Mettre à jour l'affichage du compteur
function updateCounterDisplay() {
    const display = document.getElementById('counterDisplay');
    const label = document.getElementById('counterLabel');

    if (!display || !label) return;

    if (currentCategory) {
        const stats = getStatisticsForCategory(currentCategory);
        const visualCount = Math.max(0, stats.day - visualOffset);
        display.textContent = visualCount;
        label.textContent = `${currentCategory} - Bugün`;
    } else {
        display.textContent = '0';
        label.textContent = 'Zikir';
    }
}

// Afficher modal rapide pour ajouter un zikir
function showQuickAddCategory() {
    const modalHtml = `
        <div class="custom-modal-overlay" onclick="if(event.target === this) this.remove()">
            <div class="custom-modal-content modern-modal">
                <div class="modal-header">
                    <h3>Yeni Zikir Ekle</h3>
                    <button class="modal-close" onclick="this.closest('.custom-modal-overlay').remove()">✕</button>
                </div>
                <div class="modal-body">
                    <input type="text" id="quickCategoryInput" class="category-input"
                        placeholder="Zikir adı girin..."
                        style="width: 100%; padding: 12px; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 16px;">
                </div>
                <div class="modal-footer">
                    <button class="modal-btn cancel" onclick="this.closest('.custom-modal-overlay').remove()">İptal</button>
                    <button class="modal-btn confirm" onclick="addQuickCategory()">Ekle</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Focus sur l'input
    setTimeout(() => {
        const input = document.getElementById('quickCategoryInput');
        if (input) {
            input.focus();
            // Enter pour ajouter
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    addQuickCategory();
                }
            });
        }
    }, 100);
}

// Ajouter un zikir depuis le modal rapide
function addQuickCategory() {
    const input = document.getElementById('quickCategoryInput');
    if (!input) return;

    const newCategory = input.value.trim();

    if (newCategory && !categories.includes(newCategory)) {
        categories.push(newCategory);
        saveCategories();
        initializeCounters();
        updateCategorySelect();
        updateCategoriesList();
        updateStats();

        // Fermer le modal d'abord
        const modal = document.querySelector('.custom-modal-overlay');
        if (modal) modal.remove();

        // Sélectionner automatiquement la nouvelle catégorie
        const select = document.getElementById('categorySelect');
        if (select) {
            select.value = newCategory;
            currentCategory = newCategory;
            updateCounterDisplay();
            resetTimer();
        }

        // Afficher la confirmation
        showCustomAlert(`Zikir "${newCategory}" eklendi!`, 'success', 2000);
    } else if (categories.includes(newCategory)) {
        showCustomAlert('Bu zikir zaten mevcut!', 'warning', 2500);
    } else {
        showCustomAlert('Lütfen bir zikir adı girin!', 'warning', 2500);
    }
}

// Incrémenter le compteur - VERSION SIMPLE ET FIABLE
function incrementCounter() {
    if (!currentCategory) {
        showCustomAlert('KATEGORİ SEÇİN!<br><br>Zikir saymaya başlamadan önce lütfen açılır menüden bir kategori seçin.', 'warning', 4000);
        return;
    }

    // Vérifier si on a changé de jour
    const today = new Date().toDateString();
    if (today !== currentDate) {
        currentDate = today;
        initializeCounters();
    }

    // Incrémenter simplement le compteur du jour
    if (!counters[currentCategory][currentDate]) {
        counters[currentCategory][currentDate] = 0;
    }
    counters[currentCategory][currentDate]++;

    // Play tick sound if enabled
    playTickSound();

    if (saveCounters()) {
        updateCounterDisplay();

        // ⚡ Utiliser debounce: attend 2s après le dernier clic avant de recalculer
        debouncedUpdateStats()
        debouncedAutoSave()

        // Update group count with new GroupManager system
        if (groupManager && groupManager.hasActiveGroup()) {
            const stats = getCurrentUserStats()
            groupManager.updateMyScore(stats)
        }

        // Animation du bouton
        const button = document.getElementById('countButton');
        if (button) {
            button.style.transform = 'scale(1.1)';
            setTimeout(() => {
                button.style.transform = 'scale(1)';
            }, 150);
        }
    } else {
        // En cas d'erreur de sauvegarde, annuler l'incrémentation
        counters[currentCategory][currentDate]--;
    }
}

// Remettre à zéro SEULEMENT l'affichage visuel (pas les statistiques)
function resetDayCounter() {
    if (!currentCategory) {
        showCustomAlert('KATEGORİ SEÇİN!<br><br>Lütfen önce bir kategori seçin.', 'warning', 3000);
        return;
    }

    showCustomConfirm(
        'Görüntü Sıfırlama',
        `"${currentCategory}" için sayaç GÖRÜNTÜSÜNÜ sıfırlayın?<br><br>İstatistikler etkilenMEYECEK.`,
        function() {
            // Confirmation "Oui"
            const stats = getStatisticsForCategory(currentCategory);
            visualOffset = stats.day; // L'affichage sera : realCount - realCount = 0
            updateCounterDisplay();
            showCustomAlert('Görüntü sıfırlandı!<br>İstatistikleriniz korundu', 'success', 3000);
        },
        function() {
            // Confirmation "Non" - ne rien faire
            showCustomAlert('Sıfırlama iptal edildi', 'warning', 2000);
        }
    );
}

// FONCTION DE STATISTIQUES - VERSION CORRIGÉE ET FIABLE
function updateStats() {
    try {
        let totalToday = 0;
        let totalWeek = 0;
        let totalMonth = 0;
        let totalYear = 0;
        let totalAll = 0;

        // Calculer les totaux pour toutes les catégories
        categories.forEach(cat => {
            const stats = getStatisticsForCategory(cat);
            totalToday += stats.day;
            totalWeek += stats.week;
            totalMonth += stats.month;
            totalYear += stats.year;
            totalAll += stats.total;
        });

        // Mettre à jour le header
        const todayElement = document.getElementById('totalToday');
        if (todayElement) {
            todayElement.textContent = totalToday;
        }

        // Remplir le tableau
        const tbody = document.querySelector('#completeStatsTable tbody');
        if (tbody) {
            tbody.innerHTML = '';

            categories.forEach(cat => {
                const row = document.createElement('tr');
                const stats = getStatisticsForCategory(cat);
                const categoryNote = getCategoryNote(cat);
                const noteIcon = categoryNote ? '📝' : '📝';
                const noteOpacity = categoryNote ? '1' : '0.3';

                row.innerHTML = `
                    <td>${cat}</td>
                    <td>${stats.day}</td>
                    <td>${stats.week}</td>
                    <td>${stats.month}</td>
                    <td>${stats.year}</td>
                    <td>${stats.total}</td>
                    <td style="text-align: center;">
                        <button class="category-note-btn" onclick="showCategoryNoteModal('${cat.replace(/'/g, "\\'")}', event)"
                            style="opacity: ${noteOpacity}; color: #3b82f6;" title="Not ekle/düzenle">
                            ${noteIcon}
                        </button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        }

        // Mettre à jour les totaux
        const totalElements = {
            'totalDay': totalToday,
            'totalWeek': totalWeek,
            'totalMonth': totalMonth,
            'totalYear': totalYear,
            'totalAll': totalAll
        };

        Object.keys(totalElements).forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = totalElements[id];
            }
        });

        // Résumé
        const summaryElement = document.getElementById('summaryText');
        if (summaryElement) {
            let summary = `Bugün: ${totalToday} zikir`;
            if (totalWeek > totalToday) summary += ` • Bu hafta: ${totalWeek} zikir`;
            if (totalMonth > totalWeek) summary += ` • Bu ay: ${totalMonth} zikir`;
            if (totalYear > totalMonth) summary += ` • Bu yıl: ${totalYear} zikir`;
            summary += ` • Genel toplam: ${totalAll} zikir 🤲`;
            summaryElement.textContent = summary;
        }

    } catch (error) {
        console.error('Erreur statistiques:', error);
    }
}

// Obtenir les stats globales de l'utilisateur (pour le groupe)
function getCurrentUserStats() {
    let totalToday = 0;
    let totalWeek = 0;
    let totalMonth = 0;
    let totalAll = 0;

    // Agréger les stats de toutes les catégories
    categories.forEach(cat => {
        const stats = getStatisticsForCategory(cat);
        totalToday += stats.day;
        totalWeek += stats.week;
        totalMonth += stats.month;
        totalAll += stats.total;
    });

    return {
        today: totalToday,
        week: totalWeek,
        month: totalMonth,
        total: totalAll,
        categories: categories.reduce((acc, cat) => {
            const stats = getStatisticsForCategory(cat);
            acc[cat] = {
                today: stats.day,
                week: stats.week,
                month: stats.month
            };
            return acc;
        }, {})
    };
}

// Fonctions d'effacement simplifiées et cohérentes
function resetTodayCategory() {
    const category = document.getElementById('categoryToReset').value;
    if (!category) {
        showCustomAlert('KATEGORİ SEÇİN!<br><br>Silinecek kategoriyi seçin.', 'warning', 3000);
        return;
    }

    showCustomConfirm(
        'Bugünü Sil',
        `"${category}" için BUGÜNÜN tüm zikirlerini sil?<br><br>Bu işlem istatistikleri etkileyecek!`,
        function() {
            const today = new Date().toDateString();
            if (counters[category] && counters[category][today]) {
                counters[category][today] = 0;
                saveCounters();
                updateCounterDisplay();
                updateStats();
                showCustomAlert('Bugünün zikirleri silindi!', 'success', 2000);
            }
        }
    );
}

function resetWeekCategory() {
    const category = document.getElementById('categoryToReset').value;
    if (!category) {
        showCustomAlert('KATEGORİ SEÇİN!<br><br>Silinecek kategoriyi seçin.', 'warning', 3000);
        return;
    }

    showCustomConfirm(
        'Bu Hafta Sil',
        `"${category}" için BU HAFTANıN tüm zikirlerini sil?<br><br>Bu işlem istatistikleri etkileyecek!`,
        function() {
            const today = new Date();
            const weekStart = getWeekStart(today);
            const weekEnd = getWeekEnd(today);

            if (counters[category]) {
                Object.keys(counters[category]).forEach(dateStr => {
                    const date = new Date(dateStr);
                    if (date >= weekStart && date <= weekEnd) {
                        counters[category][dateStr] = 0;
                    }
                });
                saveCounters();
                updateCounterDisplay();
                updateStats();
                showCustomAlert('Bu haftanın zikirleri silindi!', 'success', 2000);
            }
        }
    );
}

function resetMonthCategory() {
    const category = document.getElementById('categoryToReset').value;
    if (!category) {
        showCustomAlert('KATEGORİ SEÇİN!<br><br>Silinecek kategoriyi seçin.', 'warning', 3000);
        return;
    }

    showCustomConfirm(
        'Bu Ayı Sil',
        `"${category}" için BU AYıN tüm zikirlerini sil?<br><br>Bu işlem istatistikleri etkileyecek!`,
        function() {
            const today = new Date();
            const monthStart = getMonthStart(today);
            const monthEnd = getMonthEnd(today);

            if (counters[category]) {
                Object.keys(counters[category]).forEach(dateStr => {
                    const date = new Date(dateStr);
                    if (date >= monthStart && date <= monthEnd) {
                        counters[category][dateStr] = 0;
                    }
                });
                saveCounters();
                updateCounterDisplay();
                updateStats();
                showCustomAlert('Bu ayın zikirleri silindi!', 'success', 2000);
            }
        }
    );
}

function resetCategoryCompletely() {
    const category = document.getElementById('categoryToReset').value;
    if (!category) {
        showCustomAlert('KATEGORİ SEÇİN!<br><br>Silinecek kategoriyi seçin.', 'warning', 3000);
        return;
    }

    showCustomConfirm(
        'TEHLİKE - Tamamen Silme',
        `"${category}" kategorisinin tüm geçmişini KALICI olarak sil?<br><br>Bu işlem GERİ ALINMAZ!`,
        function() {
            showCustomConfirm(
                'SON ŞANS',
                `GERÇEKTEN emin misiniz?<br><br>"${category}" kategorisinin TÜM geçmişi kaybolacak!`,
                function() {
                    // Réinitialiser complètement la catégorie
                    counters[category] = {};
                    counters[category][currentDate] = 0;

                    saveCounters();
                    updateCounterDisplay();
                    updateStats();
                    showCustomAlert('Geçmiş tamamen silindi!', 'warning', 3000);
                }
            );
        }
    );
}

function resetAllData() {
    showCustomConfirm(
        'AŞİRİ TEHLİKE',
        'TÜM zikir verilerinizi silin?<br><br>Bu KALICI olarak silecek:<br>• Tüm sayaçlar<br>• Tüm geçmiş<br>• Tüm istatistikler',
        function() {
            showCustomConfirm(
                'SON ŞANS',
                'KESİNLİKLE emin misiniz?<br><br>Bu işlem GERİ ALINMAZ!',
                function() {
                    // Demander la confirmation par saisie
                    const confirmationDiv = document.createElement('div');
                    confirmationDiv.className = 'custom-confirm';
                    confirmationDiv.innerHTML = `
                        <h3>Son Onay</h3>
                        <p>Onaylamak için tam olarak <strong>"SİL"</strong> yazın:</p>
                        <input type="text" id="confirmInput" style="padding: 10px; font-size: 16px; margin: 10px 0; text-align: center; border: 2px solid #e53e3e; border-radius: 5px;">
                        <div class="confirm-buttons">
                            <button class="confirm-btn confirm-yes">Onayla</button>
                            <button class="confirm-btn confirm-no">İptal</button>
                        </div>
                    `;
                    document.body.appendChild(confirmationDiv);

                    const input = confirmationDiv.querySelector('#confirmInput');
                    const yesBtn = confirmationDiv.querySelector('.confirm-yes');
                    const noBtn = confirmationDiv.querySelector('.confirm-no');

                    function closeConfirmDiv() {
                        confirmationDiv.remove();
                    }

                    yesBtn.addEventListener('click', () => {
                        if (input.value === 'SİL') {
                            // Réinitialiser toutes les données
                            counters = {};
                            categories.forEach(cat => {
                                counters[cat] = {};
                            });

                            saveCounters();
                            updateCounterDisplay();
                            updateStats();
                            closeConfirmDiv();
                            showCustomAlert('TÜM verileriniz silindi!', 'warning', 4000);
                        } else {
                            showCustomAlert('Yanlış metin! Veriler korundu.', 'warning', 3000);
                            closeConfirmDiv();
                        }
                    });

                    noBtn.addEventListener('click', () => {
                        closeConfirmDiv();
                        showCustomAlert('İptal - verileriniz korundu!', 'success', 3000);
                    });

                    setTimeout(() => {
                        confirmationDiv.classList.add('show');
                        input.focus();
                    }, 100);
                }
            );
        }
    );
}

// Export/Import
function exportData() {
    try {
        const exportData = {
            categories: categories,
            counters: counters,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});

        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `zikirmatik-${new Date().toISOString().split('T')[0]}.json`;
        link.click();

        showCustomAlert('Dışa aktarma başarılı!<br>Dosya başarıyla indirildi', 'success', 3000);
    } catch (error) {
        console.error('Erreur export:', error);
        showCustomAlert('Dışa aktarma hatası', 'error', 3000);
    }
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);

            if (!importedData.categories || !importedData.counters) {
                throw new Error('Geçersiz format');
            }

            showCustomConfirm(
                'Veri İçe Aktar',
                'Bu verileri içe aktarmak mevcut TÜM verilerinizi değiştirecek.<br><br>Devam etmek istiyor musunuz?',
                function() {
                    // Confirmation "Oui"
                    categories = importedData.categories;
                    counters = importedData.counters;

                    saveCategories();
                    saveCounters();

                    updateCategorySelect();
                    updateCategoriesList();
                    updateCounterDisplay();
                    updateStats();

                    showCustomAlert('İçe aktarma başarılı!<br>Verileriniz geri yüklendi', 'success', 3000);
                },
                function() {
                    // Confirmation "Non"
                    showCustomAlert('İçe aktarma iptal edildi<br>Mevcut verileriniz korundu', 'warning', 3000);
                }
            );

        } catch (error) {
            console.error('Erreur import:', error);
            showCustomAlert('İçe aktarma hatası<br>Dosyayı kontrol edin', 'error', 3000);
        }
    };
    reader.readAsText(file);
}

// Partage SMS
function shareStatsBySMS() {
    const today = new Date();
    const dateStr = today.toLocaleDateString('tr-TR');
    const todayDateString = today.toDateString();

    let message = `MANEVİ ZİKİRLERİM - ${dateStr}\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    let totalToday = 0;
    let totalGeneral = 0;

    categories.forEach(cat => {
        const todayCount = (counters[cat] && counters[cat][todayDateString]) ? counters[cat][todayDateString] : 0;

        let categoryTotal = 0;
        if (counters[cat]) {
            Object.values(counters[cat]).forEach(count => {
                categoryTotal += count || 0;
            });
        }

        totalToday += todayCount;
        totalGeneral += categoryTotal;

        if (categoryTotal > 0) {
            message += `${cat}:\n`;
            message += `   Bugün: ${todayCount}\n`;
            message += `   Toplam: ${categoryTotal}\n\n`;
        }
    });

    message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    message += `ÖZET:\n`;
    message += `• Bugün: ${totalToday} zikir\n`;
    message += `• GENEL TOPLAM: ${totalGeneral} zikir\n\n`;
    message += `Allah dualarımızı kabul etsin\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

    try {
        // Créer le lien SMS
        const smsLink = `sms:?body=${encodeURIComponent(message)}`;
        const link = document.createElement('a');
        link.href = smsLink;
        link.click();

        // Copier dans le presse-papiers
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(message).then(() => {
                showCustomAlert('SMS açıldı!<br>Mesaj panoya kopyalandı', 'success', 4000);
            }).catch(() => {
                showCustomAlert('SMS uygulaması açıldı!<br>Gerekirse elle kopyalayın', 'success', 4000);
            });
        } else {
            showCustomAlert('SMS uygulaması açıldı!<br>Gerekirse elle kopyalayın', 'success', 4000);
        }

    } catch (error) {
        // En cas d'erreur, juste copier dans le presse-papiers
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(message).then(() => {
                showCustomAlert('Mesaj panoya kopyalandı!<br>SMS uygulamanıza yapıştırın', 'success', 4000);
            }).catch(() => {
                showCustomAlert('SMS açılamadı<br>Elle kopyalamayı deneyin', 'warning', 4000);
            });
        } else {
            showCustomAlert('SMS açılamadı<br>Elle kopyalamayı deneyin', 'warning', 4000);
        }
    }
}

// Vérification stockage
function checkStorageAvailability() {
    try {
        const test = 'test';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
    } catch (error) {
        return false;
    }
}

// Sauvegarde automatique
function autoSave() {
    if (checkStorageAvailability()) {
        saveCounters();
        saveCategories();
    }
}

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    try {
        const savedCategories = localStorage.getItem('categories');
        const savedCounters = localStorage.getItem('counters');

        if (savedCategories) {
            categories = JSON.parse(savedCategories);
        }

        if (savedCounters) {
            counters = JSON.parse(savedCounters);
        }
    } catch (error) {
        console.error('Erreur chargement:', error);
    }

    initializeCounters();
    updateCategorySelect();
    updateCategoriesList();
    updateCounterDisplay();
    updateSaveStatus();

    // Initialize sound and timer
    initSound();
    startTimer();

    // Enable audio on first interaction for mobile
    enableAudioOnInteraction();

    // Initialize backend (Supabase)
    initializeBackend();

    // Événements
    const categorySelect = document.getElementById('categorySelect');
    if (categorySelect) {
        categorySelect.addEventListener('change', function() {
            currentCategory = this.value;
            updateCounterDisplay();
            updateStats();
        });
    }

    const newCategoryInput = document.getElementById('newCategoryInput');
    if (newCategoryInput) {
        newCategoryInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                addCategory();
            }
        });
    }

    setTimeout(() => {
        updateStats();
    }, 300);

    if (!localStorage.getItem('hasUsedApp')) {
        localStorage.setItem('hasUsedApp', 'true');
    }
});

// Sauvegardes périodiques
window.addEventListener('beforeunload', autoSave);
window.addEventListener('blur', autoSave);
document.addEventListener('visibilitychange', function() {
    if (document.hidden) autoSave();
});

// ⚡ OPTIMISATION: Utiliser debounce au lieu d'intervals constants
// Les stats sont mises à jour automatiquement quand on incrémente le compteur
// Plus besoin de recalculer toutes les 60s !

// Créer les fonctions debouncées
const debouncedUpdateStats = debounce(updateStats, 2000) // 2s après changement
const debouncedAutoSave = debounce(autoSave, 5000)       // 5s après changement

// Garder juste un interval pour le status (peu coûteux)
setInterval(updateSaveStatus, 60000);

// Service Worker pour PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('./sw.js')
            .then(function(registration) {
                console.log('Service Worker başarıyla kaydedildi:', registration.scope);

                // Vérifier les mises à jour
                registration.addEventListener('updatefound', function() {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', function() {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // Nouvelle version disponible
                            if (confirm('Yeni sürüm mevcut! Yeniden yükle?')) {
                                newWorker.postMessage({ type: 'SKIP_WAITING' });
                                window.location.reload();
                            }
                        }
                    });
                });
            })
            .catch(function(error) {
                console.log('Service Worker hatası:', error);
            });
    });

    // Écouter les changements de Service Worker
    navigator.serviceWorker.addEventListener('controllerchange', function() {
        window.location.reload();
    });
}

// Détection installation PWA
let deferredPrompt;
window.addEventListener('beforeinstallprompt', function(e) {
    e.preventDefault();
    deferredPrompt = e;

    // Afficher un bouton d'installation après 3 secondes
    setTimeout(() => {
        if (deferredPrompt && !localStorage.getItem('pwa-dismissed')) {
            showCustomConfirm(
                'Uygulama Kur',
                'Çetelem\'i ana ekranınıza kurmak istiyor musunuz?<br><br>Hızlı erişim<br>Çevrim dışı çalışır<br>Verileriniz gizli kalır',
                function() {
                    deferredPrompt.prompt();
                    deferredPrompt.userChoice.then((choiceResult) => {
                        if (choiceResult.outcome === 'accepted') {
                            showCustomAlert('Uygulama kuruldu!', 'success', 3000);
                        } else {
                            localStorage.setItem('pwa-dismissed', 'true');
                        }
                        deferredPrompt = null;
                    });
                },
                function() {
                    localStorage.setItem('pwa-dismissed', 'true');
                }
            );
        }
    }, 3000);
});

// ========================================
// BACKEND INITIALIZATION
// ========================================

function initializeBackend() {
  try {
    const config = BackendConfig.getActiveProvider()

    let provider
    if (config.type === 'supabase') {
      provider = new SupabaseProvider(config.url, config.key)
      console.log('Supabase initialisé')
    } else if (config.type === 'infomaniak') {
      provider = new InfomaniakProvider(config.apiUrl, config.apiKey)
      console.log('Infomaniak initialisé')
    }

    groupManager.initialize(provider)

    // Écouter les mises à jour temps réel
    window.addEventListener('groupUpdate', async (event) => {
      console.log('📡 Mise à jour groupe reçue:', event.detail)
      // Le classement se met à jour automatiquement via l'événement
      if (typeof updateLeaderboard === 'function') {
        await updateLeaderboard()
      }
    })

    // Restaurer l'interface du groupe si un groupe est actif
    setTimeout(() => {
      const groupTab = document.getElementById('group')
      const isGroupTabActive = groupTab && groupTab.classList.contains('active')

      if (groupManager.hasActiveGroup()) {
        const groupInfo = groupManager.getCurrentGroup()
        console.log('Restauration du groupe:', groupInfo.group.name)

        // Si on est sur l'onglet groupe, afficher l'interface
        if (isGroupTabActive) {
          showGroupInterface(groupInfo.group.code)
          updateLeaderboard()
        }
      } else {
        // Pas de groupe actif - afficher l'historique si onglet groupe actif
        if (isGroupTabActive && typeof displayGroupHistory === 'function') {
          console.log('Affichage historique des groupes')
          displayGroupHistory()
        }
      }
    }, 300)

  } catch (error) {
    console.error('Erreur initialisation backend:', error)
    showCustomAlert('Backend non configuré<br>Le mode groupe ne sera pas disponible', 'warning', 3000)
  }
}

// ========================================
// GROUP FUNCTIONALITY - Local Storage System
// ========================================

// Helper function to get today's total count
function getTotalCountToday() {
    const today = new Date().toDateString();
    let total = 0;

    for (const category in counters) {
        if (counters[category] && counters[category][today]) {
            total += counters[category][today];
        }
    }

    return total;
}

// Local group system functions
function createLocalGroup(groupName, creatorName, groupCode) {
    try {
        const groupData = {
            groupInfo: {
                name: groupName,
                code: groupCode,
                creator: creatorName,
                created: new Date().toISOString(),
                type: 'local'
            },
            participants: {
                [creatorName]: {
                    name: creatorName,
                    joined: new Date().toISOString(),
                    totalCount: 0,
                    lastUpdate: new Date().toISOString()
                }
            }
        };

        // Save group locally
        localStorage.setItem(`group_${groupCode}`, JSON.stringify(groupData));
        localStorage.setItem('currentGroupCode', groupCode);

        currentGroup = {
            code: groupCode,
            name: groupName,
            creator: creatorName,
            isLocal: true
        };

        participantName = creatorName;
        isGroupCreator = true;

        showCustomAlert('Yerel grup oluşturuldu!<br>Kod: ' + groupCode, 'success', 3000);
        showGroupInterface(groupCode);
        startLocalGroupSync();

    } catch (error) {
        console.error('Local group creation failed:', error);
        showCustomAlert('Grup oluşturulamadı', 'error', 3000);
        hideStatus();
    }
}

function joinLocalGroup(groupCode, participantName) {
    try {
        const groupData = JSON.parse(localStorage.getItem(`group_${groupCode}`));

        if (!groupData) {
            showCustomAlert('Grup bulunamadı<br>Kod: ' + groupCode, 'error', 3000);
            return false;
        }

        // Add participant
        groupData.participants[participantName] = {
            name: participantName,
            joined: new Date().toISOString(),
            totalCount: 0,
            lastUpdate: new Date().toISOString()
        };

        // Save updated group
        localStorage.setItem(`group_${groupCode}`, JSON.stringify(groupData));
        localStorage.setItem('currentGroupCode', groupCode);

        currentGroup = {
            code: groupCode,
            name: groupData.groupInfo.name,
            creator: groupData.groupInfo.creator,
            isLocal: true
        };

        showCustomAlert('Gruba katıldınız!', 'success', 2000);
        showGroupInterface(groupCode);
        startLocalGroupSync();

        return true;

    } catch (error) {
        console.error('Join local group failed:', error);
        showCustomAlert('Gruba katılınamadı', 'error', 3000);
        return false;
    }
}

function updateLocalGroupCount() {
    if (!currentGroup || !currentGroup.isLocal || !participantName) return;

    try {
        const groupData = JSON.parse(localStorage.getItem(`group_${currentGroup.code}`));

        if (!groupData || !groupData.participants[participantName]) return;

        // Update participant's count
        const totalToday = getTotalCountToday();
        groupData.participants[participantName].totalCount = totalToday;
        groupData.participants[participantName].lastUpdate = new Date().toISOString();

        // Save updated data
        localStorage.setItem(`group_${currentGroup.code}`, JSON.stringify(groupData));

    } catch (error) {
        console.error('Update local group count failed:', error);
    }
}

function startLocalGroupSync() {
    // Update every 10 seconds
    if (updateInterval) clearInterval(updateInterval);

    updateInterval = setInterval(() => {
        if (currentGroup && currentGroup.isLocal) {
            updateLocalGroupCount();
            updateLocalLeaderboard();
        }
    }, 10000);

    // Initial update
    updateLocalGroupCount();
    updateLocalLeaderboard();
}

function updateLocalLeaderboard() {
    if (!currentGroup || !currentGroup.isLocal) return;

    try {
        const groupData = JSON.parse(localStorage.getItem(`group_${currentGroup.code}`));

        if (!groupData) return;

        const participants = Object.values(groupData.participants);
        participants.sort((a, b) => b.totalCount - a.totalCount);

        const leaderboardContent = document.getElementById('leaderboardContent');
        if (!leaderboardContent) return;

        let html = '<div class="leaderboard-list">';

        participants.forEach((participant, index) => {
            const position = index + 1;
            const isCurrentUser = participant.name === participantName;
            const medal = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : `${position}.`;

            html += `
                <div class="leaderboard-item ${isCurrentUser ? 'current-user' : ''}">
                    <span class="position">${medal}</span>
                    <span class="participant-name">${participant.name}${isCurrentUser ? ' (Siz)' : ''}</span>
                    <span class="participant-count">${participant.totalCount}</span>
                </div>
            `;
        });

        html += '</div>';
        html += `<div class="group-info"><small>Yerel Grup • ${participants.length} katılımcı</small></div>`;

        leaderboardContent.innerHTML = html;

    } catch (error) {
        console.error('Update local leaderboard failed:', error);
    }
}


// ============================================
// NOTES PAR CATÉGORIE
// ============================================

// Objet pour stocker les notes de catégories
let categoryNotes = {};

// Charger les notes depuis localStorage
function loadCategoryNotes() {
    const saved = localStorage.getItem('categoryNotes');
    if (saved) {
        try {
            categoryNotes = JSON.parse(saved);
        } catch (e) {
            categoryNotes = {};
        }
    }
}

// Sauvegarder les notes dans localStorage
function saveCategoryNotes() {
    localStorage.setItem('categoryNotes', JSON.stringify(categoryNotes));
}

// Obtenir la note d'une catégorie
function getCategoryNote(category) {
    return categoryNotes[category] || '';
}

// Modal pour éditer une note de catégorie
function showCategoryNoteModal(category, event) {
    if (event) event.stopPropagation();
    
    const currentNote = getCategoryNote(category);
    
    const html = `
        <div class="custom-modal-overlay" id="categoryNoteModal">
            <div class="custom-modal" style="max-width: 500px;">
                <div class="modal-header">
                    <h3>Not - ${category}</h3>
                    <button class="modal-close" onclick="document.getElementById('categoryNoteModal').remove()">✕</button>
                </div>
                <div class="modal-body">
                    <p style="font-size: 13px; color: #64748b; margin-bottom: 12px;">
                        Bu kategori için notunuzu yazın (niyet, amaç, hatırlatma vs.)
                    </p>
                    <textarea id="categoryNoteInput" class="notes-textarea" 
                        placeholder="Örnek: Allah rızası için, şifa duası, aileme dua..."
                        style="min-height: 100px;">${currentNote}</textarea>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="document.getElementById('categoryNoteModal').remove()">İptal</button>
                    <button class="btn-primary" onclick="saveCategoryNote('${category.replace(/'/g, "\\'")}')">💾 Kaydet</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', html);
    
    // Auto-expand textarea
    const textarea = document.getElementById('categoryNoteInput');
    autoExpandTextarea(textarea);
    textarea.addEventListener('input', () => autoExpandTextarea(textarea));
    textarea.focus();
}

// Sauvegarder une note de catégorie
function saveCategoryNote(category) {
    const note = document.getElementById('categoryNoteInput').value.trim();
    
    if (note) {
        categoryNotes[category] = note;
    } else {
        delete categoryNotes[category];
    }
    
    saveCategoryNotes();
    document.getElementById('categoryNoteModal').remove();
    updateStats(); // Rafraîchir pour mettre à jour l'icône
    
    showCustomAlert('Not kaydedildi!', 'success', 2000);
}

// Charger les notes au démarrage
if (typeof window !== 'undefined') {
    loadCategoryNotes();
}
