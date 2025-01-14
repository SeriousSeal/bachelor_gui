import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import InfoPanel from './InfoPanel';
import { TbLayoutDistributeHorizontal } from "react-icons/tb";
import { TbEyeCancel, TbEyeCheck } from "react-icons/tb";
import { createPortal } from 'react-dom';
import { LayoutOptionType } from '../utils/constants';
import { TbPercentage } from "react-icons/tb";
import { TbHighlight, TbCheck } from "react-icons/tb";  // Add imports at the top
import { Toast } from '../common/Toast';
import { createShareableUrl } from '../utils/compression';
import ReactFlow, {
  Background,
  Controls,
  Handle,
  Position,
  ControlButton,
  Panel  // Add Panel to imports
} from 'reactflow';
import 'reactflow/dist/style.css';
import { ResponsiveProvider } from '../utils/responsiveContext';
import { scaleLinear } from 'd3-scale';

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

    const isHighlighted = data.isHighlighted;
    const isSearchResult = data.isSearchResult;

    // Choose different colors based on node state
    const getNodeStyle = () => {
      if (data.isFaulty) {
        return {
          background: '#fff',
          border: '2px solid red'
        };
      } else if (isSearchResult) {
        return {
          background: '#fff3cd',  // Light yellow background
          border: `1px solid #ffc107`  // Yellow border
        };
      } else if (isHighlighted) {
        return {
          background: '#e3f2fd',  // Original highlight blue
          border: `1px solid #2196f3`
        };
      }
      return {
        background: '#fff',
        border: '1px solid #777'
      };
    };

    const nodeStyle = getNodeStyle();

    return (
      <div style={{
        ...nodeStyle,
        opacity: (isHighlighted || isSearchResult) ? 1 : 0.7,
        borderRadius: '8px',
        width: `${displayData.nodeWidth}px`,
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

const getColorForPercentage = (percentage) => {
  const colorScale = scaleLinear()
    .domain([0, 100])
    .range(['#add8e6', '#00008b']); // Light blue to dark blue
  return colorScale(percentage);
};


const Flow = ({
  nodes = [],
  edges = [],
  onNodesChange = () => { },
  onEdgesChange = () => { },
  onConnect = () => { },
  onNodeClick: propOnNodeClick,
  tree = { getRoot: () => null },
  indexSizes = {},
  handleOptionClick = () => { },
  swapChildren = () => { },
  recalculateTreeAndOperations,
  addPermutationNode,
  removePermutationNode
}) => {
  const [hoveredNode, setHoveredNode] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [connectedNodes, setConnectedNodes] = useState([]);
  const [showPanel, setShowPanel] = useState(false);
  const [hoverEnabled, setHoverEnabled] = useState(false);
  const [showOperations, setShowOperations] = useState(false);
  const flowRef = useRef(null);
  const timeoutRef = useRef(null);
  const panelRef = useRef(null);
  const [panelPosition, setPanelPosition] = useState({ x: 0, y: 0 });
  const [showSizes, setShowSizes] = useState(false);
  const [highlightedNodes, setHighlightedNodes] = useState(new Set());
  const [highlightMode, setHighlightMode] = useState(false);
  const [searchIndices, setSearchIndices] = useState('');
  const [searchedNodes, setSearchedNodes] = useState(new Set());

  const handleSearch = useCallback((searchValue) => {
    const trimmedValue = searchValue.replace(/\s/g, '');
    setSearchIndices(trimmedValue);

    if (!trimmedValue) {
      setSearchedNodes(new Set());
      return;
    }

    const searchedIndices = trimmedValue.split(',').filter(Boolean);

    // Find all nodes that contain ALL of the searched indices
    const getAllNodesWithIndices = () => {
      const nodesWithIndices = new Set();
      nodes.forEach(node => {
        if (node.data.label) {
          // Check if node contains ALL searched indices
          const containsAllIndices = searchedIndices.every(searchIdx =>
            node.data.label.includes(searchIdx));
          if (containsAllIndices) {
            nodesWithIndices.add(node.id);
          }
        }
      });
      return nodesWithIndices;
    };

    setSearchedNodes(getAllNodesWithIndices());
  }, [nodes]);

  const { augmentedNodes, augmentedEdges } = useMemo(() => {
    if (!nodes.length) return { augmentedNodes: nodes, augmentedEdges: edges };

    const modifiedNodes = nodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        showOperations: showOperations,
        isHighlighted: highlightedNodes.has(node.id),
        isSearchResult: searchedNodes.has(node.id)  // Add this property
      }
    }));

    const modifiedEdges = edges.map(edge => {
      const defaultEdgeStyle = {
        ...edge,
        style: {
          stroke: '#b1b1b7',
          strokeWidth: 2
        }
      };

      const sourceNode = nodes.find(n => n.id === edge.source);
      if (sourceNode?.data?.operationsPercentage) {
        // Calculate color based on operations percentage
        const percentage = (sourceNode.data.operations / sourceNode.data.totalOperations) * 100;
        return {
          ...defaultEdgeStyle,
          style: {
            stroke: getColorForPercentage(percentage),
            strokeWidth: 2
          },
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
  }, [nodes, edges, showOperations, highlightedNodes, searchedNodes]);  // Added searchedNodes dependency

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
        ...{ left: lookUpNode.left },
        ...{ right: lookUpNode.right }
      };
    }
    const leftSearch = findConnectedNodes(lookUpNode.left, node);
    if (leftSearch) return leftSearch;

    return findConnectedNodes(lookUpNode.right, node);
  }, []);

  const handleNodeMouseEnter = useCallback((event, node) => {
    if (!hoverEnabled || selectedNode) return; // Früher Return wenn Hover deaktiviert ist
    if (selectedNode && !node.data.left) return; // Früher Return wenn Node keine Kinder hat
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

  const onHighlightNode = useCallback((node) => {
    const getDescendants = (nodeId) => {
      const descendants = new Set();
      const stack = [nodeId];

      while (stack.length > 0) {
        const current = stack.pop();
        descendants.add(current);
        const childEdges = augmentedEdges.filter(e => e.source === current);
        childEdges.forEach(edge => {
          stack.push(edge.target);
        });
      }
      return descendants;
    };

    const getParents = (nodeId) => {
      const parents = new Set();
      const parentEdges = augmentedEdges.filter(e => e.target === nodeId);
      parentEdges.forEach(edge => parents.add(edge.source));
      return parents;
    };

    const isChildOfHighlighted = (nodeId) => {
      const parents = getParents(nodeId);
      return Array.from(parents).some(parentId => highlightedNodes.has(parentId));
    };

    // Handle different cases
    if (highlightedNodes.has(node.id)) {
      // Case 1: Node is highlighted -> remove node and descendants
      const descendantsToRemove = getDescendants(node.id);
      const newHighlightedNodes = new Set(highlightedNodes);
      descendantsToRemove.forEach(id => newHighlightedNodes.delete(id));
      setHighlightedNodes(newHighlightedNodes);
    } else if (isChildOfHighlighted(node.id)) {
      // Case 2: Node is unhighlighted child of highlighted node -> add node only
      const newHighlightedNodes = new Set(highlightedNodes);
      const descendants = getDescendants(node.id);
      descendants.forEach(id => newHighlightedNodes.add(id));
      setHighlightedNodes(newHighlightedNodes);
    } else {
      // Case 3: Normal selection behavior
      setHighlightedNodes(getDescendants(node.id));
    }
  }, [highlightedNodes, augmentedEdges]);

  const handleNodeClick = useCallback((event, node) => {
    if (highlightMode) {
      event.preventDefault();
      onHighlightNode(node);
    } else {
      setSelectedNode(node);
      setConnectedNodes(findConnectedNodes(tree.getRoot(), node));
      if (propOnNodeClick) {
        propOnNodeClick(event, node);
      }
    }
  }, [highlightMode, propOnNodeClick, findConnectedNodes, tree, onHighlightNode]);



  const toggleHighlightMode = useCallback(() => {
    setHighlightMode(prev => !prev);
    if (highlightMode) {
      setHighlightedNodes(new Set());
    }
  }, [highlightMode]);

  const handleCreateHighlightShare = useCallback(() => {
    if (highlightedNodes.size === 0) {
      Toast.show("No nodes selected");
      return;
    }

    // Get the tree structure from the actual tree, not the visual nodes
    const hasDisconnectedNodes = (node) => {
      if (!node) return false;

      // If this node has both children
      if (node.left && node.right) {
        const isNodeHighlighted = highlightedNodes.has(node.id);
        const isLeftHighlighted = highlightedNodes.has(node.left.id);
        const isRightHighlighted = highlightedNodes.has(node.right.id);

        if (isNodeHighlighted && isLeftHighlighted !== isRightHighlighted) {
          return true;
        }
      }

      // Recursively check children
      return hasDisconnectedNodes(node.left) || hasDisconnectedNodes(node.right);
    };

    if (hasDisconnectedNodes(tree.getRoot())) {
      const shouldProceed = window.confirm(
        'Warning: You are creating a subtree that excludes necessary nodes. ' +
        'This might result in a disconnected or incomplete expression. Continue?'
      );
      if (!shouldProceed) return;
    }

    // Create a subset of indexSizes containing only the indices used in highlighted nodes
    const relevantIndices = new Set();
    nodes.forEach(node => {
      if (highlightedNodes.has(node.id) && node.data.label) {
        node.data.label.forEach(idx => relevantIndices.add(idx));
      }
    });

    const filteredSizes = {};
    relevantIndices.forEach(idx => {
      if (indexSizes[idx] !== undefined) {  // Changed from if (indexSizes[idx])
        filteredSizes[idx] = indexSizes[idx];
      }
    });

    // Create subtree expression from highlighted nodes
    const subtreeExpression = tree.createSubtreeExpression(Array.from(highlightedNodes));

    if (!subtreeExpression || Object.keys(filteredSizes).length === 0) {
      Toast.show('Failed to create share URL: Invalid data');
      return;
    }

    const url = createShareableUrl(subtreeExpression, filteredSizes);
    if (!url) {
      Toast.show('Failed to create share URL');
      return;
    }
    console.log(url);

    navigator.clipboard.writeText(url)
      .then(() => {
        Toast.show('Share URL copied to clipboard!');
        setHighlightMode(false);
        setHighlightedNodes(new Set());
      })
      .catch(err => {
        console.error('Failed to copy URL:', err);
        Toast.show('Failed to copy URL to clipboard');
      });
  }, [highlightedNodes, nodes, indexSizes, tree]);

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
    setPanelPosition({ x: rect.right + 10, y: rect.top });
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
              title="Change Layout Options"
            >
              <TbLayoutDistributeHorizontal />
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
              title={showOperations ? 'Hide Operation Percentages' : 'Show Operation Percentages'}
            >
              <TbPercentage />
            </ControlButton>
            <ControlButton
              onClick={toggleHighlightMode}
              className={`highlight-mode ${highlightMode ? 'active' : ''}`}
              title={highlightMode ? 'Exit Highlight Mode' : 'Enter Highlight Mode'}
            >
              <TbHighlight />
            </ControlButton>
            {highlightMode && (
              <ControlButton
                onClick={handleCreateHighlightShare}
                title="Create Share URL from Highlighted Nodes"
              >
                <TbCheck />
              </ControlButton>
            )}
          </Controls>
          <Background variant="dots" gap={12} size={1} />
          {!highlightMode && activeNode && (
            <div
              onMouseEnter={handlePanelMouseEnter}
              onMouseLeave={handlePanelMouseLeave}
            >
              <InfoPanel
                key={`${connectedNodes.value}-${connectedNodes.left?.value}-${connectedNodes.right?.value}`}
                node={activeNode ?? hoveredNode}
                connectedNodes={connectedNodes}
                setConnectedNodes={setConnectedNodes}
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
                recalculateTreeAndOperations={recalculateTreeAndOperations}
                addPermutationNode={addPermutationNode}
                removePermutationNode={removePermutationNode}  // Add this prop
              />
            </div>
          )}
          {showPanel && createPortal(
            <div
              ref={panelRef}
              className="fixed bg-white border border-gray-200 p-3 w-48 shadow-md rounded-md z-50 text-sm"
              style={{
                left: panelPosition.x,
                top: panelPosition.y
              }}
            >
              <h3 className="text-base font-medium mb-1">Choose a layout:</h3>
              {Object.values(LayoutOptionType).map(option => (
                <div
                  key={option}
                  className="cursor-pointer hover:bg-gray-100 rounded p-1.5 text-sm"
                  onClick={() => {
                    handleOptionClickFlow(option);
                  }}
                >
                  {`${option} `}
                </div>
              ))}
            </div>,
            document.body
          )}
          <Panel position="bottom-right" className="bg-white shadow-md rounded-md p-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={searchIndices}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search indices (e.g. 1,2,3)"
                className="p-1 border border-gray-300 rounded text-sm w-48"
              />
              {searchIndices && (
                <button
                  onClick={() => handleSearch('')}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              )}
            </div>
          </Panel>
        </ReactFlow>
      </div>
    </ResponsiveProvider>
  );
};

export default Flow;