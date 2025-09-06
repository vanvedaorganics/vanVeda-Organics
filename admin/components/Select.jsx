// src/components/ui/Select.jsx
"use client";
import React, { useMemo } from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { cn } from "../../utils/lib";

/**
 * Simple options format:
 * options = [{ value: "fruits", label: "Fruits", id: "cat-1" }, ...]
 *
 * Supports:
 * - value, onValueChange for controlled usage
 * - options prop for simple mapping
 * - children for advanced control
 */

export  default function Select({ value, onValueChange, options = [], placeholder = "Select...", className = "", disabled = false, size = "default", children, ...props }) {
  // memoize options rendering
  const items = useMemo(() => options, [options]);

  return (
    <SelectPrimitive.Root value={value} onValueChange={onValueChange} disabled={disabled} {...props}>
      <SelectPrimitive.Trigger
        className={cn(
          "inline-flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm shadow-sm",
          disabled ? "opacity-60 cursor-not-allowed" : "hover:shadow",
          className
        )}
        aria-disabled={disabled}
        data-size={size}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon>
          <ChevronDownIcon className="w-4 h-4 opacity-60" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content className="z-50 overflow-hidden rounded-md border bg-white shadow-lg">
          <SelectPrimitive.ScrollUpButton className="flex items-center justify-center py-1">
            {/* optional icon */}
          </SelectPrimitive.ScrollUpButton>

          <SelectPrimitive.Viewport className="p-1">
            {/* if consumer passed options array, render them; otherwise render children */}
            {items.length > 0 ? (
              items.map((opt) => (
                <SelectPrimitive.Item
                  key={opt.id ?? opt.value}
                  value={opt.value}
                  className="relative flex cursor-default select-none items-center gap-2 rounded px-2 py-1 text-sm hover:bg-gray-100"
                >
                  <SelectPrimitive.ItemText>{opt.label}</SelectPrimitive.ItemText>
                  <SelectPrimitive.ItemIndicator className="absolute right-2">
                    <CheckIcon className="w-4 h-4" />
                  </SelectPrimitive.ItemIndicator>
                </SelectPrimitive.Item>
              ))
            ) : (
              children
            )}
          </SelectPrimitive.Viewport>

          <SelectPrimitive.ScrollDownButton className="flex items-center justify-center py-1">
            {/* optional icon */}
          </SelectPrimitive.ScrollDownButton>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
