<script setup>
import { ref, onMounted, watch } from 'vue';

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  defaultValue: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['update:modelValue', 'close']);

const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

const selectedHour = ref('00');
const selectedMinute = ref('00');

// Refs for scrolling
const hoursContainer = ref(null);
const minutesContainer = ref(null);

const scrollToSelected = () => {
    // Wait for DOM update
    setTimeout(() => {
        if (hoursContainer.value) {
            const activeHour = hoursContainer.value.querySelector('.bg-blue-600');
            if (activeHour) {
                hoursContainer.value.scrollTop = activeHour.offsetTop - hoursContainer.value.offsetTop - 60; // Center it roughly
            }
        }
        if (minutesContainer.value) {
            const activeMinute = minutesContainer.value.querySelector('.bg-blue-600');
            if (activeMinute) {
                minutesContainer.value.scrollTop = activeMinute.offsetTop - minutesContainer.value.offsetTop - 60;
            }
        }
    }, 0);
};

// Initialize from modelValue or defaultValue
watch(() => [props.modelValue, props.defaultValue], ([newModel, newDefault]) => {
    let timeToSet = newModel;
    if (!timeToSet && newDefault) {
        timeToSet = newDefault;
    }

    if (timeToSet && timeToSet.includes(':')) {
        const [h, m] = timeToSet.split(':');
        selectedHour.value = h;
        // Find closest minute in our list or just set it
        selectedMinute.value = m;
    }
    
    // Scroll to selected on open/change
    scrollToSelected();
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
            <div ref="hoursContainer" class="h-48 overflow-y-auto custom-scrollbar pr-1 relative">
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
            <div ref="minutesContainer" class="h-48 overflow-y-auto custom-scrollbar pr-1 relative">
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
        {{ t('common.confirm') }}
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
