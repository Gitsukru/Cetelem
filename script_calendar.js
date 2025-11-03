/**
 * 📅 CALENDRIER DE SUIVI
 * Visualisation mensuelle des progrès quotidiens avec streaks
 */

// ============================================
// ÉTAT DU CALENDRIER
// ============================================

let currentCalendarDate = new Date();

// ============================================
// INITIALISATION
// ============================================

/**
 * Initialiser le calendrier au chargement de l'app
 */
function initializeCalendar() {
  renderCalendar();
  calculateAndDisplayStreaks();
}

// ============================================
// GÉNÉRATION DU CALENDRIER
// ============================================

/**
 * Générer et afficher le calendrier pour le mois actuel
 */
function renderCalendar() {
  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();

  // Mettre à jour le titre mois/année
  updateCalendarHeader(year, month);

  // Générer les jours
  generateCalendarDays(year, month);
}

/**
 * Mettre à jour le header du calendrier (mois + année)
 */
function updateCalendarHeader(year, month) {
  const monthNames = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];

  const headerElement = document.getElementById('calendarMonthYear');
  if (headerElement) {
    headerElement.textContent = `${monthNames[month]} ${year}`;
  }
}

/**
 * Générer les cellules jours du calendrier
 */
function generateCalendarDays(year, month) {
  const container = document.getElementById('calendarDays');
  if (!container) return;

  container.innerHTML = '';

  // Premier jour du mois
  const firstDay = new Date(year, month, 1);

  // Dernier jour du mois
  const lastDay = new Date(year, month + 1, 0);

  // Jour de la semaine du premier jour (0=Dimanche, 1=Lundi...)
  // En Turquie, la semaine commence le lundi
  let startDayOfWeek = firstDay.getDay();
  startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1; // Convertir (Lundi=0)

  const totalDays = lastDay.getDate();

  // Ajouter les jours vides avant le 1er du mois
  for (let i = 0; i < startDayOfWeek; i++) {
    const emptyDay = document.createElement('div');
    emptyDay.className = 'calendar-day empty';
    container.appendChild(emptyDay);
  }

  // Ajouter tous les jours du mois
  for (let day = 1; day <= totalDays; day++) {
    const dayElement = createDayElement(year, month, day);
    container.appendChild(dayElement);
  }
}

/**
 * Créer un élément jour avec son style selon la progression
 */
function createDayElement(year, month, day) {
  const dayElement = document.createElement('div');
  dayElement.className = 'calendar-day';
  dayElement.textContent = day;

  const date = new Date(year, month, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  // Jour futur : grisé
  if (date > today) {
    dayElement.classList.add('future');
    return dayElement;
  }

  // Jour aujourd'hui : bordure spéciale
  if (date.getTime() === today.getTime()) {
    dayElement.classList.add('today');
  }

  // Calculer la progression pour ce jour
  const dayData = getDayProgressData(date);

  // Appliquer la classe de niveau
  if (dayData.totalCount === 0) {
    dayElement.classList.add('no-data');
    dayElement.setAttribute('data-tooltip', 'Veri yok');
  } else {
    const level = getProgressLevel(dayData.percentage);
    dayElement.classList.add(`level-${level}`);

    // Tooltip avec détails
    const tooltip = `${day} ${getMonthName(month)}: ${dayData.totalCount} zikir (${dayData.percentage}%)`;
    dayElement.setAttribute('data-tooltip', tooltip);
  }

  return dayElement;
}

/**
 * Obtenir les données de progression pour un jour
 */
function getDayProgressData(date) {
  const dateKey = date.toDateString();

  // Charger les compteurs
  const counters = getCountersFromStorage();
  const categories = getCategoriesFromStorage();

  let totalCount = 0;
  let totalGoals = 0;

  // Parcourir toutes les catégories
  categories.forEach(category => {
    if (counters[category] && counters[category][dateKey]) {
      totalCount += counters[category][dateKey] || 0;
    }

    // Ajouter les objectifs quotidiens
    if (typeof getCategoryGoals === 'function') {
      const goals = getCategoryGoals(category);
      totalGoals += goals.daily || 0;
    }
  });

  // Ajouter les données des livres
  if (typeof BooksManager !== 'undefined') {
    const books = BooksManager.getBooks();
    const dateKeyISO = date.toISOString().split('T')[0]; // Format ISO pour les livres

    books.forEach(book => {
      // Les livres utilisent le format ISO dans leur history
      if (book.history && book.history[dateKeyISO]) {
        totalCount += book.history[dateKeyISO] || 0;
      }

      const bookGoals = typeof getBookGoals === 'function' ? getBookGoals(book.id) : { daily: 0 };
      totalGoals += bookGoals.daily || 0;
    });
  }

  // Calculer le pourcentage
  const percentage = totalGoals > 0
    ? Math.min(Math.round((totalCount / totalGoals) * 100), 100)
    : 0;

  return {
    totalCount,
    totalGoals,
    percentage
  };
}

/**
 * Déterminer le niveau de progression (none, low, medium, high, perfect)
 */
function getProgressLevel(percentage) {
  if (percentage === 0) return 'none';
  if (percentage === 100) return 'perfect';
  if (percentage >= 75) return 'high';
  if (percentage >= 25) return 'medium';
  return 'low';
}

/**
 * Obtenir le nom du mois en turc
 */
function getMonthName(monthIndex) {
  const monthNames = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];
  return monthNames[monthIndex];
}

