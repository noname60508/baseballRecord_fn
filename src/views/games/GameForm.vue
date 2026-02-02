<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import gameService from '@/services/gameService';
import masterDataService from '@/services/masterDataService';
import QuickAddModal from '@/components/QuickAddModal.vue';

const router = useRouter();
const { t } = useI18n();

const formData = ref({
  gameDate: new Date().toISOString().split('T')[0],
  startTime: '',
  endTime: '',
  season_id: '',
  team_id: '',
  opponent_team_id: '',
  field_id: '',
  homeAway: 1, // 1: 先攻, 2: 後攻
  score: 0,
  enemyScore: 0,
  memo: ''
});

const seasons = ref([]);
const fields = ref([]);
const myTeams = ref([]);
const opponentTeams = ref([]);
const isSubmitting = ref(false);

// Modal states
const showSeasonModal = ref(false);
const showFieldModal = ref(false);
const showMyTeamModal = ref(false);
const showOpponentTeamModal = ref(false);
const modalLoading = ref(false);

// Fetch Functions
const fetchSeasons = async () => {
    try {
        const res = await masterDataService.seasons.getAll();
        seasons.value = res.data.result;
    } catch (error) {
        console.error('Failed to load seasons:', error);
    }
};

const fetchFields = async () => {
    try {
        const res = await masterDataService.fields.getAll();
        fields.value = res.data.result;
    } catch (error) {
        console.error('Failed to load fields:', error);
    }
};

const fetchMyTeams = async () => {
    try {
        const res = await masterDataService.teams.getAll({ teamtype: 1 });
        myTeams.value = res.data.result;
    } catch (error) {
        console.error('Failed to load my teams:', error);
    }
};

const fetchOpponentTeams = async () => {
    try {
        const res = await masterDataService.teams.getAll({ teamtype: 2 });
        opponentTeams.value = res.data.result;
    } catch (error) {
        console.error('Failed to load opponent teams:', error);
    }
};

const fetchAllData = async () => {
  await Promise.all([
    fetchSeasons(),
    fetchFields(),
    fetchMyTeams(),
    fetchOpponentTeams()
  ]);
};

const handleSubmit = async () => {
  isSubmitting.value = true;
  try {
    const payload = {
      Z00_season_id: formData.value.season_id,
      Z00_team_id: formData.value.team_id,
      Z00_team_id_enemy: formData.value.opponent_team_id,
      Z00_field_id: formData.value.field_id,
      gameDate: formData.value.gameDate,
      startTime: formData.value.startTime,
      endTime: formData.value.endTime,
      homeAway: formData.value.homeAway,
      score: formData.value.score,
      enemyScore: formData.value.enemyScore,
      memo: formData.value.memo
    };

    const response = await gameService.createGame(payload);
    router.push({
      name: 'BattingRecords',
      query: { game_id: response.data.id, new: 'true' }
    });
  } catch (error) {
    console.error('Failed to create game:', error);
  } finally {
    isSubmitting.value = false;
  }
};

// Add Handlers
const handleAddSeason = async (name) => {
  modalLoading.value = true;
  try {
    const res = await masterDataService.seasons.create({ name });
    await fetchSeasons(); // Refresh list
    // 取 response 的 result.id
    if (res.data?.result?.id) {
        formData.value.season_id = res.data.result.id; 
    }
    showSeasonModal.value = false;
  } catch (error) {
    console.error('Failed to add season:', error);
  } finally {
    modalLoading.value = false;
  }
};

const handleAddField = async (name) => {
  modalLoading.value = true;
  try {
    const res = await masterDataService.fields.create({ name });
    await fetchFields(); // Refresh list
    if (res.data?.result?.id) {
        formData.value.field_id = res.data.result.id;
    }
    showFieldModal.value = false;
  } catch (error) {
    console.error('Failed to add field:', error);
  } finally {
    modalLoading.value = false;
  }
};

const handleAddMyTeam = async (name) => {
  modalLoading.value = true;
  try {
    const res = await masterDataService.teams.create({ name, teamtype: 1 });
    await fetchMyTeams(); // Refresh list
    if (res.data?.result?.id) {
        formData.value.team_id = res.data.result.id;
    }
    showMyTeamModal.value = false;
  } catch (error) {
    console.error('Failed to add my team:', error);
  } finally {
    modalLoading.value = false;
  }
};

const handleAddOpponentTeam = async (name) => {
  modalLoading.value = true;
  try {
    const res = await masterDataService.teams.create({ name, teamtype: 2 });
    await fetchOpponentTeams(); // Refresh list
    if (res.data?.result?.id) {
        formData.value.opponent_team_id = res.data.result.id;
    }
    showOpponentTeamModal.value = false;
  } catch (error) {
    console.error('Failed to add opponent team:', error);
  } finally {
    modalLoading.value = false;
  }
};

onMounted(() => {
  fetchAllData();
});
</script>

