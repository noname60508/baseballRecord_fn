<script setup>
import AppHeader from './components/AppHeader.vue';
import ToastContainer from '@/components/ui/ToastContainer.vue';
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue';
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <AppHeader />
    
    <main class="flex-grow container mx-auto px-4 py-8 md:py-12 max-w-7xl animate-fade-in">
      <router-view></router-view>
    </main>
    
    <footer class="mt-auto border-t border-white/5 bg-gray-900/50 backdrop-blur-sm py-8 text-center">
      <p class="text-gray-500 text-sm font-medium">&copy; {{ new Date().getFullYear() }} Baseball Record System</p>
    </footer>

    <ToastContainer />
    <ConfirmDialog />
  </div>
</template>

<style>
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in {
  animation: fadeIn 0.5s ease-out forwards;
}
</style>
