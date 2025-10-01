"use client";

import * as React from "react";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { cva, type VariantProps } from "class-variance-authority";
import { RxCross2 } from "react-icons/rx";

import { cn } from "../utils/cn";

import { motion } from "framer-motion";

const Sheet = SheetPrimitive.Root;

const SheetPortal = SheetPrimitive.Portal;

const SheetTrigger = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Trigger> & {
    className?: string;
    asChild?: boolean;
    children: React.ReactNode;
  }
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Trigger className={cn(className)} {...props} ref={ref} />
));
SheetTrigger.displayName = SheetPrimitive.Trigger.displayName;

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay> & {
    className?: string;
    backgroundColor?: string;
  }
>(({ className, backgroundColor = "bg-black/25", ...props }, ref) => (
  <SheetPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-30 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      backgroundColor,
      className,
    )}
    {...props}
    ref={ref}
  />
));
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName;

const SheetClose = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Close>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Close> & {
    asChild?: boolean;
    className?: string;
    children?: React.ReactNode;
  }
>(({ children, className, ...props }, ref) => (
  <SheetPrimitive.Close
    className={cn("absolute right-4 top-4 z-40 disabled:pointer-events-none", className)}
    {...props}
    ref={ref}
  >
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.7, ease: "easeInOut" }}
    >
      {children || <RxCross2 className="size-8" />}
    </motion.div>
  </SheetPrimitive.Close>
));
SheetClose.displayName = SheetPrimitive.Close.displayName;

const sheetVariants = cva(
  "fixed z-50 gap-4 bg-neutral-white px-8 pb-28 pt-16 md:py-16 md:px-12 lg:py-20 lg:px-16 transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-700 data-[state=open]:duration-700 overflow-scroll",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=closed]:slide-out-to-left-1/2 data-[state=open]:slide-in-from-top data-[state=open]:slide-in-from-left-1/2 -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2",
        bottom:
          "inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=closed]:slide-out-to-left-1/2 data-[state=open]:slide-in-from-bottom data-[state=open]:slide-in-from-left-1/2 -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2",
        left: "inset-y-0 left-0 h-full w-[90%] md:w-[80%] lg:w-full border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left lg:max-w-[40rem]",
        right:
          "inset-y-0 right-0 h-full w-[90%] md:w-[80%] lg:w-full border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right lg:max-w-[40rem]",
        center:
          "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[40rem] border data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom data-[state=closed]:opacity-0 data-[state=open]:opacity-100",
      },
    },
    defaultVariants: {
      side: "right",
    },
  },
);

interface SheetContentProps extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content> {
  side?: VariantProps<typeof sheetVariants>["side"];
  className?: string;
  children: React.ReactNode;
  overlayClassName?: string;
  overlayColor?: string;
}

const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  SheetContentProps
>(({ side = "right", className, children, overlayClassName, overlayColor, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay className={overlayClassName} backgroundColor={overlayColor} />
    <SheetPrimitive.Content ref={ref} className={cn(sheetVariants({ side }), className)} {...props}>
      {children}
    </SheetPrimitive.Content>
  </SheetPortal>
));
SheetContent.displayName = SheetPrimitive.Content.displayName;

const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-2 text-center sm:text-left", className)} {...props} />
);
SheetHeader.displayName = "SheetHeader";

const SheetFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)}
    {...props}
  />
);
SheetFooter.displayName = "SheetFooter";

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title> & {
    children: React.ReactNode;
    className?: string;
  }
>(({ className, children, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold text-text-primary", className)}
    {...props}
  >
    {children}
  </SheetPrimitive.Title>
));
SheetTitle.displayName = SheetPrimitive.Title.displayName;

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    className={cn("text-sm text-text-primary", className)}
    {...props}
  />
));
SheetDescription.displayName = SheetPrimitive.Description.displayName;

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
};
