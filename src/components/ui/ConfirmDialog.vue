<script setup>
import { useConfirm } from '@/composables/useConfirm';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const { isVisible, message, title, handleConfirm, handleCancel } = useConfirm();
</script>

<template>
  <Teleport to="body">
    <Transition 
      enter-active-class="ease-out duration-300" 
      enter-from-class="opacity-0" 
      enter-to-class="opacity-100" 
      leave-active-class="ease-in duration-200" 
      leave-from-class="opacity-100" 
      leave-to-class="opacity-0"
    >
      <div v-if="isVisible" class="fixed inset-0 z-[10000] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <!-- Backdrop -->
        <div class="fixed inset-0 bg-gray-900/75 backdrop-blur-sm transition-opacity" @click="handleCancel"></div>

        <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <Transition 
            enter-active-class="ease-out duration-300" 
            enter-from-class="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95" 
            enter-to-class="opacity-100 translate-y-0 sm:scale-100" 
            leave-active-class="ease-in duration-200" 
            leave-from-class="opacity-100 translate-y-0 sm:scale-100" 
            leave-to-class="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <div class="relative transform overflow-hidden rounded-lg bg-gray-800 border border-gray-700 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-sm">
                
              <div class="bg-gray-800 px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                <div class="sm:flex sm:items-start">
                  <div class="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-900/20 sm:mx-0 sm:h-10 sm:w-10">
                    <svg class="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                  </div>
                  <div class="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                    <h3 class="text-base font-semibold leading-6 text-white" id="modal-title">{{ title }}</h3>
                    <div class="mt-2">
                      <p class="text-sm text-gray-300">{{ message }}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div class="bg-gray-800/50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 gap-2">
                <button 
                  type="button" 
                  class="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:w-auto transition-colors focus:ring-2 focus:ring-red-500 focus:outline-none" 
                  @click="handleConfirm"
                >
                  {{ t('common.confirm') || '確認' }}
                </button>
                <button 
                  type="button" 
                  class="mt-3 inline-flex w-full justify-center rounded-md bg-gray-700 px-3 py-2 text-sm font-semibold text-gray-300 shadow-sm ring-1 ring-inset ring-gray-600 hover:bg-gray-600 sm:mt-0 sm:w-auto transition-colors" 
                  @click="handleCancel"
                >
                  {{ t('common.cancel') || '取消' }}
                </button>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
