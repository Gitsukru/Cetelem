/**
 * Tests pour src/utils/error-handler.js
 */

// Mock window AVANT d'importer ErrorHandler
global.window = {
  addEventListener: jest.fn(),
  location: { href: 'http://localhost' }
};

global.navigator = { userAgent: 'Jest Test Runner' };
global.localStorage = {
  storage: {},
  setItem(key, value) {
    this.storage[key] = value;
  },
  getItem(key) {
    return this.storage[key] || null;
  },
  removeItem(key) {
    delete this.storage[key];
  }
};

global.console = { ...console, error: jest.fn(), log: jest.fn() };

const ErrorHandler = require('../src/utils/error-handler.js');

describe('ErrorHandler', () => {
  let errorHandler;

  beforeEach(() => {
    // Réinitialiser les mocks
    jest.clearAllMocks();
    localStorage.storage = {};

    // Create new instance
    errorHandler = new ErrorHandler();
  });

  afterEach(() => {
    errorHandler.clearErrors();
  });

  describe('Initialization', () => {
    test('devrait initialiser avec un tableau vide d\'erreurs', () => {
      expect(errorHandler.errors).toEqual([]);
    });

    test('devrait définir maxErrors à 50', () => {
      expect(errorHandler.maxErrors).toBe(50);
    });

    test('devrait enregistrer les listeners d\'événements', () => {
      expect(window.addEventListener).toHaveBeenCalledWith('error', expect.any(Function));
      expect(window.addEventListener).toHaveBeenCalledWith('unhandledrejection', expect.any(Function));
    });
  });

  describe('logError', () => {
    test('devrait ajouter une erreur à la liste', () => {
      errorHandler.logError({
        type: 'TestError',
        message: 'Test error message'
      });

      expect(errorHandler.errors.length).toBe(1);
      expect(errorHandler.errors[0].type).toBe('TestError');
      expect(errorHandler.errors[0].message).toBe('Test error message');
    });

    test('devrait ajouter timestamp et métadonnées', () => {
      errorHandler.logError({
        type: 'TestError',
        message: 'Test'
      });

      const error = errorHandler.errors[0];
      expect(error.timestamp).toBeDefined();
      expect(error.userAgent).toBe('Jest Test Runner');
      expect(error.url).toBe('http://localhost');
    });

    test('devrait sauvegarder dans localStorage', () => {
      errorHandler.logError({
        type: 'TestError',
        message: 'Test'
      });

      const stored = JSON.parse(localStorage.getItem('app_errors'));
      expect(stored).toHaveLength(1);
      expect(stored[0].type).toBe('TestError');
    });

    test('devrait limiter à maxErrors', () => {
      // Ajouter 51 erreurs
      for (let i = 0; i < 51; i++) {
        errorHandler.logError({
          type: 'TestError',
          message: `Error ${i}`
        });
      }

      expect(errorHandler.errors.length).toBe(50);
      // La première erreur devrait avoir été supprimée
      expect(errorHandler.errors[0].message).toBe('Error 1');
    });

    test('devrait logger en console', () => {
      errorHandler.logError({
        type: 'TestError',
        message: 'Test'
      });

      expect(console.error).toHaveBeenCalledWith(
        '🔴 Erreur capturée:',
        expect.objectContaining({
          type: 'TestError',
          message: 'Test'
        })
      );
    });
  });

  describe('isCriticalError', () => {
    test('devrait identifier QuotaExceededError comme critique', () => {
      const error = { message: 'QuotaExceededError: Storage full' };
      expect(errorHandler.isCriticalError(error)).toBe(true);
    });

    test('devrait identifier Failed to fetch comme critique', () => {
      const error = { message: 'Failed to fetch data' };
      expect(errorHandler.isCriticalError(error)).toBe(true);
    });

    test('devrait identifier Network request failed comme critique', () => {
      const error = { message: 'Network request failed' };
      expect(errorHandler.isCriticalError(error)).toBe(true);
    });

    test('devrait identifier Database error comme critique', () => {
      const error = { message: 'Database error occurred' };
      expect(errorHandler.isCriticalError(error)).toBe(true);
    });

    test('ne devrait pas identifier une erreur normale comme critique', () => {
      const error = { message: 'Unexpected token' };
      expect(errorHandler.isCriticalError(error)).toBe(false);
    });

    test('devrait gérer les erreurs sans message', () => {
      const error = { type: 'UnknownError' };
      expect(errorHandler.isCriticalError(error)).toBe(false);
    });
  });

  describe('getErrors', () => {
    test('devrait retourner toutes les erreurs', () => {
      errorHandler.logError({ type: 'Error1', message: 'Test 1' });
      errorHandler.logError({ type: 'Error2', message: 'Test 2' });

      const errors = errorHandler.getErrors();
      expect(errors).toHaveLength(2);
      expect(errors[0].type).toBe('Error1');
      expect(errors[1].type).toBe('Error2');
    });

    test('devrait retourner un tableau vide si aucune erreur', () => {
      expect(errorHandler.getErrors()).toEqual([]);
    });
  });

  describe('clearErrors', () => {
    test('devrait effacer toutes les erreurs', () => {
      errorHandler.logError({ type: 'Error1', message: 'Test' });
      errorHandler.logError({ type: 'Error2', message: 'Test' });

      errorHandler.clearErrors();

      expect(errorHandler.errors).toEqual([]);
    });

    test('devrait supprimer les erreurs de localStorage', () => {
      errorHandler.logError({ type: 'Error1', message: 'Test' });

      expect(localStorage.getItem('app_errors')).not.toBeNull();

      errorHandler.clearErrors();

      expect(localStorage.getItem('app_errors')).toBeNull();
    });
  });

  describe('exportErrors', () => {
    test('devrait exporter les erreurs en JSON', () => {
      errorHandler.logError({ type: 'Error1', message: 'Test 1' });
      errorHandler.logError({ type: 'Error2', message: 'Test 2' });

      const exported = errorHandler.exportErrors();
      const parsed = JSON.parse(exported);

      expect(parsed).toHaveLength(2);
      expect(parsed[0].type).toBe('Error1');
      expect(parsed[1].type).toBe('Error2');
    });

    test('devrait retourner un tableau JSON vide si aucune erreur', () => {
      const exported = errorHandler.exportErrors();
      expect(exported).toBe('[]');
    });

    test('devrait formatter le JSON avec indentation', () => {
      errorHandler.logError({ type: 'Error1', message: 'Test' });

      const exported = errorHandler.exportErrors();

      // JSON.stringify avec null, 2 ajoute une indentation
      expect(exported).toContain('\n');
      expect(exported).toContain('  ');
    });
  });

  describe('Edge Cases', () => {
    test('devrait gérer localStorage plein', () => {
      // Mock localStorage qui throw
      localStorage.setItem = jest.fn(() => {
        throw new Error('QuotaExceededError');
      });

      // Ne devrait pas crasher
      expect(() => {
        errorHandler.logError({ type: 'Test', message: 'Test' });
      }).not.toThrow();
    });

    test('devrait gérer les erreurs sans type', () => {
      errorHandler.logError({ message: 'Test without type' });

      expect(errorHandler.errors[0].message).toBe('Test without type');
    });

    test('devrait gérer les erreurs avec stack trace', () => {
      errorHandler.logError({
        type: 'Error',
        message: 'Test',
        stack: 'Error: Test\\n    at Object.<anonymous> (test.js:1:1)'
      });

      expect(errorHandler.errors[0].stack).toContain('test.js:1:1');
    });
  });
});