// ============================================
// NAVIGATION ENTRE MOIS
// ============================================

/**
 * Aller au mois précédent
 */
function previousMonth() {
  currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
  renderCalendar();
}

/**
 * Aller au mois suivant
 */
function nextMonth() {
  currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
  renderCalendar();
}

// ============================================
// CALCUL DES STREAKS
// ============================================

/**
 * Calculer et afficher current streak et best streak
 */
function calculateAndDisplayStreaks() {
  const streaks = calculateStreaks();

  // Afficher current streak
  const currentStreakEl = document.getElementById('currentStreak');
  if (currentStreakEl) {
    currentStreakEl.textContent = streaks.current;
  }

  // Afficher best streak
  const bestStreakEl = document.getElementById('bestStreak');
  if (bestStreakEl) {
    bestStreakEl.textContent = streaks.best;
  }
}

/**
 * Calculer les streaks (jours consécutifs avec objectif atteint)
 */
function calculateStreaks() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let currentStreak = 0;
  let bestStreak = 0;
  let tempStreak = 0;

  // Parcourir les 365 derniers jours (1 an)
  for (let i = 0; i <= 365; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    const dayData = getDayProgressData(date);

    // Objectif atteint si >= 75%
    if (dayData.percentage >= 75) {
      tempStreak++;
      bestStreak = Math.max(bestStreak, tempStreak);

      // Current streak = depuis aujourd'hui vers le passé sans interruption
      if (i === currentStreak) {
        currentStreak++;
      }
    } else {
      // Interruption
      tempStreak = 0;
    }
  }

  return {
    current: currentStreak,
    best: bestStreak
  };
}

// ============================================
// UTILITAIRES DONNÉES
// ============================================

/**
 * Charger les compteurs depuis localStorage
 */
function getCountersFromStorage() {
  try {
    const data = localStorage.getItem('counters');
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('Erreur chargement compteurs:', error);
    return {};
  }
}

/**
 * Charger les catégories depuis localStorage ou utiliser les globales
 */
function getCategoriesFromStorage() {
  // Utiliser la variable globale si disponible
  if (typeof categories !== 'undefined' && Array.isArray(categories)) {
    return categories;
  }

  // Sinon charger depuis localStorage
  try {
    const data = localStorage.getItem('categories');
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Erreur chargement catégories:', error);
    return [];
  }
}

// ============================================
// HOOKS D'INTÉGRATION
// ============================================

/**
 * Rafraîchir le calendrier (appelé après mise à jour stats)
 */
function refreshCalendar() {
  renderCalendar();
  calculateAndDisplayStreaks();
}

// ============================================
// AUTO-INITIALISATION
// ============================================

// Initialiser le calendrier dès que le DOM est chargé
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeCalendar);
} else {
  // DOM déjà chargé
  if (typeof categories !== 'undefined') {
    // Si script.js est déjà chargé
    initializeCalendar();
  } else {
    // Attendre que script.js charge les catégories
    window.addEventListener('load', initializeCalendar);
  }
}
