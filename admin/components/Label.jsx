// src/components/ui/Label.jsx
import React from "react";
import { cn } from "../../utils/lib";

const Label = React.forwardRef(function Label(
  { htmlFor, className = "", children, required = false, disabled = false, ...props },
  ref
) {
  return (
    <label
      ref={ref}
      htmlFor={htmlFor}
      data-required={required ? "true" : undefined}
      aria-disabled={disabled ? "true" : undefined}
      className={cn(
        "inline-flex items-center gap-2 text-sm font-medium leading-none select-none",
        disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
      {required && <span className="text-destructive ml-1" aria-hidden>*</span>}
    </label>
  );
});

export default Label;
