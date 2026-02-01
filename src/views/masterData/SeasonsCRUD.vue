<script setup>
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import masterDataService from '@/services/masterDataService';
import { useConfirm } from '@/composables/useConfirm';

const { t } = useI18n();
const { showConfirm } = useConfirm();

const items = ref([]);
const isLoading = ref(true);
const editId = ref(null);
const newItemName = ref('');
const editItemName = ref('');
const searchQuery = ref('');
const showCreateModal = ref(false);

const filteredItems = computed(() => {
    let result = items.value;
    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        result = result.filter(item => 
            item.name.toLowerCase().includes(query)
        );
    }
    return result;
});

const fetchItems = async () => {
  isLoading.value = true;
  try {
    const response = await masterDataService.seasons.getAll();
    items.value = response.data.result;
  } catch (error) {
    console.error('Failed to fetch seasons:', error);
  } finally {
    isLoading.value = false;
  }
};

const handleCreate = async () => {
  if (!newItemName.value.trim()) return;
  try {
    await masterDataService.seasons.create({ name: newItemName.value });
    newItemName.value = '';
    showCreateModal.value = false;
    await fetchItems();
  } catch (error) {
    console.error('Failed to create season:', error);
  }
};

const startEdit = (item) => {
  editId.value = item.id;
  editItemName.value = item.name;
};

const cancelEdit = () => {
  editId.value = null;
  editItemName.value = '';
};

const handleUpdate = async () => {
  if (!editItemName.value.trim()) return;
  try {
    await masterDataService.seasons.update(editId.value, { name: editItemName.value });
    cancelEdit();
    await fetchItems();
  } catch (error) {
    console.error('Failed to update season:', error);
  }
};

const handleDelete = async (id) => {
  const confirmed = await showConfirm('確定要刪除此賽季嗎？', '刪除賽季');
  if (!confirmed) return;
  
  try {
    await masterDataService.seasons.delete(id);
    await fetchItems();
  } catch (error) {
    console.error('Failed to delete season:', error);
  }
};

onMounted(() => {
  fetchItems();
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header Actions -->
    <!-- Header Actions -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <!-- Search -->
        <div class="flex gap-4 items-center w-full md:w-auto">
          <div class="flex gap-2 items-center w-full md:w-auto">
            <div class="relative w-full md:w-auto">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
                    </svg>
                </div>
                <input 
                    v-model="searchQuery"
                    type="text" 
                    class="input-field pl-10 w-full md:w-64"
                    style="padding-left: 2.5rem;"
                    :placeholder="t('common.search')"
                >
            </div>
          </div>
        </div>

        <!-- Right Side: Add Button -->
        <div class="flex items-center gap-2 w-full md:w-auto">
            <button 
                @click="showCreateModal = true"
                class="btn-primary w-full md:w-auto flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transform hover:-translate-y-0.5 transition-all duration-300"
            >
                 <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
                </svg>
                {{ t('masterData.addSeason') }}
            </button>
        </div>
    </div>

    <!-- Create Modal -->
    <Teleport to="body">
        <div v-if="showCreateModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div class="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl scale-100 animate-scale-in">
                <h3 class="text-xl font-bold text-white mb-6">{{ t('masterData.addSeason') }}</h3>
                <div class="space-y-4">
                    <div class="space-y-2">
                        <label class="text-sm text-gray-400 font-medium">{{ t('masterData.name') }}</label>
                        <input 
                            v-model="newItemName"
                            type="text" 
                            class="input-field w-full"
                            :placeholder="t('masterData.addSeason')"
                            @keyup.enter="handleCreate"
                            autofocus
                        >
                    </div>
                </div>
                <div class="flex justify-end gap-3 mt-8">
                    <button @click="showCreateModal = false" class="btn-ghost">
                        {{ t('common.cancel') }}
                    </button>
                    <button @click="handleCreate" class="btn-primary">
                        {{ t('common.save') }}
                    </button>
                </div>
            </div>
        </div>
    </Teleport>

    <!-- List -->
    <div v-if="isLoading" class="flex justify-center py-10">
      <div class="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>

    <div v-else-if="items.length === 0" class="text-center py-10 border border-dashed border-white/10 rounded-xl bg-gray-900/30">
      <p class="text-gray-500">{{ t('common.noData') }}</p>
    </div>

    <div v-else class="table-container overflow-x-auto">
      <table class="min-w-[340px] md:min-w-full divide-y divide-gray-700/50 table-fixed">
        <thead>
          <tr>
            <th class="table-header text-left px-2 md:px-4 py-2">{{ t('masterData.name') }}</th>
            <th class="table-header text-right w-24 md:w-40 px-2 md:px-4 py-2"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-700/50 bg-gray-800/40">
          <tr v-for="item in filteredItems" :key="item.id" class="table-row h-12">
            <td class="table-cell font-medium text-white px-2 md:px-4 py-2">
              <span v-if="editId != item.id" class="block truncate max-w-[200px] md:max-w-none">{{ item.name }}</span>
              <input 
                  v-else
                  v-model="editItemName"
                  type="text" 
                  class="input-field py-1 w-full"
                  @keyup.enter="handleUpdate"
                  autofocus
                  @click.stop
              >
            </td>
            <td class="table-cell text-right w-24 md:w-40 px-2 md:px-4 py-2">
              <div class="flex justify-end gap-2">
                <template v-if="editId !== item.id">
                    <button @click.stop="startEdit(item)" class="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors" title="編輯">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                    </button>
                    <button @click.stop="handleDelete(item.id)" class="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="刪除">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                        </svg>
                    </button>
                </template>
                <template v-else>
                    <button @click.stop="cancelEdit" class="p-1 bg-gray-700/50 text-gray-400 rounded-lg hover:bg-gray-700 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                        </svg>
                    </button>
                    <button @click.stop="handleUpdate" class="p-1 bg-green-500/10 text-green-400 rounded-lg hover:bg-green-500/20 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                        </svg>
                    </button>
                </template>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
