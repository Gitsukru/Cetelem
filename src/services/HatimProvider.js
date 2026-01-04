/**
 * HatimProvider - Service Supabase pour le partage de Hatim
 * Gere la creation, participation et suivi des Hatims collaboratifs
 */

class HatimProvider {
    constructor(supabaseClient) {
        this.supabase = supabaseClient;
        this.subscriptions = new Map();
    }

    /**
     * Generer un code unique de 8 caracteres
     * @returns {string} Code alphanumerique
     */
    generateCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 8; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    /**
     * Creer une nouvelle session de Hatim
     * @param {Object} data - {type, creatorName, description, deadline}
     * @returns {Promise<{id, code}>}
     */
    async createHatim({ type, creatorName, description, deadline }) {
        const code = this.generateCode();
        const totalUnits = type === 'kuran' ? 30 : 100;
        const deviceId = this.getDeviceId();

        const { data: hatim, error } = await this.supabase
            .from('hatims')
            .insert({
                code,
                type,
                creator_name: creatorName,
                description: description || null,
                deadline: deadline || null,
                total_units: totalUnits,
                created_by_device: deviceId
            })
            .select()
            .single();

        if (error) {
            console.error('Erreur creation hatim:', error);
            throw new Error(error.message);
        }

        console.log('Hatim cree:', hatim.code);
        return { id: hatim.id, code: hatim.code };
    }

    /**
     * Obtenir un Hatim par son code
     * @param {string} code - Code 8 caracteres
     * @returns {Promise<Object>} Hatim avec progres
     */
    async getHatimByCode(code) {
        const { data, error } = await this.supabase
            .from('hatims')
            .select('*')
            .eq('code', code.toUpperCase())
            .single();

        if (error) {
            console.error('Erreur get hatim:', error);
            throw new Error('Hatim bulunamadi');
        }

        // Calculer le progres
        const participations = await this.getParticipations(data.id, data.current_round);
        const claimedCount = participations.length;
        const completedCount = participations.filter(p => p.is_completed).length;

        return {
            ...data,
            claimed_count: claimedCount,
            completed_count: completedCount,
            progress_percent: Math.round((claimedCount / data.total_units) * 100)
        };
    }

    /**
     * Obtenir les participations pour un round
     * @param {string} hatimId - ID du hatim
     * @param {number} roundNumber - Numero du round
     * @returns {Promise<Array>}
     */
    async getParticipations(hatimId, roundNumber) {
        const { data, error } = await this.supabase
            .from('hatim_participations')
            .select('*')
            .eq('hatim_id', hatimId)
            .eq('round_number', roundNumber)
            .order('unit_number', { ascending: true });

        if (error) {
            console.error('Erreur get participations:', error);
            throw new Error(error.message);
        }

        return data || [];
    }

    /**
     * Prendre une unite (Cuz ou Bab)
     * @param {Object} data - {hatimId, roundNumber, unitNumber, participantName}
     * @returns {Promise<Object>}
     */
    async claimUnit({ hatimId, roundNumber, unitNumber, participantName }) {
        const deviceId = this.getDeviceId();

        const { data, error } = await this.supabase
            .from('hatim_participations')
            .insert({
                hatim_id: hatimId,
                round_number: roundNumber,
                unit_number: unitNumber,
                participant_name: participantName,
                device_id: deviceId
            })
            .select()
            .single();

        if (error) {
            console.error('Erreur claim unit:', error);
            if (error.code === '23505') {
                throw new Error('Bu birim zaten alinmis');
            }
            throw new Error(error.message);
        }

        console.log(`Unite ${unitNumber} prise par ${participantName}`);
        return data;
    }

    /**
     * Liberer une unite prise
     * @param {string} participationId - ID de la participation
     * @param {string} deviceId - ID du device (verification)
     */
    async releaseUnit(participationId, deviceId) {
        const { error } = await this.supabase
            .from('hatim_participations')
            .delete()
            .eq('id', participationId)
            .eq('device_id', deviceId);

        if (error) {
            console.error('Erreur release unit:', error);
            throw new Error(error.message);
        }
    }

    /**
     * Marquer une unite comme terminee
     * @param {string} participationId - ID de la participation
     */
    async markComplete(participationId) {
        const { error } = await this.supabase
            .from('hatim_participations')
            .update({
                is_completed: true,
                completed_at: new Date().toISOString()
            })
            .eq('id', participationId);

        if (error) {
            console.error('Erreur mark complete:', error);
            throw new Error(error.message);
        }
    }

    /**
     * Marquer une unite comme non terminee (annuler)
     * @param {string} participationId - ID de la participation
     */
    async markIncomplete(participationId) {
        const { error } = await this.supabase
            .from('hatim_participations')
            .update({
                is_completed: false,
                completed_at: null
            })
            .eq('id', participationId);

        if (error) {
            console.error('Erreur mark incomplete:', error);
            throw new Error(error.message);
        }
    }

