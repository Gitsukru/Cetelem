// 🔒 UTILITAIRE DE SANITISATION XSS
// Protection contre les injections XSS (Cross-Site Scripting)

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
 * Remplace innerHTML de manière sécurisée en séparant texte et structure
 * @param {HTMLElement} container - Élément conteneur
 * @param {string} htmlString - HTML à insérer (sera parsé de manière sécurisée)
 * @param {Array<string>} userInputs - Tableau des inputs utilisateur à échapper
 * @returns {void}
 */
function setInnerHTMLSafe(container, htmlString, userInputs = []) {
  // Échapper tous les inputs utilisateur
  let safeHTML = htmlString;
  userInputs.forEach(input => {
    // Remplacer les occurrences non échappées par des versions échappées
    const escaped = escapeHtml(input);
    safeHTML = safeHTML.replace(new RegExp(input, 'g'), escaped);
  });

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
    html,
    createSecureElement,
    setInnerHTMLSafe,
    buildSecureDOM,
    sanitizeCategoryName
  };
}

// Export global pour utilisation dans les scripts
window.escapeHtml = escapeHtml;
window.safeHTML = html; // Template tag global
