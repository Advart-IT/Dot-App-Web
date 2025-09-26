"use client";

import React, { useState, useEffect, useRef, use } from "react";
import Calendar from "./calendar";
import { useUser } from '@/hooks/usercontext';
import { fetchContent } from '@/lib/content/contentapi';
import SmartDropdown from "@/components/custom-ui/dropdown2";
import ContentView from "../socialmedia/contentview";
import { upsertContent } from '@/lib/content/contentapi';


// Define the flexible RowData interface
interface RowData {
    [key: string]: string | number | boolean | null | { value: string; updated_by_name: string; updated_at: string }[];
}

interface ContentData {
    [dateKey: string]: RowData[];
}

interface ContentCalendarProps {
    brandName: string;
}

const ContentCalendar: React.FC<ContentCalendarProps> = ({ brandName }) => {
    const [contentData, setContentData] = useState<ContentData>({});
    const [draggedItem, setDraggedItem] = useState<RowData | null>(null);
    const [draggedFromDate, setDraggedFromDate] = useState<string | null>(null);
    const [hoveredItem, setHoveredItem] = useState<{ type: 'task' | 'content', item: RowData, element: HTMLElement } | null>(null);
    const [isTooltipVisible, setIsTooltipVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentMonth, setCurrentMonth] = useState<number>(() => new Date().getMonth());
    const [currentYear, setCurrentYear] = useState<number>(() => new Date().getFullYear());
    const [dragOverInvalidZone, setDragOverInvalidZone] = useState(false);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [showTaskDetails, setShowTaskDetails] = useState<boolean>(false);
    const { user } = useUser();
    const lastLoadedMonthYear = useRef<string>('');
    // Add a ref to track the last loaded brand
    const lastLoadedBrand = useRef<string>('');

    // Add this near your other state declarations
    const [isCreatingContent, setIsCreatingContent] = useState(false);
    const [selectedCreateDate, setSelectedCreateDate] = useState<string | null>(null);
    // Add state for format filter
    const [selectedFormats, setSelectedFormats] = useState<string[]>([]);
    const [selectedRow, setSelectedRow] = useState<RowData | null>(null);
    // Add this state near your other state declarations
    const [showSummary, setShowSummary] = useState<boolean>(false);

    // Get unique content statuses from data
    const [contentStatusOptions, setContentStatusOptions] = useState<Array<{ value: string, label: string }>>([]);
    const [selectedContentStatuses, setSelectedContentStatuses] = useState<string[]>([]);

    // Get unique task statuses from data
    const [taskStatusOptions, setTaskStatusOptions] = useState<Array<{ value: string, label: string }>>([]);
    const [selectedTaskStatuses, setSelectedTaskStatuses] = useState<string[]>([]);



    useEffect(() => {
        console.log("ContentCalendar mounted, brandName:", brandName);
    }, [brandName]);

    // Replace the static formatOptions with dynamic options from user data
    const formatOptions = React.useMemo(() => {
        if (!user?.permissions?.brands || !brandName) {
            return []; // Return empty array if no user data or brandName
        }

        // Get format types for the current brand
        const brandData = user.permissions.brands[brandName];
        if (!brandData) {
            return []; // Return empty array if brand doesn't exist
        }

        // Extract format types from the brand data and check permissions
        const formatTypes = Object.keys(brandData);

        // Filter format types based on user permissions
        const accessibleFormats = formatTypes.filter(formatType => {
            const permissions = brandData[formatType];
            // Check if user has any permission (reviewer, creator, or viewer)
            return permissions && permissions.length > 0;
        });

        // Convert to dropdown options only for accessible formats
        return accessibleFormats.map(formatType => ({
            value: formatType,
            label: formatType
        }));
    }, [user?.permissions?.brands, brandName]);



    // Simplified loadContentData - work directly with API response
    const loadContentData = async (month: number, year: number) => {
        if (!brandName) return;

        // Create a unique key that includes brand name
        const cacheKey = `${brandName}-${month}-${year}`;

        // Reset cache if brand changed
        if (lastLoadedBrand.current !== brandName) {
            console.log(`🔄 Brand changed from ${lastLoadedBrand.current} to ${brandName}, resetting cache`);
            lastLoadedMonthYear.current = '';
            lastLoadedBrand.current = brandName;
        }

        // Check if we've already loaded this month/year for this brand
        if (lastLoadedMonthYear.current === cacheKey) {
            console.log(`⏭️ Skipping duplicate API call for ${brandName} ${month + 1}/${year}`);
            return;
        }

        // Update the ref to track this load
        lastLoadedMonthYear.current = cacheKey;

        setIsLoading(true);
        setError(null);

        try {
            const apiContentData: ContentData = {};
            let offset = 0;
            const limit = 50;
            let hasMore = true;

            // Format month as MM-YYYY
            const monthYear = `${String(month + 1).padStart(2, '0')}-${year}`;

            while (hasMore) {
                const response = await fetchContent({
                    brand_name: brandName,
                    offset,
                    limit,
                    live_month_year: monthYear
                });

                if (response && response.data && Array.isArray(response.data)) {
                    console.log(`📡 Processing ${response.data.length} items from API for brand: ${brandName}`);

                    // Process the current batch of data - no transformation needed
                    response.data.forEach((item: RowData) => {
                        // Check brand name matching
                        const brandMatches = (item.brand_name as string)?.toLowerCase() === brandName.toLowerCase();
                        const hasLiveDate = !!item.live_date;

                        if (brandMatches && hasLiveDate) {
                            const date = new Date(item.live_date as string);
                            const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

                            if (!apiContentData[dateKey]) {
                                apiContentData[dateKey] = [];
                            }

                            // Store the API item directly - no transformation at all
                            apiContentData[dateKey].push(item);
                        }
                    });

                    // Check if we need to fetch more data
                    if (response.pagination && response.pagination.has_more) {
                        offset += limit;
                        hasMore = true;
                    } else {
                        hasMore = false;
                    }
                } else {
                    console.error('❌ API Response failed or no data');
                    setError('Failed to load content data');
                    hasMore = false;
                }
            }

            setContentData(apiContentData);
            console.log(`✅ Loaded ${Object.keys(apiContentData).length} dates with content for brand: ${brandName}`);
        } catch (error) {
            console.error('💥 Error fetching content:', error);
            setError('Error loading content data');

            // Reset the ref on error so it can be retried
            lastLoadedMonthYear.current = '';
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // Load content when currentMonth, currentYear, or brandName changes
        if (brandName) {
            console.log(`🔄 Month/Year changed to ${currentMonth + 1}/${currentYear}`);
            console.log(`🚀 Loading content for ${currentMonth + 1}/${currentYear}...`);
            loadContentData(currentMonth, currentYear);
        }
    }, [currentMonth, currentYear, brandName]);

    const handleMonthChange = (month: number, year: number) => {
        // Only update state if month or year actually changed
        if (currentMonth !== month || currentYear !== year) {
            console.log(`🔄 Month changed via callback: ${month + 1}/${year}`);
            setCurrentMonth(month);
            setCurrentYear(year);
        }
    };


    // Helper function to safely get field values
    const getFieldValue = (item: RowData, field: string): string => {
        const value = item[field];
        if (typeof value === 'string') return value;
        if (typeof value === 'number') return value.toString();
        if (typeof value === 'boolean') return value.toString();
        return '';
    };

    // Add function to get format type colors
    const getFormatTypeColor = (formatType: string) => {
        const colors = {
            'Story': {
                bg: 'bg-purple-50',
                border: 'border-purple-200',
                text: 'text-purple-600'
            },
            'Post': {
                bg: 'bg-blue-50',
                border: 'border-blue-200',
                text: 'text-blue-600'
            },
            'Reels': {
                bg: 'bg-green-50',
                border: 'border-green-200',
                text: 'text-green-600'
            }
        };

        return colors[formatType as keyof typeof colors] || {
            bg: 'bg-gray-50',
            border: 'border-gray-200',
            text: 'text-gray-600'
        };
    };




    // Extract available status options from content data
    useEffect(() => {
        // Extract content statuses
        const contentStatuses = new Set<string>();
        // Extract task statuses
        const taskStatuses = new Set<string>();

        Object.keys(contentData).forEach(dateKey => {
            const [year, month, _] = dateKey.split('-').map(Number);

            // Only process items from current month/year
            if (month === currentMonth && year === currentYear) {
                contentData[dateKey].forEach(item => {
                    const status = getFieldValue(item, 'status');
                    if (status) {
                        contentStatuses.add(status);
                    }

                    const taskStatus = getFieldValue(item, 'task_status');
                    if (taskStatus) {
                        taskStatuses.add(taskStatus);
                    }
                });
            }
        });

        // Convert to dropdown options
        const contentStatusOpts = Array.from(contentStatuses).map(status => ({
            value: status,
            label: status
        }));

        const taskStatusOpts = Array.from(taskStatuses).map(status => ({
            value: status,
            label: status
        }));

        setContentStatusOptions(contentStatusOpts);
        setTaskStatusOptions(taskStatusOpts);

        // Set all options as selected by default
        setSelectedContentStatuses(Array.from(contentStatuses));
        setSelectedTaskStatuses(Array.from(taskStatuses));
    }, [contentData, currentMonth, currentYear]);


    const getContentForDay = (day: number, month: number, year: number) => {
        const dateKey = `${year}-${month}-${day}`;
        return contentData[dateKey] || [];
    };



    // Update the getFilteredContentForDay function to handle empty filter selections correctly
    const getFilteredContentForDay = (day: number, month: number, year: number) => {
        const dayContent = getContentForDay(day, month, year);

        // First filter by user permissions - only show content for formats user has access to
        const accessibleContent = dayContent.filter(item => {
            const formatType = getFieldValue(item, 'format_type');

            // Check if user has access to this format type
            if (!user?.permissions?.brands || !brandName) return false;

            const brandData = user.permissions.brands[brandName];
            if (!brandData || !brandData[formatType]) return false;

            // Check if user has any permission for this format type
            const permissions = brandData[formatType];
            return permissions && permissions.length > 0;
        });

        // Apply all filters in order:
        return accessibleContent.filter(item => {
            // 1. Format Type filter
            const formatType = getFieldValue(item, 'format_type');
            // If no formats selected, show nothing
            if (selectedFormats.length === 0) return false;
            // Otherwise check if this format is selected
            if (!selectedFormats.includes(formatType)) return false;

            // 2. Content Status filter
            const contentStatus = getFieldValue(item, 'status');
            // If no content statuses are selected, show nothing
            if (selectedContentStatuses.length === 0) return false;
            // Otherwise check if this status is selected
            if (!selectedContentStatuses.includes(contentStatus)) return false;

            // 3. Task Status filter - only apply to items that have a task status
            const taskStatus = getFieldValue(item, 'task_status');
            if (taskStatus) {
                // If the item has a task status and no task statuses are selected, show nothing
                if (selectedTaskStatuses.length === 0) return false;
                // Otherwise check if this task status is selected
                if (!selectedTaskStatuses.includes(taskStatus)) return false;
            }

            // If it passes all filters, show the item
            return true;
        });
    };


    // Handle content name click to open modal
    const handleContentClick = (e: React.MouseEvent, item: RowData) => {
        e.stopPropagation();
        e.preventDefault();
        setSelectedRow(item);
        console.log("Content clicked, opening modal with data:", item);
    };

    // Handle modal close
    const handleCloseModal = () => {
        console.log("Closing modal");
        setSelectedRow(null);
    };

    // Handle modal update
    const handleUpdateRow = (updatedData: RowData) => {
        console.log("Updating row with data:", updatedData);

        // Check if this is a new content creation (no existing selectedRow)
        if (!selectedRow && selectedCreateDate) {
            console.log("Creating new content for date:", selectedCreateDate);

            // Check if the live_date falls within current month
            const liveDate = new Date(updatedData.live_date as string);
            const isInCurrentMonth = liveDate.getMonth() === currentMonth && liveDate.getFullYear() === currentYear;

            if (isInCurrentMonth) {
                const dateKey = `${liveDate.getFullYear()}-${liveDate.getMonth()}-${liveDate.getDate()}`;

                setContentData(prev => {
                    const newData = { ...prev };

                    if (!newData[dateKey]) {
                        newData[dateKey] = [];
                    }

                    // Check if this item already exists to prevent duplicates
                    const existingItem = newData[dateKey].find(item =>
                        item.id === updatedData.id ||
                        (item.content_name === updatedData.content_name && item.brand_name === updatedData.brand_name)
                    );

                    if (!existingItem) {
                        newData[dateKey].push(updatedData);
                        console.log(`✅ Added new content to ${dateKey}`);
                    } else {
                        console.log(`ℹ️ Content already exists in ${dateKey}, skipping duplicate`);
                    }

                    return newData;
                });
            } else {
                console.log(`ℹ️ New content created for ${updatedData.live_date} which is outside current month`);
            }

            // Clear creation state
            setIsCreatingContent(false);
            setSelectedCreateDate(null);

            // Important: Return early to prevent further processing
            return;
        }

        // Rest of your existing logic for updates, deletes, etc.
        // Check if the item was deleted
        if (updatedData.is_delete === true) {
            console.log(`Row with ID ${updatedData.id} removed as it was deleted`);

            setContentData(prev => {
                const newData = { ...prev };

                Object.keys(newData).forEach(dateKey => {
                    newData[dateKey] = newData[dateKey].filter(item => item.id !== updatedData.id);
                    if (newData[dateKey].length === 0) {
                        delete newData[dateKey];
                    }
                });

                return newData;
            });

            setSelectedRow(null);
            return;
        }

        // Check if live_date changed - need to move item to new date
        if (updatedData.live_date && selectedRow?.live_date !== updatedData.live_date) {
            console.log(`Moving item ${updatedData.id} from ${selectedRow?.live_date} to ${updatedData.live_date}`);

            const oldDate = new Date(selectedRow?.live_date as string);
            const oldDateKey = `${oldDate.getFullYear()}-${oldDate.getMonth()}-${oldDate.getDate()}`;

            const newDate = new Date(updatedData.live_date as string);
            const newDateKey = `${newDate.getFullYear()}-${newDate.getMonth()}-${newDate.getDate()}`;

            const isNewDateInCurrentMonth = newDate.getMonth() === currentMonth && newDate.getFullYear() === currentYear;

            console.log(`New date ${updatedData.live_date} is in current month (${currentMonth + 1}/${currentYear}):`, isNewDateInCurrentMonth);

            setContentData(prev => {
                const newData = { ...prev };

                // Remove from old date
                if (newData[oldDateKey]) {
                    newData[oldDateKey] = newData[oldDateKey].filter(item => item.id !== updatedData.id);
                    if (newData[oldDateKey].length === 0) {
                        delete newData[oldDateKey];
                    }
                }

                // Add to new date ONLY if it's within the current month being displayed
                if (isNewDateInCurrentMonth) {
                    if (!newData[newDateKey]) {
                        newData[newDateKey] = [];
                    }

                    const completeUpdatedItem = {
                        ...selectedRow,
                        ...updatedData
                    };

                    // Check if item already exists in the new date
                    const existingIndex = newData[newDateKey].findIndex(item => item.id === updatedData.id);
                    if (existingIndex !== -1) {
                        newData[newDateKey][existingIndex] = completeUpdatedItem;
                    } else {
                        newData[newDateKey].push(completeUpdatedItem);
                    }

                    console.log(`✅ Added item ${updatedData.id} to new date ${newDateKey} in current month`);
                } else {
                    console.log(`ℹ️ Item ${updatedData.id} moved to ${updatedData.live_date} which is outside current month - not adding to calendar`);
                }

                return newData;
            });
        } else {
            // Update item in place (same date)
            setContentData(prev => {
                const newData = { ...prev };

                Object.keys(newData).forEach(dateKey => {
                    const itemIndex = newData[dateKey].findIndex(item => item.id === updatedData.id);
                    if (itemIndex !== -1) {
                        newData[dateKey][itemIndex] = {
                            ...newData[dateKey][itemIndex],
                            ...updatedData
                        };
                    }
                });

                return newData;
            });
        }

        // Update the selected row for the modal
        setSelectedRow(prev => prev ? { ...prev, ...updatedData } : null);

        console.log(`✅ Updated item ${updatedData.id} in calendar`);
    };



    // Enhanced drop handler with API call
    const handleDrop = async (e: React.DragEvent, toDay: number, toMonth: number, toYear: number) => {
        e.preventDefault();
        setDragOverInvalidZone(false);

        if (!draggedItem || !draggedFromDate) return;

        // Check if dropping on the same month we have data for
        const isDroppingSameMonth = toMonth === currentMonth && toYear === currentYear;

        if (!isDroppingSameMonth) {
            alert(`⚠️ Cannot move content to ${toMonth + 1}/${toYear}. You can only move content within the current month (${currentMonth + 1}/${currentYear}).`);
            setDraggedItem(null);
            setDraggedFromDate(null);
            return;
        }

        const toDateKey = `${toYear}-${toMonth}-${toDay}`;

        // Don't do anything if dropped on the same date
        if (draggedFromDate === toDateKey) {
            setDraggedItem(null);
            setDraggedFromDate(null);
            return;
        }

        // Create new live_date in YYYY-MM-DD format
        const newLiveDate = `${toYear}-${String(toMonth + 1).padStart(2, '0')}-${String(toDay).padStart(2, '0')}`;

        // Optimistically update the UI first
        setContentData(prev => {
            const newData = { ...prev };

            // Remove from original date
            if (newData[draggedFromDate]) {
                newData[draggedFromDate] = newData[draggedFromDate].filter(item => item.id !== draggedItem.id);
                if (newData[draggedFromDate].length === 0) {
                    delete newData[draggedFromDate];
                }
            }

            // Add to new date with updated live_date
            const updatedItem = { ...draggedItem, live_date: newLiveDate };

            if (newData[toDateKey]) {
                const existingItem = newData[toDateKey].find(item => item.id === draggedItem.id);
                if (existingItem) {
                    newData[toDateKey] = newData[toDateKey].map(item =>
                        item.id === draggedItem.id ? updatedItem : item
                    );
                } else {
                    newData[toDateKey].push(updatedItem);
                }
            } else {
                newData[toDateKey] = [updatedItem];
            }

            return newData;
        });

        // Clear drag state
        setDraggedItem(null);
        setDraggedFromDate(null);

        // Make API call to update live_date in the backend
        try {
            console.log(`🔄 Updating live_date for item ${draggedItem.id} to ${newLiveDate}`);

            // Ensure id is a number for UpsertContentParams
            const parsedId = typeof draggedItem.id === "number"
                ? draggedItem.id
                : typeof draggedItem.id === "string" && !isNaN(Number(draggedItem.id))
                    ? Number(draggedItem.id)
                    : undefined;

            const updateData = {
                id: parsedId,
                live_date: newLiveDate
            };

            const response = await upsertContent(updateData);

            console.log(`✅ Successfully updated live_date for item ${draggedItem.id}:`, response);

            // Optionally update the UI with the response data
            setContentData(prev => {
                const newData = { ...prev };

                // Find and update the item with the API response
                Object.keys(newData).forEach(dateKey => {
                    const itemIndex = newData[dateKey].findIndex(item => item.id === draggedItem.id);
                    if (itemIndex !== -1) {
                        newData[dateKey][itemIndex] = {
                            ...newData[dateKey][itemIndex],
                            ...response
                        };
                    }
                });

                return newData;
            });

        } catch (error) {
            console.error(`❌ Error updating live_date for item ${draggedItem.id}:`, error);

            // Revert the UI changes on error
            setContentData(prev => {
                const newData = { ...prev };

                // Move the item back to its original date
                if (newData[toDateKey]) {
                    newData[toDateKey] = newData[toDateKey].filter(item => item.id !== draggedItem.id);
                    if (newData[toDateKey].length === 0) {
                        delete newData[toDateKey];
                    }
                }

                // Add back to original date
                if (newData[draggedFromDate]) {
                    newData[draggedFromDate].push(draggedItem);
                } else {
                    newData[draggedFromDate] = [draggedItem];
                }

                return newData;
            });

            // Show error message to user
            alert(`Failed to update the live date. Please try again.`);
        }
    };

    // Rest of the drag handlers
    const handleDropInvalid = (e: React.DragEvent, toDay: number, toMonth: number, toYear: number) => {
        e.preventDefault();
        setDragOverInvalidZone(false);

        if (!draggedItem) return;

        alert(`⚠️ Cannot move content to ${toMonth + 1}/${toYear}. You can only move content within the current month (${currentMonth + 1}/${currentYear}).`);
        setDraggedItem(null);
        setDraggedFromDate(null);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverInvalidZone(false);
    };

    const handleDragOverInvalid = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'none';
        setDragOverInvalidZone(true);
    };

    const handleDragStart = (e: React.DragEvent, item: RowData, fromDateKey: string) => {
        setDraggedItem(item);
        setDraggedFromDate(fromDateKey);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', '');
        setIsTooltipVisible(false);
        setHoveredItem(null);
    };

    const handleDragEnd = (e: React.DragEvent) => {
        setDraggedItem(null);
        setDraggedFromDate(null);
        setDragOverInvalidZone(false);
    };

    // Calculate tooltip position
    const calculateTooltipPosition = (element: HTMLElement) => {
        const rect = element.getBoundingClientRect();
        const tooltipWidth = 320;
        const tooltipHeight = 200;
        const padding = 10;

        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let left = rect.right + padding;
        let top = rect.top;

        if (left + tooltipWidth > viewportWidth - padding) {
            left = rect.left - tooltipWidth - padding;
        }

        left = Math.max(padding, Math.min(left, viewportWidth - tooltipWidth - padding));

        if (top + tooltipHeight > viewportHeight - padding) {
            top = rect.bottom - tooltipHeight;
        }

        top = Math.max(padding, Math.min(top, viewportHeight - tooltipHeight - padding));

        return { left, top };
    };

    // Handle mouse enter with delay
    const handleMouseEnter = (e: React.MouseEvent, type: 'task' | 'content', item: RowData) => {
        if (draggedItem) return;

        const element = e.currentTarget as HTMLElement;

        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
        }

        hoverTimeoutRef.current = setTimeout(() => {
            setHoveredItem({ type, item, element });
            setIsTooltipVisible(true);
        }, 500);
    };

    const handleMouseLeave = () => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
        }

        setTimeout(() => {
            setIsTooltipVisible(false);
            setHoveredItem(null);
        }, 100);
    };

    // Handle task click
    const handleTaskClick = (e: React.MouseEvent, taskId: string | number) => {
        e.stopPropagation();
        e.preventDefault();
        window.open(`/tasks/${taskId}`, '_blank');
    };

    // Update the renderTooltip function to check for task_id presence
    const renderTooltip = () => {
        if (!hoveredItem || !isTooltipVisible || !showTaskDetails) return null;

        const { type, item, element } = hoveredItem;
        const hasTaskId = !!item.task_id;

        // Only show tooltip if task_id is present
        if (!hasTaskId) return null;

        const position = calculateTooltipPosition(element);

        return (
            <div
                ref={tooltipRef}
                className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-xl p-4 max-w-sm animate-in fade-in-0 zoom-in-95 duration-150"
                style={{
                    left: position.left,
                    top: position.top,
                    minWidth: '280px'
                }}
            >
                {type === 'task' && (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 border-b pb-2">
                            <div className={`w-3 h-3 rounded-full ${getFormatTypeColor(getFieldValue(item, 'format_type')).bg}`}></div>
                            <h3 className="font-medium text-gray-900">{getFieldValue(item, 'format_type')}</h3>
                        </div>

                        <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Task:</span>
                                <span className="font-medium text-gray-900">{getFieldValue(item, 'task_name')}</span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-gray-600">Status:</span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getFieldValue(item, 'task_status') === 'Completed' ? 'bg-green-100 text-green-800' :
                                    getFieldValue(item, 'task_status') === 'In_Review' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-blue-100 text-blue-800'
                                    }`}>
                                    {getFieldValue(item, 'task_status')}
                                </span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-gray-600">Assigned to:</span>
                                <span className="font-medium text-gray-900">{getFieldValue(item, 'assigned_to_name')}</span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-gray-600">Due:</span>
                                <span className="font-medium text-gray-900">{getFieldValue(item, 'due_date')}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // Add effect to set all accessible formats as selected when formatOptions change
    useEffect(() => {
        // When formatOptions change, set all available formats as selected
        const allFormatValues = formatOptions.map(option => option.value);
        setSelectedFormats(allFormatValues);
    }, [formatOptions]);


    // Add a function to count content by format type for the current month
    const getFormatTypeCounts = () => {
        const counts: Record<string, number> = {};

        // Iterate through all dates in the current month
        Object.keys(contentData).forEach(dateKey => {
            const [year, month, _] = dateKey.split('-').map(Number);

            // Only count items from the current month/year
            if (month === currentMonth && year === currentYear) {
                // Apply ALL filters consistently - just like in getFilteredContentForDay
                const filteredContent = contentData[dateKey].filter(item => {
                    // First check user permissions - only show content for formats user has access to
                    const formatType = getFieldValue(item, 'format_type');

                    // Check if user has access to this format type
                    if (!user?.permissions?.brands || !brandName) return false;
                    const brandData = user.permissions.brands[brandName];
                    if (!brandData || !brandData[formatType]) return false;
                    const permissions = brandData[formatType];
                    if (!permissions || permissions.length === 0) return false;

                    // 1. Format Type filter
                    // We're counting by format, so we DON'T filter by format here
                    // Otherwise we'd only count items of selected formats

                    // 2. Content Status filter
                    const contentStatus = getFieldValue(item, 'status');
                    if (selectedContentStatuses.length === 0) return false;
                    if (!selectedContentStatuses.includes(contentStatus)) return false;

                    // 3. Task Status filter - only apply to items that have a task status
                    const taskStatus = getFieldValue(item, 'task_status');
                    if (taskStatus) {
                        if (selectedTaskStatuses.length === 0) return false;
                        if (!selectedTaskStatuses.includes(taskStatus)) return false;
                    }

                    return true;
                });

                // Count by format type
                filteredContent.forEach(item => {
                    const formatType = getFieldValue(item, 'format_type');
                    // Only count formats that are selected in the format filter
                    if (selectedFormats.includes(formatType)) {
                        counts[formatType] = (counts[formatType] || 0) + 1;
                    }
                });
            }
        });

        return counts;
    };

    // Add function to count content by status
    const getContentStatusCounts = () => {
        const counts: Record<string, number> = {};

        // Iterate through all dates in the current month
        Object.keys(contentData).forEach(dateKey => {
            const [year, month, _] = dateKey.split('-').map(Number);

            // Only count items from the current month/year
            if (month === currentMonth && year === currentYear) {
                // Apply ALL filters consistently - just like in getFilteredContentForDay
                const filteredContent = contentData[dateKey].filter(item => {
                    // First check user permissions - only show content for formats user has access to
                    const formatType = getFieldValue(item, 'format_type');

                    // Check if user has access to this format type
                    if (!user?.permissions?.brands || !brandName) return false;
                    const brandData = user.permissions.brands[brandName];
                    if (!brandData || !brandData[formatType]) return false;
                    const permissions = brandData[formatType];
                    if (!permissions || permissions.length === 0) return false;

                    // 1. Format Type filter
                    if (selectedFormats.length === 0) return false;
                    if (!selectedFormats.includes(formatType)) return false;

                    // 2. Content Status filter
                    // We're counting by content status, so we DON'T filter by status here
                    // Otherwise we'd only count items of selected statuses

                    // 3. Task Status filter - only apply to items that have a task status
                    const taskStatus = getFieldValue(item, 'task_status');
                    if (taskStatus) {
                        if (selectedTaskStatuses.length === 0) return false;
                        if (!selectedTaskStatuses.includes(taskStatus)) return false;
                    }

                    return true;
                });

                // Count by content status
                filteredContent.forEach(item => {
                    const status = getFieldValue(item, 'status');
                    // Only count statuses that are selected in the content status filter
                    if (status && selectedContentStatuses.includes(status)) {
                        counts[status] = (counts[status] || 0) + 1;
                    }
                });
            }
        });

        return counts;
    };

    // Add function to count task statuses
    const getTaskStatusCounts = () => {
        const counts: Record<string, number> = {};

        // Iterate through all dates in the current month
        Object.keys(contentData).forEach(dateKey => {
            const [year, month, _] = dateKey.split('-').map(Number);

            // Only count items from the current month/year
            if (month === currentMonth && year === currentYear) {
                // Apply ALL filters consistently - just like in getFilteredContentForDay
                const filteredContent = contentData[dateKey].filter(item => {
                    // First check user permissions - only show content for formats user has access to
                    const formatType = getFieldValue(item, 'format_type');

                    // Check if user has access to this format type
                    if (!user?.permissions?.brands || !brandName) return false;
                    const brandData = user.permissions.brands[brandName];
                    if (!brandData || !brandData[formatType]) return false;
                    const permissions = brandData[formatType];
                    if (!permissions || permissions.length === 0) return false;

                    // 1. Format Type filter
                    if (selectedFormats.length === 0) return false;
                    if (!selectedFormats.includes(formatType)) return false;

                    // 2. Content Status filter
                    const contentStatus = getFieldValue(item, 'status');
                    if (selectedContentStatuses.length === 0) return false;
                    if (!selectedContentStatuses.includes(contentStatus)) return false;

                    // No task filter here since we're counting task statuses

                    return true;
                });

                // Count by task status - only count items that have task_status
                filteredContent.forEach(item => {
                    const taskStatus = getFieldValue(item, 'task_status');
                    // Only count task statuses that are selected in the task status filter
                    if (taskStatus && selectedTaskStatuses.includes(taskStatus)) {
                        counts[taskStatus] = (counts[taskStatus] || 0) + 1;
                    }
                });
            }
        });

        return counts;
    };

    // Update the renderSummaryRow function to include all three types of summaries
    const renderSummaryRow = () => {
        const formatCounts = getFormatTypeCounts();
        const contentStatusCounts = getContentStatusCounts();
        const taskStatusCounts = getTaskStatusCounts();

        const totalFormatCount = Object.values(formatCounts).reduce((sum, count) => sum + count, 0);
        const totalContentStatusCount = Object.values(contentStatusCounts).reduce((sum, count) => sum + count, 0);
        const totalTaskStatusCount = Object.values(taskStatusCounts).reduce((sum, count) => sum + count, 0);

        // Use a more subtle color palette with fewer variations
        const getContentStatusColor = (status: string) => {
            // Use primarily monochromatic colors with just enough variation for status meaning
            switch (status.toLowerCase()) {
                case 'completed':
                case 'posted':
                    return {
                        bg: 'bg-green-50',
                        border: 'border-green-200',
                        text: 'text-green-700'
                    };
                case 'in_review':
                case 'in_reedit':
                case 'approved':
                    return {
                        bg: 'bg-blue-50',
                        border: 'border-blue-200',
                        text: 'text-blue-700'
                    };
                case 'tasks':
                case 'working':
                    return {
                        bg: 'bg-gray-100',
                        border: 'border-gray-300',
                        text: 'text-gray-700'
                    };
                default:
                    return {
                        bg: 'bg-gray-50',
                        border: 'border-gray-200',
                        text: 'text-gray-600'
                    };
            }
        };

        // Similar approach for task statuses
        const getTaskStatusColor = (status: string) => {
            switch (status.toLowerCase()) {
                case 'completed':
                    return {
                        bg: 'bg-green-50',
                        border: 'border-green-200',
                        text: 'text-green-700'
                    };
                case 'in_progress':
                case 'in_review':
                case 'in_reedit':
                    return {
                        bg: 'bg-blue-50',
                        border: 'border-blue-200',
                        text: 'text-blue-700'
                    };
                case 'to_do':
                    return {
                        bg: 'bg-gray-100',
                        border: 'border-gray-300',
                        text: 'text-gray-700'
                    };
                default:
                    return {
                        bg: 'bg-gray-50',
                        border: 'border-gray-200',
                        text: 'text-gray-600'
                    };
            }
        };

        return (
            <div className="border rounded-md p-4">
                <div className="flex flex-wrap gap-4">
                    {/* Format Types Summary */}
                    <div className="flex-1 min-w-[200px]">
                        <div className="text-14 font-semibold mb-2">Format Types ({totalFormatCount})</div>
                        <div className="flex flex-wrap gap-2">
                            {Object.entries(formatCounts).map(([formatType, count]) => {
                                const colors = getFormatTypeColor(formatType);
                                return (
                                    <div
                                        key={`format-${formatType}`}
                                        className={`${colors.bg} ${colors.border} border rounded-full px-3 py-1 flex items-center`}
                                    >
                                        <span className={`${colors.text} text-12 font-medium mr-1`}>{formatType}:</span>
                                        <span className="text-12 font-semibold">{count}</span>
                                    </div>
                                );
                            })}

                        </div>
                    </div>

                    {/* Content Status Summary */}
                    <div className="flex-1 min-w-[200px]">
                        <div className="text-14 font-semibold mb-2">
  Content Status ({totalContentStatusCount})
</div>

                        <div className="flex flex-wrap gap-2">
                            {Object.entries(contentStatusCounts).map(([status, count]) => {
                                const colors = getContentStatusColor(status);
                                return (
                                    <div
                                        key={`content-status-${status}`}
                                        className={`${colors.bg} ${colors.border} border rounded-full px-3 py-1 flex items-center`}
                                    >
                                        <span className={`${colors.text} text-xs font-medium mr-1`}>{status}:</span>
                                        <span className="text-xs font-semibold">{count}</span>
                                    </div>
                                );
                            })}

                        </div>
                    </div>

                    {/* Task Status Summary */}
                    {totalTaskStatusCount > 0 && (
                        <div className="flex-1 min-w-[200px]">
                            <div className="text-14 font-semibold mb-2">Task Status ({totalTaskStatusCount})</div>
                            <div className="flex flex-wrap gap-2">
                                {Object.entries(taskStatusCounts).map(([status, count]) => {
                                    const colors = getTaskStatusColor(status);
                                    return (
                                        <div
                                            key={`task-status-${status}`}
                                            className={`${colors.bg} ${colors.border} border rounded-full px-3 py-1 flex items-center`}
                                        >
                                            <span className={`${colors.text} text-xs font-medium mr-1`}>{status}:</span>
                                            <span className="text-xs font-semibold">{count}</span>
                                        </div>
                                    );
                                })}
                                {/* <div className="bg-gray-100 border border-gray-200 rounded-full px-3 py-1 flex items-center">
                                    <span className="text-xs font-semibold">Total: {totalTaskStatusCount}</span>
                                </div> */}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // Add this right after your renderSummaryRow function definition
    const memoizedSummaryRow = React.useMemo(() => {
        return renderSummaryRow();
    }, [
        selectedFormats,
        selectedContentStatuses,
        selectedTaskStatuses,
        contentData,
        currentMonth,
        currentYear,
        showSummary
    ]);

    // Update the renderFilterComponent function
    const renderFilterComponent = () => {
        // Don't render filter if no format options available
        if (formatOptions.length === 0) {
            return null;
        }

        // Determine placeholder text based on selection
        const getPlaceholderText = () => {
            if (selectedFormats.length === 0) {
                return "No formats selected";
            } else if (selectedFormats.length === formatOptions.length) {
                return "All formats selected";
            } else {
                return `${selectedFormats.length} format(s) selected`;
            }
        };

        // Task details options for SmartDropdown
        const taskDetailsOptions = [
            { value: 'true', label: 'Show task details' },
            { value: 'false', label: 'Hide task details' }
        ];

        // Summary display options
        const summaryOptions = [
            { value: 'true', label: 'Show summary' },
            { value: 'false', label: 'Hide summary' }
        ];

        // Replace the return statement in renderFilterComponent
        return (
            <div className="flex items-center flex-wrap gap-4">
                {/* Format Filter */}
                <div className="flex flex-col w-[180px]">
                    <label className="text-12 font-normal text-ltxt mb-1">
                        Format Type
                    </label>
                    <SmartDropdown
                        options={formatOptions}
                        value={selectedFormats}
                        onChange={(value) => setSelectedFormats(Array.isArray(value) ? value : [value])}
                        placeholder={getPlaceholderText()}
                        multiSelector
                        className="w-full"
                    />
                </div>

                {/* Content Status Filter */}
                {contentStatusOptions.length > 0 && (
                    <div className="flex flex-col w-[180px]">
                        <label className="text-12 font-normal text-ltxt mb-1">
                            Content Status
                        </label>
                        <SmartDropdown
                            options={contentStatusOptions}
                            value={selectedContentStatuses}
                            onChange={(value) => setSelectedContentStatuses(Array.isArray(value) ? value : [value])}
                            placeholder="Filter by status"
                            multiSelector
                            className="w-full"
                        />
                    </div>
                )}

                {/* Task Status Filter */}
                {taskStatusOptions.length > 0 && (
                    <div className="flex flex-col w-[180px]">
                        <label className={`text-12 font-normal mb-1 flex items-center ${
                            // Gray out label if task filter is disabled
                            selectedContentStatuses.some(status => ["tasks", "completed", "posted"].includes(status.toLowerCase()))
                                ? 'text-ltxt'
                                : 'text-gray-400'
                        }`}>
                            Task Status
                        </label>
                        <SmartDropdown
                            options={taskStatusOptions}
                            value={selectedTaskStatuses}
                            onChange={(value) => setSelectedTaskStatuses(Array.isArray(value) ? value : [value])}
                            placeholder={
                                selectedContentStatuses.some(status => ["tasks", "completed", "posted"].includes(status.toLowerCase()))
                                    ? "Filter by task status"
                                    : "Select Tasks/Completed/Posted first"
                            }
                            multiSelector
                            className={`w-full ${
                                !selectedContentStatuses.some(status => ["tasks", "completed", "posted"].includes(status.toLowerCase()))
                                    ? 'opacity-50 cursor-not-allowed'
                                    : ''
                            }`}
                            disabled={!selectedContentStatuses.some(status => ["tasks", "completed", "posted"].includes(status.toLowerCase()))}
                        />
                    </div>
                )}

                {/* Task Details Toggle */}
                <div className="flex flex-col w-[180px]">
                    <label className="text-12 font-normal text-ltxt mb-1">
                        Task Details
                    </label>
                    <SmartDropdown
                        options={taskDetailsOptions}
                        value={showTaskDetails ? 'true' : 'false'}
                        onChange={(value) => setShowTaskDetails(value === 'true')}
                        placeholder="Select task details visibility"
                        className="w-full"
                    />
                </div>

                {/* Summary Toggle */}
                <div className="flex flex-col w-[180px]">
                    <label className="text-12 font-normal text-ltxt mb-1">
                        Summary
                    </label>
                    <SmartDropdown
                        options={summaryOptions}
                        value={showSummary ? 'true' : 'false'}
                        onChange={(value) => setShowSummary(value === 'true')}
                        placeholder="Select summary visibility"
                        className="w-full"
                    />
                </div>
            </div>
        );
    };


    // Clear drag state when drag ends
    const renderDayContent = (day: number, month: number, year: number) => {
        // Add month change detection logic

        const isCurrentMonth = month === currentMonth && year === currentYear;
        const isPastOrFutureMonth = !isCurrentMonth;

        // Use filtered content instead of all content
        const dayContent = getFilteredContentForDay(day, month, year);
        const dateKey = `${year}-${month}-${day}`;

        // Create the date string for new content
        const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        // Handle date box click for creating new content
        const handleDateClick = (e: React.MouseEvent) => {
            // Only allow creating in current month
            if (isPastOrFutureMonth) return;

            // Don't trigger if clicking on an existing content item
            if ((e.target as HTMLElement).closest('[data-content-item]')) return;

            console.log("Date clicked for content creation:", dateString);
            setSelectedCreateDate(dateString);
            setIsCreatingContent(true);
        };

        return (
            <div
                className={`w-full h-full flex flex-col gap-1 p-1 relative ${isPastOrFutureMonth ? 'opacity-60' : ''
                    } ${draggedItem && isPastOrFutureMonth && dragOverInvalidZone ? 'bg-red-50 border-red-200' : ''
                    } ${!isPastOrFutureMonth ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                onClick={handleDateClick}
                onDragOver={(e) => {
                    if (isPastOrFutureMonth) {
                        handleDragOverInvalid(e);
                    } else {
                        handleDragOver(e);
                    }
                }}
                onDrop={(e) => {
                    if (isPastOrFutureMonth) {
                        handleDropInvalid(e, day, month, year);
                    } else {
                        handleDrop(e, day, month, year);
                    }
                }}
            >


                {/* Show drag warning overlay for invalid zones */}
                {draggedItem && isPastOrFutureMonth && dragOverInvalidZone && (
                    <div className="absolute inset-0 bg-red-100 bg-opacity-80 flex items-center justify-center z-10 rounded border-2 border-red-300 border-dashed">
                        <div className="text-center">
                            <div className="text-red-600 font-semibold text-xs mb-1">⚠️ Cannot Drop Here</div>
                            <div className="text-red-500 text-xs">
                                Only current month allowed
                            </div>
                        </div>
                    </div>
                )}

                {/* Show loading state */}
                {isLoading && isCurrentMonth && (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-xs text-gray-500">Loading...</div>
                    </div>
                )}

                {/* Show error state */}
                {error && isCurrentMonth && (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-xs text-red-500">{error}</div>
                    </div>
                )}

                {/* Show message for past/future months */}
                {isPastOrFutureMonth && dayContent.length === 0 && !draggedItem && (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-xs text-gray-400">No data loaded</div>
                    </div>
                )}

                {/* Show existing content items */}
                {!isLoading && !error && (
                    <div className="flex-1 space-y-1">
                        {dayContent.map((item) => {
                            const formatType = getFieldValue(item, 'format_type');
                            const colors = getFormatTypeColor(formatType);
                            const isDragging = draggedItem?.id === item.id;
                            const hasTaskId = !!item.task_id;

                            return (
                                <div
                                    key={typeof item.id === 'string' || typeof item.id === 'number' ? item.id : String(item.id)}
                                    className={`p-2 ${colors.bg} rounded text-xs border-l-2 ${colors.border} transition-all duration-150 ${isPastOrFutureMonth
                                        ? 'cursor-not-allowed opacity-50'
                                        : 'cursor-move hover:shadow-sm hover:scale-[1.02]'
                                        } ${isDragging ? 'opacity-50 scale-95' : 'opacity-100'}`}
                                    draggable={!isPastOrFutureMonth}
                                    data-content-item="true" // Add this to identify content items
                                    onDragStart={isPastOrFutureMonth ? undefined : (e) => handleDragStart(e, item, dateKey)}
                                    onDragEnd={isPastOrFutureMonth ? undefined : handleDragEnd}
                                    onMouseEnter={isPastOrFutureMonth ? undefined : (showTaskDetails && hasTaskId ? (e) => handleMouseEnter(e, 'task', item) : undefined)}
                                    onMouseLeave={isPastOrFutureMonth ? undefined : (showTaskDetails && hasTaskId ? handleMouseLeave : undefined)}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <div className={`font-semibold ${colors.text} text-xs`}>{formatType}</div>
                                        <div className="text-xs text-gray-500 bg-gray-100 px-1 rounded">
                                            {getFieldValue(item, 'status') === 'Tasks' && getFieldValue(item, 'task_status')
                                                ? `Tasks(${getFieldValue(item, 'task_status')})`
                                                : getFieldValue(item, 'status')
                                            }
                                        </div>
                                    </div>

                                    {getFieldValue(item, 'content_name') && (
                                        <div
                                            className={`text-xs text-orange-600 font-medium mb-1 ${isPastOrFutureMonth ? 'cursor-not-allowed' : 'cursor-pointer hover:underline hover:text-orange-700'}`}
                                            onClick={isPastOrFutureMonth ? undefined : (e) => handleContentClick(e, item)}
                                        >
                                            {getFieldValue(item, 'content_name')}
                                        </div>
                                    )}

                                    {/* Conditionally show task name only when showTaskDetails is true AND task_id is present */}
                                    {showTaskDetails && hasTaskId && (
                                        <div
                                            className={`text-xs text-gray-500 font-mono truncate ${isPastOrFutureMonth ? 'cursor-not-allowed' : 'cursor-pointer hover:underline'
                                                }`}
                                            onClick={isPastOrFutureMonth ? undefined : (e) => handleTaskClick(e, item.task_id as string | number)}
                                        >
                                            {getFieldValue(item, 'task_name')}
                                        </div>
                                    )}


                                </div>

                            );
                        })}
                    </div>
                )}

                {/* Show create content hint when empty and hovering */}
                {!isLoading && !error && isCurrentMonth && (
                    <div className={`flex justify-center h-full ${dayContent.length === 0 ? 'items-center' : 'items-end'}`}>
                        <div className="text-xs text-gray-400 text-center">
                            <div>+ New Content</div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    useEffect(() => {
        const handleGlobalDragEnd = (e: DragEvent) => {
            setDragOverInvalidZone(false);
            setDraggedItem(null);
            setDraggedFromDate(null);
        };

        const handleGlobalDragLeave = (e: DragEvent) => {
            if (!e.relatedTarget || !(e.relatedTarget as Element).closest('.calendar-container')) {
                setDragOverInvalidZone(false);
            }
        };

        document.addEventListener('dragend', handleGlobalDragEnd);
        document.addEventListener('dragleave', handleGlobalDragLeave);

        return () => {
            document.removeEventListener('dragend', handleGlobalDragEnd);
            document.removeEventListener('dragleave', handleGlobalDragLeave);
        };
    }, []);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current);
            }
        };
    }, []);

    return (
        <div className="relative calendar-container">
            <Calendar
                renderDayContent={renderDayContent}
                headerComponent={renderFilterComponent()}
                onMonthChange={handleMonthChange}
                topComponent={showSummary ? memoizedSummaryRow : null}
            />
            {renderTooltip()}

            {/* Render the modal if a row is selected */}
            {selectedRow && (
                <>
                    <ContentView
                        rowData={selectedRow}
                        onClose={handleCloseModal} // Close the modal
                        onUpdate={handleUpdateRow} // Handle updates from the modal
                    />
                    {console.log("Modal rendered with rowData:", selectedRow)}
                </>
            )}

            {/* Render create content modal */}
            {isCreatingContent && selectedCreateDate && (
                <ContentView
                    rowData={{
                        brand_name: brandName.toLowerCase(),
                        status: "Working",
                        live_date: selectedCreateDate, // Pre-populate with selected date
                    }}
                    onClose={() => {
                        setIsCreatingContent(false);
                        setSelectedCreateDate(null);
                    }}
                    onUpdate={handleUpdateRow}
                    mode="create"
                />
            )}

        </div>
    );
};


export default ContentCalendar;
