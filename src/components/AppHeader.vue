<script setup>
import { computed, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useLanguageStore } from '@/stores/language';
import { useI18n } from 'vue-i18n';
import LanguageSwitcher from './LanguageSwitcher.vue';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const languageStore = useLanguageStore();
const { t } = useI18n();
const isMobileMenuOpen = ref(false);

const isAuthenticated = computed(() => authStore.isAuthenticated);

const handleLogout = async () => {
  await authStore.logout();
  router.push('/login');
};

const navItems = [
  { to: '/games', label: 'nav.games' },
  { to: '/batting', label: 'nav.batting' },
  // { to: '/master-data', label: 'nav.masterData' },
  { to: '/profile', label: 'nav.profile' },
];

const isActive = (path) => route.path.startsWith(path);
</script>

<template>
  <header class="sticky top-0 z-50 w-full border-b border-white/10 bg-gray-900/80 backdrop-blur-xl">
    <div class="container mx-auto px-4 h-16 flex items-center justify-between">
      <!-- Logo Area -->
      <div class="flex items-center gap-8">
        <router-link to="/" class="flex items-center gap-2 group">
          <div class="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-300">
            <span class="text-lg">⚾</span>
          </div>
          <span class="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 group-hover:to-white transition-all">
            {{ t('common.appName') }}
          </span>
        </router-link>

        <!-- Desktop Nav -->
        <nav v-if="isAuthenticated" class="hidden md:flex items-center gap-1">
          <router-link 
            v-for="item in navItems" 
            :key="item.to"
            :to="item.to" 
            :class="[
              'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
              isActive(item.to) 
                ? 'bg-white/10 text-white shadow-inner' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            ]"
          >
            {{ t(item.label) }}
          </router-link>
        </nav>
      </div>

      <!-- Right Area -->
      <div class="flex items-center gap-4">
        <LanguageSwitcher />
        
        <button 
          v-if="isAuthenticated" 
          @click="handleLogout" 
          class="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 text-xs font-medium text-gray-400 hover:text-white hover:bg-white/5 hover:border-white/20 transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clip-rule="evenodd" />
          </svg>
          {{ t('common.logout') }}
        </button>

        <!-- Mobile Menu Button -->
        <button 
          v-if="isAuthenticated"
          @click="isMobileMenuOpen = !isMobileMenuOpen"
          class="md:hidden p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
        >
          <svg v-if="!isMobileMenuOpen" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Mobile Menu -->
    <div v-show="isMobileMenuOpen && isAuthenticated" class="md:hidden border-t border-white/10 bg-gray-900/95 backdrop-blur-xl animate-fade-in-down">
      <div class="container mx-auto px-4 py-4 space-y-2">
        <router-link 
          v-for="item in navItems" 
          :key="item.to"
          :to="item.to" 
          class="block px-4 py-3 rounded-xl text-base font-medium transition-colors"
          :class="isActive(item.to) ? 'bg-blue-600/20 text-blue-400' : 'text-gray-400 hover:bg-white/5 hover:text-white'"
          @click="isMobileMenuOpen = false"
        >
          {{ t(item.label) }}
        </router-link>
        <button 
          @click="handleLogout"
          class="w-full text-left px-4 py-3 rounded-xl text-base font-medium text-red-400 hover:bg-red-500/10 transition-colors"
        >
          {{ t('common.logout') }}
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.animate-fade-in-down {
  animation: fadeInDown 0.2s ease-out forwards;
}

@keyframes fadeInDown {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
