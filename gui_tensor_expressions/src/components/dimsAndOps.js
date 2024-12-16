import { cloneDeep } from "lodash";
import { Toast } from './visual/toast.js';
// Define dimension states and transitions
const DimState = {
  INITIAL: 'INITIAL',
  PRIMITIVE: 'PRIMITIVE',
  LOOP: 'LOOP'
};

const DimType = {
  CB: 'cb',
  MB: 'mb',
  NB: 'nb',
  KB: 'kb',
  BC: 'bc',
  BM: 'bm',
  BN: 'bn',
  BK: 'bk'
};

const PrimitiveDimType = {
  CB: 'cb',
  MB: 'mb',
  KB: 'kb',
  NB: 'nb',
  RANDOM: 'random'
};

// Create an array of primitive types in order
const PRIMITIVE_DIM_ORDER = Object.values(PrimitiveDimType);


class DimensionClassifier {
  constructor(node, left, right) {
    this.clonedNode = cloneDeep(node);
    this.node = cloneDeep(node);
    this.left = cloneDeep(left);
    this.right = cloneDeep(right);
    // for k dimension
    this.rightK = cloneDeep(right);
    this.leftK = cloneDeep(left);
    this.state = DimState.INITIAL;
    this.dimTypes = this.initializeDimTypes();
    this.processedIndices = new Set();
    this.dimType = DimType.CB;
  }

  initializeDimTypes() {
    return {
      primitive: { cb: [], mb: [], nb: [], kb: [] },
      loop: { bc: [], bm: [], bn: [], bk: [] }
    };
  }

  classify() {
    try {
      this.processLastIndices();

      // Second pass: Process remaining indices
      this.processRemainingIndices();
    } catch (error) {
      console.error(error.message);
      Toast.show(error.message);
      return null;
    }

    return this.dimTypes;
  }


  processRemainingIndices() {

    // Process remaining left indices which are in K dimension
    this.dimType = DimType.CB;
    const primitive = []
    this.leftK?.reverse().forEach(element => {
      const inC = (this.dimTypes.primitive?.cb || []).includes(element) || (this.dimTypes.loop?.bc || []).includes(element);
      const inM = (this.dimTypes.primitive?.mb || []).includes(element) || (this.dimTypes.loop?.bm || []).includes(element);
      const inN = (this.dimTypes.primitive?.nb || []).includes(element) || (this.dimTypes.loop?.bn || []).includes(element);

      if (inC || inM || inN) {
        this.dimType = inC ? DimType.CB : inM ? DimType.MB : DimType.NB;
        return;
      }
      const occurrence = this.rightK.includes(element);
      if (occurrence) {
        if (this.acceptDimForPrimitive(DimType.KB)) {
          primitive.push(element);
        }
        this.dimType = DimType.KB;
      }
      else {
        throw new Error(
          `Node ${this.clonedNode} is faulty`
        );
      }
    });

    // Process remaining right indices
    this.dimType = DimType.CB;
    this.rightK?.reverse().forEach(element => {
      const inC = (this.dimTypes.primitive?.cb || []).includes(element) || (this.dimTypes.loop?.bc || []).includes(element);
      const inM = (this.dimTypes.primitive?.mb || []).includes(element) || (this.dimTypes.loop?.bm || []).includes(element);
      const inN = (this.dimTypes.primitive?.nb || []).includes(element) || (this.dimTypes.loop?.bn || []).includes(element);
      const inK = (this.dimTypes.primitive?.kb || []).includes(element) || (this.dimTypes.loop?.bk || []).includes(element);

      if (inC || inM || inN || inK) {
        this.dimType = inC ? DimType.CB : inM ? DimType.MB : inN ? DimType.NB : DimType.KB;
        return;
      }

      const occurrence = this.leftK.includes(element);

      if (occurrence) {
        if (this.acceptDimForPrimitive(DimType.KB) && primitive.includes(element)) {
          this.addToPrimitive(DimType.KB, element);
          primitive.pop(element);
        } else {
          this.addToLoop(DimType.BK, element);
        }
        this.dimType = DimType.KB;
      }
      else {
        throw new Error(
          `Node ${this.clonedNode} is faulty`
        );
      }
    });
  }

