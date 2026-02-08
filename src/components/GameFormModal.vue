<script setup>
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import gameService from '@/services/gameService';
import masterDataService from '@/services/masterDataService';
import QuickAddModal from '@/components/QuickAddModal.vue';
import DatePicker from '@/components/DatePicker.vue';
import TimePicker from '@/components/TimePicker.vue';
import { useMasterDataStore } from '@/stores/masterData';
import { storeToRefs } from 'pinia';
import { useToast } from '@/composables/useToast';
import { onUnmounted } from 'vue';

const { t } = useI18n();
const { success: toastSuccess, error: toastError } = useToast();

const props = defineProps({
    isOpen: {
        type: Boolean,
        required: true
    }
});

const emit = defineEmits(['close', 'saved']);

const masterDataStore = useMasterDataStore();
const { seasons, fields, myTeams, opponentTeams } = storeToRefs(masterDataStore);

const formData = ref({
  gameDate: '',
  startTime: '',
  endTime: '',
  season_id: '',
  team_id: '',
  opponent_team_id: '',
  field_id: '',
  homeAway: 1,
  score: 0,
  enemyScore: 0,
  memo: ''
});

const isSubmitting = ref(false);
const showSeasonModal = ref(false);
const showFieldModal = ref(false);
const showMyTeamModal = ref(false);
const showOpponentTeamModal = ref(false);
const modalLoading = ref(false);
const showDatePicker = ref(false);
const showStartTimePicker = ref(false);
const showEndTimePicker = ref(false);

// Watch for modal open to initialize data
watch(() => props.isOpen, async (isOpen) => {
    if (isOpen) {
        document.body.style.overflow = 'hidden';
        // Load master data if needed
        if (seasons.value.length === 0) {
            await masterDataStore.fetchAll();
        }
        
        // Reset form
        formData.value = {
            gameDate: '',
            startTime: '',
            endTime: '',
            season_id: '',
            team_id: '',
            opponent_team_id: '',
            field_id: '',
            homeAway: 1,
            score: 0,
            enemyScore: 0,
            memo: ''
        };
    } else {
        document.body.style.overflow = '';
    }
});

onUnmounted(() => {
    document.body.style.overflow = '';
});

