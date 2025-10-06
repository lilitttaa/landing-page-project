'use client';

import React, { useState, useRef } from 'react';
import { useEditContext } from './EditContext';
import { useSmartPosition } from './useSmartPosition';

interface EditableDropdownTitleProps {
  title: string;
  path: string;
  className?: string;
  children: React.ReactNode;
}

export const EditableDropdownTitle: React.FC<EditableDropdownTitleProps> = ({ 
  title,
  path,
  className = '',
  children
}) => {
  const { isEditMode, onUpdate, basePath } = useEditContext();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(title);
  const elementRef = useRef<HTMLSpanElement>(null);
  
  const fullPath = basePath ? `${basePath}.${path}` : path;

  // 使用智能定位
  const position = useSmartPosition({
    isOpen: isEditing,
    elementRef: elementRef,
    popupWidth: 280,
    popupHeight: 120
  });

  const handleClick = () => {
    if (isEditMode) {
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    onUpdate(fullPath, editTitle);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(title);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (!isEditMode) {
    return <span className={className}>{children}</span>;
  }

  if (isEditing) {
    return (
      <>
        <span 
          ref={elementRef}
          className={`${className} border-2 border-blue-500 rounded px-1`}
        >
          {editTitle}
        </span>
        {/* 智能定位的编辑框 */}
        <div 
          className="fixed bg-white border border-gray-300 rounded p-3 shadow-xl z-[9999]"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
          }}
        >
          <div className="space-y-3 w-64">
            <div>
              <label className="block text-xs font-medium text-gray-700">Menu Title:</label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                placeholder="Menu title"
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handleSave}
                className="bg-green-500 text-white px-3 py-1 rounded text-sm"
              >
                Save
              </button>
              <button 
                onClick={handleCancel}
                className="bg-red-500 text-white px-3 py-1 rounded text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
        {/* 添加遮罩层 */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-25 z-[9998]"
          onClick={handleCancel}
        />
      </>
    );
  }

  return (
    <span 
      ref={elementRef}
      className={`${className} cursor-pointer hover:bg-blue-100 hover:outline hover:outline-2 hover:outline-blue-300 rounded px-1`}
      onClick={handleClick}
      title="Click to edit menu title"
    >
      {children}
    </span>
  );
};