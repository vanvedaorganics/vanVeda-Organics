import React from "react";
import PropTypes from "prop-types";

/**
 * CardGrid — 2 column layout with consistent spacing
 *
 * - Always 2 columns (on medium+ screens)
 * - 1 column on small screens (responsive)
 * - Equal spacing between cards (rows & columns)
 * - Internal padding so grid doesn't feel congested
 * - Uses border-box so it never overflows
 */
export default function CardGrid({ children, className = "" }) {
  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-2 gap-6 p-6 box-border ${className}`}
    >
      {children}
    </div>
  );
}

CardGrid.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};
