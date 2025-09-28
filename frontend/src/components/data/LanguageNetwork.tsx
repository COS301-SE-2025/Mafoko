import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import SpriteText from 'three-spritetext';
import ForceGraph3D from '3d-force-graph';

interface NetworkNode {
  id: string;
  group: number;
  size: number;
  domains: string[];
  __threeObj?: THREE.Object3D;
  x?: number;
  y?: number;
  z?: number;
}

interface NetworkLink {
  source: NetworkNode;
  target: NetworkNode;
  value: number;
  normalized_strength: number;
}

interface LanguageNetworkData {
  nodes: NetworkNode[];
  links: NetworkLink[];
}

interface LanguageNetworkProps {
  isDarkMode: boolean;
}

interface ForceGraphInstance {
  backgroundColor: (color: string) => ForceGraphInstance;
  nodeLabel: (
    label: string | ((node: NetworkNode) => string),
  ) => ForceGraphInstance;
  nodeColor: (
    color: string | ((node: NetworkNode) => string),
  ) => ForceGraphInstance;
  nodeRelSize: (size: number) => ForceGraphInstance;
  nodeVal: (
    val: number | ((node: NetworkNode) => number),
  ) => ForceGraphInstance;
  linkWidth: (
    width: number | ((link: NetworkLink) => number),
  ) => ForceGraphInstance;
  linkColor: (
    color: string | ((link: NetworkLink) => string),
  ) => ForceGraphInstance;
  linkOpacity: (opacity: number) => ForceGraphInstance;
  graphData: (data: LanguageNetworkData) => ForceGraphInstance;
  nodeThreeObject: (
    obj: (node: NetworkNode) => THREE.Object3D,
  ) => ForceGraphInstance;
  d3Force: (forceName: string) => {
    strength?: (strength: number) => void;
    distance?: (dist: (link: NetworkLink) => number) => void;
  };
}

interface ForceGraphInstance {
  _destructor?: () => void;
  backgroundColor: (color: string) => ForceGraphInstance;
  nodeLabel: (
    label: string | ((node: NetworkNode) => string),
  ) => ForceGraphInstance;
  nodeColor: (
    color: string | ((node: NetworkNode) => string),
  ) => ForceGraphInstance;
  nodeRelSize: (size: number) => ForceGraphInstance;
  nodeVal: (
    val: number | ((node: NetworkNode) => number),
  ) => ForceGraphInstance;
  linkWidth: (
    width: number | ((link: NetworkLink) => number),
  ) => ForceGraphInstance;
  linkColor: (
    color: string | ((link: NetworkLink) => string),
  ) => ForceGraphInstance;
  linkOpacity: (opacity: number) => ForceGraphInstance;
  graphData: (data: LanguageNetworkData) => ForceGraphInstance;
  nodeThreeObject: (
    obj: (node: NetworkNode) => THREE.Object3D,
  ) => ForceGraphInstance;
  d3Force: (forceName: string) => {
    strength?: (strength: number) => void;
    distance?: (dist: (link: NetworkLink) => number) => void;
  };
}

const LanguageNetwork = ({
  isDarkMode,
}: LanguageNetworkProps): React.ReactElement => {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<ForceGraphInstance | null>(null);
  const [networkData, setNetworkData] = useState<LanguageNetworkData | null>(
    null,
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          'http://localhost:8003/api/v1/analytics/advanced/language-network',
        );
        const data = await response.json();
        setNetworkData(data);
      } catch (error) {
        console.error('Error fetching language network data:', error);
        // Create mock nodes first
        const mockNodes: NetworkNode[] = [
          {
            id: 'English',
            group: 5,
            size: 100,
            domains: ['Statistics', 'Economics'],
          },
          {
            id: 'French',
            group: 4,
            size: 80,
            domains: ['Statistics', 'Social'],
          },
          { id: 'Spanish', group: 3, size: 60, domains: ['Economics'] },
          {
            id: 'German',
            group: 4,
            size: 70,
            domains: ['Statistics', 'Mathematics'],
          },
          { id: 'Mandarin', group: 3, size: 50, domains: ['Economics'] },
        ];

        // Create links using node references
        const mockLinks: NetworkLink[] = [
          {
            source: mockNodes[0],
            target: mockNodes[1],
            value: 30,
            normalized_strength: 0.8,
          },
          {
            source: mockNodes[0],
            target: mockNodes[2],
            value: 20,
            normalized_strength: 0.6,
          },
          {
            source: mockNodes[1],
            target: mockNodes[2],
            value: 15,
            normalized_strength: 0.5,
          },
          {
            source: mockNodes[0],
            target: mockNodes[3],
            value: 25,
            normalized_strength: 0.7,
          },
          {
            source: mockNodes[3],
            target: mockNodes[1],
            value: 10,
            normalized_strength: 0.4,
          },
        ];

        setNetworkData({ nodes: mockNodes, links: mockLinks });
      }
    };

    void fetchData();
  }, []);

  useEffect(() => {
    if (!containerRef.current || !networkData) return;

    // @ts-ignore - ForceGraph3D has incorrect type definitions
    const instance = ForceGraph3D()(containerRef.current)
      .backgroundColor(isDarkMode ? '#1a1a1a' : '#ffffff')
      .nodeLabel('id')
      .nodeColor(() => '#FF6B6B')
      .nodeRelSize(6)
      .nodeVal(() => 30)
      .linkWidth(() => 2)
      .linkColor(() => (isDarkMode ? '#ffffff' : '#666666'))
      .linkOpacity(0.3)
      .graphData(networkData)
      .nodeThreeObject((node: NetworkNode) => {
        const sprite = new SpriteText(node.id);
        sprite.color = isDarkMode ? '#ffffff' : '#000000';
        sprite.textHeight = 8;
        return sprite;
      });

    graphRef.current = instance as unknown as ForceGraphInstance;

    // Configure forces
    const chargeForce = instance.d3Force('charge');
    if (chargeForce?.strength) {
      chargeForce.strength(-120);
    }

    const linkForce = instance.d3Force('link');
    if (linkForce?.distance) {
      linkForce.distance((link: NetworkLink) => 30 + (1 / link.value) * 70);
    }

    return () => {
      if (graphRef.current?._destructor) {
        graphRef.current._destructor();
      }
      graphRef.current = null;
    };
  }, [networkData, isDarkMode]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '400px',
        borderRadius: '8px',
        overflow: 'hidden',
      }}
    />
  );
};

export default LanguageNetwork;
