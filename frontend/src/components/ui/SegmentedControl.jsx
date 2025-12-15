// frontend/src/components/ui/SegmentedControl.jsx

import PropTypes from "prop-types";
import { Controller } from "react-hook-form";

/**
 * SegmentedControl - Modern toggle chip-style segmented control.
 * Renders a group of horizontally-aligned option chips with icons.
 *
 * @param {object} control - React Hook Form control object
 * @param {string} name - Form field name
 * @param {Array} options - Array of { value, label, icon, description }
 * @param {boolean} disabled - Whether the control is disabled
 * @param {string} className - Additional CSS classes
 */
const SegmentedControl = ({
  control,
  name,
  options,
  disabled = false,
  className = "",
}) => {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <div
          className={`flex gap-2 sm:gap-3 ${className}`}
          role="radiogroup"
          aria-label="Select option"
        >
          {options.map((option) => {
            const Icon = option.icon;
            const isSelected = field.value === option.value;

            return (
              <label
                key={option.value}
                className={`
                  relative flex items-center gap-1.5 sm:gap-2.5 px-2.5 sm:px-4 py-1.5 sm:py-2.5 rounded-full cursor-pointer
                  border-2 transition-all duration-200 select-none
                  has-[:focus]:ring-2 has-[:focus]:ring-accent has-[:focus]:ring-offset-2
                  ${
                    isSelected
                      ? "bg-accent text-white border-accent shadow-md"
                      : "bg-background-secondary text-text-secondary border-border hover:border-accent/50 hover:bg-accent/5"
                  }
                  ${disabled ? "opacity-50 cursor-not-allowed" : ""}
                `}
              >
                <input
                  type="radio"
                  {...field}
                  value={option.value}
                  checked={isSelected}
                  disabled={disabled}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer m-0 p-0"
                  onChange={() => field.onChange(option.value)}
                />
                {Icon && (
                  <Icon
                    className={`w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 ${
                      isSelected ? "text-white" : "text-text-secondary"
                    }`}
                  />
                )}
                <span className="font-medium text-xs sm:text-sm whitespace-nowrap">
                  {option.label}
                </span>
              </label>
            );
          })}
        </div>
      )}
    />
  );
};

SegmentedControl.propTypes = {
  control: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      icon: PropTypes.elementType,
      description: PropTypes.string,
    })
  ).isRequired,
  disabled: PropTypes.bool,
  className: PropTypes.string,
};

export default SegmentedControl;