  processLastIndices() {
    for (let i = this.node.length - 1; i >= 0; i--) {
      const element = this.node[i];
      const occurrenceLast = this.checkOccurrenceLast(element);
      console.log(element);
      console.log(occurrenceLast);

      let retCode = this.handleInitialState(element, occurrenceLast);

      if (retCode === 2) {
        if (this.state === DimState.INITIAL) {
          this.dimType = DimType.KB;
        } else if (this.state === DimState.PRIMITIVE) {
          const currentIndex = PRIMITIVE_DIM_ORDER.indexOf(this.dimType);
          if (currentIndex === -1 || currentIndex + 1 >= PRIMITIVE_DIM_ORDER.length) {
            this.dimType = DimType.NB;
          } else {
            this.dimType = PRIMITIVE_DIM_ORDER[currentIndex + 1];
          }
        }
        this.state = DimState.LOOP;
        retCode = this.handleLoopState(element);
      }


      if (retCode === 0) {
        continue;
      } else if (retCode === 1) {
        i++;
        continue;
      }
    }
  }

  handleInitialState(element, occurrence) {
    if (occurrence.inAll && this.acceptDimForPrimitive(DimType.CB)) {
      this.dimType = DimType.CB;
      this.state = DimState.PRIMITIVE;
      this.addToPrimitive(DimType.CB, element);
      this.removeFromAll(element);
      return 0;
    } else if (occurrence.inNodeAndLeft && this.acceptDimForPrimitive(DimType.MB) && !this.right.includes(element)) {
      this.dimType = DimType.MB;
      this.state = DimState.PRIMITIVE;
      this.addToPrimitive(DimType.MB, element);
      this.state = DimState.PRIMITIVE;
      this.removeFromNodeAndLeft(element);
      return 0;
    } else if (occurrence.leftEqualsRight && this.acceptDimForPrimitive(DimType.KB) && !this.node.includes(this.left[this.left.length - 1])) {
      this.dimType = DimType.KB;
      this.state = DimState.PRIMITIVE;
      const lastLeft = this.left[this.left.length - 1];
      this.addToPrimitive(DimType.KB, lastLeft);
      this.state = DimState.PRIMITIVE;
      this.removeFromLeftAndRight(lastLeft);
      return 1;
    } else if (occurrence.inNodeAndRight && this.acceptDimForPrimitive(DimType.NB) && !this.left.includes(element)) {
      this.dimType = DimType.NB;
      this.state = DimState.PRIMITIVE;
      this.addToPrimitive(DimType.NB, element);
      this.state = DimState.PRIMITIVE;
      this.removeFromNodeAndRight(element);
      return 0;
    }
    return 2;
  }

  handleLoopState(element) {
    const occurrence = this.checkOccurrence(element);
    if (occurrence.inAll) {
      this.addToLoop(DimType.BC, element);
      this.removeFromAll(element);
      return 0;
    } else if (occurrence.inNodeAndLeft && !this.right.includes(element)) {
      this.addToLoop(DimType.BM, element);
      this.removeFromNodeAndLeft(element);
      return 0;
    } else if (occurrence.leftInRight && !this.node.includes(this.left[this.left.length - 1])) {
      this.removeFromLeftAndRight(this.left[this.left.length - 1]);
      return 1;
    } else if (occurrence.rightInLeft && !this.node.includes(this.right[this.right.length - 1])) {
      this.removeFromLeftAndRight(this.right[this.right.length - 1]);
      return 1;
    } else if (occurrence.inNodeAndRight && !this.left.includes(element)) {
      this.addToLoop(DimType.BN, element);
      this.removeFromNodeAndRight(element);
      return 0;
    }
    else {
      throw new Error(
        `Contraction ${this.clonedNode} is faulty`
      );
    }
  }

