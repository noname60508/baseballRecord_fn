<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '@/stores/auth';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const email = ref('');
const token = ref('');
const password = ref('');
const confirmPassword = ref('');
const isLoading = ref(false);
const error = ref('');
const success = ref(false);

onMounted(() => {
  email.value = route.query.email || '';
  token.value = route.query.token || '';
  
  if (!email.value || !token.value) {
    error.value = t('login.invalidResetLink');
  }
});

const handleReset = async () => {
  error.value = '';
  
  if (password.value !== confirmPassword.value) {
    error.value = t('login.passwordMismatch');
    return;
  }

  if (password.value.length < 6) {
    error.value = t('login.passwordTooShort');
    return;
  }

  isLoading.value = true;
  try {
    await authStore.resetPassword({
      email: email.value,
      token: token.value,
      password: password.value
    });
    success.value = true;
    setTimeout(() => {
      router.push('/login');
    }, 3000);
  } catch (error) {
    console.error('Reset failed:', error);
    error.value = error.response?.data?.result || t('common.failed');
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-900 px-4 py-12 relative overflow-hidden">
    <!-- Animated background -->
    <div class="absolute inset-0 z-0">
      <div class="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse"></div>
      <div class="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse" style="animation-delay: 2s"></div>
    </div>

    <div class="max-w-md w-full z-10">
      <!-- Logo/Title Area -->
      <div class="text-center mb-10 transform transition-all duration-500">
        <div class="inline-flex items-center justify-center p-4 bg-white/5 rounded-3xl backdrop-blur-xl border border-white/10 shadow-2xl mb-6 group hover:scale-105 transition-transform duration-300">
          <span class="text-5xl group-hover:rotate-12 transition-transform duration-300">⚾</span>
        </div>
        <h1 class="text-4xl font-extrabold text-white tracking-tight mb-2 flex items-center justify-center gap-3">
          {{ t('common.appName') }}
        </h1>
        <p class="text-gray-400 font-medium tracking-wide prose prose-invert">
          {{ t('login.resetPasswordTitle') }}
        </p>
      </div>

      <!-- Reset Form Card -->
      <div class="bg-gray-800/40 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-white/10 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] relative overflow-hidden group">
        <!-- Success State -->
        <div v-if="success" class="text-center py-8 animate-fade-in">
          <div class="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/30">
            <span class="text-3xl text-green-400">✅</span>
          </div>
          <h2 class="text-2xl font-bold text-white mb-2">{{ t('login.resetSuccess') }}</h2>
          <p class="text-gray-400">{{ t('login.redirectingToLogin') }}</p>
        </div>

        <form v-else @submit.prevent="handleReset" class="space-y-6">
          <!-- Error/Info Message -->
          <div v-if="error" class="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl animate-shake">
            <p class="text-red-400 text-sm font-medium flex items-center gap-2">
              <span class="text-lg">⚠️</span> {{ error }}
            </p>
          </div>

          <div class="space-y-1">
            <label class="block text-sm font-semibold text-gray-300 ml-1">{{ t('login.email') }}</label>
            <div class="relative group/input">
              <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within/input:text-blue-400 transition-colors">📧</span>
              <input 
                :value="email"
                disabled
                class="w-full bg-gray-900/50 border border-gray-700/50 text-gray-500 px-12 py-4 rounded-2xl cursor-not-allowed opacity-70"
              />
            </div>
          </div>

          <div class="space-y-1">
            <label class="block text-sm font-semibold text-gray-300 ml-1">{{ t('login.password') }}</label>
            <div class="relative group/input">
              <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within/input:text-blue-400 transition-colors">🔒</span>
              <input 
                v-model="password"
                type="password" 
                required
                :placeholder="t('login.passwordPlaceholder')"
                class="w-full bg-gray-900/50 border border-gray-700/50 text-white px-12 py-4 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder-gray-600 font-mono"
              />
            </div>
          </div>

          <div class="space-y-1">
            <label class="block text-sm font-semibold text-gray-300 ml-1">{{ t('login.confirmPassword') }}</label>
            <div class="relative group/input">
              <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within/input:text-blue-400 transition-colors">🔄</span>
              <input 
                v-model="confirmPassword"
                type="password" 
                required
                :placeholder="t('login.confirmPasswordPlaceholder')"
                class="w-full bg-gray-900/50 border border-gray-700/50 text-white px-12 py-4 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder-gray-600 font-mono"
              />
            </div>
          </div>

          <button 
            type="submit" 
            :disabled="isLoading || !token"
            class="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white py-4 rounded-2xl font-bold text-lg hover:from-blue-500 hover:to-blue-400 active:scale-[0.98] transition-all duration-200 shadow-xl shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 mt-4"
          >
            <span v-if="isLoading" class="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></span>
             {{ t('common.confirm') }}
          </button>
        </form>
      </div>

      <div class="mt-8 text-center text-gray-500">
        <router-link to="/login" class="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
          {{ t('login.switchToLogin') }}
        </router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

.animate-fade-in {
  animation: fade-in 0.5s ease-out forwards;
}

.animate-shake {
  animation: shake 0.3s ease-in-out;
}
</style>
