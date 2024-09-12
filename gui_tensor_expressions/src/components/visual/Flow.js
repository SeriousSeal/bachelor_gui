import React, { useEffect } from 'react';
import ReactFlow, {
    Background, 
    Controls,
    Handle,
    Position,
    useReactFlow
    
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

export default Flow;