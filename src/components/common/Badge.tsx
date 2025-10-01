"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../utils/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-border-primary focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-background-alternative text-text-alternative",
        secondary: "border-transparent bg-background-secondary text-text-primary",
        outline: "text-text-primary border-border-primary",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
