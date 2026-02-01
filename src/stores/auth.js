import { defineStore } from 'pinia';
import authService from '@/services/authService';

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: null, // User object should be fetched, not just ID
        token: localStorage.getItem('auth_token') || null,
        isAuthenticated: !!localStorage.getItem('auth_token')
    }),

    actions: {
        async login(credentials) {
            try {
                const response = await authService.login(credentials);
                const token = response.headers['authorization'] || response.headers['Authorization'];

                if (token) {
                    const cleanToken = token.replace('Bearer ', '');
                    this.token = cleanToken;
                    localStorage.setItem('auth_token', cleanToken);
                    this.isAuthenticated = true;
                }

                const user = response.data.result;
                localStorage.setItem('userId', user.id);

                this.user = user;
                return user;
            } catch (error) {
                console.error('Login failed:', error);
                throw error;
            }
        },

        async logout() {
            try {
                await authService.logout();
            } catch (error) {
                console.error('Logout error:', error);
            } finally {
                this.user = null;
                this.token = null;
                this.isAuthenticated = false;
                localStorage.removeItem('auth_token');
                localStorage.removeItem('userId');
            }
        },

        async fetchUser() {
            try {
                const response = await authService.getUserInfo();
                this.user = response.data;
            } catch (error) {
                console.error('Failed to fetch user:', error);
                this.logout();
            }
        }
    }
});
