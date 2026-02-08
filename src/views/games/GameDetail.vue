<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import gameService from '@/services/gameService';
import battingService from '@/services/battingService';
import battingResultService from '@/services/battingResultService';
import { useMasterDataStore } from '@/stores/masterData';
import { storeToRefs } from 'pinia';
import DatePicker from '@/components/DatePicker.vue';
import TimePicker from '@/components/TimePicker.vue';
import BattingDataModal from '@/components/BattingDataModal.vue';
import QuickAddModal from '@/components/QuickAddModal.vue';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const game = ref(null);
const isLoading = ref(true);
const isSaving = ref(false);
const gameData = ref(null);
const battingStatistics = ref(null);
const batterResult = ref(null);

// Batting Results (逐打席)
const battingResults = ref([]);

// Editing state
const isEditing = ref(false);
const editedGameData = ref(null);

// Batting Data Modal
const showBattingDataModal = ref(false);

const masterDataStore = useMasterDataStore();
const { seasons, fields, myTeams, opponentTeams, matchupResults, locations, ballTypes } = storeToRefs(masterDataStore);

const showDatePicker = ref(false);
const showStartTimePicker = ref(false);
const showEndTimePicker = ref(false);
const showDeleteModal = ref(false);

const fetchGameDetails = async () => {
    try {
        const response = await gameService.getGame(route.params.id);
        game.value = response.data.result;
        gameData.value = response.data.result.gameData;
        battingStatistics.value = response.data.result.battingStatistics;
        batterResult.value = response.data.result.batterResult;
        
        // Load batting results (逐打席)
        battingResults.value = response.data.result.batterResult || [];
    } catch (error) {
        console.error('Failed to fetch game details:', error);
    } finally {
        isLoading.value = false;
    }
};

const startEdit = async () => {
    await masterDataStore.fetchAll();
    
    editedGameData.value = { 
        Z00_season_id: gameData.value.Z00_season_id,
        Z00_field_id: gameData.value.Z00_field_id,
        Z00_team_id: gameData.value.Z00_team_id,
        Z00_team_id_enemy: gameData.value.Z00_team_id_enemy,
        homeAway: gameData.value.homeAway,
        gameDate: gameData.value.gameDate,
        startTime: gameData.value.startTime || '',
        endTime: gameData.value.endTime || '',
        score: gameData.value.score,
        enemyScore: gameData.value.enemyScore,
        memo: gameData.value.memo || ''
    };
    
    isEditing.value = true;
};

const cancelEdit = () => {
    isEditing.value = false;
    editedGameData.value = null;
};

// ========== Batting Data Modal Handlers ==========

const openBattingDataModal = () => {
    showBattingDataModal.value = true;
};

const closeBattingDataModal = () => {
    showBattingDataModal.value = false;
};

const handleBattingDataSaved = async () => {
    // Refresh game details after saving
    await fetchGameDetails();
};

const hasGameDataChanged = () => {
    if (!editedGameData.value || !gameData.value) return false;
    
    const normalizeTime = (t) => t ? t.slice(0, 5) : '';
    
    const current = { 
        ...editedGameData.value,
        startTime: normalizeTime(editedGameData.value.startTime),
        endTime: normalizeTime(editedGameData.value.endTime)
    };
    
    const original = {
        Z00_season_id: gameData.value.Z00_season_id,
        Z00_field_id: gameData.value.Z00_field_id,
        Z00_team_id: gameData.value.Z00_team_id,
        Z00_team_id_enemy: gameData.value.Z00_team_id_enemy,
        homeAway: gameData.value.homeAway,
        gameDate: gameData.value.gameDate,
        startTime: normalizeTime(gameData.value.startTime),
        endTime: normalizeTime(gameData.value.endTime),
        score: gameData.value.score,
        enemyScore: gameData.value.enemyScore,
        memo: gameData.value.memo || ''
    };
    
    return JSON.stringify(current) !== JSON.stringify(original);
};

