"use client";

import React from "react";

export interface EditableTextProps extends React.HTMLAttributes<HTMLElement> {
  as?: keyof JSX.IntrinsicElements;
  value?: React.ReactNode;
  children?: React.ReactNode;
  [key: string]: unknown;
}

export const EditableText: React.FC<EditableTextProps> = ({
  as = "span",
  value,
  children,
  ...rest
}) => {
  const content = children ?? value;
  return React.createElement(as, rest, content);
};
