import React, { forwardRef } from "react"
import { cn } from "../../utils/lib"

const Input = forwardRef(({ label, error, suffix, className, type = "text", ...props }, ref) => {
  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label className="block text-sm font-semibold text-[#744531] mb-1 ml-1">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        <input
          type={type}
          className={cn(
            "flex h-12 w-full rounded-2xl border bg-white px-4 py-2 text-sm transition-all duration-200",
            "placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#28543d]/10",
            error 
              ? "border-red-500 focus:border-red-500 focus:ring-red-100" 
              : "border-[#E7CE9D]/40 focus:border-[#28543d]",
            suffix ? "pr-12" : "pr-4",
            "disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          ref={ref}
          {...props}
        />
        {suffix && (
          <div className="absolute right-3 flex items-center">
            {suffix}
          </div>
        )}
      </div>
      {error && (
        <p className="text-[10px] font-bold text-red-500 ml-1 mt-1 animate-in fade-in slide-in-from-top-1">
          {error}
        </p>
      )}
    </div>
  )
})

Input.displayName = "Input"

export default Input
