// frontend/src/features/chits/components/forms/fields/FixedChitFields.jsx

import PropTypes from "prop-types";
import { Clock, PieChart } from "lucide-react";
import FormattedInput from "../../../../../components/ui/FormattedInput";

/**
 * Helper to format numbers with commas (Indian Locale)
 */
const formatNumber = (value) => {
    if (value === undefined || value === null || value === "") return "";
    return Number(value).toLocaleString("en-IN");
};

/**
 * Helper to parse formatted string back to number
 */
const parseNumber = (value) => {
    if (!value) return "";
    const rawValue = value.toString().replace(/\D/g, "");
    return rawValue ? Number(rawValue) : "";
};

const FixedChitFields = ({
    control,
    register,
    errors,
    isFormDisabled,
    isEditMode,
    handleKeyDown,
    onDurationChange,
}) => {
    return (
        <div className="grid sm:grid-cols-2 gap-6">
            {/* Monthly Installment (Fixed Chit) */}
            <div>
                <label
                    htmlFor="monthly_installment"
                    className="block text-lg font-medium text-text-secondary mb-1"
                >
                    Monthly Installment
                </label>
                <div className="relative flex items-center">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <PieChart className="w-5 h-5 text-text-secondary" />
                    </span>
                    <div className="absolute left-10 h-6 w-px bg-border"></div>
                    <FormattedInput
                        name="monthly_installment"
                        control={control}
                        format={formatNumber}
                        parse={parseNumber}
                        id="monthly_installment"
                        className={`w-full pl-12 pr-4 py-3 text-base bg-background-secondary border rounded-md focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-70 disabled:cursor-not-allowed ${errors.monthly_installment ? "border-red-500" : "border-border"
                            }`}
                        placeholder="20,000"
                        disabled={isFormDisabled}
                        onKeyDown={handleKeyDown}
                    />
                </div>
                {errors.monthly_installment && (
                    <p className="mt-1 text-sm text-red-500">
                        {errors.monthly_installment.message}
                    </p>
                )}
            </div>

            {/* Duration */}
            <div>
                <label
                    htmlFor="duration_months"
                    className="block text-lg font-medium text-text-secondary mb-1"
                >
                    Duration (months){" "}
                    {isEditMode && (
                        <span className="text-xs text-text-secondary">
                            (Cannot be changed)
                        </span>
                    )}
                </label>
                <div className="relative flex items-center">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <Clock className="w-5 h-5 text-text-secondary" />
                    </span>
                    <div className="absolute left-10 h-6 w-px bg-border"></div>
                    <input
                        {...register("duration_months", { valueAsNumber: true })}
                        type="number"
                        id="duration_months"
                        autoComplete="off"
                        className={`w-full pl-12 pr-4 py-3 text-base bg-background-secondary border rounded-md focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-70 disabled:cursor-not-allowed ${errors.duration_months ? "border-red-500" : "border-border"
                            }`}
                        min="1"
                        placeholder="20"
                        disabled={isFormDisabled || isEditMode}
                        onKeyDown={handleKeyDown}
                        onFocus={onDurationChange}
                    />
                </div>
                {errors.duration_months && (
                    <p className="mt-1 text-sm text-red-500">
                        {errors.duration_months.message}
                    </p>
                )}
            </div>
        </div>
    );
};

FixedChitFields.propTypes = {
    control: PropTypes.object.isRequired,
    register: PropTypes.func.isRequired,
    errors: PropTypes.object,
    isFormDisabled: PropTypes.bool,
    isEditMode: PropTypes.bool,
    handleKeyDown: PropTypes.func,
    onDurationChange: PropTypes.func,
};

export default FixedChitFields;
