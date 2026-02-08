import { createRouter, createWebHistory } from 'vue-router';
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
        path: '/games',
        name: 'Games',
        component: () => import('@/views/games/GameList.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/games/new',
        name: 'GameNew',
        component: () => import('@/views/games/GameForm.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/games/:id',
        name: 'GameDetail',
        component: () => import('@/views/games/GameDetail.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/games/:id/edit',
        name: 'GameEdit',
        component: () => import('@/views/games/GameForm.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/batting/records',
        name: 'BattingRecords',
        component: () => import('@/views/batting/BattingStatistics.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/batting/statistics',
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
    history: createWebHistory(),
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
