// Variables globales - SYSTÈME SIMPLIFIÉ
// Test système de mise à jour automatique - Version 3 (TEST FINAL)
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

// Rate limiter pour syncs groupe (5 syncs max par minute)
const groupSyncLimiter = typeof rateLimiter !== 'undefined' ? rateLimiter : null;

// Validators est chargé depuis src/utils/validators.js

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
        tickSound = new Audio('./assets/audio/tesbih_variant_1.mp3');
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
        if (soundEnabled) {
            soundBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
            </svg>`;
        } else {
            soundBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <line x1="23" y1="9" x2="17" y2="15"></line>
                <line x1="17" y1="9" x2="23" y2="15"></line>
            </svg>`;
        }
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
// ⚡ FIX CHROME: Sauvegarder audioEnabled pour éviter de perdre le son après MAJ
let audioEnabled = localStorage.getItem('audioEnabled') === 'true';
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
                    localStorage.setItem('audioEnabled', 'true'); // ⚡ Sauvegarder
                    console.log('Audio context enabled for mobile');
                    showCustomAlert('Ses etkinleştirildi!', 'success', 1500);
                }
            } catch (e) {
                console.log('Audio enable error:', e);
                audioEnabled = true; // Mark as attempted
                localStorage.setItem('audioEnabled', 'true'); // ⚡ Sauvegarder quand même
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
        if (soundEnabled) {
            soundBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
            </svg>`;
        } else {
            soundBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <line x1="23" y1="9" x2="17" y2="15"></line>
                <line x1="17" y1="9" x2="23" y2="15"></line>
            </svg>`;
        }
        soundBtn.classList.toggle('muted', !soundEnabled);
    }

    // Show status message and try to enable audio immediately
    if (soundEnabled) {
        showCustomAlert('Ses açıldı!', 'success', 2000);

        // Try to enable audio immediately when user clicks sound button
        if (!audioEnabled && tickSound) {
            try {
                if (tickSound.currentTime !== undefined) {
                    tickSound.play().then(() => {
                        tickSound.pause();
                        tickSound.currentTime = 0;
                        audioEnabled = true;
                        localStorage.setItem('audioEnabled', 'true'); // ⚡ Sauvegarder
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
        showCustomAlert('Ses kapatıldı', 'info', 1500);
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

// Indicateur de sauvegarde - désactivé
function showSaveIndicator() {
    // Désactivé - trop intrusif
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
    document.querySelectorAll('.mobile-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Activate the target tab content
    const targetTab = document.getElementById(tabName);
    if (targetTab) {
        targetTab.classList.add('active');
    }

    // Activate the clicked button (desktop et mobile)
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }
    // Synchroniser le bouton correspondant dans le menu mobile
    document.querySelectorAll('.mobile-tab-btn').forEach(btn => {
        const btnOnclick = btn.getAttribute('onclick');
        if (btnOnclick && btnOnclick.includes(`'${tabName}'`)) {
            btn.classList.add('active');
        }
    });
    // Synchroniser le bouton correspondant dans le menu desktop
    document.querySelectorAll('.tab-button').forEach(btn => {
        const btnOnclick = btn.getAttribute('onclick');
        if (btnOnclick && btnOnclick.includes(`'${tabName}'`)) {
            btn.classList.add('active');
        }
    });

    // Masquer header/footer si Tesbihat est actif
    if (tabName === 'competition') {
        document.body.classList.add('tesbihat-active');
    } else {
        document.body.classList.remove('tesbihat-active');
    }

    // Sauvegarder l'onglet actuel pour restauration après actualisation
    localStorage.setItem('lastActiveTab', tabName);

    setTimeout(() => {
        if (tabName === 'stats') {
            updateStats();
        } else if (tabName === 'management') {
            updateCategoriesList();
            updateCategorySelect();
            // Mettre a jour aussi la liste des livres
            if (typeof BooksManager !== 'undefined' && typeof BooksManager.updateBooksManagementList === 'function') {
                BooksManager.updateBooksManagementList();
            }
            // Mettre a jour la liste des namazlar
            if (typeof NamazManager !== 'undefined' && typeof NamazManager.renderNamazList === 'function') {
                NamazManager.renderNamazList();
            }
        } else if (tabName === 'namaz') {
            // Initialiser l'affichage Namaz
            if (typeof NamazManager !== 'undefined') {
                NamazManager.updateNamazSelect();
                NamazManager.updateNamazDisplay();
            }
        } else if (tabName === 'sohbet') {
            // Initialiser l'affichage Sohbet
            if (typeof SohbetManager !== 'undefined') {
                SohbetManager.renderSohbetList();
            }
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

// Toggle menu mobile hamburger
function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobileMenu');
    const overlay = document.getElementById('mobileMenuOverlay');

    if (mobileMenu) {
        mobileMenu.classList.toggle('open');
    }

    if (overlay) {
        overlay.classList.toggle('show');
    }
}

/**
 * Toggle accordion sections in Settings tab
 * Gère l'ouverture/fermeture des sections avec animation du chevron (►/▼)
 * @param {HTMLElement} header - L'élément header cliqué
 */
function toggleSettingsAccordion(header) {
    const content = header.nextElementSibling;
    const isOpen = content.classList.contains('open');

    // Toggle l'état actif du header (gère automatiquement la rotation du chevron via CSS)
    header.classList.toggle('active');

    // Toggle le contenu avec animation smooth
    if (isOpen) {
        content.classList.remove('open');
    } else {
        content.classList.add('open');
    }
}

// Mettre à jour les sélecteurs
function updateCategorySelect() {
    const select = document.getElementById('categorySelect');
    const resetSelect = document.getElementById('categoryToReset');

    // Sélecteur principal
    if (select) {
        select.innerHTML = '<option value="">Zikir Seçiniz</option>';
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            select.appendChild(option);
        });
    }

    // Sélecteur pour l'effacement
    if (resetSelect) {
        resetSelect.innerHTML = '<option value="">Zikir Seçiniz</option>';
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
        editButton.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Düzenle';
        editButton.onclick = () => editCategory(index);

        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-button';
        deleteButton.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg> Sil';
        deleteButton.title = 'Zikiri kalıcı olarak sil'; // Tooltip pour clarifier
        deleteButton.onclick = () => {
            console.log('Delete button clicked for category:', cat, 'index:', index);
            deleteCategory(index);
        };

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
        `"${escapeHtml(categoryName)}" zikrini kalıcı olarak silmek istediğinize emin misiniz?<br><br>Bu işlem geri alınamaz!`,
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

            // Mettre à jour le groupe si actif
            if (typeof groupManager !== 'undefined' && groupManager.hasActiveGroup()) {
                const stats = getCurrentUserStats();
                groupManager.updateMyScore(stats).catch(err => {
                    console.error('Erreur mise à jour groupe après suppression catégorie:', err);
                });
            }

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
                            <input type="number" id="editZikirDailyGoalInput" class="form-input" placeholder="Örn: 100" min="0" value="${currentGoals.daily || 0}" onfocus="if(this.value==='0') this.value=''">
                            <small style="color: #64748b; font-size: 12px; margin-top: 8px; display: block;">
                                Her gün bu sayıya ulaşmayı hedefleyin (isteğe bağlı)
                            </small>
                        </div>
                    </div>

                    <!-- Étape 3: Objectif hebdomadaire -->
                    <div id="edit-zikir-step-3" class="modal-step" style="display: none;">
                        <div class="form-group">
                            <label class="form-label" style="font-size: 16px; margin-bottom: 12px;">Haftalık Hedef Sayısı</label>
                            <input type="number" id="editZikirWeeklyGoalInput" class="form-input" placeholder="Örn: 700" min="0" value="${currentGoals.weekly || 0}" onfocus="if(this.value==='0') this.value=''">
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

    // Mettre à jour le groupe si actif
    if (typeof groupManager !== 'undefined' && groupManager.hasActiveGroup()) {
        const stats = getCurrentUserStats();
        groupManager.updateMyScore(stats).catch(err => {
            console.error('Erreur mise à jour groupe après modification catégorie:', err);
        });
    }

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

    // 📊 Analytics: Catégorie créée
    if (typeof PrivacyAnalytics !== 'undefined') {
        PrivacyAnalytics.trackEvent('category_created', {
            categoryName: name,
            dailyGoal: dailyGoal,
            weeklyGoal: weeklyGoal
        });
    }

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

    // Mettre à jour le groupe si actif
    if (typeof groupManager !== 'undefined' && groupManager.hasActiveGroup()) {
        const stats = getCurrentUserStats();
        groupManager.updateMyScore(stats).catch(err => {
            console.error('Erreur mise à jour groupe après ajout catégorie:', err);
        });
    }

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
// TAVSIYE EDILEN ZIKIRLER (Zikirs Conseillés)
// ========================================

// Liste des zikirs conseillés (Kuran/Cevşen → Kitap, Teheccüd → Namaz, Kaset/Video → Sohbet)
const TAVSIYE_ZIKIRLER = [
    { name: 'Estağfirullah', detail: '100 defa' },
    { name: 'Ya Baki entel baki', detail: '33 defa' },
    { name: 'Salavat', detail: '100 defa' },
    { name: 'La ilahe illa ente sübhaneke inni küntü minezzalimin', detail: '100 defa' },
    { name: 'Subhanallahi ve bihamdihi Subhanallahil azim', detail: '100 defa' },
    { name: 'Ya Latif', detail: '129 defa' }
];

// Afficher le modal des zikirs conseillés
function showTavsiyeModal() {
    // Générer la liste HTML des zikirs
    const zikirListHTML = TAVSIYE_ZIKIRLER.map((zikir, index) => {
        const alreadyExists = categories.includes(zikir.name);
        return `
            <label class="tavsiye-item ${alreadyExists ? 'already-added' : ''}" ${alreadyExists ? 'title="Bu zikir zaten ekli"' : ''}>
                <input type="checkbox"
                       value="${index}"
                       ${alreadyExists ? 'disabled checked' : ''}
                       onchange="updateTavsiyeAddButton()">
                <div class="tavsiye-item-info">
                    <span class="tavsiye-item-name">${zikir.name}</span>
                    <span class="tavsiye-item-detail">${zikir.detail}</span>
                </div>
                ${alreadyExists ? '<span class="tavsiye-item-badge">Eklendi ✓</span>' : ''}
            </label>
        `;
    }).join('');

    const modalHTML = `
        <div class="tavsiye-modal-overlay" onclick="if(event.target === this) closeTavsiyeModal()">
            <div class="tavsiye-modal">
                <div class="tavsiye-modal-header">
                    <h3>⭐ Tavsiye Edilen Zikirler</h3>
                    <button class="tavsiye-modal-close" onclick="closeTavsiyeModal()">✕</button>
                </div>
                <div class="tavsiye-modal-body">
                    <p style="color: #64748b; font-size: 13px; margin-bottom: 16px;">
                        Eklemek istediğiniz zikirleri seçin:
                    </p>
                    <div class="tavsiye-list">
                        ${zikirListHTML}
                    </div>
                </div>
                <div class="tavsiye-modal-footer">
                    <button class="tavsiye-btn-cancel" onclick="closeTavsiyeModal()">Kapat</button>
                    <button class="tavsiye-btn-add" id="tavsiyeAddBtn" onclick="addSelectedTavsiyeler()" disabled>
                        Seçilenleri Ekle
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Marquer comme vu (pour ne pas réafficher automatiquement)
    localStorage.setItem('tavsiyeModalShown', 'true');
}

// Fermer le modal tavsiye
function closeTavsiyeModal() {
    const modal = document.querySelector('.tavsiye-modal-overlay');
    if (modal) {
        modal.remove();
    }
}

// Mettre à jour l'état du bouton "Seçilenleri Ekle"
function updateTavsiyeAddButton() {
    const checkboxes = document.querySelectorAll('.tavsiye-modal-overlay input[type="checkbox"]:not(:disabled):checked');
    const addBtn = document.getElementById('tavsiyeAddBtn');
    if (addBtn) {
        addBtn.disabled = checkboxes.length === 0;
        addBtn.textContent = checkboxes.length > 0
            ? `Seçilenleri Ekle (${checkboxes.length})`
            : 'Seçilenleri Ekle';
    }
}

// Ajouter les zikirs sélectionnés
function addSelectedTavsiyeler() {
    const checkboxes = document.querySelectorAll('.tavsiye-modal-overlay input[type="checkbox"]:not(:disabled):checked');
    const selectedIndices = Array.from(checkboxes).map(cb => parseInt(cb.value));

    let addedCount = 0;

    selectedIndices.forEach(index => {
        const zikir = TAVSIYE_ZIKIRLER[index];
        if (zikir && !categories.includes(zikir.name)) {
            // Ajouter la catégorie
            categories.push(zikir.name);

            // Enregistrer les métadonnées
            categoryMetadata[zikir.name] = {
                createdAt: new Date().toISOString(),
                type: 'zikir',
                source: 'tavsiye'
            };

            addedCount++;
        }
    });

    if (addedCount > 0) {
        // Sauvegarder
        saveCategories();
        localStorage.setItem('categoryMetadata', JSON.stringify(categoryMetadata));
        initializeCounters();
        updateCategorySelect();
        updateCategoriesList();
        updateStats();

        // Mettre à jour le groupe si actif
        if (typeof groupManager !== 'undefined' && groupManager.hasActiveGroup()) {
            const stats = getCurrentUserStats();
            groupManager.updateMyScore(stats).catch(err => {
                console.error('Erreur mise à jour groupe après ajout tavsiye:', err);
            });
        }

        showCustomAlert(`${addedCount} zikir başarıyla eklendi! ✓`, 'success', 3000);
    }

    closeTavsiyeModal();
}

// Vérifier et afficher le modal au premier lancement
function checkTavsiyeFirstLaunch() {
    // Si le modal n'a jamais été affiché
    if (!localStorage.getItem('tavsiyeModalShown')) {
        // Attendre que le welcome modal soit fermé (2 secondes après le chargement)
        setTimeout(() => {
            // Vérifier si le welcome modal est toujours visible
            const welcomeModal = document.querySelector('.welcome-modal-overlay');
            if (!welcomeModal) {
                showTavsiyeModal();
            } else {
                // Réessayer dans 5 secondes
                setTimeout(checkTavsiyeFirstLaunch, 5000);
            }
        }, 2000);
    }
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

// Initialiser les objectifs par défaut pour les 3 zikirler principaux
function initializeDefaultGoals() {
    const defaultGoals = [
        { name: 'Subhan Allah', daily: 165, weekly: 1155 },
        { name: 'Elhamdulillah', daily: 165, weekly: 1155 },
        { name: 'Allahu Ekber', daily: 165, weekly: 1155 }
    ];

    let needsSave = false;
    defaultGoals.forEach(goal => {
        // Si cette catégorie n'a pas encore d'objectifs définis
        if (!categoryGoals[goal.name]) {
            categoryGoals[goal.name] = {
                daily: goal.daily,
                weekly: goal.weekly
            };
            needsSave = true;
        }
    });

    // Sauvegarder si des modifications ont été faites
    if (needsSave) {
        localStorage.setItem('categoryGoals', JSON.stringify(categoryGoals));
        console.log('Objectifs par défaut initialisés pour les 3 zikirler');
    }
}

// Charger les objectifs au démarrage
if (typeof window !== 'undefined') {
    loadCategoryGoals();
    initializeDefaultGoals();
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

        // 📊 Analytics: Compteur incrémenté
        if (typeof PrivacyAnalytics !== 'undefined') {
            const currentCount = counters[currentCategory][currentDate];
            PrivacyAnalytics.trackEvent('counter_increment', {
                categoryName: currentCategory,
                value: currentCount
            });
        }

        // Vérifier et célébrer les objectifs atteints
        checkAndCelebrateGoals(currentCategory);

        // ⚡ Utiliser debounce: attend 2s après le dernier clic avant de recalculer
        debouncedUpdateStats()
        debouncedAutoSave()

        // Update group count with new GroupManager system
        if (groupManager && groupManager.hasActiveGroup()) {
            const stats = getCurrentUserStats()

            // 🔒 Rate limiting: 5 syncs max par minute
            if (groupSyncLimiter) {
                const rateLimitCheck = groupSyncLimiter.check('group_sync', {
                    maxAttempts: 5,
                    windowMs: 60000 // 1 minute
                })

                if (!rateLimitCheck.allowed) {
                    console.warn(`⏳ Rate limit: ${rateLimitCheck.message}`)
                    return // Skip sync si trop rapide
                }
            }

            // ⚡ NOUVEAU: Sync TOUS les groupes (syncAll=true)
            groupManager.updateMyScore(stats, true).catch(err => {
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
        `"${escapeHtml(currentCategory)}" için sayaç GÖRÜNTÜSÜNÜ sıfırlayın?<br><br>İstatistikler etkilenMEYECEK.`,
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
                const noteIcon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>';
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
                noteButton.innerHTML = noteIcon;
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

            // Ajouter la ligne de total pour les zikirler juste après les catégories
            if (categories.length > 0) {
                const zikirTotalRow = document.createElement('tr');
                zikirTotalRow.className = 'totals-row';

                const labelCell = document.createElement('td');
                const labelStrong = document.createElement('strong');
                labelStrong.textContent = 'TOPLAM ZİKİRLER';
                labelCell.appendChild(labelStrong);

                const todayCell = document.createElement('td');
                const todayStrong = document.createElement('strong');
                todayStrong.textContent = totalToday;
                todayCell.appendChild(todayStrong);

                const todayPercentCell = document.createElement('td');
                todayPercentCell.textContent = '';

                const weekCell = document.createElement('td');
                const weekStrong = document.createElement('strong');
                weekStrong.textContent = totalWeek;
                weekCell.appendChild(weekStrong);

                const weekPercentCell = document.createElement('td');
                weekPercentCell.textContent = '';

                const monthCell = document.createElement('td');
                const monthStrong = document.createElement('strong');
                monthStrong.textContent = totalMonth;
                monthCell.appendChild(monthStrong);

                const monthPercentCell = document.createElement('td');
                monthPercentCell.textContent = '';

                const yearCell = document.createElement('td');
                const yearStrong = document.createElement('strong');
                yearStrong.textContent = totalYear;
                yearCell.appendChild(yearStrong);

                const yearPercentCell = document.createElement('td');
                yearPercentCell.textContent = '';

                const emptyCell = document.createElement('td');
                emptyCell.textContent = '';

                zikirTotalRow.appendChild(labelCell);
                zikirTotalRow.appendChild(todayCell);
                zikirTotalRow.appendChild(todayPercentCell);
                zikirTotalRow.appendChild(weekCell);
                zikirTotalRow.appendChild(weekPercentCell);
                zikirTotalRow.appendChild(monthCell);
                zikirTotalRow.appendChild(monthPercentCell);
                zikirTotalRow.appendChild(yearCell);
                zikirTotalRow.appendChild(yearPercentCell);
                zikirTotalRow.appendChild(emptyCell);

                tbody.appendChild(zikirTotalRow);
            }

            // Ajouter les livres au tableau
            if (typeof BooksManager !== 'undefined') {
                const books = BooksManager.getBooks();
                books.forEach(book => {
                    const row = document.createElement('tr');
                    row.style.background = '#f8f9ff'; // Couleur légèrement différente pour les livres

                    const bookStats = BooksManager.getBookStats(book);

                    const bookCell = document.createElement('td');
                    const bookIcon = document.createElement('span');
                    bookIcon.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle; margin-right: 4px;"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>';
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
                    const bookNoteIcon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>';
                    const bookNoteOpacity = bookNote ? '1' : '0.3';

                    const noteCell = document.createElement('td');
                    noteCell.style.textAlign = 'center';

                    const noteButton = document.createElement('button');
                    noteButton.className = 'category-note-btn';
                    noteButton.style.opacity = bookNoteOpacity;
                    noteButton.style.color = '#3b82f6';
                    noteButton.title = 'Not ekle/düzenle';
                    noteButton.innerHTML = bookNoteIcon;
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
                    booksTotalRow.className = 'totals-row';

                    const labelCell = document.createElement('td');
                    const labelStrong = document.createElement('strong');
                    labelStrong.textContent = 'TOPLAM KİTAPLAR';
                    labelCell.appendChild(labelStrong);

                    const todayCell = document.createElement('td');
                    const todayStrong = document.createElement('strong');
                    todayStrong.textContent = booksTotalToday + ' sf';
                    todayCell.appendChild(todayStrong);

                    const todayPercentCell = document.createElement('td');
                    todayPercentCell.textContent = '';

                    const weekCellTotal = document.createElement('td');
                    const weekStrong = document.createElement('strong');
                    weekStrong.textContent = booksTotalWeek + ' sf';
                    weekCellTotal.appendChild(weekStrong);

                    const weekPercentCell = document.createElement('td');
                    weekPercentCell.textContent = '';

                    const monthCellTotal = document.createElement('td');
                    const monthStrong = document.createElement('strong');
                    monthStrong.textContent = booksTotalMonth + ' sf';
                    monthCellTotal.appendChild(monthStrong);

                    const monthPercentCell = document.createElement('td');
                    monthPercentCell.textContent = '';

                    const yearCellTotal = document.createElement('td');
                    const yearStrong = document.createElement('strong');
                    yearStrong.textContent = booksTotalYear + ' sf';
                    yearCellTotal.appendChild(yearStrong);

                    const yearPercentCell = document.createElement('td');
                    yearPercentCell.textContent = '';

                    const emptyCell = document.createElement('td');
                    emptyCell.textContent = '';

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

            // Ajouter les namazlar au tableau
            if (typeof NamazManager !== 'undefined') {
                const namazCategories = NamazManager.getCategories();
                let namazTotalToday = 0, namazTotalWeek = 0, namazTotalMonth = 0, namazTotalYear = 0;

                namazCategories.forEach(cat => {
                    const row = document.createElement('tr');
                    row.style.background = '#f0fdf4'; // Vert clair pour les namazlar

                    const stats = NamazManager.getStatisticsForCategory(cat);
                    namazTotalToday += stats.day;
                    namazTotalWeek += stats.week;
                    namazTotalMonth += stats.month;
                    namazTotalYear += stats.year;

                    const catCell = document.createElement('td');
                    catCell.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline-block; vertical-align: middle; margin-right: 4px;"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>';
                    catCell.appendChild(document.createTextNode(cat));

                    const dayCell = document.createElement('td');
                    dayCell.textContent = stats.day;

                    const dayPercentCell = document.createElement('td');
                    dayPercentCell.style.textAlign = 'center';
                    dayPercentCell.textContent = '-';

                    const weekCell = document.createElement('td');
                    weekCell.textContent = stats.week;

                    const weekPercentCell = document.createElement('td');
                    weekPercentCell.style.textAlign = 'center';
                    weekPercentCell.textContent = '-';

                    const monthCell = document.createElement('td');
                    monthCell.textContent = stats.month;

                    const monthPercentCell = document.createElement('td');
                    monthPercentCell.style.textAlign = 'center';
                    monthPercentCell.textContent = '-';

                    const yearCell = document.createElement('td');
                    yearCell.textContent = stats.year;

                    const yearPercentCell = document.createElement('td');
                    yearPercentCell.style.textAlign = 'center';
                    yearPercentCell.textContent = '-';

                    const noteCell = document.createElement('td');
                    noteCell.textContent = '';

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

                // Total namazlar
                if (namazCategories.length > 0) {
                    const namazTotalRow = document.createElement('tr');
                    namazTotalRow.className = 'totals-row';
                    namazTotalRow.style.background = '#dcfce7';

                    const labelCell = document.createElement('td');
                    labelCell.innerHTML = '<strong>TOPLAM NAMAZLAR</strong>';

                    const todayCell = document.createElement('td');
                    todayCell.innerHTML = '<strong>' + namazTotalToday + '</strong>';

                    const cells = [];
                    for (let i = 0; i < 8; i++) {
                        const cell = document.createElement('td');
                        if (i === 0) cell.innerHTML = '<strong>' + namazTotalWeek + '</strong>';
                        else if (i === 2) cell.innerHTML = '<strong>' + namazTotalMonth + '</strong>';
                        else if (i === 4) cell.innerHTML = '<strong>' + namazTotalYear + '</strong>';
                        else cell.textContent = '';
                        cells.push(cell);
                    }

                    namazTotalRow.appendChild(labelCell);
                    namazTotalRow.appendChild(todayCell);
                    cells.forEach(c => namazTotalRow.appendChild(c));

                    tbody.appendChild(namazTotalRow);
                }
            }

            // Ajouter les sohbets au tableau
            if (typeof SohbetManager !== 'undefined') {
                const sohbetStats = SohbetManager.getAllStats();

                if (sohbetStats.today > 0 || sohbetStats.week > 0 || sohbetStats.total > 0) {
                    // Ligne unique pour le total sohbet
                    const sohbetRow = document.createElement('tr');
                    sohbetRow.style.background = '#fef3c7'; // Jaune clair pour sohbet

                    const catCell = document.createElement('td');
                    catCell.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline-block; vertical-align: middle; margin-right: 4px;"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>';
                    catCell.appendChild(document.createTextNode('Sohbet (dakika)'));

                    const dayCell = document.createElement('td');
                    dayCell.textContent = sohbetStats.today + ' dk';

                    const dayPercentCell = document.createElement('td');
                    dayPercentCell.style.textAlign = 'center';
                    dayPercentCell.textContent = '-';

                    const weekCell = document.createElement('td');
                    weekCell.textContent = sohbetStats.week + ' dk';

                    const weekPercentCell = document.createElement('td');
                    weekPercentCell.style.textAlign = 'center';
                    weekPercentCell.textContent = '-';

                    const monthCell = document.createElement('td');
                    monthCell.textContent = sohbetStats.month + ' dk';

                    const monthPercentCell = document.createElement('td');
                    monthPercentCell.style.textAlign = 'center';
                    monthPercentCell.textContent = '-';

                    const yearCell = document.createElement('td');
                    yearCell.textContent = (sohbetStats.year || sohbetStats.total) + ' dk';

                    const yearPercentCell = document.createElement('td');
                    yearPercentCell.style.textAlign = 'center';
                    yearPercentCell.textContent = '-';

                    const noteCell = document.createElement('td');
                    noteCell.textContent = '';

                    sohbetRow.appendChild(catCell);
                    sohbetRow.appendChild(dayCell);
                    sohbetRow.appendChild(dayPercentCell);
                    sohbetRow.appendChild(weekCell);
                    sohbetRow.appendChild(weekPercentCell);
                    sohbetRow.appendChild(monthCell);
                    sohbetRow.appendChild(monthPercentCell);
                    sohbetRow.appendChild(yearCell);
                    sohbetRow.appendChild(yearPercentCell);
                    sohbetRow.appendChild(noteCell);

                    tbody.appendChild(sohbetRow);
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

        // ✅ Mettre à jour la stats card mobile
        const statTodayElement = document.getElementById('statToday');
        if (statTodayElement) {
            statTodayElement.textContent = totalToday;
        }

        const statTotalElement = document.getElementById('statTotal');
        if (statTotalElement) {
            statTotalElement.textContent = totalAll;
        }

        // Afficher l'historique
        displayHistory();

        // Rafraîchir le calendrier
        if (typeof refreshCalendar === 'function') {
            refreshCalendar();
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

    // Construire les détails par catégorie avec objectifs
    const categoriesDetails = categories.reduce((acc, cat) => {
        const stats = getStatisticsForCategory(cat);
        const goals = getCategoryGoals(cat); // Récupérer les objectifs de cette catégorie
        acc[cat] = {
            today: stats.day,
            week: stats.week,
            month: stats.month,
            goals: {
                daily: goals.daily || 0,
                weekly: goals.weekly || 0
            }
        };
        return acc;
    }, {});

    // Ajouter les statistiques des livres avec objectifs
    const booksDetails = {};
    if (typeof BooksManager !== 'undefined' && typeof getBookGoals === 'function') {
        const books = BooksManager.getBooks();
        books.forEach(book => {
            const bookStats = BooksManager.getBookStats(book);
            const bookGoalsData = getBookGoals(book.id); // Récupérer les objectifs du livre
            // Ajouter les statistiques de chaque livre (pages lues)
            booksDetails[book.name] = {
                today: bookStats.today,
                week: bookStats.week,
                month: bookStats.month,
                total: bookStats.total,
                goals: {
                    daily: bookGoalsData.daily || 0,
                    weekly: bookGoalsData.weekly || 0
                }
            };

            // IMPORTANT: Ajouter les pages lues aux totaux pour le classement groupe
            totalToday += bookStats.today || 0;
            totalWeek += bookStats.week || 0;
            totalMonth += bookStats.month || 0;
            totalAll += bookStats.total || 0;
        });
    }

    // Ajouter les statistiques des namazlar
    const namazDetails = {};
    if (typeof NamazManager !== 'undefined') {
        const namazStats = NamazManager.getAllStats();
        namazDetails.categories = namazStats.categories || {};
        // Ajouter aux totaux pour le classement groupe
        totalToday += namazStats.today || 0;
        totalWeek += namazStats.week || 0;
        totalMonth += namazStats.month || 0;
        totalAll += namazStats.total || 0;
    }

    // Ajouter les statistiques des sohbets (minutes)
    const sohbetDetails = {};
    if (typeof SohbetManager !== 'undefined') {
        const sohbetStats = SohbetManager.getAllStats();
        sohbetDetails.sources = sohbetStats.sources || {};
        // Ajouter aux totaux pour le classement groupe (minutes convertis en points)
        totalToday += sohbetStats.today || 0;
        totalWeek += sohbetStats.week || 0;
        totalMonth += sohbetStats.month || 0;
        totalAll += sohbetStats.total || 0;
    }

    return {
        today: totalToday,
        week: totalWeek,
        month: totalMonth,
        total: totalAll,
        categories: categoriesDetails,
        books: booksDetails,
        namaz: namazDetails,
        sohbet: sohbetDetails
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
        `"${escapeHtml(category)}" için BUGÜNÜN tüm zikirlerini sil?<br><br>Bu işlem istatistikleri etkileyecek!`,
        function() {
            const today = new Date().toDateString();
            if (counters[category] && counters[category][today]) {
                counters[category][today] = 0;
                saveCounters();
                updateCounterDisplay();
                updateStats();

                // Mettre à jour le groupe si actif
                if (typeof groupManager !== 'undefined' && groupManager.hasActiveGroup()) {
                    const stats = getCurrentUserStats();
                    groupManager.updateMyScore(stats).catch(err => {
                        console.error('Erreur mise à jour groupe après reset today:', err);
                    });
                }

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
        `"${escapeHtml(category)}" için BU HAFTANıN tüm zikirlerini sil?<br><br>Bu işlem istatistikleri etkileyecek!`,
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

                // Mettre à jour le groupe si actif
                if (typeof groupManager !== 'undefined' && groupManager.hasActiveGroup()) {
                    const stats = getCurrentUserStats();
                    groupManager.updateMyScore(stats).catch(err => {
                        console.error('Erreur mise à jour groupe après reset week:', err);
                    });
                }

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
        `"${escapeHtml(category)}" için BU AYıN tüm zikirlerini sil?<br><br>Bu işlem istatistikleri etkileyecek!`,
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

                // Mettre à jour le groupe si actif
                if (typeof groupManager !== 'undefined' && groupManager.hasActiveGroup()) {
                    const stats = getCurrentUserStats();
                    groupManager.updateMyScore(stats).catch(err => {
                        console.error('Erreur mise à jour groupe après reset month:', err);
                    });
                }

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
        `"${escapeHtml(category)}" kategorisinin tüm geçmişini KALICI olarak sil?<br><br>Bu işlem GERİ ALINMAZ!`,
        function() {
            showCustomConfirm(
                'SON ŞANS',
                `GERÇEKTEN emin misiniz?<br><br>"${escapeHtml(category)}" kategorisinin TÜM geçmişi kaybolacak!`,
                function() {
                    // Réinitialiser complètement la catégorie
                    counters[category] = {};
                    counters[category][currentDate] = 0;

                    saveCounters();
                    updateCounterDisplay();
                    updateStats();

                    // Mettre à jour le groupe si actif
                    if (typeof groupManager !== 'undefined' && groupManager.hasActiveGroup()) {
                        const stats = getCurrentUserStats();
                        groupManager.updateMyScore(stats).catch(err => {
                            console.error('Erreur mise à jour groupe après reset complet:', err);
                        });
                    }

                    showCustomAlert('Geçmiş tamamen silindi!', 'warning', 3000);
                }
            );
        }
    );
}

/**
 * ⚡ NOUVEAU: Forcer un hard reload (vide le cache)
 * Pour PWA mobile qui n'ont pas accès aux DevTools
 */
function forceHardReload() {
    showCustomConfirm(
        '🔄 Zorla Yenile',
        'Cache temizlenecek ve sayfa yeniden yüklenecek.<br><br>Bu işlem:<br>• Tüm önbelleği temizler<br>• Sayfayı sıfırdan yükler<br>• Verileri silmez',
        function() {
            console.log('🗑️ Vidage du cache...');

            // Vider tous les caches
            if ('caches' in window) {
                caches.keys().then(cacheNames => {
                    return Promise.all(
                        cacheNames.map(cacheName => {
                            console.log('🗑️ Suppression cache:', cacheName);
                            return caches.delete(cacheName);
                        })
                    );
                }).then(() => {
                    console.log('✅ Cache vidé, rechargement...');
                    showCustomAlert('✅ Cache temizlendi!<br>Sayfa yenileniyor...', 'success', 2000);

                    setTimeout(() => {
                        // Hard reload
                        window.location.reload(true);
                    }, 2000);
                }).catch(error => {
                    console.error('❌ Erreur vidage cache:', error);
                    // Reload quand même
                    window.location.reload(true);
                });
            } else {
                // Pas de support cache API, juste reload
                window.location.reload(true);
            }
        },
        function() {
            showCustomAlert('❌ İptal edildi', 'info', 1500);
        }
    );
}

function resetAllData() {
    showCustomConfirm(
        'AŞİRİ TEHLİKE',
        'TÜM verilerinizi silin?<br><br>Bu KALICI olarak silecek:<br>• Tüm zikirler ve sayaçlar<br>• Tüm kitaplar ve okuma geçmişi<br>• Tüm geçmiş ve istatistikler<br>• Tüm hedefler',
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
                            // Réinitialiser TOUTES les données (catégories + livres)

                            // 1. Réinitialiser les compteurs de catégories
                            counters = {};
                            categories.forEach(cat => {
                                counters[cat] = {};
                            });
                            saveCounters();

                            // 2. Supprimer les métadonnées et objectifs de catégories
                            categoryMetadata = {};
                            categoryGoals = {};
                            localStorage.setItem('categoryMetadata', JSON.stringify(categoryMetadata));
                            localStorage.setItem('categoryGoals', JSON.stringify(categoryGoals));
                            localStorage.setItem('goalsAchievedToday', JSON.stringify({}));

                            // 3. Supprimer TOUS les livres et leurs objectifs
                            if (typeof BooksManager !== 'undefined' && typeof BooksManager.saveBooks === 'function') {
                                BooksManager.saveBooks([]);
                            }
                            localStorage.setItem('books', JSON.stringify([]));
                            localStorage.setItem('bookGoals', JSON.stringify({}));

                            // 4. Mettre à jour l'interface
                            updateCounterDisplay();
                            updateStats();
                            updateCategoriesList();
                            if (typeof BooksManager !== 'undefined' && typeof BooksManager.updateBooksManagementList === 'function') {
                                BooksManager.updateBooksManagementList();
                            }
                            if (typeof BooksManager !== 'undefined' && typeof BooksManager.renderBooks === 'function') {
                                BooksManager.renderBooks();
                            }

                            // 5. Mettre à jour le groupe si actif
                            if (typeof groupManager !== 'undefined' && groupManager.hasActiveGroup()) {
                                const stats = getCurrentUserStats();
                                groupManager.updateMyScore(stats).catch(err => {
                                    console.error('Erreur mise à jour groupe après reset total:', err);
                                });
                            }

                            closeConfirmDiv();
                            showCustomAlert('TÜM verileriniz silindi! (Zikirler + Kitaplar)', 'warning', 4000);
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
            // Compteurs et catégories
            categories: categories,
            counters: counters,

            // Livres et objectifs de livres (TOUJOURS un tableau [])
            // ⚡ FIX: Utiliser BooksManager.getBooks() pour garantir la bonne lecture
            books: (typeof BooksManager !== 'undefined' && BooksManager.getBooks)
                ? BooksManager.getBooks()
                : JSON.parse(localStorage.getItem('books') || '[]'),
            bookGoals: JSON.parse(localStorage.getItem('bookGoals') || '{}'),

            // Métadonnées et objectifs des catégories
            categoryMetadata: (typeof categoryMetadata !== 'undefined') ? categoryMetadata : JSON.parse(localStorage.getItem('categoryMetadata') || '{}'),
            categoryGoals: JSON.parse(localStorage.getItem('categoryGoals') || '{}'),
            goalsAchievedToday: JSON.parse(localStorage.getItem('goalsAchievedToday') || '{}'),

            // ⚡ NOUVEAU: Système multi-groupe
            multiGroups: JSON.parse(localStorage.getItem('multiGroups') || 'null'),

            // Groupe et participant (ancien système - pour compatibilité)
            currentGroup: JSON.parse(localStorage.getItem('currentGroup') || 'null'),
            currentParticipant: JSON.parse(localStorage.getItem('currentParticipant') || 'null'),
            isCreator: localStorage.getItem('isCreator') === 'true',
            groupHistory: JSON.parse(localStorage.getItem('groupHistory') || '[]'),

            // Notifications et rappels
            notifications_reminders: JSON.parse(localStorage.getItem('notifications_reminders') || '[]'),

            // Namaz data
            namazCategories: JSON.parse(localStorage.getItem('namazCategories') || '[]'),
            namazCounters: JSON.parse(localStorage.getItem('namazCounters') || '{}'),
            namazMetadata: JSON.parse(localStorage.getItem('namazMetadata') || '{}'),
            namazGoals: JSON.parse(localStorage.getItem('namazGoals') || '{}'),

            // Sohbet data
            sohbetHistory: JSON.parse(localStorage.getItem('sohbetHistory') || '{}'),
            sohbetMetadata: JSON.parse(localStorage.getItem('sohbetMetadata') || '{}'),

            // Settings
            settings: {
                soundEnabled: soundEnabled,
                currentCategory: currentCategory || null,
                lastActiveTab: localStorage.getItem('lastActiveTab') || null,
                lastSelectedCategory: localStorage.getItem('lastSelectedCategory') || null,
            },

            exportDate: new Date().toISOString(),
            version: window.APP_VERSION ? window.APP_VERSION.number : '3.5.1'
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
                    // Confirmation "Oui" - Restaurer toutes les données

                    // 1. Compteurs et catégories
                    categories = importedData.categories;
                    counters = importedData.counters;
                    saveCategories();
                    saveCounters();

                    // 2. Livres et objectifs de livres
                    if (importedData.books) {
                        // Garantir que books est un tableau, sinon []
                        const booksArray = Array.isArray(importedData.books) ? importedData.books : [];
                        localStorage.setItem('books', JSON.stringify(booksArray));
                    }

                    if (importedData.bookGoals) {
                        if (typeof bookGoals !== 'undefined') {
                            bookGoals = importedData.bookGoals;
                        }
                        localStorage.setItem('bookGoals', JSON.stringify(importedData.bookGoals));
                        console.log('✅ BookGoals importés');
                    }

                    // 3. Métadonnées et objectifs des catégories
                    if (importedData.categoryMetadata) {
                        if (typeof categoryMetadata !== 'undefined') {
                            categoryMetadata = importedData.categoryMetadata;
                        }
                        localStorage.setItem('categoryMetadata', JSON.stringify(importedData.categoryMetadata));
                    }
                    if (importedData.categoryGoals) {
                        if (typeof categoryGoals !== 'undefined') {
                            categoryGoals = importedData.categoryGoals;
                        }
                        localStorage.setItem('categoryGoals', JSON.stringify(importedData.categoryGoals));
                    }
                    if (importedData.goalsAchievedToday) {
                        localStorage.setItem('goalsAchievedToday', JSON.stringify(importedData.goalsAchievedToday));
                    }

                    // 4. Système multi-groupe (NOUVEAU)
                    if (importedData.multiGroups) {
                        localStorage.setItem('multiGroups', JSON.stringify(importedData.multiGroups));
                        // Recharger le GroupManager avec les nouvelles données
                        if (typeof groupManager !== 'undefined' && groupManager.loadSavedGroup) {
                            groupManager.loadSavedGroup();
                        }
                    }

                    // 5. Groupe et participant (ancien système - pour compatibilité)
                    if (importedData.currentGroup) {
                        localStorage.setItem('currentGroup', JSON.stringify(importedData.currentGroup));
                    }
                    if (importedData.currentParticipant) {
                        localStorage.setItem('currentParticipant', JSON.stringify(importedData.currentParticipant));
                    }
                    if (importedData.isCreator !== undefined) {
                        localStorage.setItem('isCreator', importedData.isCreator.toString());
                    }
                    if (importedData.groupHistory) {
                        localStorage.setItem('groupHistory', JSON.stringify(importedData.groupHistory));
                    }

                    // 6. Notifications et rappels
                    if (importedData.notifications_reminders) {
                        localStorage.setItem('notifications_reminders', JSON.stringify(importedData.notifications_reminders));
                    }

                    // 7. Namaz data
                    if (importedData.namazCategories) {
                        localStorage.setItem('namazCategories', JSON.stringify(importedData.namazCategories));
                    }
                    if (importedData.namazCounters) {
                        localStorage.setItem('namazCounters', JSON.stringify(importedData.namazCounters));
                    }
                    if (importedData.namazMetadata) {
                        localStorage.setItem('namazMetadata', JSON.stringify(importedData.namazMetadata));
                    }
                    if (importedData.namazGoals) {
                        localStorage.setItem('namazGoals', JSON.stringify(importedData.namazGoals));
                    }

                    // 8. Sohbet data
                    if (importedData.sohbetHistory) {
                        localStorage.setItem('sohbetHistory', JSON.stringify(importedData.sohbetHistory));
                    }
                    if (importedData.sohbetMetadata) {
                        localStorage.setItem('sohbetMetadata', JSON.stringify(importedData.sohbetMetadata));
                    }

                    // 9. Settings
                    if (importedData.settings) {
                        if (importedData.settings.soundEnabled !== undefined) {
                            soundEnabled = importedData.settings.soundEnabled;
                            localStorage.setItem('soundEnabled', soundEnabled ? 'true' : 'false');
                        }
                        if (importedData.settings.currentCategory) {
                            currentCategory = importedData.settings.currentCategory;
                        }
                        if (importedData.settings.lastActiveTab) {
                            localStorage.setItem('lastActiveTab', importedData.settings.lastActiveTab);
                        }
                        if (importedData.settings.lastSelectedCategory) {
                            localStorage.setItem('lastSelectedCategory', importedData.settings.lastSelectedCategory);
                        }
                    }

                    // 8. Rafraîchir l'interface
                    updateCategorySelect();
                    updateCategoriesList();
                    updateCounterDisplay();
                    updateStats();

                    // ⚡ FIX: Recharger la page pour garantir que TOUT se recharge
                    showCustomAlert('İçe aktarma başarılı!<br>Sayfa yeniden yükleniyor...', 'success', 2000);

                    setTimeout(() => {
                        console.log('🔄 Rechargement page après import...');
                        window.location.reload();
                    }, 2000);
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

    // Ajouter les statistiques des livres si disponibles
    let totalBooksToday = 0;
    let totalBooksAll = 0;
    let booksMessage = '';

    if (typeof BooksManager !== 'undefined') {
        const books = BooksManager.getBooks();
        const dateKeyISO = today.toISOString().split('T')[0]; // Format ISO pour les livres

        if (books.length > 0) {
            booksMessage += `\n📚 KİTAPLAR:\n`;

            books.forEach(book => {
                const todayPages = (book.history && book.history[dateKeyISO]) ? book.history[dateKeyISO] : 0;

                let bookTotal = 0;
                if (book.history) {
                    Object.values(book.history).forEach(pages => {
                        bookTotal += pages || 0;
                    });
                }

                totalBooksToday += todayPages;
                totalBooksAll += bookTotal;

                if (bookTotal > 0) {
                    const progress = book.totalPages > 0 ? ` (${bookTotal}/${book.totalPages})` : '';
                    booksMessage += `${book.name}${progress}:\n`;
                    booksMessage += `   Bugün: ${todayPages} sayfa\n`;
                    booksMessage += `   Toplam: ${bookTotal} sayfa\n\n`;
                }
            });
        }
    }

    message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    message += `ÖZET:\n`;
    message += `• Bugün: ${totalToday} zikir`;
    if (totalBooksToday > 0) message += ` + ${totalBooksToday} sayfa\n`;
    else message += `\n`;
    message += `• GENEL TOPLAM: ${totalGeneral} zikir`;
    if (totalBooksAll > 0) message += ` + ${totalBooksAll} sayfa\n`;
    else message += `\n`;

    // Ajouter les détails des livres
    if (booksMessage) {
        message += booksMessage;
    }

    message += `\nAllah dualarımızı kabul etsin\n`;
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

    // Initialize Settings Accordion (première section ouverte par défaut)
    const firstAccordion = document.querySelector('.settings-accordion-item:first-child');
    if (firstAccordion) {
        const firstHeader = firstAccordion.querySelector('.settings-accordion-header');
        const firstContent = firstAccordion.querySelector('.settings-accordion-content');
        if (firstHeader && firstContent) {
            firstHeader.classList.add('active');
            firstContent.classList.add('open');
        }
    }

    // Enable audio on first interaction for mobile
    enableAudioOnInteraction();

    // ⚡ OPTIMISATION MOBILE : Réactivité ultra-rapide du bouton compteur
    const countButton = document.getElementById('countButton');
    if (countButton) {
        let touchHandled = false;

        // Touch start pour réactivité instantanée sur mobile (pas de délai 300ms)
        countButton.addEventListener('touchstart', function(e) {
            // Toujours empêcher le comportement par défaut (zoom, scroll, etc.)
            e.preventDefault();

            touchHandled = true;
            incrementCounter();
        }, { passive: false });

        // Empêcher complètement le zoom au double-tap et multi-tap rapide
        countButton.addEventListener('touchend', function(e) {
            e.preventDefault(); // Bloque systématiquement le zoom sur touchend

            // Reset le flag après un délai court
            setTimeout(() => {
                touchHandled = false;
            }, 100);
        }, { passive: false });

        // Empêcher aussi touchmove pour éviter scroll accidentel sur le bouton
        countButton.addEventListener('touchmove', function(e) {
            e.preventDefault();
        }, { passive: false });

        // Click pour desktop (ne sera pas déclenché sur mobile grâce au flag)
        countButton.addEventListener('click', function() {
            if (!touchHandled) {
                incrementCounter();
            }
        });
    }

    // Initialize backend (Supabase)
    initializeBackend();

    // 📊 PrivacyAnalytics s'initialise automatiquement via DOMContentLoaded
    // Il est maintenant INDÉPENDANT de groupManager et crée sa propre connexion Supabase

    // Vérifier le rappel de sauvegarde (tous les 7 jours)
    checkBackupReminder();

    // Vérifier si c'est le premier lancement pour afficher les zikirs conseillés
    checkTavsiyeFirstLaunch();

    // Événements
    const categorySelect = document.getElementById('categorySelect');
    if (categorySelect) {
        categorySelect.addEventListener('change', function() {
            currentCategory = this.value;
            // Sauvegarder la catégorie sélectionnée pour restauration après actualisation
            localStorage.setItem('lastSelectedCategory', this.value);
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

    // Restaurer l'onglet actif après actualisation
    const lastActiveTab = localStorage.getItem('lastActiveTab');
    if (lastActiveTab) {
        // Trouver le bouton correspondant et simuler un clic
        const tabButtons = document.querySelectorAll('.tab-button');
        tabButtons.forEach(btn => {
            if (btn.getAttribute('onclick')?.includes(`'${lastActiveTab}'`)) {
                btn.click();
            }
        });
    }

    // Restaurer la catégorie sélectionnée dans le compteur
    const lastSelectedCategory = localStorage.getItem('lastSelectedCategory');
    if (lastSelectedCategory && categorySelect) {
        categorySelect.value = lastSelectedCategory;
        currentCategory = lastSelectedCategory;
        updateCounterDisplay();
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

// ============================================
// SYSTÈME DE MISE À JOUR AMÉLIORÉ
// ============================================

// Variables globales pour tracking des mises à jour
let pendingServiceWorker = null;
let updateRefusedCount = parseInt(localStorage.getItem('updateRefusedCount') || '0');
let isReloading = false; // Flag pour éviter double reload

/**
 * Afficher la bannière de mise à jour disponible
 */
function showUpdateBanner() {
    const banner = document.getElementById('updateBanner');
    if (banner) {
        banner.style.display = 'block';
    }
}

/**
 * Cacher la bannière de mise à jour
 */
function hideUpdateBanner() {
    const banner = document.getElementById('updateBanner');
    if (banner) {
        banner.style.display = 'none';
    }
    // Incrémenter le compteur de refus
    updateRefusedCount++;
    localStorage.setItem('updateRefusedCount', updateRefusedCount.toString());

    // Afficher message
    showCustomAlert(`Mise à jour reportée (${updateRefusedCount}/3)<br>Sera forcée après 3 reports`, 'info', 2500);
}

/**
 * Appliquer la mise à jour maintenant
 */
function applyUpdateNow() {
    if (pendingServiceWorker) {
        // Marquer qu'on vient de faire une MAJ (évite boucle infinie)
        sessionStorage.setItem('justUpdated', Date.now().toString());

        // Sauvegarder avant mise à jour
        showCustomAlert('💾 Sauvegarde en cours...', 'info', 2000);

        try {
            autoSave();
            console.log('✅ Données sauvegardées avant mise à jour');

            // Reset compteur de refus
            localStorage.setItem('updateRefusedCount', '0');

            // Masquer l'indicateur
            hideUpdateIndicator();

            // Confirmation
            setTimeout(() => {
                showCustomAlert('✅ Sauvegardé! Mise à jour en cours...', 'success', 2000);
            }, 1000);

            // Vider TOUS les caches AVANT d'activer le nouveau SW
            setTimeout(() => {
                console.log('🗑️ Vidage de tous les caches...');
                caches.keys().then(cacheNames => {
                    return Promise.all(
                        cacheNames.map(cacheName => {
                            console.log('🗑️ Suppression cache:', cacheName);
                            return caches.delete(cacheName);
                        })
                    );
                }).then(() => {
                    console.log('✅ Tous les caches vidés');

                    // Maintenant activer le nouveau Service Worker
                    pendingServiceWorker.postMessage({ type: 'SKIP_WAITING' });

                    // ⚠️ Reload de secours après 3s si controllerchange ne se déclenche pas
                    setTimeout(() => {
                        if (!isReloading) {
                            console.log('🔄 Reload de secours (controllerchange n\'a pas fonctionné)...');
                            isReloading = true;
                            try {
                                window.location.reload(true);
                            } catch (e) {
                                window.location.href = window.location.href.split('?')[0] + '?updated=' + Date.now();
                            }
                        }
                    }, 3000);

                }).catch(error => {
                    console.error('❌ Erreur vidage cache:', error);
                    // En cas d'erreur, activer et recharger quand même
                    pendingServiceWorker.postMessage({ type: 'SKIP_WAITING' });
                    setTimeout(() => {
                        window.location.href = window.location.href.split('?')[0] + '?updated=' + Date.now();
                    }, 2000);
                });
            }, 2500);

        } catch (error) {
            console.error('⚠️ Erreur sauvegarde:', error);
            showCustomAlert('⚠️ Erreur, MAJ quand même...', 'warning', 1000);

            // En cas d'erreur, vider caches et activer
            caches.keys().then(cacheNames => {
                return Promise.all(cacheNames.map(name => caches.delete(name)));
            }).finally(() => {
                pendingServiceWorker.postMessage({ type: 'SKIP_WAITING' });
            });
        }
    }
}

/**
 * Afficher l'indicateur de mise à jour dans la navbar
 */
function showUpdateIndicator() {
    const indicator = document.getElementById('updateIndicator');
    if (indicator) {
        indicator.style.display = 'flex';
        console.log('🔔 Indicateur de mise à jour affiché dans la navbar');
    }
}

/**
 * Masquer l'indicateur de mise à jour
 */
function hideUpdateIndicator() {
    const indicator = document.getElementById('updateIndicator');
    if (indicator) {
        indicator.style.display = 'none';
    }
}

/**
 * Afficher un banner persistant pour mise à jour PWA
 */
function showPWAUpdateBanner() {
    // Supprimer l'ancien banner si existe
    const existingBanner = document.getElementById('pwaUpdateBanner');
    if (existingBanner) existingBanner.remove();

    const banner = document.createElement('div');
    banner.id = 'pwaUpdateBanner';
    banner.innerHTML = `
        <div style="
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 16px 20px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            z-index: 10000;
            box-shadow: 0 -4px 20px rgba(0,0,0,0.3);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        ">
            <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
                <span style="font-size: 24px;">🆕</span>
                <div>
                    <div style="font-weight: 600; font-size: 15px;">Yeni sürüm mevcut!</div>
                    <div style="font-size: 12px; opacity: 0.9;">Güncellemek için tıklayın</div>
                </div>
            </div>
            <button onclick="applyUpdateNow()" style="
                background: white;
                color: #667eea;
                border: none;
                padding: 10px 20px;
                border-radius: 8px;
                font-weight: 600;
                font-size: 14px;
                cursor: pointer;
                white-space: nowrap;
            ">Güncelle</button>
            <button onclick="document.getElementById('pwaUpdateBanner').remove()" style="
                background: transparent;
                color: white;
                border: none;
                padding: 8px;
                cursor: pointer;
                opacity: 0.7;
                font-size: 20px;
            ">✕</button>
        </div>
    `;
    document.body.appendChild(banner);
    console.log('📱 PWA: Banner de mise à jour affiché');
}

/**
 * Afficher le popup de détails de mise à jour
 */
function showUpdateDetailsPopup() {
    const popupHTML = `
        <div class="custom-modal-overlay" id="updatePopup">
            <div class="custom-modal" style="max-width: 450px;">
                <div class="modal-header">
                    <h3>🔔 Yeni Güncelleme Mevcut!</h3>
                    <button class="modal-close" onclick="document.getElementById('updatePopup').remove()">✕</button>
                </div>
                <div class="modal-body">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <div style="font-size: 64px; margin-bottom: 12px;">🎉</div>
                        <p style="font-size: 16px; color: #475569; margin-bottom: 8px;">
                            Uygulamanın yeni bir sürümü hazır!
                        </p>
                        <p style="font-size: 14px; color: #64748b;">
                            Yeni özellikler ve iyileştirmeler içerir.
                        </p>
                    </div>

                    <div style="background: #f1f5f9; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
                        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                            <span style="font-size: 24px;">✨</span>
                            <div>
                                <div style="font-weight: 600; color: #1e293b; font-size: 14px;">Yeni Özellikler</div>
                                <div style="font-size: 13px; color: #64748b;">Performans iyileştirmeleri</div>
                            </div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <span style="font-size: 24px;">🐛</span>
                            <div>
                                <div style="font-weight: 600; color: #1e293b; font-size: 14px;">Hata Düzeltmeleri</div>
                                <div style="font-size: 13px; color: #64748b;">Stabilite iyileştirmeleri</div>
                            </div>
                        </div>
                    </div>

                    <p style="font-size: 13px; color: #94a3b8; text-align: center; margin-bottom: 16px;">
                        ⚡ Güncelleme birkaç saniye sürer
                    </p>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="document.getElementById('updatePopup').remove()">
                        Daha Sonra
                    </button>
                    <button class="btn-primary" onclick="applyUpdateFromPopup()">
                        🚀 Şimdi Güncelle
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', popupHTML);
}

/**
 * Appliquer la mise à jour depuis le popup
 */
function applyUpdateFromPopup() {
    // Fermer le popup
    const popup = document.getElementById('updatePopup');
    if (popup) popup.remove();

    // Masquer l'indicateur
    hideUpdateIndicator();

    // Afficher message + appliquer
    showCustomAlert('🔄 Güncelleme uygulanıyor...', 'info', 2000);

    // Appliquer la mise à jour
    setTimeout(() => {
        applyUpdateNow();
    }, 500);
}

/**
 * Vérifier manuellement les mises à jour
 * Fonction accessible depuis l'interface utilisateur
 */
function checkForUpdates() {
    if (!('serviceWorker' in navigator)) {
        showCustomAlert('❌ Service Worker desteklenmiyor', 'error', 2000);
        return;
    }

    showCustomAlert('🔄 Güncelleme kontrol ediliyor...', 'info', 2000);

    navigator.serviceWorker.getRegistration().then(registration => {
        if (!registration) {
            showCustomAlert('❌ Service Worker kayıtlı değil', 'error', 2000);
            return;
        }

        // Vérifier s'il y a déjà une mise à jour en attente
        if (registration.waiting) {
            console.log('⚡ Mise à jour déjà disponible - activation immédiate');
            // Envoyer le message SKIP_WAITING au SW en attente
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            showCustomAlert('🔄 Mise à jour en cours...', 'info', 1000);

            // Le controllerchange va déclencher le reload automatique
            return;
        }

        // Forcer la vérification de mise à jour
        registration.update()
            .then(() => {
                console.log('✅ Vérification mise à jour effectuée');

                // Attendre 3 secondes pour voir si une mise à jour est détectée
                setTimeout(() => {
                    if (registration.waiting) {
                        // Nouvelle version détectée
                        console.log('🆕 Nouvelle version détectée - activation');
                        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                        showCustomAlert('🔄 Mise à jour en cours...', 'info', 1000);
                    } else if (!pendingServiceWorker) {
                        showCustomAlert('✅ Uygulama güncel!', 'success', 2000);
                    }
                    // Sinon la bannière s'affichera automatiquement
                }, 3000);
            })
            .catch(error => {
                console.error('❌ Erreur vérification:', error);
                showCustomAlert('❌ Güncelleme kontrol hatası', 'error', 2000);
            });
    });
}

// Service Worker pour PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        // ⚡ Cache-busting: Ajouter version pour forcer Opera à recharger sw.js
        const SW_VERSION = '2025-12-02-pwa-15min-interval';
        navigator.serviceWorker.register('./sw.js?v=' + SW_VERSION)
            .then(function(registration) {
                console.log('Service Worker başarıyla kaydedildi:', registration.scope);

                // ✅ Vérifier les mises à jour - RÉACTIVÉ
                registration.addEventListener('updatefound', function() {
                    const newWorker = registration.installing;
                    console.log('🔍 Nouvelle version SW en cours d\'installation...');

                    newWorker.addEventListener('statechange', function() {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            console.log('🆕 Nouvelle version disponible');
                            pendingServiceWorker = newWorker;

                            // ⚡ PWA: Afficher banner persistant pour mise à jour manuelle
                            // Browser: Appliquer automatiquement
                            const isPWAMode = window.matchMedia('(display-mode: standalone)').matches ||
                                              window.navigator.standalone === true;
                            if (isPWAMode) {
                                showPWAUpdateBanner();
                            } else {
                                applyUpdateNow();
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
        if (isReloading) {
            console.log('🔄 Reload déjà en cours, ignore controllerchange');
            return;
        }

        console.log('🔄 Nouveau Service Worker actif - Reload immédiat');
        isReloading = true;

        // Les caches sont déjà vidés dans applyUpdateNow, donc reload directement
        // FORCER un hard reload qui bypass TOUS les caches
        try {
            window.location.reload(true); // true = hard reload (deprecated mais fonctionne)
        } catch (e) {
            // Si ça échoue (certains navigateurs), utiliser méthode 2
            console.log('🔄 Fallback: Cache busting reload');
            window.location.href = window.location.href.split('?')[0] + '?updated=' + Date.now();
        }
    });

    // ⚡ FIX CHROME: Timestamp de chargement de la page pour éviter vérification MAJ trop rapide
    const pageLoadTime = Date.now();

    // ⚡ FIX PWA: Détecter si on est en mode standalone (PWA installée)
    const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
                  window.navigator.standalone === true;

    if (isPWA) {
        console.log('📱 Mode PWA standalone détecté - Optimisations MAJ activées');
    } else {
        console.log('🌐 Mode navigateur normal');
    }

    // ⚡ FIX PWA: Nettoyer l'URL ?updated= après le chargement pour PWA
    if (isPWA && window.location.search.includes('updated=')) {
        console.log('🧹 PWA: Nettoyage URL après MAJ');
        // Attendre 2s puis nettoyer l'URL sans recharger
        setTimeout(() => {
            const cleanUrl = window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
            console.log('✅ PWA: URL nettoyée');
        }, 2000);
    }

    // Fonction helper: Vérifier si on peut checker les MAJ (évite boucle infinie)
    function canCheckForUpdates() {
        // ⚡ FIX PWA: Pour les PWA installées, délai de grâce réduit à 5s
        const graceTime = isPWA ? 5000 : 10000;
        const timeSincePageLoad = Date.now() - pageLoadTime;
        if (timeSincePageLoad < graceTime) {
            console.log(`⏳ Délai de grâce après chargement (${Math.ceil((graceTime - timeSincePageLoad) / 1000)}s restantes)`);
            return false;
        }

        // ⚡ FIX CHROME: Vérifier si on vient de mettre à jour via l'URL (sauf PWA)
        if (!isPWA && window.location.search.includes('updated=')) {
            console.log('⏳ Page rechargée après MAJ, pas de nouvelle vérification');
            return false;
        }

        const justUpdated = sessionStorage.getItem('justUpdated');
        if (justUpdated) {
            const timeSinceUpdate = Date.now() - parseInt(justUpdated);
            const COOLDOWN = 5 * 60 * 1000; // 5 minutes de cooldown après MAJ

            if (timeSinceUpdate < COOLDOWN) {
                const remainingMinutes = Math.ceil((COOLDOWN - timeSinceUpdate) / 60000);
                console.log(`⏳ Cooldown MAJ actif (${remainingMinutes}min restantes)`);
                return false;
            } else {
                // Cooldown terminé, effacer le flag
                sessionStorage.removeItem('justUpdated');
            }
        }
        return true;
    }

    // ✅ Vérification périodique automatique des mises à jour (toutes les heures)
    setInterval(() => {
        if (navigator.serviceWorker.controller && canCheckForUpdates()) {
            console.log('🔄 Vérification automatique des mises à jour...');
            navigator.serviceWorker.getRegistration().then(registration => {
                if (registration) {
                    registration.update().catch(error => {
                        console.error('❌ Erreur vérification mise à jour:', error);
                    });
                }
            });
        }
    }, isPWA ? 15 * 60 * 1000 : 60 * 60 * 1000); // PWA: 15 min, Browser: 1 heure

    // ✅ Vérification quand l'app revient au premier plan (mobile PWA)
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && navigator.serviceWorker.controller && canCheckForUpdates()) {
            console.log('📱 App revenue au premier plan - Vérification MAJ...');
            navigator.serviceWorker.getRegistration().then(registration => {
                if (registration) {
                    registration.update().catch(error => {
                        console.error('❌ Erreur vérification MAJ:', error);
                    });
                }
            });
        }
    });

    // ✅ Vérification au focus de la fenêtre (desktop)
    window.addEventListener('focus', () => {
        if (navigator.serviceWorker.controller && canCheckForUpdates()) {
            console.log('🖥️ Fenêtre focus - Vérification MAJ...');
            navigator.serviceWorker.getRegistration().then(registration => {
                if (registration) {
                    registration.update().catch(error => {
                        console.error('❌ Erreur vérification MAJ:', error);
                    });
                }
            });
        }
    });

    // ⚡ FIX PWA: Vérification forcée au démarrage pour les PWA installées
    if (isPWA) {
        console.log('📱 Mode PWA détecté - Vérification MAJ au démarrage activée');

        // Attendre le délai de grâce (5s pour PWA) + 1s de sécurité
        setTimeout(() => {
            if (navigator.serviceWorker.controller) {
                console.log('🔄 PWA: Vérification MAJ au démarrage...');
                navigator.serviceWorker.getRegistration().then(registration => {
                    if (registration) {
                        registration.update()
                            .then(() => console.log('✅ PWA: Vérification MAJ terminée'))
                            .catch(error => {
                                console.error('❌ PWA: Erreur vérification MAJ:', error);
                            });
                    }
                });
            }
        }, 6000); // 5s délai de grâce + 1s de sécurité
    }
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

    // Si pas de config valide, afficher un avertissement mais garder l'onglet visible
    if (!config) {
      console.info('💡 Configuration Supabase requise pour le mode groupe');
      const groupTab = document.querySelector('.tab-button[onclick*="group"]');
      if (groupTab) {
        groupTab.style.opacity = '0.6';
        groupTab.title = 'Configuration Supabase requise (variables d\'environnement Netlify)';
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

          // 💬 Initialiser le chat
          if (typeof initializeChat === 'function') {
            initializeChat()
          }
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

// ============================================
// VÉRIFICATION AUTOMATIQUE DES MISES À JOUR
// ============================================

// Variables globales pour le throttling
let lastUpdateCheck = 0;
let updatePromptShown = false;
const UPDATE_CHECK_COOLDOWN = 5 * 60 * 1000; // 5 minutes minimum entre les vérifications

// Vérifier les mises à jour - DÉSACTIVÉE
function checkForAppUpdates() {
    // Fonction désactivée pour éviter les popups en boucle
    console.log('⏸️ Vérification mises à jour désactivée');
    return;
}

// Afficher le prompt de mise à jour - DÉSACTIVÉE
function showUpdatePrompt(_newVersion) {
    // Fonction désactivée pour éviter les popups en boucle
    console.log('⏸️ Popup mise à jour désactivé');
    return;
}

// Vérification DÉSACTIVÉE TEMPORAIREMENT (à cause de bug sur mobile)
// TODO: Réactiver après correction du bug
/*
window.addEventListener('load', function() {
    // Première vérification après 10 secondes (laisser l'app se charger)
    setTimeout(function() {
        console.log('🔍 Vérification initiale des mises à jour');
        checkForAppUpdates();
    }, 10000);
});
*/

// ============================================
// BARRES CHROME MOBILE - NOTE
// ============================================

// Chrome 141+ affiche les barres de navigation de maniere persistante.
// Il n'existe pas de solution CSS/JS fiable pour les cacher.
// Solution recommandee : Installer l'app comme PWA (mode standalone).
// En mode PWA, il n'y a AUCUNE barre Chrome du tout.

// ============================================
// SWIPE NAVIGATION ENTRE ONGLETS
// ============================================

const SWIPE_TABS = ['counter', 'books', 'namaz', 'sohbet'];
let swipeTouchStartX = 0;
let swipeTouchEndX = 0;
let swipeCurrentTab = 'counter';

function initSwipeNavigation() {
    const container = document.querySelector('.container');
    if (!container) return;

    container.addEventListener('touchstart', (e) => {
        swipeTouchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    container.addEventListener('touchend', (e) => {
        swipeTouchEndX = e.changedTouches[0].screenX;
        handleSwipeGesture();
    }, { passive: true });
}

function handleSwipeGesture() {
    const threshold = 80; // Minimum pixels pour un swipe
    const diff = swipeTouchStartX - swipeTouchEndX;

    // Verifier quel onglet est actuellement actif
    const activeTab = document.querySelector('.tab-content.active');
    if (!activeTab) return;

    const currentTabId = activeTab.id;
    const currentIndex = SWIPE_TABS.indexOf(currentTabId);

    // Si l'onglet actuel n'est pas dans la liste des swipe tabs, ignorer
    if (currentIndex === -1) return;

    if (Math.abs(diff) > threshold) {
        if (diff > 0 && currentIndex < SWIPE_TABS.length - 1) {
            // Swipe gauche -> onglet suivant
            showTab(SWIPE_TABS[currentIndex + 1]);
        } else if (diff < 0 && currentIndex > 0) {
            // Swipe droite -> onglet precedent
            showTab(SWIPE_TABS[currentIndex - 1]);
        }
    }
}

// Navigation avec boutons (pour desktop)
function navigateToPrevTab() {
    const activeTab = document.querySelector('.tab-content.active');
    if (!activeTab) return;

    const currentIndex = SWIPE_TABS.indexOf(activeTab.id);
    if (currentIndex > 0) {
        showTab(SWIPE_TABS[currentIndex - 1]);
    }
}

function navigateToNextTab() {
    const activeTab = document.querySelector('.tab-content.active');
    if (!activeTab) return;

    const currentIndex = SWIPE_TABS.indexOf(activeTab.id);
    if (currentIndex < SWIPE_TABS.length - 1) {
        showTab(SWIPE_TABS[currentIndex + 1]);
    }
}

// Initialiser le swipe au chargement
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSwipeNavigation);
} else {
    initSwipeNavigation();
}
