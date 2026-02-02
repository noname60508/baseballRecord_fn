<script setup>
import { ref, onMounted, watch } from 'vue';

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['update:modelValue', 'close']);

const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

const selectedHour = ref('12');
const selectedMinute = ref('00');

// Initialize from modelValue
watch(() => props.modelValue, (newVal) => {
    if (newVal && newVal.includes(':')) {
        const [h, m] = newVal.split(':');
        selectedHour.value = h;
        // Find closest minute in our list or just set it
        selectedMinute.value = m;
    }
}, { immediate: true });

const selectHour = (h) => {
    selectedHour.value = h;
    updateValue();
};

const selectMinute = (m) => {
    selectedMinute.value = m;
    updateValue();
};

const updateValue = () => {
    const newVal = `${selectedHour.value}:${selectedMinute.value}`;
    emit('update:modelValue', newVal);
};

const handleConfirm = () => {
    updateValue();
    emit('close');
};
</script>

<template>
  <div class="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl p-4 w-64 user-select-none" @click.stop>
    <div class="flex gap-4 mb-4">
        <!-- Hours Column -->
        <div class="flex-1">
            <div class="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 text-center">時</div>
            <div class="h-48 overflow-y-auto custom-scrollbar pr-1">
                <div class="grid grid-cols-1 gap-1">
                    <button 
                        v-for="h in hours" 
                        :key="h"
                        type="button"
                        @click="selectHour(h)"
                        class="px-2 py-1.5 rounded-lg text-sm transition-all text-center"
                        :class="selectedHour === h ? 'bg-blue-600 text-white font-bold' : 'text-gray-400 hover:bg-gray-700 hover:text-white'"
                    >
                        {{ h }}
                    </button>
                </div>
            </div>
        </div>

        <!-- Minutes Column -->
        <div class="flex-1">
            <div class="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 text-center">分</div>
            <div class="h-48 overflow-y-auto custom-scrollbar pr-1">
                <div class="grid grid-cols-1 gap-1">
                    <button 
                        v-for="m in minutes" 
                        :key="m"
                        type="button"
                        @click="selectMinute(m)"
                        class="px-2 py-1.5 rounded-lg text-sm transition-all text-center"
                        :class="selectedMinute === m ? 'bg-blue-600 text-white font-bold' : 'text-gray-400 hover:bg-gray-700 hover:text-white'"
                    >
                        {{ m }}
                    </button>
                    <!-- Add more specific minutes if needed, but 5m interval is clean -->
                </div>
            </div>
        </div>
    </div>

    <button 
        type="button"
        @click="handleConfirm"
        class="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold transition-colors shadow-lg shadow-blue-900/20"
    >
        確定
    </button>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #374151;
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #4b5563;
}
</style>
