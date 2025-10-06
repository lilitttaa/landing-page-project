'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface EditableContextType {
  isEditMode: boolean;
  blockId: string;
  onEdit: (path: string, type: string, currentValue: any, position?: { x: number; y: number }) => void;
  onUpdate: (path: string, newValue: any) => void;
}

const EditableContext = createContext<EditableContextType | null>(null);

interface EditableProviderProps {
  children: React.ReactNode;
  blockId: string;
  isEditMode?: boolean;
}

export const EditableProvider: React.FC<EditableProviderProps> = ({ 
  children, 
  blockId, 
  isEditMode = false 
}) => {
  const [currentEditMode, setCurrentEditMode] = useState(isEditMode);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'SET_MODE') {
        setCurrentEditMode(event.data.payload.mode === 'edit');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const onEdit = (path: string, type: string, currentValue: any, position?: { x: number; y: number }) => {
    if (!currentEditMode) return;
    
    const fullPath = `${blockId}.${path}`;
    const payload = {
      elementType: type,
      elementPath: fullPath,
      currentValue,
      currentUrl: type === 'link' ? currentValue : undefined,
      position
    };
    
    window.parent.postMessage({ type: 'EDIT_REQUEST', payload }, '*');
  };

  const onUpdate = (path: string, newValue: any) => {
    const fullPath = `${blockId}.${path}`;
    window.parent.postMessage({ 
      type: 'UPDATE_CONTENT', 
      payload: { elementPath: fullPath, newValue } 
    }, '*');
  };

  return (
    <EditableContext.Provider value={{
      isEditMode: currentEditMode,
      blockId,
      onEdit,
      onUpdate
    }}>
      {children}
    </EditableContext.Provider>
  );
};

export const useEditable = () => {
  const context = useContext(EditableContext);
  if (!context) {
    throw new Error('useEditable must be used within an EditableProvider');
  }
  return context;
};