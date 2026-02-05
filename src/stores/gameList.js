import { defineStore } from 'pinia';

export const useGameListStore = defineStore('gameList', {
    state: () => ({
        searchForm: {
            Z00_season_id: '',
            Z00_team_id: '',
            Z00_team_id_enemy: '',
            Z00_field_id: '',
            gameResult: '',
            gameDate: [null, null]
        },
        currentPage: 1,
        isSearchOpen: true
    }),
    actions: {
        setSearchForm(form) {
            this.searchForm = { ...form };
        },
        setCurrentPage(page) {
            this.currentPage = page;
        },
        setIsSearchOpen(isOpen) {
            this.isSearchOpen = isOpen;
        },
        resetState() {
            this.searchForm = {
                Z00_season_id: '',
                Z00_team_id: '',
                Z00_team_id_enemy: '',
                Z00_field_id: '',
                gameResult: '',
                gameDate: [null, null]
            };
            this.currentPage = 1;
            this.isSearchOpen = true;
        }
    }
});
