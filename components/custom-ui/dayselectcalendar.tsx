
import React, { useState, useEffect, useRef } from 'react';
import { Calendar } from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

interface SmartDaySelectorProps {
  value: Date | null;
  onChange: (value: Date | null) => void;
  onChangeComplete?: (value: string) => void; // Optional callback when the user applies the date
  placeholder?: string;
  label?: string;
  required?: boolean;
  className?: string; // Allow custom classNames
  buttonClassName?: string;
  dropdownClassName?: string;
  showApplyButton?: boolean; // Prop to control visibility of the Apply button
}

const SmartDaySelector: React.FC<SmartDaySelectorProps> = ({
  value,
  onChange,
  onChangeComplete,
  placeholder = 'Select a date',
  label,
  required = false,
  className = '',
  buttonClassName = '',
  dropdownClassName = '',
  showApplyButton = true, // Default is true to show Apply button
}) => {
  const [expanded, setExpanded] = useState(false); // Track if expanded or collapsed
  const [calendarValue, setCalendarValue] = useState<Date | null>(value || new Date()); // Track selected date
  const [originalValue, setOriginalValue] = useState<Date | null>(value); // Store the original value

  const containerRef = useRef<HTMLDivElement>(null);

  // Handle outside click to close the dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setExpanded(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // When the dropdown is expanded, store the original value
  const handleExpand = () => {
    setOriginalValue(calendarValue); // Save the current value as the original value
    setExpanded(true);
  };

  // When the calendar value changes
  const handleCalendarChange = (date: Date | null) => {
    setCalendarValue(date);
    onChange(date); // Update the parent with the selected date

    // Close the dropdown if showApplyButton is false
    if (!showApplyButton) {
      setExpanded(false);
    }
  };

  // When "Apply" button is clicked, trigger the onChangeComplete callback if provided
  const handleApply = () => {
    if (onChangeComplete) {
      onChangeComplete(calendarValue ? calendarValue.toDateString() : 'No date selected');
    }
    setExpanded(false); // Close the dropdown after applying
  };

  // When "Cancel" button is clicked, revert to the original value
  const handleCancel = () => {
    setCalendarValue(originalValue); // Revert to the original value
    onChange(originalValue); // Notify the parent of the reverted value
    setExpanded(false); // Close the dropdown
  };

  // Graceful handling for null value, default to today if null
  const displayedDate = value ? value.toDateString() : placeholder || 'No due date selected';

  return (
    <div className={`smart-day-selector ${className}`} ref={containerRef}>
      {/* Label */}
      {label && (
        <div className="text-12 text-ltxt mb-x2">
          {label} {required && <span className="text-red-500">*</span>}
        </div>
      )}

      {/* Button */}
      <button
        type="button"
        onClick={handleExpand}
        className={`smart-day-selector-button ${buttonClassName}`}
      >
        {displayedDate}
      </button>

      {/* Dropdown */}
      {expanded && (
        <div className={`smart-day-selector-dropdown ${dropdownClassName}`}>
          <Calendar
            onChange={(value) => {
              const selectedDate = Array.isArray(value) ? value[0] : value;
              handleCalendarChange(selectedDate || null);
            }}
            value={calendarValue}
          />

          {/* Conditionally render the Apply and Cancel buttons */}
          {showApplyButton && (
            <div className="smart-day-selector-actions">
              {/* Cancel Button */}
              <button
                onClick={handleCancel}
                className="smart-day-selector-button-cancel"
              >
                Cancel
              </button>

              {/* Apply Button */}
              <button
                onClick={handleApply}
                className="smart-day-selector-button-apply"
              >
                Apply
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SmartDaySelector;