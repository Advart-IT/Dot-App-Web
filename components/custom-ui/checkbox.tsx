
import React, { useEffect, useState, useRef } from 'react';

interface SmartCheckboxProps {
    label?: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    onChangeComplete?: (checked: boolean) => void;
    required?: boolean;
    className?: string;
    checkboxClassName?: string;
    labelClassName?: string;
    indeterminate?: boolean;
    disabled?: boolean;
}

const SmartCheckbox: React.FC<SmartCheckboxProps> = ({
    label,
    checked,
    onChange,
    onChangeComplete,
    required = false,
    className = '',
    checkboxClassName = '',
    labelClassName = '',
    indeterminate = false,
    disabled = false,
}) => {
    const checkboxRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (checkboxRef.current) {
            checkboxRef.current.indeterminate = indeterminate;
        }
    }, [indeterminate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newChecked = e.target.checked;
        onChange(newChecked);
    };

    const handleBlur = () => {
        if (onChangeComplete) {
            onChangeComplete(checked);
        }
    };

    return (
        <label className={`smart-checkbox ${className}`}>
            <input
                ref={checkboxRef}
                type="checkbox"
                checked={checked}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={disabled}
                className={checkboxClassName}
            />
            {label && (
                <span className={`smart-checkbox-label ${labelClassName}`}>
                    {label}
                    {required && <span className="smart-checkbox-required">*</span>}
                </span>
            )}
        </label>
    );
};

export default SmartCheckbox;