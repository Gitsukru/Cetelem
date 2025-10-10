/**
 * Tests pour src/utils/date-utils.js
 */

// Mock window
global.window = {};

const DateUtils = require('../src/utils/date-utils.js');

describe('DateUtils', () => {
  describe('getWeekStart', () => {
    test('devrait retourner le lundi pour une date en milieu de semaine', () => {
      const wednesday = new Date('2025-10-08'); // Mercredi
      const monday = DateUtils.getWeekStart(wednesday);

      expect(monday.getDay()).toBe(1); // Lundi = 1
      expect(monday.getDate()).toBe(6); // 6 octobre 2025 = Lundi
    });

    test('devrait retourner le même jour si c\'est déjà lundi', () => {
      const monday = new Date('2025-10-06'); // Lundi
      const weekStart = DateUtils.getWeekStart(monday);

      expect(weekStart.getDate()).toBe(monday.getDate());
    });

    test('devrait gérer le dimanche correctement', () => {
      const sunday = new Date('2025-10-12'); // Dimanche
      const monday = DateUtils.getWeekStart(sunday);

      expect(monday.getDay()).toBe(1); // Lundi
      expect(monday.getDate()).toBe(6); // Lundi précédent
    });

    test('devrait mettre l\'heure à 00:00:00', () => {
      const date = new Date('2025-10-08T15:30:45');
      const weekStart = DateUtils.getWeekStart(date);

      expect(weekStart.getHours()).toBe(0);
      expect(weekStart.getMinutes()).toBe(0);
      expect(weekStart.getSeconds()).toBe(0);
      expect(weekStart.getMilliseconds()).toBe(0);
    });
  });

  describe('getWeekEnd', () => {
    test('devrait retourner le dimanche', () => {
      const wednesday = new Date('2025-10-08');
      const sunday = DateUtils.getWeekEnd(wednesday);

      expect(sunday.getDay()).toBe(0); // Dimanche = 0
      expect(sunday.getDate()).toBe(12); // 12 octobre 2025
    });

    test('devrait mettre l\'heure à 23:59:59.999', () => {
      const date = new Date('2025-10-08');
      const weekEnd = DateUtils.getWeekEnd(date);

      expect(weekEnd.getHours()).toBe(23);
      expect(weekEnd.getMinutes()).toBe(59);
      expect(weekEnd.getSeconds()).toBe(59);
      expect(weekEnd.getMilliseconds()).toBe(999);
    });
  });

  describe('getMonthStart', () => {
    test('devrait retourner le 1er du mois', () => {
      const date = new Date('2025-10-15');
      const monthStart = DateUtils.getMonthStart(date);

      expect(monthStart.getDate()).toBe(1);
      expect(monthStart.getMonth()).toBe(date.getMonth());
      expect(monthStart.getFullYear()).toBe(date.getFullYear());
    });

    test('devrait mettre l\'heure à 00:00:00', () => {
      const date = new Date('2025-10-15T15:30:45');
      const monthStart = DateUtils.getMonthStart(date);

      expect(monthStart.getHours()).toBe(0);
      expect(monthStart.getMinutes()).toBe(0);
    });
  });

  describe('getMonthEnd', () => {
    test('devrait retourner le dernier jour du mois', () => {
      const october = new Date('2025-10-15');
      const monthEnd = DateUtils.getMonthEnd(october);

      expect(monthEnd.getDate()).toBe(31); // Octobre a 31 jours
    });

    test('devrait gérer février (année non bissextile)', () => {
      const february = new Date('2025-02-15');
      const monthEnd = DateUtils.getMonthEnd(february);

      expect(monthEnd.getDate()).toBe(28);
    });

    test('devrait gérer février (année bissextile)', () => {
      const february = new Date('2024-02-15');
      const monthEnd = DateUtils.getMonthEnd(february);

      expect(monthEnd.getDate()).toBe(29);
    });

    test('devrait mettre l\'heure à 23:59:59.999', () => {
      const date = new Date('2025-10-15');
      const monthEnd = DateUtils.getMonthEnd(date);

      expect(monthEnd.getHours()).toBe(23);
      expect(monthEnd.getMinutes()).toBe(59);
      expect(monthEnd.getSeconds()).toBe(59);
    });
  });

  describe('isSameDay', () => {
    test('devrait retourner true pour le même jour', () => {
      const date1 = new Date('2025-10-08T10:00:00');
      const date2 = new Date('2025-10-08T15:30:00');

      expect(DateUtils.isSameDay(date1, date2)).toBe(true);
    });

    test('devrait retourner false pour des jours différents', () => {
      const date1 = new Date('2025-10-08');
      const date2 = new Date('2025-10-09');

      expect(DateUtils.isSameDay(date1, date2)).toBe(false);
    });
  });

  describe('isSameWeek', () => {
    test('devrait retourner true pour la même semaine', () => {
      const monday = new Date('2025-10-06');
      const friday = new Date('2025-10-10');

      expect(DateUtils.isSameWeek(monday, friday)).toBe(true);
    });

    test('devrait retourner false pour des semaines différentes', () => {
      const thisWeek = new Date('2025-10-08');
      const nextWeek = new Date('2025-10-15');

      expect(DateUtils.isSameWeek(thisWeek, nextWeek)).toBe(false);
    });
  });

  describe('isSameMonth', () => {
    test('devrait retourner true pour le même mois', () => {
      const date1 = new Date('2025-10-01');
      const date2 = new Date('2025-10-31');

      expect(DateUtils.isSameMonth(date1, date2)).toBe(true);
    });

    test('devrait retourner false pour des mois différents', () => {
      const october = new Date('2025-10-01');
      const november = new Date('2025-11-01');

      expect(DateUtils.isSameMonth(october, november)).toBe(false);
    });

    test('devrait retourner false pour le même mois mais année différente', () => {
      const date1 = new Date('2024-10-01');
      const date2 = new Date('2025-10-01');

      expect(DateUtils.isSameMonth(date1, date2)).toBe(false);
    });
  });

  describe('getDaysBetween', () => {
    test('devrait calculer la différence en jours', () => {
      const date1 = new Date('2025-10-01');
      const date2 = new Date('2025-10-08');

      expect(DateUtils.getDaysBetween(date1, date2)).toBe(7);
    });

    test('devrait retourner 0 pour le même jour', () => {
      const date = new Date('2025-10-08');

      expect(DateUtils.getDaysBetween(date, date)).toBe(0);
    });

    test('devrait fonctionner avec des dates inversées', () => {
      const date1 = new Date('2025-10-08');
      const date2 = new Date('2025-10-01');

      expect(DateUtils.getDaysBetween(date1, date2)).toBe(7);
    });
  });

  describe('addDays', () => {
    test('devrait ajouter des jours correctement', () => {
      const date = new Date('2025-10-01');
      const result = DateUtils.addDays(date, 7);

      expect(result.getDate()).toBe(8);
      expect(result.getMonth()).toBe(9); // Octobre = 9
    });

    test('devrait gérer le changement de mois', () => {
      const date = new Date('2025-10-30');
      const result = DateUtils.addDays(date, 5);

      expect(result.getMonth()).toBe(10); // Novembre = 10
      expect(result.getDate()).toBe(4);
    });

    test('devrait soustraire avec un nombre négatif', () => {
      const date = new Date('2025-10-08');
      const result = DateUtils.addDays(date, -3);

      expect(result.getDate()).toBe(5);
    });
  });

  describe('getRelativeTime', () => {
    test('devrait retourner "birkaç saniye önce" pour <60s', () => {
      const now = new Date();
      const recent = new Date(now.getTime() - 30 * 1000); // 30s ago

      const result = DateUtils.getRelativeTime(recent);
      expect(result).toBe('birkaç saniye önce');
    });

    test('devrait retourner minutes pour <60min', () => {
      const now = new Date();
      const recent = new Date(now.getTime() - 5 * 60 * 1000); // 5min ago

      const result = DateUtils.getRelativeTime(recent);
      expect(result).toBe('5 dakika önce');
    });

    test('devrait retourner heures pour <24h', () => {
      const now = new Date();
      const recent = new Date(now.getTime() - 3 * 60 * 60 * 1000); // 3h ago

      const result = DateUtils.getRelativeTime(recent);
      expect(result).toBe('3 saat önce');
    });

    test('devrait retourner jours pour <7j', () => {
      const now = new Date();
      const recent = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000); // 3 days ago

      const result = DateUtils.getRelativeTime(recent);
      expect(result).toBe('3 gün önce');
    });
  });

  describe('isToday', () => {
    test('devrait retourner true pour aujourd\'hui', () => {
      const today = new Date();

      expect(DateUtils.isToday(today)).toBe(true);
    });

    test('devrait retourner false pour hier', () => {
      const yesterday = DateUtils.addDays(new Date(), -1);

      expect(DateUtils.isToday(yesterday)).toBe(false);
    });
  });
});
