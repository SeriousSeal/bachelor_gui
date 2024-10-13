const buildVisualizationTree = (root) => {
    let nodes = [];
    let edges = [];
    let idCounter = 1;
    const nodeWidth = 150;
    const nodeHeight = 40;
    const levelHeight = 100;
  
    // First pass: assign initial x coordinates and determine tree dimensions
    const assignInitialX = (node, depth = 0) => {
      if (!node) return { width: 0, height: 0 };
  
      const leftSubtree = assignInitialX(node.left, depth + 1);
      const rightSubtree = assignInitialX(node.right, depth + 1);
  
      const width = Math.max(nodeWidth, leftSubtree.width + rightSubtree.width);
      const height = Math.max(leftSubtree.height, rightSubtree.height) + 1;
  
      node.x = leftSubtree.width;
      node.y = depth * levelHeight;
      node.width = width;
      node.height = height;
  
      return { width, height };
    };
  
    // Second pass: adjust x coordinates to center parent over children
    const adjustX = (node, offsetX = 0) => {
      if (!node) return;
  
      node.x += offsetX;
  
      if (node.left || node.right) {
        const leftWidth = node.left ? node.left.width : 0;
        const rightWidth = node.right ? node.right.width : 0;
        const totalWidth = leftWidth + rightWidth;
  
        if (node.left) {
          adjustX(node.left, offsetX);
        }
        if (node.right) {
          adjustX(node.right, offsetX + leftWidth);
        }
  
        // Center the parent node above its children
        node.x = offsetX + (totalWidth - nodeWidth) / 2;
      }
    };
  
    // Third pass: create nodes and edges
    const createNodesAndEdges = (node, parentId = null) => {
      if (!node) return;
  
      const currentId = `${idCounter++}`;
  
      nodes.push({
        id: currentId,
        type: 'custom',
        data: { 
          label: node.value,
          left: node.left?.value,
          right: node.right?.value
        },
        position: { x: node.x, y: node.y }
        
      });
  
      if (parentId !== null) {
        edges.push({
          id: `e${parentId}-${currentId}`,
          source: parentId,
          target: currentId,
          type: 'smoothstep'  // Changed to smoothstep for better appearance
        });
      }
  
      createNodesAndEdges(node.left, currentId);
      createNodesAndEdges(node.right, currentId);
    };
  
    // Execute the three passes
    assignInitialX(root);
    adjustX(root);
    createNodesAndEdges(root);
  
    return { nodes, edges };
  };

  export default buildVisualizationTree;