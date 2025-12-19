// frontend/src/features/chits/components/forms/fields/DateFields.jsx

import PropTypes from "prop-types";
import { Controller } from "react-hook-form";
import CustomMonthInput from "../../../../../components/ui/CustomMonthInput";

const DateFields = ({
    control,
    errors,
    isFormDisabled,
    onStartDateChange,
    onEndDateChange,
}) => {
    return (
        <div className="grid sm:grid-cols-2 gap-6">
            <div>
                <label
                    htmlFor="start_date"
                    className="block text-lg font-medium text-text-secondary mb-1"
                >
                    Start Date
                </label>
                <Controller
                    control={control}
                    name="start_date"
                    render={({ field }) => (
                        <CustomMonthInput
                            {...field}
                            disabled={isFormDisabled}
                            className={errors.start_date ? "border-red-500" : ""}
                            onFocus={onStartDateChange}
                        />
                    )}
                />
                {errors.start_date && (
                    <p className="mt-1 text-sm text-red-500">
                        {errors.start_date.message}
                    </p>
                )}
            </div>
            <div>
                <label
                    htmlFor="end_date"
                    className="block text-lg font-medium text-text-secondary mb-1"
                >
                    End Date
                </label>
                <Controller
                    control={control}
                    name="end_date"
                    render={({ field }) => (
                        <CustomMonthInput
                            {...field}
                            disabled={isFormDisabled}
                            className={errors.end_date ? "border-red-500" : ""}
                            onFocus={onEndDateChange}
                        />
                    )}
                />
                {errors.end_date && (
                    <p className="mt-1 text-sm text-red-500">
                        {errors.end_date.message}
                    </p>
                )}
            </div>
        </div>
    );
};

DateFields.propTypes = {
    control: PropTypes.object.isRequired,
    errors: PropTypes.object,
    isFormDisabled: PropTypes.bool,
    onStartDateChange: PropTypes.func,
    onEndDateChange: PropTypes.func,
};

export default DateFields;
