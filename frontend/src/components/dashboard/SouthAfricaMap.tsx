import React, { useEffect, useRef } from 'react';
import Highcharts from 'highcharts/highmaps';
import { topology } from '../data/MapTopology';
import { useTranslation } from 'react-i18next';

interface ProvinceData {
  name: string;
  language: string;
  funFacts: string[];
}

interface SouthAfricaMapProps {
  className?: string;
  style?: React.CSSProperties;
  width?: number | string;
  height?: number | string;
}

const SouthAfricaMap: React.FC<SouthAfricaMapProps> = ({
  className = '',
  style = {},
  width = '100%',
  height = 700,
}) => {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const currentFactIndexRef = useRef<Record<string, number>>({});
  const chartRef = useRef<any>(null);

  // 🔹 Load all provinces from translation JSON
  const provincesData: ProvinceData[] = Object.values(
    t('provinces', { returnObjects: true }) as Record<string, ProvinceData>,
  );

  // 🔹 Pick a rotating fact for each province
  const getProvinceFact = (provinceName: string) => {
    const province = provincesData.find(
      (p) => p.name.toLowerCase() === provinceName.toLowerCase(),
    );

    const target =
      province ??
      provincesData[Math.floor(Math.random() * provincesData.length)];

    const factIndex = currentFactIndexRef.current[target.name] || 0;

    return {
      name: target.name,
      language: target.language,
      funFact: target.funFacts[factIndex],
    };
  };

  // 🔹 Extract theme colors from CSS variables
  const getThemeColors = () => {
    const computedStyle = getComputedStyle(document.documentElement);
    return {
      bgTheme: computedStyle.getPropertyValue('--bg-theme').trim() || '#f5f5f5',
      textTheme:
        computedStyle.getPropertyValue('--text-theme').trim() || '#212431',
      accentTeal:
        computedStyle.getPropertyValue('--accent-teal').trim() || '#00ceaf',
      accentPink:
        computedStyle.getPropertyValue('--accent-pink').trim() || '#f00a50',
      secondaryLight:
        computedStyle.getPropertyValue('--secondary-light').trim() || '#ffffff',
    };
  };

  // 🔹 Initialize map
  useEffect(() => {
    const initializeMap = () => {
      if (!containerRef.current) return;

      try {
        const themeColors = getThemeColors();

        const data = [
          ['za-ec', 1],
          ['za-np', 1],
          ['za-nl', 1],
          ['za-wc', 1],
          ['za-nc', 1],
          ['za-nw', 1],
          ['za-fs', 1],
          ['za-gt', 1],
          ['za-mp', 1],
        ];

        const chart = (Highcharts as any).mapChart(containerRef.current, {
          chart: {
            map: topology,
            backgroundColor: 'transparent',
            spacing: [10, 10, 10, 10],
          },

          title: { text: '' },

          colorAxis: {
            min: 0,
            stops: [
              [0, themeColors.accentTeal + '40'],
              [1, themeColors.accentTeal],
            ],
          },

          legend: { enabled: false },

          tooltip: {
            useHTML: true,
            backgroundColor: themeColors.secondaryLight,
            borderWidth: 2,
            borderColor: themeColors.accentTeal,
            borderRadius: 12,
            shadow: {
              color: 'rgba(0, 0, 0, 0.2)',
              offsetX: 2,
              offsetY: 2,
              opacity: 0.3,
              width: 4,
            },
            padding: 0,
            style: {
              fontSize: '14px',
              pointerEvents: 'none',
            },
            outside: false,
            hideDelay: 500,
            formatter: function () {
              const fact = getProvinceFact((this as any).point.name);
              return `
                <div style="
                  padding: 12px; 
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                  width: 280px;
                  max-width: 280px;
                  box-sizing: border-box;
                  word-wrap: break-word;
                ">
                  <h3 style="
                    margin: 0 0 8px 0; 
                    color: ${themeColors.accentPink}; 
                    font-size: 16px; 
                    font-weight: 600;
                  ">● ${fact.name}</h3>
                  <div style="
                    margin-bottom: 8px; 
                    padding: 6px 8px; 
                    background: ${themeColors.accentTeal}15; 
                    border-radius: 4px;
                  ">
                    <span style="font-weight: 600; color: ${themeColors.textTheme}; font-size: 13px;">
                      ${t('analytics.stats.topLanguage', { ns: 'translation' })}:
                    </span>
                    <span style="color: ${themeColors.accentTeal}; margin-left: 6px; font-weight: 500; font-size: 13px;">
                      ${fact.language}
                    </span>
                  </div>
                  <div style="margin-top: 8px;">
                    <span style="font-weight: 600; color: ${themeColors.textTheme}; font-size: 13px;">
                      ${t('fact', { ns: 'translation' })}:
                    </span>
                    <span style="
                      color: ${themeColors.textTheme};
                      font-size: 12px;
                      word-wrap: break-word;
                      overflow-wrap: break-word;
                    ">
                      ${fact.funFact}
                    </span>
                  </div>
                </div>
              `;
            },
          },

          series: [
            {
              type: 'map',
              data: data,
              name: 'South African Provinces',
              states: {
                hover: {
                  color: themeColors.accentPink + '80',
                  borderColor: themeColors.accentPink,
                  borderWidth: 2,
                },
              },
              dataLabels: {
                enabled: true,
                format: '{point.name}',
                style: {
                  color: themeColors.textTheme,
                  fontWeight: '600',
                  fontSize: '12px',
                  textOutline: `2px contrast`,
                },
              },
              colorByPoint: false,
              color: themeColors.accentTeal + '60',
              borderColor: themeColors.accentTeal,
              borderWidth: 2,
              allAreas: true,
              nullColor: themeColors.accentTeal + '60',
            },
          ],

          credits: { enabled: false },
        });

        chartRef.current = chart;
        (containerRef.current as any).chartInstance = chart;
      } catch (error) {
        console.error('Error initializing map:', error);
        if (containerRef.current) {
          const themeColors = getThemeColors();
          containerRef.current.innerHTML = `
            <div style="text-align: center; padding: 50px; color: ${themeColors.textTheme}; background: ${themeColors.bgTheme}; border-radius: 8px;">
              <h3 style="color: ${themeColors.accentPink};">Unable to load map</h3>
              <p style="color: ${themeColors.textTheme};">Please check that the map data is available.</p>
              <p style="font-size: 12px; color: ${themeColors.textTheme};">Error: ${error}</p>
            </div>
          `;
        }
      }
    };

    initializeMap();

    // Cleanup
    return () => {
      if (containerRef.current && (containerRef.current as any).chartInstance) {
        (containerRef.current as any).chartInstance.destroy();
      }
    };
  }, [width, height, t]);

  // 🔹 Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (chartRef.current) chartRef.current.reflow();
    };

    const debouncedResize = () => {
      clearTimeout((debouncedResize as any).timer);
      (debouncedResize as any).timer = setTimeout(handleResize, 100);
    };

    window.addEventListener('resize', debouncedResize);
    return () => window.removeEventListener('resize', debouncedResize);
  }, []);

  // 🔹 Rotate facts every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      provincesData.forEach((province) => {
        const currentIdx = currentFactIndexRef.current[province.name] || 0;
        currentFactIndexRef.current[province.name] =
          (currentIdx + 1) % province.funFacts.length;
      });

      if (
        chartRef.current?.tooltip &&
        chartRef.current.tooltip.isHidden === false
      ) {
        const point = chartRef.current.hoverPoint;
        if (point) chartRef.current.tooltip.refresh(point);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [provincesData]);

  return (
    <div
      ref={containerRef}
      className={`sa-map-container ${className}`}
      style={{
        width: '100%',
        height: '100%',
        minHeight: '300px',
        maxWidth: '100%',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        ...style,
      }}
    />
  );
};

export default SouthAfricaMap;
