'use client';

import React, { createContext, useContext, ReactNode } from 'react';

interface EditContextType {
  isEditMode: boolean;
  onUpdate: (path: string, value: any) => void;
  basePath?: string;
}

const EditContext = createContext<EditContextType | undefined>(undefined);

interface EditProviderProps {
  children: ReactNode;
  isEditMode: boolean;
  onUpdate: (path: string, value: any) => void;
  basePath?: string;
}

export const EditProvider: React.FC<EditProviderProps> = ({ 
  children, 
  isEditMode, 
  onUpdate, 
  basePath = '' 
}) => {
  return (
    <EditContext.Provider value={{ isEditMode, onUpdate, basePath }}>
      {children}
    </EditContext.Provider>
  );
};

export const useEditContext = () => {
  const context = useContext(EditContext);
  if (context === undefined) {
    throw new Error('useEditContext must be used within an EditProvider');
  }
  return context;
};