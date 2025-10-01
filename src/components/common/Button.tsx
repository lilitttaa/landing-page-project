// // src/components/Button.tsx

// import * as React from "react";

// // 定义 Button 组件的 Props 接口
// export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
//   btnType?: "default" | "bubble" | "brick" | "gradient" | "sleek" | "elevate";
//   variant?: "primary" | "secondary" | "link" | "outline";
//   // Add 'link' to the size type definition
//   size?: "default" | "sm" | "lg" | "icon" | "link"; // <-- FIX IS HERE
//   title?: string;
//   iconLeft?: React.ReactNode;
//   iconRight?: React.ReactNode;
//   children?: React.ReactNode;
// }

// // Button 组件
// const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
//   (
//     {
//       className,
//       btnType = "default", // 使用新的属性名 'btnType'
//       variant = "primary",
//       size = "default",
//       children,
//       title,
//       iconLeft,
//       iconRight,
//       // 解构剩余的 props，原生HTML的type属性会在这里被正确传递
//       ...props
//     },
//     ref
//   ) => {
//     const baseClasses =
//       "inline-flex items-center justify-center whitespace-nowrap text-base font-medium transition-all duration-200 ease-in-out " +
//       "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 " +
//       "disabled:pointer-events-none disabled:opacity-50 cursor-pointer";

//     let typeAndVariantClasses = "";
//     let sizeClasses = "";

//     // 根据 btnType 和 variant 确定主要样式
//     switch (btnType) { // 使用新的属性名
//       case "default":
//         switch (variant) {
//           case "primary":
//             typeAndVariantClasses =
//               "rounded-full bg-[#D977AE] text-white border border-[#C56B9B] hover:bg-[#C56B9B] hover:shadow-[0_4px_0_0_rgba(0,0,0,0.1)] active:translate-y-1 active:shadow-none";
//             break;
//           case "secondary":
//             typeAndVariantClasses =
//               "rounded-full bg-gray-200 text-gray-800 border border-gray-300 hover:bg-gray-300 hover:shadow-[0_2px_0_0_rgba(0,0,0,0.05)] active:translate-y-0.5 active:shadow-none";
//             break;
//           case "link":
//             typeAndVariantClasses = "rounded-none text-[#D977AE] underline-offset-4 hover:underline focus:ring-transparent";
//             break;
//           case "outline":
//             typeAndVariantClasses = "rounded-full bg-transparent text-[#D977AE] border border-[#D977AE] hover:bg-[#D977AE] hover:text-white";
//             break;
//         }
//         break;

//       case "bubble":
//         switch (variant) {
//           case "primary":
//             typeAndVariantClasses =
//               "rounded-full bg-blue-500 text-white shadow-lg shadow-blue-500/50 hover:scale-105 active:scale-95 transition-transform";
//             break;
//           case "secondary":
//             typeAndVariantClasses =
//               "rounded-full bg-purple-300 text-purple-900 shadow-md shadow-purple-300/50 hover:scale-105 active:scale-95 transition-transform";
//             break;
//           case "link":
//             typeAndVariantClasses = "rounded-full text-blue-600 hover:bg-blue-100 hover:underline active:scale-95 transition-transform";
//             break;
//           case "outline":
//             typeAndVariantClasses = "rounded-full bg-transparent text-blue-500 border-2 border-blue-500 hover:bg-blue-500 hover:text-white transition-colors";
//             break;
//         }
//         break;

//       case "brick":
//         switch (variant) {
//           case "primary":
//             typeAndVariantClasses =
//               "rounded-md bg-gray-200 text-gray-800 border border-gray-400 shadow-[0_4px_0_0_rgba(0,0,0,0.2)] hover:bg-gray-300 active:shadow-none active:translate-y-1";
//             break;
//           case "secondary":
//             typeAndVariantClasses =
//               "rounded-md bg-white text-gray-800 border border-gray-400 shadow-[0_4px_0_0_rgba(0,0,0,0.1)] hover:bg-gray-100 active:shadow-none active:translate-y-1";
//             break;
//           case "link":
//             typeAndVariantClasses = "rounded-md text-gray-700 underline-offset-4 hover:underline";
//             break;
//           case "outline":
//             typeAndVariantClasses = "rounded-md bg-transparent text-gray-600 border-2 border-gray-600 hover:bg-gray-100 hover:text-gray-800";
//             break;
//         }
//         break;

