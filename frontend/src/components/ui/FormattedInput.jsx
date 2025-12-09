import React, { useRef } from "react";
import PropTypes from "prop-types";
import { useController } from "react-hook-form";
import useCursorTracking from "../../hooks/useCursorTracking";

const FormattedInput = ({
    name,
    control,
    format,
    parse,
    rules,
    className,
    ...props
}) => {
    const {
        field: { onChange, value, ref: fieldRef, ...restField },
        fieldState: { error },
    } = useController({ name, control, rules });

    const inputRef = useRef(null);

    // Apply formatting to the current value
    // Ensure value is defined (handle null/undefined/0 correctly)
    const displayValue = format ? format(value) : value;

    // Setup cursor tracking
    const trackCursor = useCursorTracking(inputRef, displayValue);

    const handleChange = (e) => {
        // 1. Capture cursor position relative to digits
        trackCursor(e);

        // 2. Parse input value to raw data (e.g., number)
        const rawValue = parse ? parse(e.target.value) : e.target.value;

        // 3. Update react-hook-form state
        onChange(rawValue);
    };

    return (
        <input
            {...restField}
            ref={(e) => {
                fieldRef(e);
                inputRef.current = e;
            }}
            value={displayValue === undefined || displayValue === null ? "" : displayValue}
            onChange={handleChange}
            className={`${className} ${error ? "border-red-500" : ""}`}
            {...props}
        />
    );
};

FormattedInput.propTypes = {
    name: PropTypes.string.isRequired,
    control: PropTypes.object.isRequired,
    format: PropTypes.func, // (value) => string
    parse: PropTypes.func, // (inputValue) => rawValue
    rules: PropTypes.object,
    className: PropTypes.string,
};

export default FormattedInput;
