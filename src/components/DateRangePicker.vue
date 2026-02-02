<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [null, null]
  }
});

const emit = defineEmits(['update:modelValue', 'close']);

// Date Utils
const daysOfWeek = ['日', '一', '二', '三', '四', '五', '六'];
const today = new Date();
const currentYear = ref(today.getFullYear());
const currentMonth = ref(today.getMonth()); // 0-11

const startDate = ref(props.modelValue[0] ? new Date(props.modelValue[0]) : null);
const endDate = ref(props.modelValue[1] ? new Date(props.modelValue[1]) : null);
const hoverDate = ref(null);

// Sync props to internal state if props change externally
watch(() => props.modelValue, (newVal) => {
    startDate.value = newVal[0] ? new Date(newVal[0]) : null;
    endDate.value = newVal[1] ? new Date(newVal[1]) : null;
});

const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

const currentMonthDays = computed(() => {
  const daysInMonth = getDaysInMonth(currentYear.value, currentMonth.value);
  const firstDay = getFirstDayOfMonth(currentYear.value, currentMonth.value);
  
  const days = [];
  
  // Empty slots for previous month
  for (let i = 0; i < firstDay; i++) {
    days.push({ day: '', date: null, isCurrentMonth: false });
  }
  
  // Days of current month
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(currentYear.value, currentMonth.value, i);
    days.push({ day: i, date: date, isCurrentMonth: true });
  }
  
  return days;
});

const formatDateStr = (date) => {
    if (!date) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

const isSelected = (date) => {
    if (!date) return false;
    const dStr = date.toDateString();
    return dStr === startDate.value?.toDateString() || dStr === endDate.value?.toDateString();
};

const isInRange = (date) => {
    if (!date || !startDate.value) return false;
    
    // Static range (both selected)
    if (endDate.value) {
        return date > startDate.value && date < endDate.value;
    }
    
    // Dynamic range (hovering)
    if (hoverDate.value) {
        if (hoverDate.value > startDate.value) {
             return date > startDate.value && date < hoverDate.value;
        } else {
             return date < startDate.value && date > hoverDate.value;
        }
    }
    
    return false;
};

const handleMouseEnter = (date) => {
    if (startDate.value && !endDate.value) {
        hoverDate.value = date;
    }
};

const handleMouseLeave = () => {
    hoverDate.value = null;
};

const handleDateClick = (dateObj) => {
    if (!dateObj.date) return;
    
    const clickedDate = dateObj.date;

    // Reset if both are selected or if clicking to start new range
    if (startDate.value && endDate.value) {
        startDate.value = clickedDate;
        endDate.value = null;
        hoverDate.value = null;
    } else if (!startDate.value) {
        startDate.value = clickedDate;
    } else {
        // Second click
        let startStr, endStr;
        if (clickedDate < startDate.value) {
            endDate.value = startDate.value;
            startDate.value = clickedDate;
        } else {
            endDate.value = clickedDate;
        }
        
        startStr = formatDateStr(startDate.value);
        endStr = formatDateStr(endDate.value);

        // Emit update
        emit('update:modelValue', [startStr, endStr]);
        emit('close');
    }
};

const prevMonth = () => {
    if (currentMonth.value === 0) {
        currentMonth.value = 11;
        currentYear.value--;
    } else {
        currentMonth.value--;
    }
};

const nextMonth = () => {
    if (currentMonth.value === 11) {
        currentMonth.value = 0;
        currentYear.value++;
    } else {
        currentMonth.value++;
    }
};
</script>

<template>
  <div class="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl p-4 w-80 user-select-none" @click.stop>
    <!-- Header -->
    <div class="flex justify-between items-center mb-4">
        <button @click="prevMonth" class="p-1 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
        </button>
        <div class="font-bold text-white">{{ currentYear }}年 {{ currentMonth + 1 }}月</div>
        <button @click="nextMonth" class="p-1 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
        </button>
    </div>

    <!-- Interface -->
    <div class="grid grid-cols-7 gap-1 mb-2">
        <div v-for="day in daysOfWeek" :key="day" class="text-center text-xs font-medium text-gray-500 py-1">
            {{ day }}
        </div>
    </div>
    
    <div class="grid grid-cols-7 gap-1" @mouseleave="handleMouseLeave">
        <div 
            v-for="(dayObj, index) in currentMonthDays" 
            :key="index" 
            class="aspect-square relative flex items-center justify-center text-sm cursor-pointer rounded-lg transition-all"
            :class="[
                !dayObj.date ? 'pointer-events-none' : 'hover:bg-gray-700 text-gray-300',
                isSelected(dayObj.date) ? '!bg-blue-600 !text-white !hover:bg-blue-500 font-bold shadow-md transform scale-105 z-10' : '',
                isInRange(dayObj.date) ? 'bg-blue-500/20 text-blue-200' : ''
            ]"
            @click="handleDateClick(dayObj)"
            @mouseenter="dayObj.date && handleMouseEnter(dayObj.date)"
        >
            {{ dayObj.day }}
        </div>
    </div>
    
    <!-- Footer Help Text -->
    <div class="mt-3 text-center text-xs text-gray-500 border-t border-gray-700 pt-2">
        {{ !startDate ? '請點選開始日期' : (!endDate ? '請點選結束日期 (可同日)' : '已選取範圍') }}
    </div>
  </div>
</template>
