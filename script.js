// Variables globales - SYSTÈME SIMPLIFIÉ
let categories = JSON.parse(localStorage.getItem('categories')) || ['Subhan Allah', 'Elhamdulillah', 'Allahu Ekber'];
let counters = JSON.parse(localStorage.getItem('counters')) || {};
let currentCategory = '';
let currentDate = new Date().toDateString();
let visualOffset = 0; // Décalage visuel pour l'affichage

// Métadonnées et historique
let categoryMetadata = JSON.parse(localStorage.getItem('categoryMetadata')) || {};
// Historique supprimé - fonctionnalité retirée
// let deletedHistory = JSON.parse(localStorage.getItem('deletedHistory')) || [];

// Timer variables
let startTime = Date.now();
let timerInterval = null;

// Sound variables
let soundEnabled = localStorage.getItem('soundEnabled') !== 'false';
let tickSound = null;
let audioPool = []; // Pool d'instances audio pré-créées pour réduire la latence
let poolIndex = 0;

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

function resetTimer() {
    startTime = Date.now();
    updateTimer();
}

// Sound functions
function initSound() {
    // Use the real tesbih sound file
    try {
        tickSound = new Audio('/assets/audio/tesbih_variant_1.mp3');
        tickSound.volume = 0.7;
        tickSound.preload = 'auto';

        // Test if the audio loads properly
        tickSound.addEventListener('canplaythrough', function() {
            console.log('Tesbih sound loaded successfully');
            // ⚡ Créer un pool d'instances audio pré-chargées pour mobile (latence réduite)
            createAudioPool();
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

// ⚡ Créer un pool d'instances audio pour éliminer la latence sur mobile
function createAudioPool() {
    if (!tickSound || tickSound.currentTime === undefined) return;

    // Créer 5 instances pré-chargées
    for (let i = 0; i < 5; i++) {
        const audio = tickSound.cloneNode();
        audio.volume = tickSound.volume;
        audioPool.push(audio);
    }
    console.log('Audio pool créé: 5 instances prêtes');
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
        // ⚡ Pour les fichiers audio - utiliser le pool pour latence minimale
        if (tickSound.currentTime !== undefined) {
            let sound;

            // Si le pool est disponible, l'utiliser (BEAUCOUP plus rapide)
            if (audioPool.length > 0) {
                sound = audioPool[poolIndex];
                poolIndex = (poolIndex + 1) % audioPool.length;

                // Si le son est encore en train de jouer, le redémarrer
                if (sound.currentTime > 0) {
                    sound.currentTime = 0;
                }
            } else {
                // Fallback: cloner si le pool n'est pas prêt
                sound = tickSound.cloneNode();
                sound.volume = tickSound.volume;
            }

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

    // ✅ FIX XSS: Créer la structure DOM de manière sécurisée
    const confirmDiv = document.createElement('div');
    confirmDiv.className = 'custom-confirm';

    // Créer le titre (échappé)
    const titleElement = document.createElement('h3');
    titleElement.textContent = title;

    // Créer le message (échappé)
    const messageElement = document.createElement('p');
    messageElement.innerHTML = message; // Autorisé car message provient du code, pas de l'utilisateur

    // Créer les boutons
    const buttonsDiv = document.createElement('div');
    buttonsDiv.className = 'confirm-buttons';

    const yesButton = document.createElement('button');
    yesButton.className = 'confirm-btn confirm-yes';
    yesButton.textContent = 'Evet';

    const noButton = document.createElement('button');
    noButton.className = 'confirm-btn confirm-no';
    noButton.textContent = 'Hayır';

    buttonsDiv.appendChild(yesButton);
    buttonsDiv.appendChild(noButton);

    confirmDiv.appendChild(titleElement);
    confirmDiv.appendChild(messageElement);
    confirmDiv.appendChild(buttonsDiv);
    document.body.appendChild(confirmDiv);

    // Gestionnaires d'événements (utiliser les références déjà créées)
    function closeConfirm() {
        confirmDiv.classList.remove('show');
        setTimeout(() => {
            if (confirmDiv && confirmDiv.parentNode) {
                confirmDiv.remove();
            }
        }, 300);
    }

    yesButton.addEventListener('click', () => {
        closeConfirm();
        if (onYes) onYes();
    });

    noButton.addEventListener('click', () => {
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

    // ✅ FIX XSS: Créer la notification de manière sécurisée
    const alertDiv = document.createElement('div');
    alertDiv.className = `custom-alert ${type}`;
    // innerHTML autorisé ici car message provient du code (pas de l'utilisateur)
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
        const data = JSON.stringify(categories);

        // ⚡ FIX: Vérifier quota avant sauvegarde
        if (!checkStorageQuota(data)) {
            showCustomAlert('⚠️ Stockage presque plein!<br>Exportez vos données pour libérer de l\'espace', 'warning', 5000);
            return false;
        }

        localStorage.setItem('categories', data);
        localStorage.setItem('lastSave', new Date().toISOString());
        showSaveIndicator();
        updateSaveStatus();
        return true;
    } catch (error) {
        console.error('Erreur sauvegarde catégories:', error);

        // ⚡ FIX: Gestion spécifique QuotaExceededError
        if (error.name === 'QuotaExceededError') {
            showCustomAlert('❌ Stockage plein!<br>Veuillez exporter et supprimer des anciennes données', 'error', 6000);
        }
        return false;
    }
}

function saveCounters() {
    try {
        const data = JSON.stringify(counters);

        // ⚡ FIX: Vérifier quota avant sauvegarde
        if (!checkStorageQuota(data)) {
            showCustomAlert('⚠️ Stockage presque plein!<br>Exportez vos données pour libérer de l\'espace', 'warning', 5000);
            return false;
        }

        localStorage.setItem('counters', data);
        localStorage.setItem('lastSave', new Date().toISOString());
        showSaveIndicator();
        updateSaveStatus();
        return true;
    } catch (error) {
        console.error('Erreur sauvegarde compteurs:', error);

        // ⚡ FIX: Gestion spécifique QuotaExceededError
        if (error.name === 'QuotaExceededError') {
            showCustomAlert('❌ Stockage plein!<br>Veuillez exporter et supprimer des anciennes données', 'error', 6000);
        }
        return false;
    }
}

// ⚡ FIX: Vérifier quota localStorage
function checkStorageQuota(newData) {
    try {
        // Estimer l'utilisation actuelle
        let currentSize = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                currentSize += localStorage[key].length + key.length;
            }
        }

        const newDataSize = newData.length;
        const estimatedTotal = currentSize + newDataSize;

        // Limite typique: 5MB = 5,242,880 bytes
        // Alerter si > 80% (4MB)
        const LIMIT = 4 * 1024 * 1024;

        if (estimatedTotal > LIMIT) {
            console.warn(`localStorage proche de la limite: ${(estimatedTotal / 1024 / 1024).toFixed(2)}MB`);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Erreur vérification quota:', error);
        return true; // Continuer en cas d'erreur de vérification
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
    }

    // Activate the clicked button
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
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

        // ✅ FIX XSS: Créer la structure DOM de manière sécurisée
        const contentDiv = document.createElement('div');

        const strongElement = document.createElement('strong');
        strongElement.textContent = cat; // ✅ textContent au lieu de innerHTML

        const smallElement = document.createElement('small');
        smallElement.style.color = '#666';
        smallElement.style.display = 'block';
        smallElement.textContent = `Toplam: ${stats.total} zikir`;

        contentDiv.appendChild(strongElement);
        contentDiv.appendChild(smallElement);

        // Container pour les boutons
        const buttonsDiv = document.createElement('div');
        buttonsDiv.style.display = 'flex';
        buttonsDiv.style.gap = '8px';

        // Bouton de modification
        const editButton = document.createElement('button');
        editButton.className = 'edit-button';
        editButton.textContent = '✏️ Düzenle';
        editButton.onclick = () => editCategory(index);

        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-button';
        deleteButton.textContent = 'Kategoriyi sil';
        deleteButton.onclick = () => deleteCategory(index); // ✅ Éviter onclick inline

        buttonsDiv.appendChild(editButton);
        buttonsDiv.appendChild(deleteButton);

        li.appendChild(contentDiv);
        li.appendChild(buttonsDiv);
        list.appendChild(li);
    });
}

// Note: addCategory() supprimée - maintenant on utilise showQuickAddCategory()
// qui ouvre le modal multi-étapes avec objectifs

// Supprimer une catégorie définitivement
function deleteCategory(index) {
    const categoryName = categories[index];

    showCustomConfirm(
        'Zikiri Sil',
        `"${categoryName}" zikrini kalıcı olarak silmek istediğinize emin misiniz?<br><br>Bu işlem geri alınamaz!`,
        function() {
            // Supprimer de la liste active
            categories.splice(index, 1);
            delete counters[categoryName];
            delete categoryMetadata[categoryName];
            delete categoryGoals[categoryName];

            saveCategories();
            saveCounters();
            localStorage.setItem('categoryMetadata', JSON.stringify(categoryMetadata));
            localStorage.setItem('categoryGoals', JSON.stringify(categoryGoals));

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

            showCustomAlert(`"${categoryName}" silindi!`, 'success', 2500);
        }
    );
}

// Modifier une catégorie - MULTI-ÉTAPES
function editCategory(index) {
    const oldCategoryName = categories[index];
    const currentGoals = getCategoryGoals(oldCategoryName);

    const modalHTML = `
        <div class="custom-modal-overlay" onclick="if(event.target === this) this.remove()">
            <div class="custom-modal" style="min-height: 280px;">
                <div class="modal-header">
                    <h3 id="edit-zikir-modal-title">✏️ Zikiri Düzenle</h3>
                    <button class="modal-close" onclick="this.closest('.custom-modal-overlay').remove()">✕</button>
                </div>

                <!-- Indicateur de progression -->
                <div style="display: flex; gap: 8px; padding: 0 24px 16px; justify-content: center;">
                    <div id="edit-zikir-step-indicator-1" class="step-indicator active"></div>
                    <div id="edit-zikir-step-indicator-2" class="step-indicator"></div>
                    <div id="edit-zikir-step-indicator-3" class="step-indicator"></div>
                </div>

                <div class="modal-body" id="edit-zikir-modal-body-content">
                    <!-- Étape 1: Nom du zikir -->
                    <div id="edit-zikir-step-1" class="modal-step">
                        <div class="form-group">
                            <label class="form-label" style="font-size: 16px; margin-bottom: 12px;">Zikir Adı</label>
                            <input type="text" id="editZikirNameInput" class="form-input" value="${oldCategoryName}" required autofocus>
                        </div>
                    </div>

                    <!-- Étape 2: Objectif quotidien -->
                    <div id="edit-zikir-step-2" class="modal-step" style="display: none;">
                        <div class="form-group">
                            <label class="form-label" style="font-size: 16px; margin-bottom: 12px;">Günlük Hedef Sayısı</label>
                            <input type="number" id="editZikirDailyGoalInput" class="form-input" placeholder="Örn: 100" min="0" value="${currentGoals.daily || 0}">
                            <small style="color: #64748b; font-size: 12px; margin-top: 8px; display: block;">
                                Her gün bu sayıya ulaşmayı hedefleyin (isteğe bağlı)
                            </small>
                        </div>
                    </div>

                    <!-- Étape 3: Objectif hebdomadaire -->
                    <div id="edit-zikir-step-3" class="modal-step" style="display: none;">
                        <div class="form-group">
                            <label class="form-label" style="font-size: 16px; margin-bottom: 12px;">Haftalık Hedef Sayısı</label>
                            <input type="number" id="editZikirWeeklyGoalInput" class="form-input" placeholder="Örn: 700" min="0" value="${currentGoals.weekly || 0}">
                            <small style="color: #64748b; font-size: 12px; margin-top: 8px; display: block;">
                                Her hafta bu sayıya ulaşmayı hedefleyin (isteğe bağlı)
                            </small>
                        </div>
                    </div>
                </div>

                <div class="modal-footer">
                    <button class="btn-secondary" id="edit-zikir-btn-back" onclick="previousStepEditZikir()" style="display: none;">
                        ← Geri
                    </button>
                    <button class="btn-secondary" onclick="this.closest('.custom-modal-overlay').remove()">
                        İptal
                    </button>
                    <button class="btn-primary" id="edit-zikir-btn-next" onclick="nextStepEditZikir()">
                        Devam →
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Variables globales pour le formulaire en étapes
    window.editZikirFormData = {
        currentStep: 1,
        totalSteps: 3,
        index: index,
        oldName: oldCategoryName,
        name: oldCategoryName,
        dailyGoal: currentGoals.daily || 0,
        weeklyGoal: currentGoals.weekly || 0
    };

    // Gestion de la touche Enter
    const modalOverlay = document.querySelector('.custom-modal-overlay:last-of-type');
    modalOverlay.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            nextStepEditZikir();
        }
    });

    document.getElementById('editZikirNameInput').focus();
    document.getElementById('editZikirNameInput').select();
}

// Navigation entre les étapes - EDIT
function nextStepEditZikir() {
    const currentStep = window.editZikirFormData.currentStep;

    // Validation étape 1: nom du zikir
    if (currentStep === 1) {
        const nameInput = document.getElementById('editZikirNameInput');
        const newName = nameInput.value.trim();

        if (!newName) {
            showCustomAlert('Zikir adı boş olamaz!', 'warning', 2500);
            return;
        }

        // Vérifier si le nom existe déjà (sauf si c'est le même)
        if (newName !== window.editZikirFormData.oldName && categories.includes(newName)) {
            showCustomAlert('Bu zikir adı zaten mevcut!', 'warning', 2500);
            return;
        }

        window.editZikirFormData.name = newName;
    }

    // Validation étape 2: objectif quotidien
    if (currentStep === 2) {
        const dailyGoalInput = document.getElementById('editZikirDailyGoalInput');
        const dailyGoal = parseInt(dailyGoalInput.value) || 0;
        window.editZikirFormData.dailyGoal = dailyGoal;
    }

    // Validation étape 3: objectif hebdomadaire et finalisation
    if (currentStep === 3) {
        const weeklyGoalInput = document.getElementById('editZikirWeeklyGoalInput');
        const weeklyGoal = parseInt(weeklyGoalInput.value) || 0;
        window.editZikirFormData.weeklyGoal = weeklyGoal;

        // Finaliser la modification
        finalizeEditZikir();
        return;
    }

    // Passer à l'étape suivante
    if (currentStep < window.editZikirFormData.totalSteps) {
        // Masquer l'étape actuelle
        document.getElementById(`edit-zikir-step-${currentStep}`).style.display = 'none';
        document.getElementById(`edit-zikir-step-indicator-${currentStep}`).classList.remove('active');

        // Afficher l'étape suivante
        window.editZikirFormData.currentStep++;
        const nextStep = window.editZikirFormData.currentStep;

        document.getElementById(`edit-zikir-step-${nextStep}`).style.display = 'block';
        document.getElementById(`edit-zikir-step-indicator-${nextStep}`).classList.add('active');

        // Mettre à jour les boutons
        document.getElementById('edit-zikir-btn-back').style.display = 'inline-block';

        if (nextStep === window.editZikirFormData.totalSteps) {
            document.getElementById('edit-zikir-btn-next').textContent = 'Kaydet ✓';
        }

        // Focus sur le prochain champ
        const nextInput = document.querySelector(`#edit-zikir-step-${nextStep} input`);
        if (nextInput) nextInput.focus();
    }
}

function previousStepEditZikir() {
    const currentStep = window.editZikirFormData.currentStep;

    if (currentStep > 1) {
        // Masquer l'étape actuelle
        document.getElementById(`edit-zikir-step-${currentStep}`).style.display = 'none';
        document.getElementById(`edit-zikir-step-indicator-${currentStep}`).classList.remove('active');

        // Afficher l'étape précédente
        window.editZikirFormData.currentStep--;
        const prevStep = window.editZikirFormData.currentStep;

        document.getElementById(`edit-zikir-step-${prevStep}`).style.display = 'block';
        document.getElementById(`edit-zikir-step-indicator-${prevStep}`).classList.add('active');

        // Mettre à jour les boutons
        if (prevStep === 1) {
            document.getElementById('edit-zikir-btn-back').style.display = 'none';
        }
        document.getElementById('edit-zikir-btn-next').textContent = 'Devam →';

        // Focus sur le champ précédent
        const prevInput = document.querySelector(`#edit-zikir-step-${prevStep} input`);
        if (prevInput) prevInput.focus();
    }
}

function finalizeEditZikir() {
    const { index, oldName, name, dailyGoal, weeklyGoal } = window.editZikirFormData;

    // Mettre à jour la catégorie
    categories[index] = name;

    // Transférer les compteurs si le nom a changé
    if (name !== oldName && counters[oldName]) {
        counters[name] = counters[oldName];
        delete counters[oldName];
    }

    // Mettre à jour les objectifs
    if (dailyGoal > 0 || weeklyGoal > 0) {
        saveCategoryGoals(name, dailyGoal, weeklyGoal);
    } else {
        // Supprimer les objectifs si tous sont à 0
        delete categoryGoals[name];
        localStorage.setItem('categoryGoals', JSON.stringify(categoryGoals));
    }

    // Si l'ancien nom avait des objectifs, les supprimer
    if (name !== oldName && categoryGoals[oldName]) {
        delete categoryGoals[oldName];
        localStorage.setItem('categoryGoals', JSON.stringify(categoryGoals));
    }

    // Mettre à jour la catégorie courante si nécessaire
    if (currentCategory === oldName) {
        currentCategory = name;
    }

    // Sauvegarder et mettre à jour l'interface
    saveCategories();
    saveCounters();
    updateCategorySelect();
    updateCategoriesList();
    updateStats();

    // Fermer le modal
    document.querySelector('.custom-modal-overlay').remove();

    // Message de confirmation
    let message = `✅ Zikir güncellendi: "${name}"`;
    if (dailyGoal > 0) message += `<br>Günlük hedef: ${dailyGoal}`;
    if (weeklyGoal > 0) message += `<br>Haftalık hedef: ${weeklyGoal}`;
    showCustomAlert(message, 'success', 3000);

    // Nettoyer
    delete window.editZikirFormData;
}

// Mettre à jour l'affichage du compteur
function updateCounterDisplay() {
    const display = document.getElementById('counterDisplay');
    const label = document.getElementById('counterLabel');
    const goalDisplay = document.getElementById('goalDisplay');
    const goalValue = document.getElementById('goalValue');

    if (!display || !label) return;

    if (currentCategory) {
        const stats = getStatisticsForCategory(currentCategory);
        const visualCount = Math.max(0, stats.day - visualOffset);
        display.textContent = visualCount;
        label.textContent = `${currentCategory} - Bugün`;

        // Afficher l'objectif quotidien si disponible
        const goals = getCategoryGoals(currentCategory);
        if (goals.daily > 0 && goalDisplay && goalValue) {
            goalDisplay.style.display = 'block';
            goalValue.textContent = `${visualCount} / ${goals.daily}`;
        } else if (goalDisplay) {
            goalDisplay.style.display = 'none';
        }
    } else {
        display.textContent = '0';
        label.textContent = 'Zikir';
        if (goalDisplay) {
            goalDisplay.style.display = 'none';
        }
    }
}

// Afficher modal rapide pour ajouter un zikir - MULTI-ÉTAPES
function showQuickAddCategory() {
    const modalHTML = `
        <div class="custom-modal-overlay" onclick="if(event.target === this) this.remove()">
            <div class="custom-modal" style="min-height: 280px;">
                <div class="modal-header">
                    <h3 id="zikir-modal-title">✨ Yeni Zikir Ekle</h3>
                    <button class="modal-close" onclick="this.closest('.custom-modal-overlay').remove()">✕</button>
                </div>

                <!-- Indicateur de progression -->
                <div style="display: flex; gap: 8px; padding: 0 24px 16px; justify-content: center;">
                    <div id="zikir-step-indicator-1" class="step-indicator active"></div>
                    <div id="zikir-step-indicator-2" class="step-indicator"></div>
                    <div id="zikir-step-indicator-3" class="step-indicator"></div>
                </div>

                <div class="modal-body" id="zikir-modal-body-content">
                    <!-- Étape 1: Nom du zikir -->
                    <div id="zikir-step-1" class="modal-step">
                        <div class="form-group">
                            <label class="form-label" style="font-size: 16px; margin-bottom: 12px;">Zikir Adı Nedir?</label>
                            <input type="text" id="zikirNameInput" class="form-input" placeholder="Örn: Salavat, Tesbih, İstiğfar..." required autofocus>
                        </div>
                    </div>

                    <!-- Étape 2: Objectif quotidien -->
                    <div id="zikir-step-2" class="modal-step" style="display: none;">
                        <div class="form-group">
                            <label class="form-label" style="font-size: 16px; margin-bottom: 12px;">Günlük Hedef Sayısı</label>
                            <input type="number" id="zikirDailyGoalInput" class="form-input" placeholder="Örn: 100" min="0" value="0" onfocus="if(this.value==='0') this.value=''">
                            <small style="color: #64748b; font-size: 12px; margin-top: 8px; display: block;">
                                Her gün bu sayıya ulaşmayı hedefleyin (isteğe bağlı)
                            </small>
                        </div>
                    </div>

                    <!-- Étape 3: Objectif hebdomadaire -->
                    <div id="zikir-step-3" class="modal-step" style="display: none;">
                        <div class="form-group">
                            <label class="form-label" style="font-size: 16px; margin-bottom: 12px;">Haftalık Hedef Sayısı</label>
                            <input type="number" id="zikirWeeklyGoalInput" class="form-input" placeholder="Örn: 700" min="0" value="0" onfocus="if(this.value==='0') this.value=''">
                            <small style="color: #64748b; font-size: 12px; margin-top: 8px; display: block;">
                                Her hafta bu sayıya ulaşmayı hedefleyin (isteğe bağlı)
                            </small>
                        </div>
                    </div>
                </div>

                <div class="modal-footer">
                    <button class="btn-secondary" id="zikir-btn-back" onclick="previousStepAddZikir()" style="display: none;">
                        ← Geri
                    </button>
                    <button class="btn-secondary" onclick="this.closest('.custom-modal-overlay').remove()">
                        İptal
                    </button>
                    <button class="btn-primary" id="zikir-btn-next" onclick="nextStepAddZikir()">
                        Devam →
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Variables globales pour le formulaire en étapes
    window.zikirFormData = {
        currentStep: 1,
        totalSteps: 3,
        name: '',
        dailyGoal: 0,
        weeklyGoal: 0
    };

    // Gestion de la touche Enter pour passer à l'étape suivante
    const modalOverlay = document.querySelector('.custom-modal-overlay:last-of-type');
    modalOverlay.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            nextStepAddZikir();
        }
    });

    document.getElementById('zikirNameInput').focus();
}

// Navigation entre les étapes
function nextStepAddZikir() {
    const currentStep = window.zikirFormData.currentStep;

    // Validation étape 1: nom du zikir
    if (currentStep === 1) {
        const nameInput = document.getElementById('zikirNameInput');
        const validation = Validators.validateCategoryName(nameInput.value);

        if (!validation.valid) {
            showCustomAlert(`❌ ${validation.error}`, 'warning', 2500);
            return;
        }

        const newCategory = validation.value;

        if (categories.includes(newCategory)) {
            showCustomAlert('Bu zikir zaten mevcut!', 'warning', 2500);
            return;
        }

        window.zikirFormData.name = newCategory;
    }

    // Validation étape 2: objectif quotidien
    if (currentStep === 2) {
        const dailyGoalInput = document.getElementById('zikirDailyGoalInput');
        const dailyGoal = parseInt(dailyGoalInput.value) || 0;
        window.zikirFormData.dailyGoal = dailyGoal;
    }

    // Validation étape 3: objectif hebdomadaire et finalisation
    if (currentStep === 3) {
        const weeklyGoalInput = document.getElementById('zikirWeeklyGoalInput');
        const weeklyGoal = parseInt(weeklyGoalInput.value) || 0;
        window.zikirFormData.weeklyGoal = weeklyGoal;

        // Finaliser l'ajout du zikir
        finalizeAddZikir();
        return;
    }

    // Passer à l'étape suivante
    if (currentStep < window.zikirFormData.totalSteps) {
        // Masquer l'étape actuelle
        document.getElementById(`zikir-step-${currentStep}`).style.display = 'none';
        document.getElementById(`zikir-step-indicator-${currentStep}`).classList.remove('active');

        // Afficher l'étape suivante
        window.zikirFormData.currentStep++;
        document.getElementById(`zikir-step-${window.zikirFormData.currentStep}`).style.display = 'block';
        document.getElementById(`zikir-step-indicator-${window.zikirFormData.currentStep}`).classList.add('active');

        // Afficher le bouton Geri
        document.getElementById('zikir-btn-back').style.display = 'inline-block';

        // Changer le texte du bouton à la dernière étape
        if (window.zikirFormData.currentStep === window.zikirFormData.totalSteps) {
            document.getElementById('zikir-btn-next').innerHTML = '✅ Ekle';
        }

        // Focus sur le prochain input
        const nextInput = document.querySelector(`#zikir-step-${window.zikirFormData.currentStep} input`);
        if (nextInput) nextInput.focus();
    }
}

function previousStepAddZikir() {
    const currentStep = window.zikirFormData.currentStep;

    if (currentStep > 1) {
        // Masquer l'étape actuelle
        document.getElementById(`zikir-step-${currentStep}`).style.display = 'none';
        document.getElementById(`zikir-step-indicator-${currentStep}`).classList.remove('active');

        // Afficher l'étape précédente
        window.zikirFormData.currentStep--;
        document.getElementById(`zikir-step-${window.zikirFormData.currentStep}`).style.display = 'block';
        document.getElementById(`zikir-step-indicator-${window.zikirFormData.currentStep}`).classList.add('active');

        // Masquer le bouton Geri à la première étape
        if (window.zikirFormData.currentStep === 1) {
            document.getElementById('zikir-btn-back').style.display = 'none';
        }

        // Remettre le texte du bouton à "Devam"
        document.getElementById('zikir-btn-next').innerHTML = 'Devam →';

        // Focus sur l'input précédent
        const prevInput = document.querySelector(`#zikir-step-${window.zikirFormData.currentStep} input`);
        if (prevInput) prevInput.focus();
    }
}

function finalizeAddZikir() {
    const { name, dailyGoal, weeklyGoal } = window.zikirFormData;

    // Ajouter la catégorie
    categories.push(name);
    saveCategories();
    initializeCounters();

    // Enregistrer la date de création
    categoryMetadata[name] = {
        createdAt: new Date().toISOString(),
        type: 'zikir'
    };
    localStorage.setItem('categoryMetadata', JSON.stringify(categoryMetadata));

    // Sauvegarder les objectifs
    if (dailyGoal > 0 || weeklyGoal > 0) {
        saveCategoryGoals(name, dailyGoal, weeklyGoal);
    }

    updateCategorySelect();
    updateCategoriesList();
    updateStats();

    // Sélectionner automatiquement la nouvelle catégorie
    const select = document.getElementById('categorySelect');
    if (select) {
        select.value = name;
        currentCategory = name;
        updateCounterDisplay();
        resetTimer();
    }

    // Fermer la modale
    document.querySelector('.custom-modal-overlay:last-of-type').remove();

    // Afficher la confirmation
    let message = `Zikir "${name}" eklendi!`;
    if (dailyGoal > 0) message += `<br>Günlük hedef: ${dailyGoal}`;
    if (weeklyGoal > 0) message += `<br>Haftalık hedef: ${weeklyGoal}`;
    showCustomAlert(message, 'success', 3000);
}

// ========================================
// GESTION DES OBJECTIFS DE ZIKIR
// ========================================

// Objet pour stocker les objectifs par catégorie
let categoryGoals = {};

// Charger les objectifs depuis localStorage
function loadCategoryGoals() {
    const saved = localStorage.getItem('categoryGoals');
    if (saved) {
        try {
            categoryGoals = JSON.parse(saved);
        } catch (e) {
            categoryGoals = {};
        }
    }
}

// Sauvegarder les objectifs dans localStorage
function saveCategoryGoals(category, dailyGoal, weeklyGoal) {
    categoryGoals[category] = {
        daily: dailyGoal || 0,
        weekly: weeklyGoal || 0
    };
    localStorage.setItem('categoryGoals', JSON.stringify(categoryGoals));
}

// Obtenir les objectifs d'une catégorie
function getCategoryGoals(category) {
    return categoryGoals[category] || { daily: 0, weekly: 0 };
}

// Charger les objectifs au démarrage
if (typeof window !== 'undefined') {
    loadCategoryGoals();
}

// ========================================
// SYSTÈME DE FÉLICITATIONS POUR OBJECTIFS ATTEINTS
// ========================================

// Stocker quels objectifs ont déjà été atteints aujourd'hui (pour éviter les répétitions)
let goalsAchievedToday = {};

// Charger les objectifs atteints depuis localStorage
function loadGoalsAchievedToday() {
    const saved = localStorage.getItem('goalsAchievedToday');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            // Vérifier si c'est toujours aujourd'hui
            const today = new Date().toDateString();
            if (data.date === today) {
                goalsAchievedToday = data.goals || {};
            } else {
                // Nouveau jour, réinitialiser
                goalsAchievedToday = {};
                saveGoalsAchievedToday();
            }
        } catch (e) {
            goalsAchievedToday = {};
        }
    }
}

