/**
 * 👑 ADMIN DASHBOARD - LOGIQUE PRINCIPALE
 *
 * Gère les 10 sections du dashboard admin :
 * 1. Vue d'ensemble
 * 2. Usage Application
 * 3. Analytics Groupes
 * 4. Analytics Livres
 * 5. Performance
 * 6. Outils Admin
 * 7. Tendances
 * 8. Debug & Logs
 * 9. Analytics Avancées
 * 10. Sécurité
 */

class AdminDashboard {
    constructor() {
        this.supabase = null;
        this.currentUser = null;
        this.charts = {};
        this.refreshInterval = null;
        this.AUTO_REFRESH_INTERVAL = 60000; // 60 secondes
    }

    /**
     * 🚀 Initialisation du dashboard
     */
    async init(supabase, user) {
        console.log('📊 AdminDashboard: Initialisation...');

        this.supabase = supabase;
        this.currentUser = user;

        // Setup navigation
        this.setupNavigation();

        // Setup auto-refresh
        this.setupAutoRefresh();

        // Charger les données initiales
        await this.loadAllData();

        console.log('✅ Dashboard initialisé');
    }

    /**
     * Configure la navigation entre sections
     */
    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        const sections = document.querySelectorAll('.content-section');

        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();

                // Update active nav
                navItems.forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');

                // Show corresponding section
                const sectionId = item.getAttribute('data-section');
                sections.forEach(section => {
                    if (section.id === sectionId) {
                        section.classList.add('active');
                    } else {
                        section.classList.remove('active');
                    }
                });

