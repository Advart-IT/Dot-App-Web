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
    enableLink?: boolean; // New prop to enable link functionality
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
            enableLink = false, // Default to false
        },
        ref // Forwarded ref
    ) => {
        const textareaRef = useRef<HTMLTextAreaElement>(null);
        const inputRef = useRef<HTMLInputElement>(null);
        const overlayRef = useRef<HTMLDivElement>(null); // Ref for overlay to sync scroll
        const committedValueRef = useRef(value);
        const [expanded, setExpanded] = useState(false);
        const [isOverflowing, setIsOverflowing] = useState(false);
        const [overlayHeight, setOverlayHeight] = useState<string>('auto'); // Track overlay height
        const ignoreBlurRef = useRef(false);
        const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
        const linkPositionsRef = useRef<{ start: number; end: number; url: string }[]>([]);

        const handleToggleExpand = () => setExpanded(!expanded);

        const baseTextareaClassName = "w-full p-2 pr-12 border rounded-md resize-none ";
        const baseinputClassName = "w-full p-2 border rounded-md ";
        const baseCharLimitClassName = "absolute text-[9.5px] bottom-[-0.5px] right-1 text-gray-400 bg-transparent px-1";

        // Function to render text with highlighted links
        const renderTextWithLinks = (text: string) => {
            if (!enableLink || !text) return text;
            
            const links = findUrlPositions(text);
            if (links.length === 0) return text;

            const parts = [];
            let lastIndex = 0;

            links.forEach((link, index) => {
                // Add text before the link
                if (link.start > lastIndex) {
                    parts.push(
                        <span key={`text-${index}`} className="text-gray-900">
                            {text.substring(lastIndex, link.start)}
                        </span>
                    );
                }
                
                // Add the link with blue color
                parts.push(
                    <span 
                        key={`link-${index}`} 
                        className="text-blue-600 underline cursor-pointer"
                        onClick={(e) => handleLinkClick(e, link.url)}
                    >
                        {link.url}
                    </span>
                );
                
                lastIndex = link.end;
            });

            // Add remaining text after the last link
            if (lastIndex < text.length) {
                parts.push(
                    <span key="text-end" className="text-gray-900">
                        {text.substring(lastIndex)}
                    </span>
                );
            }

            return parts;
        };

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
                    setOverlayHeight(`${minHeight}px`); // Update overlay height
                    // console.log("Height set to minHeight:", element.style.height);
                } else if (scrollHeight > minHeight && scrollHeight <= calculatedMaxHeight) {
                    // Case 2: Content is between minHeight and maxHeight
                    element.style.height = `${scrollHeight}px`;
                    element.style.overflowY = 'hidden';
                    setIsOverflowing(false); // No overflow
                    setOverlayHeight(`${scrollHeight}px`); // Update overlay height
                    // console.log("Height set to scrollHeight:", element.style.height);
                } else {
                    // Case 3: Content exceeds maxHeight
                    const currentHeight = expanded ? `${scrollHeight}px` : `${calculatedMaxHeight}px`;
                    element.style.height = currentHeight;
                    element.style.overflowY =
                        overflowBehavior === 'toggle'
                            ? 'hidden'
                            : overflowBehavior === 'scroll'
                                ? 'scroll'
                                : expanded
                                    ? 'auto'
                                    : 'hidden'; // Explicitly handle "scroll" behavior
                    setIsOverflowing(scrollHeight > calculatedMaxHeight); // Check if content overflows
                    setOverlayHeight(currentHeight); // Update overlay height dynamically
                    // console.log("Height set to maxHeight or expanded height:", element.style.height);
                }

            }
        }, [value, autoExpand, maxHeight, overflowBehavior, rows, isTextarea, expanded]);

        // Function to detect URLs in text and return positions
        const findUrlPositions = (text: string) => {
            if (!enableLink) return [];
            
            // Regex to match URLs starting with http/https/www and ending with domains
            const urlRegex = /(?:https?:\/\/|www\.)[-a-zA-Z0-9@:%._\+~#=]{1,256}\.(?:com|org|net|in|co\.in)\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi;
            
            const positions: { start: number; end: number; url: string }[] = [];
            let match;

            while ((match = urlRegex.exec(text)) !== null) {
                positions.push({
                    start: match.index,
                    end: match.index + match[0].length,
                    url: match[0]
                });
            }

            return positions;
        };

        useEffect(() => {
            if (enableLink) {
                linkPositionsRef.current = findUrlPositions(value);
            }
        }, [value, enableLink]);

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

        const handleLinkClick = (e: React.MouseEvent, url: string) => {
            e.stopPropagation(); // Prevent event bubbling
            if (enableLink && url) {
                // Check if the value is a valid URL
                try {
                    const validUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
                    window.open(validUrl.href, '_blank', 'noopener,noreferrer');
                } catch (err) {
                    console.warn('Invalid URL provided:', url);
                }
            }
        };

        const handleSingleClick = (e: React.MouseEvent) => {
            // If it's a link and we want to allow editing, we'll need to handle the click differently
            if (enableLink) {
                // If the input is disabled or readOnly, open the link on single click
                if (disabled || readOnly) {
                    // Find the link at the cursor position
                    const target = e.target as HTMLInputElement | HTMLTextAreaElement;
                    if (target.selectionStart !== undefined && target.selectionStart !== null) {
                        const cursorPos = target.selectionStart;
                        
                        for (const link of linkPositionsRef.current) {
                            if (cursorPos >= link.start && cursorPos <= link.end) {
                                handleLinkClick(e, link.url);
                                return;
                            }
                        }
                    }
                } else {
                    // Set a timeout to see if a second click comes in
                    if (clickTimeoutRef.current) {
                        // Double click detected - clear the timeout and open link
                        clearTimeout(clickTimeoutRef.current);
                        clickTimeoutRef.current = null;
                        e.preventDefault(); // Prevent default behavior for double click
                    } else {
                        // First click - set timeout to detect if it's a single click
                        clickTimeoutRef.current = setTimeout(() => {
                            clickTimeoutRef.current = null;
                            // For single click, do nothing special - input remains editable
                        }, 300); // 300ms is typical for double-click detection
                    }
                }
            }
        };

        const handleDoubleClick = (e: React.MouseEvent) => {
            if (enableLink) { // Handle double click for both editable and read-only modes
                e.preventDefault(); // Prevent default double-click behavior
                
                // Get the cursor position relative to the input
                const target = e.target as HTMLInputElement | HTMLTextAreaElement;
                if (target.selectionStart !== undefined && target.selectionStart !== null) {
                    const cursorPos = target.selectionStart;
                    
                    // Find which link the cursor is over
                    for (const link of linkPositionsRef.current) {
                        if (cursorPos >= link.start && cursorPos <= link.end) {
                            handleLinkClick(e, link.url);
                            return;
                        }
                    }
                }
            }
        };

        // Sync scroll position between textarea and overlay
        const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
            if (overlayRef.current && textareaRef.current) {
                overlayRef.current.scrollTop = textareaRef.current.scrollTop;
            }
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

        // Conditionally apply link styles if enableLink is true
        const getLinkTextareaClassName = () => {
            if (enableLink && readOnly && !disabled) {
                return `${textareaClassName || baseTextareaClassName} opacity-0`;
            }
            return readOnly ? 'w-full p-2 pr-12 border rounded-md resize-none bg-gray-50 focus:ring-0 focus:outline-none' : textareaClassName || baseTextareaClassName;
        };

        const getLinkInputClassName = () => {
            if (enableLink && readOnly && !disabled) {
                return `${inputClassName || baseinputClassName} opacity-0`;
            }
            return readOnly ? 'w-full p-2 border rounded-md bg-gray-50 focus:ring-0 focus:outline-none' : inputClassName || baseinputClassName;
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
                            <>
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
                                    onScroll={handleScroll}
                                    onClick={(e) => {
                                        if (enableLink) {
                                            handleSingleClick(e);
                                        } else if (overflowBehavior === 'toggle' && !expanded) {
                                            setExpanded(true);
                                        }
                                    }}
                                    onDoubleClick={handleDoubleClick}
                                    className={`${getLinkTextareaClassName()} ${disabled || readOnly ? 'cursor-pointer' : ''}`}
                                    style={{ flex: 1 }}
                                />
                                {/* Overlay for styled text with links - Only show when readOnly and NOT disabled */}
                                {enableLink && value && readOnly && !disabled && (
                                    <div 
                                        ref={overlayRef}
                                        className="absolute top-0 left-0 w-full p-2 pr-12 whitespace-pre-wrap break-words z-10 pointer-events-auto"
                                        style={{
                                            lineHeight: '1.5',
                                            fontFamily: 'inherit',
                                            fontSize: 'inherit',
                                            height: overlayHeight,
                                            overflowY: overflowBehavior === 'scroll' ? 'scroll' : 'hidden',
                                            maxHeight: overlayHeight,
                                            backgroundColor: 'rgb(249, 250, 251)',
                                            border: '1px solid rgb(209, 213, 219)',
                                            borderRadius: '6px',
                                        }}
                                    >
                                        {renderTextWithLinks(value)}
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                <input
                                    ref={inputRef}
                                    value={value}
                                    onChange={handleChange}
                                    placeholder={placeholder}
                                    readOnly={readOnly}
                                    disabled={disabled}
                                    onBlur={handleBlur}
                                    onKeyDown={handleKeyDown}
                                    onClick={(e) => {
                                        if (enableLink) {
                                            handleSingleClick(e);
                                        }
                                    }}
                                    onDoubleClick={handleDoubleClick}
                                    className={`${getLinkInputClassName()} ${disabled || readOnly ? 'cursor-pointer' : ''}`}
                                    style={{ flex: 1 }}
                                />
                                {/* Overlay for styled text with links - Only show when readOnly and NOT disabled */}
                                {enableLink && value && readOnly && !disabled && (
                                    <div 
                                        className="absolute top-0 left-0 w-full p-2 whitespace-nowrap overflow-hidden text-ellipsis z-10 pointer-events-auto"
                                        style={{
                                            lineHeight: '1.5',
                                            fontFamily: 'inherit',
                                            fontSize: 'inherit',
                                            backgroundColor: 'rgb(249, 250, 251)',
                                            border: '1px solid rgb(209, 213, 219)',
                                            borderRadius: '6px',
                                        }}
                                    >
                                        {renderTextWithLinks(value)}
                                    </div>
                                )}
                            </>
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