const hasBattingStatsChanged = () => {
    if (!editedBattingStats.value || !battingStatistics.value) return false;
    return editedBattingStats.value.R !== (battingStatistics.value.R || 0) ||
           editedBattingStats.value.SB !== (battingStatistics.value.SB || 0) ||
           editedBattingStats.value.CS !== (battingStatistics.value.CS || 0);
};

const saveChanges = async () => {
    isSaving.value = true;
    try {
        // Ensure time format is H:i (HH:mm)
        if (editedGameData.value.startTime) {
            editedGameData.value.startTime = editedGameData.value.startTime.slice(0, 5);
        }
        if (editedGameData.value.endTime) {
            editedGameData.value.endTime = editedGameData.value.endTime.slice(0, 5);
        }

        const gameChanged = hasGameDataChanged();

        if (gameChanged) {
            await gameService.updateGame(gameData.value.id, editedGameData.value);
            await fetchGameDetails();
        }
        
        isEditing.value = false;
    } catch (error) {
        console.error('Failed to save changes:', error);
    } finally {
        isSaving.value = false;
    }
};

const openDeleteModal = () => {
    showDeleteModal.value = true;
};

const confirmDelete = async () => {
    try {
        isLoading.value = true;
        await gameService.deleteGame(gameData.value.id);
        router.push('/games');
    } catch (error) {
        console.error('Failed to delete game:', error);
        alert(t('common.failed'));
        isLoading.value = false; // Only stop loading on error, success redirects
    } finally {
        showDeleteModal.value = false;
    }
};

const getResultText = (result) => {
    switch (Number(result)) {
    case 1: return t('games.win');
    case 2: return t('games.loss');
    case 3: return t('games.tie');
    default: return '-';
  }
};

const gameResult = computed(() => {
    if (!gameData.value) return null;
    
    // Logic: 1=Win, 2=Loss, 3=Tie
    const result = Number(gameData.value.gameResult) || 0; // Default to 0 if missing
    
    // Base Colors
    let colorPrefix = 'gray';
    let textKey = 'games.tie';
    let type = 'tie';

    if (result === 1) { // Win
        colorPrefix = 'green';
        textKey = 'games.win';
        type = 'win';
    } else if (result === 2) { // Loss
        colorPrefix = 'red';
        textKey = 'games.loss';
        type = 'loss';
    } else if (result === 3) { // Tie
        colorPrefix = 'yellow';
        textKey = 'games.tie';
        type = 'tie';
    } else {
        return null; // No result yet
    }

    return {
        type,
        text: t(textKey),
        // Style: Watermark Text
        watermarkColor: `text-${colorPrefix}-500/10`,
    };
});

// ========== Batting Results (逐打席) CRUD Functions ==========

/**
 * 新增空白打席
 */
const addBattingResult = () => {
    const newResult = {
        id: null, // 新增時不帶 ID
        orderNo: editedBattingResults.value.length + 1,
        pitcher: '',
        Z00_matchupResultList_id: null,
        Z00_location_id: 0,
        Z00_BallInPlayType_id: 0,
        RBI: 0,
        RISP: 0
    };
    editedBattingResults.value.push(newResult);
};

/**
 * 刪除打席（標記為刪除）
 */
const deleteBattingResult = (index) => {
    const result = editedBattingResults.value[index];
    if (result.id) {
        // 如果有 ID，加入刪除列表
        deletedBattingResultIds.value.push(result.id);
    }
    // 從編輯列表中移除
    editedBattingResults.value.splice(index, 1);
    // 重新編號
    editedBattingResults.value.forEach((r, i) => {
        r.orderNo = i + 1;
    });
};

/**
 * 更新打席欄位
 */
const updateBattingResultField = (index, field, value) => {
    editedBattingResults.value[index][field] = value;
};

/**
 * 當打擊結果改變時，重置落點和型態
 */
