import { dimensionTypes } from './dimensionClassifier.js';

/**
 * Helper function to calculate the product of index sizes for given dimensions
 * @param {string[]} dimensions - Array of dimension indices
 * @param {Object} indexSizes - Object containing the sizes of each index
 * @param {number} initialValue - Initial value for multiplication
 * @returns {number} - Product of all dimension sizes
 */
const calculateDimensionProduct = (dimensions = [], indexSizes, initialValue = 1) => {
    return dimensions.reduce((product, index) =>
        product * (indexSizes[index] || 1), initialValue);
};

/**
 * Calculates operation count for matrix multiplication-like operations
 */
export const calculateOperations = (dimTypes, indexSizes) => {
    let cmn = 1;
    let k = 1;

    for (const key in dimTypes) {
        for (const dim in dimTypes[key]) {
            if (dim === 'kb' || dim === 'bk') {
                k = calculateDimensionProduct(dimTypes[key][dim], indexSizes, k);
            } else {
                cmn = calculateDimensionProduct(dimTypes[key][dim], indexSizes, cmn);
            }
        }
    }

    return 2 * cmn * k - cmn;
};

/**
 * Calculates memory access patterns for tensor operations
 */
export const caluclateByteAccesses = (dimTypes, indexSizes) => {
    // Calculate dimension products for each type
    const calc = (type, dim) => calculateDimensionProduct(dimTypes[type][dim] || [], indexSizes);

    // Common dimensions
    const cDim = calc('primitive', 'cb') * calc('loop', 'bc');
    // M dimensions
    const mDim = calc('primitive', 'mb') * calc('loop', 'bm');
    // N dimensions
    const nDim = calc('primitive', 'nb') * calc('loop', 'bn');
    // K dimensions
    const kDim = calc('primitive', 'kb') * calc('loop', 'bk');

    const cmn = cDim * mDim * nDim;
    const cnk = nDim * kDim;
    const cmk = mDim * kDim;

    return cmn + cnk + cmk;
};

/**
 * Calculates and annotates metrics for an expression tree
 * @param {Object} indexSizes - Size mapping for each dimension
 * @param {Object} tree - Expression tree to analyze
 * @param {number} dataTypeSize - Size of the data type in bytes
 * @returns {Object} Analysis results including operations and errors
 */
export const calculateNodeMetrics = (indexSizes, tree, dataTypeSize) => {
    let totalOperations = 0;
    let faultyNodes = [];
    let binaryNodes = [];
    let totalTensorSize = 0;
    let maxTensorSize = 0;
    let minTensorSize = Infinity;

    // Helper function to normalize values to percentage
    const normalizeToPercentage = (value, min, max) =>
        ((value - min) / (max - min)) * 100;

    const calculateNodeSizes = (node) => {
        if (!node) return;

        node.tensorSize = calculateDimensionProduct(node.value, indexSizes) * dataTypeSize;
        totalTensorSize += node.tensorSize;
        maxTensorSize = Math.max(maxTensorSize, node.tensorSize);
        minTensorSize = Math.min(minTensorSize, node.tensorSize);

        calculateNodeSizes(node.left);
        calculateNodeSizes(node.right);
    };

    const addPercentages = (node) => {
        if (!node) return;

        node.sizePercentage = (node.tensorSize / totalTensorSize) * 100;
        node.normalizedSizePercentage = normalizeToPercentage(
            node.tensorSize,
            minTensorSize,
            maxTensorSize
        );

        addPercentages(node.left);
        addPercentages(node.right);
    };

    /**
     * Resets all operation-related properties in the tree
     * @param {Object} node - Current tree node
     */
    const resetTreeOperations = (node) => {
        if (!node) return;

        node.operations = 0;
        node.operationsPercentage = 0;
        node.normalizedPercentage = 0;

        resetTreeOperations(node.left);
        resetTreeOperations(node.right);
    };

    const calculateOpsAndByteAccess = (node) => {
        if (!node.left) return 0;

        if (node.right) {
            const dimtypes = dimensionTypes(node.value, node.left.value, node.right.value);
            if (!dimtypes) {
                faultyNodes.push(node);
                return 1;
            }

            node.byteAccesses = caluclateByteAccesses(dimtypes, indexSizes);
            node.operations = calculateOperations(dimtypes, indexSizes);
            totalOperations += node.operations;
            binaryNodes.push(node);
        }

        return Math.max(
            calculateOpsAndByteAccess(node.left),
            node.right ? calculateOpsAndByteAccess(node.right) : 0
        );
    };

    calculateNodeSizes(tree);
    addPercentages(tree);

    if (calculateOpsAndByteAccess(tree) > 0) {
        totalOperations = 0;
        resetTreeOperations(tree);
        return { totalOperations, faultyNodes };
    }

    tree.totalOperations = totalOperations;

    // Calculate operation percentages
    binaryNodes.forEach(node => {
        node.operationsPercentage = (node.operations / totalOperations) * 100;
        node.totalOperations = totalOperations;
    });

    // Normalize operation percentages
    const percentages = binaryNodes.map(node => node.operationsPercentage);
    const [minPercentage, maxPercentage] = [Math.min(...percentages), Math.max(...percentages)];

    const addNormalizedPercentages = (node) => {
        if (!node) return;
        if (node.left && node.right) {
            node.normalizedPercentage = normalizeToPercentage(
                node.operationsPercentage,
                minPercentage,
                maxPercentage
            );
        }
        addNormalizedPercentages(node.left);
        addNormalizedPercentages(node.right);
    };

    addNormalizedPercentages(tree);

    return { totalOperations, faultyNodes };
};
