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
        console.log('🔌 VersionListener: WebSocket initialisé');
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
                console.log('🔌 VersionListener: App revenue au premier plan - Vérification MAJ...');
                this.handleForegroundReturn();
            }
        };

        document.addEventListener('visibilitychange', this.visibilityHandler);

        // iOS PWA: Also listen for pageshow (fired when navigating back to cached page)
        window.addEventListener('pageshow', (event) => {
            if (event.persisted) {
                console.log('🔌 VersionListener: Page restaurée depuis bfcache - Reconnexion...');
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
                console.log('🚀 VersionListener: MAJ détectée au retour!', {
                    old: this.currentVersion,
                    new: data.value
                });
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
                .subscribe((status) => {
                    if (status === 'SUBSCRIBED') {
                        console.log('🔌 VersionListener: WebSocket reconnecté');
                    } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
                        console.warn('🔌 VersionListener: Channel status:', status);
                    }
                });

        } catch (err) {
            console.error('VersionListener: Reconnect error:', err);
        }
    },

    /**
     * Subscribe to app_config table changes via Supabase Realtime
     */
    async subscribeToVersionUpdates() {
        if (!this.supabase) return;

        try {
            // Get current version first
            const { data, error } = await this.supabase
                .from('app_config')
                .select('value')
                .eq('key', 'app_version')
                .single();

            if (error) {
                // Table doesn't exist yet - that's OK
                if (error.code === 'PGRST116' || error.code === '42P01') {
                    console.log('🔌 VersionListener: Table app_config non trouvée (normal si pas encore créée)');
                    return;
                }
                console.error('VersionListener: Error fetching version:', error);
                return;
            }

            this.currentVersion = data?.value;
            console.log('🔌 VersionListener: Version actuelle =', this.currentVersion);

            // Subscribe to changes
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
                .subscribe((status) => {
                    if (status === 'SUBSCRIBED') {
                        console.log('🔌 VersionListener: WebSocket connecté - En attente de MAJ');
                    }
                });

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

        console.log('🚀 VersionListener: NOUVELLE VERSION DÉTECTÉE!', {
            old: this.currentVersion,
            new: newVersion
        });

        this.currentVersion = newVersion;
        this.showUpdateNotification(newVersion);
    },

    /**
     * Show update notification to user
     * @param {string} newVersion - New version string
     */
    showUpdateNotification(newVersion) {
        // Check if we're in PWA mode
        const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
                      window.navigator.standalone === true;

        if (isPWA) {
            // PWA: Show persistent banner
            this.showPWAUpdateBanner(newVersion);
        } else {
            // Browser: Auto-apply update
            this.applyUpdate(newVersion);
        }
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
                <button onclick="VersionListener.applyUpdate('${newVersion}')" style="
                    background: white;
                    color: #667eea;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    white-space: nowrap;
                ">Güncelle</button>
                <button onclick="this.parentElement.parentElement.remove()" style="
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
        console.log('🔄 Applying update to version:', newVersion);

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

            // Clear all caches
            if ('caches' in window) {
                const cacheNames = await caches.keys();
                await Promise.all(cacheNames.map(name => caches.delete(name)));
                console.log('🧹 Caches cleared');
            }

            // Unregister service worker to force fresh install
            if ('serviceWorker' in navigator) {
                const registration = await navigator.serviceWorker.getRegistration();
                if (registration) {
                    await registration.unregister();
                    console.log('🧹 Service Worker unregistered');
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
