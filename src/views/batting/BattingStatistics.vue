<script setup>
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import battingService from '@/services/battingService';
import SearchBar from '@/components/SearchBar.vue';
import BipChart from '@/components/charts/BipChart.vue';
import BattingField from '@/components/charts/BattingField.vue';
import { useRouter, onBeforeRouteLeave } from 'vue-router';
import { useMasterDataStore } from '@/stores/masterData';
import { useSearchStore } from '@/stores/searchStore';
import { storeToRefs } from 'pinia';

const { t } = useI18n();
const router = useRouter();

// Initialize stores
const masterDataStore = useMasterDataStore();
const searchStore = useSearchStore();
const { seasons, fields, myTeams, opponentTeams } = storeToRefs(masterDataStore);
const { searchForm, currentPage, isSearchOpen } = storeToRefs(searchStore);

// Data State
const summaryStats = ref(null);
const gameRecords = ref([]);
const pagination = ref({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    perPage: 10
});
const isLoading = ref(true);
const isRecordsLoading = ref(false);

// Fetch Master Data from store
const fetchMasterData = async () => {
    await masterDataStore.fetchAll();
};

const getQueryParams = () => {
    const params = { ...searchForm.value };
    Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
            delete params[key];
        }
        if (key === 'gameDate' && (!params[key][0] && !params[key][1])) {
            delete params[key];
        }
    });
    return params;
};

const fetchSummary = async () => {
    const params = getQueryParams();
    const res = await battingService.getBattingStatistics(params);
    summaryStats.value = res.data.result;
};

const fetchRecords = async (page = 1) => {
    isRecordsLoading.value = true;
    try {
        const params = { ...getQueryParams(), page };
        const res = await battingService.getBattingRecords(params);
        if (res.data.result) {
            gameRecords.value = res.data.result.data || [];
            pagination.value = {
                currentPage: res.data.result.current_page || page,
                totalPages: res.data.result.total_pages || 1,
                totalItems: res.data.result.total || 0,
                perPage: res.data.result.paginate || 10
            };
        } else {
             gameRecords.value = [];
        }
    } catch (error) {
        console.error('Failed to fetch records:', error);
    } finally {
        isRecordsLoading.value = false;
    }
};

const handleSearch = async () => {
    isLoading.value = true;
    try {
        await Promise.all([fetchSummary(), fetchRecords(1)]);
    } catch (error) {
        console.error('Search failed:', error);
    } finally {
        isLoading.value = false;
    }
};

const clearSearch = () => {
    searchStore.resetSearch(true);
};

const changePage = (page) => {
    if (page >= 1 && page <= pagination.value.totalPages) {
        fetchRecords(page);
    }
};

const goToGame = (gameId) => {
    router.push(`/games/${gameId}`);
};

onMounted(async () => {
    await fetchMasterData();
    handleSearch();
});

