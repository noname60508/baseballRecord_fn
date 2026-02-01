<script setup>
import { computed } from 'vue';
import { useLanguageStore } from '@/stores/language';
import { useI18n } from 'vue-i18n';

const languageStore = useLanguageStore();
const { locale } = useI18n();

const currentLanguage = computed({
  get: () => languageStore.currentLanguage,
  set: (value) => {
    languageStore.setLanguage(value);
    locale.value = value;
  }
});
</script>

<template>
  <div class="relative group">
    <div class="absolute inset-0 bg-blue-500/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    <select 
      v-model="currentLanguage" 
      class="relative bg-gray-800/80 border border-white/10 text-gray-300 text-sm rounded-lg px-3 py-1.5 
      focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 
      cursor-pointer hover:bg-gray-700/80 hover:text-white transition-all appearance-none pr-8"
      style="background-image: url(&quot;data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e&quot;); background-position: right 0.2rem center; background-repeat: no-repeat; background-size: 1.5em 1.5em;"
    >
      <option value="zh-TW" class="bg-gray-800">繁體中文</option>
      <option value="ja" class="bg-gray-800">日本語</option>
    </select>
  </div>
</template>
