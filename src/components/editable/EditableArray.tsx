'use client';

import React, { useState } from 'react';
import { useEditContext } from './EditContext';

interface EditableArrayProps {
  children: React.ReactNode;
  path: string;
  onAdd?: () => void;
  onRemove?: (index: number) => void;
  className?: string;
  addButtonText?: string;
  allowAdd?: boolean;
  allowRemove?: boolean;
  as?: keyof JSX.IntrinsicElements | 'fragment';
}

export const EditableArray: React.FC<EditableArrayProps> = ({ 
  children, 
  path, 
  onAdd,
  onRemove,
  className = '',
  addButtonText = 'Add Item',
  allowAdd = true,
  allowRemove = true,
  as = 'div'
}) => {
  const { isEditMode, onUpdate, basePath } = useEditContext();
  const [showControls, setShowControls] = useState(false);
  
  const fullPath = basePath ? `${basePath}.${path}` : path;

  const handleAdd = () => {
    if (onAdd) {
      onAdd();
    }
  };

  const handleRemove = (index: number) => {
    if (onRemove) {
      onRemove(index);
    }
  };

  // 在非编辑模式下，使用React.Fragment或指定容器来避免额外的DOM节点
  if (!isEditMode) {
    if (as === 'fragment') {
      return <>{children}</>;
    }
    const Container = as;
    return <Container className={className}>{children}</Container>;
  }

  // 编辑模式下，如果使用fragment，我们需要特殊处理
  if (as === 'fragment') {
    return (
      <>
        {/* 编辑提示，使用portal或绝对定位不影响布局 */}
        {showControls && (
          <div className="fixed top-4 left-4 bg-blue-500 text-white px-2 py-1 rounded text-xs z-[9999] pointer-events-none">
            Array: {path}
          </div>
        )}
        
        {/* 保持原有的children结构，只添加hover效果 */}
        <span 
          onMouseEnter={() => setShowControls(true)}
          onMouseLeave={() => setShowControls(false)}
          style={{
            display: 'contents', // 完全透明的布局容器
          }}
        >
          {children}
        </span>
        
        {showControls && allowAdd && (
          <div className="fixed bottom-4 left-4 z-[9999]">
            <button
              onClick={handleAdd}
              className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
              title={`Add new item to ${path}`}
            >
              + {addButtonText}
            </button>
          </div>
        )}
      </>
    );
  }

  // 编辑模式下的普通容器处理
  const containerProps = {
    className: `${className} relative`,
    onMouseEnter: () => setShowControls(true),
    onMouseLeave: () => setShowControls(false),
  };

  const content = (
    <>
      {showControls && (
        <div className="absolute -top-8 left-0 bg-blue-500 text-white px-2 py-1 rounded text-xs z-50">
          Array: {path}
        </div>
      )}
      
      <div className="hover:outline hover:outline-2 hover:outline-blue-300 hover:outline-dashed rounded p-1">
        {children}
      </div>
      
      {showControls && allowAdd && (
        <div className="absolute -bottom-8 left-0 z-50">
          <button
            onClick={handleAdd}
            className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
            title={`Add new item to ${path}`}
          >
            + {addButtonText}
          </button>
        </div>
      )}
    </>
  );

  const Container = as;
  return <Container {...containerProps}>{content}</Container>;
};