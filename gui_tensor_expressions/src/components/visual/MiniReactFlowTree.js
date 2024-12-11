import React, { useMemo, useCallback } from 'react';
import ReactFlow, {
  Background,
  Handle,
  Position,
  ReactFlowProvider
} from 'reactflow';
import { useResponsive } from '../utils/ResponsiveContext';

const MiniReactFlowTree = ({ node, left, right, dimTypes }) => {
  const { miniFlow } = useResponsive();

  const determineDimensionType = useCallback((letter) => {
    if (!dimTypes) return 'O';

    const inC = (dimTypes.primitive?.cb || []).includes(letter) || (dimTypes.loop?.bc || []).includes(letter);
    const inM = (dimTypes.primitive?.mb || []).includes(letter) || (dimTypes.loop?.bm || []).includes(letter);
    const inN = (dimTypes.primitive?.nb || []).includes(letter) || (dimTypes.loop?.bn || []).includes(letter);
    const inK = (dimTypes.primitive?.kb || []).includes(letter) || (dimTypes.loop?.bk || []).includes(letter);

    if (inC) return 'C';
    if (inM) return 'M';
    if (inN) return 'N';
    if (inK) return 'K';
    return 'O';
  }, [dimTypes]);

  const getLetterColor = useCallback((dimensionType) => {
    switch (dimensionType) {
      case 'C': return '#a6cee3';
      case 'M': return '#1f78b4';
      case 'N': return '#33a02c';
      case 'K': return '#b2df8a';
      default: return '#999';
    }
  }, []);

  const createColoredLabel = useCallback((nodeType) => {
    let text;
    if (nodeType === 'root') {
      text = node;
    } else if (nodeType === 'left') {
      text = left;
    } else if (nodeType === 'right') {
      text = right;
    }

    if (!Array.isArray(text) || text.length === 0) {
      return {
        html: '-',
        fullText: '-',
        fullColoredHtml: '-',
        shouldTruncate: false
      };
    }

    const fullText = text.join('');
    const truncateThreshold = miniFlow.nodeWidth < 100 ? 8 : 12;
    const shouldTruncate = fullText.length > truncateThreshold;

    const createColoredHtml = (letters) => {
      return letters
        .map((letter) => {
          const dimensionType = determineDimensionType(letter);
          const color = getLetterColor(dimensionType);
          return `<span style="color: ${color};">${letter}</span>`;
        })
        .join(',');
    };

    const truncatedHtml = shouldTruncate ?
      '...' + createColoredHtml(text.slice(-3)) :
      createColoredHtml(text);

    const fullColoredHtml = createColoredHtml(text);

    return {
      html: truncatedHtml,
      fullText: fullText,
      fullColoredHtml: fullColoredHtml,
      shouldTruncate
    };
  }, [miniFlow, node, left, right, determineDimensionType, getLetterColor]);

  const CustomNode = ({ data, id }) => (
    <div className="relative w-full h-full">
      <div className="w-full h-full">
        <div
          className="w-full h-full flex items-center justify-center p-1 overflow-hidden"
          dangerouslySetInnerHTML={{ __html: data.html }}
        />
        <Handle type="target" position={Position.Top} style={{ visibility: 'hidden' }} />
        <Handle type="source" position={Position.Bottom} style={{ visibility: 'hidden' }} />
      </div>
    </div>
  );

  const createNodeData = useCallback((type, position) => {
    const { html } = createColoredLabel(type);
    return {
      id: type,
      position,
      data: { html },
      style: {
        width: miniFlow.nodeWidth,
        height: miniFlow.nodeHeight,
        fontSize: `${miniFlow.fontSize}px`,
        border: '1px solid #ccc',
        borderRadius: '4px',
        backgroundColor: 'white',
        padding: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }
    };
  }, [miniFlow, createColoredLabel]);

  const nodes = useMemo(() => {
    const centerX = miniFlow.width / 2;
    const rootX = centerX - (miniFlow.nodeWidth / 2);
    const verticalSpacing = miniFlow.height * 0.6;
    const horizontalSpacing = miniFlow.width * 0.3;

    return [
      createNodeData('root', {
        x: rootX,
        y: 0
      }),
      createNodeData('left', {
        x: centerX - horizontalSpacing - (miniFlow.nodeWidth / 2),
        y: verticalSpacing
      }),
      createNodeData('right', {
        x: centerX + horizontalSpacing - (miniFlow.nodeWidth / 2),
        y: verticalSpacing
      }),
    ];
  }, [miniFlow, createNodeData]);

  const edges = useMemo(() => [
    {
      id: 'root-left',
      source: 'root',
      target: 'left',
      style: { stroke: '#999' }
    },
    {
      id: 'root-right',
      source: 'root',
      target: 'right',
      style: { stroke: '#999' }
    },
  ], []);

  const nodeTypes = useMemo(() => ({
    default: CustomNode,
  }), []);

  return (
    <ReactFlowProvider>
      <div style={{
        width: `${miniFlow.width}px`,
        height: `${miniFlow.height}px`,
        position: 'relative',
        overflow: 'hidden'
      }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          fitView
          fitViewOptions={{
            padding: 0.1,
            minZoom: 1,
            maxZoom: 1
          }}
          proOptions={{ hideAttribution: true }}
          zoomOnScroll={false}
          panOnScroll={false}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          draggable={false}
          panOnDrag={false}
          minZoom={1}
          maxZoom={1}
          nodeTypes={nodeTypes}
        >
          <Background variant="dots" gap={8} size={1} />
        </ReactFlow>
      </div>
    </ReactFlowProvider>
  );
};

export default MiniReactFlowTree;