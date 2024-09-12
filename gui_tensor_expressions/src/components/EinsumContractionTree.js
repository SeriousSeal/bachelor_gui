import { Toast } from './visual/toast.js';
class Node {
    constructor(value, left = null, right = null) {
      this.value = value;
      this.left = left;
      this.right = right;
    }
  }

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
        if (str[index] === ',' && index < str.length){
            index++; // Skip ','
        }
        if(!isValidArrayChar(str[index])){
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