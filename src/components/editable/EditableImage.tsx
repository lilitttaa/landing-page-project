'use client';

import React, { useState, useRef } from 'react';
import { useEditContext } from './EditContext';
import { useSmartPosition } from './useSmartPosition';

interface EditableImageProps {
  src: string;
  alt?: string;
  path: string;
  className?: string;
  [key: string]: any; // for other img props
}

export const EditableImage: React.FC<EditableImageProps> = ({ 
  src, 
  alt, 
  path, 
  className = '',
  ...props 
}) => {
  const { isEditMode, onUpdate, basePath } = useEditContext();
  const [isEditing, setIsEditing] = useState(false);
  const [editSrc, setEditSrc] = useState(src);
  const [editAlt, setEditAlt] = useState(alt || '');
  const imageRef = useRef<HTMLImageElement>(null);
  
  const fullPath = basePath ? `${basePath}.${path}` : path;

  // 使用智能定位
  const position = useSmartPosition({
    isOpen: isEditing,
    elementRef: imageRef,
    popupWidth: 256,
    popupHeight: 180
  });

  const handleClick = () => {
    if (isEditMode) {
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    onUpdate(`${fullPath}.src`, editSrc);
    if (editAlt !== alt) {
      onUpdate(`${fullPath}.alt`, editAlt);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditSrc(src);
    setEditAlt(alt || '');
    setIsEditing(false);
  };

  if (!isEditMode) {
    return <img src={src} alt={alt} className={className} {...props} />;
  }

  if (isEditing) {
    return (
      <>
        <img ref={imageRef} src={editSrc || src} alt={editAlt} className={`${className} border-2 border-blue-500`} {...props} />
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
              <label className="block text-xs font-medium text-gray-700">Image URL:</label>
              <input
                type="text"
                value={editSrc}
                onChange={(e) => setEditSrc(e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                placeholder="https://example.com/image.jpg"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">Alt Text:</label>
              <input
                type="text"
                value={editAlt}
                onChange={(e) => setEditAlt(e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                placeholder="Description of the image"
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
    <img 
      ref={imageRef}
      src={src} 
      alt={alt} 
      className={`${className} cursor-pointer hover:outline hover:outline-2 hover:outline-blue-300 rounded`}
      onClick={handleClick}
      title="Click to edit image"
      {...props}
    />
  );
};