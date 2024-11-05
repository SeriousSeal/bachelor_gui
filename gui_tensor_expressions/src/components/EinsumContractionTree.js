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

  function formatError(message, position) {
    const line1 = "Error: " + message;
    const line2 = str;
    const line3 = " ".repeat(position) + "^";
    return `${line1}\n${line2}\n${line3}`;
  }

  function parseArray() {
    const result = [];
    while (index < str.length) {
      if (str[index] === ']') {
        index++;
        break;
      }

      let num = '';
      while (index < str.length && isLetterOrNumber(str[index])) {
        num += str[index++];
      }

      if (num) {
        result.push(num);
      }

      if (str[index] === ',' && index < str.length) {
        index++;
        if(str[index] === ']') {
          throw new Error(formatError(`Expected character but found ']'`, index));
        }
      }
      if (index < str.length && !isValidArrayChar(str[index])) {
        throw new Error(formatError(`Invalid character '${str[index]}'`, index));
      }
    }
    return result;
  }

  function parse() {
    if (index >= str.length) {
      throw new Error(formatError("Unexpected end of input", str.length));
    }
    if (str[index] === '[') {
      index++;
      const left = parse();
      if (str.slice(index, index + 3) === '->[') {
        index += 3;
        const head = parseArray();
        index++;
        return new Node(head, left, null);
      }
      if (str.slice(index, index + 2) !== '+[' && str.slice(index, index + 2) !== ',[') {
        throw new Error(formatError(
          `Expected '+[' or ',[' but found '${str.slice(index, index + 2)}'`,
          index
        ));
      }
      index += 2;
      const right = parse();
      
      if (str.slice(index, index + 3) === '->[') {
        index += 3;
        const head = parseArray();
        index++;
        return new Node(head, left, right);
      } else {
        throw new Error(formatError(
          `Expected '->' but found '${str.slice(index, index + 2)}'`,
          index
        ));
      }
    } else {
      return new Node(parseArray());
    }
  }

  try {
    const parsedTree = parse();
    index--;
    if (index < str.length){
      throw new Error(formatError(
        `Parsed tree but found extra characters '${str.slice(index)}'`,
        index
      ));
    }
    return parsedTree;
  } catch (error) {
    console.error(error.message);
    Toast.show(error.message);
    return null;
  }
}

class Node {
  constructor(value, left = null, right = null) {
    this.value = value;
    this.left = left;
    this.right = right;
    this.string = Array.isArray(value) ? value.join('') : value;
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
}