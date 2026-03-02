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

// Tab State
const activeTab = ref('records');

// Data State
const summaryStats = ref(null);
const gameRecords = ref([]);
const isRecordsLoading = ref(false);
const pageInput = ref(1);

// Pagination
const pagination = ref({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0
});
const isLoading = ref(true);


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
            pageInput.value = pagination.value.currentPage;
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

const changePage = async (page) => {
    if (page < 1 || page > pagination.value.totalPages || isRecordsLoading.value) return;
    
    // Update pagination state
    pagination.value.currentPage = page;
    pageInput.value = page;
    
    // Fetch data
    await fetchRecords(page);
};

const handlePageJump = () => {
  let page = parseInt(pageInput.value);
  
  if (isNaN(page)) {
      pageInput.value = pagination.value.currentPage;
      return;
  }

  if (page < 1) page = 1;
  if (page > pagination.value.totalPages) page = pagination.value.totalPages;
  
  pageInput.value = page; // Update input to valid value
  if (page !== pagination.value.currentPage) {
      changePage(page);
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
      <h1 class="page-title !mb-0 text-xl md:text-2xl w-full md:w-auto text-center md:text-left flex items-center justify-center md:justify-start gap-2">
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

    <!-- Tabs Navigation -->
    <div class="flex p-1 space-x-1 bg-gray-800/60 rounded-xl w-fit mx-auto md:mx-0">
        <button
            @click="activeTab = 'records'"
            class="px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 flex items-center gap-2"
            :class="activeTab === 'records' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'"
        >
             {{ t('batting.detailedStats') }}
        </button>
        <button
            @click="activeTab = 'charts'"
            class="px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 flex items-center gap-2"
            :class="activeTab === 'charts' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'"
        >
            {{ t('batting.chartAnalysis') }}
        </button>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex flex-col items-center justify-center py-20 space-y-4">
      <div class="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
      <p class="text-gray-400 font-medium animate-pulse">{{ t('common.loading') }}</p>
    </div>

    <!-- Content -->
    <div v-else-if="summaryStats" class="space-y-8 animate-fade-in pb-20">

      <!-- Tab 1: Detailed Stats (Tables) -->
      <div v-show="activeTab === 'records'" class="space-y-8">
          
          <!-- Key Statistics Table -->
          <div class="overflow-x-auto rounded-xl border border-gray-700/30">
              <table class="min-w-full divide-y divide-gray-700/50 whitespace-nowrap">
                  <thead class="bg-gray-800">
                      <tr>
                          <th v-for="key in ['AVG', 'OBP', 'SLG', 'OPS', 'RISP_AVG', 'KPercentage', 'BBPercentage', 'SBPercentage']" :key="key" class="px-4 py-3 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">
                              {{ t(`batting.${key === 'RISP_AVG' ? 'rispAvg' : key}`) }}
                          </th>
                      </tr>
                  </thead>
                  <tbody class="bg-gray-900 divide-y divide-gray-700/30">
                      <tr>
                        <td class="px-4 py-4 text-center text-xl font-bold text-gray-200 font-mono">
                            {{ summaryStats.statistics.AVG == 1 ? '1.000' : summaryStats.statistics.AVG.toFixed(3).replace(/^0+/, '') }}
                        </td>
                        <td class="px-4 py-4 text-center text-xl font-bold text-gray-200 font-mono">
                            {{ summaryStats.statistics.OBP == 1 ? '1.000' : summaryStats.statistics.OBP.toFixed(3).replace(/^0+/, '') }}
                        </td>
                        <td class="px-4 py-4 text-center text-xl font-bold text-gray-200 font-mono">
                            {{ summaryStats.statistics.SLG == 1 ? '1.000' : summaryStats.statistics.SLG.toFixed(3).replace(/^0+/, '') }}
                        </td>
                        <td class="px-4 py-4 text-center text-xl font-bold text-gray-200 font-mono">
                            {{ summaryStats.statistics.OPS.toFixed(3) }}
                        </td>
                         <td class="px-4 py-4 text-center text-lg text-gray-200 font-mono">
                            {{ summaryStats.statistics.RISP_AVG == 1 ? '1.000' : summaryStats.statistics.RISP_AVG.toFixed(3).replace(/^0+/, '') }}
                        </td>
                        <td class="px-4 py-4 text-center text-lg text-gray-200 font-mono">
                            {{ summaryStats.statistics.KPercentage }}%
                        </td>
                        <td class="px-4 py-4 text-center text-lg text-gray-200 font-mono">
                            {{ summaryStats.statistics.BBPercentage }}%
                        </td>
                        <td class="px-4 py-4 text-center text-lg text-gray-200 font-mono">
                            {{ summaryStats.statistics.SBPercentage }}%
                        </td>
                      </tr>
                  </tbody>
              </table>
          </div>

          <!-- Total Stats Table -->
           <h3 class="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span class="text-blue-400">📊</span>
            {{ t('batting.battingStats') }}
          </h3>
           <div class="overflow-hidden rounded-xl border border-gray-700/30">
              <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-700/50 whitespace-nowrap">
                    <thead class="bg-gray-800">
                        <tr>
                            <th v-for="(value, key) in summaryStats.total" :key="key" class="px-4 py-3 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">
                                {{ t(`batting.${key}`) || key }}
                            </th>
                        </tr>
                    </thead>
                    <tbody class="bg-gray-900">
                        <tr>
                            <td v-for="(value, key) in summaryStats.total" :key="key" class="px-4 py-4 text-center text-lg font-bold text-white font-mono">
                                {{ value }}
                            </td>
                        </tr>
                    </tbody>
                </table>
              </div>
          </div>
      </div>

      <!-- Tab 2: Visuals (GorF & Distribution) -->
      <div v-show="activeTab === 'charts'" class="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <!-- GorF Analysis (2/5) -->
          <div class="card min-h-[400px] flex flex-col col-span-1 lg:col-span-2">
             <h3 class="text-lg font-bold text-white mb-4 flex items-center justify-center lg:justify-start gap-2">
                <span class="text-green-400">🏏</span>
                {{ t('GorF.title') }}
            </h3>
            <div class="flex-1 flex items-center justify-center w-full">
                <BipChart v-if="summaryStats.GorF" :data="summaryStats.GorF" />
                <div v-else class="text-gray-500">NO DATA</div>
            </div>
          </div>

          <!-- Hit Distribution (3/5) -->
          <div class="card min-h-[400px] flex flex-col col-span-1 lg:col-span-3">
             <h3 class="text-lg font-bold text-white mb-4 flex items-center justify-center lg:justify-start gap-2">
                <span class="text-orange-400">📍</span>
                {{ t('batting.distribution') }}
            </h3>
            <div class="flex-1 flex items-center justify-center w-full">
                 <BattingField v-if="summaryStats.distribution" :data="summaryStats.distribution" />
                 <div v-else class="text-gray-500">NO DATA</div>
            </div>
          </div>
      </div>

      <!-- 4. Game Log Table -->
      <div v-show="activeTab === 'records'" class="relative">
         <h3 class="text-xl font-bold text-white mb-6 flex items-left justify-left lg:justify-start gap-2">
            <span class="text-yellow-500">📝</span>
            {{ t('batting.battingRecords') }}
        </h3>
        <!-- Enhanced Responsive Table -->
        <div class="relative -mx-2 sm:mx-0 rounded-xl border border-gray-700/30 min-h-[200px] overflow-hidden">
             <!-- Records Loading Overlay -->
            <div v-if="isRecordsLoading" class="absolute inset-0 bg-gray-900/60 backdrop-blur-sm z-30 flex items-center justify-center">
                 <div class="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            
            <div class="overflow-x-auto w-full">
                <table class="min-w-full divide-y divide-gray-700/50 whitespace-nowrap">
                <!-- Sticky Header -->
                <thead class="bg-gray-800/80 backdrop-blur-sm sticky top-0 z-10">
                    <tr>
                         <!-- Sticky Date Column Header -->
                         <th class="px-4 py-4 text-left text-sm font-bold text-gray-300 uppercase tracking-wider sticky left-0 z-20 shadow-[2px_0_8px_rgba(0,0,0,0.3)] bg-gray-800">
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
                         <th class="px-4 py-4 text-center text-sm font-bold text-gray-300 uppercase tracking-wider sticky right-0 z-20 shadow-[-2px_0_8px_rgba(0,0,0,0.3)] bg-gray-800">
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
                        <td class="px-4 py-4 sticky left-0 z-20 shadow-[2px_0_6px_rgba(0,0,0,0.2)] bg-gray-900 group-hover:bg-gray-800 transition-colors"
                        >
                            <div class="text-gray-200 font-semibold text-sm md:text-base whitespace-nowrap">{{ game.gameDate }}</div>
                        </td>

                        <!-- Opponent Cell -->
                        <td class="px-2 py-2 text-center font-mono text-base text-gray-300">
                            {{ game.teamNameEnemy }}
                        </td>
                        
                        <!-- Stats Cells with larger font -->
                        <td class="px-2 py-2 text-center font-mono text-base text-gray-300">{{ game.PA }}</td>
                        <td class="px-2 py-2 text-center font-mono text-base text-gray-300">{{ game.AB }}</td>
                        <td class="px-2 py-2 text-center font-mono text-base text-gray-300">{{ game.RBI }}</td>
                        <td class="px-2 py-2 text-center font-mono text-base text-gray-300">{{ game.R }}</td>
                        <td class="px-2 py-2 text-center font-mono text-base text-gray-300">{{ game.single }}</td>
                        <td class="px-2 py-2 text-center font-mono text-base text-gray-300">{{ game.double }}</td>
                        <td class="px-2 py-2 text-center font-mono text-base text-gray-300">{{ game.triple }}</td>
                        <td class="px-2 py-2 text-center font-mono text-base text-gray-300">{{ game.HR }}</td>
                        <td class="px-2 py-2 text-center font-mono text-base text-gray-300">{{ game.BB }}</td>
                        <td class="px-2 py-2 text-center font-mono text-base text-gray-300">{{ game.IBB }}</td>
                        <td class="px-2 py-2 text-center font-mono text-base text-gray-300">{{ game.HBP }}</td>
                        <td class="px-2 py-2 text-center font-mono text-base text-gray-300">{{ game.SO }}</td>
                        <td class="px-2 py-2 text-center font-mono text-base text-gray-300">{{ game.SH }}</td>
                        <td class="px-2 py-2 text-center font-mono text-base text-gray-300">{{ game.SF }}</td>
                        <td class="px-2 py-2 text-center font-mono text-base text-gray-300">{{ game.SB }}</td>
                        <td class="px-2 py-2 text-center font-mono text-base text-gray-300">{{ game.CS }}</td>
                        
                        <!-- Sticky Detail Button -->
                        <td class="px-4 py-2 text-center sticky right-0 z-20 shadow-[-2px_0_6px_rgba(0,0,0,0.2)] bg-gray-900 group-hover:bg-gray-800 transition-colors"
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
        </div>

        <!-- Pagination -->
        <div v-if="gameRecords.length > 0 && pagination.totalPages > 1" class="flex items-center justify-center mt-6 gap-2">
            <!-- First Page -->
            <button 
                @click="changePage(1)" 
                :disabled="pagination.currentPage === 1"
                class="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                :title="t('common.firstPage')"
            >
                &laquo;
            </button>

            <!-- Prev -->
            <button 
                @click="changePage(pagination.currentPage - 1)" 
                :disabled="pagination.currentPage === 1"
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
                class="w-8 bg-transparent text-center text-blue-400 border-none focus:ring-0 p-0 font-bold text-sm outline-none"
                @keyup.enter="handlePageJump"
                @blur="handlePageJump"
                >
                <span class="text-gray-500 mx-1.5 text-xs font-light italic">/</span>
                <span class="text-gray-300 text-sm font-semibold pr-1">{{ pagination.totalPages }}</span>
            </div>

            <!-- Next -->
            <button 
                @click="changePage(pagination.currentPage + 1)" 
                :disabled="pagination.currentPage === pagination.totalPages"
                class="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                :title="t('common.next')"
            >
                &gt;
            </button>

            <!-- Last Page -->
            <button 
                @click="changePage(pagination.totalPages)" 
                :disabled="pagination.currentPage === pagination.totalPages"
                class="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                :title="t('common.lastPage')"
            >
                &raquo;
            </button>
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