// Clear search when leaving, except when going to game detail
onBeforeRouteLeave((to, from) => {
    if (!to.path.startsWith('/games/')) {
        searchStore.resetSearch(false);
    }
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col md:flex-row justify-between items-center bg-gray-800/40 backdrop-blur-md p-4 rounded-2xl border border-white/5 shadow-lg gap-4">
      <h1 class="page-title !mb-0 text-xl md:text-2xl w-full md:w-auto text-left flex items-center gap-2">
         <span class="text-purple-500">📈</span>
         <span>{{ t('batting.title') }} - {{ t('nav.battingStats') }}</span>
      </h1>
    </div>

    <!-- Search Bar Component -->
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
    />

    <!-- Loading State -->
    <div v-if="isLoading" class="flex flex-col items-center justify-center py-20 space-y-4">
      <div class="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
      <p class="text-gray-400 font-medium animate-pulse">{{ t('common.loading') }}</p>
    </div>

    <!-- Content -->
    <div v-else-if="summaryStats" class="space-y-8 animate-fade-in pb-20">

      <!-- 1. Statistics Cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="stats-card border-t-4 border-t-blue-500">
             <div class="text-gray-400 text-xs font-bold uppercase tracking-widest">{{ t('batting.AVG') }}</div>
             <div class="text-3xl lg:text-4xl font-black text-white font-mono">{{ summaryStats.statistics.AVG ==1 ? '1.000' : summaryStats.statistics.AVG.toFixed(3).replace(/^0+/, '') }}</div>
        </div>
        <div class="stats-card border-t-4 border-t-green-500">
             <div class="text-gray-400 text-xs font-bold uppercase tracking-widest">{{ t('batting.OBP') }}</div>
             <div class="text-3xl lg:text-4xl font-black text-white font-mono">{{ summaryStats.statistics.OBP == 1 ? '1.000' : summaryStats.statistics.OBP.toFixed(3).replace(/^0+/, '') }}</div>
        </div>
        <div class="stats-card border-t-4 border-t-red-500">
             <div class="text-gray-400 text-xs font-bold uppercase tracking-widest">{{ t('batting.SLG') }}</div>
             <div class="text-3xl lg:text-4xl font-black text-white font-mono">{{ summaryStats.statistics.SLG == 1 ? '1.000' : summaryStats.statistics.SLG.toFixed(3).replace(/^0+/, '') }}</div>
        </div>
        <div class="stats-card border-t-4 border-t-purple-500">
             <div class="text-gray-400 text-xs font-bold uppercase tracking-widest">{{ t('batting.OPS') }}</div>
             <div class="text-3xl lg:text-4xl font-black text-white font-mono">{{ summaryStats.statistics.OPS.toFixed(3) }}</div>
        </div>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
         <div class="stats-card">
             <div class="text-gray-400 text-xs">{{ t('batting.rispAvg') }}</div>
             <div class="text-2xl font-bold text-gray-200 font-mono">{{ summaryStats.statistics.RISP_AVG == 1 ? '1.000' : summaryStats.statistics.RISP_AVG.toFixed(3).replace(/^0+/, '') }}</div>
         </div>
          <div class="stats-card">
             <div class="text-gray-400 text-xs">{{ t('batting.kPercentage') }}</div>
             <div class="text-2xl font-bold text-gray-200 font-mono">{{ summaryStats.statistics.KPercentage }}%</div>
         </div>
          <div class="stats-card">
             <div class="text-gray-400 text-xs">{{ t('batting.bbPercentage') }}</div>
             <div class="text-2xl font-bold text-gray-200 font-mono">{{ summaryStats.statistics.BBPercentage }}%</div>
         </div>
          <div class="stats-card">
             <div class="text-gray-400 text-xs">{{ t('batting.sbPercentage') }}</div>
             <div class="text-2xl font-bold text-gray-200 font-mono">{{ summaryStats.statistics.SBPercentage }}%</div>
         </div>
      </div>

      <!-- 2. Visuals (BIP & Distribution) - 2/5 and 3/5 Layout -->
      <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <!-- BIP Analysis (2/5) -->
          <div class="card min-h-[400px] flex flex-col col-span-1 lg:col-span-2">
             <h3 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span class="text-green-400">🏏</span>
                擊球分佈 (BIP)
            </h3>
            <div class="flex-1 flex items-center justify-center w-full">
                <BipChart v-if="summaryStats.BIP" :data="summaryStats.BIP" />
                <div v-else class="text-gray-500">暫無數據</div>
            </div>
          </div>

          <!-- Hit Distribution (3/5) -->
          <div class="card min-h-[400px] flex flex-col col-span-1 lg:col-span-3">
             <h3 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span class="text-orange-400">📍</span>
                落點分佈
            </h3>
            <div class="flex-1 flex items-center justify-center w-full">
                 <BattingField v-if="summaryStats.distribution" :data="summaryStats.distribution" />
                 <div v-else class="text-gray-500">暫無數據</div>
            </div>
          </div>
      </div>

      <!-- 3. Totals Grid - Moved Down -->
      <div class="card">
        <h3 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span class="text-blue-400">📊</span>
            {{ t('batting.battingStats') }}
        </h3>
        <div class="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-9 gap-2">
            <div v-for="(value, key) in summaryStats.total" :key="key" class="p-3 bg-gray-900/40 rounded-lg text-center border border-white/5">
                <div class="text-xs text-gray-500 uppercase mb-1">{{ t(`batting.${key}`) || key }}</div>
                <div class="font-bold text-lg text-white font-mono">{{ value }}</div>
            </div>
        </div>
      </div>

      <!-- 4. Game Log Table -->
      <div class="card relative">
        <!-- Records Loading Overlay -->
        <div v-if="isRecordsLoading" class="absolute inset-0 bg-gray-900/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl">
             <div class="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>


         <h3 class="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <span class="text-yellow-500">📝</span>
            {{ t('batting.battingRecords') }}
        </h3>
        
        <!-- Enhanced Responsive Table -->
        <div class="overflow-x-auto -mx-2 sm:mx-0 rounded-xl border border-gray-700/30">
             <table class="min-w-full divide-y divide-gray-700/50 whitespace-nowrap">
                <!-- Sticky Header -->
                <thead class="bg-gray-800/80 backdrop-blur-sm sticky top-0 z-10">
                    <tr>
                         <!-- Sticky Date Column Header -->
                         <th class="px-4 py-4 text-left text-sm font-bold text-gray-300 uppercase tracking-wider sticky left-0 z-20 shadow-[2px_0_8px_rgba(0,0,0,0.3)]">
                            <div class="flex items-center gap-2">
                                <svg class="w-3 h-3 md:w-4 md:h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                </svg>
                                <span>{{ t('games.date') }}</span>
                            </div>
                         </th>
                         <th class="px-2 py-4 text-center text-sm font-bold text-gray-300 uppercase tracking-wider min-w-[3.5rem]">
                            <div class="flex items-center gap-2">
                                <span>{{ t('games.opponentTeam') }}</span>
                            </div>
                         </th>
                         <!-- Stats Headers with larger text -->
                         <th v-for="header in ['PA', 'AB', 'RBI', 'R', 'single', 'double', 'triple', 'HR', 'BB', 'IBB', 'HBP', 'SO', 'SH', 'SF', 'SB', 'CS']" :key="header" 
                            class="px-2 py-4 text-center text-sm font-bold text-gray-300 uppercase tracking-wider min-w-[3.5rem]"
                         >
                             {{ t(`batting.${header}`) || header }}
                         </th>
                         <!-- Sticky Detail Column Header -->
                         <th class="px-4 py-4 text-center text-sm font-bold text-gray-300 uppercase tracking-wider sticky right-0 z-20 shadow-[-2px_0_8px_rgba(0,0,0,0.3)]">
                            <svg class="w-4 h-4 md:w-5 md:h-5 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                         </th>
                    </tr>
                </thead>
                
                <!-- Table Body without Zebra Stripes -->
                <tbody class="divide-y divide-gray-700/30">
                    <tr v-for="(game, index) in gameRecords" :key="index" 
                        class="group hover:bg-gray-800 transition-all duration-200"
                    >
                        <!-- Sticky Date Cell with larger font -->
                        <td class="px-4 py-4 sticky left-0 z-20 shadow-[2px_0_6px_rgba(0,0,0,0.2)] group-hover:bg-gray-800 transition-colors"
                        >
                            <div class="text-gray-200 font-semibold text-sm md:text-base whitespace-nowrap">{{ game.gameDate }}</div>
                        </td>

                        <!-- Opponent Cell -->
                        <td class="px-2 py-4 text-center font-mono text-base text-gray-300">
                            {{ game.teamNameEnemy }}
                        </td>
                        
                        <!-- Stats Cells with larger font -->
                        <td class="px-2 py-4 text-center font-mono text-base text-gray-300">{{ game.PA }}</td>
                        <td class="px-2 py-4 text-center font-mono text-base text-gray-300">{{ game.AB }}</td>
                        <td class="px-2 py-4 text-center font-mono text-base text-gray-300">{{ game.RBI }}</td>
                        <td class="px-2 py-4 text-center font-mono text-base text-gray-300">{{ game.R }}</td>
                        <td class="px-2 py-4 text-center font-mono text-base text-gray-300">{{ game.single }}</td>
                        <td class="px-2 py-4 text-center font-mono text-base text-gray-300">{{ game.double }}</td>
                        <td class="px-2 py-4 text-center font-mono text-base text-gray-300">{{ game.triple }}</td>
                        <td class="px-2 py-4 text-center font-mono text-base text-gray-300">{{ game.HR }}</td>
                        <td class="px-2 py-4 text-center font-mono text-base text-gray-300">{{ game.BB }}</td>
                        <td class="px-2 py-4 text-center font-mono text-base text-gray-300">{{ game.IBB }}</td>
                        <td class="px-2 py-4 text-center font-mono text-base text-gray-300">{{ game.HBP }}</td>
                        <td class="px-2 py-4 text-center font-mono text-base text-gray-300">{{ game.SO }}</td>
                        <td class="px-2 py-4 text-center font-mono text-base text-gray-300">{{ game.SH }}</td>
                        <td class="px-2 py-4 text-center font-mono text-base text-gray-300">{{ game.SF }}</td>
                        <td class="px-2 py-4 text-center font-mono text-base text-gray-300">{{ game.SB }}</td>
                        <td class="px-2 py-4 text-center font-mono text-base text-gray-300">{{ game.CS }}</td>
                        
                        <!-- Sticky Detail Button -->
                        <td class="px-4 py-4 text-center sticky right-0 z-20 shadow-[-2px_0_6px_rgba(0,0,0,0.2)] group-hover:bg-gray-800 transition-colors"
                        >
                             <button @click="goToGame(game.gameId)" 
                                class="p-2 rounded-lg bg-gray-700/80 hover:bg-blue-600 text-gray-300 hover:text-white transition-all transform hover:scale-110 shadow-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                             </button>
                        </td>
                    </tr>
                </tbody>
             </table>
        </div>

        <!-- Pagination -->
        <div v-if="gameRecords.length > 0 && pagination.totalPages > 1" class="flex items-center justify-between mt-6 pt-4 border-t border-white/5">
             <div class="text-sm text-gray-500">
                第 {{ pagination.currentPage }} 頁，共 {{ pagination.totalPages }} 頁 ({{ pagination.totalItems }} 筆)
            </div>
            <div class="flex gap-2">
                <button 
                    @click="changePage(pagination.currentPage - 1)" 
                    :disabled="pagination.currentPage === 1"
                    class="px-3 py-1.5 rounded bg-gray-800 border border-gray-700 text-sm hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {{ t('common.prev') }}
                </button>
                <button 
                    @click="changePage(pagination.currentPage + 1)" 
                    :disabled="pagination.currentPage === pagination.totalPages"
                    class="px-3 py-1.5 rounded bg-gray-800 border border-gray-700 text-sm hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {{ t('common.next') }}
                </button>
            </div>
        </div>
      </div>
    
    </div>

    <!-- Empty State -->
    <div v-else-if="!isLoading && !summaryStats" class="flex flex-col items-center justify-center py-20 bg-gray-800/30 rounded-2xl border border-white/5 border-dashed">
      <div class="text-6xl mb-4 opacity-50">📊</div>
      <p class="text-gray-400 text-lg font-medium">{{ t('common.noData') }}</p>
    </div>
  </div>
</template>

<style scoped>
.stats-card {
    background-color: rgba(31, 41, 55, 0.5);
    backdrop-filter: blur(8px);
    border-radius: 0.75rem;
    padding: 1rem;
    border: 1px solid rgba(255, 255, 255, 0.05);
    transition: all 0.2s;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;
    min-height: 100px;
}
.stats-card:hover {
    border-color: rgba(59, 130, 246, 0.2);
}
</style>
