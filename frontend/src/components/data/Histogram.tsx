import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TooltipItem,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

export interface HistogramData {
  term: string;
  frequency: number;
}

interface HistogramProps {
  data: HistogramData[];
  isDarkMode?: boolean;
  maxBars?: number;
}

const Histogram: React.FC<HistogramProps> = ({
  data,
  isDarkMode = false,
  maxBars = 10,
}) => {
  // Sort data by frequency and take top items
  const sortedData = [...data]
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, maxBars);

  const chartData = {
    labels: sortedData.map((item) => {
      // Truncate long labels for better display
      return item.term.length > 15
        ? item.term.substring(0, 15) + '...'
        : item.term;
    }),
    datasets: [
      {
        label: 'Frequency',
        data: sortedData.map((item) => item.frequency),
        backgroundColor: isDarkMode
          ? 'rgba(77, 213, 153, 0.8)' // Green with transparency
          : 'rgba(38, 215, 185, 0.8)', // Teal with transparency
        borderColor: isDarkMode
          ? 'rgba(77, 213, 153, 1)'
          : 'rgba(27, 169, 151, 1)',
        borderWidth: 2,
        borderRadius: {
          topLeft: 4,
          topRight: 4,
        },
        borderSkipped: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // Hide legend for cleaner look
      },
      title: {
        display: false, // Title handled by parent component
      },
      tooltip: {
        backgroundColor: isDarkMode
          ? 'rgba(30, 30, 30, 0.95)'
          : 'rgba(255, 255, 255, 0.95)',
        titleColor: isDarkMode ? '#fff' : '#333',
        bodyColor: isDarkMode ? '#fff' : '#333',
        borderColor: isDarkMode
          ? 'rgba(77, 213, 153, 0.8)'
          : 'rgba(38, 215, 185, 0.8)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          title: function (context: TooltipItem<'bar'>[]) {
            const index = context[0]?.dataIndex;
            return sortedData[index]?.term || '';
          },
          label: function (context: TooltipItem<'bar'>) {
            return `Frequency: ${String(context.parsed.y)}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
          font: {
            size: 11,
          },
          maxRotation: 45,
          minRotation: 0,
        },
        border: {
          color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
          font: {
            size: 11,
          },
        },
        border: {
          color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
    elements: {
      bar: {
        hoverBorderWidth: 3,
        hoverBorderColor: isDarkMode
          ? 'rgba(77, 213, 153, 1)'
          : 'rgba(27, 169, 151, 1)',
      },
    },
  };

  return (
    <div
      style={{
        height: '350px',
        width: '100%',
        overflowX: 'auto',
        overflowY: 'hidden',
      }}
    >
      <div
        style={{
          minWidth: `${Math.max(600, sortedData.length * 60).toString()}px`,
          height: '100%',
        }}
      >
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
};

export default Histogram;
