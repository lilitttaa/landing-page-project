'use client';

import React, { useState, useEffect } from 'react';
import { useEditable } from './EditableContext';

interface EditableArrayProps<T> {
  data: T[];
  path: string;
  renderItem: (item: T, index: number, itemPath: string) => React.ReactNode;
  className?: string;
  addButtonText?: string;
  canAdd?: boolean;
  canRemove?: boolean;
  minItems?: number;
  maxItems?: number;
}

export function EditableArray<T>({ 
  data, 
  path, 
  renderItem, 
  className = '',
  addButtonText = 'Add Item',
  canAdd = true,
  canRemove = true,
  minItems = 0,
  maxItems = 10
}: EditableArrayProps<T>) {
  const { isEditMode, onEdit } = useEditable();
  const [currentData, setCurrentData] = useState(data);
  
  useEffect(() => {
    setCurrentData(data);
  }, [data]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'UPDATE_CONTENT') {
        const { elementPath, newValue } = event.data.payload;
        if (elementPath.endsWith(path)) {
          setCurrentData(newValue);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [path]);

  const handleAddItem = () => {
    if (!isEditMode || currentData.length >= maxItems) return;
    
    onEdit(path, 'array_add', {
      action: 'add',
      arrayPath: path,
      currentData
    });
  };

  const handleRemoveItem = (index: number) => {
    if (!isEditMode || currentData.length <= minItems) return;
    
    onEdit(path, 'array_remove', {
      action: 'remove',
      arrayPath: path,
      index,
      currentData
    });
  };

  const handleMoveItem = (fromIndex: number, toIndex: number) => {
    if (!isEditMode) return;
    
    onEdit(path, 'array_move', {
      action: 'move',
      arrayPath: path,
      fromIndex,
      toIndex,
      currentData
    });
  };

  return (
    <div className={`editable-array ${className}`}>
      {currentData.map((item, index) => {
        const itemPath = `${path}.${index}`;
        return (
          <div key={index} className="editable-array-item relative">
            {isEditMode && (
              <div className="editable-array-controls absolute top-0 right-0 z-10 flex gap-1 bg-white border rounded shadow-sm p-1">
                {index > 0 && (
                  <button
                    onClick={() => handleMoveItem(index, index - 1)}
                    className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                    title="Move Up"
                  >
                    ↑
                  </button>
                )}
                {index < currentData.length - 1 && (
                  <button
                    onClick={() => handleMoveItem(index, index + 1)}
                    className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                    title="Move Down"
                  >
                    ↓
                  </button>
                )}
                {canRemove && currentData.length > minItems && (
                  <button
                    onClick={() => handleRemoveItem(index)}
                    className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                    title="Remove"
                  >
                    ×
                  </button>
                )}
              </div>
            )}
            {renderItem(item, index, itemPath)}
          </div>
        );
      })}
      
      {isEditMode && canAdd && currentData.length < maxItems && (
        <button
          onClick={handleAddItem}
          className="editable-array-add-button mt-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
        >
          + {addButtonText}
        </button>
      )}
      
      <style jsx>{`
        .editable-array-item:hover .editable-array-controls {
          opacity: 1;
        }
        .editable-array-controls {
          opacity: 0;
          transition: opacity 0.2s;
        }
      `}</style>
    </div>
  );
}