"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "../utils/cn";

export type TabsProps = React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root> & {
  children?: React.ReactNode;
  className?: string;
};
const Tabs = React.forwardRef<React.ElementRef<typeof TabsPrimitive.Root>, TabsProps>(
  ({ className, children, ...props }, ref) => (
    <TabsPrimitive.Root ref={ref} className={cn(className)} {...props}>
      {children}
    </TabsPrimitive.Root>
  ),
);
Tabs.displayName = TabsPrimitive.Root.displayName;

type TabsListProps = React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> & {
  children?: React.ReactNode;
  className?: string;
};
const TabsList = React.forwardRef<React.ElementRef<typeof TabsPrimitive.List>, TabsListProps>(
  ({ className, children, ...props }, ref) => (
    <TabsPrimitive.List ref={ref} className={cn("flex", className)} {...props}>
      {children}
    </TabsPrimitive.List>
  ),
);
TabsList.displayName = TabsPrimitive.List.displayName;

type TabsTriggerProps = React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & {
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
};
const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  TabsTriggerProps
>(({ className, children, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap border border-border-primary bg-background-primary px-6 py-2 text-text-primary transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background-alternative data-[state=active]:text-text-alternative",
      className,
    )}
    {...props}
  >
    {children}
  </TabsPrimitive.Trigger>
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

type TabsContentProps = React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content> & {
  children?: React.ReactNode;
  className?: string;
};
const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  TabsContentProps
>(({ className, children, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn("focus-visible:outline-none", className)}
    {...props}
  >
    {children}
  </TabsPrimitive.Content>
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
