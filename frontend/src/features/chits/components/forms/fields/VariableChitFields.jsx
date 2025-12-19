// frontend/src/features/chits/components/forms/fields/VariableChitFields.jsx

import PropTypes from "prop-types";
import { Clock, Percent } from "lucide-react";

const VariableChitFields = ({
    register,
    errors,
    isFormDisabled,
    isEditMode,
    handleKeyDown,
    onDurationChange,
}) => {
    return (
        <div className="grid sm:grid-cols-2 gap-6">
            {/* Payout Premium Percent */}
            <div>
                <label
                    htmlFor="payout_premium_percent"
                    className="block text-lg font-medium text-text-secondary mb-1"
                >
                    Payout Premium (%)
                </label>
                <div className="relative flex items-center">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <Percent className="w-5 h-5 text-text-secondary" />
                    </span>
                    <div className="absolute left-10 h-6 w-px bg-border"></div>
                    <input
                        {...register("payout_premium_percent", { valueAsNumber: true })}
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        id="payout_premium_percent"
                        autoComplete="off"
                        className={`w-full pl-12 pr-4 py-3 text-base bg-background-secondary border rounded-md focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-70 disabled:cursor-not-allowed ${errors.payout_premium_percent ? "border-red-500" : "border-border"
                            }`}
                        placeholder="1"
                        disabled={isFormDisabled}
                        onKeyDown={handleKeyDown}
                    />
                </div>
                {errors.payout_premium_percent && (
                    <p className="mt-1 text-sm text-red-500">
                        {errors.payout_premium_percent.message}
                    </p>
                )}
            </div>

            {/* Duration for Variable Chit */}
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

VariableChitFields.propTypes = {
    register: PropTypes.func.isRequired,
    errors: PropTypes.object,
    isFormDisabled: PropTypes.bool,
    isEditMode: PropTypes.bool,
    handleKeyDown: PropTypes.func,
    onDurationChange: PropTypes.func,
};

export default VariableChitFields;
