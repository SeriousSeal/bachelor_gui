import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import InfoPanel from './InfoPanel';
import { FaBeer } from 'react-icons/fa';
import { TbEyeCancel, TbEyeCheck } from "react-icons/tb";
import { createPortal } from 'react-dom';
import { LayoutOptionType } from '../constants';
import { TbPercentage } from "react-icons/tb";
import ReactFlow, {
  Background,
  Controls,
  Handle,
  Position,
  ControlButton
} from 'reactflow';
import 'reactflow/dist/style.css';
import { ResponsiveProvider } from '../utils/ResponsiveContext';

const NODE_TYPES = {
  custom: React.memo(({ data }) => {
    // Memoize expensive calculations
    const displayData = useMemo(() => {
      const fullLabel = Array.isArray(data.label) ? data.label.join(',') : data.label;
      const maxLength = 14;
      const displayLabel = fullLabel.length <= maxLength ?
        fullLabel :
        '...' + fullLabel.slice(-(maxLength - 2));

      const minWidth = 80;
      const maxWidth = 130;
      const textWidth = displayLabel.length * 8;
      const nodeWidth = Math.min(Math.max(textWidth, minWidth), maxWidth) + 8;

      const operationPercentage = data.showOperations && data.operationsPercentage
        ? `${data.operationsPercentage.toLocaleString()}%`
        : null;

      return { displayLabel, nodeWidth, operationPercentage };
    }, [data.label, data.showOperations, data.operationsPercentage]);

    return (
      <div style={{
        background: '#fff',
        border: '1px solid #777',
        borderRadius: '8px',
        width: `${displayData.nodeWidth
          }px`,
        height: displayData.operationPercentage ? '60px' : '40px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: '14px',
        cursor: 'pointer',
        padding: '0 10px',
        transition: 'all 0.2s ease-in-out'
      }}>
        <div style={{
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',
          width: '100%',
          textAlign: 'center'
        }}>
          {displayData.displayLabel}
        </div>
        {displayData.operationPercentage && (
          <div style={{
            fontSize: '12px',
            color: '#666',
            marginTop: '2px'
          }}>
            {displayData.operationPercentage}
          </div>
        )}
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
  })
};

const colorGradient = (fadeFraction, rgbColor1, rgbColor2) => {
  var color1 = rgbColor1;
  var color2 = rgbColor2;
  var fade = fadeFraction;

  var diffRed = color2.red - color1.red;
  var diffGreen = color2.green - color1.green;
  var diffBlue = color2.blue - color1.blue;

  var gradient = {
    red: parseInt(Math.floor(color1.red + (diffRed * fade)), 10),
    green: parseInt(Math.floor(color1.green + (diffGreen * fade)), 10),
    blue: parseInt(Math.floor(color1.blue + (diffBlue * fade)), 10),
  };

  return 'rgb(' + gradient.red + ',' + gradient.green + ',' + gradient.blue + ')';
};

const getColorForPercentage = (percentage) => {
  const fadeFraction = percentage / 100;

  const redColor = { red: 255, green: 0, blue: 0 };
  const greyColor = { red: 128, green: 128, blue: 128 };

  const color = colorGradient(fadeFraction, redColor, greyColor);
  return color;
};


const Flow = ({
  nodes = [], // Provide default empty array
  edges = [], // Provide default empty array
  onNodesChange = () => { }, // Default no-op function
  onEdgesChange = () => { }, // Default no-op function
  onConnect = () => { }, // Default no-op function
  onNodeClick: propOnNodeClick,
  tree = { getRoot: () => null }, // Default empty tree
  indexSizes = {},
  fitViewFunction,
  handleOptionClick = () => { }, // Default no-op function
  swapChildren = () => { } // Default no-op function
}) => {
  const [hoveredNode, setHoveredNode] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [connectedNodes, setConnectedNodes] = useState([]);
  const [showPanel, setShowPanel] = useState(false);
  const [hoverEnabled, setHoverEnabled] = useState(true);
  const [showOperations, setShowOperations] = useState(false);
  const flowRef = useRef(null);
  const timeoutRef = useRef(null);
  const panelRef = useRef(null);
  const [panelPosition, setPanelPosition] = useState({ x: 0, y: 0 });
  const [showSizes, setShowSizes] = useState(false);


  const { augmentedNodes, augmentedEdges } = useMemo(() => {
    if (!nodes.length) return { augmentedNodes: nodes, augmentedEdges: edges };

    const modifiedNodes = nodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        showOperations: showOperations,
      }
    }));

    const modifiedEdges = edges.map(edge => {
      // Default edge style for edges without percentages
      const defaultEdgeStyle = {
        ...edge,
        style: {
          stroke: '#b1b1b7',
          strokeWidth: 2
        }
      };

      const sourceNode = nodes.find(n => n.id === edge.source);
      if (sourceNode?.data?.operationsPercentage) {
        return {
          ...defaultEdgeStyle,
          style: {
            stroke: getColorForPercentage(sourceNode.data.normalizedPercentage),
            strokeWidth: 2
          },
          // No animationDirection specified - this will make it flow from source to target
          labelStyle: { fill: '#666', fontSize: '10px' },
          labelBgStyle: { fill: 'rgba(255, 255, 255, 0.8)' }
        };
      }

      return defaultEdgeStyle;
    });

    return {
      augmentedNodes: modifiedNodes,
      augmentedEdges: modifiedEdges
    };
  }, [nodes, edges, showOperations]);

  const toggleOperations = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setShowOperations(prev => !prev);
    }, 100);
  }, []);

  const handleOptionClickFlow = useCallback((option) => {
    setShowPanel(false);
    handleOptionClick(option);
  }, [handleOptionClick]);

  const toggleHoverBehavior = useCallback(() => {
    setHoverEnabled(prev => !prev);
    if (hoverEnabled && !selectedNode) {
      setHoveredNode(null);
      setConnectedNodes([]);
    }
  }, [hoverEnabled, selectedNode]);

  const findConnectedNodes = useCallback((lookUpNode, node) => {
    if (!lookUpNode) return null;
    if (lookUpNode.id === node.id) {
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
    if (!hoverEnabled || selectedNode) return; // Früher Return wenn Hover deaktiviert ist
    if (selectedNode && !node.data.right) return; // Früher Return wenn Node keine Kinder hat
    console.log(node)

    clearTimeout(timeoutRef.current);
    setHoveredNode(node);
    setConnectedNodes(findConnectedNodes(tree.getRoot(), node));
  }, [findConnectedNodes, tree, hoverEnabled, selectedNode]);

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
    if (propOnNodeClick) {
      propOnNodeClick(event, node);
    }
  }, [findConnectedNodes, propOnNodeClick, tree]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const isClickInsidePanel = panelRef.current && panelRef.current.contains(event.target);
      const isClickOnControlButton = event.target.closest('.react-flow__controls-button');

      if (showPanel && !isClickInsidePanel && !isClickOnControlButton) {
        setShowPanel(false);
      }
    };

    document.addEventListener('pointerdown', handleClickOutside, true);

    return () => {
      document.removeEventListener('pointerdown', handleClickOutside, true);
    };
  }, [showPanel, indexSizes]);

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

  const handleToggleSizes = useCallback(() => {
    setShowSizes(prev => !prev);
  }, []);

  // Add handler for swap operation
  const handleSwapChildren = useCallback(async (node) => {
    // Wait for the tree to be updated
    const updatedTree = await swapChildren(node);

    if (updatedTree) {
      // Get the updated connected nodes from the new tree
      const updatedConnectedNodes = findConnectedNodes(updatedTree.getRoot(), node);

      // Update the states with the new data
      setConnectedNodes(updatedConnectedNodes);
      setSelectedNode(node);
    }
  }, [swapChildren, findConnectedNodes]);

  const activeNode = selectedNode || hoveredNode;

  return (
    <ResponsiveProvider>
      <div style={{ width: '100%', height: '100%' }}>
        <ReactFlow
          ref={flowRef}
          nodes={augmentedNodes}
          edges={augmentedEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={NODE_TYPES}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.1}
          maxZoom={4}
          style={{ width: '100%', height: '100%' }}
          onNodeClick={handleNodeClick}
          onNodeMouseEnter={handleNodeMouseEnter}
          onNodeMouseLeave={handleNodeMouseLeave}
          nodesDraggable={false}
          proOptions={{ hideAttribution: true }}
        >
          <Controls>
            <ControlButton
              onClick={handleControlButtonClick}
            >
              <FaBeer />
            </ControlButton>
            <ControlButton
              onClick={toggleHoverBehavior}
              className={`hover - toggle ${hoverEnabled ? 'active' : ''} `}
              title={hoverEnabled ? 'Disable Hover' : 'Enable Hover'}
            >
              {hoverEnabled ? <TbEyeCheck /> : <TbEyeCancel />}
            </ControlButton>
            <ControlButton
              onClick={toggleOperations}
              className={`operations - toggle ${showOperations ? 'active' : ''} `}
              title={showOperations ? 'Hide Operations' : 'Show Operations'}
            >
              <TbPercentage />
            </ControlButton>
          </Controls>
          <Background variant="dots" gap={12} size={1} />
          {activeNode && connectedNodes.left && (
            <div
              onMouseEnter={handlePanelMouseEnter}
              onMouseLeave={handlePanelMouseLeave}
            >
              <InfoPanel
                key={`${connectedNodes.value}-${connectedNodes.left?.value}-${connectedNodes.right?.value}`}
                node={activeNode ?? hoveredNode}
                connectedNodes={connectedNodes}
                onClose={() => {
                  setSelectedNode(null);
                  setHoveredNode(null);
                  setConnectedNodes([]);
                }}
                initialPosition={{ x: 12, y: 8 }}
                indexSizes={indexSizes}
                showSizes={showSizes}
                onToggleSizes={handleToggleSizes}
                swapChildren={handleSwapChildren}
              />
            </div>
          )}
          {showPanel && createPortal(
            <div
              ref={panelRef}
              className="fixed bg-white border border-gray-200 p-3 w-48 shadow-md rounded-md z-50 text-sm"
              style={{
                left: `${panelPosition.x} px`,
                top: `${panelPosition.y} px`
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
                  {`Option ${option.slice(-1)} `}
                </div>
              ))}
            </div>,
            document.body
          )}
        </ReactFlow>
      </div>
    </ResponsiveProvider>
  );
};

export default Flow;