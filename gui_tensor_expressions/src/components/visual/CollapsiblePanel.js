import React, { useState } from 'react';

const CollapsiblePanel = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden mb-4">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-semibold">{title}</h3>
        <span>{isOpen ? '▲' : '▼'}</span>
      </button>
      {isOpen && <div className="p-4">{children}</div>}
    </div>
  );
};

export default CollapsiblePanel;