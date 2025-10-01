"use client";

import * as React from "react";

import { cn } from "../utils/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  prefix?: string;
  prefixPosition?: "left" | "right";
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    { className, type, icon, iconPosition = "left", prefix, prefixPosition = "left", ...props },
    ref,
  ) => {
    return (
      <div className="relative flex w-full items-center">
        {icon && iconPosition === "left" && <div className="absolute left-3">{icon}</div>}
        {prefix && prefixPosition === "left" && (
          <div className="min-h-11 shrink-0 border-y border-l border-border-primary px-3 py-2">
            {prefix}
          </div>
        )}
        <input
          type={type}
          className={cn(
            "flex size-full min-h-11 border border-border-primary bg-background-primary py-2 align-middle file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
            icon ? (iconPosition === "left" ? "pl-[2.75rem] pr-3" : "pl-3 pr-[2.75rem]") : "px-3",
            prefix && "grow-1",
            className,
          )}
          ref={ref}
          {...props}
        />
        {icon && iconPosition === "right" && <div className="absolute right-3">{icon}</div>}
        {prefix && prefixPosition === "right" && (
          <div className="min-h-11 shrink-0 border-y border-r border-border-primary px-3 py-2">
            {prefix}
          </div>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

export { Input };
