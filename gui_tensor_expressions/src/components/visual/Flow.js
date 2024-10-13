import React, { useEffect, useState, useCallback, useRef } from 'react';
import InfoPanel from './InfoPanel';
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
      cursor: 'pointer',
    }}>
      {data.label}
      <Handle type="target" position={Position.Top} style={{ visibility: 'hidden' }} />
      <Handle type="source" position={Position.Bottom} style={{ visibility: 'hidden' }} />
    </div>
);

const nodeTypes = {
  custom: CustomNode,
};




const Flow = ({ nodes, edges, onNodesChange, onEdgesChange, onConnect, onNodeClick, tree, fitViewFunction  }) => {
    const { fitView, getViewport } = useReactFlow();
    const [hoveredNode, setHoveredNode] = useState(null);
    const [selectedNode, setSelectedNode] = useState(null);
    const [connectedNodes, setConnectedNodes] = useState([]);
    const flowRef = useRef(null);
    const timeoutRef = useRef(null);

    const findConnectedNodes = useCallback((lookUpNode, node) => {
      if(!lookUpNode) return null;
      if (lookUpNode.value === node.data.label) {
        // Return the left and right children if found
        return {
          value: lookUpNode.value,
          left: lookUpNode.left || null,   // Return left child, or null if it doesn't exist
          right: lookUpNode.right || null  // Return right child, or null if it doesn't exist
        };
      }
      const leftSearch = findConnectedNodes(lookUpNode.left, node);
      if (leftSearch) return leftSearch;
      
      return findConnectedNodes(lookUpNode.right, node);
    }, []);

    const handleNodeMouseEnter = useCallback((event, node) => {
      clearTimeout(timeoutRef.current);
      setHoveredNode(node);
      setConnectedNodes(findConnectedNodes(tree.getRoot(),node));
    }, [findConnectedNodes, tree]);
  
    const handleNodeMouseLeave = useCallback(() => {
      timeoutRef.current = setTimeout(() => {
        if (!selectedNode) {
          setHoveredNode(null);
          setConnectedNodes([]);
        }
      }, 100);
    }, [selectedNode]);

    const handleNodeClick = useCallback((event, node) => {
      event.preventDefault();
      setSelectedNode(node);
      setConnectedNodes(findConnectedNodes(tree.getRoot(), node));
      if (onNodeClick) {
        onNodeClick(event, node);
      }
    }, [findConnectedNodes, onNodeClick, tree]);

    const swapChildren = useCallback(() => {
      console.log('Swapping children of node:', selectedNode || hoveredNode);
      // Implement the swap logic here
    }, [selectedNode, hoveredNode]);

    const showContraction = useCallback(() => {
      console.log('Showing contraction of node:', selectedNode || hoveredNode);
      // Implement the show contraction logic here
    }, [selectedNode, hoveredNode]);

    useEffect(() => {
      const timer = setTimeout(() => {
        fitView({ padding: 0.2, includeHiddenNodes: false });
      }, 0);
      return () => clearTimeout(timer);
    }, [fitView]);
  
    useEffect(() => {
      if (fitViewFunction) {
        fitViewFunction(() => fitView({ padding: 0.2, includeHiddenNodes: false }));
      }
    }, [fitView, fitViewFunction]);

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (flowRef.current && !flowRef.current.contains(event.target)) {
          setSelectedNode(null);
          setHoveredNode(null);
          setConnectedNodes([]);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, []);

    useEffect(() => {
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }, []);

    const handlePanelMouseEnter = useCallback(() => {
      clearTimeout(timeoutRef.current);
    }, []);

    const handlePanelMouseLeave = useCallback(() => {
      if (!selectedNode) {
        timeoutRef.current = setTimeout(() => {
          setHoveredNode(null);
          setConnectedNodes([]);
        }, 100);
      }
    }, [selectedNode]);

    const activeNode = selectedNode || hoveredNode;

    const getInitialPanelPosition = useCallback((node) => {
      const { x, y, zoom } = getViewport();
      const panelWidth = 320;  // Width of the InfoPanel
      const panelHeight = 200;  // Height of the InfoPanel
    
      // Calculate potential positions
      const leftPosition = {
        x: (node.position.x * zoom + x) - panelWidth - node.width - 10, // Adjust for offset
        y: (node.position.y * zoom + y) - panelHeight/2, // Adjust for offset
      };
      const rightPosition = {
        x: (node.position.x * zoom + x) + node.width*2,
        y: (node.position.y * zoom + y) - panelHeight/2,
      };

    
      // Get viewport dimensions using getBoundingClientRect
      const { width: viewportWidth, height: _ } = document.documentElement.getBoundingClientRect();
    
      // Check if positions fit in the viewport
      const fitsLeft = leftPosition.x >= 0; // Must not overflow the left boundary
      const fitsRight = rightPosition.x + panelWidth <= viewportWidth; // Must not overflow the right boundary
    

      // Select the best position based on available space
      if (fitsLeft) return leftPosition;
      if (fitsRight) return rightPosition;
      // Default to above position if none fit
      return leftPosition; // Fallback to above if none fit
    }, [getViewport]);

    return (
      <ReactFlow
        ref={flowRef}
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
        onNodeClick={handleNodeClick}
        onNodeMouseEnter={handleNodeMouseEnter}
        onNodeMouseLeave={handleNodeMouseLeave}
        nodesDraggable={false}
      >
        <Controls />
        <Background variant="dots" gap={12} size={1} />
        
        {activeNode && (
          <div 
            onMouseEnter={handlePanelMouseEnter}
            onMouseLeave={handlePanelMouseLeave}
          >
            <InfoPanel
              node={activeNode}
              connectedNodes={connectedNodes}
              onSwapChildren={swapChildren}
              onShowContraction={showContraction}
              onClose={() => {
                setSelectedNode(null);
                setHoveredNode(null);
                setConnectedNodes([]);
              }}
              initialPosition={getInitialPanelPosition(activeNode)}
            />
          </div>
        )}
      </ReactFlow>
    );
  };

export default Flow;