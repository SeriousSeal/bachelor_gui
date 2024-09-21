import React, { useMemo } from 'react';
import ReactFlow, {
  Background, 
  Handle,
  Position,
  ReactFlowProvider
} from 'reactflow';

const MiniReactFlowTree = ({ node, left, right, dimTypes }) => {
  const determineDimensionType = (letter) => {
    
    const inC = dimTypes.primitive.cb.includes(letter) || dimTypes.loop.bc.includes(letter);
    const inM = dimTypes.primitive.mb.includes(letter) || dimTypes.loop.bm.includes(letter);
    const inN = dimTypes.primitive.nb.includes(letter) || dimTypes.loop.bn.includes(letter);
    const inK = dimTypes.primitive.kb.includes(letter) || dimTypes.loop.bk.includes(letter);

    if (inC) return 'C';
    if (inM) return 'M';
    if (inN) return 'N';
    if (inK) return 'K';
    return 'O'; // Other
  };

  const getLetterColor = (dimensionType) => {
    switch (dimensionType) {
      case 'C': return '#a6cee3';
      case 'M': return '#1f78b4';
      case 'N': return '#33a02c';
      case 'K': return '#b2df8a';
      default: return 'black';
    }
  };

  const createColoredLabel = (nodeType) => {
    if(nodeType === 'root') {
      return node.map((letter, index) => {
        const dimensionType = determineDimensionType(letter);
        const color = getLetterColor(dimensionType);
        return `<span style="color: ${color};">${letter}</span>`;
      }).join('');
    }
    else if(nodeType === 'left') {
      return left?.map((letter, index) => {
        const dimensionType = determineDimensionType(letter);
        const color = getLetterColor(dimensionType);
        return `<span style="color: ${color};">${letter}</span>`;
      }).join('');
    }
    else if(nodeType === 'right') {
      return right?.map((letter, index) => {
        const dimensionType = determineDimensionType(letter);
        const color = getLetterColor(dimensionType);
        return `<span style="color: ${color};">${letter}</span>`;
      }).join('');
    }
    else {
      throw new Error('Invalid node type');
    }
  };

  const nodes = [
    {
      id: 'root',
      position: { x: 100, y: 10 },
      data: { label: createColoredLabel("root") },
      style: { width: 80, height: 50, fontSize: '20px' }
    },
    {
      id: 'left',
      position: { x: 50, y: 80 },
      data: { label: createColoredLabel("left") || "-" },
      style: { width: 80, height: 50, fontSize: '20px' }
    },
    {
      id: 'right',
      position: { x: 150, y: 80 },
      data: { label: createColoredLabel("right") || "-" },
      style: { width: 80, height: 50, fontSize: '20px' }
    },
  ];

  const edges = [
    { id: 'root-left', source: 'root', target: 'left'},
    { id: 'root-right', source: 'root', target: 'right' },
  ];

  const nodeTypes = useMemo(() => ({
    default: ({ data }) => (
      <div style={{ position: 'relative' }}>
        <div dangerouslySetInnerHTML={{ __html: data.label }} />
        <Handle type="target" position={Position.Top} style={{ visibility: 'hidden' }} />
        <Handle type="source" position={Position.Bottom} style={{ visibility: 'hidden' }} />
      </div>
    ),
  }), []);

  return (
    <ReactFlowProvider>
      <div style={{ width: '250px', height: '150px' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          fitView
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