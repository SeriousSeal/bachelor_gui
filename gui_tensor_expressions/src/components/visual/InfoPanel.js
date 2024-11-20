import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import MiniReactFlowTree from './MiniReactFlowTree';
import { dimensionTypes } from '../dimsAndOps';
import { useResponsive } from '../context/ResponsiveContext';
import { TbArrowsExchange } from "react-icons/tb";

import { isEqual } from "lodash";

const InfoPanel = ({ node, connectedNodes, onClose, initialPosition, indexSizes, showSizes, onToggleSizes, swapChildren }) => {
  const { panelWidth, fontSize, padding, miniFlow, showMiniFlow } = useResponsive();
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const panelRef = useRef(null);
  const prevConnectedNodesRef = useRef(connectedNodes);

  useEffect(() => {
    if (!isEqual(prevConnectedNodesRef.current, connectedNodes)) {
      prevConnectedNodesRef.current = connectedNodes;
    }
  }, [connectedNodes, indexSizes]);

  const dimTypes = useMemo(() => {
    return dimensionTypes(connectedNodes.value, connectedNodes.left?.value, connectedNodes.right?.value);
  }, [connectedNodes.value, connectedNodes.left?.value, connectedNodes.right?.value]);

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
    width: `${panelWidth}px`,
    cursor: isDragging ? 'grabbing' : 'grab',
    userSelect: 'none',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(5px)',
    padding: `${padding}px`,
    display: 'flex',
    flexDirection: 'column',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  };

  const titleStyle = {
    fontSize: '20px', fontWeight: 'bold', marginBottom: '12px', color: '#333',
    alignItems: "center",
  };

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
    height: '42px',
    position: 'relative',
  };

  const cellContentStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '100%',
  };

  const headerCellStyle = {
    ...cellStyle,
    backgroundColor: '#f5f5f5',
    fontWeight: 'bold',
    color: '#333',
  };

  const calculateSize = (indices) => {
    if (!indices || indices.length === 0) return '-';
    return indices.reduce((acc, index) => acc * (indexSizes[index] || 1), 1);
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

  const swapButtonStyle = {
    padding: '6px 12px',
    backgroundColor: '#f3f4f6',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    color: '#374151',
    fontSize: '14px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    margin: '8px auto',
    transition: 'all 0.2s ease-in-out',
    ':hover': {
      backgroundColor: '#e5e7eb',
    }
  };

  const handleSwap = useCallback(async (e) => {
    e.stopPropagation();
    await swapChildren(node);
  }, [node, swapChildren]);

  return (
    <div
      ref={panelRef}
      className="border border-gray-300 rounded shadow-md relative"
      style={panelStyle}
      onMouseDown={handleMouseDown}
    >
      <h3 style={titleStyle}>Contraction Info</h3>

      {showMiniFlow && (
        <div style={reactFlowPanelStyle}>
          <div style={letterContainerStyle}>
            <span style={{ ...letterStyle, color: '#a6cee3' }}>C</span>
            <span style={{ ...letterStyle, color: '#1f78b4' }}>M</span>
            <span style={{ ...letterStyle, color: '#33a02c' }}>N</span>
            <span style={{ ...letterStyle, color: '#b2df8a' }}>K</span>
          </div>
          <div>
            <div className="mt-4 mb-2 flex justify-center">
              <MiniReactFlowTree
                key={`${connectedNodes.value}-${connectedNodes.left?.value}-${connectedNodes.right?.value}`}
                node={connectedNodes.value}
                left={connectedNodes.left?.value}
                right={connectedNodes.right?.value}
                dimTypes={dimTypes}
              />
            </div>
            {node.data.left && node.data.right && (
              <button
                className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm text-gray-700 transition-colors duration-200 mx-auto mb-2"
                onClick={handleSwap}
                title="Swap Left and Right Children"
              >
                <TbArrowsExchange size={16} />
                Swap Children
              </button>
            )}
          </div>
        </div>
      )}

      {!isEmptyDimTypes && (
        <div className={`w-full overflow-x-auto ${!showMiniFlow ? 'mt-0' : 'mt-4'}`}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={headerCellStyle}>Type</th>
                <th style={headerCellStyle}>
                  <div className="flex flex-col items-center -mb-1">
                    <span>Primitive</span>
                    <span className={`text-xs text-gray-500 h-3 leading-3 ${showSizes ? 'opacity-100' : 'opacity-0'}`}>
                      (sizes)
                    </span>
                  </div>
                </th>
                <th style={headerCellStyle}>
                  <div className="flex flex-col items-center -mb-1">
                    <span>Loop</span>
                    <span className={`text-xs text-gray-500 h-3 leading-3 ${showSizes ? 'opacity-100' : 'opacity-0'}`}>
                      (sizes)
                    </span>
                  </div>
                </th>
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
                    <td style={cellStyle}>
                      <div style={cellContentStyle}>
                        <div className="relative w-full">
                          <div
                            className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${showSizes ? 'opacity-0 transform -translate-y-2' : 'opacity-100 transform translate-y-0'
                              }`}
                          >
                            {primitiveData.join(', ') || '-'}
                          </div>
                          <div
                            className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${showSizes ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-2'
                              }`}
                          >
                            {calculateSize(primitiveData)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={cellStyle}>
                      <div style={cellContentStyle}>
                        <div className="relative w-full">
                          <div
                            className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${showSizes ? 'opacity-0 transform -translate-y-2' : 'opacity-100 transform translate-y-0'
                              }`}
                          >
                            {loopData.join(', ') || '-'}
                          </div>
                          <div
                            className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${showSizes ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-2'
                              }`}
                          >
                            {calculateSize(loopData)}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <button
        className="absolute top-3.75 right-8 text-gray-500 hover:text-gray-700 text-xl font-bold"
        onClick={onToggleSizes}
        title={showSizes ? "Show Indices" : "Show Sizes"}
      >
        <TbArrowsExchange
          className={`transform transition-transform duration-300 ${showSizes ? 'rotate-180' : ''}`}
          size={18}
        />
      </button>

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
  isEqual(prevProps.connectedNodes, nextProps.connectedNodes) &&
  isEqual(prevProps.indexSizes, nextProps.indexSizes) &&
  prevProps.showSizes === nextProps.showSizes &&
  prevProps.onToggleSizes === nextProps.onToggleSizes &&
  isEqual(prevProps.node, nextProps.node) &&
  prevProps.swapChildren === nextProps.swapChildren
);