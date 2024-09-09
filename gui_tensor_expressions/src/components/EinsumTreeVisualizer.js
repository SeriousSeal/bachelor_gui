import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import EinsumContractionTree from './CreateNodesAndEdges';
import ReactFlow, { 
  ReactFlowProvider,
  addEdge, 
  Background, 
  Controls, 
  useNodesState, 
  useEdgesState,
  Handle,
  Position,
  useReactFlow,
  fitView
  
} from 'reactflow';
import 'reactflow/dist/style.css';

const CustomNode = ({ data }) => (
  <div style={{ 
    background: '#fff', 
    border: '1px solid #777', 
    borderRadius: '8px', 
    width: '40px', 
    height: '40px', 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center',
    fontSize: '14px',
    cursor: 'pointer', // Ensure the cursor indicates a clickable element
  }}>
    {data.label}
    <Handle type="target" position={Position.Top} style={{ visibility: 'hidden' }} />
    <Handle type="source" position={Position.Bottom} style={{ visibility: 'hidden' }} />
  </div>
);

const nodeTypes = {
  custom: CustomNode,
};

const buildVisualizationTree = (root) => {
  let nodes = [];
  let edges = [];
  let idCounter = 1;
  const nodeWidth = 150;
  const nodeHeight = 40;
  const levelHeight = 100;

  // First pass: assign initial x coordinates and determine tree dimensions
  const assignInitialX = (node, depth = 0) => {
    if (!node) return { width: 0, height: 0 };

    const leftSubtree = assignInitialX(node.left, depth + 1);
    const rightSubtree = assignInitialX(node.right, depth + 1);

    const width = Math.max(nodeWidth, leftSubtree.width + rightSubtree.width);
    const height = Math.max(leftSubtree.height, rightSubtree.height) + 1;

    node.x = leftSubtree.width;
    node.y = depth * levelHeight;
    node.width = width;
    node.height = height;

    return { width, height };
  };

  // Second pass: adjust x coordinates to center parent over children
  const adjustX = (node, offsetX = 0) => {
    if (!node) return;

    node.x += offsetX;

    if (node.left || node.right) {
      const leftWidth = node.left ? node.left.width : 0;
      const rightWidth = node.right ? node.right.width : 0;
      const totalWidth = leftWidth + rightWidth;

      if (node.left) {
        adjustX(node.left, offsetX);
      }
      if (node.right) {
        adjustX(node.right, offsetX + leftWidth);
      }

      // Center the parent node above its children
      node.x = offsetX + (totalWidth - nodeWidth) / 2;
    }
  };

  // Third pass: create nodes and edges
  const createNodesAndEdges = (node, parentId = null) => {
    if (!node) return;

    const currentId = `${idCounter++}`;

    nodes.push({
      id: currentId,
      type: 'custom',
      data: { label: node.string },
      position: { x: node.x, y: node.y }
    });

    if (parentId !== null) {
      edges.push({
        id: `e${parentId}-${currentId}`,
        source: parentId,
        target: currentId,
        type: 'smoothstep'  // Changed to smoothstep for better appearance
      });
    }

    createNodesAndEdges(node.left, currentId);
    createNodesAndEdges(node.right, currentId);
  };

  // Execute the three passes
  assignInitialX(root);
  adjustX(root);
  createNodesAndEdges(root);

  return { nodes, edges };
};

const initialNodesTree1 = [
  { id: '1-1', type: 'custom', data: { label: 'A' }, position: { x: 0, y: 0 } },
  { id: '1-2', type: 'custom', data: { label: 'B' }, position: { x: -100, y: 100 } },
  { id: '1-3', type: 'custom', data: { label: 'C' }, position: { x: 100, y: 100 } },
  { id: '1-4', type: 'custom', data: { label: 'D' }, position: { x: -150, y: 200 } },
  { id: '1-5', type: 'custom', data: { label: 'E' }, position: { x: -50, y: 200 } },
];

const initialEdgesTree1 = [
  { id: 'e1-1-2', source: '1-1', target: '1-2', type: 'step' },
  { id: 'e1-1-3', source: '1-1', target: '1-3', type: 'step' },
  { id: 'e1-2-4', source: '1-2', target: '1-4', type: 'step' },
  { id: 'e1-2-5', source: '1-2', target: '1-5', type: 'step' },
];

const initialNodesTree2 = [
  { id: '2-1', type: 'custom', data: { label: 'X' }, position: { x: 0, y: 0 } },
  { id: '2-2', type: 'custom', data: { label: 'Y' }, position: { x: -100, y: 100 } },
  { id: '2-3', type: 'custom', data: { label: 'Z' }, position: { x: 100, y: 100 } },
];

const initialEdgesTree2 = [
  { id: 'e2-1-2', source: '2-1', target: '2-2', type: 'step' },
  { id: 'e2-1-3', source: '2-1', target: '2-3', type: 'step' },
];

