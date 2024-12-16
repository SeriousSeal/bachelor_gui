import React, { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import ReactFlow, {
  Handle,
  Position,
  ReactFlowProvider
} from 'reactflow';
import { useResponsive } from '../utils/ResponsiveContext';
import NodeIndicesPanel from './NodeIndicesPanel';

const CustomNode = ({ data, id }) => {  // Change to destructure from data instead of props
  const [showTooltip, setShowTooltip] = useState(false);
  const nodeRef = useRef(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const timeoutRef = useRef(null);

  const clearTimeoutSafely = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  useEffect(() => {
    return () => clearTimeoutSafely();
  }, []);

  useEffect(() => {
    if (showTooltip && nodeRef.current && !data.forceCloseTooltip) {  // Change to access from data
      console.log(data.forceCloseTooltip)
      const rect = nodeRef.current.getBoundingClientRect();
      setTooltipPosition({
        x: rect.left + rect.width / 2,
        y: rect.top
      });
    }
  }, [showTooltip]);

  useEffect(() => {
    console.log('Force close tooltip:', data.forceCloseTooltip);  // Change to access from data
    if (data.forceCloseTooltip) {  // Change to access from data
      clearTimeoutSafely();
      setShowTooltip(false);
    }
  }, [data.forceCloseTooltip]);  // Change dependency

  const handleSwapIndices = (newIndices) => {
    console.log('Swapping indices:', { id, newIndices });
    if (data.indices) {
      data.onIndicesChange?.(id, newIndices);
    }
  };

  const handleMouseEnter = () => {
    if (data.forceCloseTooltip) return; // Don't show tooltip if panel is being dragged
    clearTimeoutSafely();
    setShowTooltip(true);
  };

  const handleMouseLeave = () => {
    clearTimeoutSafely();
    timeoutRef.current = setTimeout(() => {
      setShowTooltip(false);
    }, 100);
  };

  return (
    <div
      ref={nodeRef}
      className="relative w-full h-full bg-white rounded-md border border-gray-200"
      style={{ pointerEvents: 'all' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="w-full h-full flex items-center justify-center p-1">
        <div dangerouslySetInnerHTML={{ __html: data.html }} />
      </div>
      {showTooltip && data.indices && data.indices.length > 0 && createPortal(
        <NodeIndicesPanel
          indices={data.indices}
          onSwapIndices={handleSwapIndices}
          position={tooltipPosition}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        />,
        document.body
      )}
      <Handle type="target" position={Position.Top} style={{ visibility: 'hidden' }} />
      <Handle type="source" position={Position.Bottom} style={{ visibility: 'hidden' }} />
    </div>
  );
};

const nodeTypes = {
  default: CustomNode,
};

const MiniReactFlowTree = ({ node, left, right, dimTypes, onIndicesChange, isDragging }) => {
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

  const createNodeData = useCallback((type, position) => {
    const { html } = createColoredLabel(type);
    let indices = [];
    if (type === 'root') {
      indices = Array.isArray(node) ? node : [];
    } else if (type === 'left') {
      indices = Array.isArray(left) ? left : [];
    } else if (type === 'right') {
      indices = Array.isArray(right) ? right : [];
    }

    return {
      id: type,
      position,
      data: {
        html,
        indices,
        onIndicesChange,
        forceCloseTooltip: isDragging, // Make sure this is included
      },
      style: {
        width: miniFlow.nodeWidth,
        height: miniFlow.nodeHeight,
        fontSize: `${miniFlow.fontSize}px`,
        padding: 0,
        backgroundColor: 'transparent',
        border: 'none'
      }
    };
  }, [miniFlow, createColoredLabel, node, left, right, onIndicesChange, isDragging]);

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

  return (
    <ReactFlowProvider>
      <div style={{
        width: `${miniFlow.width}px`,
        height: `${miniFlow.height}px`,
        position: 'relative',
        overflow: 'visible',
      }}>
        {/* Add background wrapper div */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'white',
          zIndex: 0,
        }} />
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1,
        }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            fitView
            fitViewOptions={{ padding: 0.1 }}
            proOptions={{ hideAttribution: true }}
            nodeTypes={nodeTypes}
            zoomOnScroll={false}
            panOnScroll={false}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={false}
            draggable={false}
            panOnDrag={false}
            minZoom={1}
            maxZoom={1}
          >

          </ReactFlow>
        </div>
      </div>
    </ReactFlowProvider>
  );
};

export default MiniReactFlowTree;