/**
 * Désactive console.log en production
 *
 * Ce fichier doit être chargé EN PREMIER dans index.html et admin.html
 * Il override les méthodes console.* en production (hors localhost)
 */

(function() {
  'use strict';

  // Détecter si on est en production
  const IS_PRODUCTION = window.location.hostname !== 'localhost'
                     && window.location.hostname !== '127.0.0.1'
                     && !window.location.hostname.includes('192.168')
                     && !window.location.port; // Pas de port = production

  if (IS_PRODUCTION) {
    // Sauvegarder les méthodes originales pour error
    const originalError = console.error;
    const originalWarn = console.warn;

    // Override toutes les méthodes sauf error
    console.log = function() {};
    console.info = function() {};
    console.debug = function() {};
    console.trace = function() {};
    console.table = function() {};
    console.group = function() {};
    console.groupEnd = function() {};
    console.groupCollapsed = function() {};
    console.time = function() {};
    console.timeEnd = function() {};
    console.count = function() {};
    console.clear = function() {};

    // Garder error et warn mais les limiter
    const errorCount = { count: 0, max: 50 };

    console.error = function(...args) {
      if (errorCount.count < errorCount.max) {
        originalError.apply(console, args);
        errorCount.count++;
      }
    };

    console.warn = function(...args) {
      if (errorCount.count < errorCount.max) {
        originalWarn.apply(console, args);
        errorCount.count++;
      }
    };

    // Marker pour debugging
    console.log = function() {
      // Production: console.log désactivé
    };

    console.log.disabled = true;
  }
})();
