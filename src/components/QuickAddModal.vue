<script setup>
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps({
  isOpen: Boolean,
  title: String,
  label: String,
  isLoading: Boolean,
  mode: {
    type: String,
    default: 'input', // 'input' | 'confirm'
    validator: (value) => ['input', 'confirm'].includes(value)
  },
  confirmText: {
    type: String,
    default: ''
  },
  confirmButtonClass: {
    type: String,
    default: 'btn-primary'
  }
});

const emit = defineEmits(['close', 'confirm']);
const { t } = useI18n();
const inputValue = ref('');

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    inputValue.value = '';
  }
});

const close = () => {
  inputValue.value = '';
  emit('close');
};

const confirm = () => {
  if (props.mode === 'input' && !inputValue.value.trim()) {
    return;
  }
  emit('confirm', inputValue.value);
  if (props.mode === 'input') {
    inputValue.value = '';
  }
};
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
    <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
      
      <!-- Backdrop -->
      <div 
        class="fixed inset-0 bg-gray-900/80 backdrop-blur-sm transition-opacity" 
        aria-hidden="true" 
        @click="close"
      ></div>

      <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

      <!-- Modal Panel -->
      <div class="inline-block align-bottom bg-gray-800 rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-white/10">
        
        <!-- Header -->
        <div class="bg-gradient-to-r from-gray-800 to-gray-700 px-6 py-4 border-b border-white/5">
          <h3 class="text-lg leading-6 font-bold text-white flex items-center gap-2" id="modal-title">
            <span v-if="mode === 'input'" class="text-blue-500">✨</span>
            <span v-else class="text-red-500">⚠️</span>
            {{ title }}
          </h3>
        </div>

        <div class="px-6 py-6">
          <div class="mt-2">
            <label v-if="label" class="block text-base text-gray-300 mb-2 ml-1" :class="{'font-medium text-gray-400 text-sm': mode === 'input'}">
              {{ label }}
            </label>
            
            <input 
              v-if="mode === 'input'"
              v-model="inputValue"
              type="text" 
              class="input-field"
              :class="{'opacity-50 cursor-not-allowed': isLoading}"
              @keyup.enter="confirm"
              :disabled="isLoading"
              autofocus
              :placeholder="t('common.enterNamePlaceholder')"
            >
          </div>
        </div>

        <!-- Footer -->
        <div class="bg-gray-900/50 px-6 py-4 flex flex-row-reverse gap-3 border-t border-white/5">
          <button 
            type="button" 
            :class="[confirmButtonClass, 'w-full sm:w-auto']"
            @click="confirm"
            :disabled="isLoading"
          >
             <svg v-if="isLoading" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            {{ isLoading ? t('common.loading') : (confirmText || t('common.confirm')) }}
          </button>
          <button 
            type="button" 
            class="btn-ghost w-full sm:w-auto"
            @click="close"
            :disabled="isLoading"
          >
            {{ t('common.cancel') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
