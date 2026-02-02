<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['update:modelValue', 'close']);

// Date Utils
const daysOfWeek = ['日', '一', '二', '三', '四', '五', '六'];
const today = new Date();

// Initialize internal state from props
const initialDate = props.modelValue ? new Date(props.modelValue) : today;
const currentYear = ref(initialDate.getFullYear());
const currentMonth = ref(initialDate.getMonth()); // 0-11
const selectedDate = ref(props.modelValue ? props.modelValue : null);

watch(() => props.modelValue, (newVal) => {
    selectedDate.value = newVal;
    if (newVal) {
        const d = new Date(newVal);
        if (!isNaN(d.getTime())) {
            currentYear.value = d.getFullYear();
            currentMonth.value = d.getMonth();
        }
    }
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
    if (!date || !selectedDate.value) return false;
    return formatDateStr(date) === selectedDate.value;
};

const handleDateClick = (dateObj) => {
    if (!dateObj.date) return;
    const clickedDateStr = formatDateStr(dateObj.date);
    selectedDate.value = clickedDateStr;
    emit('update:modelValue', clickedDateStr);
    emit('close');
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
  <div class="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl p-4 w-72 user-select-none" @click.stop>
    <!-- Header -->
    <div class="flex justify-between items-center mb-4">
        <button type="button" @click="prevMonth" class="p-1 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
        </button>
        <div class="font-bold text-white">{{ currentYear }}年 {{ currentMonth + 1 }}月</div>
        <button type="button" @click="nextMonth" class="p-1 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
        </button>
    </div>

    <!-- Weeks -->
    <div class="grid grid-cols-7 gap-1 mb-2">
        <div v-for="day in daysOfWeek" :key="day" class="text-center text-xs font-medium text-gray-500 py-1">
            {{ day }}
        </div>
    </div>
    
    <!-- Days -->
    <div class="grid grid-cols-7 gap-1">
        <div 
            v-for="(dayObj, index) in currentMonthDays" 
            :key="index" 
            class="aspect-square relative flex items-center justify-center text-sm cursor-pointer rounded-lg transition-all"
            :class="[
                !dayObj.date ? 'pointer-events-none' : 'hover:bg-gray-700 text-gray-300',
                isSelected(dayObj.date) ? '!bg-blue-600 !text-white !hover:bg-blue-500 font-bold shadow-md transform scale-105 z-10' : ''
            ]"
            @click="handleDateClick(dayObj)"
        >
            {{ dayObj.day }}
        </div>
    </div>
  </div>
</template>
