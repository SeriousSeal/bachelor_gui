import { dimensionTypes } from './dimensionClassifier.js';

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

export const calculateTotalOperations = (indexSizes, tree) => {
    let totalOperations = 0;
    let faultyNodes = [];

    const resetTreeOperations = (node) => {
        if (node.left && node.right) {
            node.operations = 0;
            node.operationsPercentage = 0;
            node.normalizedPercentage = 0;
            resetTreeOperations(node.left);
            resetTreeOperations(node.right);
        }
    };

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
        return 0;
    };

    const calculateRawPercentages = (node) => {
        if (node.left && node.right) {
            node.operationsPercentage = (node.operations / totalOperations) * 100;
            node.totalOperations = totalOperations;
            calculateRawPercentages(node.left);
            calculateRawPercentages(node.right);
        }
    };

    const findMinMaxPercentages = (node, percentages = []) => {
        if (node.left && node.right) {
            percentages.push(node.operationsPercentage);
            findMinMaxPercentages(node.left, percentages);
            findMinMaxPercentages(node.right, percentages);
        }
        return percentages;
    };

    const normalizePercentage = (value, min, max) => {
        return ((value - min) / (max - min)) * 100;
    };

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
    };

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

    return { totalOperations, faultyNodes };
};
