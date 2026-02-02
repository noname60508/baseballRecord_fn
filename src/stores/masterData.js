import { defineStore } from 'pinia';
import masterDataService from '@/services/masterDataService';

export const useMasterDataStore = defineStore('masterData', {
    state: () => ({
        seasons: [],
        fields: [],
        myTeams: [],
        opponentTeams: [],
        isLoaded: false,
        isLoading: false,
        _fetchPromise: null // To handle parallel calls correctly
    }),

    actions: {
        async fetchAll(force = false) {
            if (this.isLoaded && !force) return;

            // If already loading, return the existing promise so everyone waits for the same result
            if (this.isLoading && this._fetchPromise) return this._fetchPromise;

            this.isLoading = true;
            this._fetchPromise = (async () => {
                try {
                    const [seasonsRes, fieldsRes, teamsRes] = await Promise.all([
                        masterDataService.seasons.getAll(),
                        masterDataService.fields.getAll(),
                        masterDataService.teams.getAll() // Call once without filters
                    ]);

                    this.seasons = seasonsRes.data.result || [];
                    this.fields = fieldsRes.data.result || [];

                    // Split teams locally: 1 is My Team, 2 is Opponent Team
                    const allTeams = teamsRes.data.result || [];
                    this.myTeams = allTeams.filter(t => t.teamtype === 1);
                    this.opponentTeams = allTeams.filter(t => t.teamtype === 2);

                    this.isLoaded = true;
                } catch (error) {
                    console.error('Failed to load master data into store:', error);
                    throw error; // Re-throw so callers know it failed
                } finally {
                    this.isLoading = false;
                    this._fetchPromise = null;
                }
            })();

            return this._fetchPromise;
        },

        // Handlers for quick-add to keep cache in sync (Put new items at top)
        addSeason(season) {
            this.seasons.unshift(season);
        },
        addField(field) {
            this.fields.unshift(field);
        },
        addMyTeam(team) {
            this.myTeams.unshift(team);
        },
        addOpponentTeam(team) {
            this.opponentTeams.unshift(team);
        },

        // Force clear (e.g. after managing data in CRUD pages)
        clearCache() {
            this.isLoaded = false;
            this.seasons = [];
            this.fields = [];
            this.myTeams = [];
            this.opponentTeams = [];
        }
    }
});
