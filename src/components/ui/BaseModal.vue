<script setup>
import { defineProps, defineEmits } from 'vue';

defineProps({
  isOpen: Boolean,
  title: String
});

const emit = defineEmits(['close']);
</script>

<template>
  <Teleport to="body">
    <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        
        <!-- Backdrop -->
        <div 
          class="fixed inset-0 bg-gray-900/80 backdrop-blur-sm transition-opacity enter-from-opacity-0 enter-to-opacity-100 leave-from-opacity-100 leave-to-opacity-0" 
          aria-hidden="true" 
          @click="emit('close')"
        ></div>

        <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <!-- Modal Panel -->
        <div class="inline-block align-bottom bg-gray-900 border border-white/10 rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full animate-scale-in will-change-transform">
          
          <!-- Header -->
          <div v-if="title" class="bg-gray-800/50 px-6 py-4 border-b border-white/5 flex justify-between items-center">
            <h3 class="text-xl font-bold text-white" id="modal-title">
              {{ title }}
            </h3>
            <button @click="emit('close')" class="text-gray-400 hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Content -->
          <div class="px-6 py-6">
            <slot></slot>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
