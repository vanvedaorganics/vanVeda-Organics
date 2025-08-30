import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Merge classes intelligently (clsx handles conditionals, twMerge handles Tailwind conflicts)
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