//       case "gradient":
//         switch (variant) {
//           case "primary":
//             typeAndVariantClasses =
//               "rounded-lg text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-md shadow-purple-500/30";
//             break;
//           case "secondary":
//             typeAndVariantClasses =
//               "rounded-lg text-white bg-gradient-to-r from-gray-400 to-gray-600 hover:from-gray-500 hover:to-gray-700 shadow-md shadow-gray-500/30";
//             break;
//           case "link":
//             typeAndVariantClasses = "rounded-lg text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-80";
//             break;
//           case "outline":
//             typeAndVariantClasses =
//               "rounded-lg border-2 border-transparent bg-clip-padding bg-gradient-to-r from-purple-500 to-pink-500 text-white " +
//               "hover:from-purple-600 hover:to-pink-600";
//             break;
//         }
//         break;

//       case "sleek":
//         switch (variant) {
//           case "primary":
//             typeAndVariantClasses =
//               "rounded-md bg-zinc-800 text-white hover:bg-zinc-700 active:bg-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-700";
//             break;
//           case "secondary":
//             typeAndVariantClasses =
//               "rounded-md bg-zinc-200 text-zinc-800 hover:bg-zinc-300 active:bg-zinc-400 shadow-sm ring-1 ring-inset ring-zinc-300";
//             break;
//           case "link":
//             typeAndVariantClasses = "rounded-md text-zinc-600 hover:underline active:text-zinc-800";
//             break;
//           case "outline":
//             typeAndVariantClasses = "rounded-md bg-transparent text-zinc-800 border border-zinc-400 hover:bg-zinc-100 active:bg-zinc-200";
//             break;
//         }
//         break;

//       case "elevate":
//         switch (variant) {
//           case "primary":
//             typeAndVariantClasses =
//               "rounded-lg bg-green-500 text-white shadow-xl shadow-green-500/40 hover:shadow-2xl hover:shadow-green-500/50 " +
//               "transform hover:-translate-y-1 transition-transform";
//             break;
//           case "secondary":
//             typeAndVariantClasses =
//               "rounded-lg bg-orange-400 text-white shadow-lg shadow-orange-400/30 hover:shadow-xl hover:shadow-orange-400/40 " +
//               "transform hover:-translate-y-0.5 transition-transform";
//             break;
//           case "link":
//             typeAndVariantClasses = "rounded-lg text-green-600 hover:text-green-700 hover:underline transform hover:-translate-y-0.5 transition-transform";
//             break;
//           case "outline":
//             typeAndVariantClasses =
//               "rounded-lg bg-transparent text-green-500 border border-green-500 shadow-md shadow-green-500/20 " +
//               "hover:bg-green-500 hover:text-white transform hover:-translate-y-0.5 transition-transform";
//             break;
//         }
//         break;
//     }

//     switch (size) {
//       case "default":
//         sizeClasses = "h-10 px-6 py-2";
//         break;
//       case "sm":
//         sizeClasses = "h-9 px-4 py-2 text-sm";
//         break;
//       case "lg":
//         sizeClasses = "h-11 px-8 py-2 text-lg";
//         break;
//       case "icon":
//         sizeClasses = "h-10 w-10 p-2";
//         break;
//       case "link":
//         sizeClasses = "h-auto px-0 py-0";
//         break;
//     }

//     const allClasses = `${baseClasses} ${typeAndVariantClasses} ${sizeClasses} ${className || ""}`.trim();

//     const content = children || title;

//     return (
//       <button className={allClasses} ref={ref} {...props}>
//         {iconLeft && <span className="mr-2">{iconLeft}</span>}
//         {content}
//         {iconRight && <span className="ml-2">{iconRight}</span>}
//       </button>
//     );
//   }
// );

// Button.displayName = "Button";

// export { Button };



"use client";

import * as React from "react";
import { Slot, Slottable } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../utils/cn";

const buttonVariants = cva(
  "focus-visible:ring-border-primary inline-flex gap-3 items-center justify-center whitespace-nowrap ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "border border-border-primary bg-background-alternative text-text-alternative",
        secondary: "border border-border-primary text-text-primary bg-background-primary",
        "secondary-alt": "border border-border-alternative text-text-alternative",
        tertiary: "text-text-primary",
        link: "border-0 text-text-primary gap-2",
        "link-alt": "border-0 text-text-alternative gap-2",
        ghost: "hover:bg-background-alternative hover:text-text-alternative",
      },
      size: {
        primary: "px-6 py-3",
        sm: "px-5 py-2",
        link: "p-0",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "primary",
    },
  },
);

type CustomProps = {
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  asChild?: boolean;
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    CustomProps,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, iconLeft, iconRight, children, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props}>
        {iconLeft && iconLeft}
        <Slottable>{children}</Slottable>
        {iconRight && iconRight}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
