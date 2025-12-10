// frontend/src/components/ui/PageHeader.jsx

import { Loader2 } from "lucide-react";

/**
 * PageHeader - Reusable page header with title, optional count badge, and action button.
 *
 * @param {string} title - Page title
 * @param {number} count - Optional count to display in badge
 * @param {React.ComponentType} actionIcon - Optional Lucide icon component for action button
 * @param {string} actionTitle - Tooltip for action button
 * @param {function} onAction - Action button click handler
 * @param {boolean} isLoading - Shows loading spinner on action button
 * @param {boolean} showAction - Whether to show the action button (default: true when onAction exists)
 * @param {string} className - Additional CSS classes
 */
const PageHeader = ({
  title,
  count,
  actionIcon: ActionIcon,
  actionTitle = "Action",
  onAction,
  isLoading = false,
  showAction = true,
  className = "",
}) => {
  const showActionButton = showAction && onAction && ActionIcon;

  return (
    <div className={`relative flex justify-center items-center mb-4 ${className}`}>
      <h1 className="text-2xl md:text-3xl font-bold text-text-primary text-center">
        {title}
        {typeof count === "number" && (
          <span className="ml-2 text-lg font-normal text-text-secondary">
            ({count})
          </span>
        )}
      </h1>

      {showActionButton && (
        <div className="absolute right-0 flex items-center">
          <button
            onClick={onAction}
            disabled={isLoading}
            className="p-2 text-info-accent hover:bg-info-bg rounded-full transition-colors duration-200 disabled:opacity-50 cursor-pointer"
            title={actionTitle}
          >
            {isLoading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <ActionIcon className="w-6 h-6" />
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default PageHeader;
