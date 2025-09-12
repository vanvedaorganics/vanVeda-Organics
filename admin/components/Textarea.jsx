// src/components/ui/Textarea.jsx
import React from "react";
import { cn } from "../../utils/lib";

const Textarea = React.forwardRef(function Textarea(
  { id, className = "", error = "", rows = 4, disabled = false, ...props },
  ref
) {
  // allow parent to pass id; if absent, consumer should manage id
  const describedBy = error ? `${id}-error` : undefined;

  return (
    <>
      <textarea
        id={id}
        ref={ref}
        rows={rows}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        disabled={disabled}
        className={cn(
          "w-full min-h-[4rem] rounded-md border px-3 py-2 text-sm placeholder:text-[#613d38] focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-ring transition-shadow",
          disabled && "opacity-60 cursor-not-allowed",
          error && "border-destructive",
          className
        )}
        {...props}
      />
      {error && (
        <p id={describedBy} role="alert" className="mt-1 text-sm text-destructive">
          {error}
        </p>
      )}
    </>
  );
});

export default Textarea;
