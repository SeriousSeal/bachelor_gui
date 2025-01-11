import React, { useState, useMemo } from 'react';

/**
 * NodeIndicesPanel Component
 * Displays a draggable panel of indices that can be reordered through drag and drop.
 * @param {Array} indices - Array of indices to display
 * @param {Function} onSwapIndices - Callback function when indices are swapped
 * @param {Object} position - {x, y} coordinates for panel positioning
 * @param {Function} onMouseEnter - Mouse enter event handler
 * @param {Function} onMouseLeave - Mouse leave event handler
 */
const NodeIndicesPanel = ({ indices, onSwapIndices, position, onMouseEnter, onMouseLeave }) => {
  // State Management
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dropIndex, setDropIndex] = useState(null);

  /**
   * Resets the drag and drop state
   */
  const resetDragState = () => {
    setDraggedIndex(null);
    setDropIndex(null);
  };

  /**
   * Handles the start of a drag operation
   * @param {Event} e - Drag start event
   * @param {number} index - Index being dragged
   */
  const handleDragStart = (e, index) => {
    e.stopPropagation();
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  /**
   * Handles dragging over a droppable target
   * @param {Event} e - Drag over event
   * @param {number} index - Index being dragged over
   */
  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null) return;
    setDropIndex(index);
  };

  /**
   * Handles dragging over the container
   * @param {Event} e - Drag over event
   */
  const handleDragOverContainer = (e) => {
    e.preventDefault();
  };

  /**
   * Handles the drop event to reorder indices
   * @param {Event} e - Drop event
   */
  const handleDrop = (e) => {
    e.preventDefault();
    if (draggedIndex === null || dropIndex === null) return;

    const newIndices = [...indices];
    const [draggedValue] = newIndices.splice(draggedIndex, 1);
    newIndices.splice(dropIndex, 0, draggedValue);

    if (indices.join(',') !== newIndices.join(',')) {
      onSwapIndices(newIndices);
    }
    resetDragState();
  };

  /**
   * Handles the end of a drag operation
   */
  const handleDragEnd = () => {
    resetDragState();
  };

  /**
   * Memoized preview of indices during drag operation
   */
  const previewIndices = useMemo(() => {
    if (draggedIndex === null || dropIndex === null) return indices;
    const newIndices = [...indices];
    const [draggedValue] = newIndices.splice(draggedIndex, 1);
    newIndices.splice(dropIndex, 0, draggedValue);
    return newIndices;
  }, [indices, draggedIndex, dropIndex]);

  // Render Component
  return (
    <div
      className="fixed z-[9999] bg-white shadow-lg rounded-md p-2 border border-gray-200"
      style={{
        left: position.x,
        top: position.y - 60,
        transform: 'translateX(-50%)'
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onDragOver={handleDragOverContainer}
      onDrop={handleDrop}
    >
      <div className="flex flex-col gap-2">
        <div className="flex gap-2 items-center relative min-w-[100px]">
          {indices.map((dim, idx) => (
            <div
              key={idx}
              draggable
              className={`px-2 py-1 rounded cursor-move select-none transition-all
                ${draggedIndex === idx ? 'opacity-50 bg-gray-100' : 'bg-gray-100 hover:bg-gray-200'}
              `}
              onDragStart={(e) => handleDragStart(e, idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragEnd={handleDragEnd}
            >
              {dim}
            </div>
          ))}
        </div>
        {draggedIndex !== null && dropIndex !== null && (
          <div className="flex gap-2 items-center border-t pt-2">
            <span className="text-xs text-gray-500">Preview:</span>
            <div className="flex gap-2">
              {previewIndices.map((dim, idx) => (
                <div
                  key={idx}
                  className={`px-2 py-1 rounded bg-gray-50 text-sm
                    ${dim === indices[draggedIndex] ? 'outline outline-2 outline-red-500' : ''}`}
                >
                  {dim}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="w-2 h-2 bg-white border-b border-r border-gray-200 absolute -bottom-1 left-1/2 -translate-x-1/2 rotate-45" />
    </div>
  );
};

export default NodeIndicesPanel;