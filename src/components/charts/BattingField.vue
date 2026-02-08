<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps({
  data: {
    type: Object,
    required: true,
    default: () => ({})
  }
});

const { t } = useI18n();

const visualPositions = [
  // Infield
  { key: '1B', alt: 'B1', label: '1B', top: '50%', left: '68%' },
  { key: '2B', alt: 'B2', label: '2B', top: '42%', left: '57%' },
  { key: '3B', alt: 'B3', label: '3B', top: '50%', left: '32%' },
  { key: 'SS', label: 'SS', top: '42%', left: '43%' },
  // Outfield
  { key: 'LF', label: 'LF', top: '33%', left: '15%' },
  { key: 'LCF', label: 'LCF', top: '22%', left: '30%' },
  { key: 'CF', label: 'CF', top: '17%', left: '50%' },
  { key: 'RCF', label: 'RCF', top: '22%', left: '70%' },
  { key: 'RF', label: 'RF', top: '33%', left: '85%' },
];

const getStat = (pos) => {
  return props.data[pos.key] || props.data[pos.alt] || { sum: 0, hit: 0, locationAVG: 0, percentage: 0 };
};

const getColor = (percentage) => {
  if (!percentage) return 'rgba(107, 114, 128, 0.8)'; // Gray for 0%
  if (percentage < 10) return 'rgba(59, 130, 246, 0.9)'; // Blue for low
  if (percentage < 20) return 'rgba(16, 185, 129, 0.9)'; // Green for medium
  return 'rgba(239, 68, 68, 0.9)'; // Red for high
};
</script>

<template>
  <div class="relative w-full aspect-square max-w-[500px] mx-auto">
    <!-- Background Layer (Clipped for Image) -->
    <div class="absolute inset-0 rounded-xl">
        <img 
        src="/baseballField.png" 
        alt="Baseball Field" 
        class="w-full h-full object-cover pointer-events-none transform scale-125 origin-center"
        />
    </div>
    
    <!-- Data Layer (Visible for Tooltips) -->
    <!-- Note: We use the same coordinate system relative to the container, 
         but since the background is zoomed, visualPositions need to align with the zoomed field.
         However, visualPositions are % of the CONTAINER. 
         If the image is zoomed 1.25x from center, the "Field" features move away from center.
         We are adjusting the positions manually effectively by trial, 
         but ideally we would scale this container too if we wanted perfect lock.
         Let's try scaling this container too to match the background zoom. 
    -->
    <div class="absolute inset-0 w-full h-full transform scale-125 origin-center pointer-events-none">
        <div v-for="pos in visualPositions" :key="pos.key" 
            class="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer pointer-events-auto hover:z-50"
            :style="{ top: pos.top, left: pos.left }"
        >
        <!-- Stat Circle -->
        <div 
            class="flex items-center justify-center w-12 h-12 rounded-full shadow-lg border-2 border-white transition-transform transform group-hover:scale-110"
            :style="{ backgroundColor: getColor(getStat(pos).percentage) }"
        >
            <span class="text-white font-bold text-xs md:text-sm drop-shadow-md">
            {{ getStat(pos).percentage }}%
            </span>
        </div>

        <!-- Tooltip -->
        <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 bg-gray-900/95 text-white text-xs rounded-lg p-3 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 backdrop-blur-sm border border-gray-700">
            <div class="font-bold text-center border-b border-gray-700 pb-1 mb-1 text-yellow-400 text-sm">
                {{ pos.label }}
            </div>
            <div class="grid grid-cols-2 gap-x-4 gap-y-1">
                <span class="text-gray-400">{{ t('batting.sum') }}:</span>
                <span class="text-right font-mono">{{ getStat(pos).sum }}</span>
                
                <span class="text-gray-400">{{ t('batting.hit') }}:</span>
                <span class="text-right font-mono">{{ getStat(pos).hit }}</span>
                
                <span class="text-gray-400">{{ t('batting.locationAVG') }}:</span>
                <span class="text-right font-mono">{{ Number(getStat(pos).locationAVG).toFixed(3).replace(/^0+/, '') }}</span>

                <span class="text-gray-400">{{ t('batting.percentage') }}:</span>
                <span class="text-right font-mono font-bold text-yellow-500">{{ getStat(pos).percentage }}%</span>
            </div>
        </div>
        </div>
    </div>
  </div>
</template>
