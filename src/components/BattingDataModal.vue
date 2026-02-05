
<script setup>
import { ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useMasterDataStore } from '@/stores/masterData';
import battingService from '@/services/battingService';
import battingResultService from '@/services/battingResultService';

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
        // Load result options if not already loaded
        await masterDataStore.fetchResultOptions();
        
        // Initialize local data
        localBattingStats.value = {
            R: props.battingStats.R || 0,
            SB: props.battingStats.SB || 0,
            CS: props.battingStats.CS || 0
        };
        
        // Deep copy and ensure numeric types for IDs
        const copiedResults = JSON.parse(JSON.stringify(props.battingResults || []));
        localBattingResults.value = copiedResults.map(r => {
            // Convert to number, but preserve null for truly missing values
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
        deletedBattingResultIds.value = [];
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
        alert('儲存失敗，請稍後再試');
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
            <div v-if="isOpen" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                <!-- Backdrop -->
                <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" aria-hidden="true"></div>

                <!-- Modal Container -->
                <div class="relative bg-gray-900 rounded-2xl shadow-2xl border border-white/10 w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col z-10">
                    <!-- Header -->
                    <div class="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gray-800/50">
                        <h2 class="text-2xl font-black text-white tracking-tight">編輯打擊資料</h2>
                        <button @click="handleClose" class="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-all">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <!-- Content -->
                    <div class="flex-1 overflow-y-auto p-6 space-y-6">
                        <!-- Batting Statistics (Single Row) -->
                        <div class="flex items-center gap-6 px-4 py-3 bg-gray-800/40 rounded-xl border border-white/5">
                            <div class="flex items-center gap-3">
                                <label class="text-sm font-medium text-gray-400 min-w-[60px]">得分 (R)</label>
                                <input 
                                    type="number" 
                                    v-model.number="localBattingStats.R"
                                    min="0"
                                    class="input-field !py-2 !px-3 !text-sm w-20 text-center"
                                >
                            </div>
                            <div class="flex items-center gap-3">
                                <label class="text-sm font-medium text-gray-400 min-w-[60px]">盜壘 (SB)</label>
                                <input 
                                    type="number" 
                                    v-model.number="localBattingStats.SB"
                                    min="0"
                                    class="input-field !py-2 !px-3 !text-sm w-20 text-center"
                                >
                            </div>
                            <div class="flex items-center gap-3">
                                <label class="text-sm font-medium text-gray-400 min-w-[80px]">盜壘失敗 (CS)</label>
                                <input 
                                    type="number" 
                                    v-model.number="localBattingStats.CS"
                                    min="0"
                                    class="input-field !py-2 !px-3 !text-sm w-20 text-center"
                                >
                            </div>
                        </div>

                        <!-- Batting Results Table -->
                        <div class="space-y-3">
                            <div class="flex items-center justify-between">
                                <h3 class="text-lg font-bold text-white">逐打席記錄</h3>
                                <button 
                                    @click="addBattingResult"
                                    class="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-all shadow-lg shadow-purple-500/20 flex items-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                                    </svg>
                                    新增打席
                                </button>
                            </div>

                            <div class="card overflow-hidden border-purple-500/30 shadow-xl backdrop-blur-sm bg-gray-800/40">
                                <div class="overflow-x-auto">
                                    <table class="w-full text-left border-collapse">
                                        <thead>
                                            <tr class="bg-gray-900 border-b border-white/10 uppercase text-[10px] md:text-xs tracking-[0.1em] text-gray-500 font-bold">
                                                <th class="px-2 md:px-4 py-4 text-center w-12">#</th>
                                                <th class="px-2 md:px-4 py-4 text-gray-400">投手</th>
                                                <th class="px-2 md:px-4 py-4 text-gray-400">打擊結果</th>
                                                <th class="px-2 md:px-4 py-4 text-gray-400">擊球落點</th>
                                                <th class="px-2 md:px-4 py-4 text-gray-400">擊球型態</th>
                                                <th class="px-2 md:px-4 py-4 text-center text-gray-400">打點</th>
                                                <th class="px-2 md:px-4 py-4 text-center text-gray-400">得點圈</th>
                                                <th class="px-2 md:px-4 py-4 text-center w-16"></th>
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
                                                        class="input-field !py-2 !px-3 !text-sm w-full min-w-[120px]"
                                                        placeholder="投手名稱"
                                                    >
                                                </td>
                                                
                                                <!-- Matchup Result -->
                                                <td class="px-2 md:px-4 py-3">
                                                    <select 
                                                        v-model="result.Z00_matchupResultList_id"
                                                        @change="handleMatchupResultChange(index, Number($event.target.value))"
                                                        class="input-field !py-2 !px-3 !text-sm w-full min-w-[140px]"
                                                    >
                                                        <option :value="null">選擇結果</option>
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
                                                        class="input-field !py-2 !px-3 !text-sm w-full min-w-[120px]"
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
                                                        class="input-field !py-2 !px-3 !text-sm w-full min-w-[120px]"
                                                    >
                                                        <option :value="null">選擇型態</option>
                                                        <option v-for="type in getAvailableBallTypes(result.Z00_matchupResultList_id)" :key="type.Z00_ballInPlayType_id" :value="Number(type.Z00_ballInPlayType_id)">
                                                            {{ type.name }}
                                                        </option>
                                                    </select>
                                                    <span v-else class="text-gray-600 text-sm">-</span>
                                                </td>
                                                
                                                <!-- RBI -->
                                                <td class="px-2 md:px-4 py-3">
                                                    <input 
                                                        type="number" 
                                                        v-model.number="result.RBI"
                                                        min="0"
                                                        class="input-field !py-2 !px-3 !text-sm w-16 text-center"
                                                        placeholder="0"
                                                    >
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
                                                        title="刪除"
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
                            取消
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
                            {{ isSaving ? '儲存中...' : '儲存' }}
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
