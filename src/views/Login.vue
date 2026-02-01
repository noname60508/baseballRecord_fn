<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useI18n } from 'vue-i18n';

const router = useRouter();
const authStore = useAuthStore();
const { t } = useI18n();

const account = ref('');
const password = ref('');
const error = ref('');
const isLoading = ref(false);

const handleLogin = async () => {
  error.value = '';
  isLoading.value = true;
  
  try {
    // 傳遞 account 而非 email
    await authStore.login({
      account: account.value,
      password: password.value
    });
    router.push('/games');
  } catch (err) {
    console.error('Login error:', err);
    error.value = '登入失敗，請檢查您的帳號密碼';
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-900 relative overflow-hidden login-bg">
    <!-- Background overlay with abstract baseball field feeling -->
    <div class="absolute inset-0 z-0">
      <div class="absolute inset-0 bg-gradient-to-br from-blue-900/40 to-gray-900/90 z-10"></div>
      <!-- Decorative light blobs -->
      <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl filter animate-pulse-slow"></div>
      <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-3xl filter animate-pulse-slow animation-delay-2000"></div>
    </div>

    <div class="w-full max-w-md p-8 relative z-20">
      <!-- Glassmorphism Card -->
      <div class="backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl rounded-2xl p-8 transform transition-all hover:scale-[1.01] duration-300">
        
        <div class="text-center mb-10">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-400 mb-4 shadow-lg shadow-blue-500/30">
            <span class="text-3xl">⚾</span>
          </div>
          <h1 class="text-3xl font-extrabold text-white tracking-wide mb-2 drop-shadow-md">
            {{ t('login.title') }}
          </h1>
          <p class="text-blue-200 text-sm font-light tracking-wider uppercase opacity-80">
            Baseball Management System
          </p>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-6">
          <div class="space-y-2">
            <label class="block text-xs font-semibold text-blue-300 uppercase tracking-wider ml-1">
              {{ t('login.account') }}
            </label>
            <div class="relative group">
              <input 
                v-model="account"
                type="text" 
                required
                class="w-full bg-gray-900/50 border border-gray-600 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-gray-500 backdrop-blur-sm group-hover:border-gray-500"
                :placeholder="t('login.accountPlaceholder')"
              >
            </div>
          </div>

          <div class="space-y-2">
            <label class="block text-xs font-semibold text-blue-300 uppercase tracking-wider ml-1">
              {{ t('login.password') }}
            </label>
            <div class="relative group">
              <input 
                v-model="password"
                type="password" 
                required
                class="w-full bg-gray-900/50 border border-gray-600 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-gray-500 backdrop-blur-sm group-hover:border-gray-500"
                :placeholder="t('login.passwordPlaceholder')"
              >
            </div>
          </div>

          <div v-if="error" class="bg-red-500/10 border border-red-500/50 rounded-lg p-3">
            <p class="text-red-400 text-sm text-center font-medium">
              {{ error }}
            </p>
          </div>

          <button 
            type="submit" 
            class="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
            :disabled="isLoading"
          >
            <span v-if="isLoading" class="flex items-center justify-center">
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ t('common.loading') }}
            </span>
            <span v-else>{{ t('login.loginButton') }}</span>
          </button>
        </form>
        
        <div class="mt-8 text-center">
          <p class="text-gray-400 text-xs">
            &copy; {{ new Date().getFullYear() }} Diamond Records
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-bg {
  background-image: url('https://images.unsplash.com/photo-1516731948332-9cb773b4e760?q=80&w=2600&auto=format&fit=crop'); /* Placeholder image for texture */
  background-size: cover;
  background-position: center;
}

@keyframes pulse-slow {
  0%, 100% { opacity: 0.4; transform: scale(1); }
  50% { opacity: 0.2; transform: scale(1.1); }
}

.animate-pulse-slow {
  animation: pulse-slow 8s infinite ease-in-out;
}

.animation-delay-2000 {
  animation-delay: 2s;
}
</style>
