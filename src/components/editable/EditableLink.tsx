'use client';

import React, { useState, useRef } from 'react';
import { useEditContext } from './EditContext';
import { useSmartPosition } from './useSmartPosition';

interface EditableLinkProps {
  href: string;
  children: React.ReactNode;
  path: string;
  textPath?: string;
  text?: string;
  className?: string;
  [key: string]: any; // for other anchor props
}

export const EditableLink: React.FC<EditableLinkProps> = ({ 
  href, 
  children, 
  path, 
  textPath,
  text,
  className = '',
  ...props 
}) => {
  const { isEditMode, onUpdate, basePath } = useEditContext();
  const [isEditing, setIsEditing] = useState(false);
  const [editHref, setEditHref] = useState(href);
  const [editText, setEditText] = useState(text || '');
  const linkRef = useRef<HTMLAnchorElement>(null);
  
  const fullPath = basePath ? `${basePath}.${path}` : path;
  const fullTextPath = textPath && basePath ? `${basePath}.${textPath}` : textPath;

  // 使用智能定位
  const position = useSmartPosition({
    isOpen: isEditing,
    elementRef: linkRef,
    popupWidth: 256,
    popupHeight: textPath ? 220 : 180
  });

  const handleClick = (e: React.MouseEvent) => {
    if (isEditMode) {
      e.preventDefault();
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    onUpdate(fullPath, editHref);
    if (fullTextPath && editText !== text) {
      onUpdate(fullTextPath, editText);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditHref(href);
    setEditText(text || '');
    setIsEditing(false);
  };

  if (!isEditMode) {
    return <a href={href} className={className} {...props}>{children}</a>;
  }

  if (isEditing) {
    return (
      <>
        <a ref={linkRef} href="#" className={`${className} border-2 border-blue-500 rounded px-1`} {...props}>
          {editText || children}
        </a>
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
              <label className="block text-xs font-medium text-gray-700">Link URL:</label>
              <input
                type="text"
                value={editHref}
                onChange={(e) => setEditHref(e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                placeholder="https://example.com or #anchor"
                autoFocus
              />
            </div>
            {textPath && (
              <div>
                <label className="block text-xs font-medium text-gray-700">Link Text:</label>
                <input
                  type="text"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  placeholder="Link text"
                />
              </div>
            )}
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
    <a 
      ref={linkRef}
      href={href} 
      className={`${className} cursor-pointer hover:outline hover:outline-2 hover:outline-blue-300 rounded`}
      onClick={handleClick}
      title="Click to edit link"
      {...props}
    >
      {children}
    </a>
  );
};