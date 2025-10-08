"use client";

import React from "react";
import { Button } from "../components/common";

type ButtonComponentProps = React.ComponentProps<typeof Button>;

export interface EditableButtonProps extends ButtonComponentProps {
  button?: any;
  children?: React.ReactNode;
  [key: string]: unknown;
}

export const EditableButton: React.FC<EditableButtonProps> = ({ button, children, ...rest }) => {
  const { title, ...buttonProps } = button ?? {};
  const { children: restChildren, ...forwardProps } = rest as ButtonComponentProps & {
    children?: React.ReactNode;
  };

  const content = children ?? restChildren ?? (title as React.ReactNode) ?? null;

  return (
    <Button {...buttonProps} {...forwardProps}>
      {content}
    </Button>
  );
};
