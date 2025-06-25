import React from 'react';
import type { ChartData, ChartOptions } from 'chart.js';
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Title,
} from 'chart.js';
import type { TooltipItem } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Title);
export interface TermData {
  term: string;
  frequency: number;
}

interface HorizontalBarChartProps {
  data: TermData[];
  className?: string;
  title?: string;
  showChartTitle?: boolean;
  isDarkMode?: boolean;
}

const HorizontalBarChart: React.FC<HorizontalBarChartProps> = ({
  data,
  className,
  title,
  showChartTitle = false,
  isDarkMode = true, // Default to true, can be overridden by parent
}) => {
  const labels = data.map((item) => item.term);
  const frequencies = data.map((item) => item.frequency);
  const customColors = [
    '#26D7B9',
    '#FAE56B',
    '#F87171',
    '#6C63FF',
    '#FFA69E',
    '#4DD599',
    '#3AB0FF',
    '#FFB703',
    '#B388EB',
    '#FF9F68',
  ];

  const barColors = data.map(
    (_, index) => customColors[index % customColors.length],
  );

  const chartData: ChartData<'bar'> = {
    labels,
    datasets: [
      {
        label: 'Frequency',
        data: frequencies,
        backgroundColor: barColors,
        borderColor: barColors.map((color) => {
          const match = color.match(/\w\w/g);
          if (!match) return color; // Return original color if match fails
          const [r, g, b] = match.map((hex) => parseInt(hex, 16));
          return `rgb(${String(Math.max(0, r - 30))}, ${String(Math.max(0, g - 30))}, ${String(Math.max(0, b - 30))})`; // Ensure values are not negative and cast to string
        }),
        borderWidth: 1,
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  const chartOptions: ChartOptions<'bar'> = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: showChartTitle && Boolean(title),
        text: title || '',
        font: { size: 42, weight: 'bold' },
        color: isDarkMode ? '#fff' : '#374151',
        padding: { top: 10, bottom: 20 },
      },
      tooltip: {
        displayColors: false,
        backgroundColor: isDarkMode ? '#374151' : '#fff',
        titleColor: isDarkMode ? '#fff' : '#374151',
        bodyColor: isDarkMode ? '#fff' : '#374151',
        borderColor: isDarkMode ? '#6b7280' : '#e5e7eb',
        borderWidth: 1,
        callbacks: {
          label: (context: TooltipItem<'bar'>) =>
            `Frequency: ${String(context.parsed.x)}`,
        },
      },
      legend: { display: false },
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: {
          color: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
        },
        border: { display: false },
        ticks: {
          color: isDarkMode ? '#ffffff' : '#6b7280',
          font: { size: 12 },
        },
      },
      y: {
        grid: { display: false },
        ticks: {
          color: isDarkMode ? '#ffffff' : '#6b7280',
          font: { size: 14, weight: 500 },
        },
      },
    },
  };

  const titleHeight = title && !showChartTitle ? 40 : 0;
  const canvasHeight = data.length * 32 + titleHeight;

  return (
    <div
      className={`relative w-full h-full overflow-y-auto ${className || ''}`}
    >
      {title && !showChartTitle && (
        <div className="mb-4">
          <h3
            className="text-lg font-semibold text-center"
            style={{ color: 'var(--text-color)' }}
          >
            {title}
          </h3>
        </div>
      )}
      <div style={{ height: `${String(canvasHeight - titleHeight)}px` }}>
        <Bar data={chartData} options={chartOptions} />
      </div>
    </div>
  );
};

export default HorizontalBarChart;
