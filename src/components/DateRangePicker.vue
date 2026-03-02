<script setup>
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [null, null]
  }
});

const emit = defineEmits(['update:modelValue', 'close']);

// Date Utils
const daysOfWeek = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const today = new Date();
const currentYear = ref(today.getFullYear());
const currentMonth = ref(today.getMonth()); // 0-11

// View mode: 'days' | 'months' | 'years'
const viewMode = ref('days');
const yearRangeStart = ref(Math.floor(today.getFullYear() / 12) * 12);

const startDate = ref(props.modelValue[0] ? new Date(props.modelValue[0]) : null);
const endDate = ref(props.modelValue[1] ? new Date(props.modelValue[1]) : null);
const hoverDate = ref(null);

// Sync props to internal state if props change externally
watch(() => props.modelValue, (newVal) => {
    startDate.value = newVal[0] ? new Date(newVal[0]) : null;
    endDate.value = newVal[1] ? new Date(newVal[1]) : null;
    
    // If we have a start date, jump the calendar view to that month
    if (startDate.value) {
        currentYear.value = startDate.value.getFullYear();
        currentMonth.value = startDate.value.getMonth();
    }
}, { immediate: true });

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

const isToday = (date) => {
    if (!date) return false;
    const formatDate = (d) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    };
    return formatDate(date) === formatDate(today);
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

const yearList = computed(() => Array.from({ length: 12 }, (_, i) => yearRangeStart.value + i));
const monthList = computed(() => [0,1,2,3,4,5,6,7,8,9,10,11]);

const selectMonth = (month) => { currentMonth.value = month; viewMode.value = 'days'; };
const selectYear = (year) => { currentYear.value = year; yearRangeStart.value = Math.floor(year / 12) * 12; viewMode.value = 'months'; };
const toggleView = () => {
    if (viewMode.value === 'days') viewMode.value = 'years';
    else if (viewMode.value === 'years') viewMode.value = 'months';
    else viewMode.value = 'days';
};
const prevYear = () => { currentYear.value--; };
const nextYear = () => { currentYear.value++; };
const prevYearRange = () => { yearRangeStart.value -= 12; };
const nextYearRange = () => { yearRangeStart.value += 12; };
</script>

<template>
  <div class="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl p-4 w-80 max-w-[calc(100vw-2rem)] user-select-none" @click.stop>
    <!-- Selection Status -->
    <div class="flex items-center justify-between mb-4 pb-3 border-b border-gray-700/50">
        <div class="space-y-1">
            <p class="text-[10px] uppercase tracking-wider text-gray-500 font-bold">{{ t('games.dateRange') }}</p>
            <div class="flex items-center gap-2">
                <span class="text-sm font-medium" :class="startDate ? 'text-blue-400' : 'text-gray-600'">
                    {{ startDate ? formatDateStr(startDate) : t('common.noData') }}
                </span>
                <span class="text-gray-600">→</span>
                <span class="text-sm font-medium" :class="endDate ? 'text-blue-400' : 'text-gray-600'">
                    {{ endDate ? formatDateStr(endDate) : '...' }}
                </span>
            </div>
        </div>
        <button 
            v-if="startDate" 
            @click="() => { startDate = null; endDate = null; hoverDate = null; emit('update:modelValue', [null, null]); }"
            class="p-1.5 hover:bg-red-500/10 text-gray-500 hover:text-red-400 rounded-lg transition-colors"
            :title="t('common.clearSelection')"
        >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
        </button>
    </div>

    <!-- Header -->
    <div class="flex justify-between items-center mb-4">
        <button type="button"
            @click="viewMode === 'days' ? prevMonth() : viewMode === 'months' ? prevYear() : prevYearRange()"
            class="p-1 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
        </button>
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
        <!-- Weekdays -->
        <div class="grid grid-cols-7 gap-1 mb-2">
            <div v-for="dayKey in daysOfWeek" :key="dayKey" class="text-center text-xs font-medium text-gray-500 py-1">
                {{ t(`week.${dayKey}`) }}
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
                    isInRange(dayObj.date) ? 'bg-blue-500/20 text-blue-200' : '',
                    isToday(dayObj.date) && !isSelected(dayObj.date) ? 'text-gray-300 font-bold' : ''
                ]"
                @click="handleDateClick(dayObj)"
                @mouseenter="dayObj.date && handleMouseEnter(dayObj.date)"
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
    
    <!-- Footer Help Text -->
    <div class="mt-3 text-center text-xs py-2 bg-gray-900/50 rounded-lg border border-gray-700/50" :class="!startDate ? 'text-gray-500' : 'text-blue-400 font-medium'">
        {{ !startDate ? t('games.selectStartDate') : (!endDate ? t('games.selectEndDate') : t('games.rangeSelected')) }}
    </div>
  </div>
</template>
