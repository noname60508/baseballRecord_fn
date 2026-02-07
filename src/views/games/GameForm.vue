<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import gameService from '@/services/gameService';
import masterDataService from '@/services/masterDataService';
import QuickAddModal from '@/components/QuickAddModal.vue';
import DatePicker from '@/components/DatePicker.vue';
import TimePicker from '@/components/TimePicker.vue';
import { useMasterDataStore } from '@/stores/masterData';
import { storeToRefs } from 'pinia';

const router = useRouter();
const route = useRoute();
const { t } = useI18n();

const formData = ref({
  gameDate: '',
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

const masterDataStore = useMasterDataStore();
const { seasons, fields, myTeams, opponentTeams } = storeToRefs(masterDataStore);
const isSubmitting = ref(false);

// Modal states
const showSeasonModal = ref(false);
const showFieldModal = ref(false);
const showMyTeamModal = ref(false);
const showOpponentTeamModal = ref(false);
const modalLoading = ref(false);
const showDatePicker = ref(false);
const showStartTimePicker = ref(false);
const showEndTimePicker = ref(false);

const fetchAllMasterData = async () => {
    await masterDataStore.fetchAll();
};

const fetchGame = async () => {
    try {
        const response = await gameService.getGameById(route.params.id);
        const game = response.data.result;
        formData.value = {
            gameDate: game.gameDate,
            startTime: game.startTime || '',
            endTime: game.endTime || '',
            season_id: game.Z00_season_id,
            team_id: game.Z00_team_id,
            opponent_team_id: game.Z00_team_id_enemy,
            field_id: game.Z00_field_id,
            homeAway: game.homeAway,
            score: game.score,
            enemyScore: game.enemyScore,
            memo: game.memo || ''
        };
    } catch (error) {
        console.error('Failed to fetch game:', error);
    }
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

    if (route.params.id) {
        await gameService.updateGame(route.params.id, payload);
        router.push({ name: 'GameDetail', params: { id: route.params.id } });
    } else {
        const response = await gameService.createGame(payload);
        router.push({
            name: 'GameDetail',
            params: { id: response.data.result.id }
        });
    }
  } catch (error) {
    console.error('Failed to save game:', error);
  } finally {
    isSubmitting.value = false;
  }
};

const handleQuickAdd = async (type, name) => {
  modalLoading.value = true;
  try {
    let response;
    if (type === 'season') {
      response = await masterDataService.seasons.create({ name });
      masterDataStore.addSeason(response.data.result);
      formData.value.season_id = response.data.result.id;
      showSeasonModal.value = false;
    } else if (type === 'field') {
      response = await masterDataService.fields.create({ name });
      masterDataStore.addField(response.data.result);
      formData.value.field_id = response.data.result.id;
      showFieldModal.value = false;
    } else if (type === 'myTeam') {
      response = await masterDataService.teams.create({ name, teamtype: 1 });
      masterDataStore.addMyTeam(response.data.result);
      formData.value.team_id = response.data.result.id;
      showMyTeamModal.value = false;
    } else if (type === 'opponentTeam') {
      response = await masterDataService.teams.create({ name, teamtype: 2 });
      masterDataStore.addOpponentTeam(response.data.result);
      formData.value.opponent_team_id = response.data.result.id;
      showOpponentTeamModal.value = false;
    }
  } catch (error) {
    console.error('Quick add failed:', error);
  } finally {
    modalLoading.value = false;
  }
};

onMounted(async () => {
  fetchAllMasterData();
  if (route.params.id) {
    fetchGame();
  }
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
              <div class="relative group">
                <input 
                  type="text"
                  v-model="formData.gameDate"
                  @focus="showDatePicker = true"
                  placeholder=""
                  class="input-field pr-10 hover:border-blue-500/50 transition-all duration-300 cursor-pointer"
                  autocomplete="off"
                  readonly
                >
                <div 
                  class="absolute inset-y-0 right-0 flex items-center px-3 cursor-pointer text-gray-500 group-hover:text-blue-400 transition-colors"
                  @click="showDatePicker = !showDatePicker"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                </div>
                
                <!-- Date Picker Popup -->
                <div v-if="showDatePicker" class="absolute top-full left-0 z-50 mt-2 shadow-2xl">
                  <DatePicker 
                    v-model="formData.gameDate" 
                    @close="showDatePicker = false"
                  />
                </div>
                <!-- Invisible overlay to close dropdown -->
                <div v-if="showDatePicker" class="fixed inset-0 z-40" @click="showDatePicker = false"></div>
              </div>
            </div>
            
             <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-400 ml-1">
                {{ t('games.startTime') }}
              </label>
              <div class="relative group">
                <input 
                  type="text"
                  v-model="formData.startTime"
                  @focus="showStartTimePicker = true"
                  placeholder=""
                  class="input-field pr-10 hover:border-blue-500/50 transition-all duration-300 cursor-pointer"
                  autocomplete="off"
                  readonly
                >
                <div 
                  class="absolute inset-y-0 right-0 flex items-center px-3 cursor-pointer text-gray-500 group-hover:text-blue-400 transition-colors"
                  @click="showStartTimePicker = !showStartTimePicker"
                >
                   <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <div v-if="showStartTimePicker" class="absolute top-full left-0 z-50 mt-2 shadow-2xl">
                    <TimePicker v-model="formData.startTime" @close="showStartTimePicker = false" />
                </div>
                <div v-if="showStartTimePicker" class="fixed inset-0 z-40" @click="showStartTimePicker = false"></div>
              </div>
            </div>

             <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-400 ml-1">
                {{ t('games.endTime') }}
              </label>
              <div class="relative group">
                <input 
                  type="text"
                  v-model="formData.endTime"
                  @focus="showEndTimePicker = true"
                  placeholder=""
                  class="input-field pr-10 hover:border-blue-500/50 transition-all duration-300 cursor-pointer"
                  autocomplete="off"
                  readonly
                >
                <div 
                  class="absolute inset-y-0 right-0 flex items-center px-3 cursor-pointer text-gray-500 group-hover:text-blue-400 transition-colors"
                  @click="showEndTimePicker = !showEndTimePicker"
                >
                   <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <div v-if="showEndTimePicker" class="absolute top-full left-0 z-50 mt-2 shadow-2xl">
                    <TimePicker v-model="formData.endTime" :default-value="formData.startTime" @close="showEndTimePicker = false" />
                </div>
                <div v-if="showEndTimePicker" class="fixed inset-0 z-40" @click="showEndTimePicker = false"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Section 2: Score & Home/Away -->
        <div class="space-y-6">
          <h2 class="text-lg font-semibold text-blue-400 uppercase tracking-wider border-b border-white/10 pb-2 mb-4">
            {{ t('games.score') }}
          </h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Home/Away Selection -->
            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-400 ml-1">
                {{ t('games.homeAway') }}
              </label>
              <div class="flex gap-2">
                <button 
                  type="button"
                  @click="formData.homeAway = 1"
                  class="flex-1 px-4 py-2 rounded-xl border border-white/10 font-bold transition-all duration-300"
                  :class="formData.homeAway === 1 ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'"
                >
                  🗡️ {{ t('games.firstAttack') }}
                </button>
                <button 
                  type="button"
                  @click="formData.homeAway = 2"
                  class="flex-1 px-4 py-2 rounded-xl border border-white/10 font-bold transition-all duration-300"
                  :class="formData.homeAway === 2 ? 'bg-red-600 text-white shadow-lg shadow-red-500/20' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'"
                >
                  🛡️ {{ t('games.secondAttack') }}
                </button>
              </div>
            </div>

            <!-- Empty space for grid alignment or add something else here -->
            <div class="hidden md:block"></div>

            <!-- Scores -->
            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-400 ml-1">
                我方分數
              </label>
              <input 
                v-model.number="formData.score"
                type="number" 
                min="0"
                class="input-field"
                placeholder="0"
              >
            </div>

            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-400 ml-1">
                對方分數
              </label>
              <input 
                v-model.number="formData.enemyScore"
                type="number" 
                min="0"
                class="input-field"
                placeholder="0"
              >
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
      @confirm="(name) => handleQuickAdd('season', name)"
    />

    <QuickAddModal
      :is-open="showFieldModal"
      :title="t('masterData.addField')"
      :label="t('masterData.name')"
      :is-loading="modalLoading"
      @close="showFieldModal = false"
      @confirm="(name) => handleQuickAdd('field', name)"
    />

    <QuickAddModal
      :is-open="showMyTeamModal"
      :title="'新增我方球隊'"
      :label="t('masterData.name')"
      :is-loading="modalLoading"
      @close="showMyTeamModal = false"
      @confirm="(name) => handleQuickAdd('myTeam', name)"
    />

    <QuickAddModal
      :is-open="showOpponentTeamModal"
      :title="'新增對方球隊'"
      :label="t('masterData.name')"
      :is-loading="modalLoading"
      @close="showOpponentTeamModal = false"
      @confirm="(name) => handleQuickAdd('opponentTeam', name)"
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
