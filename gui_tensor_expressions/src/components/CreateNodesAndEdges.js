import React from 'react';

// Assuming these are imported from another file
import { splitString, identifyDims, Node } from './helperFunctions';

const EinsumContractionTree = ({ iString, iPath, iSizes = null }) => {
  const analysis = {
    interStrings: (iString, iContractPath) => {
      let lString = iString;
      let [lStringsIn, lStringOut] = splitString(lString);
      const lStringsInter = [];
    
      for (const lTuple of iContractPath) {
        const newInterString = interStringSingle(lTuple, lString);
        lStringsInter.push(newInterString);
        console.log(newInterString);
        // Update lStringsIn
        lStringsIn = [
          ...lStringsIn.slice(0, Math.min(...lTuple)),
          ...lStringsIn.slice(Math.min(...lTuple) + 1, Math.max(...lTuple)),
          ...lStringsIn.slice(Math.max(...lTuple) + 1),
          newInterString
        ];
    
        // Reconstruct lString
        lString = lStringsIn.join(',') + '->' + lStringOut;
      }
    
      return lStringsInter;
    },

    uniqueTensorIds: (iContractionTuples) => {
      let lNTensors = iContractionTuples.length + 1;
      let lTensorIds = Array.from({ length: lNTensors }, (_, i) => i);

      const lTuplesUnique = [];

      for (const lTuple of iContractionTuples) {
        lTuplesUnique.push([lTensorIds[lTuple[0]], lTensorIds[lTuple[1]]]);

        lTensorIds.splice(Math.max(...lTuple), 1);
        lTensorIds.splice(Math.min(...lTuple), 1);
        lTensorIds.push(lNTensors);
        lNTensors++;
      }

      return lTuplesUnique;
    },

    sizesBinaryContraction: (
      iStringInLeft,
      iStringInRight,
      iStringOut,
      iSizesInLeft,
      iSizesInRight
    ) => {
      const lCharsInLeft = iStringInLeft.split('');
      const lCharsInRight = iStringInRight.split('');
      const lCharsOut = iStringOut.split('');

      const lSizes = [];

      for (const lChar of lCharsOut) {
        let lSize;
        if (lCharsInLeft.includes(lChar)) {
          const lId = lCharsInLeft.indexOf(lChar);
          lSize = iSizesInLeft[lId];
        } else {
          console.assert(lCharsInRight.includes(lChar));
          const lId = lCharsInRight.indexOf(lChar);
          lSize = iSizesInRight[lId];
        }

        lSizes.push(lSize);
      }

      return lSizes;
    },
  };


  const interStringSingle = (iContractTuple, iString) => {
    let [lStringsIn, lStringOut] = splitString(iString);
  
    const lContractInLeft = lStringsIn[iContractTuple[0]];
    const lContractInRight = lStringsIn[iContractTuple[1]];
  
    // Remove used strings from inputs
    lStringsIn.splice(Math.max(...iContractTuple), 1);
    lStringsIn.splice(Math.min(...iContractTuple), 1);
  
    const lStringRemaining = [lStringOut, ...lStringsIn].join('');
  
    const [lB, lM, lN] = identifyDims(
      lContractInLeft,
      lContractInRight,
      lStringRemaining
    );
    console.log(lB, lM, lN);
  
    // Combine preserved dimensions in the correct order
    const lResult = [...new Set([...lB, ...lM, ...lN])].join('');

    console.log(lResult);
  
    return lResult;
  };

  const initEinsumContractionTree = () => {
    const lStringsInter = analysis.interStrings(iString, iPath);
    const lPathUnique = analysis.uniqueTensorIds(iPath);

    let lString = iString;
    let [lStringsIn, lStringOut] = splitString(lString);
    const lNTensorsIn = lStringsIn.length;
    lString = lStringsIn.concat(lStringsInter).join(',') + '->' + lStringOut;
    console.log(lStringsInter);
    [lStringsIn, lStringOut] = splitString(lString);

    // generate the leaf nodes
    const lNodes = [];
    for (let lTe = 0; lTe < lNTensorsIn; lTe++) {
      lNodes.push(new Node(lStringsIn[lTe]));
      if (iSizes !== null) {
        lNodes[lNodes.length - 1].sizes = iSizes[lTe];
      }
    }

    // add nodes derived through contraction
    for (let lTe = 0; lTe < lStringsInter.length; lTe++) {
      const lTensor = lStringsIn[lNTensorsIn + lTe];
      const lIdLeft = lPathUnique[lTe][0];
      const lIdRight = lPathUnique[lTe][1];

      const lNode = new Node(lTensor);
      lNode.left = lNodes[lIdLeft];
      lNode.right = lNodes[lIdRight];

      if (iSizes !== null) {
        lNode.sizes = analysis.sizesBinaryContraction(
          lNode.left.string,
          lNode.right.string,
          lNode.string,
          lNode.left.sizes,
          lNode.right.sizes
        );
      }

      lNodes.push(lNode);
    }

    const root = lNodes[lNodes.length - 1];

    // overwrite derived string of root with provided one
    root.stringCmnk = lStringOut;
    root.string = lStringOut;

    return root;
  };

  // Return the tree directly
  return initEinsumContractionTree();
};

export default EinsumContractionTree;