// Sauvegarder les objectifs atteints
function saveGoalsAchievedToday() {
    const today = new Date().toDateString();
    const data = {
        date: today,
        goals: goalsAchievedToday
    };
    localStorage.setItem('goalsAchievedToday', JSON.stringify(data));
}

// Vérifier et féliciter pour les objectifs atteints
function checkAndCelebrateGoals(category) {
    const goals = getCategoryGoals(category);
    const stats = getStatisticsForCategory(category);

    // Initialiser l'objet pour cette catégorie si nécessaire
    if (!goalsAchievedToday[category]) {
        goalsAchievedToday[category] = {
            daily: false,
            weekly: false,
            monthly: false,
            yearly: false
        };
    }

    // Calculer les objectifs mensuels et annuels basés sur l'objectif hebdomadaire
    const monthlyGoal = goals.weekly > 0 ? goals.weekly * 4 : 0;
    const yearlyGoal = goals.weekly > 0 ? goals.weekly * 48 : 0;

    // Vérifier l'objectif quotidien
    if (goals.daily > 0 && stats.day >= goals.daily && !goalsAchievedToday[category].daily) {
        goalsAchievedToday[category].daily = true;
        saveGoalsAchievedToday();
        showCustomAlert(`🎉 Tebrikler!<br>Günlük hedefinize ulaştınız!<br><strong>${category}: ${goals.daily}</strong>`, 'success', 4000);
    }

    // Vérifier l'objectif hebdomadaire
    if (goals.weekly > 0 && stats.week >= goals.weekly && !goalsAchievedToday[category].weekly) {
        goalsAchievedToday[category].weekly = true;
        saveGoalsAchievedToday();
        showCustomAlert(`🌟 Harika!<br>Haftalık hedefinize ulaştınız!<br><strong>${category}: ${goals.weekly}</strong>`, 'success', 4000);
    }

    // Vérifier l'objectif mensuel (calculé automatiquement = hebdomadaire × 4)
    if (monthlyGoal > 0 && stats.month >= monthlyGoal && !goalsAchievedToday[category].monthly) {
        goalsAchievedToday[category].monthly = true;
        saveGoalsAchievedToday();
        showCustomAlert(`🏆 Muhteşem!<br>Aylık hedefinize ulaştınız!<br><strong>${category}: ${monthlyGoal}</strong>`, 'success', 4000);
    }

    // Vérifier l'objectif annuel (calculé automatiquement = hebdomadaire × 48)
    if (yearlyGoal > 0 && stats.year >= yearlyGoal && !goalsAchievedToday[category].yearly) {
        goalsAchievedToday[category].yearly = true;
        saveGoalsAchievedToday();
        showCustomAlert(`🎊 İnanılmaz!<br>Yıllık hedefinize ulaştınız!<br><strong>${category}: ${yearlyGoal}</strong>`, 'success', 5000);
    }
}

