import { identifyDims, sizesDims } from './helperFunctions.js';
import { Toast } from './visual/toast.js';

function isLetterOrNumber(char) {
  return /^[a-zA-Z0-9]$/.test(char);
}

function isValidArrayChar(char) {
  return /^[a-zA-Z0-9,[\]]$/.test(char);
}

export function parseTree(str) {
  let index = 0;
  str = str.replace(/\s/g, '');

  function parseArray() {
    const result = [];
    while (index < str.length) {
      if (str[index] === ']') {
        index++; // Skip closing bracket
        break;
      }

      let num = '';
      while (index < str.length && isLetterOrNumber(str[index])) {
        num += str[index++];
      }

      if (num) {
        result.push(num);
      }

      // Skip comma or any other non-alphanumeric character
      if (str[index] === ',' && index < str.length) {
        index++; // Skip ','
      }
      if (!isValidArrayChar(str[index])) {
        throw new Error(`unexpected character at position ${index}: ${str[index]}`);
      }
    }
    return result;
  }

  function parse() {
    if (index >= str.length) {
      throw new Error('Unexpected end of input');
    }
    if (str[index] === '[') {
      index++;
      const left = parse();
      if (str.slice(index, index + 2) !== '+[') {
        throw new Error(`Expected '+[' at position ${index}`);
      }
      index += 2; // Skip '+['
      const right = parse();
      
      if (str.slice(index, index + 3) === '->[') {
        index += 3; // Skip '->'
        const head = parseArray();
        index++;
        return new Node(head, left, right);
      } else {
        throw new Error(`Expected head at pos ${index} (no "->") ${str.slice(index, index + 2)}`);
      }
    } else {
      return new Node(parseArray());
    }
  }
  try {
    return parse();
  } catch (error) {
    console.error(`Error parsing input: ${error.message}`);
    Toast.show(`Error parsing input: ${error.message}`);
    return null; // or handle the error in a way that fits your application
  }
}

function reorderBinaryLeadingM(iStringInLeft, iStringInRight, iStringOut, iSizesInLeft, iSizesInRight, iSizesOut, iSepChar = '') {
  let [lC, lM, lN, lK] = identifyDims(iStringInLeft, iStringInRight, iStringOut);

  // Convert to arrays and sort
  lC = [...iStringOut].filter(lX => lC.includes(lX));
  lM = [...iStringOut].filter(lX => lM.includes(lX));
  lN = [...iStringOut].filter(lX => lN.includes(lX));
  lK = [...iStringInLeft].filter(lX => lK.includes(lX));

  // Derive sizes
  let [, , , lSk] = sizesDims(iStringInLeft, iStringInRight, iSizesInLeft, iSizesInRight, lC, lM, lN, lK);

  // TODO: dummy cb
  let lCb = '';

  // Identify mb
  let lMb = '';
  let lIdOut = 0;
  while (lIdOut < iStringOut.length) {
    let lChar = iStringOut[lIdOut];
    if (lM.includes(lChar)) {
      lMb += lChar;
      lM = lM.filter(x => x !== lChar);
      lIdOut++;
    } else {
      break;
    }
  }

  // Identify nb
  let lNb = '';
  if (lN.length > 0) {
    lNb = lN[0];
    lIdOut++;
    lN.shift();
  }

  // Identify kb
  let lKb = '';
  if (lK.length > 0) {
    let lIdKb = lSk.indexOf(Math.max(...lSk));
    lKb = lK[lIdKb];
    lK.splice(lIdKb, 1);
  }

  // Identify bc, bm, bn and bk
  let lBc = lC.join('');
  let lBm = lM.join('');
  let lBn = lN.join('');
  let lBk = lK.join('');

  // Assemble input tensor's dimensions
  let lDimsA = [lMb, lKb, lCb, lBk, lBm, lBc];
  let lDimsB = [lKb, lNb, lCb, lBk, lBn, lBc];

  // Return reordered string
  let lStringA = lDimsA.join(iSepChar);
  let lStringB = lDimsB.join(iSepChar);

  return [lStringA, lStringB];
}

