import { defineStore } from 'pinia';
import authService from '@/services/authService';
import userService from '@/services/UserService';
import { useMasterDataStore } from './masterData';

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

        async register(userData) {
            try {
                return await authService.register(userData);
            } catch (error) {
                console.error('Registration failed:', error);
                throw error;
            }
        },

        async forgotPassword(data) {
            try {
                return await authService.forgotPassword(data);
            } catch (error) {
                console.error('Forgot password request failed:', error);
                throw error;
            }
        },

        async resetPassword(data) {
            try {
                return await authService.resetForgotPassword(data);
            } catch (error) {
                console.error('Reset password request failed:', error);
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

                // Clear other stores
                const masterDataStore = useMasterDataStore();
                masterDataStore.clearCache();
            }
        },

        async fetchUser() {
            try {
                const userId = localStorage.getItem('userId');
                if (!userId) {
                    this.logout();
                    return;
                }
                const response = await userService.getUser(userId);
                const userData = response.data.result; // getUser returns { result: { ... } }

                // Add cache buster to icon if it exists
                if (userData.icon) {
                    userData.icon = `${userData.icon}${userData.icon.includes('?') ? '&' : '?'}t=${Date.now()}`;
                }
                this.user = userData;
            } catch (error) {
                console.error('Failed to fetch user:', error);
                this.logout();
            }
        }
    }
});
