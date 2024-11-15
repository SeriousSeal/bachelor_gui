import { hierarchy, tree } from 'd3-hierarchy';

const buildVisualizationTree = (root) => {
  // First, count the total number of nodes to determine sizing
  const countNodes = (node) => {
    if (!node) return 0;
    return 1 + countNodes(node.left) + countNodes(node.right);
  };

  const totalNodes = countNodes(root);

  // Calculate dimensions based on total nodes
  const width = Math.max(300, totalNodes * 50);  // Minimum 800, scales with nodes
  const height = Math.max(125, totalNodes * 40);  // Vertical scaling

  // Create a hierarchy from the root
  const hierarchyRoot = hierarchy(root, d => {
    return [d.left, d.right].filter(child => child !== null && child !== undefined);
  });

  // Create a tree layout with dynamic sizing and increased separation
  const treeLayout = tree()
    .size([width, height])
    .separation((a, b) => {
      // Increase horizontal separation, especially for sibling nodes
      return (a.parent === b.parent) ? 1.5 : 2;
    });

  // Apply the tree layout to compute node positions
  const treeRoot = treeLayout(hierarchyRoot);

  // Convert to nodes and edges format
  const nodes = treeRoot.descendants().map((d, i) => ({
    id: d.data.id,
    type: 'custom',
    data: {
      label: d.data.value,
      left: d.data.left?.value,
      right: d.data.right?.value,
      operations: d.data.operations,  // Add operations information
      totalOperations: d.data.totalOperations,  // Add total operations
      operationsPercentage: d.data.operationsPercentage,  // Add operations percentage
      depth: d.depth  // Add depth information
    },
    position: {
      x: d.x,
      y: d.y
    }
  }));

  const edges = treeRoot.links().map((link, i) => ({
    id: `edge-${i}`,
    source: nodes.find(n => n.data.label === link.source.data.value).id,
    target: nodes.find(n => n.data.label === link.target.data.value).id,
    type: 'smoothstep'
  }));

  return {
    nodes,
    edges,
    dimensions: { width, height }  // Optional: return calculated dimensions
  };
};

export default buildVisualizationTree;