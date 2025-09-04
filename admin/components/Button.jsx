import React, { forwardRef } from "react";
import PropTypes from "prop-types";
import { cn } from "../../utils/lib"; 

/**
 * Button Component
 *
 * Props:
 * - variant: "primary" | "secondary" | "danger" | "ghost"
 * - size: "sm" | "md" | "lg" | "icon"
 * - loading: boolean (disables + shows spinner)
 * - disabled: boolean
 * - children: content inside button
 * - className: extra tailwind classes
 */
const variants = {
  primary:
    "bg-[#084629] text-white hover:bg-[#0a5a36] focus:ring-2 focus:ring-green-500",
  secondary:
    "bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-2 focus:ring-gray-400",
  danger:
    "bg-red-600 text-white hover:bg-red-700 focus:ring-2 focus:ring-red-500",
  ghost:
    "bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-2 focus:ring-gray-300",
};

const sizes = {
  sm: "px-3 py-1.5 text-sm rounded-md",
  md: "px-4 py-2 text-sm rounded-lg",
  lg: "px-6 py-3 text-base rounded-lg",
  icon: "p-2 rounded-full",
};

const Button = forwardRef(function Button(
  {
    type = "button",
    variant = "primary",
    size = "md",
    loading = false,
    disabled = false,
    className = "",
    children,
    ...props
  },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center font-medium transition-colors duration-200 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin h-4 w-4 mr-2 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
});

Button.displayName = "Button";

Button.propTypes = {
  type: PropTypes.oneOf(["button", "submit", "reset"]),
  variant: PropTypes.oneOf(["primary", "secondary", "danger", "ghost"]),
  size: PropTypes.oneOf(["sm", "md", "lg", "icon"]),
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
  className: PropTypes.string,
  children: PropTypes.node,
};

export default Button;
