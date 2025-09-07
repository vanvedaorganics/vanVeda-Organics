import React from "react";
import PropTypes from "prop-types";
import { Edit, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { Select } from "../components"; // import your Select

export default function Card({
  id,
  title,
  description,
  onEdit,
  onDelete,
  isActive = false,
  onStatusChange,
  showActions = true,
  className = "",
  "data-testid": dataTestId,
}) {
  const statusOptions = [
    { value: "active", label: "Active", id: "active" },
    { value: "inactive", label: "Inactive", id: "inactive" },
  ];

  return (
    <motion.article
      data-testid={dataTestId}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{
        translateY: -4,
        boxShadow: "0 12px 30px rgba(3,7,18,0.12)",
      }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className={`w-full bg-white rounded-2xl p-5 shadow-md hover:shadow-lg transition-shadow duration-200 ease-out ${className}`}
      aria-label={`Card: ${title}`}
      role="group"
    >
      {/* Title */}
      <header className="mb-3 flex justify-between items-center">
        <h1
          className="text-lg font-semibold text-gray-900 truncate"
          title={title}
        >
          {title}
        </h1>

        {/* Active/Inactive selector */}
        <Select
          value={isActive ? "active" : "inactive"}
          onValueChange={(val) => onStatusChange?.(id, val)}
          options={statusOptions}
          className="min-w-[120px]"
        />
      </header>

      {/* Description row */}
      <div className="border border-gray-200 rounded-xl p-4 flex items-center justify-between gap-4">
        <h2 className="flex-1 text-center text-sm text-gray-700 font-medium break-words">
          {description}
        </h2>

        {/* Actions */}
        {showActions && (
          <span className="flex items-center gap-2">
            <button
              type="button"
              onClick={onEdit}
              aria-label={`Edit ${title}`}
              className="inline-flex items-center justify-center rounded-lg p-2 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-300"
            >
              <Edit size={16} aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={onDelete}
              aria-label={`Delete ${title}`}
              className="inline-flex items-center justify-center rounded-lg p-2 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-300 text-red-600"
            >
              <Trash2 size={16} aria-hidden="true" />
            </button>
          </span>
        )}
      </div>
    </motion.article>
  );
}

Card.propTypes = {
  id: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  isActive: PropTypes.bool,
  onStatusChange: PropTypes.func,
  showActions: PropTypes.bool,
  className: PropTypes.string,
  "data-testid": PropTypes.string,
};

Card.defaultProps = {
  description: "",
  onEdit: () => {},
  onDelete: () => {},
  isActive: false,
  onStatusChange: () => {},
  showActions: true,
  className: "",
  "data-testid": undefined,
};
