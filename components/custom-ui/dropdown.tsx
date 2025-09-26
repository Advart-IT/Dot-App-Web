
import React, { useEffect, useMemo, useRef, useState } from 'react';

interface DropdownOption {
    label: string;
    value: string;
}

interface SmartDropdownProps {
    options: DropdownOption[];
    value: string;
    onChange: (value: string) => void;
    onChangeComplete?: (value: string) => void;
    placeholder?: string;
    label?: string;
    required?: boolean;
    className?: string;
    dropdownClassName?: string;
    baseButtonClassName?: string;
}

const SmartDropdown: React.FC<SmartDropdownProps> = ({
    options,
    value,
    onChange,
    onChangeComplete,
    placeholder = 'Select an option',
    label,
    required = false,
    className = '',
    dropdownClassName = '',
    baseButtonClassName = '',
}) => {
    const [search, setSearch] = useState('');
    const [open, setOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState<number>(0);
    const [lastCommittedValue, setLastCommittedValue] = useState(value);
    const containerRef = useRef<HTMLDivElement>(null);

    const filteredOptions = useMemo(() => {
        return options.filter((opt) =>
            opt.label.toLowerCase().includes(search.toLowerCase())
        );
    }, [options, search]);

    const selectedLabel =
        options.find((opt) => opt.value === value)?.label || placeholder;

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(e.target as Node)
            ) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        setLastCommittedValue(value);
    }, []);

    const handleSelect = (newValue: string) => {
        setOpen(false);
        setSearch('');
        onChange(newValue);

        if (newValue !== lastCommittedValue && onChangeComplete) {
            onChangeComplete(newValue);
            setLastCommittedValue(newValue);
        }
    };

    return (
        <div className={`smart-dropdown px-1 ${className}`} ref={containerRef}>
            {label && (
                <div className="text-12 text-ltxt mb-x2">
                    {label} {required && <span className="text-red-500">*</span>}
                </div>
            )}

            <button
                type="button"
                onClick={() => setOpen((prev) => !prev)}
                className={`smart-dropdown-button ${baseButtonClassName}`}
            >
                <div className="smart-dropdown-button-content">
                    <span className="smart-dropdown-selected-text" title={selectedLabel}>
                        {selectedLabel}
                    </span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="smart-dropdown-arrow" viewBox="0 0 10 6" fill="currentColor">
                        <path d="M1 1.5c0-.3.3-.5.5-.5h7c.2 0 .5.2.5.5 0 .1-.1.3-.2.4L5.5 5.2a.5.5 0 01-.7 0L1.2 1.9a.5.5 0 01-.2-.4z" />
                    </svg>
                </div>
            </button>

            {open && (
                <div className={`smart-dropdown-menu ${dropdownClassName}`}>
                    <input
                        autoFocus
                        type="text"
                        placeholder="Search..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setHighlightedIndex(0);
                        }}
                        className="smart-dropdown-search"
                    />
                    {filteredOptions.map((opt, index) => {
                        const isHighlighted = index === highlightedIndex;
                        const isSelected = value === opt.value;
                        let optionClassName = "smart-dropdown-option";

                        if (isHighlighted) {
                            optionClassName += " smart-dropdown-option-highlighted";
                        } else if (isSelected) {
                            optionClassName += " smart-dropdown-option-selected";
                        }

                        return (
                            <div
                                key={opt.value}
                                onClick={() => handleSelect(opt.value)}
                                className={optionClassName}
                            >
                                <span className="smart-dropdown-option-text" title={opt.label}>
                                    {opt.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default SmartDropdown;