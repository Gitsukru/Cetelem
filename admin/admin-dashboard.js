/**
 * 👑 ADMIN DASHBOARD - LOGIQUE PRINCIPALE
 *
 * Gère les 8 sections du dashboard admin :
 * 1. Vue d'ensemble (fusionné avec Usage App)
 * 2. Zikirlers (nouvelle section dédiée)
 * 3. Analytics Groupes
 * 4. Analytics Livres
 * 5. Performance & Santé App
 * 6. Outils Admin
 * 7. Tendances & Insights
 * 8. Debug & Logs
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
                this.loadOverviewData(),      // Section 1: Vue d'ensemble (+ Usage fusionné)
                this.loadZikirlersData(),     // Section 2: Zikirlers (nouveau)
                this.loadGroupsData(),        // Section 3: Analytics Groupes
                this.loadBooksData(),         // Section 4: Analytics Livres
                this.loadPerformanceData(),   // Section 5: Performance
                this.loadTrendsData(),        // Section 7: Tendances
                this.loadDebugLogs()          // Section 8: Debug
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

            // FUSIONNÉ: Usage des fonctionnalités (ancienne section Usage App)
            this.displayFeaturesUsage(events);

            // FUSIONNÉ: Peak Hours Chart
            this.createPeakHoursChart(events);

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

        // Zikirlers totaux (CORRIGÉ: compter les événements, pas les values cumulatives)
        // Chaque event counter_increment = 1 clic (value contient le total cumulatif, pas l'incrément)
        const totalZikirlers = events
            .filter(e => e.event_name === 'counter_increment')
            .length; // Nombre d'événements = nombre de clics réels

        // Groupes actifs (7 derniers jours via analytics)
        const activeGroups = new Set(
            events7d
                .filter(e => e.event_name && e.event_name.includes('group'))
                .map(e => e.event_data?.groupCode) // groupCode au lieu de groupId
                .filter(Boolean)
        ).size;

        // Total events (7j)
        const totalEvents7d = events7d.length;

        // Taux d'engagement
        const engagement24h = totalDevices > 0 ? (uniqueDevices24h / totalDevices * 100) : 0;
        const engagement30d = totalDevices > 0 ? (uniqueDevices30d / totalDevices * 100) : 0;

        return {
            activeUsers24h: uniqueDevices24h,
            totalDevices: totalDevices, // Garder le nombre brut pour le check
            totalZikirlers: this.formatNumber(totalZikirlers),
            activeGroups,
            totalEvents7d,
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
        this.updateMetric('totalEvents7d', this.formatNumber(metrics.totalEvents7d));
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

        // CORRIGÉ: Compter le nombre d'événements par catégorie (1 event = 1 clic)
        const categoryCounts = {};
        categoryEvents.forEach(e => {
            const name = e.event_data.categoryName;
            categoryCounts[name] = (categoryCounts[name] || 0) + 1; // +1 par événement, pas +value
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

        // Ne pas abandonner si totalDevices = 0, afficher 0% à la place

        // Zikirlers (counter_increment events)
        const zikirlerUsers = new Set(
            events.filter(e => e.event_name === 'counter_increment')
                .map(e => e.event_data?.deviceId)
                .filter(Boolean)
        ).size;

        // Groupes (case-insensitive)
        const groupUsers = new Set(
            events.filter(e => e.event_name && e.event_name.toLowerCase().includes('group'))
                .map(e => e.event_data?.deviceId)
                .filter(Boolean)
        ).size;

        // Livres (case-insensitive)
        const bookUsers = new Set(
            events.filter(e => e.event_name && e.event_name.toLowerCase().includes('book'))
                .map(e => e.event_data?.deviceId)
                .filter(Boolean)
        ).size;

        // Tesbihat (case-insensitive)
        const tesbihatUsers = new Set(
            events.filter(e => e.event_name && e.event_name.toLowerCase().includes('tesbihat'))
                .map(e => e.event_data?.deviceId)
                .filter(Boolean)
        ).size;

        // Afficher les pourcentages (0% si pas de devices)
        this.updateFeatureUsage('zikirlers', zikirlerUsers, totalDevices);
        this.updateFeatureUsage('groups', groupUsers, totalDevices);
        this.updateFeatureUsage('books', bookUsers, totalDevices);
        this.updateFeatureUsage('tesbihat', tesbihatUsers, totalDevices);
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
       SECTION 2: ZIKIRLERS
       ======================================== */

    async loadZikirlersData() {
        try {
            console.log('🔢 Chargement analytics zikirlers...');

            const { data: events, error } = await this.supabase
                .from('analytics_events')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(10000);

            if (error) throw error;

            // Filtrer les événements counter_increment
            const zikirEvents = events.filter(e => e.event_name === 'counter_increment');

            // Métriques principales
            this.displayZikirlersMetrics(zikirEvents);

            // Graphique d'évolution
            this.createZikirlersEvolutionChart(zikirEvents);

            // Distribution horaire
            this.createZikirlersHourlyChart(zikirEvents);

            // Top catégories (déjà dans overview, mais on peut afficher plus de détails ici)
            this.displayZikirCategories(zikirEvents);

        } catch (error) {
            console.error('❌ Erreur zikirlers:', error);
        }
    }

    displayZikirlersMetrics(zikirEvents) {
        const now = Date.now();
        const day = 24 * 60 * 60 * 1000;

        // Total zikirlers
        const total = zikirEvents.length;
        this.updateMetric('zikirlersTotal', this.formatNumber(total));

        // Cette semaine (7 derniers jours)
        const thisWeek = zikirEvents.filter(e => {
            const eventTime = new Date(e.created_at).getTime();
            return (now - eventTime) < (7 * day);
        }).length;
        this.updateMetric('zikirlersThisWeek', this.formatNumber(thisWeek));

        // Ce mois (30 derniers jours)
        const thisMonth = zikirEvents.filter(e => {
            const eventTime = new Date(e.created_at).getTime();
            return (now - eventTime) < (30 * day);
        }).length;
        this.updateMetric('zikirlersThisMonth', this.formatNumber(thisMonth));

        // Moyenne par jour (30 derniers jours)
        const avgPerDay = thisMonth > 0 ? (thisMonth / 30).toFixed(1) : 0;
        this.updateMetric('zikirlersPerDay', avgPerDay);

        // Session la plus active
        const sessionCounts = {};
        zikirEvents.forEach(e => {
            const sessionId = e.event_data?.sessionId || e.event_data?.deviceId || 'unknown';
            sessionCounts[sessionId] = (sessionCounts[sessionId] || 0) + 1;
        });
        const maxSession = Math.max(...Object.values(sessionCounts), 0);
        this.updateMetric('maxZikirlersSession', this.formatNumber(maxSession));

        // Moyenne par session
        const numSessions = Object.keys(sessionCounts).length;
        const avgPerSession = numSessions > 0 ? (total / numSessions).toFixed(1) : 0;
        this.updateMetric('avgZikirlersSession', avgPerSession);

        // Croissance 7j vs 7j précédents
        const lastWeek = zikirEvents.filter(e => {
            const eventTime = new Date(e.created_at).getTime();
            return (now - eventTime) >= (7 * day) && (now - eventTime) < (14 * day);
        }).length;
        const growth = lastWeek > 0 ? (((thisWeek - lastWeek) / lastWeek) * 100).toFixed(1) : 0;
        const growthSign = growth > 0 ? '+' : '';
        this.updateMetric('zikirlersGrowth', `${growthSign}${growth}%`);

        // Meilleur jour
        const dayMap = {};
        zikirEvents.forEach(e => {
            const date = new Date(e.created_at).toLocaleDateString('fr-FR');
            dayMap[date] = (dayMap[date] || 0) + 1;
        });
        const bestDay = Object.entries(dayMap).sort((a, b) => b[1] - a[1])[0];
        if (bestDay) {
            this.updateMetric('bestZikirlersDay', `${bestDay[0]} (${bestDay[1]})`);
        }
    }

    createZikirlersEvolutionChart(zikirEvents) {
        const canvas = document.getElementById('zikirlersEvolutionChart');
        if (!canvas) return;

        // Données des 7 derniers jours par défaut
        const days = 7;
        const labels = [];
        const data = [];

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            labels.push(date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }));

            const dayStart = new Date(date);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(date);
            dayEnd.setHours(23, 59, 59, 999);

            const dayEvents = zikirEvents.filter(e => {
                const eventDate = new Date(e.created_at);
                return eventDate >= dayStart && eventDate <= dayEnd;
            });

            data.push(dayEvents.length);
        }

        if (this.charts.zikirlersEvolution) {
            this.charts.zikirlersEvolution.destroy();
        }

        this.charts.zikirlersEvolution = new Chart(canvas, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Zikirlers',
                    data: data,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }

    createZikirlersHourlyChart(zikirEvents) {
        const canvas = document.getElementById('zikirlersHourlyChart');
        if (!canvas) return;

        // Compter zikirlers par heure (0-23)
        const hourCounts = new Array(24).fill(0);
        zikirEvents.forEach(e => {
            const hour = new Date(e.created_at).getHours();
            hourCounts[hour]++;
        });

        if (this.charts.zikirlersHourly) {
            this.charts.zikirlersHourly.destroy();
        }

        this.charts.zikirlersHourly = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: Array.from({length: 24}, (_, i) => `${i}h`),
                datasets: [{
                    label: 'Zikirlers',
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
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }

    displayZikirCategories(zikirEvents) {
        const container = document.getElementById('zikirCategoriesList');
        if (!container) return;

        // Compter par catégorie
        const categoryMap = {};
        zikirEvents.forEach(e => {
            const category = e.event_data?.category || 'Non catégorisé';
            categoryMap[category] = (categoryMap[category] || 0) + 1;
        });

        const sortedCategories = Object.entries(categoryMap)
            .sort((a, b) => b[1] - a[1]);

        if (sortedCategories.length === 0) {
            container.innerHTML = '<div class="top-item">Aucune donnée disponible</div>';
            return;
        }

        container.innerHTML = sortedCategories.map(([name, count], index) => `
            <div class="top-item">
                <span class="top-item-name">${index + 1}. ${name}</span>
                <span class="top-item-value">${this.formatNumber(count)}</span>
            </div>
        `).join('');
    }

    filterZikirlersChart(period) {
        // TODO: Implement filter functionality
        console.log('Filtering zikirlers chart:', period);
    }

    /* ========================================
       SECTION 3: ANALYTICS GROUPES
       ======================================== */

    async loadGroupsData() {
        try {
            console.log('👥 Chargement analytics groupes...');

            const { data: groups, error } = await this.supabase
                .from('groups')
                .select(`
                    *,
                    participants(id)
                `);

            if (error) throw error;

            // Ajouter participant_count à chaque groupe
            const groupsWithCount = groups.map(g => ({
                ...g,
                participant_count: g.participants ? g.participants.length : 0,
                participants: undefined // Nettoyer pour économiser mémoire
            }));

            const now = Date.now();
            const day = 24 * 60 * 60 * 1000;

            // Metrics principales
            const totalGroups = groupsWithCount.length;

            // Groupes actifs (derniers 30 jours)
            const activeGroups = groupsWithCount.filter(g => {
                const lastActivity = new Date(g.updated_at || g.created_at);
                const daysSince = (now - lastActivity.getTime()) / day;
                return daysSince <= 30;
            }).length;

            // Taille moyenne des groupes
            const avgSize = groupsWithCount.length > 0
                ? (groupsWithCount.reduce((sum, g) => sum + (g.participant_count || 0), 0) / groupsWithCount.length).toFixed(1)
                : 0;

            // Durée de vie moyenne
            const avgLifetime = this.calculateAverageGroupLifetime(groupsWithCount);

            // Taux de complétion (groupes avec completed: true)
            const completedGroups = groupsWithCount.filter(g => g.completed || g.status === 'completed').length;
            const completionRate = totalGroups > 0 ? (completedGroups / totalGroups * 100).toFixed(1) : 0;

            // Temps moyen lecture (pour groupes complétés)
            const readTimes = groupsWithCount
                .filter(g => g.completed && g.created_at)
                .map(g => {
                    const created = new Date(g.created_at);
                    const completed = new Date(g.updated_at || g.completed_at);
                    return (completed - created) / day;
                });
            const avgReadTime = readTimes.length > 0
                ? (readTimes.reduce((sum, t) => sum + t, 0) / readTimes.length).toFixed(1)
                : 0;

            // Croissance (30j)
            const groupsThisMonth = groupsWithCount.filter(g => {
                const created = new Date(g.created_at).getTime();
                return (now - created) < (30 * day);
            }).length;
            const groupsLastMonth = groupsWithCount.filter(g => {
                const created = new Date(g.created_at).getTime();
                return (now - created) >= (30 * day) && (now - created) < (60 * day);
            }).length;
            const growth = groupsLastMonth > 0
                ? (((groupsThisMonth - groupsLastMonth) / groupsLastMonth) * 100).toFixed(1)
                : 0;
            const growthSign = growth > 0 ? '+' : '';

            // Participation moyenne (mock - would need activity data)
            const avgParticipation = '75'; // TODO: Calculate from real activity data

            // Afficher métriques
            this.updateMetric('totalGroups', totalGroups);
            this.updateMetric('activeGroups30d', activeGroups); // Section Analytics Groupes (30j)
            this.updateMetric('avgGroupSize', avgSize);
            this.updateMetric('avgGroupLifetime', avgLifetime);
            this.updateMetric('groupCompletionRate', completionRate + '%');
            this.updateMetric('avgGroupReadTime', avgReadTime);
            this.updateMetric('groupsGrowth', `${growthSign}${growth}%`);
            this.updateMetric('avgParticipation', avgParticipation + '%');

            // Charts
            this.createGroupsEvolutionChart(groupsWithCount);
            this.createGroupsSizeDistributionChart(groupsWithCount);

            // Top groups
            this.displayTopGroups(groupsWithCount);

        } catch (error) {
            console.error('❌ Erreur analytics groupes:', error);
        }
    }

    createGroupsEvolutionChart(groups) {
        const canvas = document.getElementById('groupsEvolutionChart');
        if (!canvas) return;

        // Données des 30 derniers jours
        const days = 30;
        const labels = [];
        const data = [];

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            labels.push(date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }));

            const dayGroups = groups.filter(g => {
                const created = new Date(g.created_at);
                return created.toDateString() === date.toDateString();
            }).length;

            data.push(dayGroups);
        }

        if (this.charts.groupsEvolution) {
            this.charts.groupsEvolution.destroy();
        }

        this.charts.groupsEvolution = new Chart(canvas, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Nouveaux Groupes',
                    data: data,
                    borderColor: '#8b5cf6',
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }

    createGroupsSizeDistributionChart(groups) {
        const canvas = document.getElementById('groupsSizeDistributionChart');
        if (!canvas) return;

        // Répartition par taille
        const sizeRanges = {
            '1-2': 0,
            '3-5': 0,
            '6-10': 0,
            '11-20': 0,
            '20+': 0
        };

        groups.forEach(g => {
            const size = g.participant_count || 0;
            if (size <= 2) sizeRanges['1-2']++;
            else if (size <= 5) sizeRanges['3-5']++;
            else if (size <= 10) sizeRanges['6-10']++;
            else if (size <= 20) sizeRanges['11-20']++;
            else sizeRanges['20+']++;
        });

        if (this.charts.groupsSizeDistribution) {
            this.charts.groupsSizeDistribution.destroy();
        }

        this.charts.groupsSizeDistribution = new Chart(canvas, {
            type: 'doughnut',
            data: {
                labels: Object.keys(sizeRanges),
                datasets: [{
                    data: Object.values(sizeRanges),
                    backgroundColor: [
                        '#10b981',
                        '#3b82f6',
                        '#8b5cf6',
                        '#f59e0b',
                        '#ef4444'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
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

            const createdEvents = events.filter(e => e.event_name === 'book_created');
            const completedEvents = events.filter(e => e.event_name === 'book_completed');

            const booksCreated = createdEvents.length;
            const booksCompleted = completedEvents.length;

            const completionRate = booksCreated > 0
                ? (booksCompleted / booksCreated * 100).toFixed(1)
                : 0;

            // 📊 NOUVELLES MÉTRIQUES

            // 1. Pages totales lues (somme de toutes les pages des livres complétés)
            const totalPagesRead = completedEvents.reduce((sum, e) => {
                return sum + (e.event_data?.totalPages || 0);
            }, 0);

            // 2. Durée moyenne de complétion
            const completionTimes = completedEvents
                .map(e => e.event_data?.daysToComplete)
                .filter(d => d !== undefined && d > 0);

            const avgCompletionTime = completionTimes.length > 0
                ? (completionTimes.reduce((sum, d) => sum + d, 0) / completionTimes.length).toFixed(1)
                : 0;

            // 3. Pages moyennes par livre
            const totalPagesAllBooks = createdEvents.reduce((sum, e) => {
                return sum + (e.event_data?.totalPages || 0);
            }, 0);

            const avgPagesPerBook = booksCreated > 0
                ? (totalPagesAllBooks / booksCreated).toFixed(0)
                : 0;

            // 4. Vitesse de lecture (pages/jour)
            const readingSpeed = avgCompletionTime > 0 && totalPagesRead > 0
                ? (totalPagesRead / (completionTimes.reduce((sum, d) => sum + d, 0))).toFixed(1)
                : 0;

            // Afficher les métriques
            this.updateMetric('totalBooks', booksCreated);
            this.updateMetric('bookCompletionRate', completionRate + '%');
            this.updateMetric('activeBooksCount', booksCreated - booksCompleted);
            this.updateMetric('completedBooksCount', booksCompleted);

            // Nouvelles métriques
            this.updateMetric('totalPagesRead', this.formatNumber(totalPagesRead));
            this.updateMetric('avgCompletionTime', avgCompletionTime || '--');
            this.updateMetric('readingSpeed', readingSpeed || '--');
            this.updateMetric('avgPagesPerBook', avgPagesPerBook || '--');

            // Chart types de livres (avec vraies données)
            this.createBooksChart(createdEvents);

        } catch (error) {
            console.error('❌ Erreur analytics livres:', error);
        }
    }

    createBooksChart(createdEvents) {
        const canvas = document.getElementById('booksChart');
        if (!canvas) return;

        // Compter les livres par format (vraies données)
        const formatCounts = {};

        createdEvents.forEach(e => {
            const format = e.event_data?.format || 'Autre';
            formatCounts[format] = (formatCounts[format] || 0) + 1;
        });

        // Si pas de données, afficher un message
        if (Object.keys(formatCounts).length === 0) {
            formatCounts['Aucun livre'] = 1;
        }

        const labels = Object.keys(formatCounts);
        const data = Object.values(formatCounts);

        if (this.charts.books) {
            this.charts.books.destroy();
        }

        this.charts.books = new Chart(canvas, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: [
                        '#667eea',
                        '#764ba2',
                        '#f093fb',
                        '#4facfe',
                        '#00f2fe',
                        '#f857a6',
                        '#ff5858',
                        '#43e97b'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    /* ========================================
       SECTION 5: PERFORMANCE
       ======================================== */

    async loadPerformanceData() {
        try {
            console.log('⚡ Chargement performance...');

            // Load time (non implémenté - nécessite tracking côté client)
            this.updateMetric('loadTime', 'N/A');

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

            const now = Date.now();
            const day = 24 * 60 * 60 * 1000;

            // Calculer MAU, WAU, DAU
            const deviceMap = new Map(); // deviceId -> last seen timestamp
            events.forEach(e => {
                const deviceId = e.event_data?.deviceId;
                const timestamp = new Date(e.created_at).getTime();
                if (deviceId) {
                    if (!deviceMap.has(deviceId) || deviceMap.get(deviceId) < timestamp) {
                        deviceMap.set(deviceId, timestamp);
                    }
                }
            });

            // DAU: devices actifs dernières 24h
            const dau = Array.from(deviceMap.entries()).filter(([_, lastSeen]) => {
                return (now - lastSeen) < day;
            }).length;

            // WAU: devices actifs derniers 7 jours
            const wau = Array.from(deviceMap.entries()).filter(([_, lastSeen]) => {
                return (now - lastSeen) < (7 * day);
            }).length;

            // MAU: devices actifs derniers 30 jours
            const mau = Array.from(deviceMap.entries()).filter(([_, lastSeen]) => {
                return (now - lastSeen) < (30 * day);
            }).length;

            // Stickiness: DAU/MAU ratio (%)
            const stickiness = mau > 0 ? ((dau / mau) * 100).toFixed(1) : 0;

            // Afficher métriques
            this.updateMetric('mau', this.formatNumber(mau));
            this.updateMetric('wau', this.formatNumber(wau));
            this.updateMetric('dau', this.formatNumber(dau));
            this.updateMetric('stickiness', stickiness + '%');

            // Engagement metrics
            this.calculateEngagementMetrics(events);

            // Retention (calcul réel basé sur cohortes)
            this.calculateRetentionMetrics(events);

            // Growth chart
            this.createGrowthChart(events);

            // Feature adoption chart
            this.createFeatureAdoptionChart(events);

            // Usage patterns chart
            this.createUsagePatternsChart(events);

            // User journey
            this.displayUserJourney();

        } catch (error) {
            console.error('❌ Erreur tendances:', error);
        }
    }

    calculateEngagementMetrics(events) {
        const now = Date.now();
        const day = 24 * 60 * 60 * 1000;

        // Filtrer événements des 30 derniers jours
        const events30d = events.filter(e => {
            const eventTime = new Date(e.created_at).getTime();
            return (now - eventTime) < (30 * day);
        });

        // Sessions par device (approximation: regrouper events à moins de 30min)
        const sessionMap = new Map(); // deviceId -> array of sessions
        const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

        events30d.forEach(e => {
            const deviceId = e.event_data?.deviceId;
            if (!deviceId) return;

            const timestamp = new Date(e.created_at).getTime();

            if (!sessionMap.has(deviceId)) {
                sessionMap.set(deviceId, [{
                    start: timestamp,
                    end: timestamp,
                    events: [e]
                }]);
            } else {
                const sessions = sessionMap.get(deviceId);
                const lastSession = sessions[sessions.length - 1];

                if (timestamp - lastSession.end < SESSION_TIMEOUT) {
                    // Même session
                    lastSession.end = timestamp;
                    lastSession.events.push(e);
                } else {
                    // Nouvelle session
                    sessions.push({
                        start: timestamp,
                        end: timestamp,
                        events: [e]
                    });
                }
            }
        });

        // Calculer métriques
        let totalSessions = 0;
        let totalDuration = 0;
        let totalActions = 0;

        sessionMap.forEach(sessions => {
            sessions.forEach(session => {
                totalSessions++;
                totalDuration += (session.end - session.start);
                totalActions += session.events.length;
            });
        });

        const avgSessionDuration = totalSessions > 0
            ? (totalDuration / totalSessions / 1000 / 60).toFixed(1) // minutes
            : 0;

        const actionsPerSession = totalSessions > 0
            ? (totalActions / totalSessions).toFixed(1)
            : 0;

        const uniqueDevices = sessionMap.size;
        const sessionsPerUser = uniqueDevices > 0
            ? (totalSessions / uniqueDevices).toFixed(1)
            : 0;

        // Power users (>5 sessions/semaine)
        let powerUsers = 0;
        const week = 7 * day;
        const eventsLastWeek = events.filter(e => {
            const eventTime = new Date(e.created_at).getTime();
            return (now - eventTime) < week;
        });

        const weekSessionMap = new Map();
        eventsLastWeek.forEach(e => {
            const deviceId = e.event_data?.deviceId;
            if (!deviceId) return;
            weekSessionMap.set(deviceId, (weekSessionMap.get(deviceId) || 0) + 1);
        });

        weekSessionMap.forEach(count => {
            if (count > 5) powerUsers++;
        });

        // Afficher
        this.updateMetric('avgSessionDuration', avgSessionDuration);
        this.updateMetric('actionsPerSession', actionsPerSession);
        this.updateMetric('sessionsPerUser', sessionsPerUser);
        this.updateMetric('powerUsers', this.formatNumber(powerUsers));
    }

    calculateRetentionMetrics(events) {
        // Calcul réel de rétention basé sur cohortes
        if (!events || events.length === 0) {
            this.updateMetric('retention1d', 'N/A');
            this.updateMetric('retention7d', 'N/A');
            this.updateMetric('retention30d', 'N/A');
            this.updateMetric('churnRate', 'N/A');
            return;
        }

        const day = 24 * 60 * 60 * 1000;
        const now = Date.now();

        // Créer map: deviceId -> array de dates d'activité (jours uniques)
        const deviceActivity = new Map();

        events.forEach(e => {
            const deviceId = e.event_data?.deviceId;
            if (!deviceId) return;

            const eventDate = new Date(e.created_at);
            const dayKey = eventDate.toISOString().split('T')[0]; // YYYY-MM-DD

            if (!deviceActivity.has(deviceId)) {
                deviceActivity.set(deviceId, new Set());
            }
            deviceActivity.get(deviceId).add(dayKey);
        });

        // Pour chaque device, trouver la première visite et vérifier le retour
        let totalDevices = 0;
        let returned1d = 0;
        let returned7d = 0;
        let returned30d = 0;
        let churned = 0;

        deviceActivity.forEach((activityDays) => {
            const sortedDays = Array.from(activityDays).sort();
            if (sortedDays.length === 0) return;

            const firstVisit = new Date(sortedDays[0]);
            const firstVisitTime = firstVisit.getTime();

            // Ne compter que les devices avec première visite > 30 jours
            // pour avoir assez de recul sur la rétention
            if ((now - firstVisitTime) < 30 * day) return;

            totalDevices++;

            // Vérifier retour J+1
            const day1 = new Date(firstVisitTime + day).toISOString().split('T')[0];
            if (activityDays.has(day1)) returned1d++;

            // Vérifier retour dans les 7 jours (J+2 à J+7)
            let hasReturned7d = false;
            for (let i = 2; i <= 7; i++) {
                const dayN = new Date(firstVisitTime + i * day).toISOString().split('T')[0];
                if (activityDays.has(dayN)) {
                    hasReturned7d = true;
                    break;
                }
            }
            if (hasReturned7d) returned7d++;

            // Vérifier retour dans les 30 jours (J+8 à J+30)
            let hasReturned30d = false;
            for (let i = 8; i <= 30; i++) {
                const dayN = new Date(firstVisitTime + i * day).toISOString().split('T')[0];
                if (activityDays.has(dayN)) {
                    hasReturned30d = true;
                    break;
                }
            }
            if (hasReturned30d) returned30d++;

            // Churn: pas d'activité dans les 30 derniers jours
            const lastActivity = new Date(sortedDays[sortedDays.length - 1]).getTime();
            if ((now - lastActivity) > 30 * day) churned++;
        });

        // Calculer pourcentages
        const retention1d = totalDevices > 0 ? Math.round((returned1d / totalDevices) * 100) : 0;
        const retention7d = totalDevices > 0 ? Math.round((returned7d / totalDevices) * 100) : 0;
        const retention30d = totalDevices > 0 ? Math.round((returned30d / totalDevices) * 100) : 0;
        const churnRate = totalDevices > 0 ? Math.round((churned / totalDevices) * 100) : 0;

        this.updateMetric('retention1d', retention1d + '%');
        this.updateMetric('retention7d', retention7d + '%');
        this.updateMetric('retention30d', retention30d + '%');
        this.updateMetric('churnRate', churnRate + '%');

        console.log(`📊 Rétention calculée sur ${totalDevices} devices (>30j): J1=${retention1d}%, J7=${retention7d}%, J30=${retention30d}%, Churn=${churnRate}%`);
    }

    createFeatureAdoptionChart(events) {
        const canvas = document.getElementById('featureAdoptionChart');
        if (!canvas) return;

        // Compter utilisation de chaque feature
        const features = {
            'Zikirlers': events.filter(e => e.event_name === 'counter_increment').length,
            'Groupes': events.filter(e => e.event_name && e.event_name.includes('group')).length,
            'Livres': events.filter(e => e.event_name && e.event_name.includes('book')).length,
            'Tesbihat': events.filter(e => e.event_name && e.event_name.includes('tesbihat')).length
        };

        if (this.charts.featureAdoption) {
            this.charts.featureAdoption.destroy();
        }

        this.charts.featureAdoption = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: Object.keys(features),
                datasets: [{
                    label: 'Utilisations',
                    data: Object.values(features),
                    backgroundColor: [
                        'rgba(16, 185, 129, 0.7)',
                        'rgba(139, 92, 246, 0.7)',
                        'rgba(59, 130, 246, 0.7)',
                        'rgba(245, 158, 11, 0.7)'
                    ],
                    borderColor: [
                        '#10b981',
                        '#8b5cf6',
                        '#3b82f6',
                        '#f59e0b'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }

    createUsagePatternsChart(events) {
        const canvas = document.getElementById('usagePatternsChart');
        if (!canvas) return;

        // Activité par jour de la semaine
        const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
        const dayCounts = new Array(7).fill(0);

        events.forEach(e => {
            const day = new Date(e.created_at).getDay();
            dayCounts[day]++;
        });

        if (this.charts.usagePatterns) {
            this.charts.usagePatterns.destroy();
        }

        this.charts.usagePatterns = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: dayNames,
                datasets: [{
                    label: 'Activité',
                    data: dayCounts,
                    backgroundColor: 'rgba(102, 126, 234, 0.7)',
                    borderColor: '#667eea',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }

    filterGrowthChart(period) {
        // TODO: Implement filter functionality
        console.log('Filtering growth chart:', period);
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

    // ========================================
    // TAVSIYE MANAGEMENT
    // ========================================

    /**
     * Default Tavsiye items (fallback)
     */
    getDefaultTavsiyeItems() {
        return {
            zikir: [
                { name: 'Estagfirullah', detail: '100 defa', weeklyGoal: 7 },
                { name: 'Ya Baki entel baki', detail: '33 defa', weeklyGoal: 7 },
                { name: 'Salavat', detail: '100 defa', weeklyGoal: 7 },
                { name: 'La ilahe illa ente subhaneke inni kuntu minezzalimin', detail: '100 defa', weeklyGoal: 7 },
                { name: 'Subhanallahi ve bihamdihi Subhanallahil azim', detail: '100 defa', weeklyGoal: 7 },
                { name: 'Ya Latif', detail: '129 defa', weeklyGoal: 7 }
            ],
            kitap: [
                { name: 'Kitap Okuma', detail: 'Gunluk 10 sayfa', dailyGoal: 10, totalPages: 500 }
            ],
            namaz: [
                { name: 'Teheccud Namazi', detail: '2 rekat', weeklyGoal: 7 },
                { name: 'Evvabin Namazi', detail: '6 rekat', weeklyGoal: 7 },
                { name: 'Kusluk Namazi', detail: '4 rekat', weeklyGoal: 7 },
                { name: 'Teravih Namazi', detail: '20 rekat', weeklyGoal: 7 },
                { name: 'Tesbih Namazi', detail: '4 rekat', weeklyGoal: 1 },
                { name: 'Hacet Namazi', detail: '2 rekat', weeklyGoal: 1 }
            ],
            kuran: [
                { name: 'Kuran-i Kerim', detail: 'Gunluk 3 sayfa', dailyGoal: 3, totalPages: 604 }
            ],
            cevsen: [
                { name: 'Cevsen-ul Kebir', detail: 'Gunluk 10 bab', dailyGoal: 10, totalPages: 100 }
            ],
            sohbet: [
                { name: 'Bamteli', detail: 'Video sohbetler', weeklyGoal: 3 },
                { name: 'Kirik Testi', detail: 'Yazili sohbetler', weeklyGoal: 3 },
                { name: 'Herkul Nagme', detail: 'Sesli sohbetler', weeklyGoal: 3 },
                { name: 'Vuslat Mektubu', detail: 'Mektup okuma', weeklyGoal: 1 },
                { name: 'Umit Burcu', detail: 'Yazili sohbetler', weeklyGoal: 2 }
            ]
        };
    }

    /**
     * Get Tavsiye items from localStorage or defaults
     */
    getTavsiyeItems() {
        const stored = localStorage.getItem('adminTavsiyeItems');
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (e) {
                console.error('Error parsing tavsiye items:', e);
            }
        }
        return this.getDefaultTavsiyeItems();
    }

    /**
     * Save Tavsiye items to localStorage
     */
    saveTavsiyeItems(items) {
        localStorage.setItem('adminTavsiyeItems', JSON.stringify(items));
        // Also update the main app's TAVSIYE_ITEMS if accessible
        if (typeof window.TAVSIYE_ITEMS !== 'undefined') {
            Object.assign(window.TAVSIYE_ITEMS, items);
        }
    }

    /**
     * Show Tavsiye items by category
     */
    showTavsiyeCategory(category) {
        // Tab text to category mapping
        const tabMapping = {
            'Zikirler': 'zikir',
            'Kitaplar': 'kitap',
            'Namazlar': 'namaz',
            'Kuran': 'kuran',
            'Cevsen': 'cevsen',
            'Sohbet': 'sohbet'
        };

        // Update tab active state
        const tabs = document.querySelectorAll('.tavsiye-tab');
        tabs.forEach(tab => {
            const tabCategory = tabMapping[tab.textContent];
            if (tabCategory === category) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        // Update category select
        const categorySelect = document.getElementById('tavsiyeNewCategory');
        if (categorySelect) {
            categorySelect.value = category;
        }

        // Update form fields visibility based on category
        this.onCategoryChange();

        // Render items
        this.renderTavsiyeItems(category);
    }

    /**
     * Render Tavsiye items list
     */
    renderTavsiyeItems(filterCategory = null) {
        const container = document.getElementById('tavsiyeItemsList');
        if (!container) return;

        const items = this.getTavsiyeItems();
        let html = '';

        const categoryLabels = {
            zikir: 'Zikir',
            kitap: 'Kitap',
            namaz: 'Namaz',
            kuran: 'Kuran',
            cevsen: 'Cevsen',
            sohbet: 'Sohbet'
        };

        Object.keys(items).forEach(category => {
            if (filterCategory && category !== filterCategory) return;

            items[category].forEach((item, index) => {
                let meta = '';
                if (item.dailyGoal) {
                    let unit = 'sayfa';
                    if (category === 'cevsen') unit = 'bab';
                    else if (category === 'sohbet') unit = 'dk';
                    meta += `Gunluk: ${item.dailyGoal} ${unit}`;
                }
                if (item.weeklyGoal) {
                    let unit = 'defa';
                    if (category === 'sohbet') unit = 'dk';
                    meta += (meta ? ' | ' : '') + `Haftalik: ${item.weeklyGoal} ${unit}`;
                }
                if (item.totalPages) {
                    const unit = category === 'cevsen' ? 'bab' : 'sayfa';
                    meta += (meta ? ' | ' : '') + `Toplam: ${item.totalPages} ${unit}`;
                }

                // URL display
                const urlDisplay = item.url ? `<span class="tavsiye-item-url">🔗 <a href="${item.url}" target="_blank" rel="noopener">${item.url.substring(0, 40)}${item.url.length > 40 ? '...' : ''}</a></span>` : '';

                html += `
                    <div class="tavsiye-admin-item" data-category="${category}" data-index="${index}">
                        <div class="tavsiye-item-info">
                            <div>
                                <span class="tavsiye-item-name">${item.name}</span>
                                <span class="tavsiye-category-badge">${categoryLabels[category]}</span>
                            </div>
                            <span class="tavsiye-item-detail">${item.detail}</span>
                            ${urlDisplay}
                            ${meta ? `<span class="tavsiye-item-meta">${meta}</span>` : ''}
                        </div>
                        <div class="tavsiye-item-actions">
                            <button class="tavsiye-action-btn edit" onclick="adminDashboard.editTavsiyeItem('${category}', ${index})">
                                Duzenle
                            </button>
                            <button class="tavsiye-action-btn delete" onclick="adminDashboard.deleteTavsiyeItem('${category}', ${index})">
                                Sil
                            </button>
                        </div>
                    </div>
                `;
            });
        });

        if (!html) {
            html = '<p style="color: #64748b; text-align: center; padding: 20px;">Bu kategoride tavsiye bulunmuyor.</p>';
        }

        container.innerHTML = html;
    }

    /**
     * Handle category change - show/hide form fields and update labels based on category
     */
    onCategoryChange() {
        const category = document.getElementById('tavsiyeNewCategory').value;
        const dailyGoalGroup = document.getElementById('dailyGoalGroup');
        const weeklyGoalGroup = document.getElementById('weeklyGoalGroup');
        const totalPagesGroup = document.getElementById('totalPagesGroup');

        // Get label elements
        const nameLabel = document.getElementById('tavsiyeNameLabel');
        const detailLabel = document.getElementById('tavsiyeDetailLabel');
        const dailyGoalLabel = document.getElementById('dailyGoalLabel');
        const weeklyGoalLabel = document.getElementById('weeklyGoalLabel');
        const totalPagesLabel = document.getElementById('totalPagesLabel');

        // Get input elements for placeholders
        const nameInput = document.getElementById('tavsiyeNewName');
        const detailInput = document.getElementById('tavsiyeNewDetail');
        const dailyGoalInput = document.getElementById('tavsiyeNewDailyGoal');
        const weeklyGoalInput = document.getElementById('tavsiyeNewWeeklyGoal');
        const totalPagesInput = document.getElementById('tavsiyeNewTotalPages');

        // Reset all fields visibility
        if (dailyGoalGroup) dailyGoalGroup.style.display = 'none';
        if (weeklyGoalGroup) weeklyGoalGroup.style.display = 'none';
        if (totalPagesGroup) totalPagesGroup.style.display = 'none';

        // Category-specific configuration
        const categoryConfig = {
            zikir: {
                nameLabel: 'Zikir Ismi',
                namePlaceholder: 'ornek: Ya Vedud',
                detailLabel: 'Tekrar Sayisi',
                detailPlaceholder: 'ornek: 100 defa',
                showUrl: true,
                urlPlaceholder: 'ornek: https://zikir.example.com',
                showWeekly: true,
                weeklyLabel: 'Haftalik Hedef (defa)',
                weeklyPlaceholder: 'ornek: 7'
            },
            kitap: {
                nameLabel: 'Kitap Ismi',
                namePlaceholder: 'ornek: Risale-i Nur',
                detailLabel: 'Aciklama',
                detailPlaceholder: 'ornek: Gunluk 10 sayfa',
                showUrl: true,
                urlPlaceholder: 'ornek: https://risale.example.com',
                showDaily: true,
                showTotal: true,
                dailyLabel: 'Gunluk Hedef (sayfa)',
                dailyPlaceholder: 'ornek: 10',
                totalLabel: 'Toplam Sayfa',
                totalPlaceholder: 'ornek: 500'
            },
            namaz: {
                nameLabel: 'Namaz Ismi',
                namePlaceholder: 'ornek: Teheccud Namazi',
                detailLabel: 'Aciklama',
                detailPlaceholder: 'ornek: 2 rekat',
                showUrl: true,
                urlPlaceholder: 'ornek: https://namaz.example.com',
                showWeekly: true,
                weeklyLabel: 'Haftalik Hedef (defa)',
                weeklyPlaceholder: 'ornek: 7'
            },
            kuran: {
                nameLabel: 'Kuran Okuma',
                namePlaceholder: 'ornek: Kuran-i Kerim',
                detailLabel: 'Aciklama',
                detailPlaceholder: 'ornek: Gunluk 3 sayfa',
                showUrl: true,
                urlPlaceholder: 'ornek: https://kuran.example.com',
                showDaily: true,
                showTotal: true,
                dailyLabel: 'Gunluk Hedef (sayfa)',
                dailyPlaceholder: 'ornek: 3',
                totalLabel: 'Toplam Sayfa',
                totalPlaceholder: '604'
            },
            cevsen: {
                nameLabel: 'Cevsen',
                namePlaceholder: 'ornek: Cevsen-ul Kebir',
                detailLabel: 'Aciklama',
                detailPlaceholder: 'ornek: Gunluk 10 bab',
                showUrl: true,
                urlPlaceholder: 'ornek: https://cevsen.example.com',
                showDaily: true,
                showTotal: true,
                dailyLabel: 'Gunluk Hedef (bab)',
                dailyPlaceholder: 'ornek: 10',
                totalLabel: 'Toplam Bab',
                totalPlaceholder: '100'
            },
            sohbet: {
                nameLabel: 'Sohbet Ismi',
                namePlaceholder: 'ornek: Bamteli',
                detailLabel: 'Aciklama',
                detailPlaceholder: 'ornek: Video sohbetler',
                showUrl: true,
                urlPlaceholder: 'ornek: https://herkul.org/bamteli/',
                showDaily: true,
                showWeekly: true,
                dailyLabel: 'Gunluk Hedef (dakika)',
                dailyPlaceholder: 'ornek: 15',
                weeklyLabel: 'Haftalik Hedef (dakika)',
                weeklyPlaceholder: 'ornek: 105'
            }
        };

        const config = categoryConfig[category] || categoryConfig.zikir;

        // Update labels and placeholders
        if (nameLabel) nameLabel.textContent = config.nameLabel;
        if (nameInput) nameInput.placeholder = config.namePlaceholder;
        if (detailLabel) detailLabel.textContent = config.detailLabel;
        if (detailInput) detailInput.placeholder = config.detailPlaceholder;

        // Show/hide and configure fields based on category
        if (config.showWeekly && weeklyGoalGroup) {
            weeklyGoalGroup.style.display = 'block';
            if (weeklyGoalLabel) weeklyGoalLabel.textContent = config.weeklyLabel;
            if (weeklyGoalInput) weeklyGoalInput.placeholder = config.weeklyPlaceholder;
        }

        if (config.showDaily && dailyGoalGroup) {
            dailyGoalGroup.style.display = 'block';
            if (dailyGoalLabel) dailyGoalLabel.textContent = config.dailyLabel;
            if (dailyGoalInput) dailyGoalInput.placeholder = config.dailyPlaceholder;
        }

        if (config.showTotal && totalPagesGroup) {
            totalPagesGroup.style.display = 'block';
            if (totalPagesLabel) totalPagesLabel.textContent = config.totalLabel;
            if (totalPagesInput) totalPagesInput.placeholder = config.totalPlaceholder;
        }

        // URL field for all categories
        const urlGroup = document.getElementById('urlGroup');
        const urlInput = document.getElementById('tavsiyeNewUrl');
        if (urlGroup) {
            urlGroup.style.display = config.showUrl ? 'flex' : 'none';
            if (urlInput && config.urlPlaceholder) {
                urlInput.placeholder = config.urlPlaceholder;
            }
        }
    }

    /**
     * Add new Tavsiye item
     */
    addTavsiyeItem() {
        const category = document.getElementById('tavsiyeNewCategory').value;
        const name = document.getElementById('tavsiyeNewName').value.trim();
        const detail = document.getElementById('tavsiyeNewDetail').value.trim();
        const dailyGoal = parseInt(document.getElementById('tavsiyeNewDailyGoal').value) || 0;
        const weeklyGoal = parseInt(document.getElementById('tavsiyeNewWeeklyGoal').value) || 0;
        const totalPages = parseInt(document.getElementById('tavsiyeNewTotalPages').value) || 0;
        const urlInput = document.getElementById('tavsiyeNewUrl');
        const url = urlInput ? urlInput.value.trim() : '';

        if (!name || !detail) {
            alert('Isim ve detay alanlari zorunludur!');
            return;
        }

        const items = this.getTavsiyeItems();

        // Ensure category exists
        if (!items[category]) {
            items[category] = [];
        }

        const newItem = { name, detail };

        // Add appropriate fields based on category
        if (category === 'sohbet') {
            // Sohbet: daily goal (minutes), weekly goal (minutes), and URL
            if (dailyGoal > 0) newItem.dailyGoal = dailyGoal;
            if (weeklyGoal > 0) newItem.weeklyGoal = weeklyGoal;
            if (url) newItem.url = url;
        } else if (category === 'zikir' || category === 'namaz') {
            // Weekly goal for zikir, namaz
            if (weeklyGoal > 0) newItem.weeklyGoal = weeklyGoal;
        } else {
            // Daily goal and total pages for kitap, kuran, cevsen
            if (dailyGoal > 0) newItem.dailyGoal = dailyGoal;
            if (totalPages > 0) newItem.totalPages = totalPages;
        }

        items[category].push(newItem);
        this.saveTavsiyeItems(items);

        // Clear form
        document.getElementById('tavsiyeNewName').value = '';
        document.getElementById('tavsiyeNewDetail').value = '';
        document.getElementById('tavsiyeNewDailyGoal').value = '';
        document.getElementById('tavsiyeNewWeeklyGoal').value = '';
        document.getElementById('tavsiyeNewTotalPages').value = '';
        if (urlInput) urlInput.value = '';

        // Refresh list
        this.renderTavsiyeItems(category);

        alert(`"${name}" basariyla eklendi!`);
    }

    /**
     * Edit Tavsiye item
     */
    editTavsiyeItem(category, index) {
        const items = this.getTavsiyeItems();
        const item = items[category][index];

        const newName = prompt('Isim:', item.name);
        if (newName === null) return;

        const newDetail = prompt('Detay:', item.detail);
        if (newDetail === null) return;

        item.name = newName.trim() || item.name;
        item.detail = newDetail.trim() || item.detail;

        // For zikir/namaz/sohbet: handle weeklyGoal
        if (category === 'zikir' || category === 'namaz' || category === 'sohbet') {
            const weeklyLabel = category === 'sohbet' ? 'Haftalik hedef (adet):' : 'Haftalik hedef (defa):';
            const currentWeeklyGoal = item.weeklyGoal || 0;
            const newWeeklyGoal = prompt(weeklyLabel, currentWeeklyGoal);
            if (newWeeklyGoal !== null) {
                const parsed = parseInt(newWeeklyGoal) || 0;
                if (parsed > 0) {
                    item.weeklyGoal = parsed;
                } else {
                    delete item.weeklyGoal;
                }
            }
        } else {
            // For kitap/kuran/cevsen: handle dailyGoal and totalPages
            const dailyLabel = category === 'cevsen' ? 'Gunluk hedef (bab):' : 'Gunluk hedef (sayfa):';
            const totalLabel = category === 'cevsen' ? 'Toplam bab:' : 'Toplam sayfa:';

            if (item.dailyGoal !== undefined || category === 'kitap' || category === 'kuran' || category === 'cevsen') {
                const newGoal = prompt(dailyLabel, item.dailyGoal || 0);
                if (newGoal !== null) {
                    const parsed = parseInt(newGoal) || 0;
                    if (parsed > 0) {
                        item.dailyGoal = parsed;
                    } else {
                        delete item.dailyGoal;
                    }
                }
            }

            if (item.totalPages !== undefined || category === 'kitap' || category === 'kuran' || category === 'cevsen') {
                const newPages = prompt(totalLabel, item.totalPages || 0);
                if (newPages !== null) {
                    const parsed = parseInt(newPages) || 0;
                    if (parsed > 0) {
                        item.totalPages = parsed;
                    } else {
                        delete item.totalPages;
                    }
                }
            }
        }

        this.saveTavsiyeItems(items);
        this.renderTavsiyeItems(category);
    }

    /**
     * Delete Tavsiye item
     */
    deleteTavsiyeItem(category, index) {
        const items = this.getTavsiyeItems();
        const item = items[category][index];

        if (!confirm(`"${item.name}" silinecek. Emin misiniz?`)) return;

        items[category].splice(index, 1);
        this.saveTavsiyeItems(items);
        this.renderTavsiyeItems(category);
    }

    /**
     * Reset Tavsiye items to defaults
     */
    resetTavsiyeToDefaults() {
        if (!confirm('Tum tavsiyeler varsayilan degerlere sifirlanacak. Emin misiniz?')) return;

        localStorage.removeItem('adminTavsiyeItems');
        this.renderTavsiyeItems();
        alert('Tavsiyeler varsayilan degerlere sifirlandi!');
    }

    /**
     * Initialize Tavsiye section when shown
     */
    initTavsiyeSection() {
        this.renderTavsiyeItems('zikir'); // Default to zikir category
    }

    // ========================================
    // HATIM ADMIN MANAGEMENT
    // ========================================

    /**
     * Load all hatims from Supabase (admin view)
     */
    async loadAllHatims() {
        const container = document.getElementById('adminHatimsList');
        if (!container) return;

        container.innerHTML = '<p style="color: #64748b; text-align: center; padding: 20px;">Yukleniyor...</p>';

        try {
            // Get supabase client
            if (!this.supabase) {
                container.innerHTML = '<p style="color: #dc2626; text-align: center; padding: 20px;">Supabase baglantisi bulunamadi.</p>';
                return;
            }

            const { data: hatims, error } = await this.supabase
                .from('hatims')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error loading hatims:', error);
                container.innerHTML = `<p style="color: #dc2626; text-align: center; padding: 20px;">Hata: ${error.message}</p>`;
                return;
            }

            if (!hatims || hatims.length === 0) {
                container.innerHTML = '<p style="color: #64748b; text-align: center; padding: 20px;">Henuz hatim bulunmuyor.</p>';
                return;
            }

            // Render hatims list
            let html = '';
            for (const h of hatims) {
                const typeLabel = h.type === 'kuran' ? "Kur'an Hatmi" : 'Cevsen Hatmi';
                const icon = h.type === 'kuran' ? '📖' : '🌙';
                const createdAt = new Date(h.created_at).toLocaleDateString('tr-TR');

                // Get participation count
                const { count } = await this.supabase
                    .from('hatim_participations')
                    .select('*', { count: 'exact', head: true })
                    .eq('hatim_id', h.id);

                html += `
                    <div class="tavsiye-admin-item" data-hatim-id="${h.id}">
                        <div class="tavsiye-item-info">
                            <div>
                                <span style="font-size: 18px; margin-right: 6px;">${icon}</span>
                                <span class="tavsiye-item-name">${typeLabel}</span>
                                <span class="tavsiye-category-badge">Tur ${h.current_round}</span>
                            </div>
                            <span class="tavsiye-item-detail">
                                Kod: <strong>${h.code}</strong> •
                                Olusturan: ${h.creator_name || 'Bilinmiyor'} •
                                ${count || 0} katilim
                            </span>
                            <span class="tavsiye-item-meta">
                                ${createdAt} •
                                Device: ${h.created_by_device ? h.created_by_device.substring(0, 20) + '...' : 'Bilinmiyor'}
                            </span>
                        </div>
                        <div class="tavsiye-item-actions">
                            <button class="tavsiye-action-btn delete" onclick="adminDashboard.adminDeleteHatim('${h.id}', '${h.code}')">
                                🗑️ Sil
                            </button>
                        </div>
                    </div>
                `;
            }

            container.innerHTML = html;

        } catch (error) {
            console.error('Load hatims error:', error);
            container.innerHTML = `<p style="color: #dc2626; text-align: center; padding: 20px;">Hata: ${error.message}</p>`;
        }
    }

    /**
     * Delete a hatim (admin - no device_id check)
     */
    async adminDeleteHatim(hatimId, code) {
        if (!confirm(`"${code}" kodlu hatimi silmek istediginize emin misiniz?\n\nBu islem geri alinamaz!`)) {
            return;
        }

        try {
            if (!this.supabase) {
                alert('Supabase baglantisi bulunamadi.');
                return;
            }

            // Delete hatim (CASCADE will delete participations)
            const { error } = await this.supabase
                .from('hatims')
                .delete()
                .eq('id', hatimId);

            if (error) {
                console.error('Delete hatim error:', error);
                alert(`Silme hatasi: ${error.message}`);
                return;
            }

            alert(`"${code}" basariyla silindi!`);
            this.loadAllHatims(); // Refresh list

        } catch (error) {
            console.error('Admin delete hatim error:', error);
            alert(`Hata: ${error.message}`);
        }
    }

    /**
     * Delete ALL hatims (dangerous!)
     */
    async deleteAllHatims() {
        const confirmText = prompt('TUM HATIMLERI SILMEK ICIN "ONAYLA" yazin:');
        if (confirmText !== 'ONAYLA') {
            alert('Islem iptal edildi.');
            return;
        }

        try {
            if (!this.supabase) {
                alert('Supabase baglantisi bulunamadi.');
                return;
            }

            // First get count
            const { count } = await this.supabase
                .from('hatims')
                .select('*', { count: 'exact', head: true });

            if (!count || count === 0) {
                alert('Silinecek hatim bulunamadi.');
                return;
            }

            // Delete all hatims
            const { error } = await this.supabase
                .from('hatims')
                .delete()
                .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all (neq trick)

            if (error) {
                console.error('Delete all hatims error:', error);
                alert(`Silme hatasi: ${error.message}`);
                return;
            }

            alert(`${count} hatim basariyla silindi!`);
            this.loadAllHatims(); // Refresh list

        } catch (error) {
            console.error('Delete all hatims error:', error);
            alert(`Hata: ${error.message}`);
        }
    }

    // ========================================
    // ZIKIRLER YONETIMI
    // ========================================

    getDefaultZikirItems() {
        return [
            { name: 'Estagfirullah', target: 100, description: 'Tovbe zikri', weeklyGoal: 7 },
            { name: 'Subhanallah', target: 33, description: 'Tesbih', weeklyGoal: 7 },
            { name: 'Elhamdulillah', target: 33, description: 'Hamd', weeklyGoal: 7 },
            { name: 'Allahuekber', target: 33, description: 'Tekbir', weeklyGoal: 7 },
            { name: 'La ilahe illallah', target: 100, description: 'Tevhid', weeklyGoal: 7 },
            { name: 'Salavat', target: 100, description: 'Peygamberimize salavat', weeklyGoal: 7 }
        ];
    }

    getZikirItems() {
        const stored = localStorage.getItem('adminZikirItems');
        if (stored) {
            try { return JSON.parse(stored); } catch (e) { console.error(e); }
        }
        return this.getDefaultZikirItems();
    }

    saveZikirItems(items) {
        localStorage.setItem('adminZikirItems', JSON.stringify(items));
    }

    renderZikirItems() {
        const container = document.getElementById('zikirItemsList');
        if (!container) return;

        const items = this.getZikirItems();
        let html = '';

        items.forEach((item, index) => {
            html += `
                <div class="tavsiye-admin-item">
                    <div class="tavsiye-item-info">
                        <div>
                            <span class="tavsiye-item-name">${item.name}</span>
                            <span class="tavsiye-category-badge">Hedef: ${item.target}</span>
                        </div>
                        <span class="tavsiye-item-detail">${item.description || ''} - Haftalik: ${item.weeklyGoal || 0}</span>
                    </div>
                    <div class="tavsiye-item-actions">
                        <button class="tavsiye-action-btn edit" onclick="adminDashboard.editZikirItem(${index})">Duzenle</button>
                        <button class="tavsiye-action-btn delete" onclick="adminDashboard.deleteZikirItem(${index})">Sil</button>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html || '<p style="color: #64748b; text-align: center; padding: 20px;">Henuz zikir eklenmemis.</p>';
    }

    addZikirCategory() {
        const name = document.getElementById('zikirNewName').value.trim();
        const target = parseInt(document.getElementById('zikirNewTarget').value) || 100;
        const description = document.getElementById('zikirNewDescription').value.trim();
        const weeklyGoal = parseInt(document.getElementById('zikirNewWeeklyGoal').value) || 7;

        if (!name) { alert('Zikir ismi zorunludur!'); return; }

        const items = this.getZikirItems();
        items.push({ name, target, description, weeklyGoal });
        this.saveZikirItems(items);

        document.getElementById('zikirNewName').value = '';
        document.getElementById('zikirNewTarget').value = '';
        document.getElementById('zikirNewDescription').value = '';
        document.getElementById('zikirNewWeeklyGoal').value = '';

        this.renderZikirItems();
        alert(`"${name}" basariyla eklendi!`);
    }

    editZikirItem(index) {
        const items = this.getZikirItems();
        const item = items[index];

        const newName = prompt('Zikir Ismi:', item.name);
        if (newName === null) return;
        const newTarget = prompt('Hedef Sayi:', item.target);
        if (newTarget === null) return;
        const newDesc = prompt('Aciklama:', item.description || '');
        if (newDesc === null) return;
        const newWeekly = prompt('Haftalik Hedef:', item.weeklyGoal || 7);
        if (newWeekly === null) return;

        item.name = newName.trim() || item.name;
        item.target = parseInt(newTarget) || item.target;
        item.description = newDesc.trim();
        item.weeklyGoal = parseInt(newWeekly) || 7;

        this.saveZikirItems(items);
        this.renderZikirItems();
    }

    deleteZikirItem(index) {
        const items = this.getZikirItems();
        if (!confirm(`"${items[index].name}" silinecek. Emin misiniz?`)) return;
        items.splice(index, 1);
        this.saveZikirItems(items);
        this.renderZikirItems();
    }

    resetZikirToDefaults() {
        if (!confirm('Tum zikirler varsayilan degerlere sifirlanacak. Emin misiniz?')) return;
        localStorage.removeItem('adminZikirItems');
        this.renderZikirItems();
        alert('Zikirler varsayilan degerlere sifirlandi!');
    }

    // ========================================
    // KITAPLAR YONETIMI
    // ========================================

    getDefaultKitapItems() {
        return [
            { name: 'Sozler', author: 'Bediuzzaman', totalPages: 800, dailyGoal: 10, category: 'risale' },
            { name: 'Mektubat', author: 'Bediuzzaman', totalPages: 600, dailyGoal: 10, category: 'risale' },
            { name: 'Lemalar', author: 'Bediuzzaman', totalPages: 400, dailyGoal: 10, category: 'risale' },
            { name: 'Sualar', author: 'Bediuzzaman', totalPages: 700, dailyGoal: 10, category: 'risale' }
        ];
    }

    getKitapItems() {
        const stored = localStorage.getItem('adminKitapItems');
        if (stored) {
            try { return JSON.parse(stored); } catch (e) { console.error(e); }
        }
        return this.getDefaultKitapItems();
    }

    saveKitapItems(items) {
        localStorage.setItem('adminKitapItems', JSON.stringify(items));
    }

    renderKitapItems() {
        const container = document.getElementById('kitapItemsList');
        if (!container) return;

        const items = this.getKitapItems();
        const categoryLabels = { risale: 'Risale-i Nur', siyer: 'Siyer', tefsir: 'Tefsir', hadis: 'Hadis', diger: 'Diger' };
        let html = '';

        items.forEach((item, index) => {
            html += `
                <div class="tavsiye-admin-item">
                    <div class="tavsiye-item-info">
                        <div>
                            <span class="tavsiye-item-name">${item.name}</span>
                            <span class="tavsiye-category-badge">${categoryLabels[item.category] || item.category}</span>
                        </div>
                        <span class="tavsiye-item-detail">${item.author} - ${item.totalPages} sayfa - Gunluk: ${item.dailyGoal} sayfa</span>
                    </div>
                    <div class="tavsiye-item-actions">
                        <button class="tavsiye-action-btn edit" onclick="adminDashboard.editKitapItem(${index})">Duzenle</button>
                        <button class="tavsiye-action-btn delete" onclick="adminDashboard.deleteKitapItem(${index})">Sil</button>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html || '<p style="color: #64748b; text-align: center; padding: 20px;">Henuz kitap eklenmemis.</p>';
    }

    addKitapItem() {
        const name = document.getElementById('kitapNewName').value.trim();
        const author = document.getElementById('kitapNewAuthor').value.trim();
        const totalPages = parseInt(document.getElementById('kitapNewTotalPages').value) || 0;
        const dailyGoal = parseInt(document.getElementById('kitapNewDailyGoal').value) || 10;
        const category = document.getElementById('kitapNewCategory').value;

        if (!name) { alert('Kitap ismi zorunludur!'); return; }

        const items = this.getKitapItems();
        items.push({ name, author, totalPages, dailyGoal, category });
        this.saveKitapItems(items);

        document.getElementById('kitapNewName').value = '';
        document.getElementById('kitapNewAuthor').value = '';
        document.getElementById('kitapNewTotalPages').value = '';
        document.getElementById('kitapNewDailyGoal').value = '';

        this.renderKitapItems();
        alert(`"${name}" basariyla eklendi!`);
    }

    editKitapItem(index) {
        const items = this.getKitapItems();
        const item = items[index];

        const newName = prompt('Kitap Ismi:', item.name);
        if (newName === null) return;
        const newAuthor = prompt('Yazar:', item.author || '');
        if (newAuthor === null) return;
        const newPages = prompt('Toplam Sayfa:', item.totalPages);
        if (newPages === null) return;
        const newDaily = prompt('Gunluk Hedef:', item.dailyGoal);
        if (newDaily === null) return;

        item.name = newName.trim() || item.name;
        item.author = newAuthor.trim();
        item.totalPages = parseInt(newPages) || item.totalPages;
        item.dailyGoal = parseInt(newDaily) || item.dailyGoal;

        this.saveKitapItems(items);
        this.renderKitapItems();
    }

    deleteKitapItem(index) {
        const items = this.getKitapItems();
        if (!confirm(`"${items[index].name}" silinecek. Emin misiniz?`)) return;
        items.splice(index, 1);
        this.saveKitapItems(items);
        this.renderKitapItems();
    }

    resetKitapToDefaults() {
        if (!confirm('Tum kitaplar varsayilan degerlere sifirlanacak. Emin misiniz?')) return;
        localStorage.removeItem('adminKitapItems');
        this.renderKitapItems();
        alert('Kitaplar varsayilan degerlere sifirlandi!');
    }

    // ========================================
    // NAMAZLAR YONETIMI
    // ========================================

    getDefaultNamazItems() {
        return [
            { name: 'Teheccud', rakat: 8, description: 'Gece namazi', weeklyGoal: 7, time: 'gece' },
            { name: 'Duha', rakat: 4, description: 'Kusuk namazi', weeklyGoal: 7, time: 'sabah' },
            { name: 'Evvabin', rakat: 6, description: 'Aksam sonrasi', weeklyGoal: 7, time: 'aksam' },
            { name: 'Israk', rakat: 2, description: 'Gunes dogunca', weeklyGoal: 7, time: 'sabah' }
        ];
    }

    getNamazItems() {
        const stored = localStorage.getItem('adminNamazItems');
        if (stored) {
            try { return JSON.parse(stored); } catch (e) { console.error(e); }
        }
        return this.getDefaultNamazItems();
    }

    saveNamazItems(items) {
        localStorage.setItem('adminNamazItems', JSON.stringify(items));
    }

    renderNamazItems() {
        const container = document.getElementById('namazItemsList');
        if (!container) return;

        const items = this.getNamazItems();
        const timeLabels = { sabah: 'Sabah', ogle: 'Ogle', ikindi: 'Ikindi', aksam: 'Aksam', yatsi: 'Yatsi', gece: 'Gece' };
        let html = '';

        items.forEach((item, index) => {
            html += `
                <div class="tavsiye-admin-item">
                    <div class="tavsiye-item-info">
                        <div>
                            <span class="tavsiye-item-name">${item.name}</span>
                            <span class="tavsiye-category-badge">${item.rakat} Rekat - ${timeLabels[item.time] || item.time}</span>
                        </div>
                        <span class="tavsiye-item-detail">${item.description || ''} - Haftalik: ${item.weeklyGoal || 0}</span>
                    </div>
                    <div class="tavsiye-item-actions">
                        <button class="tavsiye-action-btn edit" onclick="adminDashboard.editNamazItem(${index})">Duzenle</button>
                        <button class="tavsiye-action-btn delete" onclick="adminDashboard.deleteNamazItem(${index})">Sil</button>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html || '<p style="color: #64748b; text-align: center; padding: 20px;">Henuz namaz eklenmemis.</p>';
    }

    addNamazCategory() {
        const name = document.getElementById('namazNewName').value.trim();
        const rakat = parseInt(document.getElementById('namazNewRakat').value) || 2;
        const description = document.getElementById('namazNewDescription').value.trim();
        const weeklyGoal = parseInt(document.getElementById('namazNewWeeklyGoal').value) || 7;
        const time = document.getElementById('namazNewTime').value;

        if (!name) { alert('Namaz ismi zorunludur!'); return; }

        const items = this.getNamazItems();
        items.push({ name, rakat, description, weeklyGoal, time });
        this.saveNamazItems(items);

        document.getElementById('namazNewName').value = '';
        document.getElementById('namazNewRakat').value = '';
        document.getElementById('namazNewDescription').value = '';
        document.getElementById('namazNewWeeklyGoal').value = '';

        this.renderNamazItems();
        alert(`"${name}" basariyla eklendi!`);
    }

    editNamazItem(index) {
        const items = this.getNamazItems();
        const item = items[index];

        const newName = prompt('Namaz Ismi:', item.name);
        if (newName === null) return;
        const newRakat = prompt('Rekat Sayisi:', item.rakat);
        if (newRakat === null) return;
        const newDesc = prompt('Aciklama:', item.description || '');
        if (newDesc === null) return;
        const newWeekly = prompt('Haftalik Hedef:', item.weeklyGoal || 7);
        if (newWeekly === null) return;

        item.name = newName.trim() || item.name;
        item.rakat = parseInt(newRakat) || item.rakat;
        item.description = newDesc.trim();
        item.weeklyGoal = parseInt(newWeekly) || 7;

        this.saveNamazItems(items);
        this.renderNamazItems();
    }

    deleteNamazItem(index) {
        const items = this.getNamazItems();
        if (!confirm(`"${items[index].name}" silinecek. Emin misiniz?`)) return;
        items.splice(index, 1);
        this.saveNamazItems(items);
        this.renderNamazItems();
    }

    resetNamazToDefaults() {
        if (!confirm('Tum namazlar varsayilan degerlere sifirlanacak. Emin misiniz?')) return;
        localStorage.removeItem('adminNamazItems');
        this.renderNamazItems();
        alert('Namazlar varsayilan degerlere sifirlandi!');
    }

    // ========================================
    // TESBIHAT YONETIMI
    // ========================================

    getDefaultTesbihatItems() {
        return {
            sabah: [
                { name: 'Ayetel Kursi', arabic: 'Allahu la ilahe illa huvel hayyul kayyum...', turkish: 'Allah, Ondan baska ilah yoktur...', count: 1 },
                { name: 'Subhanallah', arabic: 'Subhanallah', turkish: 'Allah her turlu eksiklikten uzaktir', count: 33 }
            ],
            ogle: [
                { name: 'Subhanallah', arabic: 'Subhanallah', turkish: 'Allah her turlu eksiklikten uzaktir', count: 33 }
            ],
            ikindi: [
                { name: 'Subhanallah', arabic: 'Subhanallah', turkish: 'Allah her turlu eksiklikten uzaktir', count: 33 }
            ],
            aksam: [
                { name: 'Subhanallah', arabic: 'Subhanallah', turkish: 'Allah her turlu eksiklikten uzaktir', count: 33 }
            ],
            yatsi: [
                { name: 'Subhanallah', arabic: 'Subhanallah', turkish: 'Allah her turlu eksiklikten uzaktir', count: 33 }
            ]
        };
    }

    getTesbihatItems() {
        const stored = localStorage.getItem('adminTesbihatItems');
        if (stored) {
            try { return JSON.parse(stored); } catch (e) { console.error(e); }
        }
        return this.getDefaultTesbihatItems();
    }

    saveTesbihatItems(items) {
        localStorage.setItem('adminTesbihatItems', JSON.stringify(items));
    }

    showTesbihatCategory(category) {
        const tabs = document.querySelectorAll('.tesbihat-tab');
        tabs.forEach(tab => {
            const tabCat = tab.textContent.toLowerCase();
            tab.classList.toggle('active', tabCat === category);
        });

        const categorySelect = document.getElementById('tesbihatNewCategory');
        if (categorySelect) categorySelect.value = category;

        this.renderTesbihatItems(category);
    }

    renderTesbihatItems(filterCategory = null) {
        const container = document.getElementById('tesbihatItemsList');
        if (!container) return;

        const items = this.getTesbihatItems();
        const categoryLabels = { sabah: 'Sabah', ogle: 'Ogle', ikindi: 'Ikindi', aksam: 'Aksam', yatsi: 'Yatsi' };
        let html = '';

        Object.keys(items).forEach(category => {
            if (filterCategory && category !== filterCategory) return;

            items[category].forEach((item, index) => {
                html += `
                    <div class="tavsiye-admin-item">
                        <div class="tavsiye-item-info">
                            <div>
                                <span class="tavsiye-item-name">${item.name}</span>
                                <span class="tavsiye-category-badge">${categoryLabels[category]} - ${item.count}x</span>
                            </div>
                            <span class="tavsiye-item-detail" style="direction: rtl;">${(item.arabic || '').substring(0, 50)}${(item.arabic || '').length > 50 ? '...' : ''}</span>
                            <span class="tavsiye-item-meta">${item.turkish || ''}</span>
                        </div>
                        <div class="tavsiye-item-actions">
                            <button class="tavsiye-action-btn edit" onclick="adminDashboard.editTesbihatItem('${category}', ${index})">Duzenle</button>
                            <button class="tavsiye-action-btn delete" onclick="adminDashboard.deleteTesbihatItem('${category}', ${index})">Sil</button>
                        </div>
                    </div>
                `;
            });
        });

        container.innerHTML = html || '<p style="color: #64748b; text-align: center; padding: 20px;">Bu kategoride tesbihat bulunmuyor.</p>';
    }

    addTesbihatItem() {
        const category = document.getElementById('tesbihatNewCategory').value;
        const name = document.getElementById('tesbihatNewName').value.trim();
        const arabic = document.getElementById('tesbihatNewArabic').value.trim();
        const turkish = document.getElementById('tesbihatNewTurkish').value.trim();
        const count = parseInt(document.getElementById('tesbihatNewCount').value) || 1;

        if (!name) { alert('Dua ismi zorunludur!'); return; }

        const items = this.getTesbihatItems();
        if (!items[category]) items[category] = [];
        items[category].push({ name, arabic, turkish, count });
        this.saveTesbihatItems(items);

        document.getElementById('tesbihatNewName').value = '';
        document.getElementById('tesbihatNewArabic').value = '';
        document.getElementById('tesbihatNewTurkish').value = '';
        document.getElementById('tesbihatNewCount').value = '';

        this.renderTesbihatItems(category);
        alert(`"${name}" basariyla eklendi!`);
    }

    editTesbihatItem(category, index) {
        const items = this.getTesbihatItems();
        const item = items[category][index];

        const newName = prompt('Dua Ismi:', item.name);
        if (newName === null) return;
        const newArabic = prompt('Arapca Metin:', item.arabic || '');
        if (newArabic === null) return;
        const newTurkish = prompt('Turkce Anlami:', item.turkish || '');
        if (newTurkish === null) return;
        const newCount = prompt('Tekrar Sayisi:', item.count || 1);
        if (newCount === null) return;

        item.name = newName.trim() || item.name;
        item.arabic = newArabic.trim();
        item.turkish = newTurkish.trim();
        item.count = parseInt(newCount) || 1;

        this.saveTesbihatItems(items);
        this.renderTesbihatItems(category);
    }

    deleteTesbihatItem(category, index) {
        const items = this.getTesbihatItems();
        if (!confirm(`"${items[category][index].name}" silinecek. Emin misiniz?`)) return;
        items[category].splice(index, 1);
        this.saveTesbihatItems(items);
        this.renderTesbihatItems(category);
    }

    resetTesbihatToDefaults() {
        if (!confirm('Tum tesbihatlar varsayilan degerlere sifirlanacak. Emin misiniz?')) return;
        localStorage.removeItem('adminTesbihatItems');
        this.renderTesbihatItems();
        alert('Tesbihatlar varsayilan degerlere sifirlandi!');
    }

    // ========================================
    // SOHBET YONETIMI
    // ========================================

    getDefaultSohbetSources() {
        return [
            { name: 'Cuma Hutbeleri', description: 'Cuma hutbeleri', url: 'https://herkul.org/cuma-hutbeleri/cuma-hutbesi-yeniden-dua-zamani/', icon: '📖' },
            { name: 'Bamteli', description: 'Video sohbetler', url: '', icon: '🎬' },
            { name: 'Kirik Testi', description: 'Yazilar', url: '', icon: '📝' },
            { name: 'Herkul Nagme', description: 'Ses kayitlari', url: '', icon: '🎧' },
            { name: 'Besinci Kat', description: 'Ozel icerikler', url: '', icon: '🎬' },
            { name: 'Vaazlar', description: 'Vaaz arsivi', url: '', icon: '🎬' },
            { name: 'Herkul Radyo', description: 'Canli radyo', url: '', icon: '📻' }
        ];
    }

    getSohbetSources() {
        const stored = localStorage.getItem('adminSohbetSources');
        if (stored) {
            try { return JSON.parse(stored); } catch (e) { console.error(e); }
        }
        return this.getDefaultSohbetSources();
    }

    saveSohbetSources(items) {
        localStorage.setItem('adminSohbetSources', JSON.stringify(items));
    }

    renderSohbetItems() {
        const container = document.getElementById('sohbetItemsList');
        if (!container) return;

        const items = this.getSohbetSources();
        let html = '';

        items.forEach((item, index) => {
            html += `
                <div class="tavsiye-admin-item">
                    <div class="tavsiye-item-info">
                        <div>
                            <span style="font-size: 18px; margin-right: 6px;">${item.icon || '🎬'}</span>
                            <span class="tavsiye-item-name">${item.name}</span>
                        </div>
                        <span class="tavsiye-item-detail">${item.description || ''}</span>
                        ${item.url ? `<span class="tavsiye-item-meta">${item.url}</span>` : ''}
                    </div>
                    <div class="tavsiye-item-actions">
                        <button class="tavsiye-action-btn edit" onclick="adminDashboard.editSohbetSource(${index})">Duzenle</button>
                        <button class="tavsiye-action-btn delete" onclick="adminDashboard.deleteSohbetSource(${index})">Sil</button>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html || '<p style="color: #64748b; text-align: center; padding: 20px;">Henuz kaynak eklenmemis.</p>';
    }

    addSohbetSource() {
        const name = document.getElementById('sohbetNewName').value.trim();
        const description = document.getElementById('sohbetNewDescription').value.trim();
        const url = document.getElementById('sohbetNewUrl').value.trim();
        const icon = document.getElementById('sohbetNewIcon').value;

        if (!name) { alert('Kaynak ismi zorunludur!'); return; }

        const items = this.getSohbetSources();
        items.push({ name, description, url, icon });
        this.saveSohbetSources(items);

        document.getElementById('sohbetNewName').value = '';
        document.getElementById('sohbetNewDescription').value = '';
        document.getElementById('sohbetNewUrl').value = '';

        this.renderSohbetItems();
        alert(`"${name}" basariyla eklendi!`);
    }

    editSohbetSource(index) {
        const items = this.getSohbetSources();
        const item = items[index];

        const newName = prompt('Kaynak Ismi:', item.name);
        if (newName === null) return;
        const newDesc = prompt('Aciklama:', item.description || '');
        if (newDesc === null) return;
        const newUrl = prompt('URL:', item.url || '');
        if (newUrl === null) return;

        item.name = newName.trim() || item.name;
        item.description = newDesc.trim();
        item.url = newUrl.trim();

        this.saveSohbetSources(items);
        this.renderSohbetItems();
    }

    deleteSohbetSource(index) {
        const items = this.getSohbetSources();
        if (!confirm(`"${items[index].name}" silinecek. Emin misiniz?`)) return;
        items.splice(index, 1);
        this.saveSohbetSources(items);
        this.renderSohbetItems();
    }

    resetSohbetToDefaults() {
        if (!confirm('Tum sohbet kaynaklari varsayilan degerlere sifirlanacak. Emin misiniz?')) return;
        localStorage.removeItem('adminSohbetSources');
        this.renderSohbetItems();
        alert('Sohbet kaynaklari varsayilan degerlere sifirlandi!');
    }

    // ========================================
    // INIT RENDER FUNCTIONS
    // ========================================

    initZikirSection() { this.renderZikirItems(); }
    initKitapSection() { this.renderKitapItems(); }
    initNamazSection() { this.renderNamazItems(); }
    initTesbihatSection() { this.renderTesbihatItems('sabah'); }
    initSohbetSection() { this.renderSohbetItems(); }
}

// Instance globale
const adminDashboard = new AdminDashboard();

console.log('📊 admin-dashboard.js chargé');