  checkOccurrenceLast(element) {
    const inNode = this.node.at(-1) === element;
    const inLeft = this.left?.at(-1) === element || false;
    const inRight = this.right?.at(-1) === element || false;
    const leftEqualsRight = this.left.length > 0 && this.right.length > 0 && this.left[this.left.length - 1] === this.right[this.right.length - 1];

    return {
      inAll: inNode && inLeft && inRight,
      inNodeAndLeft: inNode && inLeft && !inRight,
      inNodeAndRight: inNode && !inLeft && inRight,
      leftEqualsRight: leftEqualsRight
    };
  };

  checkOccurrence(element) {
    const inNode = this.node.includes(element);
    const inLeft = this.left.includes(element);
    const inRight = this.right.includes(element);
    const leftInRight = this.left.length > 0 && this.right.length > 0 && this.right.includes(this.left[this.left.length - 1]);
    const rightInLeft = this.left.length > 0 && this.right.length > 0 && this.left.includes(this.right[this.right.length - 1]);

    return {
      inAll: inNode && inLeft && inRight,
      inNodeAndLeft: inNode && inLeft && !inRight,
      inNodeAndRight: inNode && !inLeft && inRight,
      leftInRight: leftInRight,
      rightInLeft: rightInLeft
    };
  }


  acceptDimForPrimitive(dimType) {
    const currentTypeIndex = PRIMITIVE_DIM_ORDER.indexOf(this.dimType);
    const newTypeIndex = PRIMITIVE_DIM_ORDER.indexOf(dimType);

    // Accept if it's the same type or comes after in the order
    return currentTypeIndex <= newTypeIndex;
  }

  // Helper methods for dimension management
  addToPrimitive(type, element) {
    if (!element) {
      throw new Error('Contraction faulty');
    }
    if (this.processedIndices.has(element)) {
      const error = `Index ${element} already processed`
      throw new Error(
        error
      );
    }
    this.dimTypes.primitive[type].push(element);
    this.processedIndices.add(element);
  }

  addToLoop(type, element) {
    if (!element) {
      throw new Error('Contraction faulty 1');
    }
    if (this.processedIndices.has(element)) {
      const error = `Index ${element} already processed`
      throw new Error(
        error
      );
    }
    this.dimTypes.loop[type].push(element);
    this.processedIndices.add(element);
  }

  removeFromAll(element) {
    this.node = this.node.filter(e => e !== element);
    this.left = this.left.filter(e => e !== element);
    this.right = this.right.filter(e => e !== element);
  }

  removeFromNodeAndLeft(element) {
    this.node = this.node.filter(e => e !== element);
    this.left = this.left.filter(e => e !== element);
  }

  removeFromNodeAndRight(element) {
    this.node = this.node.filter(e => e !== element);
    this.right = this.right.filter(e => e !== element);
  }

  removeFromLeftAndRight(element) {
    this.left = this.left.filter(e => e !== element);
    this.right = this.right.filter(e => e !== element);
  }

}

export const dimensionTypes = (node, left, right) => {
  const classifier = new DimensionClassifier(node, left, right);
  return classifier.classify();
};

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

  // First pass: Calculate total operations
  const calculateTotal = (node) => {
    if (node.left && node.right) {
      const dimtypes = dimensionTypes(node.value, node.left.value, node.right.value);
      if (dimtypes === null) {
        faultyNodes.push(node);
        // Continue to check child nodes even if the current node is faulty
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

  // Second pass: Calculate raw percentages
  const calculateRawPercentages = (node) => {
    if (node.left && node.right) {
      node.operationsPercentage = (node.operations / totalOperations) * 100;
      node.totalOperations = totalOperations;

      calculateRawPercentages(node.left);
      calculateRawPercentages(node.right);
    }
  };

  // Helper function to find min and max from calculated percentages
  const findMinMaxPercentages = (node, percentages = []) => {
    if (node.left && node.right) {
      percentages.push(node.operationsPercentage);
      findMinMaxPercentages(node.left, percentages);
      findMinMaxPercentages(node.right, percentages);
    }
    return percentages;
  };

  // Helper function to normalize percentage to 0-100 scale
  const normalizePercentage = (value, min, max) => {
    return ((value - min) / (max - min)) * 100;
  };

  // Final pass: Add normalized percentages
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

  // Execute all passes
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