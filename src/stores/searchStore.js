import { defineStore } from 'pinia';

export const useSearchStore = defineStore('search', {
    state: () => ({
        // Search form state (will be cleared on route leave)
        searchForm: {
            Z00_season_id: '',
            Z00_team_id: '',
            Z00_team_id_enemy: '',
            Z00_field_id: '',
            gameResult: '',
            gameDate: [null, null]
        },
        // UI state
        isSearchOpen: false,
        // Pagination state
        currentPage: 1
    }),

    actions: {
        // Update entire search form
        setSearchForm(form) {
            this.searchForm = { ...form };
        },

        // Update individual field
        updateField(field, value) {
            this.searchForm[field] = value;
        },

        // Toggle search panel
        setIsSearchOpen(isOpen) {
            this.isSearchOpen = isOpen;
        },

        toggleSearchOpen() {
            this.isSearchOpen = !this.isSearchOpen;
        },

        // Pagination
        setCurrentPage(page) {
            this.currentPage = page;
        },

        // Reset search (called when leaving pages)
        resetSearch(isSearchOpen) {
            this.searchForm = {
                Z00_season_id: '',
                Z00_team_id: '',
                Z00_team_id_enemy: '',
                Z00_field_id: '',
                gameResult: '',
                gameDate: [null, null]
            };
            this.currentPage = 1;
            this.isSearchOpen = isSearchOpen;
        },

        // Check if any search filter is active
        hasActiveFilters() {
            return (
                this.searchForm.Z00_season_id !== '' ||
                this.searchForm.Z00_team_id !== '' ||
                this.searchForm.Z00_team_id_enemy !== '' ||
                this.searchForm.Z00_field_id !== '' ||
                this.searchForm.gameResult !== '' ||
                (this.searchForm.gameDate[0] !== null || this.searchForm.gameDate[1] !== null)
            );
        }
    },

    // Persist search state in sessionStorage (optional, for page refresh)
    persist: {
        enabled: false // Disabled by default, can enable if needed
    }
});
