import React, { forwardRef } from "react"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "../../utils/lib"
import { buttonVariants } from "./buttonVariant"

const Button = forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  )
})

Button.displayName = "Button"

export default Button;