// Charger les objectifs atteints au démarrage
if (typeof window !== 'undefined') {
    loadGoalsAchievedToday();
}

// Incrémenter le compteur - VERSION SIMPLE ET FIABLE
function incrementCounter() {
    // ⚡ JOUER LE SON EN PREMIER pour réduire la latence perçue sur mobile
    playTickSound();

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

    if (saveCounters()) {
        updateCounterDisplay();

        // Vérifier et célébrer les objectifs atteints
        checkAndCelebrateGoals(currentCategory);

        // ⚡ Utiliser debounce: attend 2s après le dernier clic avant de recalculer
        debouncedUpdateStats()
        debouncedAutoSave()

        // Update group count with new GroupManager system
        if (groupManager && groupManager.hasActiveGroup()) {
            const stats = getCurrentUserStats()
            // ⚡ FIX: Await pour éviter race condition
            groupManager.updateMyScore(stats).catch(err => {
                console.error('Erreur mise à jour score:', err)
            })
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

        // Ajouter les statistiques des livres
        let booksTotalToday = 0;
        let booksTotalWeek = 0;
        let booksTotalMonth = 0;
        let booksTotalYear = 0;
        let booksTotalAll = 0;

        if (typeof BooksManager !== 'undefined') {
            const books = BooksManager.getBooks();
            books.forEach(book => {
                const bookStats = BooksManager.getBookStats(book);
                booksTotalToday += bookStats.today;
                booksTotalWeek += bookStats.week;
                booksTotalMonth += bookStats.month;
                booksTotalYear += bookStats.year;
                booksTotalAll += bookStats.total;
            });
        }

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
                const goals = getCategoryGoals(cat);

                // ✅ FIX XSS: Créer les cellules de manière sécurisée
                const catCell = document.createElement('td');
                catCell.textContent = cat; // ✅ textContent sécurisé

                // Bugün (Today) - Sayı + %
                const dayCell = document.createElement('td');
                dayCell.textContent = stats.day;

                const dayPercentCell = document.createElement('td');
                dayPercentCell.style.textAlign = 'center';
                dayPercentCell.style.color = '#667eea';
                dayPercentCell.style.fontWeight = '600';
                if (goals.daily > 0) {
                    const percentage = Math.round((stats.day / goals.daily) * 100);
                    dayPercentCell.textContent = percentage + '%';
                } else {
                    dayPercentCell.textContent = '-';
                }

                // Bu Hafta (This week) - Sayı + %
                const weekCell = document.createElement('td');
                weekCell.textContent = stats.week;

                const weekPercentCell = document.createElement('td');
                weekPercentCell.style.textAlign = 'center';
                weekPercentCell.style.color = '#667eea';
                weekPercentCell.style.fontWeight = '600';
                if (goals.weekly > 0) {
                    const percentage = Math.round((stats.week / goals.weekly) * 100);
                    weekPercentCell.textContent = percentage + '%';
                } else {
                    weekPercentCell.textContent = '-';
                }

                // Bu Ay (This month) - Sayı + % (calculé: hebdo × 4)
                const monthCell = document.createElement('td');
                monthCell.textContent = stats.month;

                const monthPercentCell = document.createElement('td');
                monthPercentCell.style.textAlign = 'center';
                monthPercentCell.style.color = '#667eea';
                monthPercentCell.style.fontWeight = '600';
                if (goals.weekly > 0) {
                    const monthlyGoal = goals.weekly * 4;
                    const percentage = Math.round((stats.month / monthlyGoal) * 100);
                    monthPercentCell.textContent = percentage + '%';
                } else {
                    monthPercentCell.textContent = '-';
                }

                // Bu Yıl (This year) - Sayı + % (calculé: hebdo × 48)
                const yearCell = document.createElement('td');
                yearCell.textContent = stats.year;

                const yearPercentCell = document.createElement('td');
                yearPercentCell.style.textAlign = 'center';
                yearPercentCell.style.color = '#667eea';
                yearPercentCell.style.fontWeight = '600';
                if (goals.weekly > 0) {
                    const yearlyGoal = goals.weekly * 48;
                    const percentage = Math.round((stats.year / yearlyGoal) * 100);
                    yearPercentCell.textContent = percentage + '%';
                } else {
                    yearPercentCell.textContent = '-';
                }

                const noteCell = document.createElement('td');
                noteCell.style.textAlign = 'center';

                const noteButton = document.createElement('button');
                noteButton.className = 'category-note-btn';
                noteButton.style.opacity = noteOpacity;
                noteButton.style.color = '#3b82f6';
                noteButton.title = 'Not ekle/düzenle';
                noteButton.textContent = noteIcon;
                noteButton.onclick = (event) => showCategoryNoteModal(cat, event); // ✅ Éviter onclick inline

                noteCell.appendChild(noteButton);

                row.appendChild(catCell);
                row.appendChild(dayCell);
                row.appendChild(dayPercentCell);
                row.appendChild(weekCell);
                row.appendChild(weekPercentCell);
                row.appendChild(monthCell);
                row.appendChild(monthPercentCell);
                row.appendChild(yearCell);
                row.appendChild(yearPercentCell);
                row.appendChild(noteCell);

                tbody.appendChild(row);
            });

            // Ajouter les livres au tableau
            if (typeof BooksManager !== 'undefined') {
                const books = BooksManager.getBooks();
                books.forEach(book => {
                    const row = document.createElement('tr');
                    row.style.background = '#f8f9ff'; // Couleur légèrement différente pour les livres

                    const bookStats = BooksManager.getBookStats(book);

                    const bookCell = document.createElement('td');
                    const bookIcon = document.createElement('span');
                    bookIcon.textContent = '📚 ';
                    bookCell.appendChild(bookIcon);
                    const bookName = document.createTextNode(book.name);
                    bookCell.appendChild(bookName);

                    // Bugün (Today) - Sayı + % (percentage based on total book progress)
                    const dayCell = document.createElement('td');
                    dayCell.textContent = bookStats.today + ' sf';

                    const dayPercentCell = document.createElement('td');
                    dayPercentCell.style.textAlign = 'center';
                    dayPercentCell.style.color = '#667eea';
                    dayPercentCell.style.fontWeight = '600';
                    dayPercentCell.textContent = bookStats.progress !== null ? bookStats.progress + '%' : '-';

                    // Bu Hafta (This week) - Sayı + % (same overall progress)
                    const weekCell = document.createElement('td');
                    weekCell.textContent = bookStats.week + ' sf';

                    const weekPercentCell = document.createElement('td');
                    weekPercentCell.style.textAlign = 'center';
                    weekPercentCell.style.color = '#667eea';
                    weekPercentCell.style.fontWeight = '600';
                    weekPercentCell.textContent = bookStats.progress !== null ? bookStats.progress + '%' : '-';

                    // Bu Ay (This month) - Sayı + % (same overall progress)
                    const monthCell = document.createElement('td');
                    monthCell.textContent = bookStats.month + ' sf';

                    const monthPercentCell = document.createElement('td');
                    monthPercentCell.style.textAlign = 'center';
                    monthPercentCell.style.color = '#667eea';
                    monthPercentCell.style.fontWeight = '600';
                    monthPercentCell.textContent = bookStats.progress !== null ? bookStats.progress + '%' : '-';

                    const yearCell = document.createElement('td');
                    yearCell.textContent = bookStats.year + ' sf';

                    const yearPercentCell = document.createElement('td');
                    yearPercentCell.style.textAlign = 'center';
                    yearPercentCell.style.color = '#667eea';
                    yearPercentCell.style.fontWeight = '600';
                    yearPercentCell.textContent = bookStats.progress !== null ? bookStats.progress + '%' : '-';

                    // Note cell avec bouton pour les livres
                    const bookNote = getBookNote(book.id);
                    const bookNoteIcon = bookNote ? '📝' : '📝';
                    const bookNoteOpacity = bookNote ? '1' : '0.3';

                    const noteCell = document.createElement('td');
                    noteCell.style.textAlign = 'center';

                    const noteButton = document.createElement('button');
                    noteButton.className = 'category-note-btn';
                    noteButton.style.opacity = bookNoteOpacity;
                    noteButton.style.color = '#3b82f6';
                    noteButton.title = 'Not ekle/düzenle';
                    noteButton.textContent = bookNoteIcon;
                    noteButton.onclick = (event) => showBookNoteModal(book, event);

                    noteCell.appendChild(noteButton);

                    row.appendChild(bookCell);
                    row.appendChild(dayCell);
                    row.appendChild(dayPercentCell);
                    row.appendChild(weekCell);
                    row.appendChild(weekPercentCell);
                    row.appendChild(monthCell);
                    row.appendChild(monthPercentCell);
                    row.appendChild(yearCell);
                    row.appendChild(yearPercentCell);
                    row.appendChild(noteCell);

                    tbody.appendChild(row);
                });

                // Ajouter une ligne de séparation si il y a des livres
                if (books.length > 0) {
                    const separatorRow = document.createElement('tr');
                    separatorRow.style.borderTop = '2px solid #667eea';
                    const separatorCell = document.createElement('td');
                    separatorCell.colSpan = 10; // Updated from 7 to 10
                    separatorCell.style.padding = '0';
                    separatorCell.style.height = '2px';
                    separatorRow.appendChild(separatorCell);
                    tbody.appendChild(separatorRow);

                    // Ajouter une ligne de total pour les livres
                    const booksTotalRow = document.createElement('tr');
                    booksTotalRow.style.fontWeight = 'bold';
                    booksTotalRow.style.background = '#f0f4ff';

                    const labelCell = document.createElement('td');
                    labelCell.textContent = '📚 TOPLAM KİTAPLAR';
                    labelCell.style.color = '#667eea';

                    const todayCell = document.createElement('td');
                    todayCell.textContent = booksTotalToday + ' sf';

                    const todayPercentCell = document.createElement('td');
                    todayPercentCell.textContent = '-';
                    todayPercentCell.style.textAlign = 'center';

                    const weekCellTotal = document.createElement('td');
                    weekCellTotal.textContent = booksTotalWeek + ' sf';

                    const weekPercentCell = document.createElement('td');
                    weekPercentCell.textContent = '-';
                    weekPercentCell.style.textAlign = 'center';

                    const monthCellTotal = document.createElement('td');
                    monthCellTotal.textContent = booksTotalMonth + ' sf';

                    const monthPercentCell = document.createElement('td');
                    monthPercentCell.textContent = '-';
                    monthPercentCell.style.textAlign = 'center';

                    const yearCellTotal = document.createElement('td');
                    yearCellTotal.textContent = booksTotalYear + ' sf';

                    const yearPercentCell = document.createElement('td');
                    yearPercentCell.textContent = '-';
                    yearPercentCell.style.textAlign = 'center';

                    const emptyCell = document.createElement('td');
                    emptyCell.textContent = '-';
                    emptyCell.style.textAlign = 'center';

                    booksTotalRow.appendChild(labelCell);
                    booksTotalRow.appendChild(todayCell);
                    booksTotalRow.appendChild(todayPercentCell);
                    booksTotalRow.appendChild(weekCellTotal);
                    booksTotalRow.appendChild(weekPercentCell);
                    booksTotalRow.appendChild(monthCellTotal);
                    booksTotalRow.appendChild(monthPercentCell);
                    booksTotalRow.appendChild(yearCellTotal);
                    booksTotalRow.appendChild(yearPercentCell);
                    booksTotalRow.appendChild(emptyCell);

                    tbody.appendChild(booksTotalRow);
                }
            }
        }

        // Mettre à jour les totaux
        const totalElements = {
            'totalDay': totalToday,
            'totalWeek': totalWeek,
            'totalMonth': totalMonth,
            'totalYear': totalYear
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

        // Afficher l'historique
        displayHistory();

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

    // Construire les détails par catégorie
    const categoriesDetails = categories.reduce((acc, cat) => {
        const stats = getStatisticsForCategory(cat);
        acc[cat] = {
            today: stats.day,
            week: stats.week,
            month: stats.month
        };
        return acc;
    }, {});

    // Ajouter les statistiques des livres
    const booksDetails = {};
    if (typeof BooksManager !== 'undefined') {
        const books = BooksManager.getBooks();
        books.forEach(book => {
            const bookStats = BooksManager.getBookStats(book);
            // Ajouter les statistiques de chaque livre (pages lues)
            booksDetails[book.name] = {
                today: bookStats.today,
                week: bookStats.week,
                month: bookStats.month,
                total: bookStats.total
            };
        });
    }

    return {
        today: totalToday,
        week: totalWeek,
        month: totalMonth,
        total: totalAll,
        categories: categoriesDetails,
        books: booksDetails // Nouveau: inclure les livres
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
                    // ✅ FIX XSS: Créer la confirmation de manière sécurisée
                    const confirmationDiv = document.createElement('div');
                    confirmationDiv.className = 'custom-confirm';

                    const title = document.createElement('h3');
                    title.textContent = 'Son Onay';

                    const message = document.createElement('p');
                    message.innerHTML = 'Onaylamak için tam olarak <strong>"SİL"</strong> yazın:';

                    const input = document.createElement('input');
                    input.type = 'text';
                    input.id = 'confirmInput';
                    input.style.cssText = 'padding: 10px; font-size: 16px; margin: 10px 0; text-align: center; border: 2px solid #e53e3e; border-radius: 5px;';

                    const buttonsDiv = document.createElement('div');
                    buttonsDiv.className = 'confirm-buttons';

                    const yesBtn = document.createElement('button');
                    yesBtn.className = 'confirm-btn confirm-yes';
                    yesBtn.textContent = 'Onayla';

                    const noBtn = document.createElement('button');
                    noBtn.className = 'confirm-btn confirm-no';
                    noBtn.textContent = 'İptal';

                    buttonsDiv.appendChild(yesBtn);
                    buttonsDiv.appendChild(noBtn);

                    confirmationDiv.appendChild(title);
                    confirmationDiv.appendChild(message);
                    confirmationDiv.appendChild(input);
                    confirmationDiv.appendChild(buttonsDiv);

                    document.body.appendChild(confirmationDiv);

                    // Utiliser les références déjà créées
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

        // Marquer qu'une sauvegarde a été faite
        markBackupDone();

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

    // Vérifier le rappel de sauvegarde (tous les 7 jours)
    checkBackupReminder();

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
                            showCustomConfirm(
                                '🆕 Yeni Sürüm Mevcut',
                                'Yeni bir sürüm bulundu!<br><br>' +
                                '✅ Verileriniz <strong>otomatik olarak kaydedilecek</strong><br>' +
                                '🔄 Uygulama yeniden yüklenecek<br><br>' +
                                'Şimdi güncellemek ister misiniz?',
                                function() {
                                    // ⚡ FIX: Sauvegarder AVANT le rechargement
                                    console.log('🔄 Mise à jour PWA - Sauvegarde automatique...');

                                    // Afficher un indicateur de sauvegarde
                                    showCustomAlert('💾 Veriler kaydediliyor...', 'info', 1000);

                                    try {
                                        autoSave(); // Sauvegarde synchrone des compteurs et catégories
                                        console.log('✅ Données sauvegardées avant mise à jour');

                                        // Confirmation visuelle
                                        showCustomAlert('✅ Kaydedildi! Güncelleniyor...', 'success', 800);
                                    } catch (error) {
                                        console.error('⚠️ Erreur sauvegarde avant MAJ:', error);
                                        showCustomAlert('⚠️ Kaydetme hatası, yine de güncelleniyor...', 'warning', 1000);
                                    }

                                    // Délai pour afficher les messages et s'assurer de la sauvegarde
                                    setTimeout(() => {
                                        newWorker.postMessage({ type: 'SKIP_WAITING' });
                                        window.location.reload();
                                    }, 1200);
                                },
                                function() {
                                    // L'utilisateur refuse la mise à jour
                                    showCustomAlert('Güncelleme iptal edildi<br>Sonra tekrar sorulacak', 'info', 2000);
                                }
                            );
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
// HISTORY DISPLAY
// ========================================

/**
 * Affiche l'historique des zikirs et livres terminés
 */
// Fonctionnalité d'historique supprimée
function displayHistory() {
    const historyList = document.getElementById('historyList');
    const noHistoryMessage = document.getElementById('noHistoryMessage');

    if (!historyList) return;

    // Vider la liste
    historyList.innerHTML = '';
    historyList.style.display = 'none';

    if (noHistoryMessage) {
        noHistoryMessage.style.display = 'block';
        noHistoryMessage.textContent = 'Geçmiş özelliği kaldırıldı.';
    }
}

// ========================================
// BACKEND INITIALIZATION
// ========================================

function initializeBackend() {
  try {
    const config = BackendConfig.getActiveProvider()

    // Si pas de config valide, désactiver le mode groupe
    if (!config) {
      console.warn('⚠️ Backend non configuré - Mode groupe désactivé');
      console.info('💡 L\'application fonctionne en mode local uniquement');
      // Désactiver visuellement l'onglet groupe
      const groupTab = document.querySelector('.tab-button[onclick*="group"]');
      if (groupTab) {
        groupTab.style.opacity = '0.5';
        groupTab.title = 'Configuration backend requise';
      }
      return;
    }

    let provider
    if (config.type === 'supabase') {
      provider = new SupabaseProvider(config.url, config.key)
      console.log('✅ Supabase initialisé')
    } else if (config.type === 'infomaniak') {
      provider = new InfomaniakProvider(config.apiUrl, config.apiKey)
      console.log('✅ Infomaniak initialisé')
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

    // ⚡ Utiliser ModalUtils pour afficher la modale de note
    ModalUtils.showNoteModal({
        title: `Not - ${category}`,
        description: 'Bu kategori için notunuzu yazın (niyet, amaç, hatırlatma vs.)',
        placeholder: 'Örnek: Allah rızası için, şifa duası, aileme dua...',
        initialValue: currentNote,
        onSave: (note) => {
            // Sauvegarder la note
            if (note) {
                categoryNotes[category] = note;
            } else {
                delete categoryNotes[category];
            }

            saveCategoryNotes();
            updateStats(); // Rafraîchir pour mettre à jour l'icône

            showCustomAlert('Not kaydedildi!', 'success', 2000);
        }
    });
}

// ============================================
// SYSTÈME DE NOTES POUR LIVRES
// ============================================

let bookNotes = {};

// Charger les notes des livres depuis localStorage
function loadBookNotes() {
    const saved = localStorage.getItem('bookNotes');
    if (saved) {
        try {
            bookNotes = JSON.parse(saved);
        } catch (e) {
            bookNotes = {};
        }
    }
}

// Sauvegarder les notes des livres dans localStorage
function saveBookNotes() {
    localStorage.setItem('bookNotes', JSON.stringify(bookNotes));
}

// Obtenir la note d'un livre
function getBookNote(bookId) {
    return bookNotes[bookId] || '';
}

// Modal pour éditer une note de livre
function showBookNoteModal(book, event) {
    if (event) event.stopPropagation();

    const currentNote = getBookNote(book.id);

    // Utiliser ModalUtils pour afficher la modale de note
    ModalUtils.showNoteModal({
        title: `Not - ${book.name}`,
        description: 'Bu kitap için notunuzu yazın (hedef, motivasyon, hatırlatma vs.)',
        placeholder: 'Örnek: İlim için, kendimi geliştirmek için...',
        initialValue: currentNote,
        onSave: (note) => {
            // Sauvegarder la note
            if (note) {
                bookNotes[book.id] = note;
            } else {
                delete bookNotes[book.id];
            }

            saveBookNotes();
            updateStats(); // Rafraîchir pour mettre à jour l'icône

            showCustomAlert('Not kaydedildi!', 'success', 2000);
        }
    });
}

// Charger les notes et objectifs au démarrage
if (typeof window !== 'undefined') {
    loadCategoryNotes();
    loadCategoryGoals();
    loadBookNotes();
}

// ============================================
// RAPPEL DE SAUVEGARDE AUTOMATIQUE
// ============================================

// Vérifier si un rappel de sauvegarde doit être affiché
function checkBackupReminder() {
    try {
        const lastBackupReminder = localStorage.getItem('lastBackupReminder');
        const now = new Date().getTime();
        const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000; // 7 jours en millisecondes

        // Si jamais de rappel ou si le dernier rappel était il y a plus de 7 jours
        if (!lastBackupReminder || (now - parseInt(lastBackupReminder)) > sevenDaysInMs) {
            // Attendre 3 secondes après le chargement pour ne pas être intrusif
            setTimeout(() => {
                showBackupReminder();
            }, 3000);
        }
    } catch (error) {
        console.error('Erreur vérification rappel sauvegarde:', error);
    }
}

// Afficher le rappel de sauvegarde
function showBackupReminder() {
    showCustomConfirm(
        '💾 Rappel de Sauvegarde',
        'Il est recommandé de sauvegarder régulièrement vos données de zikir.<br><br>Voulez-vous faire une sauvegarde maintenant ?<br><br><small style="color: #64748b;">Vos données sont en sécurité sur cet appareil, mais une sauvegarde vous permet de restaurer vos données si vous changez d\'appareil ou si vous réinstallez l\'application.</small>',
        function() {
            // L'utilisateur veut faire une sauvegarde
            localStorage.setItem('lastBackupReminder', new Date().getTime().toString());
            exportData(); // Utilise la fonction existante
        },
        function() {
            // L'utilisateur refuse - enregistrer quand même le rappel
            localStorage.setItem('lastBackupReminder', new Date().getTime().toString());
            showCustomAlert('Rappel reporté de 7 jours', 'info', 2000);
        }
    );
}

// Marquer qu'une sauvegarde a été faite (appelé après export réussi)
function markBackupDone() {
    localStorage.setItem('lastBackupReminder', new Date().getTime().toString());
}