const handleSubmit = async () => {
    if (!formData.value.season_id || !formData.value.team_id) {
        if (!formData.value.season_id) {
            toastError(t('games.seasonIdRequired'));
        }
        if (!formData.value.team_id) {
            toastError(t('games.teamIdRequired'));
        }
        return;
    }

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
        toastSuccess(t('games.addGame') + ' ' + t('common.success'));
        emit('saved', response.data.result.id);
        emit('close');
    } catch (error) {
        console.error('Failed to save game:', error);
        toastError(t('common.save') + ' Error');
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

const datePickerRef = ref(null);
const startTimePickerRef = ref(null);
const endTimePickerRef = ref(null);

const handleClickOutside = (event) => {
    if (showDatePicker.value && datePickerRef.value && !datePickerRef.value.contains(event.target)) {
        showDatePicker.value = false;
    }
    if (showStartTimePicker.value && startTimePickerRef.value && !startTimePickerRef.value.contains(event.target)) {
        showStartTimePicker.value = false;
    }
    if (showEndTimePicker.value && endTimePickerRef.value && !endTimePickerRef.value.contains(event.target)) {
        showEndTimePicker.value = false;
    }
};

watch(() => [showDatePicker.value, showStartTimePicker.value, showEndTimePicker.value], ([d, s, e]) => {
    if (d || s || e) {
        window.addEventListener('click', handleClickOutside);
    } else {
        window.removeEventListener('click', handleClickOutside);
    }
});

onUnmounted(() => {
    document.body.style.overflow = '';
    window.removeEventListener('click', handleClickOutside);
});

const handleClose = () => {
    if (!isSubmitting.value) {
        emit('close');
    }
};
</script>

<template>
    <Teleport to="body">
        <Transition name="modal">
            <div v-if="isOpen" class="fixed inset-0 z-[9999] flex items-center justify-center md:p-4 p-0">
                <!-- Backdrop -->
                <div class="absolute inset-0 bg-black/80" aria-hidden="true"></div>

                <!-- Modal Container -->
                <div class="relative bg-gray-900 md:rounded-2xl rounded-none shadow-2xl border border-white/10 w-full max-w-3xl md:max-h-[90vh] h-full md:h-auto overflow-hidden flex flex-col z-10">
                    <!-- Header -->
                    <div class="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gray-800/50">
                        <h2 class="text-2xl font-black text-white tracking-tight">{{ t('games.addGame') }}</h2>
                        <button @click="handleClose" class="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-all">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <!-- Content -->
                    <div class="flex-1 overflow-y-auto p-6">
                        <form @submit.prevent="handleSubmit" class="space-y-6">
                            <!-- Basic Info Section -->
                            <div class="space-y-4">
                                <h3 class="text-sm font-bold text-blue-400 uppercase tracking-wider">基本資訊</h3>
                                
                                <!-- Season & Field -->
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div class="space-y-2">
                                        <label class="block text-sm font-medium text-gray-400 ml-1">
                                            {{ t('games.season') }} <span class="text-red-400">*</span>
                                        </label>
                                        <div class="flex gap-2">
                                            <select v-model="formData.season_id" class="input-field flex-1" required>
                                                <option value="" disabled>請選擇賽季</option>
                                                <option v-for="season in seasons" :key="season.id" :value="season.id">
                                                    {{ season.name }}
                                                </option>
                                            </select>
                                            <button type="button" class="px-3 bg-gray-700 hover:bg-blue-600 text-white rounded-xl transition-colors" @click="showSeasonModal = true">
                                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>

                                    <div class="space-y-2">
                                        <label class="block text-sm font-medium text-gray-400 ml-1">{{ t('games.field') }}</label>
                                        <div class="flex gap-2">
                                            <select v-model="formData.field_id" class="input-field flex-1">
                                                <option value="">請選擇場地</option>
                                                <option v-for="field in fields" :key="field.id" :value="field.id">
                                                    {{ field.name }}
                                                </option>
                                            </select>
                                            <button type="button" class="px-3 bg-gray-700 hover:bg-blue-600 text-white rounded-xl transition-colors" @click="showFieldModal = true">
                                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <!-- Teams -->
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div class="space-y-2">
                                        <label class="block text-sm font-medium text-gray-400 ml-1">
                                            {{ t('games.myTeam') }} <span class="text-red-400">*</span>
                                        </label>
                                        <div class="flex gap-2">
                                            <select v-model="formData.team_id" class="input-field flex-1" required>
                                                <option value="" disabled>請選擇我方球隊</option>
                                                <option v-for="team in myTeams" :key="team.id" :value="team.id">
                                                    {{ team.name }}
                                                </option>
                                            </select>
                                            <button type="button" class="px-3 bg-gray-700 hover:bg-blue-600 text-white rounded-xl transition-colors" @click="showMyTeamModal = true">
                                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>

                                    <div class="space-y-2">
                                        <label class="block text-sm font-medium text-gray-400 ml-1">{{ t('games.opponentTeam') }}</label>
                                        <div class="flex gap-2">
                                            <select v-model="formData.opponent_team_id" class="input-field flex-1">
                                                <option value="">請選擇對方球隊</option>
                                                <option v-for="team in opponentTeams" :key="team.id" :value="team.id">
                                                    {{ team.name }}
                                                </option>
                                            </select>
                                            <button type="button" class="px-3 bg-gray-700 hover:bg-blue-600 text-white rounded-xl transition-colors" @click="showOpponentTeamModal = true">
                                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <!-- Date & Time -->
                                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div class="space-y-2">
                                        <label class="block text-sm font-medium text-gray-400 ml-1">{{ t('games.date') }}</label>
                                        <div class="relative" ref="datePickerRef">
                                            <input type="text" v-model="formData.gameDate" @click.stop="showDatePicker = true" readonly class="input-field cursor-pointer">
                                            <div v-if="showDatePicker" class="absolute top-full left-0 z-50 mt-2 shadow-2xl">
                                                <DatePicker v-model="formData.gameDate" @close="showDatePicker = false" />
                                            </div>
                                        </div>
                                    </div>

                                    <div class="space-y-2">
                                        <label class="block text-sm font-medium text-gray-400 ml-1">{{ t('games.startTime') }}</label>
                                        <div class="relative" ref="startTimePickerRef">
                                            <input type="text" v-model="formData.startTime" @click.stop="showStartTimePicker = true" readonly class="input-field cursor-pointer">
                                            <div v-if="showStartTimePicker" class="absolute top-full left-0 z-50 mt-2 shadow-2xl">
                                                <TimePicker v-model="formData.startTime" @close="showStartTimePicker = false" />
                                            </div>
                                        </div>
                                    </div>

                                    <div class="space-y-2">
                                        <label class="block text-sm font-medium text-gray-400 ml-1">{{ t('games.endTime') }}</label>
                                        <div class="relative" ref="endTimePickerRef">
                                            <input type="text" v-model="formData.endTime" @click.stop="showEndTimePicker = true" readonly class="input-field cursor-pointer">
                                            <div v-if="showEndTimePicker" class="absolute top-full left-0 z-50 mt-2 shadow-2xl">
                                                <TimePicker v-model="formData.endTime" :default-value="formData.startTime" @close="showEndTimePicker = false" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Home/Away & Scores -->
                                <div class="space-y-4">
                                    <div class="space-y-2">
                                        <label class="block text-sm font-medium text-gray-400 ml-1">{{ t('games.homeAway') }}</label>
                                        <div class="flex gap-2">
                                            <button type="button" @click="formData.homeAway = 1" class="flex-1 px-4 py-2 rounded-xl border border-white/10 font-bold transition-all" :class="formData.homeAway === 1 ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'">
                                                🗡️ {{ t('games.firstAttack') }}
                                            </button>
                                            <button type="button" @click="formData.homeAway = 2" class="flex-1 px-4 py-2 rounded-xl border border-white/10 font-bold transition-all" :class="formData.homeAway === 2 ? 'bg-red-600 text-white shadow-lg shadow-red-500/20' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'">
                                                🛡️ {{ t('games.secondAttack') }}
                                            </button>
                                        </div>
                                    </div>

                                    <div class="grid grid-cols-2 gap-4">
                                        <div class="space-y-2">
                                            <label class="block text-sm font-medium text-gray-400 ml-1">我方分數</label>
                                            <input v-model.number="formData.score" type="number" min="0" class="input-field" placeholder="0">
                                        </div>
                                        <div class="space-y-2">
                                            <label class="block text-sm font-medium text-gray-400 ml-1">對方分數</label>
                                            <input v-model.number="formData.enemyScore" type="number" min="0" class="input-field" placeholder="0">
                                        </div>
                                    </div>
                                </div>

                                <!-- Memo -->
                                <div class="space-y-2">
                                    <label class="block text-sm font-medium text-gray-400 ml-1">{{ t('games.memo') }}</label>
                                    <textarea v-model="formData.memo" rows="3" class="input-field" :placeholder="t('games.memoPlaceholder')"></textarea>
                                </div>
                            </div>
                        </form>
                    </div>

                    <!-- Footer -->
                    <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10 bg-gray-800/50">
                        <button @click="handleClose" class="px-6 py-2.5 rounded-xl border border-white/10 text-gray-400 font-bold hover:bg-white/5 transition-all" :disabled="isSubmitting">
                            {{ t('common.cancel') }}
                        </button>
                        <button @click="handleSubmit" class="px-8 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2" :disabled="isSubmitting">
                            <svg v-if="isSubmitting" class="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                            </svg>
                            {{ isSubmitting ? t('common.loading') : t('common.save') }}
                        </button>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>

    <!-- Quick Add Modals -->
    <QuickAddModal :is-open="showSeasonModal" :title="t('masterData.addSeason')" :label="t('masterData.name')" :is-loading="modalLoading" @close="showSeasonModal = false" @confirm="(name) => handleQuickAdd('season', name)" />
    <QuickAddModal :is-open="showFieldModal" :title="t('masterData.addField')" :label="t('masterData.name')" :is-loading="modalLoading" @close="showFieldModal = false" @confirm="(name) => handleQuickAdd('field', name)" />
    <QuickAddModal :is-open="showMyTeamModal" :title="t('games.addMyTeam')" :label="t('masterData.name')" :is-loading="modalLoading" @close="showMyTeamModal = false" @confirm="(name) => handleQuickAdd('myTeam', name)" />
    <QuickAddModal :is-open="showOpponentTeamModal" :title="t('games.addOpponentTeam')" :label="t('masterData.name')" :is-loading="modalLoading" @close="showOpponentTeamModal = false" @confirm="(name) => handleQuickAdd('opponentTeam', name)" />
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
    transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
    opacity: 0;
}

.modal-enter-active .bg-gray-900,
.modal-leave-active .bg-gray-900 {
    transition: transform 0.3s ease;
}

.modal-enter-from .bg-gray-900,
.modal-leave-to .bg-gray-900 {
    transform: scale(0.95);
}
</style>
