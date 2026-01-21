/**
 * Version Listener - WebSocket-based update notifications
 * Uses Supabase Realtime to receive push notifications when new version is deployed
 * NO POLLING - Zero energy waste!
 *
 * iOS FIX: iOS kills WebSocket after ~90s in background.
 * We detect foreground return and reconnect + check for missed updates.
 */

const VersionListener = {
    subscription: null,
    currentVersion: null,
    supabase: null,
    isReconnecting: false,
    visibilityHandler: null,

    /**
     * Initialize the version listener with Supabase client
     * @param {Object} supabaseClient - Supabase client instance
     */
    init(supabaseClient) {
        if (!supabaseClient) {
            console.warn('VersionListener: Supabase client not available');
            return;
        }

        this.supabase = supabaseClient;
        this.subscribeToVersionUpdates();
        this.setupVisibilityHandler();
    },

    /**
     * iOS FIX: Setup visibility change handler to reconnect when app returns to foreground
     * iOS kills WebSocket connections after ~90 seconds in background
     */
    setupVisibilityHandler() {
        // Remove existing handler if any
        if (this.visibilityHandler) {
            document.removeEventListener('visibilitychange', this.visibilityHandler);
        }

        this.visibilityHandler = () => {
            if (document.visibilityState === 'visible') {
                this.handleForegroundReturn();
            }
        };

        document.addEventListener('visibilitychange', this.visibilityHandler);

        // iOS PWA: Also listen for pageshow (fired when navigating back to cached page)
        window.addEventListener('pageshow', (event) => {
            if (event.persisted) {
                this.handleForegroundReturn();
            }
        });

        // iOS PWA: Focus event as additional safeguard
        window.addEventListener('focus', () => {
            // Debounce: only if we haven't checked in the last 5 seconds
            const now = Date.now();
            if (!this._lastFocusCheck || now - this._lastFocusCheck > 5000) {
                this._lastFocusCheck = now;
                this.handleForegroundReturn();
            }
        });
    },

    /**
     * Handle app returning to foreground (iOS fix)
     * Re-fetch version and reconnect WebSocket if needed
     */
    async handleForegroundReturn() {
        if (this.isReconnecting || !this.supabase) return;
        this.isReconnecting = true;

        try {
            // 1. Check current version from database (catches updates missed while in background)
            const { data, error } = await this.supabase
                .from('app_config')
                .select('value')
                .eq('key', 'app_version')
                .single();

            if (!error && data?.value && data.value !== this.currentVersion) {
                this.currentVersion = data.value;
                this.showUpdateNotification(data.value);
                this.isReconnecting = false;
                return;
            }

            // 2. Reconnect WebSocket channel if it was disconnected
            await this.reconnectChannel();

        } catch (err) {
            console.error('VersionListener: Foreground return error:', err);
        }

        this.isReconnecting = false;
    },

    /**
     * Reconnect the Supabase Realtime channel
     */
    async reconnectChannel() {
        if (!this.supabase) return;

        try {
            // Remove old subscription cleanly
            if (this.subscription) {
                await this.supabase.removeChannel(this.subscription);
                this.subscription = null;
            }

            // Re-subscribe
            this.subscription = this.supabase
                .channel('app_version_updates_' + Date.now()) // Unique channel name to avoid conflicts
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'app_config',
                        filter: 'key=eq.app_version'
                    },
                    (payload) => this.handleVersionUpdate(payload)
                )
                .subscribe();

        } catch (err) {
            console.error('VersionListener: Reconnect error:', err);
        }
    },

    /**
     * Get local cached version from Service Worker cache name or localStorage
     */
    getLocalVersion() {
        // Try to get from localStorage (set by SW or index.html)
        const localVersion = localStorage.getItem('appVersion');
        if (localVersion) return localVersion;

        // Fallback: try to extract from URL parameter if just updated
        const urlParams = new URLSearchParams(window.location.search);
        const wsupdate = urlParams.get('wsupdate');
        if (wsupdate) return null; // Just updated, don't compare

        return null;
    },

    /**
     * Subscribe to app_config table changes via Supabase Realtime
     */
    async subscribeToVersionUpdates() {
        if (!this.supabase) return;

        try {
            // Get local cached version
            const localVersion = this.getLocalVersion();
            console.log('VersionListener: Local version:', localVersion);

            // Get current version from database
            const { data, error } = await this.supabase
                .from('app_config')
                .select('value')
                .eq('key', 'app_version')
                .single();

            if (!error && data?.value) {
                const dbVersion = data.value;
                console.log('VersionListener: DB version:', dbVersion);

                // Compare local vs DB version - if different, show update banner!
                if (localVersion && dbVersion && localVersion !== dbVersion) {
                    console.log('VersionListener: Version mismatch! Local:', localVersion, 'DB:', dbVersion);
                    this.showUpdateNotification(dbVersion);
                    // DON'T update localStorage here - only after user applies update
                } else {
                    // Versions match OR first time - store current version
                    localStorage.setItem('appVersion', dbVersion);
                }

                this.currentVersion = dbVersion;
            }

            // ALWAYS subscribe to changes (even if initial fetch failed)
            this.subscription = this.supabase
                .channel('app_version_updates')
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'app_config',
                        filter: 'key=eq.app_version'
                    },
                    (payload) => this.handleVersionUpdate(payload)
                )
                .subscribe();

        } catch (error) {
            console.error('VersionListener: Subscription error:', error);
        }
    },

    /**
     * Handle version update notification from WebSocket
     * @param {Object} payload - Supabase Realtime payload
     */
    handleVersionUpdate(payload) {
        const newVersion = payload.new?.value;

        if (!newVersion || newVersion === this.currentVersion) {
            return;
        }

        console.log('VersionListener: New version received via WebSocket:', newVersion);
        this.currentVersion = newVersion;
        // Don't update localStorage here - only after user applies update
        this.showUpdateNotification(newVersion);
    },

    /**
     * Show update notification to user
     * @param {string} newVersion - New version string
     */
    showUpdateNotification(newVersion) {
        // Show banner for all users (PWA and desktop)
        this.showPWAUpdateBanner(newVersion);
    },

    /**
     * Show persistent update banner for PWA users
     */
    showPWAUpdateBanner(newVersion) {
        // Remove existing banner if any
        document.getElementById('versionUpdateBanner')?.remove();

        const banner = document.createElement('div');
        banner.id = 'versionUpdateBanner';
        banner.innerHTML = `
            <div style="
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 16px 24px;
                border-radius: 12px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                z-index: 10000;
                display: flex;
                align-items: center;
                gap: 16px;
                max-width: 90%;
                font-family: system-ui, -apple-system, sans-serif;
            ">
                <span style="font-size: 24px;">🚀</span>
                <div style="flex: 1;">
                    <div style="font-weight: 600; margin-bottom: 4px;">Yeni sürüm mevcut!</div>
                    <div style="font-size: 12px; opacity: 0.9;">${newVersion}</div>
                </div>
                <button data-action="VersionListener.applyUpdate('${newVersion}')" style="
                    background: white;
                    color: #667eea;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    white-space: nowrap;
                ">Güncelle</button>
                <button data-action="closeVersionBanner(event)" style="
                    background: transparent;
                    border: none;
                    color: white;
                    font-size: 20px;
                    cursor: pointer;
                    padding: 4px;
                    opacity: 0.7;
                ">×</button>
            </div>
        `;
        document.body.appendChild(banner);

        // Also show toast
        if (typeof showCustomAlert === 'function') {
            showCustomAlert('🚀 Yeni sürüm mevcut! Güncellemek için banner\'a tıklayın.', 'info', 5000);
        }
    },

    /**
     * Apply the update - clear caches and reload
     */
    async applyUpdate(newVersion) {
        // Remove banner
        document.getElementById('versionUpdateBanner')?.remove();

        // Show loading notification
        if (typeof showCustomAlert === 'function') {
            showCustomAlert('🔄 Güncelleniyor...', 'info', 2000);
        }

        try {
            // Save current data
            if (typeof autoSave === 'function') {
                autoSave();
            }

            // Save new version to localStorage BEFORE clearing cache
            // This prevents the banner from showing again after reload
            if (newVersion) {
                localStorage.setItem('appVersion', newVersion);
            }

            // Clear all caches
            if ('caches' in window) {
                const cacheNames = await caches.keys();
                await Promise.all(cacheNames.map(name => caches.delete(name)));
            }

            // Unregister service worker to force fresh install
            if ('serviceWorker' in navigator) {
                const registration = await navigator.serviceWorker.getRegistration();
                if (registration) {
                    await registration.unregister();
                }
            }

            // Mark as just updated
            sessionStorage.setItem('justUpdated', Date.now().toString());

            // Reload with cache-busting
            setTimeout(() => {
                window.location.href = window.location.pathname + '?wsupdate=' + Date.now();
            }, 500);

        } catch (error) {
            console.error('Update error:', error);
            // Fallback: simple reload
            window.location.reload(true);
        }
    },

    /**
     * Cleanup subscription and event listeners
     */
    destroy() {
        // Remove WebSocket subscription
        if (this.subscription) {
            this.supabase?.removeChannel(this.subscription);
            this.subscription = null;
        }

        // Remove visibility handler
        if (this.visibilityHandler) {
            document.removeEventListener('visibilitychange', this.visibilityHandler);
            this.visibilityHandler = null;
        }
    }
};

// Export for global access
window.VersionListener = VersionListener;
