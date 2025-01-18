import React from 'react';
import {
  DndContext,
  useSensors,
  useSensor,
  PointerSensor,
  TouchSensor,
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
        ${isDragging ? 'opacity-50' : 'bg-gray-100 hover:bg-gray-200'}
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

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = indices.indexOf(active.id);
      const newIndex = indices.indexOf(over.id);

      const newIndices = [...indices];
      const [movedItem] = newIndices.splice(oldIndex, 1);
      newIndices.splice(newIndex, 0, movedItem);

      onSwapIndices(newIndices);
    }
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
      <DndContext
        sensors={sensors}
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
      <div className="w-2 h-2 bg-white border-b border-r border-gray-200 absolute -bottom-1 left-1/2 -translate-x-1/2 rotate-45" />
    </div>
  );
};

export default NodeIndicesPanel;