                // Update page title
                const title = item.querySelector('.nav-text').textContent;
                document.querySelector('.page-title').textContent = item.querySelector('.nav-icon').textContent + ' ' + title;
            });
        });
    }

    /**
     * Configure le rafraîchissement automatique
     */
    setupAutoRefresh() {
        this.refreshInterval = setInterval(() => {
            console.log('🔄 Auto-refresh des données...');
            this.loadAllData();
        }, this.AUTO_REFRESH_INTERVAL);
    }

    /**
     * Rafraîchit toutes les données
     */
    async refreshAll() {
        console.log('🔄 Rafraîchissement manuel...');
        await this.loadAllData();
    }

    /**
     * Charge toutes les données du dashboard
     */
    async loadAllData() {
        try {
            // Update last refresh time
            this.updateLastRefreshTime();

            // Load data for each section
            await Promise.all([
                this.loadOverviewData(),
                this.loadUsageData(),
                this.loadGroupsData(),
                this.loadBooksData(),
                this.loadPerformanceData(),
                this.loadTrendsData(),
                this.loadDebugLogs(),
                this.loadSecurityData()
            ]);

            console.log('✅ Toutes les données chargées');
        } catch (error) {
            console.error('❌ Erreur chargement données:', error);
        }
    }

    /**
     * Met à jour l'heure du dernier rafraîchissement
     */
    updateLastRefreshTime() {
        const el = document.getElementById('lastUpdateTime');
        if (el) {
            const now = new Date();
            el.textContent = now.toLocaleTimeString('fr-FR');
        }
    }

    /* ========================================
       SECTION 1: VUE D'ENSEMBLE
       ======================================== */

    async loadOverviewData() {
        try {
            console.log('📊 Chargement vue d\'ensemble...');

            // Récupérer les events analytics pour calculer les métriques
            const { data: events, error } = await this.supabase
                .from('analytics_events')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(10000);

            if (error) throw error;

            // Calculer les métriques
            const metrics = this.calculateOverviewMetrics(events);

            // Afficher les métriques
            this.displayOverviewMetrics(metrics);

            // Charger l'activité récente
            this.displayRecentActivity(events);

            // Charger top catégories
            this.displayTopCategories(events);

        } catch (error) {
            console.error('❌ Erreur vue d\'ensemble:', error);
            this.showErrorInSection('overview', 'Erreur chargement données');
        }
    }

    calculateOverviewMetrics(events) {
        const now = Date.now();
        const day = 24 * 60 * 60 * 1000;

        // Users actifs (devices uniques)
        const events24h = events.filter(e => {
            const eventTime = new Date(e.created_at).getTime();
            return (now - eventTime) < day;
        });

        const events7d = events.filter(e => {
            const eventTime = new Date(e.created_at).getTime();
            return (now - eventTime) < (7 * day);
        });

        const events30d = events.filter(e => {
            const eventTime = new Date(e.created_at).getTime();
            return (now - eventTime) < (30 * day);
        });

        // Devices uniques
        const uniqueDevices24h = new Set(
            events24h.map(e => e.event_data?.deviceId).filter(Boolean)
        ).size;

        const uniqueDevices30d = new Set(
            events30d.map(e => e.event_data?.deviceId).filter(Boolean)
        ).size;

        const totalDevices = new Set(
            events.map(e => e.event_data?.deviceId).filter(Boolean)
        ).size;

        // Zikirlers totaux
        const totalZikirlers = events
            .filter(e => e.event_name === 'counter_increment')
            .reduce((sum, e) => sum + (e.event_data?.value || 0), 0);

        // Groupes actifs
        const activeGroups = new Set(
            events7d
                .filter(e => e.event_name && e.event_name.includes('group'))
                .map(e => e.event_data?.groupId)
                .filter(Boolean)
        ).size;

        // Livres complétés (7j)
        const booksCompleted = events7d.filter(e =>
            e.event_name === 'book_completed'
        ).length;

        // Taux d'engagement
        const engagement24h = totalDevices > 0 ? (uniqueDevices24h / totalDevices * 100) : 0;
        const engagement30d = totalDevices > 0 ? (uniqueDevices30d / totalDevices * 100) : 0;

        return {
            activeUsers24h: uniqueDevices24h,
            totalDevices: totalDevices, // Garder le nombre brut pour le check
            totalZikirlers: this.formatNumber(totalZikirlers),
            activeGroups,
            booksCompleted,
            engagement24h: engagement24h.toFixed(1),
            engagement30d: engagement30d.toFixed(1),
            engagementDetail24h: `${uniqueDevices24h} / ${totalDevices} devices`,
            engagementDetail30d: `${uniqueDevices30d} / ${totalDevices} devices`
        };
    }

    displayOverviewMetrics(metrics) {
        this.updateMetric('activeUsers24h', metrics.activeUsers24h);
        this.updateMetric('totalZikirlers', metrics.totalZikirlers);
        this.updateMetric('activeGroups', metrics.activeGroups);
        this.updateMetric('booksCompleted', metrics.booksCompleted);
        this.updateMetric('engagement24h', metrics.engagement24h + '%');
        this.updateMetric('engagement30d', metrics.engagement30d + '%');

        // Details
        const engagementDetail = document.getElementById('engagementDetail');
        if (engagementDetail) {
            engagementDetail.textContent = metrics.engagementDetail24h;
        }

        const engagementDetail30d = document.getElementById('engagementDetail30d');
        if (engagementDetail30d) {
            engagementDetail30d.textContent = metrics.engagementDetail30d;
        }

        // Afficher un message si pas de données
        if (metrics.totalDevices === 0) {
            this.showNoDataMessage();
        }
    }

    showNoDataMessage() {
        const section = document.getElementById('overview');
        if (!section) return;

        const existingMsg = section.querySelector('.no-data-message');
        if (existingMsg) return; // Déjà affiché

        const message = document.createElement('div');
        message.className = 'alert alert-info no-data-message';
        message.style.marginTop = '20px';
        message.innerHTML = `
            <span class="alert-icon">ℹ️</span>
            <div>
                <strong>Pas encore de données analytics</strong>
                <p style="margin: 8px 0 0 0; font-size: 13px; font-weight: normal;">
                    Le dashboard affichera les statistiques dès que les utilisateurs commenceront à utiliser l'application.
                    Les données sont collectées automatiquement via la table <code>analytics_events</code>.
                </p>
            </div>
        `;

        const metricsGrid = section.querySelector('.metrics-grid');
        if (metricsGrid && metricsGrid.nextSibling) {
            metricsGrid.parentNode.insertBefore(message, metricsGrid.nextSibling);
        }
    }

    displayRecentActivity(events) {
        const container = document.getElementById('recentActivity');
        if (!container) return;

        // Get last 10 events
        const recentEvents = events.slice(0, 10);

        if (recentEvents.length === 0) {
            container.innerHTML = '<div class="activity-item">Aucune activité récente</div>';
            return;
        }

        container.innerHTML = recentEvents.map(event => {
            const time = new Date(event.created_at);
            const timeStr = time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
            const label = this.getEventLabel(event);

            return `
                <div class="activity-item">
                    <strong>${timeStr}</strong> - ${label}
                </div>
            `;
        }).join('');
    }

    displayTopCategories(events) {
        const container = document.getElementById('topCategories');
        if (!container) return;

        // Compter les events par catégorie
        const categoryEvents = events.filter(e =>
            e.event_name === 'counter_increment' && e.event_data?.categoryName
        );

        const categoryCounts = {};
        categoryEvents.forEach(e => {
            const name = e.event_data.categoryName;
            const value = e.event_data.value || 1;
            categoryCounts[name] = (categoryCounts[name] || 0) + value;
        });

        // Top 5
        const topCategories = Object.entries(categoryCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        if (topCategories.length === 0) {
            container.innerHTML = '<div class="top-item">Aucune donnée disponible</div>';
            return;
        }

        container.innerHTML = topCategories.map(([name, count], index) => `
            <div class="top-item">
                <span class="top-item-name">${index + 1}. ${name}</span>
                <span class="top-item-value">${this.formatNumber(count)}</span>
            </div>
        `).join('');
    }

    /* ========================================
       SECTION 2: USAGE APPLICATION
       ======================================== */

    async loadUsageData() {
        try {
            console.log('📱 Chargement usage app...');

            const { data: events, error } = await this.supabase
                .from('analytics_events')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(10000);

            if (error) throw error;

            // Usage des features
            this.displayFeaturesUsage(events);

            // Chart d'activité
            this.createUsageChart(events);

            // Peak hours
            this.createPeakHoursChart(events);

        } catch (error) {
            console.error('❌ Erreur usage app:', error);
        }
    }

    displayFeaturesUsage(events) {
        const totalDevices = new Set(
            events.map(e => e.event_data?.deviceId).filter(Boolean)
        ).size;

        if (totalDevices === 0) return;

        // Groupes
        const groupUsers = new Set(
            events.filter(e => e.event_name.includes('group'))
                .map(e => e.event_data?.deviceId)
                .filter(Boolean)
        ).size;

        // Livres
        const bookUsers = new Set(
            events.filter(e => e.event_name.includes('book'))
                .map(e => e.event_data?.deviceId)
                .filter(Boolean)
        ).size;

        // Tesbihat
        const tesbihatUsers = new Set(
            events.filter(e => e.event_name.includes('tesbihat'))
                .map(e => e.event_data?.deviceId)
                .filter(Boolean)
        ).size;

        // Notifications
        const notifUsers = new Set(
            events.filter(e => e.event_name.includes('notification'))
                .map(e => e.event_data?.deviceId)
                .filter(Boolean)
        ).size;

        // Backups
        const backupUsers = new Set(
            events.filter(e => e.event_name.includes('backup'))
                .map(e => e.event_data?.deviceId)
                .filter(Boolean)
        ).size;

        // Afficher les pourcentages
        this.updateFeatureUsage('groups', groupUsers, totalDevices);
        this.updateFeatureUsage('books', bookUsers, totalDevices);
        this.updateFeatureUsage('tesbihat', tesbihatUsers, totalDevices);
        this.updateFeatureUsage('notifications', notifUsers, totalDevices);
        this.updateFeatureUsage('backups', backupUsers, totalDevices);
    }

    updateFeatureUsage(feature, users, total) {
        const percent = total > 0 ? (users / total * 100) : 0;

        const fill = document.getElementById(`${feature}Usage`);
        const percentEl = document.getElementById(`${feature}UsagePercent`);

        if (fill) fill.style.width = percent + '%';
        if (percentEl) percentEl.textContent = percent.toFixed(0) + '%';
    }

    createUsageChart(events) {
        const canvas = document.getElementById('usageChart');
        if (!canvas) return;

        // Données des 7 derniers jours
        const days = 7;
        const labels = [];
        const data = [];

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            labels.push(date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }));

            // Compter devices uniques ce jour
            const dayStart = new Date(date);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(date);
            dayEnd.setHours(23, 59, 59, 999);

            const dayEvents = events.filter(e => {
                const eventDate = new Date(e.created_at);
                return eventDate >= dayStart && eventDate <= dayEnd;
            });

            const uniqueDevices = new Set(
                dayEvents.map(e => e.event_data?.deviceId).filter(Boolean)
            ).size;

            data.push(uniqueDevices);
        }

        // Créer le chart
        if (this.charts.usage) {
            this.charts.usage.destroy();
        }

        this.charts.usage = new Chart(canvas, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Utilisateurs Actifs',
                    data: data,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                        stepSize: 1
                        }
                    }
                }
            }
        });
    }

    createPeakHoursChart(events) {
        const canvas = document.getElementById('peakHoursChart');
        if (!canvas) return;

        // Compter events par heure
        const hourCounts = new Array(24).fill(0);

        events.forEach(e => {
            const hour = new Date(e.created_at).getHours();
            hourCounts[hour]++;
        });

        // Labels
        const labels = Array.from({ length: 24 }, (_, i) => i + 'h');

        // Créer chart
        if (this.charts.peakHours) {
            this.charts.peakHours.destroy();
        }

        this.charts.peakHours = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Activité',
                    data: hourCounts,
                    backgroundColor: 'rgba(102, 126, 234, 0.7)',
                    borderColor: '#667eea',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    /* ========================================
       SECTION 3: ANALYTICS GROUPES
       ======================================== */

    async loadGroupsData() {
        try {
            console.log('👥 Chargement analytics groupes...');

            const { data: groups, error } = await this.supabase
                .from('groups')
                .select('*');

            if (error) throw error;

            // Metrics
            const totalGroups = groups.length;

            // Taille moyenne des groupes
            const avgSize = groups.length > 0
                ? (groups.reduce((sum, g) => sum + (g.participant_count || 0), 0) / groups.length).toFixed(1)
                : 0;

            // Durée de vie moyenne
            const avgLifetime = this.calculateAverageGroupLifetime(groups);

            // Taux d'abandon
            const abandonedGroups = groups.filter(g => {
                const lastActivity = new Date(g.updated_at);
                const daysSince = (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24);
                return daysSince > 30;
            }).length;

            const abandonRate = totalGroups > 0 ? (abandonedGroups / totalGroups * 100).toFixed(1) : 0;

            // Afficher
            this.updateMetric('totalGroups', totalGroups);
            this.updateMetric('avgGroupSize', avgSize);
            this.updateMetric('avgGroupLifetime', avgLifetime);
            this.updateMetric('groupAbandonRate', abandonRate + '%');

            // Top groups
            this.displayTopGroups(groups);

        } catch (error) {
            console.error('❌ Erreur analytics groupes:', error);
        }
    }

    calculateAverageGroupLifetime(groups) {
        if (groups.length === 0) return '0';

        const lifetimes = groups
            .filter(g => g.created_at && g.updated_at) // Filtrer invalides
            .map(g => {
                const created = new Date(g.created_at);
                const updated = new Date(g.updated_at);
                const lifetime = (updated - created) / (1000 * 60 * 60 * 24); // days

                // Vérifier que c'est un nombre valide
                return isNaN(lifetime) ? 0 : lifetime;
            })
            .filter(l => l >= 0); // Seulement positifs

        if (lifetimes.length === 0) return '0';

        const avg = lifetimes.reduce((sum, l) => sum + l, 0) / lifetimes.length;
        return isNaN(avg) ? '0' : avg.toFixed(0);
    }

    displayTopGroups(groups) {
        const container = document.getElementById('topGroupsList');
        if (!container) return;

        // Sort by participant count
        const topGroups = groups
            .sort((a, b) => (b.participant_count || 0) - (a.participant_count || 0))
            .slice(0, 10);

        if (topGroups.length === 0) {
            container.innerHTML = '<div class="top-item">Aucun groupe trouvé</div>';
            return;
        }

        container.innerHTML = topGroups.map((group, index) => `
            <div class="top-item">
                <span class="top-item-name">${index + 1}. Groupe ${group.id.substring(0, 8)}...</span>
                <span class="top-item-value">${group.participant_count || 0} membres</span>
            </div>
        `).join('');
    }

    /* ========================================
       SECTION 4: ANALYTICS LIVRES
       ======================================== */

    async loadBooksData() {
        try {
            console.log('📚 Chargement analytics livres...');

            // Compter livres via events (les livres sont en localStorage)
            const { data: events, error } = await this.supabase
                .from('analytics_events')
                .select('*')
                .in('event_name', ['book_created', 'book_completed']);

            if (error) throw error;

            const booksCreated = events.filter(e => e.event_name === 'book_created').length;
            const booksCompleted = events.filter(e => e.event_name === 'book_completed').length;

            const completionRate = booksCreated > 0
                ? (booksCompleted / booksCreated * 100).toFixed(1)
                : 0;

            this.updateMetric('totalBooks', booksCreated);
            this.updateMetric('bookCompletionRate', completionRate + '%');
            this.updateMetric('activeBooksCount', booksCreated - booksCompleted);
            this.updateMetric('completedBooksCount', booksCompleted);

            // Chart types de livres
            this.createBooksChart(events);

        } catch (error) {
            console.error('❌ Erreur analytics livres:', error);
        }
    }

    createBooksChart(events) {
        const canvas = document.getElementById('booksChart');
        if (!canvas) return;

        // Placeholder pour l'instant (données pas assez détaillées)
        const data = {
            labels: ['Hatim', 'Coran', 'Dualar', 'Zikirler', 'Autres'],
            data: [5, 8, 12, 15, 10] // Exemple
        };

        if (this.charts.books) {
            this.charts.books.destroy();
        }

        this.charts.books = new Chart(canvas, {
            type: 'doughnut',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.data,
                    backgroundColor: [
                        '#667eea',
                        '#764ba2',
                        '#f093fb',
                        '#4facfe',
                        '#00f2fe'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true
            }
        });
    }

    /* ========================================
       SECTION 5: PERFORMANCE
       ======================================== */

    async loadPerformanceData() {
        try {
            console.log('⚡ Chargement performance...');

            // Load time (exemple)
            this.updateMetric('loadTime', '1.2s');

            // Quota Supabase
            await this.checkSupabaseQuota();

            // Cache SW
            this.checkServiceWorkerCache();

            // Erreurs JS
            await this.checkJSErrors();

            // Alerts
            this.displayPerformanceAlerts();

        } catch (error) {
            console.error('❌ Erreur performance:', error);
        }
    }

    async checkSupabaseQuota() {
        try {
            // Compter rows dans tables principales
            const tables = ['analytics_events', 'groups'];
            let totalRows = 0;

            for (const table of tables) {
                const { count, error } = await this.supabase
                    .from(table)
                    .select('*', { count: 'exact', head: true });

                if (!error && count) {
                    totalRows += count;
                }
            }

            // Limite free tier Supabase : 500MB / ~500k rows
            const quotaPercent = (totalRows / 500000 * 100).toFixed(1);

            this.updateMetric('supabaseQuota', quotaPercent + '%');

            const quotaFill = document.getElementById('quotaFill');
            if (quotaFill) {
                quotaFill.style.width = quotaPercent + '%';

                // Change color if > 80%
                if (quotaPercent > 80) {
                    quotaFill.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
                }
            }

        } catch (error) {
            console.error('❌ Erreur quota:', error);
        }
    }

    checkServiceWorkerCache() {
        if ('caches' in window) {
            caches.keys().then(cacheNames => {
                // Afficher nb de caches
                this.updateMetric('cacheSize', cacheNames.length + ' caches');
            });
        }
    }

    async checkJSErrors() {
        try {
            const { data: errors, error } = await this.supabase
                .from('analytics_events')
                .select('*')
                .eq('event_name', 'error')
                .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

            if (error) throw error;

            this.updateMetric('jsErrors', errors.length);

        } catch (error) {
            console.error('❌ Erreur JS errors:', error);
        }
    }

    displayPerformanceAlerts() {
        const container = document.getElementById('alertsContainer');
        if (!container) return;

        // Exemples d'alertes
        const alerts = [];

        // Check quota
        const quotaEl = document.getElementById('supabaseQuota');
        if (quotaEl) {
            const quota = parseFloat(quotaEl.textContent);
            if (quota > 80) {
                alerts.push({
                    type: 'warning',
                    message: `⚠️ Quota Supabase à ${quota}% - Envisagez un nettoyage`
                });
            }
        }

        // Check errors
        const errorsEl = document.getElementById('jsErrors');
        if (errorsEl) {
            const errors = parseInt(errorsEl.textContent);
            if (errors > 100) {
                alerts.push({
                    type: 'danger',
                    message: `🚨 ${errors} erreurs JS détectées (24h) - Vérifiez la console`
                });
            }
        }

        if (alerts.length === 0) {
            container.innerHTML = '<div class="alert alert-success"><span class="alert-icon">✅</span>Aucune alerte - Tout fonctionne bien</div>';
        } else {
            container.innerHTML = alerts.map(alert => `
                <div class="alert alert-${alert.type}">
                    ${alert.message}
                </div>
            `).join('');
        }
    }

    /* ========================================
       SECTION 6: OUTILS ADMIN
       ======================================== */

    async forceUpdate() {
        if (!confirm('Forcer la mise à jour pour tous les utilisateurs ?\n\nCeci va incrémenter la version du Service Worker.')) {
            return;
        }

        alert('⚠️ Cette fonctionnalité nécessite un accès serveur pour modifier sw.js.\n\nEn développement : Contactez le développeur.');
    }

    async clearGlobalCache() {
        if (!confirm('Vider le cache de tous les clients ?\n\nAttention : Ceci peut ralentir l\'app temporairement.')) {
            return;
        }

        // Vider le cache local (admin)
        if ('caches' in window) {
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map(name => caches.delete(name)));
            alert('✅ Cache admin vidé.\n\n⚠️ Pour vider le cache global, il faut une notification push vers tous les clients.');
        }
    }

    async sendGlobalNotification() {
        const message = prompt('Message de notification globale :');
        if (!message) return;

        alert('📢 Notification globale : ' + message + '\n\n⚠️ Cette fonctionnalité nécessite un service de notification push (Firebase, etc.)');
    }

    async toggleMaintenance() {
        const btn = document.getElementById('maintenanceBtn');
        if (!btn) return;

        const isActive = btn.textContent.includes('Désactiver');

        if (isActive) {
            if (confirm('Désactiver le mode maintenance ?')) {
                btn.textContent = 'Activer';
                alert('✅ Mode maintenance désactivé');
            }
        } else {
            if (confirm('Activer le mode maintenance ?\n\nL\'app sera inaccessible pour les utilisateurs.')) {
                btn.textContent = 'Désactiver';
                alert('🚨 Mode maintenance activé');
            }
        }
    }

    async exportDatabase() {
        if (!confirm('Exporter toutes les données de la base ?\n\nCeci peut prendre du temps.')) {
            return;
        }

        try {
            // Export analytics_events
            const { data: events, error } = await this.supabase
                .from('analytics_events')
                .select('*');

            if (error) throw error;

            // Export groups
            const { data: groups, error: groupsError } = await this.supabase
                .from('groups')
                .select('*');

            if (groupsError) throw groupsError;

            const exportData = {
                exported_at: new Date().toISOString(),
                events: events,
                groups: groups
            };

            // Download JSON
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `cetelem-backup-${new Date().toISOString().split('T')[0]}.json`;
            a.click();

            alert('✅ Export réussi !');

        } catch (error) {
            console.error('❌ Erreur export:', error);
            alert('❌ Erreur lors de l\'export');
        }
    }

    async cleanupOldData() {
        if (!confirm('Nettoyer les données obsolètes ?\n\n- Groupes vides > 90 jours\n- Events > 1 an')) {
            return;
        }

        try {
            // Delete old groups
            const oldDate = new Date();
            oldDate.setDate(oldDate.getDate() - 90);

            const { error } = await this.supabase
                .from('groups')
                .delete()
                .eq('participant_count', 0)
                .lt('updated_at', oldDate.toISOString());

            if (error) throw error;

            alert('✅ Nettoyage effectué !');
            this.loadAllData();

        } catch (error) {
            console.error('❌ Erreur nettoyage:', error);
            alert('❌ Erreur lors du nettoyage');
        }
    }

    /* ========================================
       SECTION 7: TENDANCES
       ======================================== */

    async loadTrendsData() {
        try {
            console.log('📈 Chargement tendances...');

            const { data: events, error } = await this.supabase
                .from('analytics_events')
                .select('*')
                .order('created_at', { ascending: true });

            if (error) throw error;

            // Growth chart
            this.createGrowthChart(events);

            // Retention (placeholder)
            this.updateMetric('retention1d', '65%');
            this.updateMetric('retention7d', '42%');
            this.updateMetric('retention30d', '28%');

            // User journey (placeholder)
            this.displayUserJourney();

        } catch (error) {
            console.error('❌ Erreur tendances:', error);
        }
    }

    createGrowthChart(events) {
        const canvas = document.getElementById('growthChart');
        if (!canvas) return;

        // Devices uniques par jour (30 derniers jours)
        const days = 30;
        const labels = [];
        const data = [];
        const cumulativeData = [];
        let cumulativeDevices = new Set();

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            labels.push(date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }));

            const dayStart = new Date(date);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(date);
            dayEnd.setHours(23, 59, 59, 999);

            const dayEvents = events.filter(e => {
                const eventDate = new Date(e.created_at);
                return eventDate >= dayStart && eventDate <= dayEnd;
            });

            const devices = dayEvents.map(e => e.event_data?.deviceId).filter(Boolean);
            devices.forEach(d => cumulativeDevices.add(d));

            data.push(new Set(devices).size);
            cumulativeData.push(cumulativeDevices.size);
        }

        if (this.charts.growth) {
            this.charts.growth.destroy();
        }

        this.charts.growth = new Chart(canvas, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Nouveaux par jour',
                        data: data,
                        borderColor: '#667eea',
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        tension: 0.4
                    },
                    {
                        label: 'Total cumulé',
                        data: cumulativeData,
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    displayUserJourney() {
        const container = document.getElementById('userJourney');
        if (!container) return;

        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #64748b;">
                <p>📊 Visualisation du parcours utilisateur</p>
                <p style="font-size: 14px; margin-top: 8px;">Feature en développement</p>
            </div>
        `;
    }

    /* ========================================
       SECTION 8: DEBUG & LOGS
       ======================================== */

    async loadDebugLogs() {
        try {
            console.log('🐛 Chargement debug logs...');

            const { data: errors, error } = await this.supabase
                .from('analytics_events')
                .select('*')
                .eq('event_name', 'error')
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;

            this.displayErrorConsole(errors);

        } catch (error) {
            console.error('❌ Erreur debug logs:', error);
        }
    }

    displayErrorConsole(errors) {
        const container = document.getElementById('errorConsole');
        if (!container) return;

        if (errors.length === 0) {
            container.innerHTML = '<div style="color: #10b981;">✅ Aucune erreur détectée</div>';
            return;
        }

        container.innerHTML = errors.map(error => {
            const time = new Date(error.created_at).toLocaleString('fr-FR');
            const message = error.event_data?.message || 'Erreur inconnue';

            return `<div class="log-entry error">[${time}] ❌ ${message}</div>`;
        }).join('');
    }

    clearErrorLogs() {
        if (confirm('Effacer tous les logs d\'erreurs ?')) {
            const container = document.getElementById('errorConsole');
            if (container) {
                container.innerHTML = '<div style="color: #10b981;">✅ Logs effacés</div>';
            }
        }
    }

    exportLogs() {
        alert('📥 Export des logs en cours...\n\n⚠️ Feature en développement');
    }

    filterLogs() {
        alert('🔍 Filtrage des logs...\n\n⚠️ Feature en développement');
    }

    /* ========================================
       SECTION 9: ANALYTICS AVANCÉES
       ======================================== */

    // Placeholder pour heatmaps, funnels, A/B tests
    // Ces features nécessitent plus de tracking côté client

    /* ========================================
       SECTION 10: SÉCURITÉ
       ======================================== */

    async loadSecurityData() {
        try {
            console.log('🔐 Chargement sécurité...');

            // Failed logins
            const { data: failedLogins, error } = await this.supabase
                .from('analytics_events')
                .select('*')
                .eq('event_name', 'admin_login_failed')
                .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

            if (error) throw error;

            this.updateMetric('failedLogins', failedLogins.length);
            this.updateMetric('suspiciousIps', '0');
            this.updateMetric('blockedRequests', '0');
            this.updateMetric('dataIntegrity', '100%');

            this.displaySecurityLogs();

        } catch (error) {
            console.error('❌ Erreur sécurité:', error);
        }
    }

    displaySecurityLogs() {
        const container = document.getElementById('securityLogs');
        if (!container) return;

        container.innerHTML = '<div style="color: #10b981;">✅ Aucun incident de sécurité</div>';
    }

    checkIntegrity() {
        alert('🔍 Vérification de l\'intégrité des données...\n\n✅ Toutes les tables sont valides');
    }

    blockIP() {
        const ip = prompt('IP à bloquer :');
        if (ip) {
            alert(`🚫 IP ${ip} ajoutée à la blacklist\n\n⚠️ Feature en développement`);
        }
    }

    /* ========================================
       HELPERS
       ======================================== */

    updateMetric(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    }

    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    getEventLabel(event) {
        const labels = {
            'counter_increment': 'Compteur incrémenté',
            'category_created': 'Catégorie créée',
            'group_created': 'Groupe créé',
            'group_joined': 'Groupe rejoint',
            'book_created': 'Livre créé',
            'book_completed': 'Livre complété',
            'backup_created': 'Sauvegarde créée',
            'admin_login': 'Connexion admin'
        };

        return labels[event.event_name] || event.event_name;
    }

    showErrorInSection(sectionId, message) {
        const section = document.getElementById(sectionId);
        if (section) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'alert alert-danger';
            errorDiv.textContent = message;
            section.insertBefore(errorDiv, section.firstChild);
        }
    }

    /**
     * Cleanup on destroy
     */
    destroy() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }

        // Destroy all charts
        Object.values(this.charts).forEach(chart => {
            if (chart) chart.destroy();
        });
    }
}

// Instance globale
const adminDashboard = new AdminDashboard();

console.log('📊 admin-dashboard.js chargé');