    /**
     * Obtenir les Hatims sauvegardes localement
     * @returns {Array}
     */
    getMyHatims() {
        const saved = localStorage.getItem('myHatims');
        return saved ? JSON.parse(saved) : [];
    }

    /**
     * Sauvegarder un Hatim localement
     * @param {Object} hatim - {id, code, type, creatorName, isCreator}
     */
    saveHatimLocally(hatim) {
        const hatims = this.getMyHatims();
        const existing = hatims.findIndex(h => h.code === hatim.code);

        if (existing >= 0) {
            hatims[existing] = { ...hatims[existing], ...hatim, lastAccess: Date.now() };
        } else {
            hatims.unshift({ ...hatim, lastAccess: Date.now() });
        }

        // Garder max 20 hatims
        localStorage.setItem('myHatims', JSON.stringify(hatims.slice(0, 20)));
    }

    /**
     * Retirer un Hatim de la liste locale
     * @param {string} code - Code du hatim
     */
    removeHatimLocally(code) {
        const hatims = this.getMyHatims().filter(h => h.code !== code);
        localStorage.setItem('myHatims', JSON.stringify(hatims));
    }

    /**
     * S'abonner aux mises a jour temps reel d'un Hatim
     * @param {string} hatimId - ID du hatim
     * @param {Function} callback - Callback pour les mises a jour
     */
    subscribeToHatim(hatimId, callback) {
        // Se desabonner d'abord si deja abonne
        this.unsubscribeFromHatim(hatimId);

        const channel = this.supabase
            .channel(`hatim_${hatimId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'hatim_participations',
                    filter: `hatim_id=eq.${hatimId}`
                },
                (payload) => {
                    console.log('Hatim update:', payload.eventType);
                    callback(payload);
                }
            )
            .subscribe((status) => {
                console.log(`Subscription hatim ${hatimId}: ${status}`);
            });

        this.subscriptions.set(hatimId, channel);
    }

    /**
     * Se desabonner des mises a jour
     * @param {string} hatimId - ID du hatim
     */
    unsubscribeFromHatim(hatimId) {
        const channel = this.subscriptions.get(hatimId);
        if (channel) {
            this.supabase.removeChannel(channel);
            this.subscriptions.delete(hatimId);
        }
    }

    /**
     * Se desabonner de tous les hatims
     */
    unsubscribeAll() {
        for (const [hatimId, channel] of this.subscriptions) {
            this.supabase.removeChannel(channel);
        }
        this.subscriptions.clear();
    }

    /**
     * Obtenir l'ID du device
     * @returns {string|null}
     */
    getDeviceId() {
        if (typeof window.analytics !== 'undefined' && window.analytics.getDeviceId) {
            return window.analytics.getDeviceId();
        }
        // Fallback: generer un ID simple
        let deviceId = localStorage.getItem('hatim_device_id');
        if (!deviceId) {
            deviceId = 'device_' + Math.random().toString(36).substring(2, 15);
            localStorage.setItem('hatim_device_id', deviceId);
        }
        return deviceId;
    }

    /**
     * Obtenir toutes les participations d'un round specifique
     * @param {string} hatimId - ID du hatim
     * @param {number} roundNumber - Numero du round
     * @returns {Promise<Array>}
     */
    async getParticipationsByRound(hatimId, roundNumber) {
        const { data, error } = await this.supabase
            .from('hatim_participations')
            .select('*')
            .eq('hatim_id', hatimId)
            .eq('round_number', roundNumber)
            .order('unit_number', { ascending: true });

        if (error) {
            console.error('Erreur get participations by round:', error);
            return [];
        }

        return data || [];
    }

    /**
     * Obtenir les stats d'un Hatim (tous les rounds)
     * @param {string} hatimId - ID du hatim
     * @returns {Promise<Object>}
     */
    async getHatimStats(hatimId) {
        const { data, error } = await this.supabase
            .from('hatim_participations')
            .select('round_number, is_completed')
            .eq('hatim_id', hatimId);

        if (error) throw new Error(error.message);

        const stats = {
            totalParticipations: data.length,
            completedRounds: 0,
            completedUnits: data.filter(p => p.is_completed).length,
            roundStats: {}
        };

        // Grouper par round
        data.forEach(p => {
            if (!stats.roundStats[p.round_number]) {
                stats.roundStats[p.round_number] = { claimed: 0, completed: 0 };
            }
            stats.roundStats[p.round_number].claimed++;
            if (p.is_completed) {
                stats.roundStats[p.round_number].completed++;
            }
        });

        return stats;
    }
}

// Exposition globale
window.HatimProvider = HatimProvider;
