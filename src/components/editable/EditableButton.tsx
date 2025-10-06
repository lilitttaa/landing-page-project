'use client';

import React, { useState, useRef } from 'react';
import { useEditContext } from './EditContext';
import { useSmartPosition } from './useSmartPosition';
import { Button } from '../common';
import type { ButtonProps } from '../common';

interface EditableButtonProps {
  button: ButtonProps;
  path: string;
  index: number;
  className?: string;
}

export const EditableButton: React.FC<EditableButtonProps> = ({ 
  button, 
  path, 
  index,
  className = ''
}) => {
  const { isEditMode, onUpdate, basePath } = useEditContext();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(button.title || '');
  const [editVariant, setEditVariant] = useState(button.variant || 'primary');
  const [editSize, setEditSize] = useState(button.size || 'md');
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  const fullPath = basePath ? `${basePath}.${path}` : path;

  // 使用智能定位
  const position = useSmartPosition({
    isOpen: isEditing,
    elementRef: buttonRef,
    popupWidth: 256,
    popupHeight: 180
  });

  const handleClick = (e: React.MouseEvent) => {
    if (isEditMode) {
      e.preventDefault();
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    const updatedButton = {
      ...button,
      title: editTitle,
      variant: editVariant,
      size: editSize
    };
    // 修复路径格式，应该更新数组中的特定索引
    onUpdate(`${fullPath}.${index}`, updatedButton);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(button.title || '');
    setEditVariant(button.variant || 'primary');
    setEditSize(button.size || 'md');
    setIsEditing(false);
  };

  if (!isEditMode) {
    return <Button className={className} {...button}>{button.title}</Button>;
  }

  if (isEditing) {
    return (
      <>
        <Button 
          ref={buttonRef}
          className={`${className} border-2 border-blue-500`} 
          {...button}
        >
          {editTitle}
        </Button>
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
              <label className="block text-xs font-medium text-gray-700">Button Text:</label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                placeholder="Button text"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">Variant:</label>
              <select
                value={editVariant}
                onChange={(e) => setEditVariant(e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="primary">Primary</option>
                <option value="secondary">Secondary</option>
                <option value="link">Link</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">Size:</label>
              <select
                value={editSize}
                onChange={(e) => setEditSize(e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="sm">Small</option>
                <option value="md">Medium</option>
                <option value="lg">Large</option>
                <option value="link">Link</option>
              </select>
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
    <Button 
      ref={buttonRef}
      className={`${className} cursor-pointer hover:outline hover:outline-2 hover:outline-blue-300 rounded`}
      onClick={handleClick}
      title="Click to edit button"
      {...button}
    >
      {button.title}
    </Button>
  );
};