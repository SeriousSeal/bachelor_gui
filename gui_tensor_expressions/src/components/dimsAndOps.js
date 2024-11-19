
import { cloneDeep } from "lodash";
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
  NB: 'nb'
};

// Create an array of primitive types in order
const PRIMITIVE_DIM_ORDER = Object.values(PrimitiveDimType);


class DimensionClassifier {
  constructor(node, left, right) {
    this.node = cloneDeep(node);
    this.left = cloneDeep(left);
    this.right = cloneDeep(right);
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
    this.processLastIndices();

    // Second pass: Process remaining indices
    this.processRemainingIndices();

    return this.dimTypes;
  }


  processRemainingIndices() {

    // Process remaining left indices
    this.left?.reverse().forEach(element => {
      const occurrence = this.checkOccurrence(element);

      if (occurrence.inAll) {
        this.addToLoop(DimType.BC, element);
        this.removeFromAll(element);
      } else if (occurrence.inNodeAndLeft) {
        this.addToLoop(DimType.BM, element);
        this.removeFromNodeAndLeft(element);
      } else if (occurrence.inNodeAndRight) {
        this.addToLoop(DimType.BN, element);
        this.removeFromLeftAndRight(element);
      } else if (occurrence.leftEqualsRight) {
        this.addToLoop(DimType.BK, element);
        this.removeFromLeftAndRight(element);
      }
    });

    // Process remaining right indices
    this.right?.reverse().forEach(element => {
      const occurrence = this.checkOccurrence(element);

      if (occurrence.inAll) {
        this.addToLoop(DimType.BC, element);
        this.removeFromAll(element);
      } else if (occurrence.inNodeAndLeft) {
        this.addToLoop(DimType.BM, element);
        this.removeFromNodeAndLeft(element);
      } else if (occurrence.inNodeAndRight) {
        this.addToLoop(DimType.BN, element);
        this.removeFromLeftAndRight(element);
      } else if (occurrence.leftEqualsRight) {
        this.addToLoop(DimType.BK, element);
        this.removeFromLeftAndRight(element);
      }
    });
  }

  processLastIndices() {
    for (let i = this.node.length - 1; i >= 0; i--) {
      const element = this.node[i];
      const occurrenceLast = this.checkOccurrenceLast(element);
      const retCode = this.handleInitialState(element, occurrenceLast);

      if (retCode === 0) {
        continue;
      } else if (retCode === 1) {
        i++;
        continue;
      }

      if (retCode === 2) {
        this.state = DimState.LOOP;
        const occurrence = this.checkOccurrence(element);
        this.handleLoopState(element, occurrence);
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
    } else if (occurrence.inNodeAndLeft && this.acceptDimForPrimitive(DimType.MB)) {
      this.dimType = DimType.MB;
      this.state = DimState.PRIMITIVE;
      this.addToPrimitive(DimType.MB, element);
      this.state = DimState.PRIMITIVE;
      this.removeFromNodeAndLeft(element);
      return 0;
    } else if (occurrence.leftEqualsRight && this.acceptDimForPrimitive(DimType.KB)) {
      this.dimType = DimType.KB;
      this.state = DimState.PRIMITIVE;
      const lastLeft = this.left[this.left.length - 1];
      this.addToPrimitive(DimType.KB, lastLeft);
      this.state = DimState.PRIMITIVE;
      this.removeFromLeftAndRight(lastLeft);
      return 1;
    } else if (occurrence.inNodeAndRight && this.acceptDimForPrimitive(DimType.NB)) {
      this.dimType = DimType.NB;
      this.state = DimState.PRIMITIVE;
      this.addToPrimitive(DimType.NB, element);
      this.state = DimState.PRIMITIVE;
      this.removeFromNodeAndRight(element);
      return 0;
    }
    return 2;
  }

  handleLoopState(element, occurrence) {
    if (occurrence.inAll) {
      this.addToLoop(DimType.BC, element);
      this.removeFromAll(element);
    } else if (occurrence.inNodeAndLeft) {
      this.addToLoop(DimType.BM, element);
      this.removeFromNodeAndLeft(element);
    } else if (occurrence.leftEqualsRight) {
      this.addToLoop(DimType.BK, element);
      this.removeFromLeftAndRight(element);
    } else if (occurrence.inNodeAndRight) {
      this.addToLoop(DimType.BN, element);
      this.removeFromNodeAndRight(element);
    }
  }

  checkOccurrenceLast(element) {
    const inNode = this.node.at(-1) === element;
    const inLeft = this.left?.at(-1) === element || false;
    const inRight = this.right?.at(-1) === element || false;
    const leftEqualsRight = this.left[this.left.length - 1] === this.right[this.right.length - 1];

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
    const leftEqualsRight = this.left[this.left.length - 1] === this.right[this.right.length - 1];

    return {
      inAll: inNode && inLeft && inRight,
      inNodeAndLeft: inNode && inLeft && !inRight,
      inNodeAndRight: inNode && !inLeft && inRight,
      leftEqualsRight: leftEqualsRight
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
    if (this.processedIndices.has(element)) {
      console.warn(`Index ${element} already processed`);
      return;
    }
    this.dimTypes.primitive[type].push(element);
    this.processedIndices.add(element);
  }

  addToLoop(type, element) {
    if (this.processedIndices.has(element)) {
      console.warn(`Index ${element} already processed`);
      return;
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

  // First pass: Calculate total operations
  const calculateTotal = (node) => {
    if (node.left && node.right) {
      const dimtypes = dimensionTypes(node.value, node.left.value, node.right.value);
      const operations = calculateOperations(dimtypes, indexSizes);
      node.operations = operations;
      totalOperations += operations;

      calculateTotal(node.left);
      calculateTotal(node.right);
    }
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
  tree.totalOperations = totalOperations;
  calculateRawPercentages(tree);

  const percentages = findMinMaxPercentages(tree);
  const minPercentage = Math.min(...percentages);
  const maxPercentage = Math.max(...percentages);

  addNormalizedPercentages(tree, minPercentage, maxPercentage);

  return totalOperations;
};