// frontend/src/components/ui/Pagination.jsx

import { ArrowLeft, ArrowRight } from "lucide-react";

/**
 * Pagination - Reusable pagination component with previous/next navigation.
 *
 * @param {Object} props
 * @param {number} props.currentPage - Current active page (1-indexed)
 * @param {number} props.totalPages - Total number of pages
 * @param {Function} props.onPageChange - Callback when page changes
 * @param {string} [props.className] - Additional CSS classes
 */
const Pagination = ({ currentPage, totalPages, onPageChange, className = "" }) => {
  if (totalPages <= 1) return null;

  return (
    <div
      className={`flex justify-between items-center mt-4 w-full px-2 text-sm text-text-secondary ${className}`}
    >
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="p-2 rounded-full hover:bg-background-secondary hover:text-text-primary disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer disabled:cursor-not-allowed"
        aria-label="Previous page"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>
      <span className="font-medium">
        Page {currentPage} of {totalPages}
      </span>
      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="p-2 rounded-full hover:bg-background-secondary hover:text-text-primary disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer disabled:cursor-not-allowed"
        aria-label="Next page"
      >
        <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );
};

export default Pagination;
