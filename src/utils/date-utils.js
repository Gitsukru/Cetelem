/**
 * 📅 Utilitaires de gestion des dates
 *
 * Regroupe toutes les fonctions de manipulation de dates
 * pour éviter les duplications de code (DRY principle)
 */

const DateUtils = {
  /**
   * Obtenir le début de la semaine (lundi)
   * @param {Date} date - Date de référence
   * @returns {Date} Date du début de semaine
   */
  getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Lundi = début
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  },

  /**
   * Obtenir la fin de la semaine (dimanche)
   * @param {Date} date - Date de référence
   * @returns {Date} Date de fin de semaine
   */
  getWeekEnd(date) {
    const weekStart = this.getWeekStart(date);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    return weekEnd;
  },

  /**
   * Obtenir le début du mois
   * @param {Date} date - Date de référence
   * @returns {Date} Premier jour du mois
   */
  getMonthStart(date) {
    const d = new Date(date.getFullYear(), date.getMonth(), 1);
    d.setHours(0, 0, 0, 0);
    return d;
  },

  /**
   * Obtenir la fin du mois
   * @param {Date} date - Date de référence
   * @returns {Date} Dernier jour du mois
   */
  getMonthEnd(date) {
    const d = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    d.setHours(23, 59, 59, 999);
    return d;
  },

  /**
   * Obtenir le début de l'année
   * @param {Date} date - Date de référence
   * @returns {Date} Premier jour de l'année
   */
  getYearStart(date) {
    const d = new Date(date.getFullYear(), 0, 1);
    d.setHours(0, 0, 0, 0);
    return d;
  },

  /**
   * Obtenir la fin de l'année
   * @param {Date} date - Date de référence
   * @returns {Date} Dernier jour de l'année
   */
  getYearEnd(date) {
    const d = new Date(date.getFullYear(), 11, 31);
    d.setHours(23, 59, 59, 999);
    return d;
  },

  /**
   * Formater une date en string lisible (DD/MM/YYYY)
   * @param {Date} date - Date à formater
   * @param {string} locale - Locale pour formatage (défaut: 'tr-TR')
   * @returns {string} Date formatée
   */
  formatDate(date, locale = 'tr-TR') {
    return date.toLocaleDateString(locale);
  },

  /**
   * Formater une date et heure (DD/MM/YYYY HH:MM)
   * @param {Date} date - Date à formater
   * @param {string} locale - Locale pour formatage (défaut: 'tr-TR')
   * @returns {string} Date et heure formatées
   */
  formatDateTime(date, locale = 'tr-TR') {
    return date.toLocaleString(locale);
  },

  /**
   * Vérifier si deux dates sont le même jour
   * @param {Date} date1 - Première date
   * @param {Date} date2 - Deuxième date
   * @returns {boolean} true si même jour
   */
  isSameDay(date1, date2) {
    return date1.toDateString() === date2.toDateString();
  },

  /**
   * Vérifier si deux dates sont dans la même semaine
   * @param {Date} date1 - Première date
   * @param {Date} date2 - Deuxième date
   * @returns {boolean} true si même semaine
   */
  isSameWeek(date1, date2) {
    const week1Start = this.getWeekStart(date1);
    const week2Start = this.getWeekStart(date2);
    return week1Start.getTime() === week2Start.getTime();
  },

  /**
   * Vérifier si deux dates sont dans le même mois
   * @param {Date} date1 - Première date
   * @param {Date} date2 - Deuxième date
   * @returns {boolean} true si même mois
   */
  isSameMonth(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth();
  },

  /**
   * Vérifier si deux dates sont dans la même année
   * @param {Date} date1 - Première date
   * @param {Date} date2 - Deuxième date
   * @returns {boolean} true si même année
   */
  isSameYear(date1, date2) {
    return date1.getFullYear() === date2.getFullYear();
  },

  /**
   * Obtenir le nombre de jours entre deux dates
   * @param {Date} date1 - Date de début
   * @param {Date} date2 - Date de fin
   * @returns {number} Nombre de jours
   */
  getDaysBetween(date1, date2) {
    const oneDay = 24 * 60 * 60 * 1000;
    const diffMs = Math.abs(date2.getTime() - date1.getTime());
    return Math.floor(diffMs / oneDay);
  },

  /**
   * Ajouter des jours à une date
   * @param {Date} date - Date de référence
   * @param {number} days - Nombre de jours à ajouter
   * @returns {Date} Nouvelle date
   */
  addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  },

  /**
   * Ajouter des mois à une date
   * @param {Date} date - Date de référence
   * @param {number} months - Nombre de mois à ajouter
   * @returns {Date} Nouvelle date
   */
  addMonths(date, months) {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
  },

  /**
   * Obtenir le nom du jour de la semaine
   * @param {Date} date - Date de référence
   * @param {string} locale - Locale pour formatage (défaut: 'tr-TR')
   * @returns {string} Nom du jour
   */
  getDayName(date, locale = 'tr-TR') {
    return date.toLocaleDateString(locale, { weekday: 'long' });
  },

  /**
   * Obtenir le nom du mois
   * @param {Date} date - Date de référence
   * @param {string} locale - Locale pour formatage (défaut: 'tr-TR')
   * @returns {string} Nom du mois
   */
  getMonthName(date, locale = 'tr-TR') {
    return date.toLocaleDateString(locale, { month: 'long' });
  },

  /**
   * Formater une durée relative (ex: "il y a 5 minutes")
   * @param {Date} date - Date passée
   * @returns {string} Durée relative formatée
   */
  getRelativeTime(date) {
    const now = new Date();
    const diffSeconds = Math.floor((now - date) / 1000);

    if (diffSeconds < 60) {
      return 'birkaç saniye önce';
    }

    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) {
      return `${diffMinutes} dakika önce`;
    }

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) {
      return `${diffHours} saat önce`;
    }

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) {
      return `${diffDays} gün önce`;
    }

    const diffWeeks = Math.floor(diffDays / 7);
    if (diffWeeks < 4) {
      return `${diffWeeks} hafta önce`;
    }

    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) {
      return `${diffMonths} ay önce`;
    }

    const diffYears = Math.floor(diffDays / 365);
    return `${diffYears} yıl önce`;
  },

  /**
   * Vérifier si une date est aujourd'hui
   * @param {Date} date - Date à vérifier
   * @returns {boolean} true si aujourd'hui
   */
  isToday(date) {
    return this.isSameDay(date, new Date());
  },

  /**
   * Vérifier si une date est cette semaine
   * @param {Date} date - Date à vérifier
   * @returns {boolean} true si cette semaine
   */
  isThisWeek(date) {
    return this.isSameWeek(date, new Date());
  },

  /**
   * Vérifier si une date est ce mois
   * @param {Date} date - Date à vérifier
   * @returns {boolean} true si ce mois
   */
  isThisMonth(date) {
    return this.isSameMonth(date, new Date());
  },

  /**
   * Vérifier si une date est cette année
   * @param {Date} date - Date à vérifier
   * @returns {boolean} true si cette année
   */
  isThisYear(date) {
    return this.isSameYear(date, new Date());
  }
};

// Export pour utilisation dans modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DateUtils;
}

// Export pour utilisation dans navigateur
if (typeof window !== 'undefined') {
  window.DateUtils = DateUtils;
}
