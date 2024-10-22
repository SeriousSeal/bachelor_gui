import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs.tsx";
import CollapsiblePanel from './CollapsiblePanel';

const IndexSizeInput = ({ indexSizes, setIndexSizes, onUpdate }) => {
  const [bulkInput, setBulkInput] = useState('');

  const handleInputChange = (index, value) => {
    const numValue = parseInt(value, 10);
    setIndexSizes(prev => ({ ...prev, [index]: isNaN(numValue) ? 0 : numValue }));
  };

  const handleBulkInputChange = (e) => {
    setBulkInput(e.target.value);
  };

  const handleUpdateTree = () => {
    if (bulkInput) {
      try {
        // Parse the input string - accepts formats like "1,2,3" or "1 2 3" or "1, 2, 3"
        const values = bulkInput.split(/[,\s]+/).filter(Boolean);
        const indices = Object.keys(indexSizes);
        
        if (values.length !== indices.length) {
          alert(`Please provide ${indices.length} values (one for each index)`);
          return;
        }

        const newSizes = {};
        indices.forEach((index, i) => {
          const numValue = parseInt(values[i], 10);
          if (isNaN(numValue)) {
            throw new Error(`Invalid number: ${values[i]}`);
          }
          newSizes[index] = numValue;
        });

        setIndexSizes(newSizes);
      } catch (error) {
        alert(`Error parsing input: ${error.message}`);
        return;
      }
    }
    onUpdate(indexSizes);
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
        </TabsContent>

        <TabsContent value="bulk">
          <div className="space-y-4">
            <div>
              <label className="block mb-2 text-sm font-medium">
                Enter all sizes (comma or space separated):
              </label>
              <input
                type="text"
                value={bulkInput}
                onChange={handleBulkInputChange}
                placeholder="e.g., 2,3,4 or 2 3 4"
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="text-sm text-gray-500">
              Current indices: {Object.keys(indexSizes).join(', ')}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {Object.keys(indexSizes).length > 0 && (
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