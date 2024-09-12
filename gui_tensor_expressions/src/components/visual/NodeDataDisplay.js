import React from 'react';

const NodeDataDisplay = ({ node }) => {
  if (!node) return null;

  return (
    <div className="bg-gray-100 p-4 rounded-lg shadow-md mt-6">
      <h3 className="text-lg font-semibold mb-2">Selected Node Data</h3>
      <p><span className="font-medium">ID:</span> {node.id}</p>
      <p><span className="font-medium">Type:</span> {node.type}</p>
      <p><span className="font-medium">Position:</span> x: {node.position.x}, y: {node.position.y}</p>
      <p><span className="font-medium">Data:</span> {JSON.stringify(node.data)}</p>
    </div>
  );
};

export default NodeDataDisplay;