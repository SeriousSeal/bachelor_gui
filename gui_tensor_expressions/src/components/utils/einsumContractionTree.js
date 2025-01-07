import { Toast } from '../common/Toast';

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
        if (str[index] === ']') {
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
        left.deleteAble = true;
        const head = parseArray();
        index++;
        return new Node(head, left, null, true);
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
    if (index < str.length) {
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
  constructor(value, left = null, right = null, deleteAble = false) {
    this.id = Tree.getNextId();  // Use the static method instead of direct counter access
    this.value = value;
    this.left = left;
    this.right = right;
    this.string = Array.isArray(value) ? value.join('') : value;
    this.sizes = null;
    this.deleteAble = deleteAble;
  }

  isLeaf() {
    return this.left === null && this.right === null;
  }
}

// Add this helper function to reconstruct Node objects
function reconstructNode(nodeData) {
  if (!nodeData) return null;

  // Create a new Node instance with the main properties
  const node = new Node(nodeData.value, null, null, nodeData.deleteAble);

  // Copy over the additional properties
  node.id = nodeData.id;
  node.string = nodeData.string;
  node.sizes = nodeData.sizes;

  // Recursively reconstruct child nodes
  node.left = reconstructNode(nodeData.left);
  node.right = reconstructNode(nodeData.right);

  return node;
}

export class Tree {
  static nodeIdCounter = 0;  // Keep the static counter

  constructor(str = null) {
    Tree.nodeIdCounter = 0;  // Reset counter in constructor
    if (str) {
      this.root = parseTree(str);
    } else {
      this.root = null;
    }
    this.indexSizes = {};
  }

  static getNextId() {
    return `node_${Tree.nodeIdCounter++}`;
  }

  setRoot(root) {
    this.root = root;
    return this;
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
      node.sizes = node.value.map(char => this.indexSizes[char] || 2); // Default to 10 if not specified
    }

    this.updateNodeSizes(node.left);
    this.updateNodeSizes(node.right);
  }

  // Add this method to the Tree class
  treeToString(node = this.root) {
    if (!node) return '';

    let result = this._treeToStringHelper(node);

    result = result.slice(1, -1);
    return result;
  }

  // Add a helper method for the recursive string building
  _treeToStringHelper(node) {
    if (!node) return '';

    // If it's a leaf node, return the array representation
    if (node.isLeaf()) {
      return `[${node.value.join(',')}]`;
    }

    // For nodes with children
    if (node.right) {
      // Case: node has both children
      return `[${this._treeToStringHelper(node.left)},${this._treeToStringHelper(node.right)}->[${node.value.join(',')}]]`;
    } else {
      // Case: node has only left child
      return `[${this._treeToStringHelper(node.left)}->[${node.value.join(',')}]]`;
    }
  }

  // Add method to swap children
  swapChildren(nodeId) {
    const swapNodesInTree = (node) => {
      if (!node) return false;

      if (node.id === nodeId) {
        // Swap the children
        const temp = node.left;
        node.left = node.right;
        node.right = temp;
        return true;
      }

      return swapNodesInTree(node.left) || swapNodesInTree(node.right);
    };

    swapNodesInTree(this.root);
  }

  // Add method to create a deep copy of the tree
  clone() {
    const maxIdLastTime = Tree.nodeIdCounter;
    const newTree = new Tree();
    newTree.root = reconstructNode(this.root);
    newTree.indexSizes = { ...this.indexSizes };
    Tree.nodeIdCounter = maxIdLastTime;
    return newTree;
  }

  updateIndices(updatedNodes) {
    if (!updatedNodes) {
      console.warn('updateIndices called with null/undefined updatedNodes');
      return false;
    }

    let wasUpdated = false;

    const findAndUpdateNode = (id, newValue) => {
      if (!id || !newValue) {
        console.warn('Invalid id or newValue:', { id, newValue });
        return;
      }
      const node = this.findNode(id);
      if (node) {
        node.value = newValue;
        node.string = Array.isArray(newValue) ? newValue.join('') : newValue;
        wasUpdated = true;
      } else {
        console.warn(`Node with id ${id} not found`);
      }
    };

    if (updatedNodes.id && updatedNodes.value) {
      findAndUpdateNode(updatedNodes.id, updatedNodes.value);
    }
    if (updatedNodes.left?.id && updatedNodes.left?.value) {
      findAndUpdateNode(updatedNodes.left.id, updatedNodes.left.value);
    }
    if (updatedNodes.right?.id && updatedNodes.right?.value) {
      findAndUpdateNode(updatedNodes.right.id, updatedNodes.right.value);
    }

    if (wasUpdated) {
      // Instead of spreading, create a new Node instance with the same data
      const newRoot = reconstructNode(this.root);
      this.root = newRoot;
      return true;
    }
    return false;
  }

  findNode(id) {
    const search = (node) => {
      if (!node) return null;
      if (node.id === id) return node;
      const left = search(node.left);
      if (left) return left;
      return search(node.right);
    };
    return search(this.root);
  }

  addPermutationNode(nodeId) {
    console.log(Tree.nodeIdCounter)
    const addNewLeftChild = (node) => {
      if (!node) return false;

      if (node.id === nodeId) {
        // Create a proper new Node instance
        const newLeftChild = new Node(
          node.value,
          node.left,
          node.right,
          true
        );
        // The Node constructor already calls Tree.getNextId()
        newLeftChild.sizes = node.sizes;
        console.log(newLeftChild)


        // Update the current node
        node.left = newLeftChild;
        node.right = null;
        node.deleteAble = true;
        console.log(node)

        return true;
      }

      return addNewLeftChild(node.left) || addNewLeftChild(node.right);
    };

    return addNewLeftChild(this.root);
  }

  removePermutationNode(nodeId) {
    // Special case for root node
    if (this.root && this.root.id === nodeId) {
      if (this.root.left && !this.root.right) {
        this.root = this.root.left;
        return true;
      }
      return false;
    }

    const removeNode = (node) => {
      if (!node) return false;

      // Check left child
      if (node.left?.id === nodeId) {
        console.log(node)
        if (node.left.left && !node.left.right) {  // Is it a permutation node?
          // Create new Node instance for the left child
          const newNode = new Node(
            node.left.left.value,
            node.left.left.left,
            node.left.left.right,
            false
          );
          newNode.id = node.left.left.id;
          newNode.sizes = node.left.left.sizes;
          node.left = newNode;
        } else {
          // Create new Node instance for the current node
          const newNode = new Node(
            node.left.value,
            node.left.left,
            node.left.right,
            false
          );
          newNode.id = node.left.id;
          newNode.sizes = node.left.sizes;
          Object.assign(node, newNode);
        }
        return true;
      }

      // Check right child
      else if (node.right?.id === nodeId) {
        console.log(node)
        if (node.right.left && !node.right.right) {  // Is it a permutation node?
          // Create new Node instance for the right child
          const newNode = new Node(
            node.right.left.value,
            node.right.left.left,
            node.right.left.right,
            false
          );
          newNode.id = node.right.left.id;
          newNode.sizes = node.right.left.sizes;
          node.right = newNode;
        } else {
          throw new Error('Cannot remove non-permutation node');
        }
        return true;
      }

      return removeNode(node.left) || removeNode(node.right);
    };

    return removeNode(this.root);
  }
}