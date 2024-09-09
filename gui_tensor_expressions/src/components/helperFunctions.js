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
  export function identifyDims(iStringInLeft, iStringInRight, iStringOut) {
    let lC = [];
    let lM = [];
    let lN = [];
    let lK = [];
  
    const lCharsInLeft = Array.from(iStringInLeft);
    const lCharsInRight = Array.from(iStringInRight);
    const lCharsOut = Array.from(iStringOut);
  
    // Identify dimensions
    const lBk = new Set(lCharsInLeft.filter(char => lCharsInRight.includes(char)));
    lC = Array.from(lBk).filter(char => lCharsOut.includes(char));
    lK = Array.from(lBk).filter(char => !lC.includes(char));
  
    lM = Array.from(new Set(lCharsInLeft)).filter(char => !lC.includes(char) && !lK.includes(char));
    lN = Array.from(new Set(lCharsInRight)).filter(char => !lC.includes(char) && !lK.includes(char));
  
    return [lC, lM, lN, lK];
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