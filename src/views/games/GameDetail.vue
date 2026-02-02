<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import gameService from '@/services/gameService';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const game = ref(null);
const isLoading = ref(true);

const fetchGameDetails = async () => {
    try {
        const response = await gameService.getGame(route.params.id);
        game.value = response.data.result;
    } catch (error) {
        console.error('Failed to fetch game details:', error);
    } finally {
        isLoading.value = false;
    }
};

const getResultBadgeColor = (result) => {
  switch (Number(result)) {
    case 1: return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 2: return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 3: return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
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
};

const formatBattingSummary = (batterResult) => {
    if (!batterResult) return '';
    const r = batterResult;
    const hits = (Number(r.single) || 0) + (Number(r.double) || 0) + (Number(r.triple) || 0) + (Number(r.hr) || 0);
    let text = `AB ${r.at_bats || 0} - ${hits} (${r.single || 0},${r.double || 0},${r.triple || 0},${r.hr || 0})`;
    
    if (Number(r.hr) > 0) text += `, ${r.hr}全壘打`;
    if (Number(r.bb) > 0) text += `, ${r.bb}四壞`;
    if (Number(r.hbp) > 0) text += `, ${r.hbp}觸身球`;
    
    return text;
};

onMounted(() => {
    fetchGameDetails();
});
</script>

<template>
    <div class="max-w-4xl mx-auto space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between mb-8">
            <div class="flex items-center">
                <button @click="router.push('/games')" class="p-2 mr-4 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                </button>
                <h1 class="text-3xl font-bold text-white tracking-tight">比賽詳情</h1>
            </div>
            <div v-if="game" class="flex gap-3">
                <router-link :to="`/games/${game.id}/edit`" class="btn-secondary flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    編輯
                </router-link>
            </div>
        </div>

        <div v-if="isLoading" class="flex flex-col items-center justify-center py-20 space-y-4">
            <div class="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
            <p class="text-gray-400 font-medium animate-pulse">{{ t('common.loading') }}</p>
        </div>

        <div v-else-if="!game" class="card text-center py-20 text-gray-400">
            找不到該比賽紀錄
        </div>

        <div v-else class="space-y-6">
            <!-- Summary card -->
            <div class="card relative overflow-hidden">
                <div class="absolute top-0 right-0 px-6 py-2 bg-gray-800/90 rounded-bl-2xl text-lg font-black tracking-widest backdrop-blur-sm z-20 border-b border-l border-white/10" :class="getResultBadgeColor(game.gameResult)">
                    {{ getResultText(game.gameResult) }}
                </div>
                
                <div class="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12 p-4">
                    <div class="text-center flex-1">
                        <div class="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">
                            {{ game.homeAway === 1 ? '我方' : '對方' }} (先攻)
                        </div>
                        <div class="font-bold text-6xl text-white mb-2 font-mono">
                            {{ game.homeAway === 1 ? game.score : game.enemyScore }}
                        </div>
                        <div class="text-lg text-gray-300 font-bold">
                            {{ game.homeAway === 1 ? game.teamName : game.teamNameEnemy }}
                        </div>
                    </div>

                    <div class="text-gray-600 font-black text-4xl italic opacity-30 select-none">VS</div>

                    <div class="text-center flex-1">
                        <div class="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">
                            {{ game.homeAway === 1 ? '對方' : '我方' }} (後攻)
                        </div>
                        <div class="font-bold text-6xl text-white mb-2 font-mono">
                            {{ game.homeAway === 1 ? game.enemyScore : game.score }}
                        </div>
                        <div class="text-lg text-gray-300 font-bold">
                            {{ game.homeAway === 1 ? game.teamNameEnemy : game.teamName }}
                        </div>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Info Section -->
                <div class="card space-y-6">
                    <h3 class="text-xl font-bold text-white border-b border-white/5 pb-3">基本資訊</h3>
                    <div class="space-y-4">
                        <div class="flex justify-between items-center group">
                            <span class="text-gray-500">賽季</span>
                            <span class="text-white font-medium">{{ game.seasonName }}</span>
                        </div>
                        <div class="flex justify-between items-center group">
                            <span class="text-gray-500">日期</span>
                            <span class="text-white font-medium">{{ game.gameDate }}</span>
                        </div>
                        <div v-if="game.startTime" class="flex justify-between items-center group">
                            <span class="text-gray-500">開始時間</span>
                            <span class="text-white font-medium">{{ game.startTime }}</span>
                        </div>
                        <div v-if="game.endTime" class="flex justify-between items-center group">
                            <span class="text-gray-500">結束時間</span>
                            <span class="text-white font-medium">{{ game.endTime }}</span>
                        </div>
                        <div class="flex justify-between items-center group">
                            <span class="text-gray-500">場地</span>
                            <span class="text-white font-medium">{{ game.fieldName }}</span>
                        </div>
                    </div>
                </div>

                <!-- Batting Result -->
                <div class="card space-y-6">
                    <h3 class="text-xl font-bold text-white border-b border-white/5 pb-3">打擊表現</h3>
                    <div v-if="game.batterResult" class="space-y-4">
                        <div class="p-4 bg-gray-900/50 rounded-xl border border-white/5">
                            <div class="text-sm text-blue-400 font-bold mb-3">總結</div>
                            <div class="text-lg text-white font-mono tracking-wide">
                                {{ formatBattingSummary(game.batterResult) }}
                            </div>
                        </div>
                        
                        <div class="grid grid-cols-2 gap-4">
                            <div class="p-3 bg-gray-900/30 rounded-lg border border-white/5 text-center">
                                <div class="text-xs text-gray-500 mb-1">打數</div>
                                <div class="text-xl font-bold text-white font-mono">{{ game.batterResult.at_bats }}</div>
                            </div>
                            <div class="p-3 bg-gray-900/30 rounded-lg border border-white/5 text-center">
                                <div class="text-xs text-gray-500 mb-1">安打</div>
                                <div class="text-xl font-bold text-white font-mono">
                                    {{ (Number(game.batterResult.single)||0) + (Number(game.batterResult.double)||0) + (Number(game.batterResult.triple)||0) + (Number(game.batterResult.hr)||0) }}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div v-else class="flex flex-col items-center justify-center h-full py-10 opacity-50">
                        <div class="text-4xl mb-2">⚖️</div>
                        <div class="text-gray-500">無打擊數據</div>
                    </div>
                </div>
            </div>

            <!-- Memo Section -->
            <div v-if="game.memo" class="card">
                <h3 class="text-xl font-bold text-white border-b border-white/5 pb-3 mb-4">備註</h3>
                <p class="text-gray-400 whitespace-pre-wrap leading-relaxed">{{ game.memo }}</p>
            </div>
        </div>
    </div>
</template>
