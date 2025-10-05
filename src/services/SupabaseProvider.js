/**
 * Implémentation Supabase du backend de groupe
 * Gère la création, jointure et synchronisation temps réel via Supabase
 */

class SupabaseProvider extends BackendProvider {
  constructor(supabaseUrl, supabaseKey) {
    super()

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('URL et clé Supabase requis')
    }

    // Initialisation du client Supabase
    this.supabase = supabase.createClient(supabaseUrl, supabaseKey)
    this.subscriptions = new Map()
  }

  /**
   * Créer un nouveau groupe
   * @param {string} groupName - Nom du groupe
   * @param {string} creatorName - Nom du créateur
   * @returns {Promise<{groupId, code, name}>}
   */
  async createGroup(groupName, creatorName) {
    try {
      const code = this.generateGroupCode()

      // 1. Créer le groupe
      const { data: group, error: groupError } = await this.supabase
        .from('groups')
        .insert({
          code: code,
          name: groupName || 'Zikir Grubu',
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (groupError) throw groupError

      // 2. Ajouter le créateur comme participant
      const { data: participant, error: participantError } = await this.supabase
        .from('participants')
        .insert({
          group_id: group.id,
          name: creatorName,
          today_count: 0,
          week_count: 0,
          total_count: 0,
          joined_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (participantError) throw participantError

      return {
        groupId: group.id,
        participantId: participant.id,
        code: group.code,
        name: group.name,
        creatorName: creatorName
      }

    } catch (error) {
      console.error('Erreur création groupe Supabase:', error)
      throw new Error(`Impossible de créer le groupe: ${error.message}`)
    }
  }

  /**
   * Rejoindre un groupe existant
   * @param {string} groupCode - Code du groupe (6 caractères)
   * @param {string} participantName - Nom du participant
   * @returns {Promise<{groupId, participantId, name}>}
   */
  async joinGroup(groupCode, participantName) {
    try {
      // 1. Trouver le groupe par code
      const { data: group, error: groupError } = await this.supabase
        .from('groups')
        .select('*')
        .eq('code', groupCode.toUpperCase())
        .single()

      if (groupError || !group) {
        throw new Error('Groupe introuvable')
      }

      // 2. Vérifier si le nom est déjà pris
      const { data: existing } = await this.supabase
        .from('participants')
        .select('name')
        .eq('group_id', group.id)
        .eq('name', participantName)
        .single()

      if (existing) {
        throw new Error('Ce nom est déjà utilisé dans ce groupe')
      }

      // 3. Ajouter le participant
      const { data: participant, error: participantError } = await this.supabase
        .from('participants')
        .insert({
          group_id: group.id,
          name: participantName,
          today_count: 0,
          week_count: 0,
          total_count: 0,
          joined_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (participantError) throw participantError

      return {
        groupId: group.id,
        participantId: participant.id,
        name: group.name,
        code: group.code
      }

    } catch (error) {
      console.error('Erreur rejoindre groupe Supabase:', error)
      throw new Error(`Impossible de rejoindre le groupe: ${error.message}`)
    }
  }

  /**
   * Mettre à jour le score d'un participant
   * @param {string} groupId - ID du groupe
   * @param {string} participantId - ID du participant
   * @param {Object} score - {today, week, month, total, categories}
   */
  async updateScore(groupId, participantId, score) {
    try {
      const updateData = {
        today_count: score.today || 0,
        week_count: score.week || 0,
        month_count: score.month || 0,
        total_count: score.total || 0,
        updated_at: new Date().toISOString()
      }

      // Ajouter les statistiques détaillées par catégorie dans metadata
      if (score.categories) {
        updateData.metadata = {
          categories: score.categories,
          lastUpdated: new Date().toISOString()
        }
        logger.log('📊 Envoi des statistiques détaillées:', score.categories)
      } else {
        logger.warn('⚠️ Aucune catégorie dans score:', score)
      }

      logger.log('📤 Données envoyées à Supabase:', updateData)

      const { error } = await this.supabase
        .from('participants')
        .update(updateData)
        .eq('id', participantId)
        .eq('group_id', groupId)

      if (error) throw error

      logger.log('✅ Score mis à jour avec succès')

    } catch (error) {
      console.error('Erreur mise à jour score:', error)
      throw error
    }
  }

  /**
   * Récupérer le classement du groupe
   * @param {string} groupId - ID du groupe
   * @returns {Promise<Array>} Liste des participants triés par score
   */
  async getLeaderboard(groupId) {
    try {
      const { data, error } = await this.supabase
        .from('participants')
        .select('*')
        .eq('group_id', groupId)
        .order('today_count', { ascending: false })

      if (error) throw error

      return data.map(p => ({
        id: p.id,
        name: p.name,
        todayCount: p.today_count,
        weekCount: p.week_count,
        totalCount: p.total_count,
        points: this.calculatePoints(p),
        lastUpdate: p.updated_at
      }))

    } catch (error) {
      console.error('Erreur récupération classement:', error)
      throw error
    }
  }

  /**
   * Quitter un groupe (supprimer le participant)
   * @param {string} groupId - ID du groupe
   * @param {string} participantId - ID du participant
   */
  async leaveGroup(groupId, participantId) {
    try {
      const { error } = await this.supabase
        .from('participants')
        .delete()
        .eq('id', participantId)
        .eq('group_id', groupId)

      if (error) throw error

    } catch (error) {
      console.error('Erreur quitter groupe:', error)
      throw error
    }
  }

  /**
   * S'abonner aux mises à jour temps réel du groupe
   * @param {string} groupId - ID du groupe
   * @param {Function} callback - Fonction appelée lors des mises à jour
   */
  subscribeToGroup(groupId, callback) {
    // Se désabonner si déjà abonné
    this.unsubscribeFromGroup(groupId)

    const channel = this.supabase
      .channel(`group_${groupId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'participants',
          filter: `group_id=eq.${groupId}`
        },
        (payload) => {
          console.log('Mise à jour temps réel:', payload)
          callback(payload)
        }
      )
      .subscribe()

    this.subscriptions.set(groupId, channel)
  }

  /**
   * Se désabonner des mises à jour
   * @param {string} groupId - ID du groupe
   */
  unsubscribeFromGroup(groupId) {
    const channel = this.subscriptions.get(groupId)
    if (channel) {
      this.supabase.removeChannel(channel)
      this.subscriptions.delete(groupId)
    }
  }

  /**
   * Calculer les points d'un participant
   * @private
   */
  calculatePoints(participant) {
    return (
      (participant.today_count * 10) +
      (participant.week_count * 2) +
      Math.floor(participant.total_count / 10)
    )
  }
}

// Export pour utilisation
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SupabaseProvider
}
