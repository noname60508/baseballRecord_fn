
<script setup>
import { ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useMasterDataStore } from '@/stores/masterData';
import { useI18n } from 'vue-i18n';
import battingService from '@/services/battingService';
import battingResultService from '@/services/battingResultService';

import { useToast } from '@/composables/useToast';

const { t } = useI18n();
const { error: toastError } = useToast();

const props = defineProps({
    isOpen: {
        type: Boolean,
        required: true
    },
    gameId: {
        type: Number,
        required: true
    },
    battingStats: {
        type: Object,
        required: true
    },
    battingResults: {
        type: Array,
        required: true
    }
});

const emit = defineEmits(['close', 'saved']);

const masterDataStore = useMasterDataStore();
const { matchupResults, locations, ballTypes } = storeToRefs(masterDataStore);

const isSaving = ref(false);
const localBattingStats = ref({});
const localBattingResults = ref([]);
const deletedBattingResultIds = ref([]);

// Watch for modal open to initialize data
watch(() => props.isOpen, async (isOpen) => {
    if (isOpen) {
        // Initialize simple stats immediately
        localBattingStats.value = {
            R: props.battingStats.R || 0,
            SB: props.battingStats.SB || 0,
            CS: props.battingStats.CS || 0
        };
        
        // Reset results initially to show loading/empty state
        localBattingResults.value = [];
        deletedBattingResultIds.value = [];

        // Defer heavy data processing
        setTimeout(async () => {
            // Load result options if needed
            if (matchupResults.value.length === 0) {
                await masterDataStore.fetchResultOptions();
            }
            
            // Deep copy and process
            const copiedResults = JSON.parse(JSON.stringify(props.battingResults || []));
            localBattingResults.value = copiedResults.map(r => {
                const convertId = (val) => {
                    if (val === null || val === undefined || val === '') return null;
                    return Number(val);
                };
                
                return {
                    ...r,
                    Z00_matchupResultList_id: convertId(r.Z00_matchupResultList_id),
                    Z00_location_id: convertId(r.Z00_location_id),
                    Z00_BallInPlayType_id: convertId(r.Z00_BallInPlayType_id),
                    RBI: Number(r.RBI || 0),
                    RISP: Number(r.RISP || 0)
                };
            });
        }, 50); // Small delay allows transition to start
    }
});

// ========== Batting Results CRUD Functions ==========

const addBattingResult = () => {
    const newResult = {
        id: null,
        orderNo: localBattingResults.value.length + 1,
        pitcher: '',
        Z00_matchupResultList_id: null,
        Z00_location_id: 0,
        Z00_BallInPlayType_id: 0,
        RBI: 0,
        RISP: 0
    };
    localBattingResults.value.push(newResult);
};

const deleteBattingResult = (index) => {
    const result = localBattingResults.value[index];
    if (result.id) {
        deletedBattingResultIds.value.push(result.id);
    }
    localBattingResults.value.splice(index, 1);
    // Re-number
    localBattingResults.value.forEach((r, i) => {
        r.orderNo = i + 1;
    });
};

const handleMatchupResultChange = (index, matchupResultId) => {
    const selectedResult = matchupResults.value.find(r => r.Z00_matchupResultList_id == matchupResultId);
    if (!selectedResult) return;
    
    // Reset location
    if (selectedResult.locationOptions && selectedResult.locationOptions.length === 1 && selectedResult.locationOptions[0] === 0) {
        localBattingResults.value[index].Z00_location_id = 0;
    } else {
        localBattingResults.value[index].Z00_location_id = null;
    }
    
    // Reset ball type
    if (selectedResult.ballTypeOptions && selectedResult.ballTypeOptions.length === 1 && selectedResult.ballTypeOptions[0] === 0) {
        localBattingResults.value[index].Z00_BallInPlayType_id = 0;
    } else {
        localBattingResults.value[index].Z00_BallInPlayType_id = null;
    }
};

