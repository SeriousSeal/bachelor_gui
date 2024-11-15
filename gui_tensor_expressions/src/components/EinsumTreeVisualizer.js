import React, { useState, useCallback, useRef } from 'react';
import { Panel, PanelGroup } from 'react-resizable-panels';
import { Tree } from './EinsumContractionTree';
import Flow from './visual/Flow';
import HistoryPanel from './visual/HistoryPanel';
import IndexSizeInput from './visual/IndexSizeInput';
import CollapsiblePanel from './visual/CollapsiblePanel';
import CustomPanelResizeHandle from './visual/CustomPanelResizeHandle';
import buildVisualizationTree from './visual_Tree';
import { LayoutOptionType } from './constants';
import { calculateTotalOperations } from './dimsAndOps';
import {
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState
} from 'reactflow';
import 'reactflow/dist/style.css';



const EinsumTreeVisualizer = () => {
  const [nodes1, setNodes1, onNodesChange1] = useNodesState();
  const [edges1, setEdges1, onEdgesChange1] = useEdgesState();
  const [einsumExpression, setEinsumExpression] = useState('');
  const [selectedNode, setSelectedNode] = useState(null);
  const [tree, setTree] = useState(null);
  const [indexSizes, setIndexSizes] = useState({});
  const [history, setHistory] = useState([]);
  const [dataType, setDataType] = useState('4'); // Default data type  
  const [sizeUnit, setSizeUnit] = useState('KiB'); // Default size unit
  const [totalOperations, setTotalOperations] = useState(0);
  const [selectedNodeOperations, setSelectedNodeOperations] = useState(0);

  const fitViewFunctions = useRef({ tree1: null });
  const onConnect1 = useCallback((params) => setEdges1((eds) => addEdge(params, eds)), [setEdges1]);

  const handleEinsumInputChange = (event) => {
    setEinsumExpression(event.target.value);
  };

  const onNodeClick = (_, node) => {
    console.log(node)
    setSelectedNode(node);
    if (node.data && node.data.left && node.data.right) {
      setSelectedNodeOperations(node.data.operations);
    } else {
      setSelectedNodeOperations(0);
    }
  };

  const handleTreeUpdate = (indexSizes) => {
    tree.updateIndexSizes(indexSizes);

    // Calculate new total operations and update tree nodes
    const totalOps = calculateTotalOperations(indexSizes, tree.getRoot());
    setTotalOperations(totalOps);

    // Update nodes with new operation values
    const updatedNodes = nodes1.map(node => {
      if (node.data && node.data.left && node.data.right) {
        const nodeInTree = findNodeInTree(tree.getRoot(), node.id);
        if (nodeInTree) {
          return {
            ...node,
            data: {
              ...node.data,
              operations: nodeInTree.operations,
              operationsPercentage: nodeInTree.operationsPercentage,
              totalOperations: nodeInTree.totalOperations
            }
          };
        }
      }
      return node;
    });

    setNodes1(updatedNodes);

    // Update history
    setHistory(prevHistory => {
      if (prevHistory.length === 0) return prevHistory;

      return [
        {
          ...prevHistory[0],
          indexSizes: indexSizes,
          tree: tree,
          nodes: updatedNodes,
        },
        ...prevHistory.slice(1)
      ];
    });
  };

  // Helper function to find node in tree by label
  const findNodeInTree = (treeNode, id) => {
    if (!treeNode) return null;

    if (treeNode.id === id) {
      return treeNode;
    }

    const leftResult = findNodeInTree(treeNode.left, id);
    if (leftResult) return leftResult;

    return findNodeInTree(treeNode.right, id);
  };

  const parseInput = (einsumExpression) => {

    const input = einsumExpression || "[41,10,11],[[9,10,24,25],[[[63,87,11],[81,87,24,25]->[11,24,25,63,81]],[[86,65,63],[[[[77,65,53,70],[70,75,81]->[53,65,75,77,81]],[[53,83,61],[61,75,22,23]->[22,23,53,75,83]]->[22,23,65,77,81,83]],[[[47,8,9],[7,8,22,23]->[7,9,22,23,47]],[[[31,40,41],[[39,40,46,47],[46,6,7]->[6,7,39,40,47]]->[6,7,31,39,41,47]],[[[[54,60,66],[[[59,76,77],[82,76,52,54]->[52,54,59,77,82]],[[85,57,82],[[64,78,85,59],[[79,78,86],[[80,79],[80,58,64]->[58,64,79]]->[58,64,78,86]]->[58,59,85,86]]->[57,58,59,82,86]]->[52,54,57,58,77,86]]->[52,57,58,60,66,77,86]],[[[52,84,71],[[45,4,5],[[3,4,18,19],[71,60,18,19]->[3,4,60,71]]->[3,5,45,60,71]]->[3,5,45,52,60,84]],[[[[33,38,39],[37,38,44,45]->[33,37,39,44,45]],[[32,36,37],[[29,30,32,33],[[26,28,29],[[26,27],[27,30,31]->[26,30,31]]->[28,29,30,31]]->[28,31,32,33]]->[28,31,33,36,37]]->[28,31,36,39,44,45]],[[44,2,3],[[[1,2,16,17],[74,84,16,17]->[1,2,74,84]],[[[28,34,35],[[35,36,42,43],[43,0,1]->[0,1,35,36,42]]->[0,1,28,34,36,42]],[[[42,50,51],[51,0,14,15]->[0,14,15,42,50]],[[[[68,69,12,13],[[58,55,67],[55,48,68]->[48,58,67,68]]->[12,13,48,58,67,69]],[[[67,57,62,72],[72,56,74]->[56,57,62,67,74]],[[62,69,73],[73,56,14,15]->[14,15,56,62,69]]->[14,15,57,67,69,74]]->[12,13,14,15,48,57,58,74]],[[34,48,49],[49,50,12,13]->[12,13,34,48,50]]->[14,15,34,50,57,58,74]]->[0,34,42,57,58,74]]->[1,28,36,57,58,74]]->[2,28,36,57,58,84]]->[3,28,36,44,57,58,84]]->[3,31,39,45,57,58,84]]->[5,31,39,52,57,58,60]]->[5,31,39,66,77,86]],[[5,6,20,21],[66,83,20,21]->[5,6,66,83]]->[6,31,39,77,83,86]]->[7,41,47,77,83,86]]->[9,22,23,41,77,83,86]]->[9,41,65,81,86]]->[9,41,63,81]]->[9,11,24,25,41]]->[10,11,25,41]]->[11,25]";
    const tree = new Tree(input);
    const unorderedTree = tree.getRoot();
    if (!unorderedTree) return;
    setTree(tree);

    let newIndexSizes = {};

    const traverseTree = (unorderedTree) => {
      if (!unorderedTree) return;
      if (unorderedTree.value && Array.isArray(unorderedTree.value)) {
        for (const indice of unorderedTree.value) {
          if (!newIndexSizes[indice]) {
            newIndexSizes[indice] = 2; // Default size, adjust as needed
          }
        }
      }
      traverseTree(unorderedTree.left);
      traverseTree(unorderedTree.right);
    };
    traverseTree(unorderedTree);
    setIndexSizes(newIndexSizes);

    // Calculate total operations
    const totalOps = calculateTotalOperations(newIndexSizes, unorderedTree);
    setTotalOperations(totalOps);
    console.log(unorderedTree)


    const { nodes, edges } = buildVisualizationTree(unorderedTree);

    setNodes1(nodes);
    setEdges1(edges);



    // Update history
    setHistory(prevHistory => {
      const newItem = { expression: input, nodes, edges, indexSizes: newIndexSizes, tree: tree };
      const existingIndex = prevHistory.findIndex(item => item.expression === input);

      let updatedHistory;
      if (existingIndex !== -1) {
        updatedHistory = [
          newItem,
          ...prevHistory.slice(0, existingIndex),
          ...prevHistory.slice(existingIndex + 1)
        ];
      } else {
        updatedHistory = [newItem, ...prevHistory];
      }

      return updatedHistory.slice(0, 5);
    });



    setTimeout(() => fitView('tree1'), 0);
  };

  const handleDataTypeChange = (event) => {
    setDataType(event.target.value);
  };

  const handleSizeUnitChange = (event) => {
    setSizeUnit(event.target.value);
  };

  const selectTreeFromHistory = (item) => {
    setNodes1(item.nodes);
    setEdges1(item.edges);
    setIndexSizes(item.indexSizes);
    setEinsumExpression(item.expression);
    setTree(item.tree);
    setTimeout(() => fitView('tree1'), 0);
  };

  const fitView = (tree) => {
    fitViewFunctions.current[tree]?.();
  };


  const calculateStrides = (indices) => {
    if (!Array.isArray(indices)) return [];

    let stride = 1;
    const strides = new Array(indices.length).fill(0);

    for (let i = indices.length - 1; i >= 0; i--) {
      strides[i] = stride;
      stride *= Math.max(1, Math.floor(indexSizes[indices[i]] || 1));
    }

    return strides;
  };

  const renderIndices = (indices) => {
    if (!Array.isArray(indices)) return null;

    const strides = calculateStrides(indices);

    return indices.map((index, i) => (
      <div key={i} className="flex  mr-4 ">
        <span className="text-xl mr-2">{index}</span>
        <span className="text-lg text-gray-600">
          = {strides[i] === 1 ? 'unit' : strides[i]}
        </span>
      </div>
    ));
  };

  const formatSize = (size) => {
    if (sizeUnit === 'MiB') {
      return `${Number((size / (1024 * 1024)).toFixed(2)).toLocaleString()} MiB`;
    } else if (sizeUnit === 'KiB') {
      return `${Number((size / 1024).toFixed(2)).toLocaleString()} KiB`;
    } else {
      return `${Number(size.toFixed(2)).toLocaleString()} Bytes`;
    }
  };

  const tensorSizes = (indices) => {
    if (!Array.isArray(indices)) return 0;

    let size = dataType === '4' ? 4 : 8; // Base size in bytes

    indices.forEach(index => {
      if (indexSizes[index]) {
        size *= Math.max(1, Math.floor(indexSizes[index]));
      }
    });

    return size;
  };


  const handleOptionClick = (option) => {
    switch (option) {
      case LayoutOptionType.Option1:
        console.log('Processing Option 1');
        // Add specific logic for Option 1
        break;
      case LayoutOptionType.Option2:
        console.log('Processing Option 2');
        // Add specific logic for Option 2
        break;
      case LayoutOptionType.Option3:
        console.log('Processing Option 3');
        // Add specific logic for Option 3
        break;
      case LayoutOptionType.Option4:
        console.log('Processing Option 4');
        // Add specific logic for Option 4
        break;
      default:
        console.log('Unknown option selected');
    }
  };

  return (
    <div className="h-screen bg-gray-50">
      <PanelGroup direction="horizontal" className="h-full">
        <Panel defaultSize={50} minSize={20}>
          <div className="h-full border border-gray-200 rounded-lg overflow-hidden shadow-lg">
            <PanelGroup direction="vertical">
              <Panel defaultSize={70} minSize={10}>
                <ReactFlowProvider>
                  <Flow
                    nodes={nodes1}
                    edges={edges1}
                    onNodesChange={onNodesChange1}
                    onEdgesChange={onEdgesChange1}
                    onConnect={onConnect1}
                    onNodeClick={onNodeClick}
                    tree={tree}
                    totalOperations={totalOperations}
                    fitViewFunction={(fn) => (fitViewFunctions.current.tree1 = fn)}
                    handleOptionClick={handleOptionClick}
                  />
                </ReactFlowProvider>
              </Panel>
              <CustomPanelResizeHandle />
              <Panel minSize={10}>
                <div className="p-4 bg-white rounded-lg shadow-lg mb-4 h-full overflow-y-auto">
                  <div className="flex flex-col">
                    <div className="flex items-center mb-4">
                      <div className="mr-4 flex-1">
                        <h3 className="text-lg font-semibold">Select Data Type:</h3>
                        <select
                          value={dataType}
                          onChange={handleDataTypeChange}
                          className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="4">4 Bytes</option>
                          <option value="8">8 Bytes</option>
                        </select>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold">Select Size Unit:</h3>
                        <select
                          value={sizeUnit}
                          onChange={handleSizeUnitChange}
                          className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="KiB">KiB</option>
                          <option value="MiB">MiB</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  {selectedNode && (
                    <CollapsiblePanel title="Selected Node Data">
                      <div className="text-lg mb-2 flex flex-wrap">
                        <span className="font-medium">Indices and Stride:&nbsp;</span>
                        {renderIndices(selectedNode.data.label)}
                      </div>
                      <div className="text-lg mb-2">
                        <span className="font-medium">Tensor Size:&nbsp;</span>
                        {formatSize(tensorSizes(selectedNode.data.label))}
                      </div>
                      {selectedNodeOperations > 0 && (
                        <div className="text-lg mb-2">
                          <span className="font-medium">Ops/Ops per Tree:&nbsp;</span>
                          {(selectedNodeOperations * 100 / totalOperations).toLocaleString()} %
                        </div>
                      )}
                    </CollapsiblePanel>
                  )}
                </div>
              </Panel>
            </PanelGroup>
          </div>
        </Panel>
        <CustomPanelResizeHandle />
        <Panel minSize={20}>
          <div className="p-6 h-full overflow-auto bg-white rounded-lg shadow-lg">
            <div className="flex items-center gap-4 mb-6">
              <input
                type="text"
                placeholder="Enter einsum expression"
                value={einsumExpression}
                onChange={handleEinsumInputChange}
                className="flex-grow p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => parseInput(einsumExpression)}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                Parse
              </button>
            </div>
            <HistoryPanel history={history} onSelectTree={selectTreeFromHistory} />
            <IndexSizeInput indexSizes={indexSizes} setIndexSizes={setIndexSizes} onUpdate={handleTreeUpdate} />
          </div>
        </Panel>
      </PanelGroup>
    </div>
  );
};

export default EinsumTreeVisualizer;