const handleMatchupResultChange = (index, matchupResultId) => {
    const selectedResult = matchupResults.value.find(r => r.id === matchupResultId);
    if (!selectedResult) return;
    
    // 重置落點
    if (selectedResult.locationOptions && selectedResult.locationOptions.length === 1 && selectedResult.locationOptions[0] === 0) {
        editedBattingResults.value[index].Z00_location_id = 0;
    } else {
        editedBattingResults.value[index].Z00_location_id = null;
    }
    
    // 重置型態
    if (selectedResult.ballTypeOptions && selectedResult.ballTypeOptions.length === 1 && selectedResult.ballTypeOptions[0] === 0) {
        editedBattingResults.value[index].Z00_BallInPlayType_id = 0;
    } else {
        editedBattingResults.value[index].Z00_BallInPlayType_id = null;
    }
};

/**
 * 取得可用的擊球落點選項（根據打擊結果過濾）
 */
const getAvailableLocations = (matchupResultId) => {
    const selectedResult = matchupResults.value.find(r => r.id === matchupResultId);
    if (!selectedResult || !selectedResult.locationOptions) return [];
    
    // 若只有 [0]，不顯示選項
    if (selectedResult.locationOptions.length === 1 && selectedResult.locationOptions[0] === 0) {
        return [];
    }
    
    return locations.value.filter(loc => 
        selectedResult.locationOptions.includes(loc.id)
    );
};

/**
 * 取得可用的擊球型態選項（根據打擊結果過濾）
 */
const getAvailableBallTypes = (matchupResultId) => {
    const selectedResult = matchupResults.value.find(r => r.id === matchupResultId);
    if (!selectedResult || !selectedResult.ballTypeOptions) return [];
    
    // 若只有 [0]，不顯示選項
    if (selectedResult.ballTypeOptions.length === 1 && selectedResult.ballTypeOptions[0] === 0) {
        return [];
    }
    
    return ballTypes.value.filter(type => 
        selectedResult.ballTypeOptions.includes(type.id)
    );
};

/**
 * 檢查逐打席是否有變更
 */
const hasBattingResultsChanged = () => {
    if (deletedBattingResultIds.value.length > 0) return true;
    if (JSON.stringify(battingResults.value) !== JSON.stringify(editedBattingResults.value)) return true;
    return false;
};

/**
 * 儲存逐打席資料
 */
