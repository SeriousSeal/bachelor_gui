import React, { useState } from 'react';
import {
  DndContext,
  useSensors,
  useSensor,
  PointerSensor,
  TouchSensor
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const SortableItem = ({ id }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`px-2 py-1 rounded cursor-move select-none
        ${isDragging ? 'bg-blue-100' : 'bg-gray-100 hover:bg-gray-200'}
      `}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        touchAction: 'none',
      }}
    >
      {id}
    </div>
  );
};



const NodeIndicesPanel = ({ indices, onSwapIndices, position, onMouseEnter, onMouseLeave }) => {
  const [previewIndices, setPreviewIndices] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  const handleDragStart = (event) => {
    setPreviewIndices(null);
    setActiveId(event.active.id);
  };

  const handleDragOver = (event) => {
    const { active, over } = event;

    if (!over) {
      setPreviewIndices(null);
      return;
    }

    const oldIndex = indices.indexOf(active.id);
    const newIndex = indices.indexOf(over.id);

    const newIndices = [...indices];
    const [movedItem] = newIndices.splice(oldIndex, 1);
    newIndices.splice(newIndex, 0, movedItem);

    setPreviewIndices(newIndices);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (over) {
      const oldIndex = indices.indexOf(active.id);
      const newIndex = indices.indexOf(over.id);

      if (oldIndex !== newIndex) {
        const newIndices = [...indices];
        const [movedItem] = newIndices.splice(oldIndex, 1);
        newIndices.splice(newIndex, 0, movedItem);
        onSwapIndices(newIndices);
      }
    }
    setPreviewIndices(null);
    setActiveId(null);
  };

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
    >
      {previewIndices && (
        <div className="absolute -top-8 left-0 right-0 bg-gray-100 p-1 rounded-md border border-gray-200 text-sm text-gray-600 flex gap-1 justify-center">
          Preview: {previewIndices.map((index, i) => (
            <React.Fragment key={index}>
              <span className={index === activeId ? 'text-blue-600 font-medium' : ''}>
                {index}
              </span>
              {i < previewIndices.length - 1 && ' , '}
            </React.Fragment>
          ))}
        </div>
      )}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={indices}
          strategy={horizontalListSortingStrategy}
        >
          <div className="flex gap-2 items-center relative min-w-[100px]">
            {indices.map((index) => (
              <SortableItem key={index} id={index} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};

export default NodeIndicesPanel;