
import { cloneDeep } from "lodash"; 

const createDimTypes = () => {
  return {
    primitive: {
      cb: [],
      mb: [],
      nb: [],
      kb: []
    },
    loop: {
      bc: [],
      bm: [],
      bn: [],
      bk: []
    }
  };
}

const checkOccurrenceLast = (letter, node, left, right) => {
  const inNode = node.at(-1) === letter;
  const inLeft = left?.at(-1) === letter || false;
  const inRight = right?.at(-1) === letter || false;
  return { inNode, inLeft, inRight };
};

const checkOccurrence = (letter, node, left, right) => {
  const inNode = node.includes(letter);
  const inLeft = left?.includes(letter) || false;
  const inRight = right?.includes(letter) || false;
  return { inNode, inLeft, inRight };
};




export const dimensionTypes = (node, left, right) => {
  let cloneNode = cloneDeep(node);
  let cloneLeft = cloneDeep(left);
  let cloneRight = cloneDeep(right);
  const dimtypes = createDimTypes();
  let tempFirst, tempSecond, tempThird = false;

  let tempLoop = false;

  for (let i = node.length - 1; i >= 0; i--) {
    const element = node[i];

    const {inNode, inLeft, inRight} = checkOccurrenceLast(element, cloneNode, cloneLeft, cloneRight);
    const leftAndRight = cloneLeft[cloneLeft.length - 1] === cloneRight[cloneRight.length - 1]
    if (inNode && inLeft && inRight) {
      if(!tempFirst) {
        dimtypes.primitive.cb.push(element);
        cloneNode.pop();
        cloneLeft.pop();
        cloneRight.pop();
      }
      else{
        dimtypes.loop.bc.push(element);
        cloneNode.pop();
        cloneLeft.pop();
        cloneRight.pop();
        tempLoop = true;
      }
    }
    else if (inNode && inLeft && !inRight) {
      
      if(!tempFirst) {
        tempLoop = false;
      }

      if(!tempSecond && !tempLoop) {
        tempFirst = true;
        dimtypes.primitive.mb.push(element);
        cloneNode.pop();
        cloneLeft.pop();
      }
      else {
        dimtypes.loop.bm.push(element);
        cloneNode.pop();
        cloneLeft.pop();
        tempLoop = true;
      }
    }
    else if (leftAndRight) {
      if(!tempSecond) {
        tempLoop = false;
      }

      if(!tempThird && !tempLoop) {        
        tempFirst = true;
        tempSecond = true;
        const el = cloneLeft.pop();
        cloneRight.pop();
        dimtypes.primitive.kb.push(el);
      }
      else {
        const el = cloneLeft.pop();
        cloneRight.pop();
        dimtypes.loop.bk.push(el);
        tempLoop = true;
      }
      i++;
    }
    else if (inNode && !inLeft && inRight ) {
      if(!tempThird) {
        tempLoop = false;
      }

      if(!tempLoop) {
        tempFirst = true;
        tempSecond = true;
        tempThird = true;
        dimtypes.primitive.nb.push(element);
        cloneNode.pop();
        cloneRight.pop();
      }
      else{
        dimtypes.loop.bn.push(element);
        cloneNode.pop();
        cloneRight.pop();
      }
    }
    else {
      console.log(element, cloneNode, cloneLeft, cloneRight);
    };
  }

  cloneLeft?.reverse().forEach(element => {
    const {inNode, inLeft, inRight} = checkOccurrence(element, cloneNode, cloneLeft, cloneRight);

    if (inNode && inLeft && inRight) {
      dimtypes.loop.bc.push(element);
      cloneNode=cloneNode.filter(item => item !== element);
      cloneLeft=cloneLeft.filter(item => item !== element);
      cloneRight=cloneRight.filter(item => item !== element);
    }
    if (inNode && inLeft && !inRight) {
      dimtypes.loop.bm.push(element);
      cloneNode=cloneNode.filter(item => item !== element);
      cloneLeft=cloneLeft.filter(item => item !== element);
    }
    if (!inNode && inLeft && inRight) {
      dimtypes.loop.bk.push(element);
      cloneLeft=cloneLeft.filter(item => item !== element);
      cloneRight=cloneRight.filter(item => item !== element);
    }
  });
  cloneRight?.reverse().forEach(element => {
    const {inNode, inLeft, inRight} = checkOccurrence(element, cloneNode, cloneLeft, cloneRight);

    if (inNode && inLeft && inRight) {
      dimtypes.loop.bc.push(element);
      cloneNode=cloneNode.filter(item => item !== element);
      cloneLeft=cloneLeft.filter(item => item !== element);
      cloneRight=cloneRight.filter(item => item !== element);
    }
    if (inNode && !inLeft && inRight) {
      dimtypes.loop.bn.push(element);
      cloneNode=cloneNode.filter(item => item !== element);
      cloneRight=cloneRight.filter(item => item !== element);
    }
    if (!inNode && inLeft && inRight) {
      dimtypes.loop.bk.push(element);
      cloneLeft=cloneLeft.filter(item => item !== element);
      cloneRight=cloneRight.filter(item => item !== element);
    }
  });
  return dimtypes
}

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
  
  const traverseTree = (node) => {
    if (node.left && node.right) {
      const dimtypes = dimensionTypes(node.value, node.left.value, node.right.value);
      const operations = calculateOperations(dimtypes, indexSizes);
      totalOperations += operations;
      
      traverseTree(node.left);
      traverseTree(node.right);
    }
  };
  
  traverseTree(tree.root);
  return totalOperations;
}