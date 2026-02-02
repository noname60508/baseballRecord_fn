<script setup>
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import battingService from '@/services/battingService';
import masterDataService from '@/services/masterDataService';
import DateRangePicker from '@/components/DateRangePicker.vue';

const { t } = useI18n();

const stats = ref(null);
const records = ref([]);
const isLoading = ref(true);

// Master Data
const seasons = ref([]);
const fields = ref([]);
const myTeams = ref([]);
const opponentTeams = ref([]);

// Search State
const isSearchOpen = ref(false);
const showDatePicker = ref(false);
const searchForm = ref({
    Z00_season_id: '',
    Z00_team_id: '',
    Z00_team_id_enemy: '',
    Z00_field_id: '',
    gameDate: [null, null]
});

const fetchMasterData = async () => {
    try {
        const [seasonsRes, fieldsRes, myTeamsRes, opponentTeamsRes] = await Promise.all([
            masterDataService.seasons.getAll(),
            masterDataService.fields.getAll(),
            masterDataService.teams.getAll({ teamtype: 1 }),
            masterDataService.teams.getAll({ teamtype: 2 })
        ]);
        seasons.value = seasonsRes.data.result;
        fields.value = fieldsRes.data.result;
        myTeams.value = myTeamsRes.data.result;
        opponentTeams.value = opponentTeamsRes.data.result;
    } catch (error) {
        console.error('Failed to load master data:', error);
    }
};

const fetchStats = async () => {
  isLoading.value = true;
  try {
    const params = { ...searchForm.value };
    
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

    // Parallel fetch for stats and records
    const [statsRes, recordsRes] = await Promise.all([
        battingService.getBattingStatistics(params),
        battingService.getBattingRecords(params)
    ]);
    
    stats.value = statsRes.data;
    records.value = recordsRes.data;
  } catch (error) {
    console.error('Failed to fetch data:', error);
  } finally {
    isLoading.value = false;
  }
};

const handleSearch = () => {
    fetchStats();
};

const clearSearch = () => {
    searchForm.value = {
        Z00_season_id: '',
        Z00_team_id: '',
        Z00_team_id_enemy: '',
        Z00_field_id: '',
        gameDate: [null, null]
    };
    fetchStats();
};

const updateDateRange = (newRange) => {
    searchForm.value.gameDate = newRange;
    showDatePicker.value = false;
};

const formatDateDisplay = (start, end) => {
    if (!start && !end) return '選擇日期範圍';
    if (start && !end) return `${start} ~`;
    if (!start && end) return `~ ${end}`;
    if (start === end) return start;
    return `${start} ~ ${end}`;
};

onMounted(() => {
  fetchMasterData();
  fetchStats();
});
</script>

<template>
  <div class="space-y-8">
    <h1 class="page-title !mb-0">
      <span class="text-purple-500">📈</span>
      {{ t('batting.title') }} - {{ t('nav.battingStats') }}
    </h1>

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
        <span class="text-xl font-bold text-gray-200 group-hover:text-white transition-colors">搜尋</span>
    </div>

    <!-- Search Form -->
    <div v-show="isSearchOpen" class="bg-gray-800/30 border border-white/5 rounded-2xl p-6 transition-all duration-300 shadow-inner">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             <!-- Season -->
            <div class="space-y-1">
                <label class="text-sm text-gray-400 ml-1">{{ t('games.season') }}</label>
                <div class="relative">
                    <select v-model="searchForm.Z00_season_id" class="input-field appearance-none cursor-pointer">
                        <option value="">全部賽季</option>
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
                        <option value="">全部我方球隊</option>
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
                        <option value="">全部對手球隊</option>
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
                        <option value="">全部場地</option>
                         <option v-for="f in fields" :key="f.id" :value="f.id">{{ f.name }}</option>
                    </select>
                     <div class="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                 </div>
            </div>

             <!-- Date Range (Custom) -->
            <div class="space-y-1 md:col-span-2 lg:col-span-2">
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
                查詢數據
             </button>
        </div>
    </div>

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

      <!-- Batting Records List -->
      <div v-if="records.length > 0" class="card">
        <h3 class="text-lg font-bold text-white mb-6 flex items-center gap-2">
           <span class="text-yellow-500">📝</span>
           {{ t('nav.battingRecords') }}
        </h3>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-700/50">
            <thead>
              <tr>
                <th scope="col" class="table-header">日期</th>
                <th scope="col" class="table-header">比賽</th>
                <th scope="col" class="table-header text-right">打數</th>
                <th scope="col" class="table-header text-right">安打</th>
                <th scope="col" class="table-header text-right">打點</th>
                <th scope="col" class="table-header text-right">打擊率</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-700/50 bg-gray-800/40">
              <tr v-for="record in records" :key="record.id" class="table-row group">
                <td class="table-cell font-mono text-gray-400">{{ record.game_date }}</td>
                <td class="table-cell font-medium text-white">{{ record.game_name }}</td>
                <td class="table-cell text-right font-mono">{{ record.at_bats }}</td>
                <td class="table-cell text-right font-mono text-blue-300 font-bold">{{ record.hits }}</td>
                <td class="table-cell text-right font-mono">{{ record.rbi }}</td>
                <td class="table-cell text-right">
                  <span class="px-2 py-1 rounded bg-blue-500/10 text-blue-400 font-bold font-mono">
                    {{ record.avg }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
