// frontend/src/components/ui/ActionButton.jsx

import { Loader2 } from "lucide-react";

/**
 * ActionButton - Icon button for row-level actions with consistent styling and loading state.
 *
 * @param {React.ComponentType} icon - Lucide icon component
 * @param {string} variant - Color variant ("info" | "warning" | "error")
 * @param {string} title - Tooltip text
 * @param {function} onClick - Click handler
 * @param {boolean} isLoading - Shows loading spinner
 * @param {boolean} disabled - Disables the button
 * @param {string} className - Additional CSS classes
 */
const ActionButton = ({
  icon: Icon,
  variant = "info",
  title,
  onClick,
  isLoading = false,
  disabled = false,
  className = "",
}) => {
  const variantStyles = {
    info: "text-info-accent hover:bg-info-accent hover:text-white",
    warning: "text-warning-accent hover:bg-warning-accent hover:text-white",
    error: "text-error-accent hover:bg-error-accent hover:text-white",
    success: "text-success-accent hover:bg-success-accent hover:text-white",
  };

  const baseStyles =
    "p-2 text-lg rounded-md transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      title={title}
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <Icon className="w-5 h-5" />
      )}
    </button>
  );
};

export default ActionButton;
