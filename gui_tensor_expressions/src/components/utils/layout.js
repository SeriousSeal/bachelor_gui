import { hierarchy, tree } from 'd3-hierarchy';

const buildVisualizationTree = (root, faultyNodes = [], layoutOption = 'tree') => {
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

  // Select layout based on option
  let layout;
  switch (layoutOption) {
    case 'spread':
      layout = tree()
        .size([width * 3, height])
        .separation((a, b) => {
          if (a.parent === b.parent) return 4;
          return 6 + Math.abs(a.depth - b.depth);
        });
      break;
    case 'hierarchical':
      layout = tree()
        .size([width * 2, height * 1.5])
        .nodeSize([50, 100])
        .separation((a, b) => {
          const depthDiff = Math.abs(a.depth - b.depth);
          if (a.parent === b.parent) return 2.5;
          return 2.5 + (depthDiff * 0.5);
        });
      break;
    case 'compact':
      layout = tree()
        .size([width, height / 2])
        .separation((a, b) => (a.parent === b.parent ? 1 : 1.2));
      break;
    case 'wide':
      layout = tree()
        .size([width * 1.5, height])
        .separation((a, b) => (a.parent === b.parent ? 2 : 2.5));
      break;
    default: // 'tree'
      layout = tree()
        .size([width, height])
        .separation((a, b) => (a.parent === b.parent ? 1.5 : 2));
  }

  // Apply the selected layout
  const treeRoot = layout(hierarchyRoot);

  // Convert to nodes and edges format
  const nodes = treeRoot.descendants().map((d, i) => {
    const isFaulty = faultyNodes.some(faultyNode => faultyNode.id === d.data.id);
    return {
      id: d.data.id,
      type: 'custom',
      data: {
        label: d.data.value,
        left: d.data.left?.value,
        right: d.data.right?.value,
        deleteAble: d.data.deleteAble,
        operations: d.data.operations,  // Add operations information
        totalOperations: d.data.totalOperations,  // Add total operations
        operationsPercentage: d.data.operationsPercentage,  // Add operations percentage	
        normalizedPercentage: d.data.normalizedPercentage,  // Add normalized percentage
        depth: d.depth,  // Add depth information
        isFaulty: isFaulty
      },
      position: {
        x: d.x,
        y: d.y
      }
    };
  });

  const edges = treeRoot.links().map((link, i) => ({
    id: `edge-${i}`,
    source: link.source.data.id,  // Use ID directly instead of finding by label
    target: link.target.data.id,  // Use ID directly instead of finding by label
    type: 'smoothstep'
  }));

  return {
    nodes,
    edges,
    dimensions: { width, height }  // Optional: return calculated dimensions
  };
};

export default buildVisualizationTree;