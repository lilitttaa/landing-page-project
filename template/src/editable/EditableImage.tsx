"use client";

import React from "react";

export type EditableImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  [key: string]: unknown;
};

export const EditableImage: React.FC<EditableImageProps> = ({ src, alt, ...rest }) => (
  <img src={src ?? ""} alt={alt} {...rest} />
);