const getAvailableLocations = (matchupResultId) => {
    const selectedResult = matchupResults.value.find(r => r.Z00_matchupResultList_id == matchupResultId);
    // If no result selected or no options defined, return empty (or all? adhering to strict filter requirement)
    // User said: "need to filter... if it has it... if only 0 then 0"
    // If options are undefined, we assume no restriction? Or no options?
    // Let's assume safely: if options are missing, we likely shouldn't show anything as per requirement.
    if (!selectedResult || !selectedResult.locationOptions) return [];
    
    if (selectedResult.locationOptions.length === 1 && selectedResult.locationOptions[0] === 0) {
        return [];
    }
    
    return locations.value.filter(loc => 
        selectedResult.locationOptions.some(opt => opt == loc.Z00_positionAndLocation_id)
    );
};

const hasAvailableLocations = (matchupResultId) => {
    return getAvailableLocations(matchupResultId).length > 0;
};

const getAvailableBallTypes = (matchupResultId) => {
    const selectedResult = matchupResults.value.find(r => r.Z00_matchupResultList_id == matchupResultId);
    if (!selectedResult || !selectedResult.ballTypeOptions) return [];
    
    if (selectedResult.ballTypeOptions.length === 1 && selectedResult.ballTypeOptions[0] === 0) {
        return [];
    }
    
    return ballTypes.value.filter(type => 
        selectedResult.ballTypeOptions.some(opt => opt == type.Z00_ballInPlayType_id)
    );
};

const hasAvailableBallTypes = (matchupResultId) => {
    return getAvailableBallTypes(matchupResultId).length > 0;
};

// ========== Save & Close Handlers ==========

const handleSave = async () => {
    isSaving.value = true;
    try {
        // Save batting statistics
        const statsChanged = 
            localBattingStats.value.R !== (props.battingStats.R || 0) ||
            localBattingStats.value.SB !== (props.battingStats.SB || 0) ||
            localBattingStats.value.CS !== (props.battingStats.CS || 0);
        
        // Validate Batting Results
        const invalidResults = localBattingResults.value.filter(r => !r.Z00_matchupResultList_id);
        if (invalidResults.length > 0) {
            toastError(t('batting.requiredToast'));
            isSaving.value = false;
            return;
        }

        if (statsChanged) {
            await battingService.updateBattingRecord(props.gameId, localBattingStats.value);
        }

        // Save batting results
        const resultsChanged = 
            deletedBattingResultIds.value.length > 0 ||
            JSON.stringify(props.battingResults) !== JSON.stringify(localBattingResults.value);

        if (resultsChanged) {
            // Delete first
            if (deletedBattingResultIds.value.length > 0) {
                await battingResultService.destroy(deletedBattingResultIds.value);
            }
            
            // Then update/create
            if (localBattingResults.value.length > 0) {
                const data = {
                    game_id: props.gameId,
                    result: localBattingResults.value.map(r => ({
                        id: r.id || null,
                        orderNo: r.orderNo,
                        pitcher: r.pitcher || '',
                        Z00_matchupResultList_id: r.Z00_matchupResultList_id,
                        Z00_location_id: r.Z00_location_id || 0,
                        Z00_BallInPlayType_id: r.Z00_BallInPlayType_id || 0,
                        RBI: r.RBI || 0,
                        RISP: r.RISP || 0
                    }))
                };
                await battingResultService.updateOrCreate(data);
            }
        }

        emit('saved');
        emit('close');
    } catch (error) {
        console.error('Failed to save batting data:', error);
        // Let's check zh-TW for 'failed'. NOT FOUND.
        // I will add it or just use translated "Save" + " Failed".
        // Actually, let's just update it to a hardcoded bilingual string for now if key missing, or add key.
        // I'll add 'common.failed' key? 
        // For this step, let's keep it safe: alert(t('common.save') + ' error');
        alert(t('common.save') + ' Error'); 
    } finally {
        isSaving.value = false;
    }
};

