/**
 * Tests pour src/utils/validators.js
 */

// Mock window si nécessaire (environnement Node)
global.window = {};

const Validators = require('../src/utils/validators.js');

describe('Validators', () => {
  describe('validateCategoryName', () => {
    test('devrait accepter un nom valide', () => {
      const result = Validators.validateCategoryName('  Salavat  ');
      expect(result.valid).toBe(true);
      expect(result.value).toBe('Salavat');
    });

    test('devrait rejeter un nom vide', () => {
      const result = Validators.validateCategoryName('');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('requis');
    });

    test('devrait rejeter un nom avec seulement des espaces', () => {
      const result = Validators.validateCategoryName('   ');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('vide');
    });

    test('devrait rejeter un nom trop long', () => {
      const longName = 'A'.repeat(51);
      const result = Validators.validateCategoryName(longName);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('50 caractères');
    });

    test('devrait accepter exactement 50 caractères', () => {
      const name = 'A'.repeat(50);
      const result = Validators.validateCategoryName(name);
      expect(result.valid).toBe(true);
    });

    test('devrait trim les espaces', () => {
      const result = Validators.validateCategoryName('  Test  ');
      expect(result.value).toBe('Test');
    });
  });

  describe('validateGroupCode', () => {
    test('devrait accepter un code valide de 6 caractères', () => {
      const result = Validators.validateGroupCode('ABC123');
      expect(result.valid).toBe(true);
      expect(result.value).toBe('ABC123');
    });

    test('devrait convertir en majuscules', () => {
      const result = Validators.validateGroupCode('abc123');
      expect(result.valid).toBe(true);
      expect(result.value).toBe('ABC123');
    });

    test('devrait rejeter un code vide', () => {
      const result = Validators.validateGroupCode('');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('requis');
    });

    test('devrait rejeter un code trop court', () => {
      const result = Validators.validateGroupCode('ABC12');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('6 caractères');
    });

    test('devrait rejeter un code trop long', () => {
      const result = Validators.validateGroupCode('ABC1234');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('6 caractères');
    });

    test('devrait accepter les codes alphanumériques', () => {
      const codes = ['ABCDEF', '123456', 'A1B2C3'];
      codes.forEach(code => {
        const result = Validators.validateGroupCode(code);
        expect(result.valid).toBe(true);
      });
    });
  });

  describe('validateGroupName', () => {
    test('devrait accepter un nom de groupe valide', () => {
      const result = Validators.validateGroupName('Groupe Test');
      expect(result.valid).toBe(true);
      expect(result.value).toBe('Groupe Test');
    });

    test('devrait rejeter un nom vide', () => {
      const result = Validators.validateGroupName('');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('requis');
    });

    test('devrait rejeter un nom trop long', () => {
      const longName = 'A'.repeat(31);
      const result = Validators.validateGroupName(longName);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('30 caractères');
    });

    test('devrait accepter exactement 30 caractères', () => {
      const name = 'A'.repeat(30);
      const result = Validators.validateGroupName(name);
      expect(result.valid).toBe(true);
    });
  });

  describe('validateParticipantName', () => {
    test('devrait accepter un nom de participant valide', () => {
      const result = Validators.validateParticipantName('Ahmed');
      expect(result.valid).toBe(true);
      expect(result.value).toBe('Ahmed');
    });

    test('devrait rejeter un nom vide', () => {
      const result = Validators.validateParticipantName('');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('requis');
    });

    test('devrait rejeter un nom trop long', () => {
      const longName = 'A'.repeat(21);
      const result = Validators.validateParticipantName(longName);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('20 caractères');
    });

    test('devrait trim les espaces', () => {
      const result = Validators.validateParticipantName('  Ahmed  ');
      expect(result.value).toBe('Ahmed');
    });
  });

  describe('sanitizeHTML', () => {
    // Mock document.createElement pour environnement Node
    beforeEach(() => {
      global.document = {
        createElement: () => ({
          textContent: '',
          innerHTML: '',
          set textContent(val) {
            this._text = val;
            // Simuler l'échappement HTML
            this.innerHTML = val
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#x27;');
          },
          get textContent() {
            return this._text;
          }
        })
      };
    });

    test('devrait échapper les caractères HTML', () => {
      const dirty = '<script>alert("XSS")</script>';
      const clean = Validators.sanitizeHTML(dirty);
      expect(clean).not.toContain('<script>');
      expect(clean).toContain('&lt;');
      expect(clean).toContain('&gt;');
    });

    test('devrait gérer null et undefined', () => {
      expect(Validators.sanitizeHTML(null)).toBe('');
      expect(Validators.sanitizeHTML(undefined)).toBe('');
      expect(Validators.sanitizeHTML('')).toBe('');
    });
  });

  describe('validateCounter', () => {
    test('devrait accepter les entiers positifs', () => {
      expect(Validators.validateCounter(1).valid).toBe(true);
      expect(Validators.validateCounter(100).valid).toBe(true);
      expect(Validators.validateCounter(999999).valid).toBe(true);
      expect(Validators.validateCounter(1).value).toBe(1);
    });

    test('devrait accepter zéro', () => {
      const result = Validators.validateCounter(0);
      expect(result.valid).toBe(true);
      expect(result.value).toBe(0);
    });

    test('devrait rejeter les nombres négatifs', () => {
      expect(Validators.validateCounter(-1).valid).toBe(false);
      expect(Validators.validateCounter(-100).valid).toBe(false);
      expect(Validators.validateCounter(-1).error).toContain('négatif');
    });

    test('devrait accepter les strings de nombres valides', () => {
      const result = Validators.validateCounter('123');
      expect(result.valid).toBe(true);
      expect(result.value).toBe(123);
    });

    test('devrait rejeter les valeurs invalides', () => {
      expect(Validators.validateCounter('abc').valid).toBe(false);
      expect(Validators.validateCounter(null).valid).toBe(false);
      expect(Validators.validateCounter(undefined).valid).toBe(false);
    });

    test('devrait rejeter les valeurs trop élevées', () => {
      const result = Validators.validateCounter(1000001);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('trop élevée');
    });
  });
});
