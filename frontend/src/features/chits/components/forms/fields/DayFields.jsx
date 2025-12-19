// frontend/src/features/chits/components/forms/fields/DayFields.jsx

import PropTypes from "prop-types";
import { WalletMinimal, TrendingUp } from "lucide-react";

const DayFields = ({
    register,
    errors,
    isFormDisabled,
    handleKeyDown,
}) => {
    return (
        <div className="grid sm:grid-cols-2 gap-6">
            <div>
                <label
                    htmlFor="collection_day"
                    className="block text-lg font-medium text-text-secondary mb-1"
                >
                    Collection Day
                </label>
                <div className="relative flex items-center">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <WalletMinimal className="w-5 h-5 text-text-secondary" />
                    </span>
                    <div className="absolute left-10 h-6 w-px bg-border"></div>
                    <input
                        {...register("collection_day", { valueAsNumber: true })}
                        type="number"
                        id="collection_day"
                        autoComplete="off"
                        className={`w-full pl-12 pr-4 py-3 text-base bg-background-secondary border rounded-md focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-70 disabled:cursor-not-allowed ${errors.collection_day ? "border-red-500" : "border-border"
                            }`}
                        min="1"
                        max="28"
                        placeholder="5"
                        disabled={isFormDisabled}
                        onKeyDown={handleKeyDown}
                    />
                </div>
                {errors.collection_day && (
                    <p className="mt-1 text-sm text-red-500">
                        {errors.collection_day.message}
                    </p>
                )}
            </div>
            <div>
                <label
                    htmlFor="payout_day"
                    className="block text-lg font-medium text-text-secondary mb-1"
                >
                    Payout Day
                </label>
                <div className="relative flex items-center">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <TrendingUp className="w-5 h-5 text-text-secondary" />
                    </span>
                    <div className="absolute left-10 h-6 w-px bg-border"></div>
                    <input
                        {...register("payout_day", { valueAsNumber: true })}
                        type="number"
                        id="payout_day"
                        autoComplete="off"
                        className={`w-full pl-12 pr-4 py-3 text-base bg-background-secondary border rounded-md focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-70 disabled:cursor-not-allowed ${errors.payout_day ? "border-red-500" : "border-border"
                            }`}
                        min="1"
                        max="28"
                        placeholder="10"
                        disabled={isFormDisabled}
                        onKeyDown={handleKeyDown}
                    />
                </div>
                {errors.payout_day && (
                    <p className="mt-1 text-sm text-red-500">
                        {errors.payout_day.message}
                    </p>
                )}
            </div>
        </div>
    );
};

DayFields.propTypes = {
    register: PropTypes.func.isRequired,
    errors: PropTypes.object,
    isFormDisabled: PropTypes.bool,
    handleKeyDown: PropTypes.func,
};

export default DayFields;