const saveBattingResults = async () => {
    try {
        // 先處理刪除
        if (deletedBattingResultIds.value.length > 0) {
            await battingResultService.destroy(deletedBattingResultIds.value);
        }
        
        // 再處理新增/更新
        if (editedBattingResults.value.length > 0) {
            const data = {
                game_id: gameData.value.id,
                result: editedBattingResults.value.map(r => ({
                    ...(r.id && { id: r.id }), // 只有在有 ID 時才帶入
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
    } catch (error) {
        console.error('Failed to save batting results:', error);
        throw error;
    }
};

onMounted(() => {
    fetchGameDetails();
});
</script>

<template>
    <div class="max-w-4xl mx-auto space-y-8 relative">
        <!-- Background Decor -->
        <div class="fixed top-20 right-[10%] w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>
        <div class="fixed bottom-20 left-[5%] w-80 h-80 bg-purple-600/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>

        <!-- Header -->
        <div class="flex items-center justify-between mb-8">
            <div class="flex items-center">
                <button @click="router.back()" class="p-2 mr-4 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                </button>
                <h1 class="text-3xl font-bold text-white tracking-tight">比賽詳情</h1>
            </div>
        </div>

        <div v-if="isLoading" class="flex flex-col items-center justify-center py-20 space-y-4">
            <div class="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
            <p class="text-gray-400 font-medium animate-pulse">{{ t('common.loading') }}</p>
        </div>

        <div v-else-if="!game" class="card text-center py-20 text-gray-400">
            找不到該比賽紀錄
        </div>

        <div v-else class="space-y-8 pb-16">
            <!-- Removed Top Scoreboard Card as requested -->

            <!-- Section 1: Basic Info -->
            <section class="space-y-6">
                <div class="flex items-center justify-between px-1">
                    <div class="flex items-center gap-3">
                        <div class="w-1.5 h-6 md:w-2 md:h-8 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
                        <h2 class="text-xl md:text-2xl font-black text-white tracking-tight uppercase">{{ t('games.basicInfo') }}</h2>
                    </div>

                    <div v-if="game" class="flex gap-3">
                        <template v-if="!isEditing">
                            <button @click="startEdit" class="btn-primary flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                編輯
                            </button>
                            <button 
                                @click="openDeleteModal" 
                                class="btn-secondary flex items-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                {{ t('games.deleteGame') }}
                            </button>
                        </template>
                        <template v-else>
                            <button @click="cancelEdit" class="px-6 py-2.5 rounded-xl border border-white/10 text-gray-400 font-bold hover:bg-white/5 transition-all" :disabled="isSaving">
                                {{ t('common.cancel') }}
                            </button>
                            <button @click="saveChanges" class="px-8 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2" :disabled="isSaving">
                                <svg v-if="isSaving" class="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
                                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                </svg>
                                {{ isSaving ? t('common.loading') : t('common.save') }}
                            </button>
                        </template>
                    </div>
                </div>
                
                <!-- View Mode: Horizontal Style with Same Layout Structure -->
                <div 
                    v-if="!isEditing" 
                    class="card p-6 md:p-8 bg-gray-800/40 border-white/10 shadow-xl backdrop-blur-sm relative overflow-hidden group transition-all duration-500"
                >
                    <!-- Game Result Watermark -->
                    <div v-if="gameResult" class="absolute -right-4 -bottom-4 z-0 pointer-events-none select-none">
                        <span class="text-[120px] font-black leading-none opacity-20 transform -rotate-12 block" :class="gameResult.watermarkColor">{{ gameResult.text }}</span>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                        <!-- Season -->
                        <div class="flex justify-between items-center py-2 border-b border-white/5">
                            <span class="text-gray-500 font-bold text-base uppercase tracking-wider">{{ t('games.season') }}</span>
                            <span class="text-white font-bold text-lg">{{ gameData.seasonName }}</span>
                        </div>

                        <!-- Field -->
                        <div class="flex justify-between items-center py-2 border-b border-white/5">
                            <span class="text-gray-500 font-bold text-base uppercase tracking-wider">{{ t('games.field') }}</span>
                            <span class="text-white font-bold text-lg">{{ gameData.fieldName || '---' }}</span>
                        </div>

                        <!-- My Team -->
                        <div class="flex justify-between items-center py-2 border-b border-white/5">
                            <span class="text-gray-500 font-bold text-base uppercase tracking-wider">{{ t('games.myTeam') }}</span>
                            <span class="text-white font-bold text-lg">{{ gameData.teamName }}</span>
                        </div>

                        <!-- Opponent Team -->
                        <div class="flex justify-between items-center py-2 border-b border-white/5">
                            <span class="text-gray-500 font-bold text-base uppercase tracking-wider">{{ t('games.opponentTeam') }}</span>
                            <span class="text-white font-bold text-lg">{{ gameData.teamNameEnemy }}</span>
                        </div>

                        <!-- Date & Time Row -->
                        <div class="md:col-span-2">
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <!-- Date -->
                                <div class="flex justify-between items-center py-2 border-b border-white/5">
                                    <span class="text-gray-500 font-bold text-base uppercase tracking-wider">{{ t('games.date') }}</span>
                                    <span class="text-white font-bold text-lg">{{ gameData.gameDate }}</span>
                                </div>

                                <!-- Start Time -->
                                <div class="flex justify-between items-center py-2 border-b border-white/5">
                                    <span class="text-gray-500 font-bold text-base uppercase tracking-wider">{{ t('games.startTime') }}</span>
                                    <span class="text-white font-bold text-lg">{{ gameData.startTime || '---' }}</span>
                                </div>

                                <!-- End Time -->
                                <div class="flex justify-between items-center py-2 border-b border-white/5">
                                    <span class="text-gray-500 font-bold text-base uppercase tracking-wider">{{ t('games.endTime') }}</span>
                                    <span class="text-white font-bold text-lg">{{ gameData.endTime || '---' }}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Home/Away & Scores Row -->
                        <div class="md:col-span-2">
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <!-- Home/Away -->
                                <div class="flex justify-between items-center py-2 border-b border-white/5">
                                    <span class="text-gray-500 font-bold text-base uppercase tracking-wider">{{ t('games.homeAway') }}</span>
                                    <span class="font-bold text-lg" :class="gameData.homeAway === 1 ? 'text-blue-400' : 'text-red-400'">
                                        {{ gameData.homeAway === 1 ? '🗡️ ' + t('games.firstAttack') : '🛡️ ' + t('games.secondAttack') }}
                                    </span>
                                </div>

                                <!-- My Score -->
                                <div class="flex justify-between items-center py-2 border-b border-white/5">
                                    <span class="text-gray-500 font-bold text-base uppercase tracking-wider">{{ t('games.myScore') }}</span>
                                    <span class="text-white font-bold text-xl">{{ gameData.score }}</span>
                                </div>

                                <!-- Opponent Score -->
                                <div class="flex justify-between items-center py-2 border-b border-white/5">
                                    <span class="text-gray-500 font-bold text-base uppercase tracking-wider">{{ t('games.opponentScore') }}</span>
                                    <span class="text-white font-bold text-xl">{{ gameData.enemyScore }}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Memo -->
                    <div class="mt-6 py-2">
                        <span class="text-gray-500 font-bold text-base uppercase tracking-wider block mb-2">{{ t('games.memo') }}</span>
                        <p class="text-gray-300 text-base leading-relaxed whitespace-pre-wrap">{{ gameData.memo || t('common.noData') }}</p>
                    </div>
                </div>

                <!-- Edit Mode: Vertical Form Layout -->
                <div v-else class="card p-6 md:p-8 bg-gray-800/40 border-blue-500/30 shadow-xl backdrop-blur-sm">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <!-- Season -->
                        <div class="space-y-2">
                            <label class="block text-sm font-medium text-gray-400 ml-1">{{ t('games.season') }}</label>
                            <select v-model="editedGameData.Z00_season_id" class="input-field">
                                <option v-for="s in seasons" :key="s.id" :value="s.id">{{ s.name }}</option>
                            </select>
                        </div>

                        <!-- Field -->
                        <div class="space-y-2">
                            <label class="block text-sm font-medium text-gray-400 ml-1">{{ t('games.field') }}</label>
                            <select v-model="editedGameData.Z00_field_id" class="input-field">
                                <option :value="null">---</option>
                                <option v-for="f in fields" :key="f.id" :value="f.id">{{ f.name }}</option>
                            </select>
                        </div>

                        <!-- My Team -->
                        <div class="space-y-2">
                            <label class="block text-sm font-medium text-gray-400 ml-1">{{ t('games.myTeam') }}</label>
                            <select v-model="editedGameData.Z00_team_id" class="input-field">
                                <option v-for="t in myTeams" :key="t.id" :value="t.id">{{ t.name }}</option>
                            </select>
                        </div>

                        <!-- Opponent Team -->
                        <div class="space-y-2">
                            <label class="block text-sm font-medium text-gray-400 ml-1">{{ t('games.opponentTeam') }}</label>
                            <select v-model="editedGameData.Z00_team_id_enemy" class="input-field">
                                <option v-for="t in opponentTeams" :key="t.id" :value="t.id">{{ t.name }}</option>
                            </select>
                        </div>

                        <!-- Date & Time Row -->
                        <div class="md:col-span-2">
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <!-- Date -->
                                <div class="space-y-2">
                                    <label class="block text-sm font-medium text-gray-400 ml-1">{{ t('games.date') }}</label>
                                    <div class="relative">
                                        <input 
                                            type="text" 
                                            v-model="editedGameData.gameDate" 
                                            @focus="showDatePicker = true" 
                                            readonly 
                                            class="input-field cursor-pointer"
                                            :placeholder="t('games.selectStartDate')"
                                        >
                                        <div v-if="showDatePicker" class="absolute left-0 top-full z-50 mt-1 shadow-2xl">
                                            <DatePicker v-model="editedGameData.gameDate" @close="showDatePicker = false" />
                                        </div>
                                        <div v-if="showDatePicker" class="fixed inset-0 z-40" @click="showDatePicker = false"></div>
                                    </div>
                                </div>

                                <!-- Start Time -->
                                <div class="space-y-2">
                                    <label class="block text-sm font-medium text-gray-400 ml-1">{{ t('games.startTime') }}</label>
                                    <div class="relative">
                                        <input 
                                            type="text" 
                                            v-model="editedGameData.startTime" 
                                            @focus="showStartTimePicker = true" 
                                            readonly 
                                            class="input-field cursor-pointer"
                                            :placeholder="t('games.startTime')"
                                        >
                                        <div v-if="showStartTimePicker" class="absolute left-0 top-full z-50 mt-1 shadow-2xl">
                                            <TimePicker v-model="editedGameData.startTime" @close="showStartTimePicker = false" />
                                        </div>
                                        <div v-if="showStartTimePicker" class="fixed inset-0 z-40" @click="showStartTimePicker = false"></div>
                                    </div>
                                </div>

                                <!-- End Time -->
                                <div class="space-y-2">
                                    <label class="block text-sm font-medium text-gray-400 ml-1">{{ t('games.endTime') }}</label>
                                    <div class="relative">
                                        <input 
                                            type="text" 
                                            v-model="editedGameData.endTime" 
                                            @focus="showEndTimePicker = true" 
                                            readonly 
                                            class="input-field cursor-pointer"
                                            :placeholder="t('games.endTime')"
                                        >
                                        <div v-if="showEndTimePicker" class="absolute left-0 top-full z-50 mt-1 shadow-2xl">
                                            <TimePicker v-model="editedGameData.endTime" :default-value="editedGameData.startTime" @close="showEndTimePicker = false" />
                                        </div>
                                        <div v-if="showEndTimePicker" class="fixed inset-0 z-40" @click="showEndTimePicker = false"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Home/Away & Scores Row -->
                        <div class="md:col-span-2">
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <!-- Home/Away Buttons -->
                                <div class="space-y-2">
                                    <label class="block text-sm font-medium text-gray-400 ml-1">{{ t('games.homeAway') }}</label>
                                    <div class="flex gap-2">
                                        <button 
                                            type="button"
                                            @click="editedGameData.homeAway = 1"
                                            class="flex-1 px-4 py-3 rounded-xl border border-white/10 font-bold transition-all duration-300"
                                            :class="editedGameData.homeAway === 1 ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'"
                                        >
                                            🗡️ {{ t('games.firstAttack') }}
                                        </button>
                                        <button 
                                            type="button"
                                            @click="editedGameData.homeAway = 2"
                                            class="flex-1 px-4 py-3 rounded-xl border border-white/10 font-bold transition-all duration-300"
                                            :class="editedGameData.homeAway === 2 ? 'bg-red-600 text-white shadow-lg shadow-red-500/20' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'"
                                        >
                                            🛡️ {{ t('games.secondAttack') }}
                                        </button>
                                    </div>
                                </div>

                                <!-- My Score -->
                                <div class="space-y-2">
                                    <label class="block text-sm font-medium text-gray-400 ml-1">{{ t('games.myScore') }}</label>
                                    <input 
                                        type="number" 
                                        v-model.number="editedGameData.score" 
                                        min="0"
                                        class="input-field"
                                        placeholder="0"
                                    >
                                </div>

                                <!-- Opponent Score -->
                                <div class="space-y-2">
                                    <label class="block text-sm font-medium text-gray-400 ml-1">{{ t('games.opponentScore') }}</label>
                                    <input 
                                        type="number" 
                                        v-model.number="editedGameData.enemyScore" 
                                        min="0"
                                        class="input-field"
                                        placeholder="0"
                                    >
                                </div>
                            </div>
                        </div>

                    </div>

                    <!-- Memo (Full Width) -->
                    <div class="mt-6 space-y-2">
                        <label class="block text-sm font-medium text-gray-400 ml-1">{{ t('games.memo') }}</label>
                        <textarea 
                            v-model="editedGameData.memo" 
                            rows="3" 
                            class="input-field"
                            :placeholder="t('games.memo') + '...'"
                        ></textarea>
                    </div>
                </div>
            </section>

            <!-- Section 2 & 3: Side-by-side on Desktop -->
            <div class="flex flex-col lg:flex-row gap-8">
                <!-- Section 2: Batting Statistics (1/3 width) -->
                <section class="flex-1 lg:flex-[1] space-y-6">
                    <div class="flex items-center gap-3 px-1">
                        <div class="w-1.5 h-6 md:w-2 md:h-8 bg-green-500 rounded-full shadow-[0_0_15px_rgba(34,197,94,0.5)]"></div>
                        <h2 class="text-xl md:text-2xl font-black text-white tracking-tight uppercase">{{ t('batting.title') }}</h2>
                    </div>
                    
                    <div v-if="battingStatistics" class="card overflow-hidden shadow-xl backdrop-blur-sm border-white/10">
                        <div class="overflow-x-auto">
                            <table class="w-full text-left border-collapse">
                                <tbody class="divide-y divide-white/5 bg-gray-800/40">
                                    <!-- Dynamic rows for stats: All 16 fields in requested order -->
                                    <tr v-for="stat in [
                                        { key: 'pa', label: t('batting.PA') },
                                        { key: 'ab', label: t('batting.AB') },
                                        { key: 'rbi', label: t('batting.RBI') },
                                        { key: 'r', label: t('batting.R') },
                                        { key: 'single', label: t('batting.single') },
                                        { key: 'double', label: t('batting.double') },
                                        { key: 'triple', label: t('batting.triple') },
                                        { key: 'hr', label: t('batting.HR') },
                                        { key: 'bb', label: t('batting.BB') },
                                        { key: 'ibb', label: t('batting.IBB') },
                                        { key: 'hbp', label: t('batting.HBP') },
                                        { key: 'so', label: t('batting.SO') },
                                        { key: 'sh', label: t('batting.SH') },
                                        { key: 'sf', label: t('batting.SF') },
                                        { key: 'sb', label: t('batting.SB') },
                                        { key: 'cs', label: t('batting.CS') }
                                    ]" :key="stat.key" class="hover:bg-white/5 transition-colors group">
                                        <td class="px-6 py-3.5 text-sm md:text-base font-bold text-gray-500 group-hover:text-gray-300 transition-colors uppercase tracking-[0.05em]">
                                            {{ stat.label }}
                                        </td>
                                        <td class="px-6 py-3.5 text-right">
                                            <span class="text-lg md:text-xl font-black font-mono text-gray-200">
                                                {{ battingStatistics[stat.key.toUpperCase()] || battingStatistics[stat.key] || 0 }}
                                            </span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <div v-else class="card p-12 text-center text-gray-600 italic bg-gray-800/20 border-dashed border-white/5">
                        {{ t('common.noData') }}
                    </div>
                </section>

                <!-- Section 3: Plate Appearance History (2/3 width) -->
                <section class="flex-1 lg:flex-[2] space-y-4">
                    <div class="flex items-center gap-3 px-1">
                        <div class="w-1.5 h-6 md:w-2 md:h-8 bg-purple-500 rounded-full shadow-[0_0_15px_rgba(168,85,247,0.5)]"></div>
                        <h2 class="text-xl md:text-2xl font-black text-white tracking-tight uppercase">{{ t('batting.history') }}</h2>
                    </div>
                    
                    <!-- View Mode -->
                    <div v-if="batterResult && batterResult.length > 0" class="card overflow-hidden border-white/10 shadow-xl backdrop-blur-sm">
                        <div class="overflow-x-auto">
                            <table class="w-full text-left border-collapse">
                                <thead>
                                    <tr class="bg-gray-900 border-b border-white/10 uppercase text-xs md:text-sm tracking-[0.1em] text-gray-500 font-bold">
                                        <th class="px-3 md:px-6 py-4 md:py-5 text-center text-gray-400 text-nowrap">{{ t('games.pa') }}</th>
                                        <th class="px-2 md:px-6 py-4 md:py-5 text-gray-400 w-36 max-w-[10rem] text-nowrap">{{ t('batting.pitcher') }}</th>
                                        <th class="px-3 md:px-6 py-4 md:py-5 text-gray-400 w-auto min-w-[8rem] text-nowrap">{{ t('batting.matchupResult') }}</th>
                                        <th class="px-3 md:px-6 py-4 md:py-5 text-center text-gray-400 text-nowrap">{{ t('batting.RBI') }}</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-white/5 bg-gray-800/40">
                                    <tr v-for="(pa, index) in batterResult" :key="pa.id || index" class="hover:bg-white/5 transition-all group duration-200">
                                        <td class="px-3 md:px-6 py-4 text-center relative">
                                            <!-- RISP Indicator (Minimalist) -->
                                            <div v-if="Number(pa.RISP) === 1" class="absolute left-0 top-1/4 bottom-1/4 w-0.5 bg-red-800"></div>
                                            <span class="text-sm md:text-base font-black text-gray-600">{{ index + 1 }}</span>
                                        </td>
                                        <td class="px-3 md:px-6 py-4 text-sm md:text-base text-gray-300 font-bold tracking-tight truncate max-w-[8rem]" :title="pa.pitcher">
                                            {{ pa.pitcher || '---' }}
                                        </td>
                                        <td class="px-3 md:px-6 py-4">
                                            <span class="text-sm md:text-base font-black tracking-wide text-gray-200">
                                                {{ pa.displayName }}
                                            </span>
                                        </td>
                                        <td class="px-3 md:px-6 py-4 text-center">
                                            <span class="text-sm md:text-base font-black font-mono text-gray-200" v-if="pa.RBI > 0">
                                                {{ pa.RBI }}
                                            </span>
                                            <span v-else class="text-gray-700 font-black">-</span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <!-- Empty State (View Mode) -->
                    <div v-else class="card p-12 text-center text-gray-600 italic bg-gray-800/20 border-dashed border-white/5">
                        {{ t('common.noData') }}
                    </div>
                </section>
            </div>
        </div>
        
        <!-- Floating Edit Batting Data Button -->
        <button 
            v-if="!isLoading"
            @click="openBattingDataModal"
            class="fixed bottom-24 right-6 md:bottom-24 md:right-[10%] z-40 px-6 py-4 rounded-full bg-green-600 hover:bg-green-500 text-white font-bold transition-all shadow-[0_0_20px_rgba(34,197,94,0.4)] hover:shadow-[0_0_30px_rgba(34,197,94,0.6)] hover:scale-105 flex items-center gap-3 active:scale-95 border border-white/10 backdrop-blur-sm"
        >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span class="text-base tracking-wide">{{ t('batting.editTitle') }}</span>
        </button>

        <!-- Batting Data Modal -->
        <BattingDataModal 
            :is-open="showBattingDataModal"
            :game-id="gameData?.id"
            :batting-stats="battingStatistics || {}"
            :batting-results="battingResults"
            @close="closeBattingDataModal"
            @saved="handleBattingDataSaved"
        />

        <!-- Delete Confirmation Modal -->
        <QuickAddModal 
            :is-open="showDeleteModal"
            :title="t('games.deleteGame')"
            :label="t('common.deleteConfirm')"
            mode="confirm"
            confirm-button-class="btn-secondary"
            :confirm-text="t('common.delete')"
            :is-loading="isLoading"
            @close="showDeleteModal = false"
            @confirm="confirmDelete"
        />
    </div>
</template>
