import React, { useState, useCallback, useRef } from 'react';
import { Panel, PanelGroup } from 'react-resizable-panels';
import { Tree } from './EinsumContractionTree';
import Flow from './visual/Flow';
import HistoryPanel from './visual/HistoryPanel';
import IndexSizeInput from './visual/IndexSizeInput';
import CollapsiblePanel from './visual/CollapsiblePanel';
import CustomPanelResizeHandle from './visual/CustomPanelResizeHandle';
import buildVisualizationTree from './visual_Tree';
import { 
  ReactFlowProvider,
  addEdge,
  useNodesState, 
  useEdgesState,
  
} from 'reactflow';
import 'reactflow/dist/style.css';


const initialNodesTree2 = [
  { id: '2-1', type: 'custom', data: { label: 'X' }, position: { x: 0, y: 0 } },
  { id: '2-2', type: 'custom', data: { label: 'Y' }, position: { x: -100, y: 100 } },
  { id: '2-3', type: 'custom', data: { label: 'Z' }, position: { x: 100, y: 100 } },
];

const initialEdgesTree2 = [
  { id: 'e2-1-2', source: '2-1', target: '2-2', type: 'step' },
  { id: 'e2-1-3', source: '2-1', target: '2-3', type: 'step' },
];



const EinsumTreeVisualizer = () => {
  const [nodes1, setNodes1, onNodesChange1] = useNodesState();
  const [edges1, setEdges1, onEdgesChange1] = useEdgesState();
  const [nodes2, setNodes2, onNodesChange2] = useNodesState(initialNodesTree2);
  const [edges2, setEdges2, onEdgesChange2] = useEdgesState(initialEdgesTree2);
  const [einsumExpression, setEinsumExpression] = useState('');
  const [selectedNode, setSelectedNode] = useState(null);  
  const [indexSizes, setIndexSizes] = useState({});
  const [history, setHistory] = useState([]);

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

  const parseInput = (einsumExpression) => {
    const input = einsumExpression || "[[h,d]+[[f,b]+[a,b,c,d]->[f,a,c,d]]->[h,a,c,f]]+[[e,a,i]+[g,i,c]->[i,a,e,c,g]]->[i,e,f,g,h]";
    const tree = new Tree(input); 
    const unorderedTree = tree.getRoot();
    const { nodes, edges } = buildVisualizationTree(unorderedTree);
    const newIndexSizes = {};

    // eslint-disable-next-line react-hooks/exhaustive-deps
    setNodes1(nodes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    setEdges1(edges);

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
    console.log(nodes)
    tree.updateIndexSizes(indexSizes);

    //const reorderedTree = tree.reorder();




    // Check if the expression already exists in history
    setHistory(prevHistory => {
      const newItem = { expression: input, nodes, edges, indexSizes: newIndexSizes };
      const existingIndex = prevHistory.findIndex(item => item.expression === input);
      
      let updatedHistory;
      if (existingIndex !== -1) {
        // If it exists, remove it from its current position
        updatedHistory = [
          newItem,
          ...prevHistory.slice(0, existingIndex),
          ...prevHistory.slice(existingIndex + 1)
        ];
      } else {
        // If it's new, add it to the beginning
        updatedHistory = [newItem, ...prevHistory];
      }
      
      // Keep only the last 5 entries
      return updatedHistory.slice(0, 5);
    });
    
    setTimeout(() => fitView('tree1'), 0)
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

  return (
    <div className="h-screen bg-gray-50">
      <PanelGroup direction="horizontal" className="h-full">
        <Panel defaultSize={50} minSize={20}>
          <div className="h-full border border-gray-200 rounded-lg overflow-hidden shadow-lg">
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
            <IndexSizeInput indexSizes={indexSizes} setIndexSizes={setIndexSizes} />
            {selectedNode && (
              <CollapsiblePanel title="Selected Node Data">
                <p><span className="font-medium">ID:</span> {selectedNode.id}</p>
                <p><span className="font-medium">Type:</span> {selectedNode.type}</p>
                <p><span className="font-medium">Position:</span> x: {selectedNode.position.x}, y: {selectedNode.position.y}</p>
                <p><span className="font-medium">Data:</span> {JSON.stringify(selectedNode.data)}</p>
              </CollapsiblePanel>
            )}
          </div>
        </Panel>
      </PanelGroup>
    </div>
  );
};

export default EinsumTreeVisualizer;