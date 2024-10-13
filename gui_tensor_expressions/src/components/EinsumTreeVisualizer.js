import React, { useState, useCallback, useRef } from 'react';
import { Panel, PanelGroup } from 'react-resizable-panels';
import { Tree } from './EinsumContractionTree';
import Flow from './visual/Flow';
import HistoryPanel from './visual/HistoryPanel';
import IndexSizeInput from './visual/IndexSizeInput';
import CollapsiblePanel from './visual/CollapsiblePanel';
import CustomPanelResizeHandle from './visual/CustomPanelResizeHandle';
import buildVisualizationTree from './visual_Tree';
import { calculateTotalOperations, dimensionTypes, calculateOperations } from './dimsAndOps';
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

  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
    if (node.data && node.data.left && node.data.right) {
      const dimtypes = dimensionTypes(node.data.label, node.data.left, node.data.right);
      const ops = calculateOperations(dimtypes, indexSizes);
      setSelectedNodeOperations(ops);
    } else {
      setSelectedNodeOperations(0);
    }
  }, [indexSizes]);

  const handleTreeUpdate = (indexSizes) => {
    tree.updateIndexSizes(indexSizes);
  };


  const parseInput = (einsumExpression) => {
    
    const input = einsumExpression || "[[i,e,a],[i,c,g]->[i,e,a,c,g]],[[[a,b,c,d],[b,f]->[a,f,c,d]],[d,h]->[a,f,c,h]]->[i,e,f,g,h]";
    const tree = new Tree(input); 
    const unorderedTree = tree.getRoot();
    setTree(tree);
    const { nodes, edges } = buildVisualizationTree(unorderedTree);

    setNodes1(nodes);
    setEdges1(edges);

    let newIndexSizes = {};
    // Update index sizes
    nodes.forEach(node => {
      if (node.data && node.data.label) {
        for (const indice of node.data.label) {
          if (!newIndexSizes[indice]) {
            newIndexSizes[indice] = 10; // Default size, adjust as needed
          }
        }
      }
    });
    setIndexSizes(newIndexSizes);
    
    // Update history
    setHistory(prevHistory => {
      const newItem = { expression: input, nodes, edges, indexSizes: newIndexSizes };
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

    // Calculate total operations
    const totalOps = calculateTotalOperations(newIndexSizes, tree);
    setTotalOperations(totalOps);
    
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
                    fitViewFunction={(fn) => (fitViewFunctions.current.tree1 = fn)}
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
                  <p className="text-lg mb-2">
                    <span className="font-medium">Total Operations:</span> {totalOperations.toLocaleString()}
                  </p>
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
                      <div className="text-lg mb-2">
                        <span className="font-medium">Node Operations:&nbsp;</span>
                        {selectedNodeOperations.toLocaleString()}
                      </div>
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