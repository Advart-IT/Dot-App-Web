import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import SmartInput from "../custom-ui/input-box"; // Import SmartInput
import Dropdown from "../custom-ui/dropdown"; // Import Dropdown
import SmartDaySelector from "../custom-ui/dayselectcalendar";
import { AppModal } from "../custom-ui/app-modal";
import { upsertContent } from "@/lib/content/contentapi";
import { getDropdownColumns } from "./dropdowncolumns";
import TakeActions from "./takeactions"; // Adjust the path as needed
import { baseColumns, contentColumns, getColumns2 } from "./getColumns2"; // Import baseColumns, contentColumns, and getColumns
import { useUser } from "@/hooks/usercontext"; // Import useUser hook


// Define the RowData interface
interface RowData {
    [key: string]: string | number | boolean | null | { value: string; updated_by_name: string; updated_at: string }[]; // Other fields are dynamic
}

// Props for the ContentView component
interface ContentViewProps {
    rowData: RowData; // The row data to be edited
    onClose: () => void; // Function to close the modal
    onUpdate?: (updatedRow: RowData) => void; // Function to pass updated data back to the parent
    mode?: "edit" | "create"; // Optional mode prop to determine if the view is for editing or creating
}

export default function ContentView({ rowData, onClose, onUpdate, mode }: ContentViewProps) {
    const { user } = useUser(); // Get the user context
    const [editableData, setEditableData] = useState<RowData>(rowData || {});
    const [columns, setColumns] = useState<any[]>([]); // State to store the combined columns
    const dropdownColumns = getDropdownColumns(); // Get the dropdown column definitions
    const [selectedBrand, setSelectedBrand] = useState<string>(typeof rowData.brand_name === "string" ? rowData.brand_name : ""); // Ensure brand_name is a string
    const [selectedFormat, setSelectedFormat] = useState<string>(typeof rowData.format_type === "string" ? rowData.format_type : ""); // Ensure status is a string
    const [selectedStatus, setSelectedStatus] = useState<string>(typeof rowData.status === "string" ? rowData.status : ""); // Ensure status is a string
    const [localMode, setLocalMode] = useState<"edit" | "create">(mode || "edit");
    // Add this ref to store the last committed value for content_name
    const lastCommittedContentName = useRef<string>("");
    const [shouldUpdate, setShouldUpdate] = useState<boolean>(false); // State to trigger updates


    // Update this ref whenever content_name is successfully saved
    useEffect(() => {
        if (editableData.content_name && typeof editableData.content_name === "string") {
            lastCommittedContentName.current = editableData.content_name;
        }
    }, [editableData.content_name]);


    // Replace the current isSaveEnabled logic with this:
    const isSaveEnabled = useMemo(() => {
        // Define the required fields that must have values
        const requiredFields = ["content_name", "brand_name", "format_type", "live_date", "status"];

        // Check if all required fields have non-empty values (excluding whitespace-only strings)
        const isValid = requiredFields.every(key => {
            const value = editableData[key];

            // Check for null, undefined, empty string, or whitespace-only string
            if (value === null || value === undefined || value === "") {
                return false;
            }

            // Convert to string and check if it's only whitespace
            const stringValue = String(value).trim();
            return stringValue.length > 0;
        });

        return isValid;
    }, [editableData]);


    if (!rowData) return null; // Don't render the modal if no row data is provided




    const populateColumns = useCallback(() => {

        // Combine baseColumns and contentColumns
        const staticColumns = [...baseColumns, ...contentColumns];


        // Get dynamic columns based on the selected format and status
        const dynamicColumns = getColumns2(selectedFormat, selectedStatus);

        // Combine static and dynamic columns
        const combinedColumns = [...staticColumns, ...dynamicColumns];

        // Update the columns state
        setColumns(combinedColumns);
        console.log("Columns populated:", combinedColumns); // Log the populated columns for debugging
    }, [selectedFormat, selectedStatus]);


    // Log the columns for debugging
    useEffect(() => {
        console.log("Status updated:", selectedStatus);

    }, [selectedStatus]);

    // Then update your existing useEffect
    useEffect(() => {
        if (localMode === "create") {
            const basicColumns = [...baseColumns].filter(col =>
                ["content_name", "brand_name", "format_type", "status", "live_date"].includes(col.accessor)
            );
            setColumns(basicColumns);
        }
        if (localMode === "edit" && selectedFormat && selectedStatus) {
            populateColumns();
        }
    }, [localMode, selectedFormat, selectedStatus]); // Keep these dependencies


    const handleInputChange = (key: string, value: string | number | boolean | null) => {
        setEditableData((prev) => {
            const updatedData = {
                ...prev,
                [key]: value,
            };
            return updatedData;
        });

        // Synchronize selectedBrand, selectedFormat, and selectedStatus with editableData
        if (key === "brand_name") {
            setSelectedBrand(value as string); // Update selectedBrand
            // Clear category when brand changes since categories are brand-specific
            if (editableData.category) {
                setEditableData((prev) => ({
                    ...prev,
                    category: ""
                }));
            }
        } else if (key === "format_type") {
            setSelectedFormat(value as string); // Update selectedFormat
        } else if (key === "status") {
            setSelectedStatus(value as string); // Update selectedStatus
        }
    };

    const sanitizeData = (data: RowData): RowData => {
        return Object.fromEntries(
            Object.entries(data).filter(
                ([_, value]) => value !== "" && value !== null && value !== undefined
            )
        );
    };


    // Update the handleInputChangeComplete function
    const handleInputChangeComplete = async (key: string, value: string | number | boolean | null) => {
        // Skip API call in "create" mode
        if (localMode === "create") {
            return;
        }

        // Special validation for content_name - cannot be empty or whitespace-only
        if (key === "content_name") {
            if (typeof value === "string") {
                const trimmedValue = value.trim();
                if (trimmedValue === "") {
                    // Get the last committed value or the original value from rowData
                    const revertValue = lastCommittedContentName.current || String(rowData.content_name || "");

                    // Update the state to show the reverted value
                    setEditableData((prev) => ({
                        ...prev,
                        [key]: revertValue,
                    }));

                    return; // Exit early without API call
                }
                // Use the trimmed value for the API call
                value = trimmedValue;
            }
        }


        const previousEditableData = { ...editableData };

        setEditableData((prev) => ({
            ...prev,
            [key]: value,
        }));

        const changedData = {
            id: typeof editableData.id === "number" ? editableData.id : undefined,
            [key]: value
        };

        // Call the API to update the row
        try {
            const response = await upsertContent(changedData);
            // Update the committed value for content_name
            if (key === "content_name") {
                lastCommittedContentName.current = String(value);
            }

            // Skip onUpdate if shouldUpdate is true for the save and continue action
            if (!shouldUpdate) {
                onUpdate?.(response);
            }
        } catch (error) {
            console.error("Error updating row:", error);

            // Rollback to the previous state
            setEditableData(previousEditableData);
            // Show an error message to the user
            alert("Failed to save the data. Please try again.");
        }
    };

    const handleClose = () => {
        if (shouldUpdate) {
            onUpdate?.(editableData);
        }
        onClose();
    };



    const handleSave = async (action: 'save-and-close' | 'save-and-continue' = 'save-and-close') => {

        // Sanitize the data
        const sanitizedData = sanitizeData(editableData);

        // Call the API to save the data
        try {
            const response = await upsertContent(sanitizedData); // Call the API with sanitized data
            // Append updated_at with the same value as created_at if it exists
            const updatedResponse = {
                ...response,
                updated_at: response.created_at || response.updated_at, // Use created_at if updated_at is missing
            };


            // Combine all data into one object, ensuring no duplicates
            const combinedData = {
                ...editableData, // Start with the original editable data
                ...sanitizedData, // Overwrite with sanitized data
                ...updatedResponse, // Overwrite with the API response
            };

            // Update editableData with the API response
            setEditableData(updatedResponse);

            // Handle different actions
            if (action === 'save-and-continue') {

                setLocalMode("edit");

                setTimeout(() => {
                    populateColumns();

                    // After populating columns, update editableData to include all expected fields
                    setTimeout(() => {
                        setEditableData(prevData => {
                            const updatedData = { ...prevData };

                            // Get all expected keys from the populated columns
                            const allExpectedKeys = [
                                ...thirdRowKeys,
                                ...fourthRowKeys1,
                                ...fourthRowKeys2,
                                ...fifthRowKeys,
                                ...sixthRowKeys
                            ];


                            // Add missing keys with empty values
                            allExpectedKeys.forEach(key => {
                                if (!updatedData.hasOwnProperty(key)) {
                                    updatedData[key] = "";
                                }
                            });

                            return updatedData;
                        });
                    }, 50);
                }, 100);

                setShouldUpdate(true); // Set shouldUpdate to true to indicate updates are needed - adding this because the pop-up closes immediately when we directly pass the onUpdate call backt to parent

            } else {
                // Pass the combined data back to the parent
                onUpdate?.(combinedData);

                onClose();
            }



        } catch (error) {
            console.error("Error saving data:", error);

            // Optionally, show an error message to the user
            alert("Failed to save the data. Please try again.");
        }
    };


    // Add these memoized values near your other useMemo hooks
    const hasAnyFormatPermissionMemo = useMemo(() => {
        if (!selectedBrand) return false;

        const brandPermissions = user?.permissions?.brands?.[selectedBrand.toLowerCase()];
        if (!brandPermissions) return false;

        // Check if user has any permissions for any format in this brand
        return Object.values(brandPermissions).some(
            (permissions: any) => permissions.includes("creator") || permissions.includes("reviewer")
        );
    }, [selectedBrand, user?.permissions?.brands]);

    const hasEditPermissionMemo = useMemo(() => {
        if (!selectedBrand || !selectedFormat) {
            return false;
        }

        const brandPermissions = user?.permissions?.brands?.[selectedBrand.toLowerCase()];
        if (!brandPermissions) {
            return false;
        }

        const formatPermissions = brandPermissions[selectedFormat];
        if (!formatPermissions) {
            return false;
        }

        const hasPermission = formatPermissions.includes("creator") || formatPermissions.includes("reviewer");
        return hasPermission;
    }, [selectedBrand, selectedFormat, user?.permissions?.brands]);

    const isEditableMemo = useMemo(() => {

        // In create mode, if user got this far, they have permissions
        if (localMode === "create") {
            return true;
        }

        // For edit mode, check full permissions
        if (!hasEditPermissionMemo) {
            return false;
        }

        const status = editableData.status?.toString().toLowerCase();

        // Allow reviewers to edit in any stage
        const isReviewer = user?.permissions?.brands?.[selectedBrand.toLowerCase()]?.[selectedFormat]?.includes("reviewer");
        if (isReviewer) {
            return true;
        }

        // Allow creators to edit only in "Working" or "In reedit" stages
        if (status === "working" || status === "in reedit") {
            return true;
        }

        return false;
    }, [localMode, hasEditPermissionMemo, editableData.status, selectedBrand, selectedFormat, user?.permissions?.brands]);

    const canEditTakeActionMemo = useMemo(() => {

        if (!hasEditPermissionMemo) {
            return false;
        }

        // Allow reviewers to take actions in any stage
        const isReviewer = user?.permissions?.brands?.[selectedBrand.toLowerCase()]?.[selectedFormat]?.includes("reviewer");
        if (isReviewer) {
            return true;
        }

        const status = editableData.status?.toString().toLowerCase();
        if (status === "approved" || status === "tasks") {
            return true;
        }

        if (status === "in review") {
            return false;
        }

        return true;
    }, [hasEditPermissionMemo, selectedBrand, selectedFormat, editableData.status, user?.permissions?.brands]);

    // Add this memoized value near your other useMemo hooks
    const filteredFormatOptions = useMemo(() => {
        if (!selectedBrand) return [];

        const dropdownColumn = dropdownColumns.find((col) => col.accessor === "format_type");
        if (!dropdownColumn) return [];

        // Filter options to only show formats the user has permissions for
        const filtered = (dropdownColumn.options ?? []).filter((option: string) => {
            const brandPermissions = user?.permissions?.brands?.[selectedBrand.toLowerCase()];
            if (!brandPermissions) return false;

            const formatPermissions = brandPermissions[option];
            if (!formatPermissions) return false;

            // Check if user has creator or reviewer permissions for this format
            const hasPermission = formatPermissions.includes("creator") || formatPermissions.includes("reviewer");

            return hasPermission;
        });

        return filtered;
    }, [selectedBrand]);

    // Add memoized value for brand-specific category options
    const categoryOptions = useMemo(() => {
        if (!selectedBrand || !user?.dropdowns?.category) return [];

        // Get the brand name in proper case (capitalize first letter)
        const brandName = selectedBrand.charAt(0).toUpperCase() + selectedBrand.slice(1).toLowerCase();
        
        // Return the categories for the selected brand
        return user.dropdowns.category[brandName] || [];
    }, [selectedBrand, user?.dropdowns?.category]);


    // Add this function before the return statement
    const handleDelete = async () => {
        if (!editableData.id) {
            return;
        }

        // Show confirmation dialog
        const confirmed = window.confirm("Are you sure you want to delete this content? This action cannot be undone.");
        if (!confirmed) {
            return;
        }

        // Prepare delete data with is_delete flag
        const deleteData = {
            id: typeof editableData.id === "number" ? editableData.id : undefined,
            is_delete: true
        };

        try {
            const response = await upsertContent(deleteData);

            // Optionally notify parent component about the deletion
            onUpdate?.(response);

            // Close the modal after successful deletion
            onClose();



        } catch (error) {
            console.error("Error deleting content:", error);
            alert("Failed to delete the content. Please try again.");
        }
    };


    // Group dropdowns into rows
    const firstRowKeys = ["content_name", "id"];
    const secondRowKeys = ["status", "brand_name", "format_type", "live_date"];
    // Replace the hardcoded arrays with dynamic ones based on columns
    const thirdRowKeys = useMemo(() => {
        if (localMode === "create") return [];

        const availableThirdRowFields = ["marketing_funnel", "top_pointers", "post_type", "ads_type", "category"];
        const columnAccessors = columns.map(col => col.accessor);

        return availableThirdRowFields.filter(key => columnAccessors.includes(key));
    }, [localMode, columns]);

    const fourthRowKeys1 = useMemo(() => {
        if (localMode === "create") return [];

        const availableFourthRowFields1 = ["detailed_concept"];
        const columnAccessors = columns.map(col => col.accessor);

        return availableFourthRowFields1.filter(key => columnAccessors.includes(key));
    }, [localMode, columns]);

    const fourthRowKeys2 = useMemo(() => {
        if (localMode === "create") return [];

        const availableFourthRowFields2 = ["reference", "media_links"];
        const columnAccessors = columns.map(col => col.accessor);

        return availableFourthRowFields2.filter(key => columnAccessors.includes(key));
    }, [localMode, columns]);

    const fifthRowKeys = useMemo(() => {
        if (localMode === "create") return [];

        const availableFifthRowFields = ["copy", "description"];
        const columnAccessors = columns.map(col => col.accessor);

        return availableFifthRowFields.filter(key => columnAccessors.includes(key));
    }, [localMode, columns]);

    const sixthRowKeys = useMemo(() => {
        if (localMode === "create") return [];

        const availableSixthRowFields = ["hashtags", "seo_keywords"];
        const columnAccessors = columns.map(col => col.accessor);

        return availableSixthRowFields.filter(key => columnAccessors.includes(key));
    }, [localMode, columns]);

    // const seventhRowKeys = ["review_comment_log"];
    const eigthRowKeys = useMemo(() => {
        if (localMode === "create") return [];

        const availableEigthRowFields = ["task_name", "task_id", "task_status", "due_date", "assigned_to_name"];
        const columnAccessors = columns.map(col => col.accessor);

        // // Always show task fields when status is Approved
        // if (typeof editableData.status === "string" && editableData.status.toLowerCase() === "approved") {
        //     return availableEigthRowFields;
        // }

        // Otherwise, only show fields that exist in both columns and editableData
        return availableEigthRowFields.filter(key =>
            columnAccessors.includes(key) && Object.keys(editableData).includes(key)
        );
    }, [localMode, columns, editableData, editableData.status]);
    const rowKeys = ["id"]; // Keys to filter out from the remaining keys



    // Combine all keys and values into a single object
    // Combine all keys and values into a single flat object
    const combinedRowData = {
        //editableData, // Include all editable data
        ...firstRowKeys.reduce((acc, key) => ({ ...acc, [key]: editableData[key] }), {}),
        ...secondRowKeys.reduce((acc, key) => ({ ...acc, [key]: editableData[key] }), {}),
        ...thirdRowKeys.reduce((acc, key) => ({ ...acc, [key]: editableData[key] }), {}),
        ...fourthRowKeys1.reduce((acc, key) => ({ ...acc, [key]: editableData[key] }), {}),
        ...fourthRowKeys2.reduce((acc, key) => ({ ...acc, [key]: editableData[key] }), {}),
        ...fifthRowKeys.reduce((acc, key) => ({ ...acc, [key]: editableData[key] }), {}),
        ...sixthRowKeys.reduce((acc, key) => ({ ...acc, [key]: editableData[key] }), {}),
        ...rowKeys.reduce((acc, key) => ({ ...acc, [key]: editableData[key] }), {}),
        ...eigthRowKeys.reduce((acc, key) => ({ ...acc, [key]: editableData[key] }), {}),
    };



    console.log("Combined Row Data:", combinedRowData); // Log the combined row data for debugging



    return (
        <AppModal open={!!rowData} onClose={handleClose} size="3xl" title="Concept">
            {/* <div className="space-y-4 text-[14px]"> */}
            <div className="flex flex-col min-h-[500px] space-y-4 text-[14px]">
                <div className="flex-shrink-0 space-y-4">

                    <div className="grid grid-cols-1 gap-4">
                        {/* Second Row */}
                        {firstRowKeys.map((key) => {
                            if (key === "content_name") {
                                // Make content_name editable in both create and edit modes with delete button
                                return (
                                    <div key={key} className="flex flex-col">
                                        <div className="flex gap-2 items-end">
                                            {/* Content Name Input - takes remaining space */}
                                            <div className="flex-1">
                                                <SmartInput
                                                    value={String(editableData[key] || "")}
                                                    onChange={(value: string) => handleInputChange(key, value)}
                                                    onChangeComplete={(value: string) => handleInputChangeComplete(key, value)}
                                                    readOnly={!isEditableMemo} // Make it editable based on permissions
                                                    label={key.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())}
                                                    required={true} // Make it required
                                                />
                                            </div>

                                            {/* Delete Button - fixed width */}
                                            <button
                                                onClick={handleDelete}
                                                disabled={localMode === "create" || !isEditableMemo} // Disabled in create mode OR if not editable
                                                className={`w-12 h-10 rounded-md flex items-center justify-center ${localMode === "create" || !isEditableMemo
                                                    ? "bg-gray-200 cursor-not-allowed opacity-50"
                                                    : "bg-red-500 hover:bg-red-600 text-white"
                                                    }`}
                                                title={
                                                    localMode === "create"
                                                        ? "Cannot delete in create mode"
                                                        : !isEditableMemo
                                                            ? "You don't have permission to delete this content"
                                                            : "Delete this content"
                                                }
                                            >
                                                <svg
                                                    className="w-4 h-4"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                    />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                );
                            }
                        })}
                    </div>

                    {/* Second Row */}

                    <div className="grid grid-cols-5 gap-4 ">
                        {secondRowKeys.map((key) => {
                            if (key === "live_date") {
                                // Render SmartDaySelector for live_date in all conditions
                                return (
                                    <div
                                        key={key}
                                        className={`flex flex-col ${isEditableMemo ? "" : "opacity-70 cursor-not-allowed pointer-events-none"}`}
                                    >
                                        <SmartDaySelector
                                            buttonClassName="border-none rounded-md px-2 py-2 bg-[#F9FAFB]"
                                            label={key.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())}
                                            value={
                                                editableData[key]
                                                    ? new Date(editableData[key] as string)
                                                    : null
                                            }
                                            onChange={(selectedDate: Date | null) => {
                                                const formattedDate = selectedDate
                                                    ? new Date(selectedDate.getTime() - selectedDate.getTimezoneOffset() * 60000).toISOString().split("T")[0]
                                                    : null;

                                                setEditableData((prev) => ({
                                                    ...prev,
                                                    [key]: formattedDate,
                                                }));

                                                handleInputChangeComplete(key, formattedDate);
                                            }}
                                            showApplyButton={false}
                                            required={true}
                                        />
                                    </div>
                                );
                            } else if (key === "format_type" && localMode === "create") {
                                // Render dropdown for format_type only in create mode
                                return (
                                    <div key={key} className="flex flex-col">
                                        <Dropdown
                                            value={String(editableData[key] || "")}
                                            options={filteredFormatOptions.map((option: string) => ({
                                                label: option,
                                                value: option,
                                            }))}
                                            onChange={(value: string) => {
                                                handleInputChange(key, value);
                                                setSelectedFormat(value);
                                            }}
                                            label={key.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())}
                                            required={true}
                                        />
                                    </div>
                                );
                            } else {
                                // Render SmartInput for all other keys (read-only)
                                return (
                                    <div key={key} className="flex flex-col">
                                        <SmartInput
                                            value={String(editableData[key] || "")}
                                            label={key.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())}
                                            onChange={(value: string) => handleInputChange(key, value)}
                                            readOnly={true} // Make it read-only if not in create mode
                                            required={true}
                                        />
                                    </div>
                                );
                            }
                        })}
                    </div>

                </div>


                {/* Only render third row in edit mode */}
                {localMode !== "create" && (
                    <div>
                        <div className="grid grid-cols-5 gap-4">
                            {thirdRowKeys.map((key) => {
                                const dropdownColumn = dropdownColumns.find((col) => col.accessor === key);

                                // Special handling for category field
                                if (key === "category") {
                                    return (
                                        <div
                                            key={key}
                                            className={`flex flex-col ${isEditableMemo ? "" : "opacity-70 cursor-not-allowed pointer-events-none"}`}
                                        >
                                            <Dropdown
                                                value={String(editableData[key] || "")}
                                                options={categoryOptions.map((option: string) => ({
                                                    label: option,
                                                    value: option,
                                                }))}
                                                onChange={(value: string) => handleInputChange(key, value)}
                                                label="Category"
                                                onChangeComplete={(value: string) => handleInputChangeComplete(key, value)}
                                                required={true}
                                            />
                                        </div>
                                    );
                                }

                                // Render all other keys as dropdowns in edit mode
                                return (
                                    <div
                                        key={key}
                                        className={`flex flex-col ${isEditableMemo ? "" : "opacity-70 cursor-not-allowed pointer-events-none"}`}
                                    >
                                        <Dropdown
                                            value={String(editableData[key] || "")}
                                            options={(dropdownColumn?.options ?? []).map((option: string) => ({
                                                label: option,
                                                value: option,
                                            }))}
                                            onChange={(value: string) => handleInputChange(key, value)}
                                            label={key.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())}
                                            onChangeComplete={(value: string) => handleInputChangeComplete(key, value)}
                                            required={true}
                                        />
                                    </div>
                                );
                            })}
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-4">
                            {/* First Column for fourthRowKeys1 */}
                            <div className="flex flex-col">
                                {fourthRowKeys1.map((key) => (
                                    <div key={key} className="flex flex-col mb-4">
                                        <SmartInput
                                            value={String(editableData[key] || "")}
                                            label={key.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())}
                                            onChange={(value: string) => handleInputChange(key, value)}
                                            onChangeComplete={(value: string) => handleInputChangeComplete(key, value)}
                                            isTextarea={true}
                                            rows={8.3}
                                            maxHeight={200}
                                            overflowBehavior="scroll"
                                            readOnly={!isEditableMemo}
                                            required={true} // Make it required
                                        />
                                    </div>
                                ))}
                            </div>

                            {/* Second Column for fourthRowKeys2 */}
                            <div className="flex flex-col">
                                {fourthRowKeys2.map((key) => (
                                    <div key={key} className="flex flex-col mb-4">
                                        <SmartInput
                                            value={String(editableData[key] || "")}
                                            label={key.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())}
                                            isTextarea={true}
                                            rows={3}
                                            maxHeight={80}
                                            autoExpand={true}
                                            overflowBehavior="scroll"
                                            onChange={(value: string) => handleInputChange(key, value)}
                                            onChangeComplete={(value: string) => handleInputChangeComplete(key, value)}
                                            readOnly={!isEditableMemo}
                                            required={true} // Make it required
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-4">
                            {/* Fifth Rows */}
                            {fifthRowKeys.map((key) => (
                                <div key={key} className="flex flex-col">
                                    <SmartInput
                                        value={String(editableData[key] || "")}
                                        label={key.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())}
                                        isTextarea={true}
                                        rows={2}
                                        maxHeight="3 rows"
                                        autoExpand={true}
                                        overflowBehavior="toggle"
                                        onChange={(value: string) => handleInputChange(key, value)}
                                        onChangeComplete={(value: string) => handleInputChangeComplete(key, value)}
                                        readOnly={!isEditableMemo}
                                        required={true} // Make it required
                                    // disableEvents={{
                                    //     blur: true, // Disable `handleBlur`
                                    //     keydown: false, // Allow `handleKeyDown`
                                    // }}
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-4">
                            {/* Fifth Rows */}
                            {sixthRowKeys.map((key) => (
                                <div key={key} className="flex flex-col">
                                    <SmartInput
                                        value={String(editableData[key] || "")}
                                        label={key.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())}
                                        isTextarea={true}
                                        rows={1}
                                        maxHeight="3 rows"
                                        autoExpand={true}
                                        overflowBehavior="toggle"
                                        onChange={(value: string) => handleInputChange(key, value)}
                                        onChangeComplete={(value: string) => handleInputChangeComplete(key, value)}
                                        readOnly={!isEditableMemo}
                                        required={true} // Make it required
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}



                {/* {(typeof editableData.status === "string" && editableData.status.toLowerCase() === "in review".toLowerCase()) && */}
                {typeof editableData.status === "string" && editableData.status.toLowerCase() !== "working" && (
                    <div className="grid grid-cols-1 gap-4 mt-4">
                        <div>
                            {editableData.review_comment_log && Array.isArray(editableData.review_comment_log) && editableData.review_comment_log.length > 0 ? (
                                <SmartInput
                                    value={editableData.review_comment_log
                                        .map((log) => {
                                            const formattedDate = new Date(log.updated_at).toLocaleString(undefined, {
                                                year: "numeric",
                                                month: "2-digit",
                                                day: "2-digit",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            });
                                            return `- ${log.value}\n  (${formattedDate}, by ${log.updated_by_name || "Unknown"})`;
                                        })
                                        .join("\n\n")} // Join each comment with a blank line
                                    label="Review Comments"
                                    isTextarea={true} // Enable multi-line input
                                    rows={2} // Set the number of visible rows
                                    maxHeight="6 rows" // Set the maximum height
                                    overflowBehavior="toggle" // Toggle overflow behavior
                                    readOnly={true} // Make it read-only
                                    onChange={() => { }} // No-op for read-only mode
                                    required={true} // Make it required
                                />
                            ) : (
                                <SmartInput
                                    value="No review comments available."
                                    label="Review Comments"
                                    isTextarea={true} // Enable multi-line input
                                    rows={2} // Set the number of visible rows
                                    readOnly={true} // Make it read-only
                                    onChange={() => { }} // No-op for read-only mode
                                    required={true} // Make it required
                                />
                            )}
                        </div>
                    </div>
                )}


                {typeof editableData.status === "string" && (editableData.status.toLowerCase() === "approved" || editableData.status.toLowerCase() === "tasks" || editableData.status.toLowerCase() === "completed" || editableData.status.toLowerCase() === "posted") && (
                    <div>
                        <label className="font-medium text-sm"> Task Details </label>
                        <div className="grid grid-cols-1 gap-4 mt-1 bg-gray-50 p-4 rounded-[5px]">
                            <div>
                                {eigthRowKeys.length > 0 ? (
                                    <div className="grid grid-cols-5 gap-4 text-sm text-gray-700">
                                        {eigthRowKeys.map((key) => {
                                            const formattedKey = key.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
                                            const value = editableData[key] || "N/A"; // Use "N/A" if the value is missing
                                            return (
                                                <div key={key} className="flex flex-col">
                                                    <span className="font-semibold">{formattedKey}</span>
                                                    <span>
                                                        {Array.isArray(value)
                                                            ? value.map((item, index) => (
                                                                <div key={index}>
                                                                    {item.value} (Updated by: {item.updated_by_name} on {item.updated_at})
                                                                </div>
                                                            ))
                                                            : value}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500">No data available for these keys.</p>
                                )}
                                {editableData.task_id && (
                                    <button
                                        onClick={() => {
                                            const taskUrl = `/tasks/${editableData.task_id}`;
                                            // Open the task URL in a new tab
                                            window.open(taskUrl, "_blank");
                                        }}
                                        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                                    >
                                        View Task
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex-1">
                    {localMode === "create" && (
                        <div className="flex min-h-[200px] h-full items-center justify-center">
                            {!hasAnyFormatPermissionMemo ? (
                                // Show permission denied message
                                <div className="text-center p-8 bg-red-50 rounded-lg border border-red-200">
                                    <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-4">
                                        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-semibold text-red-800 mb-2">
                                        No Permission to Create Content
                                    </h3>
                                    <p className="text-red-600 mb-4">
                                        You don't have permission to create content for the brand "{selectedBrand}".
                                    </p>
                                    <p className="text-sm text-red-500">
                                        Please contact your administrator to request content creation permissions.
                                    </p>
                                </div>
                            ) : (
                                // Show normal placeholder message
                                <div className="text-gray-400 text-sm text-center">
                                    Additional fields will appear here after saving
                                </div>
                            )}
                        </div>
                    )}
                </div>



                <div className="flex-shrink-0">
                    {localMode === "create" && hasAnyFormatPermissionMemo && (
                        <div className="mt-6 bg-gray-50 p-4 rounded-md flex justify-end gap-4">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={() => handleSave('save-and-continue')}
                                className={`px-4 py-2 rounded-md text-white ${isSaveEnabled ? "bg-green-500 hover:bg-green-600" : "bg-gray-300 cursor-not-allowed"
                                    }`}
                                disabled={!isSaveEnabled}
                            >
                                Save and Continue
                            </button>
                            <button
                                onClick={() => handleSave('save-and-close')}
                                className={`px-4 py-2 rounded-md text-white ${isSaveEnabled ? "bg-blue-500 hover:bg-blue-600" : "bg-gray-300 cursor-not-allowed"
                                    }`}
                                disabled={!isSaveEnabled}
                            >
                                Save and Close
                            </button>
                        </div>
                    )}
                </div>

                {/* Render TakeActions buttons */}

                {localMode !== "create" && typeof editableData.status === "string" && editableData.status.toLowerCase() !== "tasks" && editableData.status.toLowerCase() !== "completed" && editableData.status.toLowerCase() !== "posted" && (
                    < div className={`mt-4 ${canEditTakeActionMemo ? "" : "opacity-70 cursor-not-allowed pointer-events-none"}`}>

                        <label className="font-medium text-sm">Take Action</label>

                        <TakeActions
                            rowData={combinedRowData} // Pass the current editable data
                            onSuccess={(result) => {
                                if (result && typeof result === "object") {
                                    // Check if the status is updated to "In reedit" (case-insensitive) and review_comment exists
                                    if (result.status) {
                                        setSelectedStatus(result.status);
                                    }

                                    if (
                                        result.status &&
                                        result.status.toLowerCase() === "in reedit" &&
                                        result.review_comment &&
                                        typeof result.review_comment === "string"
                                    ) {
                                        // Create a new log entry
                                        const newLogEntry = {
                                            value: result.review_comment,
                                            updated_by_name: result.created_by_name || "Unknown", // Use created_by_name or fallback to "Unknown"
                                            updated_by: result.created_by || null, // Use created_by or null
                                            updated_at: result.updated_at || new Date().toISOString().slice(0, 16).replace("T", " "), // Use updated_at or current timestamp
                                        };

                                        // Update the review_comment_logs array
                                        setEditableData((prev) => {
                                            const updatedLogs = Array.isArray(prev.review_comment_log)
                                                ? [...prev.review_comment_log, newLogEntry]
                                                : [newLogEntry]; // Initialize as an array if it doesn't exist

                                            const updatedData = {
                                                ...prev,
                                                review_comment_log: updatedLogs, // Update the logs
                                            };
                                            return updatedData;
                                        });
                                    }



                                    // Update editableData with the entire result object at once
                                    setEditableData((prev) => {
                                        const updatedData = {
                                            ...prev,
                                            ...result, // Merge the result object into the current editableData
                                        };
                                        // Skip onUpdate if shouldUpdate is true for the save and continue action
                                        if (!shouldUpdate) {
                                            onUpdate?.(updatedData);
                                        }

                                        return updatedData;
                                    });
                                } else {
                                    console.warn("Invalid result object:", result);
                                }
                            }} // Optional success callback
                            onError={(error) => console.error("Action failed:", error)} // Optional error callback
                        />
                    </div>
                )}


            </div>
        </AppModal>
    );
}
