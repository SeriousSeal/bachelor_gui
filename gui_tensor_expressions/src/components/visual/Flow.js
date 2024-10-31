import React, { useEffect, useState, useCallback, useRef } from 'react';
import InfoPanel from './InfoPanel';
import { FaBeer } from 'react-icons/fa';
import { createPortal } from 'react-dom';
import { LayoutOptionType } from '../constants';	
import ReactFlow, {
    Background, 
    Controls,
    Handle,
    Position,
    useReactFlow,
    ControlButton
} from 'reactflow';
import 'reactflow/dist/style.css';

const CustomNode = ({ data }) => {
  // Convert array to string and get total length
  const fullLabel = Array.isArray(data.label) ? data.label.join('') : data.label;
  
  // Truncate text if it's longer than 15 characters
  const truncateText = (text, maxLength = 14) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength-2) + '...';
  };

  
  // Set width boundaries
  const minWidth = 60;
  const maxWidth = 120;

  const displayLabel = truncateText(fullLabel, maxWidth / 8);
  const textWidth = displayLabel.length * 8;
  
  // Calculate the ideal width based on visible text length
  // Assuming average character width is ~8px at 14px font size

  
  // Calculate actual width within bounds
  const nodeWidth = (Math.min(Math.max(textWidth, minWidth), maxWidth)) + 8;
  

  return (
          <div style={{ 
            background: '#fff', 
            border: '1px solid #777', 
            borderRadius: '8px', 
            width: `${nodeWidth}px`,
            height: '40px', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            fontSize: '14px',
            cursor: 'pointer',
            padding: '0 10px',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
            transition: 'width 0.2s ease-in-out'
          }}>
            {displayLabel}
            <Handle 
              type="target" 
              position={Position.Top} 
              style={{ visibility: 'hidden' }} 
            />
            <Handle 
              type="source" 
              position={Position.Bottom} 
              style={{ visibility: 'hidden' }} 
            />
          </div>
  );
};


const nodeTypes = {
  custom: CustomNode,
};




