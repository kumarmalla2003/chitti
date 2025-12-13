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
          className={`flex flex-wrap gap-3 ${className}`}
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
                  relative flex items-center gap-2.5 px-4 py-2.5 rounded-full cursor-pointer
                  border-2 transition-all duration-200 select-none
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
                  className="sr-only"
                  onChange={() => field.onChange(option.value)}
                />
                {Icon && (
                  <Icon
                    className={`w-4 h-4 flex-shrink-0 ${
                      isSelected ? "text-white" : "text-text-secondary"
                    }`}
                  />
                )}
                <span className="font-medium text-sm whitespace-nowrap">
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
