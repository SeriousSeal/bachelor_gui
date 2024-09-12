import React from 'react';
import CollapsiblePanel from './CollapsiblePanel';

const HistoryPanel = ({ history, onSelectTree }) => (
  <CollapsiblePanel title="History">
    <ul className="space-y-2">
      {history.map((item, index) => (
        <li key={index} className="cursor-pointer hover:bg-gray-100 p-2 rounded" onClick={() => onSelectTree(item)}>
          {item.expression}
        </li>
      ))}
    </ul>
  </CollapsiblePanel>
);

export default HistoryPanel;