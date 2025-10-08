"use client";

import React from "react";

export interface EditableLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  text?: React.ReactNode;
  children?: React.ReactNode;
  path?: string;
  textPath?: string;
  [key: string]: unknown;
}

export const EditableLink: React.FC<EditableLinkProps> = ({ text, children, ...rest }) => (
  <a {...rest}>{children ?? text}</a>
);
