'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useEditable } from './EditableContext';

interface EditableTextProps {
  children: React.ReactNode;
  path: string;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
  [key: string]: any;
}

export const EditableText: React.FC<EditableTextProps> = ({ 
  children, 
  path, 
  className = '', 
  as = 'span',
  ...props 
}) => {
  const { isEditMode, onEdit, onUpdate } = useEditable();
  const [currentValue, setCurrentValue] = useState(children);
  const [isEditing, setIsEditing] = useState(false);
  const [elementDimensions, setElementDimensions] = useState<{width: number, height: number} | null>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const elementRef = useRef<HTMLElement>(null);
  
  useEffect(() => {
    setCurrentValue(children);
  }, [children]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'UPDATE_CONTENT') {
        const { elementPath, newValue } = event.data.payload;
        if (elementPath.endsWith(path)) {
          setCurrentValue(newValue);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [path]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Capture element dimensions before editing
  useEffect(() => {
    if (elementRef.current && !isEditing) {
      const rect = elementRef.current.getBoundingClientRect();
      setElementDimensions({
        width: rect.width,
        height: rect.height
      });
    }
  }, [isEditing, currentValue]);

  const handleClick = (e: React.MouseEvent) => {
    if (!isEditMode) return;
    
    e.preventDefault();
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleSave = () => {
    const newValue = inputRef.current?.value || '';
    if (newValue !== currentValue) {
      setCurrentValue(newValue);
      onUpdate(path, newValue);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      if (inputRef.current) {
        inputRef.current.value = currentValue as string;
      }
    }
  };

  const handleBlur = () => {
    handleSave();
  };

  const Component = as;
  
  if (isEditMode && isEditing && elementDimensions) {
    const isTextarea = as === 'p' || as === 'div' || as === 'h1' || as === 'h2' || as === 'h3' || as === 'h4' || as === 'h5' || as === 'h6';
    const InputComponent = isTextarea ? 'textarea' : 'input';
    
    return React.createElement(InputComponent, {
      ref: inputRef,
      defaultValue: currentValue,
      className: `${className} ${isTextarea ? 'hide-scrollbar' : ''}`, // Use same className to inherit styles + hide scrollbar
      onKeyDown: handleKeyDown,
      onBlur: handleBlur,
      style: {
        // Only override necessary styles
        background: 'transparent !important',
        border: '2px dashed #3b82f6 !important',
        outline: 'none !important',
        resize: 'none',
        boxSizing: 'border-box',
        width: `${elementDimensions.width}px`,
        height: `${elementDimensions.height}px`,
        minHeight: 'unset', // Remove any default min-height
        maxHeight: 'unset', // Remove any default max-height
        overflow: 'hidden', // Hide scrollbars
        ...(isTextarea && { 
          height: `${elementDimensions.height}px`,
          minHeight: `${elementDimensions.height}px`,
          overflow: 'hidden', // Hide scrollbars for textarea
          scrollbarWidth: 'none', // Firefox
          msOverflowStyle: 'none', // IE/Edge
        }),
        ...props.style
      }
    });
  }

  const editableProps = isEditMode ? {
    ref: elementRef,
    onClick: handleClick,
    className: `${className} edit-highlight cursor-pointer`,
    style: {
      outline: '2px dashed #3b82f6',
      outlineOffset: '2px',
      position: 'relative' as const,
      ...props.style
    }
  } : {
    ref: elementRef,
    className,
    ...props
  };

  return <Component {...editableProps}>{currentValue}</Component>;
};

interface EditableImageProps {
  src: string;
  alt?: string;
  path: string;
  className?: string;
  [key: string]: any;
}

export const EditableImage: React.FC<EditableImageProps> = ({ 
  src, 
  alt, 
  path, 
  className = '',
  ...props 
}) => {
  const { isEditMode, onEdit } = useEditable();
  const [currentSrc, setCurrentSrc] = useState(src);
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    setCurrentSrc(src);
  }, [src]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'UPDATE_CONTENT') {
        const { elementPath, newValue } = event.data.payload;
        if (elementPath.endsWith(path)) {
          setCurrentSrc(newValue);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [path]);

  const handleClick = (e: React.MouseEvent) => {
    if (!isEditMode) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    onEdit(path, 'image', currentSrc, { x: e.clientX, y: e.clientY });
  };

  const editableProps = isEditMode ? {
    onClick: handleClick,
    className: `${className} edit-highlight cursor-pointer`,
    style: {
      outline: '2px dashed #3b82f6',
      outlineOffset: '2px',
      position: 'relative' as const,
      ...props.style
    }
  } : {
    className,
    ...props
  };

  return <img {...editableProps} src={currentSrc} alt={alt} />;
};

interface EditableLinkProps {
  href: string;
  children: React.ReactNode;
  textPath: string;
  urlPath: string;
  className?: string;
  [key: string]: any;
}

export const EditableLink: React.FC<EditableLinkProps> = ({ 
  href, 
  children, 
  textPath, 
  urlPath, 
  className = '',
  ...props 
}) => {
  const { isEditMode, onEdit } = useEditable();
  const [currentHref, setCurrentHref] = useState(href);
  const [currentText, setCurrentText] = useState(children);
  
  useEffect(() => {
    setCurrentHref(href);
    setCurrentText(children);
  }, [href, children]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'UPDATE_CONTENT') {
        const { elementPath, newValue } = event.data.payload;
        if (elementPath.endsWith(textPath)) {
          setCurrentText(newValue);
        } else if (elementPath.endsWith(urlPath)) {
          setCurrentHref(newValue);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [textPath, urlPath]);

  const handleClick = (e: React.MouseEvent) => {
    if (!isEditMode) {
      return; // Let the link work normally in preview mode
    }
    
    e.preventDefault();
    e.stopPropagation();
    
    onEdit(textPath, 'link', {
      text: currentText,
      url: currentHref,
      textPath,
      urlPath
    }, { x: e.clientX, y: e.clientY });
  };

  const editableProps = isEditMode ? {
    onClick: handleClick,
    className: `${className} edit-highlight cursor-pointer`,
    style: {
      outline: '2px dashed #3b82f6',
      outlineOffset: '2px',
      position: 'relative' as const,
      ...props.style
    }
  } : {
    className,
    ...props
  };

  return <a {...editableProps} href={currentHref}>{currentText}</a>;
};

interface EditableButtonProps {
  children: React.ReactNode;
  textPath: string;
  className?: string;
  onClick?: () => void;
  as?: 'button' | 'Button';
  [key: string]: any;
}

export const EditableButton: React.FC<EditableButtonProps> = ({ 
  children, 
  textPath, 
  className = '',
  onClick,
  as = 'button',
  ...props 
}) => {
  const { isEditMode, onUpdate } = useEditable();
  const [currentText, setCurrentText] = useState(children);
  const [isEditing, setIsEditing] = useState(false);
  const [panelPosition, setPanelPosition] = useState<{top: boolean, left: boolean}>({top: true, left: false});
  const inputRef = useRef<HTMLInputElement>(null);
  const elementRef = useRef<HTMLElement>(null);
  
  useEffect(() => {
    setCurrentText(children);
  }, [children]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'UPDATE_CONTENT') {
        const { elementPath, newValue } = event.data.payload;
        if (elementPath.endsWith(textPath)) {
          setCurrentText(newValue);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [textPath]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleClick = (e: React.MouseEvent) => {
    if (isEditMode) {
      e.preventDefault();
      e.stopPropagation();
      
      // 计算点击位置和最佳面板位置
      if (elementRef.current) {
        const rect = elementRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // 计算是否有足够空间在上方显示面板
        const hasSpaceAbove = rect.top > 60; // 60px for panel height
        // 计算是否有足够空间在右侧显示面板
        const hasSpaceRight = viewportWidth - rect.right > 140; // 140px for panel width
        
        setPanelPosition({
          top: hasSpaceAbove,
          left: !hasSpaceRight
        });
      }
      
      setIsEditing(true);
    } else if (onClick) {
      onClick();
    }
  };

  const handleSave = () => {
    const newValue = inputRef.current?.value || '';
    if (newValue !== currentText) {
      setCurrentText(newValue);
      onUpdate(textPath, newValue);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  const handleBlur = () => {
    handleSave();
  };

  // 如果正在编辑，显示带编辑面板的容器
  if (isEditMode && isEditing) {
    return (
      <span className="relative">
        {/* 编辑面板 - 使用absolute定位但通过Portal渲染到body避免影响布局 */}
        {typeof window !== 'undefined' && (
          <>
            <div 
              className="fixed inset-0 z-40"
              onClick={() => setIsEditing(false)}
            />
            <div 
              className="absolute bg-white border border-gray-300 rounded-lg shadow-lg px-3 py-2 z-50"
              style={{
                top: panelPosition.top ? '-48px' : '100%',
                left: panelPosition.left ? '-8px' : '50%',
                transform: !panelPosition.left ? 'translateX(-50%)' : undefined,
                marginTop: !panelPosition.top ? '4px' : undefined
              }}
            >
              <input
                ref={inputRef}
                defaultValue={currentText as string}
                className="border border-gray-300 rounded px-2 py-1 text-sm min-w-[120px]"
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
                placeholder="输入按钮文本"
              />
            </div>
          </>
        )}
        
        {/* 原始按钮 - 编辑时保持正常样式但加编辑边框 */}
        {as === 'Button' ? (
          (() => {
            const { Button } = require('../common');
            return (
              <Button 
                {...props} 
                ref={elementRef}
                className={className} // 保持原始样式，不添加edit-highlight
                style={{
                  outline: '2px dashed #3b82f6',
                  outlineOffset: '2px',
                  ...props.style
                }}
              >
                {currentText}
              </Button>
            );
          })()
        ) : (
          <button 
            {...props} 
            ref={elementRef}
            className={className} // 保持原始样式，不添加edit-highlight
            style={{
              outline: '2px dashed #3b82f6',
              outlineOffset: '2px',
              ...props.style
            }}
          >
            {currentText}
          </button>
        )}
      </span>
    );
  }

  const editableProps = isEditMode ? {
    ref: elementRef,
    onClick: handleClick,
    className: `${className} cursor-pointer editable-button-hover`,
    style: {
      ...props.style
    }
  } : {
    ref: elementRef,
    className,
    onClick,
    ...props
  };

  if (as === 'Button') {
    // Dynamically import and render Button component
    const { Button } = require('../common');
    return <Button {...editableProps}>{currentText}</Button>;
  }

  return <button {...editableProps}>{currentText}</button>;
};