<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import gameService from '@/services/gameService';
import masterDataService from '@/services/masterDataService';
import DateRangePicker from '@/components/DateRangePicker.vue';
import { useMasterDataStore } from '@/stores/masterData';
import { storeToRefs } from 'pinia';

const router = useRouter();
const { t } = useI18n();

const games = ref([]);
const isLoading = ref(true);
const currentPage = ref(1);
const totalPages = ref(1);

const masterDataStore = useMasterDataStore();
const { seasons, fields, myTeams, opponentTeams } = storeToRefs(masterDataStore);

// Search State
const isSearchOpen = ref(true);
const searchForm = ref({
  Z00_season_id: '',
  Z00_team_id: '',
  Z00_team_id_enemy: '',
  Z00_field_id: '',
  gameResult: '',
  gameDate: [null, null]
});

// Date Picker State
const showDatePicker = ref(false);

const updateDateRange = (newRange) => {
    searchForm.value.gameDate = newRange;
    showDatePicker.value = false;
};

const fetchMasterData = async () => {
    await masterDataStore.fetchAll();
};

const fetchGames = async (page = 1) => {
  isLoading.value = true;
  try {
    const params = {
      page,
      paginate_rows: 12,
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
    currentPage.value = page;
  } catch (error) {
    console.error('Failed to fetch games:', error);
  } finally {
    isLoading.value = false;
  }
};

const handleSearch = () => {
    fetchGames(1);
};

const clearSearch = () => {
    searchForm.value = {
        Z00_season_id: '',
        Z00_team_id: '',
        Z00_team_id_enemy: '',
        Z00_field_id: '',
        gameResult: '',
        gameDate: [null, null]
    };
    fetchGames(1);
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

const formatDateDisplay = (start, end) => {
    if (!start && !end) return '選擇日期範圍';
    if (start && !end) return `${start} ~`;
    if (!start && end) return `~ ${end}`;
    if (start === end) return start;
    return `${start} ~ ${end}`;
};

const formatBattingSummary = (batterResult) => {
    if (!batterResult) return '';
    const r = batterResult;
    const hits = (Number(r.single) || 0) + (Number(r.double) || 0) + (Number(r.triple) || 0) + (Number(r.hr) || 0);
    let text = `${r.at_bats || 0} - ${hits} `;
    
    if (Number(r.hr) > 0) text += `, ${r.hr}${t('basic.HR')}`;
    if (Number(r.bb) > 0) text += `, ${r.bb}${t('basic.BB')}`;
    if (Number(r.hbp) > 0) text += `, ${r.hbp}${t('basic.HBP')}`;
    
    return text;
};

onMounted(() => {
  fetchMasterData();
  fetchGames();
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
      <div class="flex gap-2 w-full md:w-auto">
        <router-link to="/games/new" class="btn-primary flex items-center gap-2 group whitespace-nowrap">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 transform group-hover:rotate-90 transition-transform duration-300" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
            </svg>
            <span>{{ t('games.addGame') }}</span>
        </router-link>
      </div>
    </div>

    <!-- Filter Toggle & Section -->
    <div class="flex flex-col gap-2">
    <!-- Filter Toggle -->
    <div 
        @click="isSearchOpen = !isSearchOpen"
        class="flex items-center gap-2 cursor-pointer select-none group w-fit"
    >
        <div class="p-1.5 rounded bg-gray-800/50 group-hover:bg-blue-500/20 transition-colors">
             <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 transition-transform duration-300 text-gray-400 group-hover:text-blue-400" :class="isSearchOpen ? 'rotate-0' : '-rotate-90'" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
        </div>
        <span class="text-xl font-bold text-gray-200 group-hover:text-white transition-colors">{{ t('games.search') }}</span>
    </div>

        <!-- Search Form -->
        <div v-show="isSearchOpen" class="bg-gray-800/30 border border-white/5 rounded-2xl p-6 transition-all duration-300 shadow-inner">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 <!-- Season -->
                <div class="space-y-1">
                    <label class="text-sm text-gray-400 ml-1">{{ t('games.season') }}</label>
                    <div class="relative">
                        <select v-model="searchForm.Z00_season_id" class="input-field appearance-none cursor-pointer">
                            <option value="">{{ t('games.all') }}</option>
                            <option v-for="s in seasons" :key="s.id" :value="s.id">{{ s.name }}</option>
                        </select>
                        <div class="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                    </div>
                </div>

                 <!-- My Team -->
                <div class="space-y-1">
                    <label class="text-sm text-gray-400 ml-1">{{ t('games.myTeam') }}</label>
                     <div class="relative">
                        <select v-model="searchForm.Z00_team_id" class="input-field appearance-none cursor-pointer">
                            <option value="">{{ t('games.all') }}</option>
                            <option v-for="t in myTeams" :key="t.id" :value="t.id">{{ t.name }}</option>
                        </select>
                         <div class="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                     </div>
                </div>

                <!-- Opponent Team -->
                <div class="space-y-1">
                    <label class="text-sm text-gray-400 ml-1">{{ t('games.opponentTeam') }}</label>
                     <div class="relative">
                        <select v-model="searchForm.Z00_team_id_enemy" class="input-field appearance-none cursor-pointer">
                            <option value="">{{ t('games.all') }}</option>
                            <option v-for="t in opponentTeams" :key="t.id" :value="t.id">{{ t.name }}</option>
                        </select>
                         <div class="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                     </div>
                </div>

                 <!-- Field -->
                <div class="space-y-1">
                    <label class="text-sm text-gray-400 ml-1">{{ t('games.field') }}</label>
                     <div class="relative">
                        <select v-model="searchForm.Z00_field_id" class="input-field appearance-none cursor-pointer">
                            <option value="">{{ t('games.all') }}</option>
                             <option v-for="f in fields" :key="f.id" :value="f.id">{{ f.name }}</option>
                        </select>
                         <div class="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                     </div>
                </div>

                <!-- Game Result -->
                 <div class="space-y-1">
                    <label class="text-sm text-gray-400 ml-1">{{ t('games.gameResult') }}</label>
                     <div class="relative">
                        <select v-model="searchForm.gameResult" class="input-field appearance-none cursor-pointer">
                            <option value="">{{ t('games.all') }}</option>
                            <option value="1">{{ t('games.win') }}</option>
                            <option value="2">{{ t('games.loss') }}</option>
                            <option value="3">{{ t('games.tie') }}</option>
                        </select>
                         <div class="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                     </div>
                </div>

                 <!-- Date Range (Custom) -->
                <div class="space-y-1 md:col-span-1 lg:col-span-1">
                    <label class="text-sm text-gray-400 ml-1">{{ t('games.date') }}</label>
                     <div class="relative">
                        <button 
                            @click="showDatePicker = !showDatePicker"
                            class="input-field w-full text-left flex items-center justify-between"
                            :class="{'text-gray-400': !searchForm.gameDate[0] && !searchForm.gameDate[1]}"
                        >
                            <span>{{ formatDateDisplay(searchForm.gameDate[0], searchForm.gameDate[1]) }}</span>
                             <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        </button>

                        <!-- Date Range Picker Component -->
                        <div v-if="showDatePicker" class="absolute top-full left-0 z-50 mt-2">
                            <DateRangePicker 
                                :modelValue="searchForm.gameDate"
                                @update:modelValue="updateDateRange"
                                @close="showDatePicker = false"
                            />
                        </div>
                        
                        <!-- Backdrop to close -->
                        <div v-if="showDatePicker" @click="showDatePicker = false" class="fixed inset-0 z-40 bg-transparent"></div>
                    </div>
                </div>
            </div>
            
            <div class="flex justify-end gap-3 mt-6 border-t border-white/5 pt-4">
                 <button @click="clearSearch" class="px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm">清除條件</button>
                 <button @click="handleSearch" class="btn-primary flex items-center gap-2 px-6">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    查詢比賽
                 </button>
            </div>
        </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex flex-col items-center justify-center py-20 space-y-4">
      <div class="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
      <p class="text-gray-400 font-medium animate-pulse">{{ t('common.loading') }}</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="games.length === 0" class="flex flex-col items-center justify-center py-20 bg-gray-800/30 rounded-2xl border border-white/5 border-dashed">
      <div class="text-6xl mb-4 opacity-50">🏟️</div>
      <p class="text-gray-400 text-lg font-medium">{{ t('common.noData') }}</p>
      <router-link to="/games/new" class="mt-4 text-blue-400 hover:text-blue-300 text-sm font-medium hover:underline">
        {{ t('games.addGame') }}
      </router-link>
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
                <div class="text-xs text-gray-400 font-medium uppercase tracking-wider truncate max-w-[100px] mx-auto">
                     <span v-if="game.homeAway === 1">{{ game.teamName }}</span>
                     <span v-else>{{ game.teamNameEnemy }}</span>
                </div>
                <div class="mt-1">
                    <span class="text-[10px] px-1.5 py-0.5 rounded bg-gray-700 text-gray-400 border border-gray-600">先攻</span>
                </div>
            </div>

            <div class="text-gray-600 font-bold px-4 text-xl italic opacity-50">VS</div>
          
            <!-- Right Side (Second Attack) -->
            <div class="text-center flex-1">
                <!-- If HomeAway=1 (My Team First), Show Opponent stats. If HomeAway=2 (Opponent First), Show MyTeam stats -->
                <div class="font-bold text-4xl text-white mb-1 drop-shadow-md font-mono">
                    {{ game.homeAway === 1 ? game.enemyScore : game.score }}
                </div>
                 <div class="text-xs text-gray-400 font-medium uppercase tracking-wider truncate max-w-[100px] mx-auto">
                    <span v-if="game.homeAway === 1">{{ game.teamNameEnemy }}</span>
                    <span v-else>{{ game.teamName }}</span>
                </div>
                <div class="mt-1">
                    <span class="text-[10px] px-1.5 py-0.5 rounded bg-gray-700 text-gray-400 border border-gray-600">後攻</span>
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
    <div v-if="totalPages > 1" class="flex justify-center mt-8 space-x-2">
      <button 
        @click="fetchGames(currentPage - 1)" 
        :disabled="currentPage === 1"
        class="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Prev
      </button>
      <span class="px-4 py-2 text-gray-400 font-medium flex items-center">
        {{ currentPage }} / {{ totalPages }}
      </span>
      <button 
        @click="fetchGames(currentPage + 1)" 
        :disabled="currentPage === totalPages"
        class="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Next
      </button>
    </div>
  </div>
</template>
