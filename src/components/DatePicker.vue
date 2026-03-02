<script setup>
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['update:modelValue', 'close']);

// Date Utils
const daysOfWeek = [
  'sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'
];
const today = new Date();

// Initialize internal state from props
const initialDate = props.modelValue ? new Date(props.modelValue) : today;
const currentYear = ref(initialDate.getFullYear());
const currentMonth = ref(initialDate.getMonth()); // 0-11
const selectedDate = ref(props.modelValue ? props.modelValue : null);

// View mode: 'days' | 'months' | 'years'
const viewMode = ref('days');
const yearRangeStart = ref(Math.floor(initialDate.getFullYear() / 12) * 12);

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

// Year grid (12 years per page)
const yearList = computed(() => {
  return Array.from({ length: 12 }, (_, i) => yearRangeStart.value + i);
});

const monthList = computed(() => [0,1,2,3,4,5,6,7,8,9,10,11]);

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

const isToday = (date) => {
    if (!date) return false;
    return formatDateStr(date) === formatDateStr(today);
};

const handleDateClick = (dateObj) => {
    if (!dateObj.date) return;
    const clickedDateStr = formatDateStr(dateObj.date);
    selectedDate.value = clickedDateStr;
    emit('update:modelValue', clickedDateStr);
    emit('close');
};

const selectMonth = (month) => {
    currentMonth.value = month;
    viewMode.value = 'days';
};

const selectYear = (year) => {
    currentYear.value = year;
    yearRangeStart.value = Math.floor(year / 12) * 12;
    viewMode.value = 'months';
};

const toggleView = () => {
    if (viewMode.value === 'days') viewMode.value = 'years';
    else if (viewMode.value === 'years') viewMode.value = 'months';
    else viewMode.value = 'days';
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

const prevYearRange = () => { yearRangeStart.value -= 12; };
const nextYearRange = () => { yearRangeStart.value += 12; };
const prevYear = () => { currentYear.value--; };
const nextYear = () => { currentYear.value++; };
</script>

<template>
  <div class="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl p-4 w-72 user-select-none" @click.stop>
    <!-- Header -->
    <div class="flex justify-between items-center mb-4">
        <!-- Prev button -->
        <button type="button"
            @click="viewMode === 'days' ? prevMonth() : viewMode === 'months' ? prevYear() : prevYearRange()"
            class="p-1 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
        </button>

        <!-- Clickable title to switch view -->
        <button type="button"
            @click="toggleView"
            class="font-bold text-white hover:text-blue-400 transition-colors flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-gray-700">
            <template v-if="viewMode === 'days'">
                {{ currentYear }}{{ t('basic.year') }} {{ currentMonth + 1 }}{{ t('basic.month') }}
            </template>
            <template v-else-if="viewMode === 'months'">
                {{ currentYear }}{{ t('basic.year') }}
            </template>
            <template v-else>
                {{ yearRangeStart }} - {{ yearRangeStart + 11 }}
            </template>
            <svg class="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
            </svg>
        </button>

        <!-- Next button -->
        <button type="button"
            @click="viewMode === 'days' ? nextMonth() : viewMode === 'months' ? nextYear() : nextYearRange()"
            class="p-1 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
        </button>
    </div>

    <!-- Year Picker View -->
    <div v-if="viewMode === 'years'" class="grid grid-cols-4 gap-1">
        <button
            v-for="year in yearList" :key="year"
            type="button"
            @click="selectYear(year)"
            class="py-2 text-sm rounded-lg transition-all font-medium"
            :class="year === currentYear
                ? 'bg-blue-600 text-white font-bold'
                : year === today.getFullYear()
                    ? 'bg-orange-500/10 text-orange-300 font-bold ring-1 ring-orange-400/50'
                    : 'text-gray-300 hover:bg-gray-700'"
        >
            {{ year }}
        </button>
    </div>

    <!-- Month Picker View -->
    <div v-else-if="viewMode === 'months'" class="grid grid-cols-4 gap-1">
        <button
            v-for="m in monthList" :key="m"
            type="button"
            @click="selectMonth(m)"
            class="py-2 text-sm rounded-lg transition-all font-medium"
            :class="m === currentMonth
                ? 'bg-blue-600 text-white font-bold'
                : (m === today.getMonth() && currentYear === today.getFullYear())
                    ? 'bg-orange-500/10 text-orange-300 font-bold ring-1 ring-orange-400/50'
                    : 'text-gray-300 hover:bg-gray-700'"
        >
            {{ m + 1 }}{{ t('basic.month') }}
        </button>
    </div>

    <!-- Days View -->
    <template v-else>
        <!-- Weeks -->
        <div class="grid grid-cols-7 gap-1 mb-2">
            <div v-for="dayKey in daysOfWeek" :key="dayKey" class="text-center text-xs font-medium text-gray-500 py-1">
                {{ t(`week.${dayKey}`) }}
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
                    isSelected(dayObj.date) ? '!bg-blue-600 !text-white !hover:bg-blue-500 font-bold shadow-md transform scale-105 z-10' : '',
                    isToday(dayObj.date) && !isSelected(dayObj.date) ? 'bg-orange-500/10 text-orange-300 font-bold' : ''
                ]"
                @click="handleDateClick(dayObj)"
            >
                {{ dayObj.day }}
                <!-- Today indicator underline -->
                <span 
                    v-if="isToday(dayObj.date)" 
                    class="absolute bottom-0 left-1 right-1 h-0.5 rounded-full"
                    :class="isSelected(dayObj.date) ? 'bg-white/70' : 'bg-orange-400'"
                ></span>
            </div>
        </div>
    </template>
  </div>
</template>
