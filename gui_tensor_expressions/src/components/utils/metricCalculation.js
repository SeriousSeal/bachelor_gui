/**
 * Import dimension type classification utilities
 */
import { dimensionTypes } from './dimensionClassifier.js';

/**
 * Calculates the number of operations for a given set of dimension types and index sizes
 * @param {Object} dimTypes - Object containing dimension types (kb, bk, etc.)
 * @param {Object} indexSizes - Object containing the sizes of each index
 * @returns {number} - Number of operations required
 */
export const calculateOperations = (dimTypes, indexSizes) => {
    let cmn = 1;
    let k = 1;

    const calculateProduct = (dimensions, multiplier) => {
        return dimensions.reduce((product, index) => {
            return product * (indexSizes[index] || 1);
        }, multiplier);
    };

    for (const key in dimTypes) {
        for (const dim in dimTypes[key]) {
            if (dim === 'kb' || dim === 'bk') {
                k = calculateProduct(dimTypes[key][dim], k);
            } else {
                cmn = calculateProduct(dimTypes[key][dim], cmn);
            }
        }
    }

    return 2 * cmn * k - cmn;
};

/**
 * Calculates the total number of operations for an entire expression tree
 * and adds operation statistics to each node
 * @param {Object} indexSizes - Object containing the sizes of each index
 * @param {Object} tree - The expression tree to analyze
 * @returns {Object} - Object containing total operations and any faulty nodes
 */
export const calculateNodeMetrics = (indexSizes, tree, dataTypeSize) => {
    let totalOperations = 0;
    let faultyNodes = [];

    let totalTensorSize = 0;
    let maxTensorSize = 0;
    let minTensorSize = Infinity;

    const calculateNodeSizes = (node) => {
        if (!node) return;

        // Calculate tensor size
        const nodeSize = node.value.reduce((size, index) =>
            size * (indexSizes[index] || 1), 1
        ) * dataTypeSize;

        node.tensorSize = nodeSize;
        totalTensorSize += nodeSize;
        maxTensorSize = Math.max(maxTensorSize, nodeSize);
        minTensorSize = Math.min(minTensorSize, nodeSize);

        if (node.left && node.right) {
            const dimtypes = dimensionTypes(node.value, node.left.value, node.right.value);
            if (dimtypes) {
                node.operations = calculateOperations(dimtypes, indexSizes);
                totalOperations += node.operations;
            }
        }

        calculateNodeSizes(node.left);
        calculateNodeSizes(node.right);
    };

    /**
     * Resets all operation-related properties in the tree
     * @param {Object} node - Current tree node
     */
    const resetTreeOperations = (node) => {
        if (node.left && node.right) {
            node.operations = 0;
            node.operationsPercentage = 0;
            node.normalizedPercentage = 0;
            resetTreeOperations(node.left);
            resetTreeOperations(node.right);
        }
        else if (node.left && !node.right) {
            resetTreeOperations(node.left);
            node.operations = 0;
            node.operationsPercentage = 0;
            node.normalizedPercentage = 0;
        }
    };

    /**
     * Recursively calculates the total operations for each node
     * @param {Object} node - Current tree node
     * @returns {number} - Returns 1 if node is faulty, 0 otherwise
     */
    const calculateTotal = (node) => {
        if (node.left && node.right) {
            const dimtypes = dimensionTypes(node.value, node.left.value, node.right.value);
            if (dimtypes === null) {
                faultyNodes.push(node);
                calculateTotal(node.left);
                calculateTotal(node.right);
                return 1;
            }
            const operations = calculateOperations(dimtypes, indexSizes);
            node.operations = operations;
            totalOperations += operations;

            if (calculateTotal(node.left) === 1 || calculateTotal(node.right) === 1) {
                return 1;
            }
        }
        else if (node.left && !node.right) {
            node.operations = 0;
            calculateTotal(node.left);
        }
        return 0;
    };

    /**
     * Calculates raw operation percentages for each node
     * @param {Object} node - Current tree node
     */
    const calculateRawPercentages = (node) => {
        if (node.left && node.right) {
            node.operationsPercentage = (node.operations / totalOperations) * 100;
            node.totalOperations = totalOperations;
            calculateRawPercentages(node.left);
            calculateRawPercentages(node.right);
        }
        else if (node.left && !node.right) {
            calculateRawPercentages(node.left);
            node.totalOperations = totalOperations;
            node.operationsPercentage = 0;
        }
    };

    /**
     * Finds minimum and maximum operation percentages in the tree
     * @param {Object} node - Current tree node
     * @param {Array} percentages - Array to collect percentages
     * @returns {Array} - Array of all operation percentages
     */
    const findMinMaxPercentages = (node, percentages = []) => {
        if (node.left && node.right) {
            percentages.push(node.operationsPercentage);
            findMinMaxPercentages(node.left, percentages);
            findMinMaxPercentages(node.right, percentages);
        }
        else if (node.left && !node.right) {
            findMinMaxPercentages(node.left, percentages);
        }
        return percentages;
    };

    /**
     * Normalizes a percentage value between 0 and 100
     * @param {number} value - Value to normalize
     * @param {number} min - Minimum value in range
     * @param {number} max - Maximum value in range
     * @returns {number} - Normalized value between 0 and 100
     */
    const normalizePercentage = (value, min, max) => {
        return ((value - min) / (max - min)) * 100;
    };

    /**
     * Adds normalized percentages to each node in the tree
     * @param {Object} node - Current tree node
     * @param {number} minPercentage - Minimum percentage value
     * @param {number} maxPercentage - Maximum percentage value
     */
    const addNormalizedPercentages = (node, minPercentage, maxPercentage) => {
        if (node.left && node.right) {
            node.normalizedPercentage = normalizePercentage(
                node.operationsPercentage,
                minPercentage,
                maxPercentage
            );
            addNormalizedPercentages(node.left, minPercentage, maxPercentage);
            addNormalizedPercentages(node.right, minPercentage, maxPercentage);
        }
        else if (node.left && !node.right) {
            node.normalizedPercentage = 0;
            addNormalizedPercentages(node.left, minPercentage, maxPercentage);
        }
    };

    calculateNodeSizes(tree);

    const addPercentages = (node) => {
        if (!node) return;

        // Raw percentage of total
        node.sizePercentage = (node.tensorSize / totalTensorSize) * 100;

        // Normalized percentage (0-100 scale)
        node.normalizedSizePercentage =
            ((node.tensorSize - minTensorSize) / (maxTensorSize - minTensorSize)) * 100;

        addPercentages(node.left);
        addPercentages(node.right);
    };

    addPercentages(tree);

    calculateTotal(tree);
    if (faultyNodes.length > 0) {
        totalOperations = 0;
        resetTreeOperations(tree);
    }
    if (totalOperations === 0) {
        return { totalOperations, faultyNodes };
    }
    tree.totalOperations = totalOperations;
    calculateRawPercentages(tree);

    const percentages = findMinMaxPercentages(tree);
    const minPercentage = Math.min(...percentages);
    const maxPercentage = Math.max(...percentages);

    addNormalizedPercentages(tree, minPercentage, maxPercentage);
    console.log(tree);

    return { totalOperations, faultyNodes };
};
