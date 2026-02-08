<script setup>
import { computed } from 'vue';
import { Bar } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { useI18n } from 'vue-i18n';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ChartDataLabels);

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
      t('GorF.gb'),
      t('GorF.ld'),
      t('GorF.fb'),
      t('GorF.pu')
    ],
    datasets: [
      {
        label: '總數',
        backgroundColor: ['#FDBA74', '#34D399', '#F87171', '#9CA3AF'], // Orange, Green, Red, Gray
        data: [
          props.data.GB?.sum || 0,
          props.data.LD?.sum || 0,
          props.data.FB?.sum || 0,
          props.data.PU?.sum || 0
        ],
        borderRadius: 4,
        barPercentage: 0.8,
      }
    ]
  };
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false 
    },
    tooltip: {
      callbacks: {
        label: (context) => {
          return `${context.dataset.label}: ${context.raw}`;
        }
      }
    },
    datalabels: {
      color: '#fff',
      anchor: 'end',
      align: 'top',
      offset: -4,
      font: {
        weight: 'bold'
      },
      formatter: (value, ctx) => {
        const dataset = ctx.chart.data.datasets[0];
        const total = dataset.data.reduce((acc, curr) => acc + curr, 0);
        if (total === 0) return '0%';
        const percentage = ((value / total) * 100).toFixed(1) + '%';
        return percentage;
      }
    }
  },
  scales: {
      y: {
          beginAtZero: true,
          grid: {
              color: 'rgba(255, 255, 255, 0.1)'
          },
          ticks: {
              color: '#9CA3AF'
          }
      },
      x: {
          grid: {
              display: false
          },
            ticks: {
              color: '#9CA3AF'
          }
      }
  },
  layout: {
    padding: {
        top: 20
    }
  }
};
</script>

<template>
  <div class="w-full h-64 flex items-center justify-center">
    <Bar :data="chartData" :options="chartOptions" />
  </div>
</template>
