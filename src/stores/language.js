import { defineStore } from 'pinia';

export const useLanguageStore = defineStore('language', {
    state: () => ({
        currentLanguage: localStorage.getItem('language') || 'zh-TW'
    }),

    actions: {
        setLanguage(lang) {
            this.currentLanguage = lang;
            localStorage.setItem('language', lang);
        }
    }
});
