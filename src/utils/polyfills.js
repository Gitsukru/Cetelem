/**
 * 🌐 Polyfills pour compatibilité navigateurs anciens
 * Cible : iOS 11-13, Android 7-8, Safari 11-13, Chrome 60-70
 *
 * Features couvertes :
 * - Promise.allSettled
 * - Promise.finally
 * - Optional chaining (?.) - via Babel en production
 * - Object.fromEntries
 * - Array.prototype.flat
 * - Array.prototype.flatMap
 * - String.prototype.replaceAll
 * - Element.prototype.replaceChildren
 */

(function() {
  'use strict';

  // ============================================================================
  // 1. Promise.allSettled (iOS < 13, Chrome < 76)
  // ============================================================================
  if (!Promise.allSettled) {
    Promise.allSettled = function(promises) {
      return Promise.all(
        promises.map(promise =>
          Promise.resolve(promise)
            .then(value => ({ status: 'fulfilled', value }))
            .catch(reason => ({ status: 'rejected', reason }))
        )
      );
    };
    console.log('✅ Polyfill: Promise.allSettled');
  }

  // ============================================================================
  // 2. Promise.prototype.finally (iOS < 12.2, Chrome < 63)
  // ============================================================================
  if (!Promise.prototype.finally) {
    Promise.prototype.finally = function(onFinally) {
      return this.then(
        value => Promise.resolve(onFinally()).then(() => value),
        reason => Promise.resolve(onFinally()).then(() => { throw reason; })
      );
    };
    console.log('✅ Polyfill: Promise.prototype.finally');
  }

  // ============================================================================
  // 3. Object.fromEntries (iOS < 12.2, Chrome < 73)
  // ============================================================================
  if (!Object.fromEntries) {
    Object.fromEntries = function(entries) {
      const obj = {};
      for (const [key, value] of entries) {
        obj[key] = value;
      }
      return obj;
    };
    console.log('✅ Polyfill: Object.fromEntries');
  }

  // ============================================================================
  // 4. Array.prototype.flat (iOS < 12, Chrome < 69)
  // ============================================================================
  if (!Array.prototype.flat) {
    Array.prototype.flat = function(depth = 1) {
      const flatten = (arr, d) => {
        return d > 0
          ? arr.reduce((acc, val) =>
              acc.concat(Array.isArray(val) ? flatten(val, d - 1) : val),
            [])
          : arr.slice();
      };
      return flatten(this, depth);
    };
    console.log('✅ Polyfill: Array.prototype.flat');
  }

  // ============================================================================
  // 5. Array.prototype.flatMap (iOS < 12, Chrome < 69)
  // ============================================================================
  if (!Array.prototype.flatMap) {
    Array.prototype.flatMap = function(callback, thisArg) {
      return this.map(callback, thisArg).flat(1);
    };
    console.log('✅ Polyfill: Array.prototype.flatMap');
  }

  // ============================================================================
  // 6. String.prototype.replaceAll (iOS < 13.7, Chrome < 85)
  // ============================================================================
  if (!String.prototype.replaceAll) {
    String.prototype.replaceAll = function(search, replace) {
      if (search instanceof RegExp) {
        if (!search.global) {
          throw new TypeError('replaceAll requires a global regex');
        }
        return this.replace(search, replace);
      }

      // Échapper les caractères spéciaux regex
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return this.replace(new RegExp(escaped, 'g'), replace);
    };
    console.log('✅ Polyfill: String.prototype.replaceAll');
  }

  // ============================================================================
  // 7. Element.prototype.replaceChildren (iOS < 14, Chrome < 86)
  // ============================================================================
  if (!Element.prototype.replaceChildren) {
    Element.prototype.replaceChildren = function(...nodes) {
      while (this.lastChild) {
        this.removeChild(this.lastChild);
      }
      if (nodes.length) {
        this.append(...nodes);
      }
    };
    console.log('✅ Polyfill: Element.prototype.replaceChildren');
  }

  // ============================================================================
  // 8. Element.prototype.append (iOS < 10, Chrome < 54)
  // ============================================================================
  if (!Element.prototype.append) {
    Element.prototype.append = function(...nodes) {
      nodes.forEach(node => {
        if (typeof node === 'string') {
          this.appendChild(document.createTextNode(node));
        } else {
          this.appendChild(node);
        }
      });
    };
    console.log('✅ Polyfill: Element.prototype.append');
  }

  // ============================================================================
  // 9. Element.prototype.prepend (iOS < 10, Chrome < 54)
  // ============================================================================
  if (!Element.prototype.prepend) {
    Element.prototype.prepend = function(...nodes) {
      const docFragment = document.createDocumentFragment();
      nodes.forEach(node => {
        if (typeof node === 'string') {
          docFragment.appendChild(document.createTextNode(node));
        } else {
          docFragment.appendChild(node);
        }
      });
      this.insertBefore(docFragment, this.firstChild);
    };
    console.log('✅ Polyfill: Element.prototype.prepend');
  }

  // ============================================================================
  // 10. Object.entries (iOS < 10.3, Chrome < 54)
  // ============================================================================
  if (!Object.entries) {
    Object.entries = function(obj) {
      const entries = [];
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          entries.push([key, obj[key]]);
        }
      }
      return entries;
    };
    console.log('✅ Polyfill: Object.entries');
  }

  // ============================================================================
  // 11. Object.values (iOS < 10.3, Chrome < 54)
  // ============================================================================
  if (!Object.values) {
    Object.values = function(obj) {
      const values = [];
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          values.push(obj[key]);
        }
      }
      return values;
    };
    console.log('✅ Polyfill: Object.values');
  }

  // ============================================================================
  // 12. Array.prototype.includes (iOS < 9, Chrome < 47)
  // ============================================================================
  if (!Array.prototype.includes) {
    Array.prototype.includes = function(searchElement, fromIndex) {
      const O = Object(this);
      const len = parseInt(O.length, 10) || 0;
      if (len === 0) return false;

      const n = parseInt(fromIndex, 10) || 0;
      let k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);

      while (k < len) {
        if (O[k] === searchElement || (Number.isNaN(O[k]) && Number.isNaN(searchElement))) {
          return true;
        }
        k++;
      }
      return false;
    };
    console.log('✅ Polyfill: Array.prototype.includes');
  }

  // ============================================================================
  // 13. String.prototype.includes (iOS < 9, Chrome < 41)
  // ============================================================================
  if (!String.prototype.includes) {
    String.prototype.includes = function(search, start) {
      if (typeof start !== 'number') {
        start = 0;
      }

      if (start + search.length > this.length) {
        return false;
      }
      return this.indexOf(search, start) !== -1;
    };
    console.log('✅ Polyfill: String.prototype.includes');
  }

  // ============================================================================
  // 14. Number.isNaN (iOS < 9, Chrome < 25)
  // ============================================================================
  if (!Number.isNaN) {
    Number.isNaN = function(value) {
      return typeof value === 'number' && isNaN(value);
    };
    console.log('✅ Polyfill: Number.isNaN');
  }

  // ============================================================================
  // 15. Number.isFinite (iOS < 9, Chrome < 19)
  // ============================================================================
  if (!Number.isFinite) {
    Number.isFinite = function(value) {
      return typeof value === 'number' && isFinite(value);
    };
    console.log('✅ Polyfill: Number.isFinite');
  }

  // ============================================================================
  // 16. Array.from (iOS < 9, Chrome < 45)
  // ============================================================================
  if (!Array.from) {
    Array.from = function(arrayLike, mapFn, thisArg) {
      const C = this;
      const items = Object(arrayLike);

      if (arrayLike == null) {
        throw new TypeError('Array.from requires an array-like object');
      }

      const len = items.length >>> 0;
      const A = typeof C === 'function' ? new C(len) : new Array(len);

      let k = 0;
      while (k < len) {
        const kValue = items[k];
        if (mapFn) {
          A[k] = mapFn.call(thisArg, kValue, k);
        } else {
          A[k] = kValue;
        }
        k++;
      }

      A.length = len;
      return A;
    };
    console.log('✅ Polyfill: Array.from');
  }

  // ============================================================================
  // 17. CustomEvent (IE 9-11)
  // ============================================================================
  if (typeof window.CustomEvent !== 'function') {
    function CustomEvent(event, params) {
      params = params || { bubbles: false, cancelable: false, detail: null };
      const evt = document.createEvent('CustomEvent');
      evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
      return evt;
    }
    window.CustomEvent = CustomEvent;
    console.log('✅ Polyfill: CustomEvent');
  }

  // ============================================================================
  // 18. Performance.now (iOS < 9, Android < 4.4)
  // ============================================================================
  if (!window.performance || !window.performance.now) {
    Date.now = Date.now || function() { return new Date().getTime(); };

    if (!window.performance) {
      window.performance = {};
    }

    window.performance.now = function() {
      return Date.now() - (window.performance.timing?.navigationStart || 0);
    };
    console.log('✅ Polyfill: Performance.now');
  }

  // ============================================================================
  // 19. RequestAnimationFrame (iOS < 6, Android < 4.4)
  // ============================================================================
  if (!window.requestAnimationFrame) {
    let lastTime = 0;
    window.requestAnimationFrame = function(callback) {
      const currTime = new Date().getTime();
      const timeToCall = Math.max(0, 16 - (currTime - lastTime));
      const id = window.setTimeout(function() {
        callback(currTime + timeToCall);
      }, timeToCall);
      lastTime = currTime + timeToCall;
      return id;
    };
    console.log('✅ Polyfill: requestAnimationFrame');
  }

  if (!window.cancelAnimationFrame) {
    window.cancelAnimationFrame = function(id) {
      clearTimeout(id);
    };
    console.log('✅ Polyfill: cancelAnimationFrame');
  }

  // ============================================================================
  // 20. Fetch API polyfill check (iOS < 10.3, Android < 5)
  // ============================================================================
  if (!window.fetch) {
    console.warn('⚠️ Fetch API non disponible. Recommandé: https://github.com/github/fetch');
    console.warn('   Ajoutez: <script src="https://cdn.jsdelivr.net/npm/whatwg-fetch@3.6.2/dist/fetch.umd.js"></script>');
  }

  // ============================================================================
  // 21. IntersectionObserver check (iOS < 12.2, Android < 7)
  // ============================================================================
  if (!window.IntersectionObserver) {
    console.warn('⚠️ IntersectionObserver non disponible.');
    console.warn('   Recommandé: https://github.com/w3c/IntersectionObserver/tree/main/polyfill');
  }

  // ============================================================================
  // Résumé des polyfills chargés
  // ============================================================================
  console.log('%c🌐 Polyfills chargés avec succès', 'color: #4CAF50; font-weight: bold;');
  console.log('Compatibilité étendue à iOS 9+, Android 4.4+, Chrome 45+, Safari 9+');

})();

/**
 * ⚠️ NOTES IMPORTANTES
 *
 * 1. OPTIONAL CHAINING (?.) et NULLISH COALESCING (??)
 *    Ces features nécessitent une transpilation avec Babel/TypeScript.
 *    Les polyfills ne peuvent pas les supporter.
 *
 *    Solution : Utiliser Vite + @vitejs/plugin-legacy
 *    npm install -D vite @vitejs/plugin-legacy terser
 *
 *    // vite.config.js
 *    import legacy from '@vitejs/plugin-legacy'
 *    export default {
 *      plugins: [
 *        legacy({
 *          targets: ['iOS >= 11', 'Android >= 7']
 *        })
 *      ]
 *    }
 *
 * 2. ASYNC/AWAIT
 *    Nécessite un polyfill pour regenerator-runtime sur iOS < 10
 *    Solution : Le plugin legacy de Vite l'inclut automatiquement
 *
 * 3. WEB AUDIO API
 *    Déjà présent sur iOS 6+, Android 5+
 *    Pas de polyfill nécessaire
 *
 * 4. SERVICE WORKER
 *    Supporté sur iOS 11.3+, Android 5+
 *    Pas de polyfill possible (feature natif)
 *    Déjà géré avec try/catch dans sw.js
 */
