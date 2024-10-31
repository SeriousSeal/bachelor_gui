import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import MiniReactFlowTree from './MiniReactFlowTree';
import { dimensionTypes } from '../dimsAndOps';

import {isEqual } from "lodash"; 

const InfoPanel = ({ node, connectedNodes, onSwapChildren, onShowContraction, onClose, initialPosition }) => {
    const [position, setPosition] = useState(initialPosition);
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const panelRef = useRef(null);
    const prevConnectedNodesRef = useRef(connectedNodes);
  
    useEffect(() => {
      
      if (!isEqual(prevConnectedNodesRef.current, connectedNodes)) {
        prevConnectedNodesRef.current = connectedNodes;
      }
  
      return;
    });
  
    const dimTypes = useMemo(() => {
      const result = dimensionTypes(connectedNodes.value, connectedNodes.left?.value, connectedNodes.right?.value);
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
      width: '460px',
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
  
    const titleStyle = { fontSize: '20px', fontWeight: 'bold', marginBottom: '12px', color: '#333' ,
      alignItems: "center",};
  
    const letterContainerStyle = {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      marginRight: '16px',
      marginLeft: '16px',
      marginTop: '24px',
    };
  
    const letterStyle = {
      fontSize: '20px',
      fontWeight: 'bold',
      lineHeight: '1.5',
      marginBottom: '4px',
    };
  
    const reactFlowPanelStyle = {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: '16px',
      maxWidth: '304px', // Match MiniReactFlowTree container width
      margin: '0 auto', // Center the flow
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
  
    const handleMouseMove = useCallback((e) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        });
      }
    }, [isDragging, dragOffset]);
  
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
    }, [isDragging, handleMouseMove]);
  
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