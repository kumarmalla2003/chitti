// frontend/src/components/ui/FormattedCurrency.jsx

import { IndianRupee } from "lucide-react";

/**
 * FormattedCurrency - Displays currency with Indian Rupee icon and locale formatting.
 *
 * @param {Object} props
 * @param {number} props.amount - The amount to display
 * @param {string} [props.colorClass] - Optional color class (e.g., "text-error-accent" for payouts)
 * @param {string} [props.className] - Additional CSS classes
 * @param {boolean} [props.showIcon=true] - Whether to show the rupee icon
 */
const FormattedCurrency = ({
  amount,
  colorClass = "",
  className = "",
  showIcon = true,
}) => {
  const formattedAmount = (amount || 0).toLocaleString("en-IN");

  return (
    <span className={`inline-flex items-center ${colorClass} ${className}`}>
      {showIcon && <IndianRupee className="w-[1em] h-[1em]" />}
      {formattedAmount}
    </span>
  );
};

export default FormattedCurrency;
