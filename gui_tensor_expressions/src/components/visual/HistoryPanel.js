import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip.jsx";
import CollapsiblePanel from '../common/CollapsiblePanel';

const HistoryPanel = ({ history, onSelectTree, onClear }) => {
  const maxLength = 200;

  const truncateExpression = (expression, maxLength = 200) => {
    if (expression.length <= maxLength) return expression;
    return `${expression.substring(0, maxLength)}...`;
  };

  return (
    <CollapsiblePanel
      title={
        <div className="flex justify-between items-center w-full">
          <span>History</span>
          {history.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              className="px-2 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-100 rounded-md transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      }
    >
      <ul className="space-y-2">
        {history.map((item, index) => (
          <TooltipProvider key={index}>
            <Tooltip>
              <TooltipTrigger asChild>
                <li
                  className="cursor-pointer hover:bg-gray-100 p-2 rounded truncate"
                  onClick={() => onSelectTree(item)}
                >
                  {truncateExpression(item.expression, maxLength)}
                </li>
              </TooltipTrigger>
              {item.expression.length > maxLength && (
                <TooltipContent>
                  <p className="max-w-xs break-words">{item.expression}</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        ))}
      </ul>
    </CollapsiblePanel>
  );
};

export default HistoryPanel;