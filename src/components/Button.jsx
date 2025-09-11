import React, { forwardRef } from "react"
import { cn } from "../../utils/lib"

const Button = forwardRef(
  ({ className, size = "md", asChild = false, ...props }, ref) => {
    const sizes = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2 text-base",
      lg: "px-7 py-2 text-lg",
    }

    const Comp = asChild ? "span" : "button"

    return (
      <Comp
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-900 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
          sizes[size],
          className
        )}
        {...props}
      />
    )
  }
)

Button.displayName = "Button"

export default Button