const Flow = ({ nodes, edges, onNodesChange, onEdgesChange, onConnect, onNodeClick, tree, fitViewFunction, handleOptionClick  }) => {
    const { fitView } = useReactFlow();
    const [hoveredNode, setHoveredNode] = useState(null);
    const [selectedNode, setSelectedNode] = useState(null);
    const [connectedNodes, setConnectedNodes] = useState([]);
    const [showPanel, setShowPanel] = useState(false);
    const flowRef = useRef(null);
    const timeoutRef = useRef(null);
    const panelRef = useRef(null);
    const [panelPosition, setPanelPosition] = useState({ x: 0, y: 0 });
    const reactFlowWrapperRef = useRef(null);

  
    const handleOptionClickFlow = (option) => {
      setShowPanel(false);
      handleOptionClick(option);
    };
  

    const findConnectedNodes = useCallback((lookUpNode, node) => {
      if(!lookUpNode) return null;
      if (lookUpNode.value === node.data.label) {
        return {
          value: lookUpNode.value,
          ...(lookUpNode.right && { left: lookUpNode.left }),
          ...(lookUpNode.left && { right: lookUpNode.right })
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
      const handleGlobalClick = (event) => {
        const isClickInPanel = panelRef.current?.contains(event.target);
        const isClickOnControlButton = event.target.closest('.react-flow__controls');

        if (!isClickInPanel && !isClickOnControlButton) {
          setShowPanel(false);
        }
      };

      document.addEventListener('click', handleGlobalClick);
      return () => {
        document.removeEventListener('click', handleGlobalClick);
      };
    }, []);

    const handleControlButtonClick = useCallback((event) => {
        const button = event.currentTarget;
        const rect = button.getBoundingClientRect();
        setPanelPosition({ x: rect.x, y: rect.y });
        setShowPanel(prev => !prev);
    }, []);

    // Update panel position when ReactFlow transforms
    useEffect(() => {
        const updatePanelPosition = () => {
            const button = document.querySelector('.react-flow__controls button:last-child');
            if (button && showPanel) {
              const { left, top, width } = button.getBoundingClientRect();
              const viewportWidth = window.innerWidth;
              const panelWidth = panelRef.current.offsetWidth;
              
              // Calculate panel position
              let newLeft = left + width + 10;
              let newTop = top;
        
              // Adjust if panel would overflow right side
              if (newLeft + panelWidth > viewportWidth) {
                newLeft = left - panelWidth - 10;
              }
        
              // Ensure panel stays within viewport
              newLeft = Math.max(10, Math.min(newLeft, viewportWidth - panelWidth - 10));
              newTop = Math.max(10, newTop);
                setPanelPosition({ x: newLeft, y: newTop });
            }
        };

        const observer = new ResizeObserver(updatePanelPosition);
        const reactFlowWrapper = reactFlowWrapperRef.current;
        
        if (reactFlowWrapper) {
            observer.observe(reactFlowWrapper);
        }

        return () => {
            if (reactFlowWrapper) {
                observer.disconnect();
            }
        };
    }, [showPanel]);

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


//   const getInitialPanelPosition = useCallback((node) => {
//     const { x, y, zoom } = getViewport();
//     const panelWidth = 320;  // Width of the InfoPanel
//     const panelHeight = 200;  // Height of the InfoPanel
//   
//     // Calculate potential positions
//     const leftPosition = {
//       x: (node.position.x * zoom + x) - panelWidth - node.width - 100, // Adjust for offset
//       y: (node.position.y * zoom + y) - panelHeight/2, // Adjust for offset
//     };
//     const rightPosition = {
//       x: (node.position.x * zoom + x) + node.width*2,
//       y: (node.position.y * zoom + y) - panelHeight/2,
//     };
//
//    
//      // Get viewport dimensions using getBoundingClientRect
//      const { width: viewportWidth, height: _ } = document.documentElement.getBoundingClientRect();
//    
//      // Check if positions fit in the viewport
//      const fitsLeft = leftPosition.x >= 0; // Must not overflow the left boundary
//      const fitsRight = rightPosition.x + panelWidth <= viewportWidth; // Must not overflow the right boundary
//    
//
//      // Select the best position based on available space
//      if (fitsLeft) return leftPosition;
//      if (fitsRight) return rightPosition;
//      // Default to above position if none fit
//      return leftPosition; // Fallback to above if none fit
//    }, [getViewport]);

    return (
      <div ref={reactFlowWrapperRef} style={{ width: '100%', height: '100%' }}>
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
          <Controls>
            <ControlButton onClick={handleControlButtonClick}>
              <FaBeer />
            </ControlButton>
          </Controls>
          <Background variant="dots" gap={12} size={1} />
          
          {activeNode && connectedNodes.left && (
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
                initialPosition={{ x: 20, y: 20 }}
              />
            </div>
          )}
          {showPanel && createPortal(
              <div
                  ref={panelRef}
                  className="fixed bg-white border border-gray-200 p-3 w-48 shadow-md rounded-md z-50 text-sm"
                  style={{
                      left: `${panelPosition.x}px`,
                      top: `${panelPosition.y}px`
                  }}
              >
                  <h3 className="text-base font-medium mb-1">Choose an option:</h3>
                  {Object.values(LayoutOptionType).map(option => (
                      <div
                          key={option}
                          className="cursor-pointer hover:bg-gray-100 rounded p-1.5 text-sm"
                          onClick={() => {
                            handleOptionClickFlow(option);
                              // Additional logic like closing the panel
                          }}
                      >
                          {`Option ${option.slice(-1)}`}
                      </div>
                  ))}
              </div>,
              document.body
          )}
        </ReactFlow>
      </div>
    );
  };

export default Flow;