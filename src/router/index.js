import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const routes = [
    {
        path: '/login',
        name: 'Login',
        component: () => import('@/views/Login.vue'),
        meta: { requiresAuth: false }
    },
    {
        path: '/',
        redirect: '/games'
    },
    {
        path: '/reset-password',
        name: 'ResetPassword',
        component: () => import('../views/ResetPassword.vue'),
        meta: { requiresAuth: false }
    },
    {
        path: '/games',
        name: 'Games',
        component: () => import('@/views/games/GameList.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/games/:id',
        name: 'GameDetail',
        component: () => import('@/views/games/GameDetail.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/batting',
        name: 'BattingStatistics',
        component: () => import('@/views/batting/BattingStatistics.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/profile',
        name: 'Profile',
        component: () => import('@/views/profile/UserProfile.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/master-data',
        name: 'MasterData',
        component: () => import('@/views/masterData/MasterDataLayout.vue'),
        meta: { requiresAuth: true }
    }
];

const router = createRouter({
    history: createWebHashHistory(),
    routes
});

// 路由守衛
router.beforeEach((to, from, next) => {
    const authStore = useAuthStore();

    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
        next('/login');
    } else if (to.path === '/login' && authStore.isAuthenticated) {
        next('/games');
    } else {
        next();
    }
});

export default router;
