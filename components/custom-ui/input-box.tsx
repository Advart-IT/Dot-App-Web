// Adding Show More / Show Less for Overflow Toggle
import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';

interface ValidationResult {
    message: string;
    type: 'success' | 'error' | 'warning';
}

interface SmartInputBoxProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    charLimit?: number;
    showCharLimit?: boolean;
    required?: boolean;
    className?: string;
    label?: string;
    rows?: number;
    readOnly?: boolean; // Add this to make the input/textarea read-only
    disabled?: boolean; // Add this to disable the input/textarea
    maxHeight?: number | string;
    autoExpand?: boolean;
    overflowBehavior?: 'scroll' | 'toggle';
    isTextarea?: boolean;
    inputClassName?: string;
    textareaClassName?: string;
    charLimitClassName?: string;
    showCancelButton?: boolean; // Determines if the cancel button should be shown
    onCancel?: () => void; // Callback for cancel action
    validate?: (value: string) => ValidationResult | null;
    onChangeComplete?: (value: string) => void;
    disableEvents?: {
        blur?: boolean; // Disable `handleBlur`
        keydown?: boolean; // Disable `handleKeyDown`
    };
}

const SmartInputBox = forwardRef<HTMLInputElement | HTMLTextAreaElement, SmartInputBoxProps>(
    (
        {
            value,
            onChange,
            placeholder = '',
            charLimit,
            required = false,
            className = '',
            showCharLimit = true,
            label,
            rows = 1,
            readOnly = false, // Add this to make the input/textarea read-only
            disabled = false, // Add this to disable the input/textarea
            maxHeight,
            autoExpand = false,
            overflowBehavior = 'scroll',
            isTextarea = rows > 1,
            inputClassName = '',
            textareaClassName = '',
            charLimitClassName = '',
            showCancelButton = false,
            onCancel,
            validate,
            onChangeComplete,
            disableEvents = {},
        },
        ref // Forwarded ref
    ) => {
        const textareaRef = useRef<HTMLTextAreaElement>(null);
        const inputRef = useRef<HTMLInputElement>(null);
        const committedValueRef = useRef(value);
        const [expanded, setExpanded] = useState(false);
        const [isOverflowing, setIsOverflowing] = useState(false);
        const ignoreBlurRef = useRef(false);

        const handleToggleExpand = () => setExpanded(!expanded);

        const baseTextareaClassName = "w-full p-2 pr-12 border rounded-md resize-none ";
        const baseinputClassName = "w-full p-2 border rounded-md ";
        const baseCharLimitClassName = "absolute text-[9.5px] bottom-[-0.5px] right-1 text-gray-400 bg-transparent px-1";

        const getMaxHeight = (maxHeight: number | string | undefined, rows: number, scrollHeight: number) => {
            // console.log('\n[getMaxHeight] Received Parameters:');
            // console.log('maxHeight:', maxHeight);
            // console.log('rows:', rows);
            // console.log('scrollHeight:', scrollHeight);

            // If maxHeight is explicitly set to "" or undefined, use scrollHeight
            if (maxHeight === undefined || maxHeight === "" || maxHeight === null) {
                //console.log('[getMaxHeight] maxHeight is undefined, empty, or null. Using scrollHeight:', scrollHeight);
                return scrollHeight; // Treat as true auto-expand
            }

            // Handle "rows" based maxHeight
            if (typeof maxHeight === 'string' && maxHeight.endsWith('rows')) {
                const rowCount = parseInt(maxHeight.replace('rows', '').trim(), 10);
                const calculatedHeight = rowCount * 1.5 * 16; // Assuming 16px font size and 1.5 line height
                //console.log(`[getMaxHeight] maxHeight is rows-based: ${rowCount} rows -> ${calculatedHeight}px`);
                return calculatedHeight;
            }

            // Use direct numeric maxHeight
            const numericHeight = Number(maxHeight);
            //console.log(`[getMaxHeight] maxHeight is direct numeric value: ${numericHeight}px`);
            return numericHeight;
        };

        useEffect(() => {
            if (!isTextarea) return; // Only run for textarea
            const element = textareaRef.current;

            if (element) {
                element.style.height = 'auto'; // Reset height to auto to calculate scrollHeight
                const scrollHeight = element.scrollHeight; // Get the scrollable height
                const calculatedMaxHeight = getMaxHeight(maxHeight, rows, scrollHeight); // Calculate the max height
                const minHeight = rows * 1.5 * 16; // Calculate minHeight based on rows (assuming 16px font size and 1.5 line height)

                // Add logs for debugging
                // console.log("scrollHeight:", scrollHeight);
                // console.log("calculatedMaxHeight:", calculatedMaxHeight);
                // console.log("minHeight:", minHeight);
                // console.log("overflowBehavior:", overflowBehavior);
                // console.log("isOverflowing:", scrollHeight > calculatedMaxHeight);

                // Handle height based on content length
                if (scrollHeight <= minHeight) {
                    // Case 1: Content is less than or equal to minHeight
                    element.style.height = `${minHeight}px`;
                    element.style.overflowY = 'hidden';
                    setIsOverflowing(false); // No overflow
                    // console.log("Height set to minHeight:", element.style.height);
                } else if (scrollHeight > minHeight && scrollHeight <= calculatedMaxHeight) {
                    // Case 2: Content is between minHeight and maxHeight
                    element.style.height = `${scrollHeight}px`;
                    element.style.overflowY = 'hidden';
                    setIsOverflowing(false); // No overflow
                    // console.log("Height set to scrollHeight:", element.style.height);
                } else {
                    // Case 3: Content exceeds maxHeight
                    element.style.height = expanded ? `${scrollHeight}px` : `${calculatedMaxHeight}px`;
                    element.style.overflowY =
                        overflowBehavior === 'toggle'
                            ? 'hidden'
                            : overflowBehavior === 'scroll'
                                ? 'scroll'
                                : expanded
                                    ? 'auto'
                                    : 'hidden'; // Explicitly handle "scroll" behavior
                    setIsOverflowing(scrollHeight > calculatedMaxHeight); // Check if content overflows
                    // console.log("Height set to maxHeight or expanded height:", element.style.height);
                }

            }
        }, [value, autoExpand, maxHeight, overflowBehavior, rows, isTextarea, expanded]);

        const handleBlur = () => {
            // console.log("🔄 handleBlur triggered");
        
            if (disableEvents?.blur) {
                // console.log("⚠️ handleBlur is disabled by parent.");
                return;
            }
        
            // Ignore the blur if cancel is about to be clicked
            if (ignoreBlurRef.current) {
                // console.log("⚠️ Blur ignored due to cancel action.");
                ignoreBlurRef.current = false; // Reset the flag
                return;
            }
        
            // Always trim whitespace (mandatory behavior)
            let processedValue = value.trim();
            
            // Update the input value if it was trimmed
            if (processedValue !== value) {
                onChange(processedValue);
            }
        
            // Trigger onChangeComplete if value actually changed after trimming
            if (processedValue !== committedValueRef.current) {
                // console.log("✅ Value has changed. Triggering onChangeComplete.");
                onChangeComplete?.(processedValue);
                committedValueRef.current = processedValue; // Update the committed value
            } else {
                // console.log("ℹ️ Value has not changed. Skipping onChangeComplete.");
            }
        };
        
        const handleKeyDown = (e: React.KeyboardEvent) => {
            if (disableEvents?.keydown) {
                return; // Exit if keydown events are disabled
            }
        
            // Prevent triggering on Shift + Enter
            if (e.key === 'Enter' && !e.shiftKey) {
                requestAnimationFrame(() => {
                    // Always trim whitespace on Enter (mandatory behavior)
                    let processedValue = value.trim();
                    
                    // Update the input value if it was trimmed
                    if (processedValue !== value) {
                        onChange(processedValue);
                    }
        
                    if (onChangeComplete && processedValue !== committedValueRef.current) {
                        onChangeComplete(processedValue);
                        committedValueRef.current = processedValue;
                    }
                });
            }
        };

        const handleChange = (
            e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
        ) => {
            const newValue = e.target.value;
            if (charLimit && newValue.length > charLimit) return; // Prevent exceeding charLimit
            onChange(newValue);
        };

        const handleCancel = () => {
            console.log("🚫 Cancel button clicked");
            ignoreBlurRef.current = true; // Mark to ignore blur
            onCancel?.(); // Trigger the onCancel callback if provided
        };


        // Allow parent to access the actual input or textarea ref
        useImperativeHandle(ref, () => (isTextarea ? textareaRef.current : inputRef.current) as HTMLInputElement | HTMLTextAreaElement);

        const handleWrapperClick = () => {
            if (readOnly) return; // Prevent focus if readOnly is true
            if (isTextarea && textareaRef.current) {
                textareaRef.current.focus();
            } else if (!isTextarea && inputRef.current) {
                inputRef.current.focus();
            }
        };



        return (
            <div className={`flex flex-col w-full ${className}`} onClick={() => {
                if (!readOnly) handleWrapperClick(); // Only call handleWrapperClick if readOnly is false
            }} >
                {label && (
                    <label className="text-12 text-ltxt mb-x2">
                        {label} {required && <span className="text-red-500">*</span>}
                    </label>
                )}
                <div className="w-full flex items-center space-x-2">
                    {/* This div will contain both input/textarea and cancel button */}
                    <div className="relative w-full flex items-center text-14">
                        {isTextarea ? (
                            <textarea
                                ref={textareaRef}
                                value={value}
                                onChange={handleChange}
                                placeholder={placeholder}
                                rows={rows}
                                readOnly={readOnly}
                                disabled={disabled}
                                onBlur={handleBlur}
                                onKeyDown={handleKeyDown}
                                onClick={() => {
                                    if (overflowBehavior === 'toggle' && !expanded) {
                                        setExpanded(true);
                                    }
                                }}
                                className={`${readOnly ? 'w-full p-2 pr-12 border rounded-md resize-none bg-gray-50 focus:ring-0 focus:outline-none' : textareaClassName || baseTextareaClassName}`}
                                style={{ flex: 1 }}
                            />
                        ) : (
                            <input
                                ref={inputRef}
                                value={value}
                                onChange={handleChange}
                                placeholder={placeholder}
                                readOnly={readOnly}
                                disabled={disabled}
                                onBlur={handleBlur}
                                onKeyDown={handleKeyDown}
                                className={`${readOnly ? 'w-full p-2 pr-12 border rounded-md resize-none bg-gray-50 focus:ring-0 focus:outline-none' : inputClassName || baseinputClassName}`}
                                style={{ flex: 1 }}
                            />
                        )}



                        {/* Character Limit Display */}
                        {charLimit && showCharLimit && (
                            <span className={charLimitClassName || baseCharLimitClassName}>
                                {value.length}/{charLimit}
                            </span>
                        )}
                    </div>

                    {/* Cancel Button */}
                    {showCancelButton && (
                        <button
                            onMouseDown={() => (ignoreBlurRef.current = true)} // Mark to ignore blur
                            onClick={handleCancel} // Handle the cancel action
                            className="relative p-2 text-red-500 hover:text-red-700 text-sm"
                        >
                            Cancel
                        </button>
                    )}
                </div>

                {/* Show "Show More" or "Show Less" Button for Toggle Behavior */}
                {overflowBehavior === 'toggle' && isOverflowing && isTextarea && (
                    <button
                        onClick={handleToggleExpand}
                        className="mx-auto flex justify-center items-center mt-1 text-zinc-700 text-xs font-semibold hover:bg-[#F9FAFB] px-8 py-2 rounded-md"
                    >
                        {expanded ? 'Show less' : 'Show more'}
                    </button>

                )}

                {/* Validation Message */}
                {validate && validate(value)?.message && (
                    <div
                        className={`text-xs mt-1 ${validate(value)?.type === 'error'
                            ? 'text-red-500'
                            : validate(value)?.type === 'success'
                                ? 'text-green-500'
                                : 'text-yellow-500'
                            }`}
                    >
                        {validate(value)?.message}
                    </div>
                )}
            </div>
        );
    }
)

export default SmartInputBox;
