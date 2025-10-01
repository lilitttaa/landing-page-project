"use client";

import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { BiCheck } from "react-icons/bi";

import { cn } from "../utils/cn";

export interface RadioGroupProps extends React.ComponentProps<typeof RadioGroupPrimitive.Root> {}

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root> & {
    className?: string;
    children?: React.ReactNode;
  }
>(({ className, ...props }, ref) => {
  return <RadioGroupPrimitive.Root className={cn("grid gap-2", className)} {...props} ref={ref} />;
});
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName;

type RadioShape = "dot" | "check";

interface RadioGroupItemProps
  extends React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item> {
  id?: string;
  shape?: RadioShape;
  className?: string;
}

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  RadioGroupItemProps
>(({ className, id, shape = "dot", ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      id={id}
      className={cn(
        "aspect-square size-[1.125rem] rounded-full border border-border-primary text-text-primary focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-background-alternative",
        className,
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        {shape === "dot" ? (
          <div className="size-1.5 rounded-full bg-background-primary" />
        ) : (
          <BiCheck className="size-4 text-background-primary" />
        )}
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
});
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName;

export { RadioGroup, RadioGroupItem };
