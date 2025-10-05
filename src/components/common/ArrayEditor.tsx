"use client";

import { useState, useRef, useCallback } from 'react';
import { Button } from './Button';

interface ArrayEditorProps<T = any> {
  items: T[];
  onAdd: (index: number, item: T) => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, item: T) => void;
  renderItem: (item: T, index: number) => React.ReactNode;
  createNewItem: () => T;
  className?: string;
  itemClassName?: string;
}

export function ArrayEditor<T>({
  items,
  onAdd,
  onRemove,
  onUpdate,
  renderItem,
  createNewItem,
  className = "",
  itemClassName = ""
}: ArrayEditorProps<T>) {
  const [isHoveringContainer, setIsHoveringContainer] = useState(false);
  const [hoveredItemIndex, setHoveredItemIndex] = useState<number | null>(null);
  const [hoveredInsertIndex, setHoveredInsertIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleContainerMouseEnter = useCallback(() => {
    setIsHoveringContainer(true);
  }, []);

  const handleContainerMouseLeave = useCallback(() => {
    setIsHoveringContainer(false);
    setHoveredItemIndex(null);
    setHoveredInsertIndex(null);
  }, []);

  const handleItemMouseEnter = useCallback((index: number) => {
    setHoveredItemIndex(index);
  }, []);

  const handleItemMouseLeave = useCallback(() => {
    setHoveredItemIndex(null);
  }, []);

  const handleInsertMouseEnter = useCallback((index: number) => {
    setHoveredInsertIndex(index);
  }, []);

  const handleInsertMouseLeave = useCallback(() => {
    setHoveredInsertIndex(null);
  }, []);

  const handleAdd = useCallback((index: number) => {
    const newItem = createNewItem();
    onAdd(index, newItem);
  }, [onAdd, createNewItem]);

  const handleRemove = useCallback((index: number) => {
    onRemove(index);
  }, [onRemove]);

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      onMouseEnter={handleContainerMouseEnter}
      onMouseLeave={handleContainerMouseLeave}
    >
      {/* 插入按钮：数组开头 */}
      {isHoveringContainer && (
        <div
          className="flex justify-center py-2 transition-all duration-200"
          onMouseEnter={() => handleInsertMouseEnter(-1)}
          onMouseLeave={handleInsertMouseLeave}
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAdd(0)}
            className={`
              h-8 px-3 text-xs border-dashed transition-all duration-200
              ${hoveredInsertIndex === -1 
                ? 'border-blue-400 bg-blue-50 text-blue-600 shadow-sm' 
                : 'border-gray-300 bg-gray-50 text-gray-500'
              }
            `}
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Item
          </Button>
        </div>
      )}

      {items.map((item, index) => (
        <div key={index} className="relative">
          {/* Array Item */}
          <div
            className={`relative group ${itemClassName}`}
            onMouseEnter={() => handleItemMouseEnter(index)}
            onMouseLeave={handleItemMouseLeave}
          >
            {/* 渲染item内容 */}
            {renderItem(item, index)}
            
            {/* 删除按钮 - absolute定位，不影响布局 */}
            {hoveredItemIndex === index && (
              <div className="absolute top-2 right-2 z-10">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleRemove(index)}
                  className="h-6 w-6 p-0 rounded-full shadow-lg opacity-90 hover:opacity-100 transition-all duration-200 bg-red-500 hover:bg-red-600 text-white border-red-500"
                  title="Remove item"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              </div>
            )}
          </div>

          {/* 插入按钮：item之间 */}
          {isHoveringContainer && (
            <div
              className="flex justify-center py-2 transition-all duration-200"
              onMouseEnter={() => handleInsertMouseEnter(index)}
              onMouseLeave={handleInsertMouseLeave}
            >
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAdd(index + 1)}
                className={`
                  h-8 px-3 text-xs border-dashed transition-all duration-200
                  ${hoveredInsertIndex === index 
                    ? 'border-blue-400 bg-blue-50 text-blue-600 shadow-sm' 
                    : 'border-gray-300 bg-gray-50 text-gray-500'
                  }
                `}
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Item
              </Button>
            </div>
          )}
        </div>
      ))}

      {/* 空数组状态 */}
      {items.length === 0 && isHoveringContainer && (
        <div className="flex justify-center py-8">
          <Button
            variant="outline"
            onClick={() => handleAdd(0)}
            className="border-dashed border-blue-400 bg-blue-50 text-blue-600"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add First Item
          </Button>
        </div>
      )}
    </div>
  );
}

export default ArrayEditor;