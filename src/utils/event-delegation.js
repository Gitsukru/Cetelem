/**
 * Event Delegation System
 * Replaces inline onclick handlers with data-action attributes
 * Enables CSP compliance by removing 'unsafe-inline' requirement
 */

(function() {
  'use strict';

  // Registry of action handlers
  const actionHandlers = {};

  /**
   * Register an action handler
   * @param {string} name - Action name
   * @param {Function} handler - Handler function
   */
  function registerAction(name, handler) {
    actionHandlers[name] = handler;
  }

  /**
   * Parse parameters from data attributes
   * Supports: data-param="value" or data-params='["a","b"]' (JSON array)
   */
  function parseParams(element) {
    const params = [];

    // Check for JSON params array
    const jsonParams = element.dataset.params;
    if (jsonParams) {
      try {
        return JSON.parse(jsonParams);
      } catch (e) {
        console.warn('Invalid JSON params:', jsonParams);
      }
    }

    // Check for individual data-param-* attributes
    for (const key in element.dataset) {
      if (key.startsWith('param')) {
        const index = key.replace('param', '');
        if (index === '' || index === '0') {
          params[0] = element.dataset[key];
        } else {
          params[parseInt(index)] = element.dataset[key];
        }
      }
    }

    // Single param shorthand
    if (element.dataset.param !== undefined) {
      return [element.dataset.param];
    }

    return params.length > 0 ? params : [];
  }

  /**
   * Handle click events via delegation
   */
  function handleClick(event) {
    const target = event.target.closest('[data-action]');
    if (!target) return;

    const action = target.dataset.action;
    if (!action) return;

    // Check if action contains multiple calls (e.g., "func1; func2")
    const actions = action.split(';').map(a => a.trim()).filter(a => a);

    for (const actionCall of actions) {
      executeAction(actionCall, target, event);
    }
  }

  /**
   * Execute a single action
   */
  function executeAction(actionCall, element, event) {
    // Parse action name and inline params: "funcName('param1', 'param2')" or "Obj.method('param')"
    const match = actionCall.match(/^([\w.]+)(?:\((.*)\))?$/);
    if (!match) {
      console.warn('Invalid action format:', actionCall);
      return;
    }

    const actionPath = match[1];
    let params = [];

    // If params provided inline in data-action
    if (match[2]) {
      try {
        // Parse inline params like: 'param1', 'param2', event
        const paramStr = match[2].trim();
        if (paramStr === 'this') {
          params = [element];
        } else if (paramStr === 'event') {
          params = [event];
        } else if (paramStr.includes('event')) {
          // Handle mixed params like "'counter', event"
          params = parseInlineParams(paramStr, element, event);
        } else {
          params = parseInlineParams(paramStr, element, event);
        }
      } catch (e) {
        console.warn('Error parsing inline params:', match[2], e);
      }
    } else {
      // Get params from data attributes
      params = parseParams(element);
    }

    // Try registered handler first
    if (actionHandlers[actionPath]) {
      actionHandlers[actionPath].apply(null, params);
      return;
    }

    // Resolve path like "VersionListener.applyUpdate" to window.VersionListener.applyUpdate
    const func = resolvePath(actionPath);
    if (typeof func === 'function') {
      func.apply(null, params);
      return;
    }

    console.warn('Unknown action:', actionPath);
  }

  /**
   * Resolve a dotted path to a function (e.g., "VersionListener.applyUpdate")
   */
  function resolvePath(path) {
    const parts = path.split('.');
    let obj = window;
    for (const part of parts) {
      if (obj && typeof obj === 'object') {
        obj = obj[part];
      } else {
        return undefined;
      }
    }
    return obj;
  }

  /**
   * Parse inline parameters string
   */
  function parseInlineParams(paramStr, element, event) {
    const params = [];
    // Simple parser for common patterns
    const parts = paramStr.split(',').map(p => p.trim());

    for (const part of parts) {
      if (part === 'this') {
        params.push(element);
      } else if (part === 'event') {
        params.push(event);
      } else if (part.startsWith("'") && part.endsWith("'")) {
        params.push(part.slice(1, -1));
      } else if (part.startsWith('"') && part.endsWith('"')) {
        params.push(part.slice(1, -1));
      } else if (!isNaN(part)) {
        params.push(Number(part));
      } else if (part === 'true') {
        params.push(true);
      } else if (part === 'false') {
        params.push(false);
      } else {
        params.push(part);
      }
    }

    return params;
  }

  /**
   * Handle change events via delegation
   */
  function handleChange(event) {
    const target = event.target.closest('[data-onchange]');
    if (!target) return;

    const action = target.dataset.onchange;
    if (!action) return;

    executeAction(action, target, event);
  }

  /**
   * Handle input events via delegation
   */
  function handleInput(event) {
    const target = event.target.closest('[data-oninput]');
    if (!target) return;

    const action = target.dataset.oninput;
    if (!action) return;

    executeAction(action, target, event);
  }

  /**
   * Handle submit events via delegation
   */
  function handleSubmit(event) {
    const target = event.target.closest('[data-onsubmit]');
    if (!target) return;

    const action = target.dataset.onsubmit;
    if (!action) return;

    event.preventDefault();
    executeAction(action, target, event);
  }

  // Initialize event listeners
  function init() {
    document.addEventListener('click', handleClick, true);
    document.addEventListener('change', handleChange, true);
    document.addEventListener('input', handleInput, true);
    document.addEventListener('submit', handleSubmit, true);

    console.log('Event delegation system initialized');
  }

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose API
  window.EventDelegation = {
    registerAction,
    executeAction
  };

  // ========================================
  // GLOBAL HELPER FUNCTIONS (CSP Compliance)
  // ========================================

  /**
   * Close modal when clicking on overlay (if target is the overlay itself)
   */
  window.closeModalOnOverlay = function(event) {
    if (event.target === event.currentTarget || event.target.classList.contains('custom-modal-overlay')) {
      event.target.closest('.custom-modal-overlay')?.remove();
    }
  };

  /**
   * Close the closest modal overlay
   */
  window.closeModal = function(event) {
    if (event && event.target) {
      event.target.closest('.custom-modal-overlay')?.remove();
    }
  };

  /**
   * Close modal by ID
   */
  window.closeModalById = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.remove();
  };

  /**
   * Stop event propagation helper
   */
  window.stopPropagation = function(event) {
    if (event) event.stopPropagation();
  };

  /**
   * Close the closest fixed position element (for notification dialogs)
   */
  window.closeFixedParent = function(event) {
    if (event && event.target) {
      const fixedParent = event.target.closest('div[style*="fixed"]');
      if (fixedParent) fixedParent.remove();
    }
  };

  /**
   * Release hatim unit with stopPropagation (wrapper for HatimManager)
   */
  window.releaseHatimUnit = function(participationId, unitNumber, event) {
    if (event) event.stopPropagation();
    if (typeof HatimManager !== 'undefined') {
      HatimManager.releaseUnit(participationId, unitNumber);
    }
  };

  /**
   * Toggle hatim unit selection (wrapper for HatimManager)
   */
  window.toggleHatimUnitSelection = function(unit, event) {
    if (typeof HatimManager !== 'undefined' && event && event.target) {
      const element = event.target.closest('.multi-claim-unit');
      HatimManager.toggleUnitSelection(unit, element);
    }
  };

  /**
   * Copy text to clipboard
   */
  window.copyToClipboard = function(text) {
    navigator.clipboard.writeText(text).then(() => {
      if (typeof showCustomAlert === 'function') {
        showCustomAlert('Kopyalandı!', 'success', 2000);
      }
    }).catch(err => {
      console.error('Clipboard copy failed:', err);
    });
  };

  /**
   * Close in-app notification (remove parent element)
   */
  window.closeInAppNotification = function(event) {
    if (event && event.target) {
      const notification = event.target.parentElement;
      if (notification) notification.remove();
    }
  };

  /**
   * Close version update banner (remove grandparent element)
   */
  window.closeVersionBanner = function(event) {
    if (event && event.target) {
      const banner = event.target.parentElement?.parentElement;
      if (banner) banner.remove();
    }
  };

  /**
   * Clear errors and close modal (for ErrorHandler)
   */
  window.clearErrorsAndClose = function(event) {
    if (typeof errorHandler !== 'undefined' && errorHandler.clearErrors) {
      errorHandler.clearErrors();
    }
    if (event && event.target) {
      event.target.closest('.custom-modal-overlay')?.remove();
    }
  };

  /**
   * Copy error report to clipboard
   */
  window.copyErrorReport = function() {
    if (typeof errorHandler !== 'undefined' && errorHandler.exportErrors) {
      navigator.clipboard.writeText(errorHandler.exportErrors()).then(() => {
        alert('Copié!');
      }).catch(err => {
        console.error('Clipboard copy failed:', err);
      });
    }
  };

  /**
   * Reload the current page
   */
  window.reloadPage = function() {
    window.location.reload();
  };

  /**
   * Close admin update banner
   */
  window.closeAdminUpdateBanner = function() {
    const banner = document.getElementById('adminUpdateBanner');
    if (banner) banner.remove();
  };
})();
