import React, { useState, useCallback } from 'react';
import ReactFlow, { 
  addEdge, 
  Background, 
  Controls, 
  MiniMap, 
  useNodesState, 
  useEdgesState 
} from 'reactflow';
import 'reactflow/dist/style.css';

const initialNodes = [
  { id: '1', data: { label: 'Input Tensor A' }, position: { x: 250, y: 5 } },
  { id: '2', data: { label: 'Input Tensor B' }, position: { x: 100, y: 100 } },
  { id: '3', data: { label: 'Contraction AB' }, position: { x: 250, y: 200 } },
  { id: '4', data: { label: 'Output Tensor' }, position: { x: 250, y: 300 } },
];

const initialEdges = [
  { id: 'e1-3', source: '1', target: '3' },
  { id: 'e2-3', source: '2', target: '3' },
  { id: 'e3-4', source: '3', target: '4' },
];

const EinsumTreeVisualizer = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [einsumExpression, setEinsumExpression] = useState('');
  const [selectedNode, setSelectedNode] = useState(null);

  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  const handleEinsumInputChange = (event) => {
    setEinsumExpression(event.target.value);
    // Here you would parse the einsum expression and update the tree
  };

  const handleNodeClick = (event, node) => {
    setSelectedNode(node);
  };


  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ margin: '1rem', padding: '1rem', border: '1px solid #ccc', borderRadius: '4px' }}>
        <h2>Einsum Tree Visualizer</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input
            type="text"
            placeholder="Enter einsum expression"
            value={einsumExpression}
            onChange={handleEinsumInputChange}
            style={{ flexGrow: 1, padding: '0.5rem' }}
          />
          <button onClick={() => console.log("Parse einsum expression")} style={{ padding: '0.5rem 1rem' }}>
            Parse
          </button>
        </div>
      </div>
      <div style={{ flexGrow: 1 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={handleNodeClick}
        >
          <Controls />
          <MiniMap />
          <Background variant="dots" gap={12} size={1} />
        </ReactFlow>
      </div>
      {selectedNode && (
        <div style={{ margin: '1rem', padding: '1rem', border: '1px solid #ccc', borderRadius: '4px' }}>
          <h3>Node Details: {selectedNode.data.label}</h3>
          <p>ID: {selectedNode.id}</p>
          <p>Type: {selectedNode.type || 'Default'}</p>
        </div>
      )}
    </div>
  );
};

export default EinsumTreeVisualizer;