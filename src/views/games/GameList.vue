<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRouter, onBeforeRouteLeave } from 'vue-router';
import { useI18n } from 'vue-i18n';
import gameService from '@/services/gameService';
import SearchBar from '@/components/SearchBar.vue';
import GameFormModal from '@/components/GameFormModal.vue';
import { useMasterDataStore } from '@/stores/masterData';
import { useSearchStore } from '@/stores/searchStore';
import { storeToRefs } from 'pinia';


const router = useRouter();
const { t } = useI18n();

// Initialize stores
const masterDataStore = useMasterDataStore();
const searchStore = useSearchStore();
const { seasons, fields, myTeams, opponentTeams } = storeToRefs(masterDataStore);
const { searchForm, currentPage, isSearchOpen } = storeToRefs(searchStore);

// Local state
const games = ref([]);
const isLoading = ref(true);
const totalPages = ref(1);
const pageInput = ref(currentPage.value);
const showGameFormModal = ref(false);

// Fetch master data on mount
const fetchMasterData = async () => {
    await masterDataStore.fetchAll();
};

const fetchGames = async (page = 1) => {
  isLoading.value = true;
  try {
    const params = {
      page,
      paginate_rows: 6,
      ...searchForm.value
    };

    // Clean empty params
    Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
            delete params[key];
        }
        // check for gameDate array
        if (key === 'gameDate' && (!params[key][0] && !params[key][1])) {
            delete params[key];
        }
    });

    const response = await gameService.getGames(params);
    games.value = response.data.result.data || [];
    totalPages.value = response.data.result.total_pages || 1;
    gameListStore.setCurrentPage(page);
  } catch (error) {
    console.error('Failed to fetch games:', error);
  } finally {
    isLoading.value = false;
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

watch(currentPage, (val) => {
  pageInput.value = val;
});

const handlePageJump = () => {
    let page = parseInt(pageInput.value);
    if (isNaN(page)) {
        pageInput.value = currentPage.value;
        return;
    }
    if (page < 1) page = 1;
    if (page > totalPages.value) page = totalPages.value;
    
    if (page !== currentPage.value) {
        fetchGames(page);
    } else {
        pageInput.value = currentPage.value; // Reset if same
    }
};

const handleSearch = () => {
    fetchGames(1);
};

const clearSearch = () => {
    searchStore.resetSearch(true);
    // Removed fetchGames(1) - only clear fields
};

const getGameColor = (result) => {
  switch (Number(result)) {
    case 1: return 'border-green-500/50 hover:shadow-green-900/20'; // Win
    case 2: return 'border-red-500/50 hover:shadow-red-900/20'; // Loss
    case 3: return 'border-yellow-500/50 hover:shadow-yellow-900/20'; // Tie
    default: return 'border-white/5 hover:shadow-blue-900/20';
  }
};

const getResultBadgeColor = (result) => {
  switch (Number(result)) {
    case 1: return 'bg-green-500/20 text-green-400 border-green-500/30'; // Win
    case 2: return 'bg-red-500/20 text-red-400 border-red-500/30'; // Loss
    case 3: return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'; // Tie
    default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
};

const getResultText = (result) => {
    switch (Number(result)) {
    case 1: return t('games.win');
    case 2: return t('games.loss');
    case 3: return t('games.tie');
    default: return '-';
  }
}

const formatBattingSummary = (batterResult) => {
    if (!batterResult) return '';
    const r = batterResult;
    const hits = (Number(r.single) || 0) + (Number(r.double) || 0) + (Number(r.triple) || 0) + (Number(r.HR) || 0);
    let text = `${r.AB || 0} - ${hits} `;
    
    if (Number(r.HR) > 0) text += `, ${r.HR}${t('basic.HR')}`;
    if (Number(r.BB) > 0) text += `, ${r.BB}${t('basic.BB')}`;
    if (Number(r.HBP) > 0) text += `, ${r.HBP}${t('basic.HBP')}`;
    
    return text;
};

const handleGameSaved = (newGameId) => {
    if (newGameId) {
        router.push(`/games/${newGameId}`);
    } else {
        fetchGames(1);
    }
};

onMounted(() => {
  fetchMasterData();
  fetchGames(currentPage.value);
});

// Clear search form when leaving GameList (except when going to game detail)
onBeforeRouteLeave((to, from) => {
    // Clear search when leaving, except when going to game detail
    if (!to.path.startsWith('/games/')) {
        searchStore.resetSearch(false);
    }
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col md:flex-row justify-between items-center bg-gray-800/40 backdrop-blur-md p-4 rounded-2xl border border-white/5 shadow-lg gap-4">
      <h1 class="page-title !mb-0 text-xl md:text-2xl w-full md:w-auto text-left">
        <span class="text-blue-500">⚾</span>
        {{ t('games.title') }}
      </h1>
    </div>

    <!-- SearchBar Component -->
    <SearchBar
        v-model="searchForm"
        v-model:is-open="isSearchOpen"
        :seasons="seasons"
        :my-teams="myTeams"
        :opponent-teams="opponentTeams"
        :fields="fields"
        :show-game-result="true"
        @search="handleSearch"
        @clear="clearSearch"
    >
        <template #actions>
            <!-- Add Game Button -->
            <button @click="showGameFormModal = true" class="btn-primary flex items-center gap-2 group whitespace-nowrap px-6 py-3 text-base shadow-xl">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 transform group-hover:rotate-90 transition-transform duration-300" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
                </svg>
                <span class="font-bold">{{ t('games.addGame') }}</span>
            </button>
        </template>
    </SearchBar>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex flex-col items-center justify-center py-20 space-y-4">
      <div class="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
      <p class="text-gray-400 font-medium animate-pulse">{{ t('common.loading') }}</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="games.length === 0" class="flex flex-col items-center justify-center py-20 bg-gray-800/30 rounded-2xl border border-white/5 border-dashed">
      <p class="text-gray-400 text-lg font-medium">{{ t('common.noData') }}</p>
    </div>

    <!-- Game List -->
    <div v-else class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <div 
        v-for="game in games" 
        :key="game.id" 
        class="card group hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 cursor-pointer relative overflow-hidden border"
        :class="getGameColor(game.gameResult)"
        @click="router.push(`/games/${game.id}`)"
      >
        <!-- Badge -->
        <div class="absolute top-0 right-0 px-6 py-2 bg-gray-800/90 rounded-bl-2xl text-lg font-black tracking-widest backdrop-blur-sm z-20 border-b border-l border-white/10 shadow-lg transform transition-transform group-hover:scale-105 origin-top-right" :class="getResultBadgeColor(game.gameResult)">
            {{ getResultText(game.gameResult) }}
        </div>

        <div class="flex justify-between items-start mb-4 relative z-10 pr-12">
           <div class="flex flex-col gap-1">
               <span class="text-xs font-bold text-gray-500 uppercase tracking-widest">{{ game.seasonName }}</span>
               <div class="flex items-center gap-2 text-gray-300 text-sm font-medium bg-gray-800/50 px-2 py-0.5 rounded border border-white/5 w-fit">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {{ game.gameDate }}
               </div>
           </div>
        </div>
        
        <!-- Scoreboard -->
        <div class="flex items-center justify-between mb-6 relative z-10 px-2">
            <!-- Left Side (First Attack) -->
            <div class="text-center flex-1">
                <!-- If HomeAway=1 (My Team First), Show MyTeam stats. If HomeAway=2 (Opponent First), Show Opponent stats -->
                <div class="font-bold text-4xl text-white mb-1 drop-shadow-md font-mono">
                     {{ game.homeAway === 1 ? game.score : game.enemyScore }}
                </div>
                <div class="text-xs font-medium uppercase tracking-wider truncate max-w-[100px] mx-auto">
                     <span v-if="game.homeAway === 1" class="text-blue-400 font-bold underline underline-offset-4 decoration-blue-500/50">{{ game.teamName }}</span>
                     <span v-else class="text-gray-400">{{ game.teamNameEnemy }}</span>
                </div>
            </div>

            <div class="text-gray-600 font-bold px-4 text-xl italic opacity-50">VS</div>
          
            <!-- Right Side (Second Attack) -->
            <div class="text-center flex-1">
                <!-- If HomeAway=1 (My Team First), Show Opponent stats. If HomeAway=2 (Opponent First), Show MyTeam stats -->
                <div class="font-bold text-4xl text-white mb-1 drop-shadow-md font-mono">
                    {{ game.homeAway === 1 ? game.enemyScore : game.score }}
                </div>
                 <div class="text-xs font-medium uppercase tracking-wider truncate max-w-[100px] mx-auto">
                    <span v-if="game.homeAway === 1" class="text-gray-400">{{ game.teamNameEnemy }}</span>
                    <span v-else class="text-blue-400 font-bold underline underline-offset-4 decoration-blue-500/50">{{ game.teamName }}</span>
                </div>
            </div>
        </div>

        <!-- Batting Summary -->
        <div v-if="game.batterResult" class="px-2 mb-4 relative z-10">
            <div class="text-[11px] leading-relaxed text-blue-300 font-medium bg-blue-500/5 p-2 rounded-lg border border-blue-500/10">
                {{ formatBattingSummary(game.batterResult) }}
            </div>
        </div>
        
        <div class="border-t border-white/5 pt-3 mt-auto flex justify-between items-center text-sm text-gray-500 relative z-10">
          <div class="flex items-center gap-1.5 group-hover:text-gray-300 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
            </svg>
            <span class="truncate max-w-[150px] text-xs">{{ game.fieldName }}</span>
          </div>
          <div class="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1 duration-300">
             👉
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination Controls -->
    <div v-if="totalPages > 1" class="flex justify-center mt-8 items-center space-x-2">
      <!-- First Page -->
      <button 
        @click="fetchGames(1)" 
        :disabled="currentPage === 1"
        class="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        :title="t('common.firstPage')"
      >
        &laquo;
      </button>

      <!-- Prev -->
      <button 
        @click="fetchGames(currentPage - 1)" 
        :disabled="currentPage === 1"
        class="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        :title="t('common.prev')"
      >
        &lt;
      </button>

      <!-- Page Jump Input -->
      <div class="flex items-center bg-gray-900 border border-gray-700/50 rounded-lg px-2 py-1.5 shadow-inner ring-1 ring-white/5">
        <input 
          v-model="pageInput"
          type="text" 
          class="w-8 bg-transparent text-center text-blue-400 border-none focus:ring-0 p-0 font-bold text-sm"
          @keyup.enter="handlePageJump"
          @blur="handlePageJump"
        >
        <span class="text-gray-500 mx-1.5 text-xs font-light italic">/</span>
        <span class="text-gray-300 text-sm font-semibold pr-1">{{ totalPages }}</span>
      </div>

      <!-- Next -->
      <button 
        @click="fetchGames(currentPage + 1)" 
        :disabled="currentPage === totalPages"
        class="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        :title="t('common.next')"
      >
        &gt;
      </button>

      <!-- Last Page -->
      <button 
        @click="fetchGames(totalPages)" 
        :disabled="currentPage === totalPages"
        class="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        :title="t('common.lastPage')"
      >
        &raquo;
      </button>
    </div>
  </div>

  <!-- Game Form Modal -->
  <GameFormModal :is-open="showGameFormModal" @close="showGameFormModal = false" @saved="handleGameSaved" />
</template>
