import { defineStore } from 'pinia';
import masterDataService from '@/services/masterDataService';
import resultOptionsService from '@/services/resultOptionsService';

export const useMasterDataStore = defineStore('masterData', {
    state: () => ({
        seasons: [],
        fields: [],
        myTeams: [],
        opponentTeams: [],
        matchupResults: [],
        locations: [],
        ballTypes: [],
        isLoaded: false,
        isLoading: false,
        isResultOptionsLoaded: false,
        isResultOptionsLoading: false,
        _fetchPromise: null, // To handle parallel calls correctly
        _fetchResultOptionsPromise: null
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

        async fetchResultOptions(force = false) {
            if (this.isResultOptionsLoaded && !force) return;

            if (this.isResultOptionsLoading && this._fetchResultOptionsPromise) {
                return this._fetchResultOptionsPromise;
            }

            this.isResultOptionsLoading = true;
            this._fetchResultOptionsPromise = (async () => {
                try {
                    const [matchupResultsRes, locationsRes, ballTypesRes] = await Promise.all([
                        resultOptionsService.getMatchupResults(),
                        resultOptionsService.getLocations(),
                        resultOptionsService.getBallTypes()
                    ]);

                    this.matchupResults = matchupResultsRes.data.result || [];
                    this.locations = locationsRes.data.result || [];
                    this.ballTypes = ballTypesRes.data.result || [];

                    this.isResultOptionsLoaded = true;
                } catch (error) {
                    console.error('Failed to load result options into store:', error);
                    throw error;
                } finally {
                    this.isResultOptionsLoading = false;
                    this._fetchResultOptionsPromise = null;
                }
            })();

            return this._fetchResultOptionsPromise;
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
        },

        clearResultOptionsCache() {
            this.isResultOptionsLoaded = false;
            this.matchupResults = [];
            this.locations = [];
            this.ballTypes = [];
        }
    }
});
