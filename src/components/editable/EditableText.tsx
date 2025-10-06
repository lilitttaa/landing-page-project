'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useEditContext } from './EditContext';

interface EditableTextProps {
  children: React.ReactNode;
  path: string;
  value: string;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
  multiline?: boolean;
}

export const EditableText: React.FC<EditableTextProps> = ({ 
  children, 
  path, 
  value, 
  className = '', 
  as = 'span',
  multiline = false 
}) => {
  const { isEditMode, onUpdate, basePath } = useEditContext();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  
  const fullPath = basePath ? `${basePath}.${path}` : path;
  
  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleClick = () => {
    if (isEditMode) {
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    onUpdate(fullPath, editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    } else if (e.key === 'Enter' && e.ctrlKey && multiline) {
      e.preventDefault();
      handleSave();
    }
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  if (!isEditMode) {
    const Component = as;
    return <Component className={className}>{children}</Component>;
  }

  if (isEditing) {
    const InputComponent = multiline ? 'textarea' : 'input';
    return (
      <div className="relative inline-block">
        <InputComponent
          ref={inputRef as any}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className={`${className} border-2 border-blue-500 bg-white px-2 py-1 rounded focus:outline-none ${
            multiline ? 'min-h-20 resize-none' : ''
          }`}
          style={{ minWidth: '100px' }}
        />
        <div className="absolute -top-6 left-0 flex gap-1 text-xs">
          <button 
            onClick={handleSave}
            className="bg-green-500 text-white px-2 py-1 rounded"
          >
            ✓
          </button>
          <button 
            onClick={handleCancel}
            className="bg-red-500 text-white px-2 py-1 rounded"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  const Component = as;
  return (
    <Component 
      className={`${className} cursor-pointer hover:bg-blue-100 hover:outline hover:outline-2 hover:outline-blue-300 rounded`}
      onClick={handleClick}
      title="Click to edit"
    >
      {children}
    </Component>
  );
};