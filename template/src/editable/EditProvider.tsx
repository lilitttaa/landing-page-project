"use client";

import React from "react";

export interface EditProviderProps {
  isEditMode?: boolean;
  onUpdate?: (path: string, value: unknown) => void;
  basePath?: string;
  children?: React.ReactNode;
}

/**
 * Lightweight no-op edit context for generated projects.
 */
export const EditProvider: React.FC<EditProviderProps> = ({ children }) => <>{children}</>;
