import React, { useEffect, useRef } from 'react';
import Highcharts from 'highcharts/highmaps';
import { topology } from '../data/MapTopology';

interface ProvinceGeometry {
  properties: {
    name: string;
    language: string;
    funFact: string;
  };
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
  height = 700
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const geometries: ProvinceGeometry[] = [
    {
      properties: {
        name: "Eastern Cape",
        language: "isiXhosa",
        funFact: "Features distinctive click sounds"
      }
    },
    {
      properties: {
        name: "Limpopo",
        language: "Sepedi",
        funFact: "Has eighteen noun classes"
      }
    },
    {
      properties: {
        name: "KwaZulu-Natal",
        language: "isiZulu",
        funFact: "Most spoken home language"
      }
    },
    {
      properties: {
        name: "Western Cape",
        language: "Afrikaans",
        funFact: "Evolved from Dutch origins"
      }
    },
    {
      properties: {
        name: "Northern Cape",
        language: "Afrikaans",
        funFact: "Shows unique regional variations"
      }
    },
    {
      properties: {
        name: "North West",
        language: "Setswana",
        funFact: "Official language in Botswana"
      }
    },
    {
      properties: {
        name: "Free State",
        language: "Sesotho",
        funFact: "Famous for praise poems"
      }
    },
    {
      properties: {
        name: "Gauteng",
        language: "isiZulu",
        funFact: "Most linguistically diverse province"
      }
    },
    {
      properties: {
        name: "Mpumalanga",
        language: "isiSwati",
        funFact: "Related to isiZulu language"
      }
    }
  ];

  // Function to get facts
  const getProvinceFact = (provinceName: string) => {
    let province = geometries.find(
      geo => geo.properties.name.toLowerCase() === provinceName.toLowerCase()
    );

    if (!province) {
      province = geometries[Math.floor(Math.random() * geometries.length)];
    }

    return province.properties;
  };

  // Get CSS custom properties for theming
  const getThemeColors = () => {
    const computedStyle = getComputedStyle(document.documentElement);
    return {
      bgTheme: computedStyle.getPropertyValue('--bg-theme').trim() || '#f5f5f5',
      textTheme: computedStyle.getPropertyValue('--text-theme').trim() || '#212431',
      accentTeal: computedStyle.getPropertyValue('--accent-teal').trim() || '#00ceaf',
      accentPink: computedStyle.getPropertyValue('--accent-pink').trim() || '#f00a50',
      secondaryLight: computedStyle.getPropertyValue('--secondary-light').trim() || '#ffffff',
    };
  };

  useEffect(() => {
    const initializeMap = () => {
      if (!containerRef.current) return;

      try {
        const themeColors = getThemeColors();
        
        // Simple data array - let's try the basic format again
        // Debug: Log all available map keys
        console.log("Map topology:", topology);
        if (topology && topology.objects && topology.objects.default && topology.objects.default.geometries) {
          console.log("Available map keys:", topology.objects.default.geometries.map((g: any) => g.properties['hc-key']));
        }
        
        // NUCLEAR OPTION: Try every possible key for Gauteng
        const data = [
          ["za-ec", 1],
          ["za-np", 1], 
          ["za-nl", 1],
          ["za-wc", 1],
          ["za-nc", 1],
          ["za-nw", 1],
          ["za-fs", 1],
          ["za-gt", 1],  
          ["za-mp", 1]
        ];

        // Debug: Find Gauteng geometry
        if (topology && topology.objects && topology.objects.default) {
          const gautengGeometry = topology.objects.default.geometries.find((g: any) => 
            g.properties && (
              g.properties.name === 'Gauteng' || 
              g.properties['hc-key'] === 'za-gt' ||
              g.id === 'ZA.GT'
            )
          );
          if (gautengGeometry) {
            console.log('✅ Gauteng found in topology:', gautengGeometry.properties.name, gautengGeometry.properties['hc-key']);
          } else {
            console.log('❌ Gauteng NOT found in topology');
          }
        }

        // Create the chart with theme colors
        const chart = (Highcharts as any).mapChart(containerRef.current, {
          chart: { 
            map: topology,
            backgroundColor: 'transparent',
            height: typeof height === 'number' ? height : parseInt(height.toString()),
            width: typeof width === 'number' ? width : null
          },

          title: { 
            text: "", // Removed title text
            style: {
              fontSize: '20px',
              fontWeight: 'bold',
              color: themeColors.textTheme
            }
          },

          colorAxis: { 
            min: 0,
            stops: [
              [0, themeColors.accentTeal + '40'],
              [1, themeColors.accentTeal]
            ]
          },

          legend: {
            enabled: false
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
              width: 4
            },
            padding: 0,
            style: {
              fontSize: '14px',
              pointerEvents: 'none'
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
            }
          },

          series: [{
            type: 'map',
            data: data,
            name: "South African Provinces",
            states: { 
              hover: { 
                color: themeColors.accentPink + '80',
                borderColor: themeColors.accentPink,
                borderWidth: 2
              }
            },
            dataLabels: { 
              enabled: true, 
              format: "{point.name}",
              style: {
                color: themeColors.textTheme,
                fontWeight: '600',
                fontSize: '12px',
                textOutline: `2px contrast`
              }
            },
            colorByPoint: false,
            color: themeColors.accentTeal + '60',
            borderColor: themeColors.accentTeal,
            borderWidth: 2,
            allAreas: true,  // Show ALL areas, even without data
            nullColor: themeColors.accentTeal + '60'  // Same color for unmapped areas
          }],

          credits: {
            enabled: false
          }
        });

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
                properties: point.properties
              });
              
              // If this is Gauteng, force it to be colored and ensure tooltip works
              if (point.name === 'Gauteng' || point.key === 'za-gt' || point.id === 'ZA.GT') {
                console.log('FOUND GAUTENG POINT! Forcing color and properties...');
                point.update({
                  color: themeColors.accentTeal + '80',
                  borderColor: themeColors.accentTeal,
                  borderWidth: 3,
                  name: 'Gauteng'  // Ensure the name is correct for tooltip
                });
                
                // Also manually set the properties for the tooltip
                if (point.properties) {
                  point.properties.language = 'isiZulu';
                  point.properties.funFact = 'Most linguistically diverse province';
                } else {
                  point.properties = {
                    language: 'isiZulu',
                    funFact: 'Most linguistically diverse province'
                  };
                }
              }
            });
          }
        }, 1000);

      } catch (error) {
        console.error("Error initializing map:", error);
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
        ...style
      }}
    />
  );
};

export default SouthAfricaMap;
