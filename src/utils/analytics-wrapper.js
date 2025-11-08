/**
 * ANALYTICS WRAPPER
 *
 * Pont entre l'application et PrivacyAnalytics
 * Fournit des méthodes simples pour tracker les événements
 */

const analytics = {
  /**
   * Groupe créé
   */
  groupCreated(groupName) {
    if (typeof PrivacyAnalytics !== 'undefined') {
      PrivacyAnalytics.trackEvent('group_created', {
        groupName: groupName
      });
    }
  },

  /**
   * Groupe rejoint
   */
  groupJoined(groupCode) {
    if (typeof PrivacyAnalytics !== 'undefined') {
      PrivacyAnalytics.trackEvent('group_joined', {
        groupCode: groupCode
      });
    }
  },

  /**
   * Tesbihat utilisé
   */
  tesbihatUsed(namazName, tesbihatName) {
    if (typeof PrivacyAnalytics !== 'undefined') {
      PrivacyAnalytics.trackEvent('tesbihat_used', {
        namaz: namazName,
        tesbihat: tesbihatName
      });
    }
  },

  /**
   * Tesbihat complété
   */
  tesbihatCompleted(namazName, totalCount) {
    if (typeof PrivacyAnalytics !== 'undefined') {
      PrivacyAnalytics.trackEvent('tesbihat_completed', {
        namaz: namazName,
        count: totalCount
      });
    }
  },

  /**
   * Rappel déclenché
   */
  reminderTriggered(reminderId) {
    if (typeof PrivacyAnalytics !== 'undefined') {
      PrivacyAnalytics.trackEvent('reminder_triggered', {
        reminderId: reminderId
      });
    }
  }
};

// Export global
window.analytics = analytics;

// Export module
if (typeof module !== 'undefined' && module.exports) {
  module.exports = analytics;
}

console.log('✅ Analytics wrapper chargé');
