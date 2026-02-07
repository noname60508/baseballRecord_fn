<script setup>
import { useToast } from '@/composables/useToast';

const { toasts, removeToast } = useToast();
</script>

<template>
  <div class="fixed top-20 left-1/2 -translate-x-1/2 z-[99999] flex flex-col gap-2 pointer-events-none items-center w-full">
    <TransitionGroup 
      enter-active-class="transform ease-out duration-300 transition" 
      enter-from-class="-translate-y-5 opacity-0" 
      enter-to-class="translate-y-0 opacity-100" 
      leave-active-class="transition ease-in duration-200" 
      leave-from-class="opacity-100" 
      leave-to-class="opacity-0 -translate-y-5"
    >
      <div 
        v-for="toast in toasts" 
        :key="toast.id" 
        class="pointer-events-auto inline-flex items-center w-auto max-w-[90vw] overflow-hidden rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 backdrop-blur-md will-change-transform"
        :class="{
          'bg-green-500/10 border border-green-500/20 text-green-400': toast.type === 'success',
          'bg-red-500/10 border border-red-500/20 text-red-400': toast.type === 'error',
          'bg-blue-500/10 border border-blue-500/20 text-blue-400': toast.type === 'info',
          'bg-gray-800': !['success', 'error', 'info'].includes(toast.type)
        }"
      >
        <div class="px-4 py-3 flex items-center gap-3">
          <!-- Success Icon -->
          <svg v-if="toast.type === 'success'" class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <!-- Error Icon -->
          <svg v-else-if="toast.type === 'error'" class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <!-- Info Icon -->
          <svg v-else class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>

          <div class="flex-1 whitespace-nowrap">
            <p class="text-sm font-medium">{{ toast.message }}</p>
          </div>

          <button @click="removeToast(toast.id)" class="ml-2 inline-flex shrink-0 rounded-md p-1 focus:outline-none focus:ring-2 focus:ring-offset-2 opacity-60 hover:opacity-100 transition-opacity" :class="{
             'text-green-500 hover:bg-green-500/20 focus:ring-green-500': toast.type === 'success',
             'text-red-500 hover:bg-red-500/20 focus:ring-red-500': toast.type === 'error',
             'text-blue-500 hover:bg-blue-500/20 focus:ring-blue-500': toast.type === 'info'
          }">
            <span class="sr-only">Close</span>
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>
