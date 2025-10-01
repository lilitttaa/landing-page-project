import { clsx, type ClassValue } from "clsx";
import { twMerge } from 'tailwind-merge'; // If you're using Tailwind CSS

/**
 * A utility function to conditionally join Tailwind CSS classes.
 * It uses `clsx` for combining various class inputs and `tailwind-merge`
 * to intelligently merge conflicting Tailwind utility classes.
 *
 * @param inputs - A rest parameter of `ClassValue` types, which can be
 * strings, numbers, objects (for conditional classes),
 * arrays, or null/undefined.
 * @returns A single string of merged and optimized class names.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}