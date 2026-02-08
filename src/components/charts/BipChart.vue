<script setup>
import { computed } from 'vue';
import { Doughnut } from 'vue-chartjs';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { useI18n } from 'vue-i18n';

ChartJS.register(ArcElement, Tooltip, Legend);

const props = defineProps({
  data: {
    type: Object,
    required: true,
    default: () => ({ GB: {}, LD: {}, FB: {}, PU: {} })
  }
});

const { t } = useI18n();

const chartData = computed(() => {
  return {
    labels: [
      props.data.GB?.name || '滾地球',
      props.data.LD?.name || '平飛球',
      props.data.FB?.name || '飛球',
      props.data.PU?.name || '內野飛球'
    ],
    datasets: [
      {
        backgroundColor: ['#FDBA74', '#34D399', '#F87171', '#9CA3AF'], // Orange, Green, Red, Gray
        data: [
          props.data.GB?.sum || 0,
          props.data.LD?.sum || 0,
          props.data.FB?.sum || 0,
          props.data.PU?.sum || 0
        ],
        borderWidth: 0,
        hoverOffset: 4
      }
    ]
  };
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'right',
      labels: {
        color: '#9CA3AF', // Gray-400
        font: {
          family: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
        }
      }
    }
  },
  layout: {
    padding: 20
  }
};
</script>

<template>
  <div class="w-full h-64 flex items-center justify-center">
    <Doughnut :data="chartData" :options="chartOptions" />
  </div>
</template>