<template>
  <div class="max-w-3xl mx-auto">
    <!-- Header -->
    <div class="flex items-center mb-8">
      <router-link to="/games" class="p-2 mr-4 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      </router-link>
      <h1 class="text-3xl font-bold text-white tracking-tight">{{ t('games.addGame') }}</h1>
    </div>

    <!-- Form -->
    <div class="card relative overflow-hidden">
      <!-- Decor -->
      <div class="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl -z-10"></div>
      
      <form @submit.prevent="handleSubmit" class="space-y-8 relative z-10">
        <!-- Section 1: Basic Info -->
        <div class="space-y-6">
          <h2 class="text-lg font-semibold text-blue-400 uppercase tracking-wider border-b border-white/10 pb-2 mb-4">
            基本資訊
          </h2>
          
          <!-- 1. Season & Field -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-400 ml-1">
                {{ t('games.season') }} <span class="text-red-400">*</span>
              </label>
              <div class="flex gap-2">
                <div class="relative w-full">
                  <select v-model="formData.season_id" class="input-field appearance-none cursor-pointer" required>
                    <option value="" disabled class="bg-gray-800">請選擇賽季</option>
                    <option v-for="season in seasons" :key="season.id" :value="season.id" class="bg-gray-800">
                      {{ season.name }}
                    </option>
                  </select>
                  <div class="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
                <button 
                  type="button" 
                  class="px-4 bg-gray-700 hover:bg-blue-600 text-white rounded-xl transition-colors shadow-lg border border-white/10"
                  @click="showSeasonModal = true"
                  title="新增賽季"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>

            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-400 ml-1">
                {{ t('games.field') }}
              </label>
              <div class="flex gap-2">
                <div class="relative w-full">
                  <select v-model="formData.field_id" class="input-field appearance-none cursor-pointer">
                    <option value="" class="bg-gray-800">請選擇場地</option>
                    <option v-for="field in fields" :key="field.id" :value="field.id" class="bg-gray-800">
                      {{ field.name }}
                    </option>
                  </select>
                  <div class="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
                <button 
                  type="button" 
                  class="px-4 bg-gray-700 hover:bg-blue-600 text-white rounded-xl transition-colors shadow-lg border border-white/10"
                  @click="showFieldModal = true"
                  title="新增場地"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- 2. Teams -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-400 ml-1">
                {{ t('games.myTeam') }} <span class="text-red-400">*</span>
              </label>
              <div class="flex gap-2">
                  <div class="relative w-full">
                      <select v-model="formData.team_id" class="input-field appearance-none cursor-pointer" required>
                        <option value="" disabled class="bg-gray-800">請選擇我方球隊</option>
                        <option v-for="team in myTeams" :key="team.id" :value="team.id" class="bg-gray-800">
                          {{ team.name }}
                        </option>
                      </select>
                      <div class="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                  </div>
                   <button 
                      type="button" 
                      class="px-4 bg-gray-700 hover:bg-blue-600 text-white rounded-xl transition-colors shadow-lg border border-white/10"
                      @click="showMyTeamModal = true"
                      title="新增我方球隊"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
                      </svg>
                    </button>
              </div>
            </div>

            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-400 ml-1">
                {{ t('games.opponentTeam') }}
              </label>
              <div class="flex gap-2">
                  <div class="relative w-full">
                      <select v-model="formData.opponent_team_id" class="input-field appearance-none cursor-pointer">
                        <option value="" class="bg-gray-800">請選擇對方球隊</option>
                        <option v-for="team in opponentTeams" :key="team.id" :value="team.id" class="bg-gray-800">
                          {{ team.name }}
                        </option>
                      </select>
                      <div class="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                  </div>
                  <button 
                      type="button" 
                      class="px-4 bg-gray-700 hover:bg-blue-600 text-white rounded-xl transition-colors shadow-lg border border-white/10"
                      @click="showOpponentTeamModal = true"
                      title="新增對方球隊"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
                      </svg>
                    </button>
              </div>
            </div>
          </div>
          
           <!-- 3. Date & Time (Reordered) -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-400 ml-1">
                {{ t('games.date') }}
              </label>
              <input 
                v-model="formData.gameDate"
                type="date" 
                class="input-field"
              >
            </div>
            
             <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-400 ml-1">
                {{ t('games.startTime') }}
              </label>
              <input 
                v-model="formData.startTime"
                type="time" 
                class="input-field"
              >
            </div>
             <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-400 ml-1">
                {{ t('games.endTime') }}
              </label>
              <input 
                v-model="formData.endTime"
                type="time" 
                class="input-field"
              >
            </div>
          </div>
        </div>

        <!-- Section 2: Score & Home/Away -->
        <div class="space-y-6">
          <h2 class="text-lg font-semibold text-blue-400 uppercase tracking-wider border-b border-white/10 pb-2 mb-4">
            {{ t('games.score') }}
          </h2>
          
          <div class="relative bg-gray-900/40 rounded-2xl border border-white/5 overflow-hidden p-6 md:p-8">
             <!-- Scoreboard texture -->
             <div class="absolute inset-0 opacity-5" style="background-image: radial-gradient(circle, #fff 1px, transparent 1px); background-size: 4px 4px;"></div>
             
             <div class="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">
                <!-- My Team Side -->
                <div class="flex-1 flex flex-col items-center gap-4 w-full">
                   <div 
                      @click="formData.homeAway = 1"
                      class="cursor-pointer px-4 py-1.5 rounded-full text-sm font-bold tracking-wide transition-all duration-300 ring-2 ring-offset-2 ring-offset-gray-900"
                      :class="formData.homeAway === 1 ? 'bg-blue-600 text-white ring-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.5)]' : 'bg-gray-800 text-gray-500 ring-transparent hover:bg-gray-700'"
                   >
                      <span v-if="formData.homeAway === 1">🗡️ {{ t('games.firstAttack') }}</span>
                      <span v-else>🛡️ {{ t('games.secondAttack') }}</span>
                   </div>
                   
                   <div class="text-center w-full">
                      <label class="block text-sm font-bold text-gray-400 mb-2">我方</label>
                      <input 
                        v-model.number="formData.score"
                        type="number" 
                        min="0"
                        class="w-full max-w-[140px] h-32 text-center text-6xl font-black bg-gray-800 border-4 border-gray-700 rounded-3xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all shadow-inner text-white font-mono no-spinner"
                      >
                   </div>
                </div>

                <!-- VS Divider -->
                <div class="text-gray-600 font-black text-4xl italic opacity-30 select-none">
                   VS
                </div>

                 <!-- Opponent Team Side -->
                <div class="flex-1 flex flex-col items-center gap-4 w-full">
                   <div 
                      @click="formData.homeAway = 2"
                      class="cursor-pointer px-4 py-1.5 rounded-full text-sm font-bold tracking-wide transition-all duration-300 ring-2 ring-offset-2 ring-offset-gray-900"
                      :class="formData.homeAway === 2 ? 'bg-red-600 text-white ring-red-500 shadow-[0_0_15px_rgba(220,38,38,0.5)]' : 'bg-gray-800 text-gray-500 ring-transparent hover:bg-gray-700'"
                   >
                      <span v-if="formData.homeAway === 2">🗡️ {{ t('games.firstAttack') }}</span>
                      <span v-else>🛡️ {{ t('games.secondAttack') }}</span>
                   </div>
                   
                   <div class="text-center w-full">
                      <label class="block text-sm font-bold text-gray-400 mb-2">對手</label>
                       <input 
                        v-model.number="formData.enemyScore"
                        type="number" 
                        min="0"
                        class="w-full max-w-[140px] h-32 text-center text-6xl font-black bg-gray-800 border-4 border-gray-700 rounded-3xl focus:border-red-500 focus:ring-4 focus:ring-red-500/20 outline-none transition-all shadow-inner text-white font-mono no-spinner"
                      >
                   </div>
                </div>
             </div>
          </div>

          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-400 ml-1">
                {{ t('games.memo') }}
            </label>
            <textarea 
                v-model="formData.memo"
                rows="3"
                class="input-field"
                placeholder="備註..."
            ></textarea>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex justify-end pt-6 space-x-4 border-t border-white/10">
          <router-link to="/games" class="btn-ghost">
            {{ t('common.cancel') }}
          </router-link>
          <button 
            type="submit" 
            class="btn-primary"
            :disabled="isSubmitting"
          >
             <svg v-if="isSubmitting" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            {{ isSubmitting ? t('common.loading') : t('common.save') }}
          </button>
        </div>
      </form>
    </div>

    <!-- Modals -->
    <QuickAddModal
      :is-open="showSeasonModal"
      :title="t('masterData.addSeason')"
      :label="t('masterData.name')"
      :is-loading="modalLoading"
      @close="showSeasonModal = false"
      @confirm="handleAddSeason"
    />

    <QuickAddModal
      :is-open="showFieldModal"
      :title="t('masterData.addField')"
      :label="t('masterData.name')"
      :is-loading="modalLoading"
      @close="showFieldModal = false"
      @confirm="handleAddField"
    />

    <QuickAddModal
      :is-open="showMyTeamModal"
      :title="'新增我方球隊'"
      :label="t('masterData.name')"
      :is-loading="modalLoading"
      @close="showMyTeamModal = false"
      @confirm="handleAddMyTeam"
    />

    <QuickAddModal
      :is-open="showOpponentTeamModal"
      :title="'新增對方球隊'"
      :label="t('masterData.name')"
      :is-loading="modalLoading"
      @close="showOpponentTeamModal = false"
      @confirm="handleAddOpponentTeam"
    />
  </div>
</template>

<style scoped>
.no-spinner::-webkit-inner-spin-button,
.no-spinner::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.no-spinner {
  -moz-appearance: textfield;
  appearance: textfield;
}
</style>
