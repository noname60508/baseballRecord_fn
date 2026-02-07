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
        isSearchOpen: false
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
        }
    }
});
