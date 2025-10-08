"use client";

import React from "react";

export interface EditableArrayProps {
  path?: string;
  as?: "fragment";
  children?: React.ReactNode;
}

export const EditableArray: React.FC<EditableArrayProps> = ({ children }) => <>{children}</>;
