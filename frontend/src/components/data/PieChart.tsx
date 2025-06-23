import React, { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  type ChartOptions,
  type TooltipItem,
} from 'chart.js';

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
);

interface PieChartData {
  label: string;
  value: number;
  backgroundColor?: string;
  borderColor?: string;
}

interface PieChartProps {
  data: PieChartData[];
  title?: string;
  showTitle?: boolean;
  isDarkMode?: boolean;
  formatValue?: (value: number) => string;
}

const defaultFormatValue = (value: number): string => String(value);

const DEFAULT_COLORS = [
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

const DEFAULT_BORDER_COLORS = [
  '#1BA997',
  '#E5CE00',
  '#E04343',
  '#544DD4',
  '#CC837A',
  '#3DAE7F',
  '#2D90D0',
  '#D58F00',
  '#8B6AB3',
  '#D97F4A',
];

const PieChart: React.FC<PieChartProps> = ({
  data,
  title = 'Chart',
  showTitle = false,
  isDarkMode,
  formatValue = defaultFormatValue,
}) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<ChartJS | null>(null);

  useEffect(() => {
    const handleResize = () => {
      if (
        chartInstance.current &&
        chartInstance.current.options.plugins?.legend
      ) {
        const isMobile = window.innerWidth < 768;
        chartInstance.current.options.plugins.legend.position = isMobile
          ? 'bottom'
          : 'right';
        chartInstance.current.update();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    const ctx = chartRef.current?.getContext('2d');
    if (!ctx || !data.length) return;

    // Destroy existing chart
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const isMobile = window.innerWidth < 768;

    const chartData = {
      labels: data.map((item) => item.label),
      datasets: [
        {
          data: data.map((item) => item.value),
          backgroundColor: data.map(
            (item, index) =>
              item.backgroundColor ||
              DEFAULT_COLORS[index % DEFAULT_COLORS.length],
          ),
          borderColor: data.map(
            (item, index) =>
              item.borderColor ||
              DEFAULT_BORDER_COLORS[index % DEFAULT_BORDER_COLORS.length],
          ),
          borderWidth: 2,
        },
      ],
    };
    const legendPosition = isMobile ? 'bottom' : ('right' as const);
    const legendAlign = 'start' as const;
    const fontWeight = 'bold' as const;

    const options: ChartOptions<'pie'> = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: showTitle,
          text: title,
          font: {
            size: 18,
            weight: fontWeight,
          },
          color: isDarkMode ? '#ffffff' : '#1f2937',
          padding: {
            top: 10,
            bottom: 20,
          },
        },
        legend: {
          display: true,
          position: legendPosition,
          align: legendAlign,
          labels: {
            padding: isMobile ? 10 : 15,
            boxWidth: 12,
            boxHeight: 12,
            font: {
              size: isMobile ? 12 : 14,
            },
            color: isDarkMode ? '#ffffff' : '#1f2937',
            usePointStyle: true,
          },
        },
        tooltip: {
          backgroundColor: isDarkMode ? '#374151' : '#ffffff',
          titleColor: isDarkMode ? '#ffffff' : '#374151',
          bodyColor: isDarkMode ? '#ffffff' : '#374151',
          borderColor: isDarkMode ? '#6b7280' : '#e5e7eb',
          borderWidth: 1,
          cornerRadius: 8,
          displayColors: true,
          callbacks: {
            label: function (context: TooltipItem<'pie'>) {
              const value = formatValue(context.parsed);
              return `${context.label}: ${value}`;
            },
          },
        },
      },
      layout: {
        padding: {
          left: 10,
          right: 10,
          top: 10,
          bottom: 10,
        },
      },
      elements: {
        arc: {
          borderWidth: 2,
        },
      },
    };

    chartInstance.current = new ChartJS(ctx, {
      type: 'pie',
      data: chartData,
      options: options,
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data, isDarkMode, title, showTitle, formatValue]);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        minHeight: '250px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <canvas
        ref={chartRef}
        style={{
          maxWidth: '100%',
          maxHeight: '100%',
        }}
      />
    </div>
  );
};

// Demo component with sample data
export const PieChartDemo = () => {
  const mockPieData = [
    {
      label: 'Afrikaans',
      value: 9.2,
      backgroundColor: '#26D7B9',
      borderColor: '#1BA997',
    },
    {
      label: 'isiNdebele',
      value: 9.1,
      backgroundColor: '#FAE56B',
      borderColor: '#E5CE00',
    },
    {
      label: 'isiXhosa',
      value: 8.8,
      backgroundColor: '#F87171',
      borderColor: '#E04343',
    },
    {
      label: 'isiZulu',
      value: 9.2,
      backgroundColor: '#6C63FF',
      borderColor: '#544DD4',
    },
    {
      label: 'Sepedi',
      value: 9.1,
      backgroundColor: '#FFA69E',
      borderColor: '#CC837A',
    },
    {
      label: 'Sesotho',
      value: 9.0,
      backgroundColor: '#4DD599',
      borderColor: '#3DAE7F',
    },
    {
      label: 'Setswana',
      value: 9.0,
      backgroundColor: '#3AB0FF',
      borderColor: '#2D90D0',
    },
    {
      label: 'siSwati',
      value: 8.9,
      backgroundColor: '#FFB703',
      borderColor: '#D58F00',
    },
    {
      label: 'Tshivenda',
      value: 9.0,
      backgroundColor: '#B388EB',
      borderColor: '#8B6AB3',
    },
    {
      label: 'Xitsonga',
      value: 9.1,
      backgroundColor: '#FF9F68',
      borderColor: '#D97F4A',
    },
  ];

  const formatValue = (value: number): string => `${value.toString()}%`;

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1
        style={{ textAlign: 'center', marginBottom: '30px', color: '#1f2937' }}
      >
        Language Distribution Pie Chart
      </h1>

      <div
        style={{
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(0, 0, 0, 0.1)',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        }}
      >
        <h2
          style={{
            color: '#1f2937',
            fontSize: '1.25rem',
            fontWeight: '600',
            margin: '0 0 16px 0',
          }}
        >
          Language Distribution
        </h2>

        <PieChart
          data={mockPieData}
          formatValue={formatValue}
          isDarkMode={false}
        />
      </div>
    </div>
  );
};

// Export PieChart as the default export
export default PieChart;
