<script setup>
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import battingService from '@/services/battingService';

const { t } = useI18n();

const stats = ref(null);
const isLoading = ref(true);

const fetchStats = async () => {
  try {
    const response = await battingService.getBattingStatistics();
    stats.value = response.data;
  } catch (error) {
    console.error('Failed to fetch batting statistics:', error);
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchStats();
});
</script>

<template>
  <div class="space-y-8">
    <h1 class="page-title !mb-0">
      <span class="text-purple-500">📈</span>
      {{ t('batting.title') }} - {{ t('nav.battingStats') }}
    </h1>

    <div v-if="isLoading" class="flex flex-col items-center justify-center py-20 space-y-4">
      <div class="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
      <p class="text-gray-400 font-medium animate-pulse">{{ t('common.loading') }}</p>
    </div>

    <div v-else-if="!stats" class="flex flex-col items-center justify-center py-20 bg-gray-800/30 rounded-2xl border border-white/5 border-dashed">
      <div class="text-6xl mb-4 opacity-50">📊</div>
      <p class="text-gray-400 text-lg font-medium">{{ t('common.noData') }}</p>
    </div>

    <div v-else class="space-y-8">
      <!-- Key Metrics -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <!-- AVG -->
        <div class="card relative overflow-hidden group hover:scale-105 transition-transform duration-300 border-t-4 border-t-blue-500">
          <div class="absolute -right-6 -bottom-6 w-24 h-24 bg-blue-500/10 rounded-full blur-xl group-hover:bg-blue-500/20 transition-colors"></div>
          <h3 class="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">打擊率 (AVG)</h3>
          <div class="text-5xl font-black text-white font-mono tracking-tight group-hover:text-blue-400 transition-colors">
            {{ stats.avg }}
          </div>
        </div>

        <!-- OPS -->
        <div class="card relative overflow-hidden group hover:scale-105 transition-transform duration-300 border-t-4 border-t-purple-500">
          <div class="absolute -right-6 -bottom-6 w-24 h-24 bg-purple-500/10 rounded-full blur-xl group-hover:bg-purple-500/20 transition-colors"></div>
          <h3 class="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">整體攻擊指數 (OPS)</h3>
          <div class="text-5xl font-black text-white font-mono tracking-tight group-hover:text-purple-400 transition-colors">
            {{ stats.ops }}
          </div>
        </div>

        <!-- Hits -->
        <div class="card relative overflow-hidden group hover:scale-105 transition-transform duration-300 border-t-4 border-t-green-500">
           <div class="absolute -right-6 -bottom-6 w-24 h-24 bg-green-500/10 rounded-full blur-xl group-hover:bg-green-500/20 transition-colors"></div>
          <h3 class="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">總安打數 (Hits)</h3>
          <div class="text-5xl font-black text-white font-mono tracking-tight group-hover:text-green-400 transition-colors">
            {{ stats.total_hits }}
          </div>
        </div>

        <!-- HR -->
        <div class="card relative overflow-hidden group hover:scale-105 transition-transform duration-300 border-t-4 border-t-red-500">
           <div class="absolute -right-6 -bottom-6 w-24 h-24 bg-red-500/10 rounded-full blur-xl group-hover:bg-red-500/20 transition-colors"></div>
          <h3 class="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">全壘打 (HR)</h3>
          <div class="text-5xl font-black text-white font-mono tracking-tight group-hover:text-red-400 transition-colors">
            {{ stats.total_hr }}
          </div>
        </div>
      </div>

      <!-- Detail Stats -->
      <div class="card">
        <h3 class="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          詳細數據
        </h3>
        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          <div class="p-4 bg-gray-900/50 rounded-xl border border-white/5 text-center group hover:border-blue-500/30 transition-colors">
            <div class="text-xs text-gray-500 mb-1 group-hover:text-blue-400 transition-colors">打數 (AB)</div>
            <div class="font-bold text-xl text-white font-mono">{{ stats.at_bats }}</div>
          </div>
          <div class="p-4 bg-gray-900/50 rounded-xl border border-white/5 text-center group hover:border-blue-500/30 transition-colors">
            <div class="text-xs text-gray-500 mb-1 group-hover:text-blue-400 transition-colors">打點 (RBI)</div>
            <div class="font-bold text-xl text-white font-mono">{{ stats.rbi }}</div>
          </div>
          <div class="p-4 bg-gray-900/50 rounded-xl border border-white/5 text-center group hover:border-blue-500/30 transition-colors">
            <div class="text-xs text-gray-500 mb-1 group-hover:text-blue-400 transition-colors">得分 (R)</div>
            <div class="font-bold text-xl text-white font-mono">{{ stats.runs }}</div>
          </div>
          <div class="p-4 bg-gray-900/50 rounded-xl border border-white/5 text-center group hover:border-blue-500/30 transition-colors">
            <div class="text-xs text-gray-500 mb-1 group-hover:text-blue-400 transition-colors">盜壘 (SB)</div>
            <div class="font-bold text-xl text-white font-mono">{{ stats.sb }}</div>
          </div>
          <div class="p-4 bg-gray-900/50 rounded-xl border border-white/5 text-center group hover:border-blue-500/30 transition-colors">
            <div class="text-xs text-gray-500 mb-1 group-hover:text-blue-400 transition-colors">保送 (BB)</div>
            <div class="font-bold text-xl text-white font-mono">{{ stats.bb }}</div>
          </div>
          <div class="p-4 bg-gray-900/50 rounded-xl border border-white/5 text-center group hover:border-blue-500/30 transition-colors">
            <div class="text-xs text-gray-500 mb-1 group-hover:text-blue-400 transition-colors">三振 (SO)</div>
            <div class="font-bold text-xl text-white font-mono">{{ stats.so }}</div>
          </div>
          <div class="p-4 bg-gray-900/50 rounded-xl border border-white/5 text-center group hover:border-blue-500/30 transition-colors">
            <div class="text-xs text-gray-500 mb-1 group-hover:text-blue-400 transition-colors">長打率 (SLG)</div>
            <div class="font-bold text-xl text-white font-mono">{{ stats.slg }}</div>
          </div>
          <div class="p-4 bg-gray-900/50 rounded-xl border border-white/5 text-center group hover:border-blue-500/30 transition-colors">
            <div class="text-xs text-gray-500 mb-1 group-hover:text-blue-400 transition-colors">上壘率 (OBP)</div>
            <div class="font-bold text-xl text-white font-mono">{{ stats.obp }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
