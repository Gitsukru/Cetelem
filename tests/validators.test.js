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
      expect(result.error).toContain('vide');
    });

    test('devrait rejeter un nom avec seulement des espaces', () => {
      const result = Validators.validateCategoryName('   ');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('vide');
    });

    test('devrait rejeter un nom trop long', () => {
      const longName = 'A'.repeat(31);
      const result = Validators.validateCategoryName(longName);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('30 caractères');
    });

    test('devrait accepter exactement 30 caractères', () => {
      const name = 'A'.repeat(30);
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

    test('devrait accepter un nom vide (optionnel)', () => {
      const result = Validators.validateGroupName('');
      expect(result.valid).toBe(true);
      expect(result.value).toBe('');
    });

    test('devrait rejeter un nom trop long', () => {
      const longName = 'A'.repeat(51);
      const result = Validators.validateGroupName(longName);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('50 caractères');
    });

    test('devrait accepter exactement 50 caractères', () => {
      const name = 'A'.repeat(50);
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
      const longName = 'A'.repeat(26);
      const result = Validators.validateParticipantName(longName);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('25 caractères');
    });

    test('devrait trim les espaces', () => {
      const result = Validators.validateParticipantName('  Ahmed  ');
      expect(result.value).toBe('Ahmed');
    });
  });

  describe('sanitizeInput', () => {
    test('devrait échapper les caractères HTML', () => {
      const dirty = '<script>alert("XSS")</script>';
      const clean = Validators.sanitizeInput(dirty);
      expect(clean).not.toContain('<script>');
      expect(clean).toContain('&lt;');
      expect(clean).toContain('&gt;');
    });

    test('devrait échapper les guillemets', () => {
      const dirty = 'Test "quoted" text';
      const clean = Validators.sanitizeInput(dirty);
      expect(clean).toContain('&quot;');
    });

    test('devrait échapper les apostrophes', () => {
      const dirty = "Test 'quoted' text";
      const clean = Validators.sanitizeInput(dirty);
      expect(clean).toContain('&#039;');
    });

    test('devrait gérer null et undefined', () => {
      expect(Validators.sanitizeInput(null)).toBe('');
      expect(Validators.sanitizeInput(undefined)).toBe('');
    });

    test('devrait ne pas modifier le texte sûr', () => {
      const safe = 'Hello World 123';
      const clean = Validators.sanitizeInput(safe);
      expect(clean).toBe(safe);
    });
  });

  describe('isValidPositiveInteger', () => {
    test('devrait accepter les entiers positifs', () => {
      expect(Validators.isValidPositiveInteger(1)).toBe(true);
      expect(Validators.isValidPositiveInteger(100)).toBe(true);
      expect(Validators.isValidPositiveInteger(999999)).toBe(true);
    });

    test('devrait accepter zéro', () => {
      expect(Validators.isValidPositiveInteger(0)).toBe(true);
    });

    test('devrait rejeter les nombres négatifs', () => {
      expect(Validators.isValidPositiveInteger(-1)).toBe(false);
      expect(Validators.isValidPositiveInteger(-100)).toBe(false);
    });

    test('devrait rejeter les décimaux', () => {
      expect(Validators.isValidPositiveInteger(1.5)).toBe(false);
      expect(Validators.isValidPositiveInteger(0.1)).toBe(false);
    });

    test('devrait rejeter NaN', () => {
      expect(Validators.isValidPositiveInteger(NaN)).toBe(false);
    });

    test('devrait rejeter Infinity', () => {
      expect(Validators.isValidPositiveInteger(Infinity)).toBe(false);
      expect(Validators.isValidPositiveInteger(-Infinity)).toBe(false);
    });

    test('devrait rejeter les non-nombres', () => {
      expect(Validators.isValidPositiveInteger('123')).toBe(false);
      expect(Validators.isValidPositiveInteger(null)).toBe(false);
      expect(Validators.isValidPositiveInteger(undefined)).toBe(false);
    });
  });
});
