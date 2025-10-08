"use client";

import React from "react";
import { EditableText } from "./EditableText";
import type { EditableTextProps } from "./EditableText";

interface DropdownExtras {
  title?: React.ReactNode;
}

export type EditableDropdownTitleProps = Omit<EditableTextProps, "value" | "children"> &
  DropdownExtras & {
    value?: React.ReactNode;
    children?: React.ReactNode;
  };

export const EditableDropdownTitle: React.FC<EditableDropdownTitleProps> = ({
  title,
  value,
  children,
  ...rest
}) => {
  const content = children ?? value ?? title;
  return <EditableText {...rest} value={content} />;
};
