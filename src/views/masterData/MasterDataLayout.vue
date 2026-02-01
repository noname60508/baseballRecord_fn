<script setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import TeamsCRUD from './TeamsCRUD.vue';
import SeasonsCRUD from './SeasonsCRUD.vue';
import FieldsCRUD from './FieldsCRUD.vue';

const { t } = useI18n();
const activeTab = ref('teams');

const tabs = [
  { id: 'teams', label: 'masterData.teams', component: TeamsCRUD },
  { id: 'seasons', label: 'masterData.seasons', component: SeasonsCRUD },
  { id: 'fields', label: 'masterData.fields', component: FieldsCRUD }
];
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-8">
    <h1 class="page-title !mb-0 flex items-center gap-3">
      <span class="text-indigo-500 text-3xl">🗂️</span>
      <span class="mt-1">{{ t('masterData.title') }}</span>
    </h1>

    <div class="card min-h-[600px] flex flex-col !p-0 overflow-hidden">
      <!-- Tab Headers -->
      <div class="flex border-b border-white/10 bg-gray-900/50">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          class="flex-1 py-4 px-1 text-center font-medium text-sm transition-all duration-200 relative"
          :class="[
            activeTab === tab.id
              ? 'text-blue-400 bg-white/5'
              : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
          ]"
        >
          {{ t(tab.label) }}
          <div 
            class="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 transition-transform duration-300 transform scale-x-0"
            :class="{ 'scale-x-100': activeTab === tab.id }"
          ></div>
        </button>
      </div>

      <!-- Tab Content -->
      <div class="p-6 flex-grow bg-gray-800/20">
        <transition name="fade" mode="out-in">
          <component :is="tabs.find(t => t.id === activeTab).component" />
        </transition>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
