import React from 'react';
import CollapsiblePanel from './CollapsiblePanel';

const IndexSizeInput = ({ indexSizes, setIndexSizes, onUpdate }) => {
  const handleInputChange = (index, value) => {
    const numValue = parseInt(value, 10);
    setIndexSizes(prev => ({ ...prev, [index]: isNaN(numValue) ? 0 : numValue }));
  };

  return (
    <CollapsiblePanel title="Tensor Sizes">
      <div className="grid grid-cols-2 gap-4">
        {Object.entries(indexSizes).map(([index, size]) => (
          <div key={index} className="flex items-center">
            <label htmlFor={`index-${index}`} className="font-medium mr-2">{index}:</label>
            <input
              id={`index-${index}`}
              type="number"
              value={size}
              onChange={(e) => handleInputChange(index, e.target.value)}
              className="w-20 p-1 border border-gray-300 rounded-md"
            />
          </div>
        ))}
      </div>
      {Object.keys(indexSizes).length > 0 && (
      <button 
        onClick={onUpdate} 
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
      >
        Update Tree
      </button>
      )}
    </CollapsiblePanel>
  );
};

export default IndexSizeInput;