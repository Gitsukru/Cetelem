/**
 * 🛡️ Validateurs de données utilisateur
 * Prévention XSS, injection, et données invalides
 */

const Validators = {
  /**
   * Valider un nom de catégorie
   * @param {string} name
   * @returns {Object} { valid: boolean, error: string }
   */
  validateCategoryName(name) {
    if (!name || typeof name !== 'string') {
      return { valid: false, error: 'Le nom est requis' }
    }

    const trimmed = name.trim()

    if (trimmed.length === 0) {
      return { valid: false, error: 'Le nom ne peut pas être vide' }
    }

    if (trimmed.length > 50) {
      return { valid: false, error: 'Le nom est trop long (max 50 caractères)' }
    }

    // Interdire caractères dangereux
    const dangerousChars = /[<>{}[\]]/
    if (dangerousChars.test(trimmed)) {
      return { valid: false, error: 'Caractères non autorisés: < > { } [ ]' }
    }

    return { valid: true, value: trimmed }
  },

  /**
   * Valider un nom de groupe
   * @param {string} name
   * @returns {Object}
   */
  validateGroupName(name) {
    if (!name || typeof name !== 'string') {
      return { valid: false, error: 'Le nom du groupe est requis' }
    }

    const trimmed = name.trim()

    if (trimmed.length === 0) {
      return { valid: false, error: 'Le nom ne peut pas être vide' }
    }

    if (trimmed.length > 30) {
      return { valid: false, error: 'Le nom est trop long (max 30 caractères)' }
    }

    const dangerousChars = /[<>{}[\]]/
    if (dangerousChars.test(trimmed)) {
      return { valid: false, error: 'Caractères non autorisés' }
    }

    return { valid: true, value: trimmed }
  },

  /**
   * Valider un nom de participant
   * @param {string} name
   * @returns {Object}
   */
  validateParticipantName(name) {
    if (!name || typeof name !== 'string') {
      return { valid: false, error: 'Le nom est requis' }
    }

    const trimmed = name.trim()

    if (trimmed.length < 2) {
      return { valid: false, error: 'Le nom doit contenir au moins 2 caractères' }
    }

    if (trimmed.length > 20) {
      return { valid: false, error: 'Le nom est trop long (max 20 caractères)' }
    }

    const dangerousChars = /[<>{}[\]]/
    if (dangerousChars.test(trimmed)) {
      return { valid: false, error: 'Caractères non autorisés' }
    }

    return { valid: true, value: trimmed }
  },

  /**
   * Valider un code de groupe
   * @param {string} code
   * @returns {Object}
   */
  validateGroupCode(code) {
    if (!code || typeof code !== 'string') {
      return { valid: false, error: 'Le code est requis' }
    }

    const trimmed = code.trim().toUpperCase()

    if (trimmed.length !== 6) {
      return { valid: false, error: 'Le code doit contenir 6 caractères' }
    }

    // Seulement lettres et chiffres
    const validPattern = /^[A-Z0-9]{6}$/
    if (!validPattern.test(trimmed)) {
      return { valid: false, error: 'Code invalide (lettres et chiffres uniquement)' }
    }

    return { valid: true, value: trimmed }
  },

  /**
   * Valider une note (texte libre mais sécurisé)
   * @param {string} note
   * @returns {Object}
   */
  validateNote(note) {
    if (!note || typeof note !== 'string') {
      return { valid: true, value: '' }
    }

    const trimmed = note.trim()

    if (trimmed.length > 500) {
      return { valid: false, error: 'La note est trop longue (max 500 caractères)' }
    }

    // Pas de validation stricte pour les notes (texte libre)
    // Mais nettoyer les balises HTML pour éviter XSS
    const sanitized = this.sanitizeHTML(trimmed)

    return { valid: true, value: sanitized }
  },

  /**
   * Nettoyer HTML pour éviter XSS
   * @param {string} text
   * @returns {string}
   */
  sanitizeHTML(text) {
    if (!text) return ''

    // Créer un élément temporaire
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  },

  /**
   * Valider un nombre (compteur)
   * @param {any} value
   * @returns {Object}
   */
  validateCounter(value) {
    const num = parseInt(value, 10)

    if (isNaN(num)) {
      return { valid: false, error: 'Valeur invalide' }
    }

    if (num < 0) {
      return { valid: false, error: 'Le compteur ne peut pas être négatif' }
    }

    if (num > 1000000) {
      return { valid: false, error: 'Valeur trop élevée (max 1,000,000)' }
    }

    return { valid: true, value: num }
  },

  /**
   * Valider une date
   * @param {string} dateString
   * @returns {Object}
   */
  validateDate(dateString) {
    if (!dateString) {
      return { valid: false, error: 'Date requise' }
    }

    const date = new Date(dateString)

    if (isNaN(date.getTime())) {
      return { valid: false, error: 'Date invalide' }
    }

    // Pas de dates dans le futur
    if (date > new Date()) {
      return { valid: false, error: 'La date ne peut pas être dans le futur' }
    }

    // Pas de dates trop anciennes (avant 2020)
    if (date < new Date('2020-01-01')) {
      return { valid: false, error: 'Date trop ancienne' }
    }

    return { valid: true, value: date }
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Validators
}
