<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import gameService from '@/services/gameService';

const router = useRouter();
const { t } = useI18n();

const games = ref([]);
const isLoading = ref(true);

const fetchGames = async () => {
  try {
    const response = await gameService.getGames();
    games.value = response.data;
  } catch (error) {
    console.error('Failed to fetch games:', error);
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchGames();
});
</script>

<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center bg-gray-800/40 backdrop-blur-md p-4 rounded-2xl border border-white/5 shadow-lg">
      <h1 class="page-title !mb-0 text-xl md:text-2xl">
        <span class="text-blue-500">⚾</span>
        {{ t('games.title') }}
      </h1>
      <router-link to="/games/new" class="btn-primary flex items-center gap-2 group">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 transform group-hover:rotate-90 transition-transform duration-300" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
        </svg>
        <span>{{ t('games.addGame') }}</span>
      </router-link>
    </div>

    <div v-if="isLoading" class="flex flex-col items-center justify-center py-20 space-y-4">
      <div class="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
      <p class="text-gray-400 font-medium animate-pulse">{{ t('common.loading') }}</p>
    </div>

    <div v-else-if="games.length === 0" class="flex flex-col items-center justify-center py-20 bg-gray-800/30 rounded-2xl border border-white/5 border-dashed">
      <div class="text-6xl mb-4 opacity-50">🏟️</div>
      <p class="text-gray-400 text-lg font-medium">{{ t('common.noData') }}</p>
      <router-link to="/games/new" class="mt-4 text-blue-400 hover:text-blue-300 text-sm font-medium hover:underline">
        {{ t('games.addGame') }}
      </router-link>
    </div>

    <div v-else class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <div 
        v-for="game in games" 
        :key="game.id" 
        class="card group hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-900/20 hover:border-blue-500/30 transition-all duration-300 cursor-pointer relative overflow-hidden" 
        @click="router.push(`/games/${game.id}`)"
      >
        <!-- Background decorative gradient -->
        <div class="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-2xl group-hover:from-blue-500/20 transition-all"></div>

        <div class="flex justify-between items-start mb-4 relative z-10">
          <div class="bg-gray-700/50 backdrop-blur-sm px-3 py-1 rounded-lg border border-white/5 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span class="text-gray-300 text-sm font-medium">{{ game.date }}</span>
          </div>
          <span class="text-xs font-bold text-blue-400 uppercase tracking-widest px-2 py-1 bg-blue-500/10 rounded">
            {{ game.season_name }}
          </span>
        </div>
        
        <div class="flex items-center justify-between mb-6 relative z-10 px-2">
          <div class="text-center flex-1">
            <div class="font-bold text-3xl text-white mb-1 drop-shadow-lg" :class="{ 'text-green-400': game.my_team_score > game.opponent_score, 'text-red-400': game.my_team_score < game.opponent_score }">
              {{ game.my_team_score || 0 }}
            </div>
            <div class="text-xs text-gray-400 font-medium uppercase tracking-wider">My Team</div>
          </div>
          
          <div class="text-gray-600 font-bold px-4 text-xl italic opacity-50">VS</div>
          
          <div class="text-center flex-1">
            <div class="font-bold text-3xl text-white mb-1 drop-shadow-lg" :class="{ 'text-red-400': game.my_team_score > game.opponent_score, 'text-green-400': game.my_team_score < game.opponent_score }">
              {{ game.opponent_score || 0 }}
            </div>
            <div class="text-xs text-gray-400 font-medium uppercase tracking-wider truncate max-w-[100px] mx-auto" :title="game.opponent_name">
              {{ game.opponent_name }}
            </div>
          </div>
        </div>
        
        <div class="border-t border-white/5 pt-4 mt-auto flex justify-between items-center text-sm text-gray-500 relative z-10">
          <div class="flex items-center gap-2 group-hover:text-blue-400 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
            </svg>
            <span class="truncate max-w-[150px]">{{ game.field_name }}</span>
          </div>
          <div class="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1 duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
