// 🔒 UTILITAIRE DE SANITISATION XSS
// Protection contre les injections XSS (Cross-Site Scripting)
// Utilise DOMPurify quand disponible, sinon fallback sur méthode native

/**
 * Vérifie si DOMPurify est disponible
 * @returns {boolean}
 */
function isDOMPurifyAvailable() {
  return typeof DOMPurify !== 'undefined' && DOMPurify.sanitize;
}

/**
 * Échappe le HTML pour empêcher les injections XSS
 * @param {string} text - Texte potentiellement dangereux
 * @returns {string} - Texte sécurisé (échappé)
 */
function escapeHtml(text) {
  if (text === null || text === undefined) return '';

  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Sanitise le HTML avec DOMPurify (méthode recommandée)
 * Permet de conserver du HTML structuré tout en supprimant les scripts malveillants
 * @param {string} dirtyHTML - HTML potentiellement dangereux
 * @param {Object} options - Options DOMPurify (optionnel)
 * @returns {string} - HTML nettoyé et sécurisé
 */
function purifyHTML(dirtyHTML, options = {}) {
  if (dirtyHTML === null || dirtyHTML === undefined) return '';

  // Utiliser DOMPurify si disponible
  if (isDOMPurifyAvailable()) {
    // Configuration par défaut sécurisée
    const defaultConfig = {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'span', 'p', 'br', 'div', 'ul', 'ol', 'li', 'a', 'img'],
      ALLOWED_ATTR: ['class', 'id', 'href', 'src', 'alt', 'title', 'data-action', 'data-category', 'data-id'],
      ALLOW_DATA_ATTR: true,
      FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
      ...options
    };

    return DOMPurify.sanitize(dirtyHTML, defaultConfig);
  }

  // Fallback: échapper tout le HTML
  console.warn('⚠️ DOMPurify non disponible, utilisation du fallback escapeHtml');
  return escapeHtml(dirtyHTML);
}

/**
 * Template tag pour créer du HTML sécurisé
 * Usage: html`<div>${unsafeUserData}</div>`
 * Toutes les interpolations ${} sont automatiquement échappées
 *
 * @param {Array} strings - Parties statiques du template
 * @param {...any} values - Valeurs à interpoler (seront échappées)
 * @returns {string} - HTML sécurisé
 */
function html(strings, ...values) {
  let result = strings[0];

  for (let i = 0; i < values.length; i++) {
    // Échapper chaque valeur
    const escaped = escapeHtml(String(values[i]));
    result += escaped + strings[i + 1];
  }

  return result;
}

/**
 * Crée un élément DOM sécurisé avec textContent au lieu de innerHTML
 * @param {string} tag - Type d'élément (div, p, span, etc.)
 * @param {string} text - Texte à afficher
 * @param {Object} attributes - Attributs optionnels {class: 'foo', id: 'bar'}
 * @returns {HTMLElement} - Élément DOM sécurisé
 */
function createSecureElement(tag, text, attributes = {}) {
  const element = document.createElement(tag);

  // Utiliser textContent au lieu de innerHTML (sécurisé)
  element.textContent = text;

  // Ajouter les attributs
  Object.keys(attributes).forEach(attr => {
    if (attr === 'class') {
      element.className = attributes[attr];
    } else if (attr === 'style') {
      // Pour style, créer un objet
      Object.assign(element.style, attributes[attr]);
    } else {
      element.setAttribute(attr, attributes[attr]);
    }
  });

  return element;
}

/**
 * Remplace innerHTML de manière sécurisée avec DOMPurify
 * @param {HTMLElement} container - Élément conteneur
 * @param {string} htmlString - HTML à insérer (sera sanitisé par DOMPurify)
 * @param {Object} options - Options DOMPurify (optionnel)
 * @returns {void}
 */
function setInnerHTMLSafe(container, htmlString, options = {}) {
  if (!container) return;

  // Utiliser DOMPurify pour nettoyer le HTML
  const safeHTML = purifyHTML(htmlString, options);
  container.innerHTML = safeHTML;
}

/**
 * Crée une structure DOM complexe de manière sécurisée
 * Exemple d'utilisation:
 *
 * const modal = buildSecureDOM({
 *   tag: 'div',
 *   className: 'modal',
 *   children: [
 *     { tag: 'h3', text: userInput },
 *     { tag: 'p', text: message }
 *   ]
 * });
 */
function buildSecureDOM(config) {
  const element = document.createElement(config.tag || 'div');

  // Ajouter la classe
  if (config.className) {
    element.className = config.className;
  }

  // Ajouter les attributs
  if (config.attributes) {
    Object.keys(config.attributes).forEach(attr => {
      element.setAttribute(attr, config.attributes[attr]);
    });
  }

  // Ajouter le texte (sécurisé)
  if (config.text) {
    element.textContent = config.text;
  }

  // Ajouter du HTML brut SEULEMENT si explicitement spécifié et sûr
  if (config.safeHTML) {
    element.innerHTML = config.safeHTML; // À utiliser SEULEMENT pour du HTML statique sûr
  }

  // Ajouter les enfants récursivement
  if (config.children) {
    config.children.forEach(child => {
      if (typeof child === 'string') {
        // Texte brut
        element.appendChild(document.createTextNode(child));
      } else {
        // Élément DOM
        element.appendChild(buildSecureDOM(child));
      }
    });
  }

  return element;
}

/**
 * Validation et sanitisation de noms de catégories
 * Empêche l'injection de caractères dangereux
 */
function sanitizeCategoryName(name) {
  if (!name || typeof name !== 'string') return '';

  // Enlever les caractères HTML dangereux
  let safe = name
    .replace(/</g, '')
    .replace(/>/g, '')
    .replace(/"/g, '')
    .replace(/'/g, '')
    .replace(/`/g, '')
    .replace(/=/g, '');

  // Limiter à 50 caractères
  return safe.substring(0, 50).trim();
}

// Exporter les fonctions
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    escapeHtml,
    purifyHTML,
    isDOMPurifyAvailable,
    html,
    createSecureElement,
    setInnerHTMLSafe,
    buildSecureDOM,
    sanitizeCategoryName
  };
}

// Export global pour utilisation dans les scripts
window.escapeHtml = escapeHtml;
window.purifyHTML = purifyHTML; // 🔒 Sanitisation avec DOMPurify
window.setInnerHTMLSafe = setInnerHTMLSafe; // 🔒 innerHTML sécurisé
window.safeHTML = html; // Template tag global

// Log de confirmation au chargement
if (isDOMPurifyAvailable()) {
  console.log('🔒 DOMPurify chargé - Protection XSS active');
} else {
  console.warn('⚠️ DOMPurify non disponible - Utilisation du fallback');
}
