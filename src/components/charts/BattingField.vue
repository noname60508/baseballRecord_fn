<script setup>
import { computed } from 'vue';

const props = defineProps({
  data: {
    type: Object,
    required: true,
    default: () => ({})
  }
});

// Coordinate system for 500x500 viewBox
// Home plate at (250, 450)
const visualPositions = [
  { key: 'P', label: 'P', x: 250, y: 344 },
  { key: 'C', label: 'C', x: 250, y: 475 },
  { key: '1B', alt: 'B1', label: '1B', x: 356, y: 344 },
  { key: '2B', alt: 'B2', label: '2B', x: 250, y: 238 },
  { key: '3B', alt: 'B3', label: '3B', x: 144, y: 344 },
  { key: 'SS', label: 'SS', x: 190, y: 280 },
  { key: 'LF', label: 'LF', x: 80, y: 150 },
  { key: 'CF', label: 'CF', x: 250, y: 80 },
  { key: 'RF', label: 'RF', x: 420, y: 150 },
  { key: 'LCF', label: 'LCF', x: 165, y: 110 },
  { key: 'RCF', label: 'RCF', x: 335, y: 110 }
];

const getStat = (pos) => {
  return props.data[pos.key] || props.data[pos.alt] || { sum: 0 };
};

const getColor = (sum) => {
  if (!sum) return 'rgba(255, 255, 255, 0.3)';
  if (sum < 3) return '#60A5FA'; 
  if (sum < 6) return '#34D399'; 
  return '#F87171'; 
};
</script>

<template>
  <div class="relative w-full aspect-square max-w-[500px] mx-auto rounded-xl overflow-hidden shadow-2xl border-4 border-[#006400]">
    <svg viewBox="0 0 500 500" class="w-full h-full bg-[#008000]">
      
      <!-- Outfield Grass -->
      <path d="M 0 200 Q 250 -50 500 200 L 500 500 L 0 500 Z" fill="#008000" stroke="none" />
      
      <!-- Foul Lines (White) -->
      <line x1="250" y1="450" x2="0" y2="200" stroke="white" stroke-width="3" stroke-opacity="0.9" />
      <line x1="250" y1="450" x2="500" y2="200" stroke="white" stroke-width="3" stroke-opacity="0.9" />
      
      <!-- Outfield Warning Track Arc -->
      <path d="M 0 200 Q 250 -50 500 200" fill="none" stroke="white" stroke-width="2" stroke-opacity="0.6" />

      <!-- Infield Dirt (Brown Arc) -->
      <!-- Creating a realistic dirt arc around the diamond -->
      <path 
        d="M 250 450 
           Q 100 400 90 290
           Q 90 240 150 180
           Q 250 80 350 180
           Q 410 240 410 290
           Q 400 400 250 450 Z" 
        fill="#a0522d" 
        stroke="#8b4513" 
        stroke-width="2"
      />

      <!-- Infield Grass (Diamond Shape) -->
      <!-- Diamond centered at pitcher's mound area -->
      <path 
        d="M 250 344 
           L 356 344 
           L 250 238 
           L 144 344 Z" 
        fill="#008000" 
        stroke="none"
      />

      <!-- Base Paths (Dirt lines) -->
      <line x1="250" y1="450" x2="356" y2="344" stroke="#8b4513" stroke-width="4" />
      <line x1="356" y1="344" x2="250" y2="238" stroke="#8b4513" stroke-width="4" />
      <line x1="250" y1="238" x2="144" y2="344" stroke="#8b4513" stroke-width="4" />
      <line x1="144" y1="344" x2="250" y2="450" stroke="#8b4513" stroke-width="4" />
      
      <!-- Bases (White squares, rotated 45°) -->
      <rect x="352" y="340" width="8" height="8" transform="rotate(45 356 344)" fill="white" stroke="#ddd" stroke-width="1" />
      <rect x="246" y="234" width="8" height="8" transform="rotate(45 250 238)" fill="white" stroke="#ddd" stroke-width="1" />
      <rect x="140" y="340" width="8" height="8" transform="rotate(45 144 344)" fill="white" stroke="#ddd" stroke-width="1" />
      
      <!-- Home Plate (Pentagon shape) -->
      <path d="M 250 450 L 245 445 L 245 440 L 255 440 L 255 445 Z" fill="white" stroke="#ddd" stroke-width="1" />

      <!-- Pitcher's Mound -->
      <circle cx="250" cy="344" r="10" fill="#a0522d" stroke="#8b4513" stroke-width="2" />
      <rect x="247" y="342" width="6" height="4" fill="white" />

      <!-- Data Points (Dots with counts) -->
      <g v-for="pos in visualPositions" :key="pos.key" class="group">
          <circle 
            :cx="pos.x" 
            :cy="pos.y" 
            r="16" 
            :fill="getColor(getStat(pos).sum)"
            class="transition-all duration-300 cursor-pointer shadow-lg"
            stroke="rgba(0,0,0,0.3)"
            stroke-width="2"
          >
            <title>{{ pos.label }}: {{ getStat(pos).sum }}</title>
          </circle>
          
          <!-- Count text inside dot -->
          <text 
            :x="pos.x" 
            :y="pos.y" 
            text-anchor="middle" 
            dominant-baseline="middle" 
            fill="white" 
            class="text-[14px] font-black pointer-events-none select-none drop-shadow-md font-mono"
          >
            {{ getStat(pos).sum || 0 }}
          </text>
      </g>
    </svg>
  </div>
</template>
