// Function to split the input string into input and output parts
export function splitString(inputString) {
    const parts = inputString.split('->');
    if (parts.length !== 2) {
      throw new Error('Invalid input string format. Expected "input->output".');
    }
    const stringsIn = parts[0].split(',').map(s => s.trim());
    const stringOut = parts[1].trim();
    return [stringsIn, stringOut];
  }
  
  // Function to identify dimensions
  export function identifyDims(contractInLeft, contractInRight, stringRemaining) {
    const setLeft = new Set(contractInLeft);
    const setRight = new Set(contractInRight);
    const setRemaining = new Set(stringRemaining);
  
    const b = [...setLeft].filter(char => setRight.has(char) && !setRemaining.has(char));
    const m = [...setLeft].filter(char => !setRight.has(char) && setRemaining.has(char));
    const n = [...setRight].filter(char => !setLeft.has(char) && setRemaining.has(char));
  
    return [b, m, n];
  }
  
  // Node class for the contraction tree
  export class Node {
    constructor(string) {
      this.string = string;
      this.stringCmnk = string;
      this.left = null;
      this.right = null;
      this.sizes = null;
    }
  }