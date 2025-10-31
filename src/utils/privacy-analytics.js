/**
 * ANALYTICS RESPECTUEUX DE LA VIE PRIVÉE
 *
 * Collecte des statistiques d'usage SANS identifier les utilisateurs :
 * - ID aléatoire anonyme (pas lié à l'identité réelle)
 * - Pas d'IP stockée
 * - Pas de données personnelles
 * - Conforme RGPD
 */

const PrivacyAnalytics = {
  // Clé localStorage pour l'ID anonyme
  STORAGE_KEY: 'app_anonymous_id',
  SESSION_KEY: 'app_session_start',

  /**
   * Obtenir ou créer un ID anonyme pour cet utilisateur
   * Cet ID est aléatoire et ne permet PAS d'identifier la personne
   */
  getAnonymousId() {
    let anonymousId = localStorage.getItem(this.STORAGE_KEY);

    if (!anonymousId) {
      // Générer un UUID v4 aléatoire
      anonymousId = 'user_' + this.generateUUID();
      localStorage.setItem(this.STORAGE_KEY, anonymousId);
    }

    return anonymousId;
  },

  /**
   * Générer un UUID v4 (identifiant unique aléatoire)
   */
  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  },

  /**
   * Démarrer une session
   */
  startSession() {
    const now = Date.now();
    sessionStorage.setItem(this.SESSION_KEY, now.toString());

    this.trackEvent('session_start', {
      platform: this.getPlatform(),
      browser: this.getBrowser()
    });
  },

  /**
   * Terminer une session et calculer la durée
   */
  endSession() {
    const startTime = sessionStorage.getItem(this.SESSION_KEY);

    if (startTime) {
      const duration = Math.floor((Date.now() - parseInt(startTime)) / 1000); // en secondes

      this.trackEvent('session_end', {
        duration_seconds: duration,
        duration_minutes: Math.floor(duration / 60)
      });

      sessionStorage.removeItem(this.SESSION_KEY);
    }
  },

  /**
   * Tracker un événement de manière anonyme
   */
  async trackEvent(eventName, data = {}) {
    // Vérifier si analytics activés (consentement)
    if (!this.isAnalyticsEnabled()) {
      return;
    }

    // Vérifier si Supabase disponible
    if (!this.isSupabaseReady()) {
      console.log('[Analytics] Supabase non disponible');
      return;
    }

    try {
      const payload = {
        anonymous_id: this.getAnonymousId(), // ID anonyme, PAS l'identité réelle
        event_name: eventName,
        event_data: {
          ...data,
          timestamp: new Date().toISOString()
        },
        // Infos générales (pas d'identification)
        user_agent: navigator.userAgent,
        screen_width: window.screen.width,
        screen_height: window.screen.height,
        language: navigator.language
      };

      const { error } = await groupManager.provider.supabase
        .from('analytics_events')
        .insert(payload);

      if (error) {
        console.error('[Analytics] Erreur:', error);
      } else {
        console.log(`📊 [Analytics] ${eventName}`, data);
      }
    } catch (error) {
      console.error('[Analytics] Erreur tracking:', error);
    }
  },

  /**
   * Vérifier si Supabase est prêt
   */
  isSupabaseReady() {
    return !!(
      typeof groupManager !== 'undefined' &&
      groupManager &&
      groupManager.provider &&
      groupManager.provider.supabase
    );
  },

  /**
   * Vérifier si l'utilisateur a accepté les analytics
   */
  isAnalyticsEnabled() {
    const consent = localStorage.getItem('analytics_consent');
    return consent === 'true';
  },

  /**
   * Activer/désactiver les analytics (consentement utilisateur)
   */
  setAnalyticsConsent(enabled) {
    localStorage.setItem('analytics_consent', enabled ? 'true' : 'false');

    if (enabled) {
      console.log('✅ Analytics activés (anonymes)');
      this.startSession();
    } else {
      console.log('❌ Analytics désactivés');
    }
  },

  /**
   * Demander le consentement à l'utilisateur (RGPD)
   */
  async requestConsent() {
    // Si déjà répondu, ne pas redemander
    if (localStorage.getItem('analytics_consent') !== null) {
      return this.isAnalyticsEnabled();
    }

    const message = `
📊 Statistiques d'usage (anonymes)

Pour améliorer l'application, nous collectons des statistiques anonymes :
• Nombre d'utilisateurs
• Durée d'utilisation
• Fonctionnalités utilisées

✅ 100% anonyme (ID aléatoire, pas d'IP, pas de données personnelles)
✅ Vous pouvez refuser sans impact sur l'app

Acceptez-vous ?
    `.trim();

    const accepted = confirm(message);
    this.setAnalyticsConsent(accepted);

    return accepted;
  },

  /**
   * Obtenir la plateforme (mobile/desktop)
   */
  getPlatform() {
    const ua = navigator.userAgent.toLowerCase();
    if (/mobile|android|iphone|ipad|ipod/.test(ua)) {
      return 'mobile';
    }
    return 'desktop';
  },

  /**
   * Obtenir le navigateur (simplifié)
   */
  getBrowser() {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Edge')) return 'Edge';
    return 'Autre';
  },

  // ===== ÉVÉNEMENTS PRÉDÉFINIS =====

  pageView(pageName) {
    this.trackEvent('page_view', { page: pageName });
  },

  featureUsed(featureName) {
    this.trackEvent('feature_used', { feature: featureName });
  },

  zikirCounted(count) {
    // Tracker uniquement les milestones (10, 50, 100, etc.)
    if (count === 10 || count === 50 || count === 100 || count % 500 === 0) {
      this.trackEvent('zikir_milestone', { count });
    }
  },

  // ===== DASHBOARD STATS (POUR VOUS) =====

  /**
   * Récupérer les statistiques globales
   */
  async getStats() {
    if (!this.isSupabaseReady()) {
      console.error('Supabase non disponible');
      return null;
    }

    try {
      // Nombre d'utilisateurs uniques (anonymes)
      const { data: users, error: usersError } = await groupManager.provider.supabase
        .from('analytics_events')
        .select('anonymous_id')
        .eq('event_name', 'session_start')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      const uniqueUsers = new Set(users.map(u => u.anonymous_id)).size;

      // Durée moyenne de session
      const { data: sessions, error: sessionsError } = await groupManager.provider.supabase
        .from('analytics_events')
        .select('event_data')
        .eq('event_name', 'session_end');

      if (sessionsError) throw sessionsError;

      const avgDuration = sessions.length > 0
        ? sessions.reduce((sum, s) => sum + (s.event_data?.duration_minutes || 0), 0) / sessions.length
        : 0;

      return {
        total_users: uniqueUsers,
        total_sessions: users.length,
        avg_session_duration_minutes: Math.round(avgDuration * 10) / 10
      };
    } catch (error) {
      console.error('Erreur récupération stats:', error);
      return null;
    }
  },

  /**
   * Afficher les stats dans la console (pour développeur)
   */
  async showStats() {
    const stats = await this.getStats();
    if (stats) {
      console.table(stats);
    }
  }
};

// Initialisation automatique au chargement
window.addEventListener('DOMContentLoaded', () => {
  // Demander consentement si nécessaire
  PrivacyAnalytics.requestConsent().then(accepted => {
    if (accepted) {
      PrivacyAnalytics.startSession();

      // Tracker la fin de session avant de quitter
      window.addEventListener('beforeunload', () => {
        PrivacyAnalytics.endSession();
      });
    }
  });
});

// Export global
window.PrivacyAnalytics = PrivacyAnalytics;

// Export module
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PrivacyAnalytics;
}