function reorderBinaryLeadingCm(iStringInLeft, iStringInRight, iStringOut, iSizesInLeft, iSizesInRight, iSizesOut, iSepChar = '') {
  let [lC, lM, lN, lK] = identifyDims(iStringInLeft, iStringInRight, iStringOut);

  // Convert to arrays and sort
  lC = [...iStringOut].filter(lX => lC.includes(lX));
  lM = [...iStringOut].filter(lX => lM.includes(lX));
  lN = [...iStringOut].filter(lX => lN.includes(lX));
  lK = [...iStringInLeft].filter(lX => lK.includes(lX));

  // Derive sizes
  let [, , , lSk] = sizesDims(iStringInLeft, iStringInRight, iSizesInLeft, iSizesInRight, lC, lM, lN, lK);

  // Identify cb
  let lCb = '';
  let lIdOut = 0;
  while (lIdOut < iStringOut.length) {
    let lChar = iStringOut[lIdOut];
    if (lC.includes(lChar)) {
      lCb += lChar;
      lC = lC.filter(x => x !== lChar);
      lIdOut++;
    } else {
      break;
    }
  }

  // Identify mb
  let lMb = '';
  if (lM.length > 0) {
    lMb = lM[0];
    lIdOut++;
    lM.shift();
  }

  // Identify nb
  let lNb = '';
  if (lN.length > 0) {
    lNb = lN[0];
    lIdOut++;
    lN.shift();
  }

  // Identify kb
  let lKb = '';
  if (lK.length > 0) {
    let lIdKb = lSk.indexOf(Math.max(...lSk));
    lKb = lK[lIdKb];
    lK.splice(lIdKb, 1);
  }

  // Identify bc, bm, bn and bk
  let lBc = lC.join('');
  let lBm = lM.join('');
  let lBn = lN.join('');
  let lBk = lK.join('');

  // Assemble input tensor's dimensions
  let lDimsA = [lCb, lMb, lKb, lBk, lBm, lBc];
  let lDimsB = [lCb, lKb, lNb, lBk, lBn, lBc];

  // Return reordered string
  let lStringA = lDimsA.join(iSepChar);
  let lStringB = lDimsB.join(iSepChar);

  return [lStringA, lStringB];
}

class Node {
  constructor(value, left = null, right = null) {
    this.value = value;
    this.left = left;
    this.right = right;
    this.string = Array.isArray(value) ? value.join('') : value;
    this.stringCmnk = this.string;
    this.sizes = null;
  }

  isLeaf() {
    return this.left === null && this.right === null;
  }
}

export class Tree {
  constructor(str) {
    this.root = parseTree(str);
    this.indexSizes = {};
  }

  getRoot() {
    return this.root;
  }

  // Method to update sizes for specific indices
  updateIndexSizes(newSizes) {
    this.indexSizes = { ...this.indexSizes, ...newSizes };
    this.updateNodeSizes(this.root);
  }

  // Recursively update node sizes based on indexSizes
  updateNodeSizes(node) {
    if (!node) return;

    if (node.value && Array.isArray(node.value)) {
      node.sizes = node.value.map(char => this.indexSizes[char] || 10); // Default to 10 if not specified
    }

    this.updateNodeSizes(node.left);
    this.updateNodeSizes(node.right);
  }

  reorder(iNode = null) {
    let lNode = iNode === null ? this.root : iNode;

    if (!lNode || !lNode.left || !lNode.right) {
      return this.root;
    }

    // Identify dimensions
    let [lC, lM, lN, lK] = identifyDims(lNode.left.value.join(''), lNode.right.value.join(''), lNode.value.join(''));

    let lStringInLeft = 'N/A';
    let lStringInRight = 'N/A';

    try {
      // Use the current node's sizes for reordering
      if (lNode.value.length === 0) {
        [lStringInLeft, lStringInRight] = reorderBinaryLeadingM(
          lNode.left.value.join(''),
          lNode.right.value.join(''),
          lNode.value.join(''),
          lNode.left.sizes,
          lNode.right.sizes,
          lNode.sizes,
          '-'
        );
      } else if (lM.includes(lNode.value[0]) || lN.includes(lNode.value[0])) {
        if (lN.includes(lNode.value[0])) {
          [lNode.left, lNode.right] = [lNode.right, lNode.left];
        }
        [lStringInLeft, lStringInRight] = reorderBinaryLeadingM(
          lNode.left.value.join(''),
          lNode.right.value.join(''),
          lNode.value.join(''),
          lNode.left.sizes,
          lNode.right.sizes,
          lNode.sizes,
          '-'
        );
      } else if (lC.includes(lNode.value[0])) {
        let lId;
        for (lId = 0; lId < lNode.value.length; lId++) {
          if (!lC.includes(lNode.value[lId])) {
            break;
          }
        }
        if (lN.includes(lNode.value[lId])) {
          [lNode.left, lNode.right] = [lNode.right, lNode.left];
        }
        [lStringInLeft, lStringInRight] = reorderBinaryLeadingCm(
          lNode.left.value.join(''),
          lNode.right.value.join(''),
          lNode.value.join(''),
          lNode.left.sizes,
          lNode.right.sizes,
          lNode.sizes,
          '-'
        );
      }

      // Update node values and sizes based on reordering
      lNode.left.value = lStringInLeft.replace(/-/g, '').split('');
      lNode.right.value = lStringInRight.replace(/-/g, '').split('');
      lNode.left.stringCmnk = lStringInLeft;
      lNode.right.stringCmnk = lStringInRight;

      // Update sizes for reordered nodes
      this.updateNodeSizes(lNode.left);
      this.updateNodeSizes(lNode.right);

      // Reorder children
      this.reorder(lNode.left);
      this.reorder(lNode.right);
    } catch (error) {
      console.error('Error in Tree.reorder:', error);
      Toast.show(`Error in reordering tree: ${error.message}`);
    }

    return this.root;
  }

}