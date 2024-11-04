import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import CollapsiblePanel from './CollapsiblePanel';
import { Toast } from './toast.js';

const IndexSizeInput = ({ indexSizes, setIndexSizes, onUpdate }) => {
  const [bulkInput, setBulkInput] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  
  const sortedIndices = Object.keys(indexSizes).sort((a, b) => 
    a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
  );

  // Only sync bulk input with indexSizes when not editing
  useEffect(() => {
    if (!isEditing) {
      const sortedSizes = sortedIndices.map(index => indexSizes[index]);
      setBulkInput(sortedSizes.join(', '));
    }
  }, [indexSizes, sortedIndices, isEditing]);

  const handleInputChange = (index, value) => {
    const numValue = parseInt(value, 10);
    const newSizes = { 
      ...indexSizes, 
      [index]: isNaN(numValue) ? 0 : numValue 
    };
    setIndexSizes(newSizes);
    onUpdate(newSizes);
  };

  const handleBulkInputChange = (e) => {
    setBulkInput(e.target.value);
    setIsEditing(true);
  };

  const handleUpdateTree = () => {
    if (!bulkInput.trim()) {
      return;
    }

    try {
      const values = bulkInput.split(/[,\s]+/).filter(Boolean);
      
      if (values.length !== sortedIndices.length) {
        Toast.show(`Please provide ${sortedIndices.length} values (one for each index)`);
        return;
      }

      const newSizes = {};
      sortedIndices.forEach((index, i) => {
        const numValue = parseInt(values[i], 10);
        if (isNaN(numValue)) {
          throw new Error(`Invalid number: ${values[i]}`);
        }
        newSizes[index] = numValue;
      });

      setIndexSizes(newSizes);
      onUpdate(newSizes);
      setIsEditing(false);  // Reset editing state after successful update
    } catch (error) {
      Toast.show(`Error parsing input: ${error.message}`);
    }
  };

  return (
    <CollapsiblePanel title="Tensor Sizes">
      <Tabs defaultValue="individual" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4 bg-gray-100 p-1 rounded-lg">
          <TabsTrigger 
            value="individual"
            className="data-[state=active]:bg-white data-[state=active]:shadow-md py-2 rounded-md"
          >
            Individual Inputs
          </TabsTrigger>
          <TabsTrigger 
            value="bulk"
            className="data-[state=active]:bg-white data-[state=active]:shadow-md py-2 rounded-md"
          >
            Bulk Input
          </TabsTrigger>
        </TabsList>

        <TabsContent value="individual">
          <div className="grid grid-cols-2 gap-4">
            {sortedIndices.map((index) => (
              <div key={index} className="flex items-center">
                <label htmlFor={`index-${index}`} className="font-medium mr-2">{index}:</label>
                <input
                  id={`index-${index}`}
                  type="number"
                  value={indexSizes[index]}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  className="w-20 p-1 border border-gray-300 rounded-md"
                />
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="bulk">
          <div className="space-y-4">
            {sortedIndices.length > 0 && (
              <>
                <div>
                  <label className="block mb-2 text-sm font-medium">
                    Enter all sizes (comma or space separated):
                  </label>
                  <input
                    type="text"
                    value={bulkInput}
                    onChange={handleBulkInputChange}
                    onFocus={() => setIsEditing(true)}
                    placeholder="e.g., 2,3,4 or 2 3 4"
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div className="text-sm text-gray-500">
                  Current indices (sorted): {sortedIndices.join(', ')}
                </div>
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {sortedIndices.length > 0 && (
        <button 
          onClick={handleUpdateTree} 
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors w-full"
        >
          Update Tree
        </button>
      )}
    </CollapsiblePanel>
  );
};

export default IndexSizeInput;