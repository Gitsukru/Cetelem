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

        // Calculer le progres et inclure les participations
        const participations = await this.getParticipations(data.id, data.current_round);
        const claimedCount = participations.length;
        const completedCount = participations.filter(p => p.is_completed).length;

        return {
            ...data,
            participations, // Inclure les participations pour éviter double fetch
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

        // Verifier que le round est toujours actif (pas obsolete)
        const { data: hatim, error: hatimError } = await this.supabase
            .from('hatims')
            .select('current_round')
            .eq('id', hatimId)
            .single();

        if (hatimError) {
            console.error('Erreur verification round:', hatimError);
            throw new Error('Hatim dogrulanamadi');
        }

        if (hatim.current_round !== roundNumber) {
            throw new Error(`Bu tur artik aktif degil. Mevcut tur: ${hatim.current_round}`);
        }

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
        const { data, error } = await this.supabase
            .from('hatim_participations')
            .delete()
            .eq('id', participationId)
            .eq('device_id', deviceId)
            .select();

        if (error) {
            console.error('Erreur release unit:', error);
            throw new Error(error.message);
        }

        // Verifier qu'une ligne a ete supprimee
        if (!data || data.length === 0) {
            throw new Error('Bu birimi sadece sahibi birakabilir');
        }
    }

    /**
     * Marquer une unite comme terminee
     * @param {string} participationId - ID de la participation
     * @returns {Promise<Object>} Participation mise a jour
     */
    async markComplete(participationId) {
        // Validate participationId
        if (!participationId || typeof participationId !== 'string') {
            console.error('Invalid participationId:', participationId);
            throw new Error('Geçersiz katılım ID');
        }

        const { data, error } = await this.supabase
            .from('hatim_participations')
            .update({
                is_completed: true,
                completed_at: new Date().toISOString()
            })
            .eq('id', participationId)
            .select();

        if (error) {
            console.error('Erreur mark complete:', error);
            throw new Error(error.message);
        }

        if (!data || data.length === 0) {
            console.error('No participation found with id:', participationId);
            throw new Error('Katılım bulunamadı');
        }

        console.log('Marked complete:', participationId, data[0]?.is_completed);
        return data[0];
    }

    /**
     * Marquer une unite comme non terminee (annuler)
     * @param {string} participationId - ID de la participation
     * @returns {Promise<Object>} Participation mise a jour
     */
    async markIncomplete(participationId) {
        // Validate participationId
        if (!participationId || typeof participationId !== 'string') {
            console.error('Invalid participationId:', participationId);
            throw new Error('Geçersiz katılım ID');
        }

        const { data, error } = await this.supabase
            .from('hatim_participations')
            .update({
                is_completed: false,
                completed_at: null
            })
            .eq('id', participationId)
            .select();

        if (error) {
            console.error('Erreur mark incomplete:', error);
            throw new Error(error.message);
        }

        if (!data || data.length === 0) {
            console.error('No participation found with id:', participationId);
            throw new Error('Katılım bulunamadı');
        }

        console.log('Marked incomplete:', participationId, data[0]?.is_completed);
        return data[0];
    }

    /**
     * Obtenir les Hatims sauvegardes localement
     * @returns {Array}
     */
    getMyHatims() {
        try {
            const saved = localStorage.getItem('myHatims');
            if (!saved) return [];
            const parsed = JSON.parse(saved);
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            console.error('Erreur parsing myHatims:', error);
            // Nettoyer le localStorage corrompu
            localStorage.removeItem('myHatims');
            return [];
        }
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
     * Supprimer un Hatim completement (Supabase + local)
     * Seul le createur peut supprimer
     * Note: Les participations sont supprimees automatiquement via ON DELETE CASCADE
     * @param {string} hatimId - ID du hatim
     * @param {string} code - Code du hatim
     * @returns {Promise<boolean>}
     */
    async deleteHatim(hatimId, code) {
        const deviceId = this.getDeviceId();

        // Supprimer le hatim (seulement si createur)
        // Les participations sont supprimees automatiquement via CASCADE
        const { data, error: hatimError } = await this.supabase
            .from('hatims')
            .delete()
            .eq('id', hatimId)
            .eq('created_by_device', deviceId)
            .select();

        if (hatimError) {
            console.error('Erreur suppression hatim:', hatimError);
            throw new Error('Hatim silinemedi. Sadece olusturan silebilir.');
        }

        // Verifier qu'une ligne a ete supprimee
        if (!data || data.length === 0) {
            throw new Error('Hatim silinemedi. Sadece olusturan silebilir.');
        }

        // Supprimer localement aussi
        this.removeHatimLocally(code);

        console.log('Hatim supprime:', code);
        return true;
    }

    /**
     * Obtenir tous les hatims crees par ce device (depuis Supabase)
     * @returns {Promise<Array>}
     */
    async getMyCreatedHatims() {
        const deviceId = this.getDeviceId();

        const { data, error } = await this.supabase
            .from('hatims')
            .select('*')
            .eq('created_by_device', deviceId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Erreur get my created hatims:', error);
            return [];
        }

        return data || [];
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
            // Ecouter les changements de participations
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'hatim_participations',
                    filter: `hatim_id=eq.${hatimId}`
                },
                (payload) => {
                    console.log('Hatim participation update:', payload.eventType);
                    callback(payload);
                }
            )
            // Ecouter aussi les changements du hatim (nouveau tour, etc.)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'hatims',
                    filter: `id=eq.${hatimId}`
                },
                (payload) => {
                    console.log('Hatim round update:', payload.new?.current_round);
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
     * IMPORTANT: Utilise TOUJOURS 'analytics_device_id' pour cohérence avec analytics.js
     * Inclut migration depuis l'ancien hatim_device_id
     * @returns {string}
     */
    getDeviceId() {
        // Clé principale (partagée avec analytics.js)
        const DEVICE_ID_KEY = 'analytics_device_id';
        const OLD_KEY = 'hatim_device_id';

        let deviceId = localStorage.getItem(DEVICE_ID_KEY);
        const oldHatimId = localStorage.getItem(OLD_KEY);

        // Migration: si ancien ID existe mais pas le nouveau, migrer
        if (!deviceId && oldHatimId) {
            deviceId = oldHatimId;
            localStorage.setItem(DEVICE_ID_KEY, deviceId);
            console.log('DeviceId migré de hatim_device_id vers analytics_device_id');
        }

        // Si toujours pas d'ID, en générer un nouveau
        if (!deviceId) {
            if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
                const array = new Uint8Array(16);
                crypto.getRandomValues(array);
                deviceId = 'device_' + Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
            } else {
                deviceId = 'device_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 15);
            }
            localStorage.setItem(DEVICE_ID_KEY, deviceId);
        }

        // Synchroniser l'ancien key aussi (pour compatibilité)
        if (oldHatimId !== deviceId) {
            localStorage.setItem(OLD_KEY, deviceId);
        }

        return deviceId;
    }

    /**
     * Demarrer un nouveau tour pour un Hatim
     * Note: Le trigger check_hatim_round_completion peut deja avoir incremente le round
     * @param {string} hatimId - ID du hatim
     * @param {number} expectedRound - Round actuel attendu (pour vérification)
     * @returns {Promise<number>} Numero du tour actuel (peut etre deja incremente)
     */
    async startNewRound(hatimId, expectedRound = null) {
        // D'abord, obtenir le hatim actuel
        const { data: hatim, error: getError } = await this.supabase
            .from('hatims')
            .select('current_round, total_units')
            .eq('id', hatimId)
            .single();

        if (getError) {
            console.error('Erreur get hatim for new round:', getError);
            throw new Error('Hatim bulunamadı');
        }

        // Si le round a deja ete incremente par le trigger (ou un autre utilisateur)
        // Retourner simplement le round actuel sans erreur
        if (expectedRound !== null && hatim.current_round > expectedRound) {
            console.log('Round already incremented by trigger:', hatim.current_round);
            return hatim.current_round;
        }

        // Verifier si toutes les unites sont prises dans le round actuel
        const { count: claimedCount } = await this.supabase
            .from('hatim_participations')
            .select('*', { count: 'exact', head: true })
            .eq('hatim_id', hatimId)
            .eq('round_number', hatim.current_round);

        // Si pas toutes les unites sont prises, on ne peut pas demarrer un nouveau round
        if (claimedCount < hatim.total_units) {
            throw new Error(`Yeni tur başlatılamaz. ${hatim.total_units - claimedCount} birim hâlâ boş.`);
        }

        const newRound = hatim.current_round + 1;

        // Mettre a jour avec WHERE sur current_round pour garantir l'atomicité
        console.log(`Starting new round: ${hatim.current_round} -> ${newRound} for hatim ${hatimId}`);

        const { data: updated, error: updateError } = await this.supabase
            .from('hatims')
            .update({
                current_round: newRound,
                updated_at: new Date().toISOString()
            })
            .eq('id', hatimId)
            .eq('current_round', hatim.current_round) // Verrouillage optimiste
            .select('current_round');

        if (updateError) {
            console.error('Erreur start new round:', updateError);
            // Check if it's an RLS error
            if (updateError.code === '42501' || updateError.message?.includes('policy')) {
                throw new Error('Sadece hatim sahibi yeni tur başlatabilir');
            }
            throw new Error('Yeni tur başlatılamadı: ' + (updateError.message || 'Bilinmeyen hata'));
        }

        // Si aucune ligne mise a jour (race condition - trigger l'a deja fait)
        if (!updated || updated.length === 0) {
            console.log('No rows updated, checking current state...');

            // Re-fetch le round actuel
            const { data: refreshed, error: refreshError } = await this.supabase
                .from('hatims')
                .select('current_round')
                .eq('id', hatimId)
                .single();

            console.log('Refreshed hatim state:', refreshed, 'error:', refreshError);

            if (refreshed && refreshed.current_round > hatim.current_round) {
                console.log('Round was already incremented:', refreshed.current_round);
                return refreshed.current_round;
            }

            // RLS might be blocking the update - check if we can read but not write
            if (refreshed && refreshed.current_round === hatim.current_round) {
                throw new Error('Yeni tur başlatma yetkisi yok. Sadece hatim sahibi başlatabilir.');
            }

            throw new Error('Yeni tur başlatılamadı: Güncelleme başarısız');
        }

        console.log(`Nouveau tour demarre: ${updated[0].current_round}`);
        return updated[0].current_round;
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
     * Obtenir toutes les participations des rounds précédents (optimisé - 1 requête)
     * @param {string} hatimId - ID du hatim
     * @param {number} currentRound - Round actuel (on charge tout sauf celui-ci)
     * @returns {Promise<Object>} Map des rounds avec leurs participations
     */
    async getAllPreviousRoundsParticipations(hatimId, currentRound) {
        const { data, error } = await this.supabase
            .from('hatim_participations')
            .select('*')
            .eq('hatim_id', hatimId)
            .lt('round_number', currentRound)
            .order('round_number', { ascending: false })
            .order('unit_number', { ascending: true });

        if (error) {
            console.error('Erreur get all previous rounds:', error);
            return {};
        }

        // Grouper par round
        const roundsMap = {};
        (data || []).forEach(p => {
            if (!roundsMap[p.round_number]) {
                roundsMap[p.round_number] = [];
            }
            roundsMap[p.round_number].push(p);
        });

        return roundsMap;
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
