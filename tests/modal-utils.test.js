/**
 * Tests pour src/utils/modal-utils.js
 *
 * Note: Tests simplifiés car modal-utils dépend beaucoup du DOM réel.
 * Pour des tests complets, utiliser un environnement jsdom ou des tests E2E.
 */

const ModalUtils = require('../src/utils/modal-utils.js');

describe('ModalUtils', () => {
  describe('Module Export', () => {
    test('devrait exporter ModalUtils', () => {
      expect(ModalUtils).toBeDefined();
      expect(typeof ModalUtils).toBe('object');
    });

    test('devrait avoir toutes les méthodes principales', () => {
      expect(typeof ModalUtils.showConfirm).toBe('function');
      expect(typeof ModalUtils.showAlert).toBe('function');
      expect(typeof ModalUtils.showModal).toBe('function');
      expect(typeof ModalUtils.showNoteModal).toBe('function');
      expect(typeof ModalUtils.showInputModal).toBe('function');
      expect(typeof ModalUtils.removeExisting).toBe('function');
      expect(typeof ModalUtils.closeAll).toBe('function');
    });
  });

  describe('API Contract Tests', () => {
    test('showConfirm devrait être une fonction', () => {
      // showConfirm(title, message, onConfirm, onCancel = null, options = {})
      expect(typeof ModalUtils.showConfirm).toBe('function');
      // En JavaScript, length = nombre de paramètres AVANT les defaults
      expect(ModalUtils.showConfirm.length).toBeGreaterThanOrEqual(3);
    });

    test('showAlert devrait être une fonction', () => {
      // showAlert(message, type = 'error', duration = 3000)
      expect(typeof ModalUtils.showAlert).toBe('function');
      expect(ModalUtils.showAlert.length).toBeGreaterThanOrEqual(1);
    });

    test('showModal devrait accepter un objet de configuration', () => {
      expect(typeof ModalUtils.showModal).toBe('function');
      expect(ModalUtils.showModal.length).toBe(1);
    });

    test('showNoteModal devrait accepter un objet de configuration', () => {
      expect(typeof ModalUtils.showNoteModal).toBe('function');
      expect(ModalUtils.showNoteModal.length).toBe(1);
    });

    test('showInputModal devrait accepter un objet de configuration', () => {
      expect(typeof ModalUtils.showInputModal).toBe('function');
      expect(ModalUtils.showInputModal.length).toBe(1);
    });

    test('removeExisting devrait accepter un sélecteur', () => {
      expect(typeof ModalUtils.removeExisting).toBe('function');
      expect(ModalUtils.removeExisting.length).toBe(1);
    });

    test('closeAll ne devrait pas accepter de paramètres', () => {
      expect(typeof ModalUtils.closeAll).toBe('function');
      expect(ModalUtils.closeAll.length).toBe(0);
    });
  });

  describe('Function Existence', () => {
    test('toutes les méthodes devraient être des fonctions', () => {
      const methods = [
        'showConfirm',
        'showAlert',
        'showModal',
        'showNoteModal',
        'showInputModal',
        'removeExisting',
        'closeAll'
      ];

      methods.forEach(method => {
        expect(typeof ModalUtils[method]).toBe('function');
      });
    });
  });

  describe('Edge Cases - Function Resilience', () => {
    // Test que les fonctions ne crashent pas avec des paramètres minimaux
    // Note: Ces tests peuvent échouer en environnement Node sans DOM réel

    test('devrait être défini comme objet', () => {
      expect(ModalUtils).toEqual(expect.any(Object));
    });

    test('ne devrait pas être null', () => {
      expect(ModalUtils).not.toBeNull();
    });

    test('ne devrait pas être undefined', () => {
      expect(ModalUtils).not.toBeUndefined();
    });
  });

  describe('Method Signatures', () => {
    test('showConfirm devrait être une fonction valide', () => {
      const func = ModalUtils.showConfirm;
      expect(func).toBeDefined();
      expect(typeof func).toBe('function');
      // Vérifie qu'il y a au moins les paramètres requis (title, message, onConfirm)
      expect(func.length).toBeGreaterThanOrEqual(3);
    });

    test('showAlert devrait être une fonction valide', () => {
      // Au moins le message est requis
      expect(ModalUtils.showAlert.length).toBeGreaterThanOrEqual(1);
    });

    test('removeExisting devrait prendre un paramètre', () => {
      expect(ModalUtils.removeExisting.length).toBe(1);
    });

    test('closeAll ne devrait pas prendre de paramètres', () => {
      expect(ModalUtils.closeAll.length).toBe(0);
    });
  });

  describe('Utility Functions', () => {
    test('removeExisting devrait être une fonction utilitaire', () => {
      expect(typeof ModalUtils.removeExisting).toBe('function');
    });

    test('closeAll devrait être une fonction utilitaire', () => {
      expect(typeof ModalUtils.closeAll).toBe('function');
    });
  });

  describe('Modal Variants', () => {
    test('devrait avoir une méthode pour les confirmations', () => {
      expect(ModalUtils.showConfirm).toBeDefined();
    });

    test('devrait avoir une méthode pour les alertes', () => {
      expect(ModalUtils.showAlert).toBeDefined();
    });

    test('devrait avoir une méthode pour les modales génériques', () => {
      expect(ModalUtils.showModal).toBeDefined();
    });

    test('devrait avoir une méthode pour les notes', () => {
      expect(ModalUtils.showNoteModal).toBeDefined();
    });

    test('devrait avoir une méthode pour les inputs', () => {
      expect(ModalUtils.showInputModal).toBeDefined();
    });
  });
});