const handleClose = () => {
    if (!isSaving.value) {
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
                <div class="relative bg-gray-900 md:rounded-2xl rounded-none shadow-2xl border border-white/10 w-full max-w-6xl md:max-h-[90vh] h-full md:h-auto overflow-hidden flex flex-col z-10">
                    <!-- Header -->
                    <div class="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gray-800/50">
                        <h2 class="text-2xl font-black text-white tracking-tight">{{ t('batting.editTitle') }}</h2>
                        <button @click="handleClose" class="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-all">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <!-- Content -->
                    <div class="flex-1 overflow-y-auto p-6 space-y-6">
                        <!-- Batting Statistics (Responsive Flex Layout) -->
                        <div class="flex flex-wrap items-center gap-6 px-4 py-4 bg-gray-800/40 rounded-xl border border-white/5">
                            <div class="flex flex-col items-start gap-1">
                                <label class="text-xs font-bold text-gray-400 pl-1">{{ t('batting.r') }}</label>
                                <input 
                                    type="number" 
                                    v-model.number="localBattingStats.R"
                                    min="0"
                                    class="input-field !py-2 !px-3 !text-sm w-24 text-center"
                                >
                            </div>
                            <div class="flex flex-col items-start gap-1">
                                <label class="text-xs font-bold text-gray-400 pl-1">{{ t('batting.sb') }}</label>
                                <input 
                                    type="number" 
                                    v-model.number="localBattingStats.SB"
                                    min="0"
                                    class="input-field !py-2 !px-3 !text-sm w-24 text-center"
                                >
                            </div>
                            <div class="flex flex-col items-start gap-1">
                                <label class="text-xs font-bold text-gray-400 pl-1">{{ t('batting.cs') }}</label>
                                <input 
                                    type="number" 
                                    v-model.number="localBattingStats.CS"
                                    min="0"
                                    class="input-field !py-2 !px-3 !text-sm w-24 text-center"
                                >
                            </div>
                        </div>

                        <!-- Batting Results Table -->
                        <div class="space-y-3">
                            <div class="flex items-center justify-between">
                                <h3 class="text-lg font-bold text-white">{{ t('batting.history') }}</h3>
                                <button 
                                    @click="addBattingResult"
                                    class="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-all shadow-lg shadow-purple-500/20 flex items-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                                    </svg>
                                    {{ t('batting.addPa') }}
                                </button>
                            </div>

                            <div class="card overflow-hidden border-purple-500/30 shadow-xl backdrop-blur-sm bg-gray-800/40">
                                <div class="overflow-x-auto">
                                    <table class="w-full text-left border-collapse">
                                        <thead>
                                            <tr class="bg-gray-900 border-b border-white/10 uppercase text-[10px] md:text-xs tracking-[0.1em] text-gray-500 font-bold">
                                                <th class="px-2 md:px-4 py-4 text-center w-12 text-nowrap">#</th>
                                                <th class="px-2 md:px-4 py-4 text-gray-400 min-w-[120px] text-nowrap">{{ t('batting.pitcher') }}</th>
                                                <th class="px-2 md:px-4 py-4 text-gray-400 min-w-[150px] text-nowrap">{{ t('batting.matchupResult') }}</th>
                                                <th class="px-2 md:px-4 py-4 text-gray-400 min-w-[130px] text-nowrap">{{ t('batting.location') }}</th>
                                                <th class="px-2 md:px-4 py-4 text-gray-400 min-w-[130px] text-nowrap">{{ t('batting.ballType') }}</th>
                                                <th class="px-2 md:px-4 py-4 text-center text-gray-400 w-20 text-nowrap">{{ t('batting.rbi') }}</th>
                                                <th class="px-2 md:px-4 py-4 text-center text-gray-400 min-w-[80px] text-nowrap">{{ t('batting.risp') }}</th>
                                                <th class="px-2 md:px-4 py-4 text-center w-16 text-nowrap"></th>
                                            </tr>
                                        </thead>
                                        <tbody class="divide-y divide-white/5 bg-gray-800/40">
                                            <tr v-for="(result, index) in localBattingResults" :key="index" class="hover:bg-white/5 transition-all">
                                                <!-- Order Number -->
                                                <td class="px-2 md:px-4 py-3 text-center">
                                                    <span class="text-sm font-black text-gray-600">{{ result.orderNo }}</span>
                                                </td>
                                                
                                                <!-- Pitcher -->
                                                <td class="px-2 md:px-4 py-3">
                                                    <input 
                                                        type="text" 
                                                        v-model="result.pitcher"
                                                        class="input-field !py-2 !px-3 !text-sm w-full"
                                                        :placeholder="t('batting.pitcher')"
                                                    >
                                                </td>
                                                
                                                <!-- Matchup Result -->
                                                <td class="px-2 md:px-4 py-3">
                                                    <select 
                                                        v-model="result.Z00_matchupResultList_id"
                                                        @change="handleMatchupResultChange(index, Number($event.target.value))"
                                                        class="input-field !py-2 !px-3 !text-sm w-full"
                                                    >
                                                        <option :value="null">---</option>
                                                        <option v-for="mr in matchupResults" :key="mr.Z00_matchupResultList_id" :value="Number(mr.Z00_matchupResultList_id)">
                                                            {{ mr.name }}
                                                        </option>
                                                    </select>
                                                </td>
                                                
                                                <!-- Location (Conditional) -->
                                                <td class="px-2 md:px-4 py-3">
                                                    <select 
                                                        v-if="hasAvailableLocations(result.Z00_matchupResultList_id)"
                                                        v-model="result.Z00_location_id"
                                                        class="input-field !py-2 !px-3 !text-sm w-full"
                                                    >
                                                        <option :value="null">選擇落點</option>
                                                        <option v-for="loc in getAvailableLocations(result.Z00_matchupResultList_id)" :key="loc.Z00_positionAndLocation_id" :value="Number(loc.Z00_positionAndLocation_id)">
                                                            {{ loc.name }}
                                                        </option>
                                                    </select>
                                                    <span v-else class="text-gray-600 text-sm">-</span>
                                                </td>
                                                
                                                <!-- Ball Type (Conditional) -->
                                                <td class="px-2 md:px-4 py-3">
                                                    <select 
                                                        v-if="hasAvailableBallTypes(result.Z00_matchupResultList_id)"
                                                        v-model="result.Z00_BallInPlayType_id"
                                                        class="input-field !py-2 !px-3 !text-sm w-full"
                                                    >
                                                        <option :value="null">選擇型態</option>
                                                        <option v-for="type in getAvailableBallTypes(result.Z00_matchupResultList_id)" :key="type.Z00_ballInPlayType_id" :value="Number(type.Z00_ballInPlayType_id)">
                                                            {{ type.name }}
                                                        </option>
                                                    </select>
                                                    <span v-else class="text-gray-600 text-sm">-</span>
                                                </td>
                                                
                                                <!-- RBI (Dropdown 0-4) -->
                                                <td class="px-2 md:px-4 py-3">
                                                    <select
                                                        v-model.number="result.RBI"
                                                        class="input-field !py-2 !px-1 !text-sm w-full text-center"
                                                    >
                                                        <option :value="0">0</option>
                                                        <option :value="1">1</option>
                                                        <option :value="2">2</option>
                                                        <option :value="3">3</option>
                                                        <option :value="4">4</option>
                                                    </select>
                                                </td>
                                                
                                                <!-- RISP Checkbox -->
                                                <td class="px-2 md:px-4 py-3 text-center">
                                                    <input 
                                                        type="checkbox" 
                                                        :checked="result.RISP === 1"
                                                        @change="result.RISP = $event.target.checked ? 1 : 0"
                                                        class="w-5 h-5 rounded border-gray-700 bg-gray-900/50 text-red-600 focus:ring-red-500 focus:ring-offset-0 cursor-pointer"
                                                    >
                                                </td>
                                                
                                                <!-- Delete Button -->
                                                <td class="px-2 md:px-4 py-3 text-center">
                                                    <button 
                                                        @click="deleteBattingResult(index)"
                                                        class="p-2 rounded-lg hover:bg-red-600/20 text-red-500 hover:text-red-400 transition-all"
                                                        :title="t('common.delete')"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                                
                                <!-- Empty State -->
                                <div v-if="localBattingResults.length === 0" class="p-12 text-center text-gray-600 italic">
                                    點擊「新增打席」按鈕來新增打席記錄
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10 bg-gray-800/50">
                        <button 
                            @click="handleClose"
                            class="px-6 py-2.5 rounded-xl border border-white/10 text-gray-400 font-bold hover:bg-white/5 transition-all"
                            :disabled="isSaving"
                        >
                            {{ t('common.cancel') }}
                        </button>
                        <button 
                            @click="handleSave"
                            class="px-8 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2"
                            :disabled="isSaving"
                        >
                            <svg v-if="isSaving" class="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                            </svg>
                            {{ isSaving ? t('common.loading') : t('common.save') }}
                        </button>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
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
