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

  // Instance Supabase pour analytics (indépendante de groupManager)
  supabaseClient: null,

  /**
   * Initialiser la connexion Supabase pour analytics
   * Indépendant de groupManager pour garantir que analytics fonctionne toujours
   */
  initializeSupabase() {
    // Si déjà initialisé, ne rien faire
    if (this.supabaseClient) {
      return true;
    }

    try {
      // Vérifier que Supabase lib est chargée
      if (typeof supabase === 'undefined' || !supabase.createClient) {
        console.log('[Analytics] Bibliothèque Supabase non disponible');
        return false;
      }

      // Vérifier que ENV est défini
      if (typeof ENV === 'undefined') {
        console.log('[Analytics] ENV non défini');
        return false;
      }

      // Récupérer les credentials depuis ENV
      const supabaseUrl = ENV.SUPABASE_URL;
      const supabaseKey = ENV.SUPABASE_ANON_KEY;

      // Vérifier que les credentials sont valides
      if (!supabaseUrl || !supabaseKey || supabaseUrl === '' || supabaseKey === '') {
        console.log('[Analytics] Credentials Supabase manquants (mode local)');
        return false;
      }

      // Réutiliser le client Supabase existant si disponible (évite instances multiples)
      if (window.groupManager?.provider?.supabase) {
        this.supabaseClient = window.groupManager.provider.supabase;
        console.log('✅ [Analytics] Réutilisation client Supabase existant');
      } else if (window.supabaseClient) {
        this.supabaseClient = window.supabaseClient;
        console.log('✅ [Analytics] Réutilisation client Supabase global');
      } else {
        // Créer un nouveau client seulement si aucun n'existe
        this.supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
        window.supabaseClient = this.supabaseClient; // Stocker globalement
        console.log('✅ [Analytics] Nouveau client Supabase créé');
      }
      return true;

    } catch (error) {
      console.error('[Analytics] Erreur initialisation Supabase:', error);
      return false;
    }
  },

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
   * Obtenir ou créer un ID pour cet appareil
   * Permet de suivre les statistiques par appareil de manière anonyme
   */
  getDeviceId() {
    const DEVICE_KEY = 'app_device_id';
    let deviceId = localStorage.getItem(DEVICE_KEY);

    if (!deviceId) {
      // Générer un UUID v4 aléatoire pour l'appareil
      deviceId = 'device_' + this.generateUUID();
      localStorage.setItem(DEVICE_KEY, deviceId);
    }

    return deviceId;
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
    // Initialiser Supabase si pas encore fait
    this.initializeSupabase();

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
    if (!this.supabaseClient) {
      console.log('[Analytics] Supabase non initialisé, tentative d\'initialisation...');
      const initialized = this.initializeSupabase();
      if (!initialized) {
        console.log('[Analytics] Impossible d\'initialiser Supabase');
        return;
      }
    }

    try {
      const payload = {
        anonymous_id: this.getAnonymousId(), // ID anonyme, PAS l'identité réelle
        event_name: eventName,
        event_data: {
          ...data,
          deviceId: this.getDeviceId(), // Ajouter deviceId pour dashboard admin
          timestamp: new Date().toISOString()
        },
        // Infos générales (pas d'identification)
        user_agent: navigator.userAgent,
        screen_width: window.screen.width,
        screen_height: window.screen.height,
        language: navigator.language
      };

      const { error } = await this.supabaseClient
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
   * (Méthode obsolète, conservée pour compatibilité)
   */
  isSupabaseReady() {
    return !!this.supabaseClient;
  },

  /**
   * Vérifier si l'utilisateur a accepté les analytics
   * Par défaut: ACTIVÉ (données 100% anonymes, pas besoin de consentement RGPD)
   */
  isAnalyticsEnabled() {
    const consent = localStorage.getItem('analytics_consent');
    // Si jamais défini, activer par défaut (null → true)
    // Si explicitement désactivé par l'utilisateur, respecter ce choix
    return consent !== 'false';
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
    if (!this.supabaseClient) {
      console.error('Supabase non disponible');
      return null;
    }

    try {
      // Nombre d'utilisateurs uniques (anonymes)
      const { data: users, error: usersError } = await this.supabaseClient
        .from('analytics_events')
        .select('anonymous_id')
        .eq('event_name', 'session_start')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      const uniqueUsers = new Set(users.map(u => u.anonymous_id)).size;

      // Durée moyenne de session
      const { data: sessions, error: sessionsError } = await this.supabaseClient
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

// ✅ Initialisation automatique au chargement
// PrivacyAnalytics est maintenant INDÉPENDANT de groupManager
// Il crée sa propre connexion Supabase directement
window.addEventListener('DOMContentLoaded', () => {
  // Analytics activés par défaut (données 100% anonymes)
  // L'utilisateur peut désactiver dans les paramètres si souhaité
  if (PrivacyAnalytics.isAnalyticsEnabled()) {
    PrivacyAnalytics.startSession();

    // Tracker la fin de session avant de quitter
    window.addEventListener('beforeunload', () => {
      PrivacyAnalytics.endSession();
    });
  }
});

// Export global
window.PrivacyAnalytics = PrivacyAnalytics;

// Export module
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PrivacyAnalytics;
}
