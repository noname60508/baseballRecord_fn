<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import battingService from '@/services/battingService';

const route = useRoute();
const { t } = useI18n();

const records = ref([]);
const isLoading = ref(true);
const isNew = route.query.new === 'true';

const fetchRecords = async () => {
  try {
    const response = await battingService.getBattingRecords();
    records.value = response.data;
  } catch (error) {
    console.error('Failed to fetch batting records:', error);
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchRecords();
});
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <h1 class="page-title !mb-0">
        <span class="text-yellow-500">📊</span>
        {{ t('batting.title') }} - {{ t('nav.battingRecords') }}
      </h1>
    </div>

    <div v-if="isNew" class="animate-fade-in bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-xl relative flex items-center gap-3" role="alert">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <div>
        <strong class="font-bold">新增成功！</strong>
        <span class="block sm:inline ml-1">比賽紀錄已建立，您可以在此檢視打擊成績。</span>
      </div>
    </div>

    <div v-if="isLoading" class="flex flex-col items-center justify-center py-20 space-y-4">
      <div class="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
      <p class="text-gray-400 font-medium animate-pulse">{{ t('common.loading') }}</p>
    </div>

    <div v-else-if="records.length === 0" class="flex flex-col items-center justify-center py-20 bg-gray-800/30 rounded-2xl border border-white/5 border-dashed">
      <div class="text-6xl mb-4 opacity-50">📝</div>
      <p class="text-gray-400 text-lg font-medium">{{ t('common.noData') }}</p>
    </div>

    <div v-else class="table-container">
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
</template>
