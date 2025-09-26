import React, { useEffect, useState, useRef } from 'react';


// SmartToggleSwitch Component
interface SmartToggleSwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    onChangeComplete?: (checked: boolean) => void;
    label?: string;
    required?: boolean;
    className?: string;
    switchClassName?: string;
    disabled?: boolean;
}

const SmartToggleSwitch: React.FC<SmartToggleSwitchProps> = ({
    checked,
    onChange,
    onChangeComplete,
    label,
    required = false,
    className = '',
    switchClassName = '',
    disabled = false,
}) => {
    const [internalChecked, setInternalChecked] = useState(checked);
    const [lastCommittedChecked, setLastCommittedChecked] = useState(checked);

    useEffect(() => {
        setLastCommittedChecked(checked);
        setInternalChecked(checked); // Sync internal state with the `checked` prop
    }, [checked]);

    const handleToggle = () => {
        if (disabled) return;
        const newChecked = !internalChecked;
        setInternalChecked(newChecked);
        onChange(newChecked);

        if (onChangeComplete && newChecked !== lastCommittedChecked) {
            onChangeComplete(newChecked);
            setLastCommittedChecked(newChecked);
        }
    };

    return (
        <label className={`flex items-center cursor-pointer ${className}`}>
            <div
                onClick={handleToggle}
                className={`${switchClassName || 'relative w-12 h-6 bg-gray-300 rounded-full transition-all'} ${internalChecked ? 'bg-primary' : ''
                    }`}
            >
                <span
                    className={`absolute w-6 h-6 bg-white rounded-full shadow-md transition-transform ${internalChecked ? 'translate-x-6 bg-primary' : 'translate-x-0'
                        }`}
                ></span>
            </div>


            {label && (
                <span className="ml-2 text-sm">
                    {label} {required && <span className="text-red-500">*</span>}
                </span>
            )}
        </label>
    );
};

export default SmartToggleSwitch;