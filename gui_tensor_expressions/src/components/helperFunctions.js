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

  export function sizesDims(
    i_string_in_left,
    i_string_in_right,
    i_sizes_left,
    i_sizes_right,
    i_b,
    i_m,
    i_n,
    i_k
  ) {
    const l_sizes_b = [];
    const l_sizes_m = [];
    const l_sizes_n = [];
    const l_sizes_k = [];
  
    const l_chars_left = [...i_string_in_left];
    const l_chars_right = [...i_string_in_right];
  
    for (const l_char of i_b) {
      const l_id = l_chars_left.indexOf(l_char);
      l_sizes_b.push(i_sizes_left[l_id]);
    }
  
    for (const l_char of i_m) {
      const l_id = l_chars_left.indexOf(l_char);
      l_sizes_m.push(i_sizes_left[l_id]);
    }
  
    for (const l_char of i_n) {
      const l_id = l_chars_right.indexOf(l_char);
      l_sizes_n.push(i_sizes_right[l_id]);
    }
  
    for (const l_char of i_k) {
      const l_id = l_chars_left.indexOf(l_char);
      l_sizes_k.push(i_sizes_left[l_id]);
    }
  
    return [l_sizes_b, l_sizes_m, l_sizes_n, l_sizes_k];
  }