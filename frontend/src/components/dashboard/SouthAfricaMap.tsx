import React, { useEffect, useRef, useState } from 'react';
import Highcharts from 'highcharts/highmaps';
import { topology } from '../data/MapTopology';

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
  const containerRef = useRef<HTMLDivElement>(null);
  const currentFactIndexRef = useRef<{ [key: string]: number }>({});
  const chartRef = useRef<any>(null);

  const provincesData: ProvinceData[] = [
    {
      name: 'Eastern Cape',
      language: 'isiXhosa',
      funFacts: [
        'Features distinctive click sounds',
        'Home to Nelson Mandela and many other anti-apartheid activists',
        'Has the longest coastline of any South African province',
        'Known as the birthplace of South African liberation struggle',
        'Rich in Xhosa cultural heritage and traditions',
        'Home to beautiful wild coastlines and beaches',
        'Traditional music features complex harmonies',
        'The province has unique beadwork traditions',
        'Known for its indigenous forests',
        'Has three main Xhosa-speaking groups',
        'Traditional ceremonies are still widely practiced',
      ],
    },
    {
      name: 'Limpopo',
      language: 'Sepedi',
      funFacts: [
        'Has eighteen noun classes',
        'Named after the Limpopo River',
        'Home to the Kruger National Park',
        'Known for its rich biodiversity',
        'Has ancient baobab trees',
        'Traditional healers play important cultural roles',
        'Features diverse linguistic communities',
        'Known for pottery and craft traditions',
        'Has unique seasonal celebrations',
        'Traditional music uses drums and flutes',
        'Home to the Mapungubwe archaeological site',
      ],
    },
    {
      name: 'KwaZulu-Natal',
      language: 'isiZulu',
      funFacts: [
        'Most spoken home language',
        'Known for its beautiful coastline and beaches',
        'Home to the Zulu Kingdom heritage',
        'Features the Drakensberg mountain range',
        'Traditional Zulu dancing is world-renowned',
        'Has a rich warrior history',
        'Known for intricate beadwork',
        'Traditional attire is colorful and symbolic',
        'Home to UNESCO World Heritage sites',
        'Features unique traditional architecture',
        'Has vibrant cultural festivals',
      ],
    },
    {
      name: 'Western Cape',
      language: 'Afrikaans',
      funFacts: [
        'Evolved from Dutch origins',
        'Home to Table Mountain',
        'Known for world-class wine production',
        'Features stunning coastal scenery',
        'Has a Mediterranean climate',
        'Known for diverse cultural influences',
        'Home to historical Cape Dutch architecture',
        'Features unique fynbos vegetation',
        'Popular tourist destination',
        'Known for its culinary diversity',
        'Has rich maritime history',
      ],
    },
    {
      name: 'Northern Cape',
      language: 'Afrikaans',
      funFacts: [
        'Shows unique regional variations',
        'Largest province by area',
        'Known for diamond mining',
        'Features the Kalahari Desert',
        'Has spectacular spring flower displays',
        'Home to San rock art sites',
        'Known for stargazing opportunities',
        'Features unique desert landscapes',
        'Has rich mining heritage',
        'Known for its semi-arid climate',
        'Home to the Augrabies Falls',
      ],
    },
    {
      name: 'North West',
      language: 'Setswana',
      funFacts: [
        'Official language in Botswana',
        'Known for platinum mining',
        'Home to Sun City resort',
        'Features the Pilanesberg Game Reserve',
        'Rich in Tswana cultural traditions',
        'Known for traditional pottery',
        'Has unique traditional music',
        'Features beautiful natural landscapes',
        'Known for its wildlife',
        'Has important cultural festivals',
        'Traditional architecture is distinctive',
      ],
    },
    {
      name: 'Free State',
      language: 'Sesotho',
      funFacts: [
        'Famous for praise poems',
        'Known as the breadbasket of South Africa',
        'Features vast agricultural lands',
        'Has beautiful golden landscapes',
        'Rich in San rock art',
        'Known for traditional blanket designs',
        'Features unique sandstone formations',
        'Has important historical sites',
        'Known for its open spaces',
        'Traditional music is melodic',
        'Home to the Golden Gate Highlands',
      ],
    },
    {
      name: 'Gauteng',
      language: 'isiZulu',
      funFacts: [
        'Most linguistically diverse province',
        'Economic hub of South Africa',
        'Smallest province by area',
        'Most populous province',
        'Home to Johannesburg and Pretoria',
        'Features 11 official languages actively spoken',
        'Known for urban culture',
        'Has rich mining history',
        'Center of commerce and finance',
        'Known for vibrant nightlife',
        'Features diverse culinary scene',
      ],
    },
    {
      name: 'Mpumalanga',
      language: 'isiSwati',
      funFacts: [
        'Related to isiZulu language',
        'Home to the Blyde River Canyon',
        'Known for scenic beauty',
        'Features the Lowveld region',
        'Known for subtropical fruit farming',
        'Has panoramic mountain views',
        'Home to part of Kruger National Park',
        'Known for waterfalls',
        'Features unique ecosystems',
        'Has rich cultural diversity',
        'Traditional ceremonies are vibrant',
      ],
    },
  ];

  const getProvinceFact = (provinceName: string) => {
    const province = provincesData.find(
      (p) => p.name.toLowerCase() === provinceName.toLowerCase(),
    );

    if (!province) {
      const randomProvince =
        provincesData[Math.floor(Math.random() * provincesData.length)];
      const factIndex = currentFactIndexRef.current[randomProvince.name] || 0;
      return {
        name: randomProvince.name,
        language: randomProvince.language,
        funFact: randomProvince.funFacts[factIndex],
      };
    }

    const factIndex = currentFactIndexRef.current[province.name] || 0;
    return {
      name: province.name,
      language: province.language,
      funFact: province.funFacts[factIndex],
    };
  };

  // Get CSS custom properties for theming
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

  useEffect(() => {
    const initializeMap = () => {
      if (!containerRef.current) return;

      try {
        const themeColors = getThemeColors();

        // Simple data array - let's try the basic format again
        // Debug: Log all available map keys
        console.log('Map topology:', topology);
        if (
          topology &&
          topology.objects &&
          topology.objects.default &&
          topology.objects.default.geometries
        ) {
          console.log(
            'Available map keys:',
            topology.objects.default.geometries.map(
              (g: any) => g.properties['hc-key'],
            ),
          );
        }

        // NUCLEAR OPTION: Try every possible key for Gauteng
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

        // Debug: Find Gauteng geometry
        if (topology && topology.objects && topology.objects.default) {
          const gautengGeometry = topology.objects.default.geometries.find(
            (g: any) =>
              g.properties &&
              (g.properties.name === 'Gauteng' ||
                g.properties['hc-key'] === 'za-gt' ||
                g.id === 'ZA.GT'),
          );
          if (gautengGeometry) {
            console.log(
              '✅ Gauteng found in topology:',
              gautengGeometry.properties.name,
              gautengGeometry.properties['hc-key'],
            );
          } else {
            console.log('❌ Gauteng NOT found in topology');
          }
        }

        // Create the chart with theme colors
        const chart = (Highcharts as any).mapChart(containerRef.current, {
          chart: {
            map: topology,
            backgroundColor: 'transparent',
            height:
              typeof height === 'number' ? height : parseInt(height.toString()),
            width: typeof width === 'number' ? width : null,
          },

          title: {
            text: '', // Removed title text
            style: {
              fontSize: '20px',
              fontWeight: 'bold',
              color: themeColors.textTheme,
            },
          },

          colorAxis: {
            min: 0,
            stops: [
              [0, themeColors.accentTeal + '40'],
              [1, themeColors.accentTeal],
            ],
          },

          legend: {
            enabled: false,
          },

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
                  min-height: auto;
                  box-sizing: border-box;
                  overflow: visible;
                  word-wrap: break-word;
                  hyphens: auto;
                ">
                  <h3 style="
                    margin: 0 0 8px 0; 
                    color: ${themeColors.accentPink}; 
                    font-size: 16px; 
                    font-weight: 600;
                    word-wrap: break-word;
                    overflow: hidden;
                  ">● ${fact.name}</h3>
                  <div style="
                    margin-bottom: 8px; 
                    padding: 6px 8px; 
                    background: ${themeColors.accentTeal}15; 
                    border-radius: 4px;
                    overflow: hidden;
                  ">
                    <span style="font-weight: 600; color: ${themeColors.textTheme}; font-size: 13px;">Language:</span>
                    <span style="color: ${themeColors.accentTeal}; margin-left: 6px; font-weight: 500; font-size: 13px;">${fact.language}</span>
                  </div>
                  <div style="margin-top: 8px; overflow: visible;">
                    <span style="
                      font-weight: 600; 
                      color: ${themeColors.textTheme}; 
                      font-size: 13px;
                    ">Fun Fact: </span><span style="
                      color: ${themeColors.textTheme}; 
                      font-size: 12px;
                      word-wrap: break-word;
                      overflow-wrap: break-word;
                      white-space: normal;
                      text-overflow: clip;
                      overflow: visible;
                      hyphens: auto;
                      -webkit-hyphens: auto;
                      -ms-hyphens: auto;
                    ">${fact.funFact}</span>
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
              allAreas: true, // Show ALL areas, even without data
              nullColor: themeColors.accentTeal + '60', // Same color for unmapped areas
            },
          ],

          credits: {
            enabled: false,
          },
        });

        chartRef.current = chart;
        (containerRef.current as any).chartInstance = chart;

        // FORCE GAUTENG TO WORK - Manual intervention
        setTimeout(() => {
          if (chart && chart.series && chart.series[0]) {
            const series = chart.series[0];
            console.log('Map series points:', series.points);

            // Find all points and log their properties
            series.points.forEach((point: any, index: number) => {
              console.log(`Point ${index}:`, {
                name: point.name,
                key: point.key,
                id: point.id,
                properties: point.properties,
              });

              // If this is Gauteng, force it to be colored and ensure tooltip works
              if (
                point.name === 'Gauteng' ||
                point.key === 'za-gt' ||
                point.id === 'ZA.GT'
              ) {
                console.log(
                  'FOUND GAUTENG POINT! Forcing color and properties...',
                );
                point.update({
                  color: themeColors.accentTeal + '80',
                  borderColor: themeColors.accentTeal,
                  borderWidth: 3,
                  name: 'Gauteng', // Ensure the name is correct for tooltip
                });

                // Also manually set the properties for the tooltip
                if (point.properties) {
                  point.properties.language = 'isiZulu';
                  point.properties.funFact =
                    'Most linguistically diverse province';
                } else {
                  point.properties = {
                    language: 'isiZulu',
                    funFact: 'Most linguistically diverse province',
                  };
                }
              }
            });
          }
        }, 1000);
      } catch (error) {
        console.error('Error initializing map:', error);
        if (containerRef.current) {
          const themeColors = getThemeColors();
          containerRef.current.innerHTML = `
            <div style="text-align: center; padding: 50px; color: ${themeColors.textTheme}; background: ${themeColors.bgTheme}; border-radius: 8px;">
              <h3 style="color: ${themeColors.accentPink};">Unable to load map</h3>
              <p style="color: ${themeColors.textTheme};">Please check that the map data is available.</p>
              <p style="font-size: 12px; color: ${themeColors.textTheme}70;">Error: ${error}</p>
            </div>
          `;
        }
      }
    };

    initializeMap();

    // Cleanup function
    return () => {
      if (containerRef.current && (containerRef.current as any).chartInstance) {
        (containerRef.current as any).chartInstance.destroy();
      }
    };
  }, [width, height]);

  useEffect(() => {
    const interval = setInterval(() => {
      provincesData.forEach((province) => {
        const currentIdx = currentFactIndexRef.current[province.name] || 0;
        currentFactIndexRef.current[province.name] =
          (currentIdx + 1) % province.funFacts.length;
      });

      if (
        chartRef.current &&
        chartRef.current.tooltip &&
        chartRef.current.tooltip.isHidden === false
      ) {
        const point = chartRef.current.hoverPoint;
        if (point) {
          chartRef.current.tooltip.refresh(point);
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`sa-map-container ${className}`}
      style={{
        height: typeof height === 'number' ? `${height}px` : height,
        width: typeof width === 'number' ? `${width}px` : width,
        minWidth: '600px', // TODO: Adjust map width here
        maxWidth: '100%',
        margin: '0 auto',
        ...style,
      }}
    />
  );
};

export default SouthAfricaMap;
