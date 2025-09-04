import React, { forwardRef } from "react";
import PropTypes from "prop-types";
import { cn } from "../../utils/lib"; 

/**
 * Input
 *
 * Props:
 * - id: string (auto fallback to name)
 * - name: string
 * - label: string | node
 * - description: string | node
 * - error: string | node
 * - prefix: node (icon or text before input)
 * - suffix: node (icon or text after input)
 * - className: extra classes for input element
 * - wrapperClassName: extra classes for wrapper
 * - size: "sm" | "md" | "lg"
 * - type: input type
 * - disabled: boolean
 * - ...props forwarded to <input />
 *
 * Forwarded ref points to the underlying <input /> element.
 */
const sizes = {
  sm: "h-9 text-sm",
  md: "h-11 text-base",
  lg: "h-12 text-base",
};

const Input = forwardRef(function Input(
  {
    id,
    name,
    label,
    description,
    error,
    prefix,
    suffix,
    className = "",
    wrapperClassName = "",
    size = "md",
    type = "text",
    disabled = false,
    ...props
  },
  ref
) {
  const inputId = id || name || `input-${Math.random().toString(36).slice(2, 9)}`;
  const describedByIds = [];
  if (description) describedByIds.push(`${inputId}-desc`);
  if (error) describedByIds.push(`${inputId}-error`);
  const ariaDescribedBy = describedByIds.length ? describedByIds.join(" ") : undefined;

  return (
    <div className={cn("w-full", wrapperClassName)}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}

      <div
        className={cn(
          "flex items-center gap-2 rounded-lg border bg-white transition-shadow focus-within:shadow-lg",
          // border color depends on error/disabled/focus state (Tailwind classes)
          error ? "border-red-400" : "border-gray-200",
          disabled ? "opacity-60 cursor-not-allowed bg-gray-50" : "hover:border-gray-300",
          wrapperClassName
        )}
      >
        {prefix && <div className="pl-3 pr-2 text-gray-500 flex items-center">{prefix}</div>}

        <input
          id={inputId}
          name={name}
          ref={ref}
          type={type}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={ariaDescribedBy}
          className={cn(
            "w-full bg-transparent outline-none px-3",
            sizes[size],
            // subtle placeholder and caret styles
            "placeholder-gray-400 caret-indigo-600",
            className
          )}
          {...props}
        />

        {suffix && <div className="pr-3 pl-2 text-gray-500 flex items-center">{suffix}</div>}
      </div>

      {description && !error && (
        <p id={`${inputId}-desc`} className="mt-2 text-xs text-gray-500">
          {description}
        </p>
      )}

      {error && (
        <p id={`${inputId}-error`} className="mt-2 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
});

Input.displayName = "Input";

Input.propTypes = {
  id: PropTypes.string,
  name: PropTypes.string,
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  description: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  error: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  prefix: PropTypes.node,
  suffix: PropTypes.node,
  className: PropTypes.string,
  wrapperClassName: PropTypes.string,
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  type: PropTypes.string,
  disabled: PropTypes.bool,
};

export default Input;
