<script setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import DateRangePicker from '@/components/DateRangePicker.vue';

const { t } = useI18n();

const props = defineProps({
    modelValue: {
        type: Object,
        required: true
    },
    seasons: {
        type: Array,
        default: () => []
    },
    myTeams: {
        type: Array,
        default: () => []
    },
    opponentTeams: {
        type: Array,
        default: () => []
    },
    fields: {
        type: Array,
        default: () => []
    },
    showGameResult: {
        type: Boolean,
        default: false
    },
    isOpen: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['update:modelValue', 'update:isOpen', 'search', 'clear']);

const showDatePicker = ref(false);

const updateField = (field, value) => {
    emit('update:modelValue', { ...props.modelValue, [field]: value });
};

const updateDateRange = (newRange) => {
    emit('update:modelValue', { ...props.modelValue, gameDate: newRange });
    showDatePicker.value = false;
};

const formatDateDisplay = (start, end) => {
    if (!start && !end) return t('games.date');
    if (start && !end) return `${start} ~`;
    if (!start && end) return `~ ${end}`;
    if (start === end) return start;
    return `${start} ~ ${end}`;
};

const toggleOpen = () => {
    emit('update:isOpen', !props.isOpen);
};

const handleSearch = () => {
    emit('search');
};

const handleClear = () => {
    emit('clear');
};
</script>

<template>
    <div class="flex flex-col gap-2 my-2">
        <div class="flex items-center justify-between h-12">
            <!-- Filter Toggle -->
            <div 
                @click="toggleOpen"
                class="flex items-center gap-3 cursor-pointer select-none group w-fit hover:bg-white/5 rounded-xl px-4 py-2 -ml-4 transition-all"
            >
                <div class="p-2 rounded-lg bg-gray-800/50 group-hover:bg-blue-500/20 transition-colors shadow-lg">
                     <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 transition-transform duration-300 text-gray-400 group-hover:text-blue-400" :class="isOpen ? 'rotate-0' : '-rotate-90'" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                    </svg>
                </div>
                <span class="text-2xl font-black tracking-wide text-gray-200 group-hover:text-white transition-colors">{{ t('games.search') }}</span>
            </div>
            <slot name="actions"></slot>
        </div>

        <!-- Search Form -->
        <div v-show="isOpen" class="bg-gray-800/30 border border-white/5 rounded-2xl p-6 transition-all duration-300 shadow-inner">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 <!-- Season -->
                <div class="space-y-1">
                    <label class="text-sm text-gray-400 ml-1">{{ t('games.season') }}</label>
                    <div class="relative">
                        <select :value="modelValue.Z00_season_id" @input="updateField('Z00_season_id', $event.target.value)" class="input-field appearance-none cursor-pointer">
                            <option value="">{{ t('games.all') }}</option>
                            <option v-for="s in seasons" :key="s.id" :value="s.id">{{ s.name }}</option>
                        </select>
                        <div class="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                    </div>
                </div>

                 <!-- My Team -->
                <div class="space-y-1">
                    <label class="text-sm text-gray-400 ml-1">{{ t('games.myTeam') }}</label>
                     <div class="relative">
                        <select :value="modelValue.Z00_team_id" @input="updateField('Z00_team_id', $event.target.value)" class="input-field appearance-none cursor-pointer">
                            <option value="">{{ t('games.all') }}</option>
                            <option v-for="t in myTeams" :key="t.id" :value="t.id">{{ t.name }}</option>
                        </select>
                         <div class="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                     </div>
                </div>

                <!-- Opponent Team -->
                <div class="space-y-1">
                    <label class="text-sm text-gray-400 ml-1">{{ t('games.opponentTeam') }}</label>
                     <div class="relative">
                        <select :value="modelValue.Z00_team_id_enemy" @input="updateField('Z00_team_id_enemy', $event.target.value)" class="input-field appearance-none cursor-pointer">
                            <option value="">{{ t('games.all') }}</option>
                            <option v-for="t in opponentTeams" :key="t.id" :value="t.id">{{ t.name }}</option>
                        </select>
                         <div class="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                     </div>
                </div>

                 <!-- Field -->
                <div class="space-y-1">
                    <label class="text-sm text-gray-400 ml-1">{{ t('games.field') }}</label>
                     <div class="relative">
                        <select :value="modelValue.Z00_field_id" @input="updateField('Z00_field_id', $event.target.value)" class="input-field appearance-none cursor-pointer">
                            <option value="">{{ t('games.all') }}</option>
                             <option v-for="f in fields" :key="f.id" :value="f.id">{{ f.name }}</option>
                        </select>
                         <div class="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                     </div>
                </div>

                <!-- Game Result (Optional) -->
                 <div v-if="showGameResult" class="space-y-1">
                    <label class="text-sm text-gray-400 ml-1">{{ t('games.gameResult') }}</label>
                     <div class="relative">
                        <select :value="modelValue.gameResult" @input="updateField('gameResult', $event.target.value)" class="input-field appearance-none cursor-pointer">
                            <option value="">{{ t('games.all') }}</option>
                            <option value="1">{{ t('games.win') }}</option>
                            <option value="2">{{ t('games.loss') }}</option>
                            <option value="3">{{ t('games.tie') }}</option>
                        </select>
                         <div class="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                     </div>
                </div>

                 <!-- Date Range -->
                <div class="space-y-1" :class="showGameResult ? 'md:col-span-1 lg:col-span-1' : 'md:col-span-2 lg:col-span-2'">
                    <label class="text-sm text-gray-400 ml-1">{{ t('games.date') }}</label>
                     <div class="relative">
                        <button 
                            @click="showDatePicker = !showDatePicker"
                            class="input-field w-full text-left flex items-center justify-between"
                            :class="{'text-gray-400': !modelValue.gameDate[0] && !modelValue.gameDate[1]}"
                        >
                            <span>{{ formatDateDisplay(modelValue.gameDate[0], modelValue.gameDate[1]) }}</span>
                             <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        </button>

                        <!-- Date Range Picker Component -->
                        <div v-if="showDatePicker" class="absolute top-full left-0 z-50 mt-2">
                            <DateRangePicker 
                                :modelValue="modelValue.gameDate"
                                @update:modelValue="updateDateRange"
                                @close="showDatePicker = false"
                            />
                        </div>
                        
                        <!-- Backdrop to close -->
                        <div v-if="showDatePicker" @click="showDatePicker = false" class="fixed inset-0 z-40 bg-transparent"></div>
                    </div>
                </div>
            </div>
            
            <div class="flex justify-end gap-3 mt-6 border-t border-white/5 pt-4">
                 <button @click="handleClear" class="px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm">{{ t('common.resetSearch') }}</button>
                 <button @click="handleSearch" class="btn-primary flex items-center gap-2 px-6">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    {{ t('common.searchButton') }}
                 </button>
            </div>
        </div>
    </div>
</template>
