<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import gameService from '@/services/gameService';
import masterDataService from '@/services/masterDataService';
import QuickAddModal from '@/components/QuickAddModal.vue';
import { useToast } from '@/composables/useToast';

const router = useRouter();
const { t } = useI18n();
const toast = useToast();

const formData = ref({
  date: new Date().toISOString().split('T')[0],
  season_id: '',
  field_id: '',
  opponent_name: '',
  my_team_score: 0,
  opponent_score: 0,
  is_home_game: true
});

const seasons = ref([]);
const fields = ref([]);
const isLoading = ref(false);
const isSubmitting = ref(false);

// Modal states
const showSeasonModal = ref(false);
const showFieldModal = ref(false);
const modalLoading = ref(false);

const fetchData = async () => {
  isLoading.value = true;
  try {
    const [seasonsRes, fieldsRes] = await Promise.all([
      masterDataService.seasons.getAll(),
      masterDataService.fields.getAll()
    ]);
    seasons.value = seasonsRes.data;
    fields.value = fieldsRes.data;
  } catch (error) {
    console.error('Failed to load master data:', error);
  } finally {
    isLoading.value = false;
  }
};

const handleSubmit = async () => {
  isSubmitting.value = true;
  try {
    const response = await gameService.createGame(formData.value);
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

const handleAddSeason = async (name) => {
  modalLoading.value = true;
  try {
    const res = await masterDataService.seasons.create({ name });
    seasons.value.push(res.data);
    formData.value.season_id = res.data.id;
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
    fields.value.push(res.data);
    formData.value.field_id = res.data.id;
    showFieldModal.value = false;
  } catch (error) {
    console.error('Failed to add field:', error);
  } finally {
    modalLoading.value = false;
  }
};

onMounted(() => {
  fetchData();
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
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-400 ml-1">
                {{ t('games.date') }} <span class="text-red-400">*</span>
              </label>
              <input 
                v-model="formData.date"
                type="date" 
                required
                class="input-field"
              >
            </div>

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
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-400 ml-1">
                {{ t('games.field') }} <span class="text-red-400">*</span>
              </label>
              <div class="flex gap-2">
                <div class="relative w-full">
                  <select v-model="formData.field_id" class="input-field appearance-none cursor-pointer" required>
                    <option value="" disabled class="bg-gray-800">請選擇場地</option>
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

            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-400 ml-1">
                {{ t('games.opponent') }} <span class="text-red-400">*</span>
              </label>
              <input 
                v-model="formData.opponent_name"
                type="text" 
                required
                class="input-field"
                placeholder="請輸入對手名稱"
              >
            </div>
          </div>
        </div>

        <!-- Section 2: Score -->
        <div class="space-y-6">
          <h2 class="text-lg font-semibold text-blue-400 uppercase tracking-wider border-b border-white/10 pb-2 mb-4">
            {{ t('games.score') }}
          </h2>
          
          <div class="flex items-center justify-center p-8 bg-gray-900/40 rounded-2xl border border-white/5 relative overflow-hidden">
             <!-- Scoreboard texture -->
             <div class="absolute inset-0 opacity-5" style="background-image: radial-gradient(circle, #fff 1px, transparent 1px); background-size: 4px 4px;"></div>
             
            <div class="flex items-center gap-6 md:gap-12 relative z-10">
              <div class="text-center group">
                <label class="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 group-hover:text-blue-400 transition-colors">我方</label>
                <input 
                  v-model.number="formData.my_team_score"
                  type="number" 
                  min="0"
                  class="w-24 h-24 text-center text-4xl font-bold bg-gray-800 border-2 border-gray-700 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all shadow-inner text-white"
                >
              </div>
              
              <div class="text-4xl font-bold text-gray-600 animate-pulse">:</div>
              
              <div class="text-center group">
                <label class="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 group-hover:text-red-400 transition-colors">對手</label>
                <input 
                  v-model.number="formData.opponent_score"
                  type="number" 
                  min="0"
                  class="w-24 h-24 text-center text-4xl font-bold bg-gray-800 border-2 border-gray-700 rounded-2xl focus:border-red-500 focus:ring-4 focus:ring-red-500/20 outline-none transition-all shadow-inner text-white"
                >
              </div>
            </div>
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
  </div>
</template>