const Flow = ({ nodes, edges, onNodesChange, onEdgesChange, onConnect, onNodeClick, fitViewFunction }) => {
  const { fitView } = useReactFlow();

  useEffect(() => {
    const timer = setTimeout(() => {
      fitView({ padding: 0.2, includeHiddenNodes: false });
    }, 0);
    return () => clearTimeout(timer);
  }, [fitView]);

  // Expose fitView function
  useEffect(() => {
    if (fitViewFunction) {
      fitViewFunction(() => fitView({ padding: 0.2, includeHiddenNodes: false }));
    }
  }, [fitView, fitViewFunction]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.2 }}
      minZoom={0.1}
      maxZoom={4}
      style={{ width: '100%', height: '100%' }}
      onNodeClick={onNodeClick}
    >
      <Controls />
      <Background variant="dots" gap={12} size={1} />
    </ReactFlow>
  );
};

const NodeDataDisplay = ({ node }) => {
  if (!node) return null;

  return (
    <div style={{ 
      backgroundColor: '#f0f0f0', 
      padding: '10px', 
      borderRadius: '5px',
      marginTop: '20px',
    }}>
      <h3>Selected Node Data</h3>
      <p><strong>ID:</strong> {node.id}</p>
      <p><strong>Type:</strong> {node.type}</p>
      <p><strong>Position:</strong> x: {node.position.x}, y: {node.position.y}</p>
      <p><strong>Data:</strong> {JSON.stringify(node.data)}</p>
    </div>
  );
};

const CustomPanelResizeHandle = ({ className, ...props }) => (
  <PanelResizeHandle 
    className={`custom-resize-handle ${className}`}
    {...props}
  />
);


const EinsumTreeVisualizer = () => {
  const [nodes1, setNodes1, onNodesChange1] = useNodesState();
  const [edges1, setEdges1, onEdgesChange1] = useEdgesState();
  const [nodes2, setNodes2, onNodesChange2] = useNodesState(initialNodesTree2);
  const [edges2, setEdges2, onEdgesChange2] = useEdgesState(initialEdgesTree2);
  const [einsumExpression, setEinsumExpression] = useState('');
  const [selectedNode, setSelectedNode] = useState(null);

  const fitViewFunctions = useRef({ tree1: null, tree2: null });
  const onConnect1 = useCallback((params) => setEdges1((eds) => addEdge(params, eds)), [setEdges1]);
  const onConnect2 = useCallback((params) => setEdges2((eds) => addEdge(params, eds)), [setEdges2]);


  const handleEinsumInputChange = (event) => {
    setEinsumExpression(event.target.value);
  };

  const onNodeClick = useCallback((event, node) => {
    console.log('Node clicked:', node);
    setSelectedNode(node);
  }, []);

  const parseInput = () => {
    const iString = "eai,fb,abcd,gic,hd->iefgh";
    const iPath = [[1, 2], [2, 3], [0, 1], [0, 1]];
    const iSizes = [[10,10,10], [10, 10], [10, 10, 10, 10], [10, 10,10], [10, 10]];
    const tree = EinsumContractionTree({
      iString: iString,
      iPath: iPath,
      iSizes: iSizes
    });
    const { nodes, edges } = buildVisualizationTree(tree);
    setNodes1(nodes);
    setEdges1(edges);
    setTimeout(() => fitView('tree1'), 0)
  };

  const fitView = (tree) => {
    fitViewFunctions.current[tree]?.();
  };


  return (
    <PanelGroup direction="horizontal" >
      <Panel defaultSize={50} minSize={20}>
        <div style={{ height: '100%', border: '1px solid #e0e0e0' }}>
          <PanelGroup direction="vertical">
            <Panel defaultSize={50} minSize={10}>
              <ReactFlowProvider>
                <Flow
                  nodes={nodes1}
                  edges={edges1}
                  onNodesChange={onNodesChange1}
                  onEdgesChange={onEdgesChange1}
                  onConnect={onConnect1}
                  onNodeClick={onNodeClick}                  
                  fitViewFunction={(fn) => (fitViewFunctions.current.tree1 = fn)}
                />
              </ReactFlowProvider>
            </Panel>
            <CustomPanelResizeHandle />
            <Panel minSize={10}>
              <ReactFlowProvider>
                <Flow
                  nodes={nodes2}
                  edges={edges2}
                  onNodesChange={onNodesChange2}
                  onEdgesChange={onEdgesChange2}
                  onConnect={onConnect2}                  
                  fitViewFunction={(fn) => (fitViewFunctions.current.tree2 = fn)}
                  />
                </ReactFlowProvider>
            </Panel>
          </PanelGroup>
        </div>
      </Panel>
      <CustomPanelResizeHandle />
      <Panel minSize={20}>
        <div style={{ padding: '1rem', height: '100%', overflow: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <input
              type="text"
              placeholder="Enter einsum expression"
              value={einsumExpression}
              onChange={handleEinsumInputChange}
              style={{ flexGrow: 1, padding: '0.5rem' }}
            />
            <button onClick={() => parseInput()} style={{ padding: '0.5rem 1rem' }}>
              Parse
            </button>
          </div>
          <NodeDataDisplay node={selectedNode} />
        </div>
      </Panel>
    </PanelGroup>
  );
};

export default EinsumTreeVisualizer;
