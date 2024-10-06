import React, { useState, useRef, useEffect, useMemo } from 'react';
import MiniReactFlowTree from './MiniReactFlowTree';

import { cloneDeep, isEqual } from "lodash"; 


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
  
  
  const dimensionTypes = (node, left, right) => {
    let cloneNode = cloneDeep(node);
    let cloneLeft = cloneDeep(left);
    let cloneRight = cloneDeep(right);
    const dimtypes = createDimTypes();
    let tempFirst, tempSecond, tempThird = false;
    
  
    for (let i = node.length - 1; i >= 0; i--) {
      const element = node[i];
      const {inNode, inLeft, inRight} = checkOccurrenceLast(element, cloneNode, cloneLeft, cloneRight);
      if (inNode && inLeft && inRight && !tempFirst) {
        dimtypes.primitive.cb.push(element);
        cloneNode.pop();
        cloneLeft.pop();
        cloneRight.pop();
      }
      else if (inNode && inLeft && !inRight && !tempSecond) {
        tempFirst = true;
        dimtypes.primitive.mb.push(element);
        cloneNode.pop();
        cloneLeft.pop();
      }
      else if (!tempThird) {
        tempSecond = true;
        tempThird = true;
        while (cloneLeft?.length > 0 && cloneRight?.length > 0) {
          if (cloneLeft[cloneLeft.length - 1] === cloneRight[cloneRight.length - 1]) {
            const el = cloneLeft.pop();
            cloneRight.pop();
            dimtypes.primitive.kb.push(el);
          } else {
            break;
          }
        }
        i++;
      }
      else if (inNode && !inLeft && inRight ) {
        dimtypes.primitive.nb.push(element);
        cloneNode.pop();
        cloneRight.pop();
      }
      else break;
    }
  
    //check for kb
   
  
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
  

const InfoPanel = ({ node, connectedNodes, onSwapChildren, onShowContraction, onClose, initialPosition }) => {
    const [position, setPosition] = useState(initialPosition);
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const panelRef = useRef(null);
    const renderCountRef = useRef(0);
    const prevConnectedNodesRef = useRef(connectedNodes);
  
    useEffect(() => {
      console.log('InfoPanel rendered. Count:', ++renderCountRef.current);
      
      if (!isEqual(prevConnectedNodesRef.current, connectedNodes)) {
        console.log('connectedNodes changed:', {
          prev: prevConnectedNodesRef.current,
          current: connectedNodes
        });
        prevConnectedNodesRef.current = connectedNodes;
      }
  
      return () => console.log('InfoPanel will update. Count:', renderCountRef.current);
    });
  
    const dimTypes = useMemo(() => {
      console.log('Calculating dimTypes...');
      const result = dimensionTypes(connectedNodes.value, connectedNodes.left?.value, connectedNodes.right?.value);
      console.log('Calculated dimTypes:', result);
      return result;
    }, [connectedNodes]);
  
    const isEmptyDimTypes = useMemo(() => 
      Object.values(dimTypes).every(category => 
        Object.values(category).every(arr => arr.length === 0)
      ),
      [dimTypes]
    );
  
    const panelStyle = {
      position: 'absolute',
      top: `${position.y}px`,
      left: `${position.x}px`,
      zIndex: 10,
      width: '360px',
      cursor: isDragging ? 'grabbing' : 'grab',
      userSelect: 'none',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      backdropFilter: 'blur(5px)',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    };
  
    const titleStyle = { fontSize: '20px', fontWeight: 'bold', marginBottom: '12px', color: '#333' };
  
    const letterContainerStyle = {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      marginRight: '16px',
    };
  
    const letterStyle = {
      fontSize: '24px',
      fontWeight: 'bold',
      lineHeight: '1.5',
      marginBottom: '8px',
    };
  
    const reactFlowPanelStyle = {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: '16px',
    };
  
    const tableStyle = {
      width: '100%',
      borderCollapse: 'separate',
      borderSpacing: '0',
      marginTop: '16px',
      backgroundColor: 'white',
      borderRadius: '8px',
      overflow: 'hidden',
    };
  
    const cellStyle = {
      padding: '10px',
      textAlign: 'center',
      borderBottom: '1px solid #e0e0e0',
    };
  
    const headerCellStyle = {
      ...cellStyle,
      backgroundColor: '#f5f5f5',
      fontWeight: 'bold',
      color: '#333',
    };
  
  
    const handleMouseDown = (e) => {
      if (e.target === panelRef.current || panelRef.current.contains(e.target)) {
        setIsDragging(true);
        setDragOffset({
          x: e.clientX - position.x,
          y: e.clientY - position.y,
        });
      }
    };
  
    const handleMouseMove = (e) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        });
      }
    };
  
    const handleMouseUp = () => {
      setIsDragging(false);
    };
  
    useEffect(() => {
      if (isDragging) {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
      } else {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      }
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }, [isDragging]);
  
    return (
      <div 
        ref={panelRef}
        className="border border-gray-300 rounded shadow-md relative"
        style={panelStyle}
        onMouseDown={handleMouseDown}
      >
        <div style={reactFlowPanelStyle}>
          <div style={letterContainerStyle}>
            <span style={{ ...letterStyle, color: '#a6cee3' }}>C</span>
            <span style={{ ...letterStyle, color: '#1f78b4' }}>M</span>
            <span style={{ ...letterStyle, color: '#33a02c' }}>N</span>
            <span style={{ ...letterStyle, color: '#b2df8a' }}>K</span>
          </div>
          <div>
            <h3 style={titleStyle}>Contraction Info</h3>
            <div className="mt-4 mb-4 flex justify-center">
              <MiniReactFlowTree 
                node={connectedNodes.value} 
                left={connectedNodes.left?.value} 
                right={connectedNodes.right?.value}
                dimTypes={dimTypes}
              />
            </div>
            {/*
            <div className="mt-4">
              <button 
                className="bg-blue-500 text-white px-3 py-1 rounded mr-2 hover:bg-blue-600 transition-colors"
                onClick={(e) => { e.stopPropagation(); onSwapChildren(); }}
              >
                Swap Children
              </button>
            </div>
            */}
          </div>
        </div>
        {!isEmptyDimTypes && (
          <div className="mt-4 w-full overflow-x-auto">
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={headerCellStyle}>Type</th>
                  <th style={headerCellStyle}>Primitive</th>
                  <th style={headerCellStyle}>Loop</th>
                </tr>
              </thead>
              <tbody>
                {['C', 'M', 'N', 'K'].map((type, index) => {
                  const primitiveKey = `${type.toLowerCase()}b`;
                  const loopKey = `b${type.toLowerCase()}`;
                  const primitiveData = dimTypes.primitive[primitiveKey] || [];
                  const loopData = dimTypes.loop[loopKey] || [];
                  console.log(`Rendering row ${type}:`, {
                    primitive: primitiveData,
                    loop: loopData
                  });
                  return (
                    <tr key={type} style={{ backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'white' }}>
                      <td style={cellStyle}>{type}</td>
                      <td style={cellStyle}>{primitiveData.join(', ') || '-'}</td>
                      <td style={cellStyle}>{loopData.join(', ') || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        
        <button 
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl font-bold"
          onClick={(e) => { e.stopPropagation(); onClose(); }}
        >
          ×
        </button>
      </div>
    );
  };

  export default React.memo(InfoPanel, (prevProps, nextProps) => 
    isEqual(prevProps.connectedNodes, nextProps.connectedNodes)
  );