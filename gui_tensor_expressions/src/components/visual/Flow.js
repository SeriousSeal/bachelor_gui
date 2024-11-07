import React, { useEffect, useState, useCallback, useRef } from 'react';
import InfoPanel from './InfoPanel';
import { FaBeer } from 'react-icons/fa';
import { TbEyeCancel, TbEyeCheck } from "react-icons/tb";
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
  const fullLabel = Array.isArray(data.label) ? data.label.join(',') : data.label;

  // Truncate text from the front if it's longer than specified length
  const truncateText = (text, maxLength = 14) => {
    if (text.length <= maxLength) return text;
    return '...' + text.slice(-(maxLength-2));
  };

  // Set width boundaries
  const minWidth = 60;
  const maxWidth = 120;

  const displayLabel = truncateText(fullLabel, maxWidth / 8);
  const textWidth = displayLabel.length * 8;

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
    const [hoverEnabled, setHoverEnabled] = useState(true); 
    const flowRef = useRef(null);
    const timeoutRef = useRef(null);
    const panelRef = useRef(null);
    const [panelPosition, setPanelPosition] = useState({ x: 0, y: 0 });

  
    const handleOptionClickFlow = (option) => {
      setShowPanel(false);
      handleOptionClick(option);
    };
  
    const toggleHoverBehavior = useCallback(() => {
      setHoverEnabled(prev => !prev);
      // Wenn Hover deaktiviert wird, setze hover-bezogene States zurück
      if (hoverEnabled && !selectedNode) {
        setHoveredNode(null);
        setConnectedNodes([]);
      }
    }, [hoverEnabled, selectedNode]);

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
      if (!hoverEnabled) return; // Früher Return wenn Hover deaktiviert ist
      if (selectedNode && !node.data.left && !node.data.right) return; // Früher Return wenn Node keine Kinder hat
      console.log(node)
      
      clearTimeout(timeoutRef.current);
      setHoveredNode(node);
      setConnectedNodes(findConnectedNodes(tree.getRoot(), node));
    }, [findConnectedNodes, tree, hoverEnabled]);
  
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

    // Add click outside handler
    useEffect(() => {
      const handleClickOutside = (event) => {
          const isClickInsidePanel = panelRef.current && panelRef.current.contains(event.target);
          const isClickOnControlButton = event.target.closest('.react-flow__controls-button');
  
          if (showPanel && !isClickInsidePanel && !isClickOnControlButton) {
              setShowPanel(false);
          }
      };
  
      document.addEventListener('pointerdown', handleClickOutside, true); // true for capture phase
      
      return () => {
          document.removeEventListener('pointerdown', handleClickOutside, true);
      };
  }, [showPanel]);

  const handleControlButtonClick = useCallback((event) => {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    setPanelPosition({ x: rect.x + 30, y: rect.y });
    setShowPanel(prev => !prev);
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

    return (
      <div style={{ width: '100%', height: '100%' }}>
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
            <ControlButton 
              onClick={handleControlButtonClick}
            >
              <FaBeer />
            </ControlButton>
            <ControlButton 
              onClick={toggleHoverBehavior}
              className={`hover-toggle ${hoverEnabled ? 'active' : ''}`}
              title={hoverEnabled ? 'Disable Hover' : 'Enable Hover'}
            >
              {/* Sie können hier ein passendes Icon einsetzen */}
              {hoverEnabled ? <TbEyeCheck />: <TbEyeCancel />}
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