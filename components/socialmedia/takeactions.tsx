import React, { useState, useEffect } from "react";
import { upsertContent } from "../../lib/content/contentapi"; // Import the upsertContent function
import { getDropdownColumns } from "./dropdowncolumns";
import SmartInputBox from "../custom-ui/input-box";
import { AppModal } from "../custom-ui/app-modal";
import SmartDropdown from "../custom-ui/dropdown";
import SmartDaySelector from "../custom-ui/dayselectcalendar";
import { useUser } from "@/hooks/usercontext";
import AddChecklist from "../tasks/addchecklist"; // Import AddChecklist component
import SmartToggleSwitch from "../custom-ui/toggleswitch"; // Import SmartToggleSwitch
import { createTask } from "@/lib/tasks/task";


interface TakeActionsProps {
    rowData: any; // Data for the row to be created/updated
    onSuccess?: (result: any) => void; // Callback for successful action
    onError?: (error: any) => void; // Callback for handling errors
}

const TakeActions: React.FC<TakeActionsProps> = ({ rowData, onSuccess, onError }) => {
    const [editableData, setEditableData] = useState<Record<string, any>>(rowData); // State to track editable values
    const [reviewComment, setReviewComment] = useState<string>(""); // State to track review_comment
    const [assignedTo, setAssignedTo] = useState<string>(""); // State for assigned to
    const [dueDate, setdueDate] = useState<Date | undefined>(undefined); // State for due date
    const { user } = useUser(); // Get the current user context
    const [checklistNames, setChecklistNames] = useState<string>(""); // State to store checklist names
    const [isReviewRequired, setIsReviewRequired] = useState(true); // State for toggle switch



    useEffect(() => {
        setEditableData(rowData);
    }, [rowData]);

    const assignedToOptions = user?.people.map((person: { employee_id: number; username: string }) => ({
        value: person.employee_id.toString(), // Use employee_id as the value
        label: person.username, // Use username as the label
    }))

    // Get the dropdown column definitions once
    const dropdownColumns = getDropdownColumns();


    const getMissingFields = () => {
        return Object.keys(editableData)
            .filter((key) => {
                const value = editableData[key];
                return value === null ||
                       value === undefined ||
                       value === "" ||
                       (typeof value === "string" && value.trim() === "");
            });
    };


    const isActionEnabled = getMissingFields().length === 0; // Check if all required fields are filled

    const generateFormattedOutput = () => {
        const fields = {
            top_pointers: editableData.top_pointers,
            post_type: editableData.post_type,
            ads_type: editableData.ads_type,
            detailed_concept: editableData.detailed_concept,
            copy: editableData.copy,
            reference: editableData.reference,
            media_links: editableData.media_links,
        };

        // Filter out fields with no value and format the keys
        const filteredFields = Object.entries(fields)
            .filter(([_, value]) => value) // Keep only fields with a value
            .map(([key, value]) => {
                // Format the key (capitalize and replace underscores with spaces)
                const formattedKey = key
                    .split("_")
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ");
                return `${formattedKey}: ${value}`;
            });

        return filteredFields.join("\n\n"); // Join the formatted fields with blank lines
    };



    const adjustToLocalDate = (date: Date) => {
        const localDate = new Date(date);
        localDate.setMinutes(date.getMinutes() - date.getTimezoneOffset());
        return localDate;
    };


    const handleSubmit = async () => {
        console.log("working onclick");
        const payload = {
            row_id: rowData.id, // Use the rowData.id for the row being created/updated
            task_name: rowData.task_name,
            due_date: dueDate ? adjustToLocalDate(dueDate).toISOString().split("T")[0] : "",
            assigned_to: parseInt(assignedTo, 10), // Convert assignedTo to a number
            is_review_required: isReviewRequired,
            description: generateFormattedOutput(),
            checklist_names: checklistNames.split(",").map(name => name.trim()), // Convert checklistNames to an array
        };

        try {
            console.log("final payload:", payload);
            const response = await createTask(payload); // Call the API submission function
            console.log("✅ Task successfully created."); // Log success message
            console.log("API Response:", response); // Log the API response for debugging
            if (response.message && response.message.toLowerCase().includes("task created successfully")) {
                const dropdownColumn = dropdownColumns.find((col) => col.accessor === "status");
                const updatedTaskDetails = {
                    task_id: response.task_id,
                    task_status: response.status,
                    assigned_to_name: response.assigned_to_name,
                    due_date: response.due_date,
                    id: rowData.id,
                    status: dropdownColumn?.options?.find((opt) => opt.toLowerCase() === "tasks".toLowerCase()) || "Tasks",
                }
                onSuccess?.(updatedTaskDetails); // Trigger the success callback with the updated task details
                handleActionClick("Create Task"); // Call the handleActionClick function with "Create Task" action

            }
        } catch (error) {
            console.error("❌ Failed to create task:", error); // Log the error
        }
    };


    // Helper function to determine the payload for the action
    const getActionPayload = (action: string) => {
        const dropdownColumn = dropdownColumns.find((col) => col.accessor === "status");
        if (action === "Send for Review") {
            return {
                id: rowData.id,
                status: dropdownColumn?.options?.find((opt) => opt.toLowerCase() === "in review".toLowerCase()) || "In Review",
            };
        }
        if (action === "Request Changes") {
            return {
                id: rowData.id,
                status: dropdownColumn?.options?.find((opt) => opt.toLowerCase() === "in reedit".toLowerCase()) || "In reedit",
                review_comment: reviewComment, // Use the reviewComment state
            };
        }
        if (action === "Approve") {
            return {
                id: rowData.id,
                status: dropdownColumn?.options?.find((opt) => opt.toLowerCase() === "approved".toLowerCase()) || "Approved",
            };
        }
        if (action === "Create Task") {
            return {
                id: rowData.id,
                status: dropdownColumn?.options?.find((opt) => opt.toLowerCase() === "tasks".toLowerCase()) || "Tasks",
            };
        }
        return {};
    };


    // Handle button click
    const handleActionClick = async (action: string) => {
        try {
            const payload = getActionPayload(action); // Pass the action to getActionPayload
            console.log(`Payload for ${action}:`, payload);

            // Call the upsertContent function with the payload
            const result = await upsertContent(payload);

            console.log(`${action} action performed for row:`, result);

            // Trigger the success callback and pass the API result to the parent
            if (onSuccess) {
                onSuccess(result); // Pass the API result to the parent
            }

            setReviewComment(""); // Reset reviewComment after successful action
        } catch (error) {
            console.error(`Error performing ${action} action for row:`, error);

            // Trigger the error callback if provided
            if (onError) {
                onError(error);
            }
        }
    };



    const handleReviewCommentChange = (value: string) => {
        console.log("Review comment updated:", value);
        setReviewComment(value); // Update the reviewComment state
    };


    return (
        <div className="text-[14px] bg-gray-50 p-4 rounded-md mt-1">
            {(rowData?.status?.toLowerCase() === "working" || rowData?.status?.toLowerCase() === "in reedit") && (
                <button
                    onClick={() => handleActionClick("Send for Review")}
                    className={`px-4 py-2 rounded-md ${isActionEnabled ? "bg-blue-500 text-white hover:bg-blue-600" : "bg-gray-300 text-gray-500 cursor-not-allowed"
                        }`}
                    disabled={!isActionEnabled} // Disable the button if any field in rowData is empty
                >
                    Send for Review
                </button>
            )}
            {rowData?.status?.toLowerCase() === "in review".toLowerCase() && (
                <div>
                    {!isActionEnabled && (
                        <div className="text-red-500 mb-4">
                            Please fill in the following fields: {getMissingFields().join(", ")}
                        </div>
                    )}
                    <div className="flex flex-col">
                        <SmartInputBox
                            value={reviewComment} // Use the reviewComment state
                            isTextarea={true}
                            rows={2}
                            maxHeight="3 rows"
                            autoExpand={true}
                            overflowBehavior="toggle"
                            onChange={handleReviewCommentChange} // Update the reviewComment state on change
                        />
                    </div>
                    <div className="flex gap-4 mt-4">
                        <button
                            onClick={() => handleActionClick("Request Changes")}
                            className={`px-4 py-2 rounded-md ${reviewComment.trim() !== "" && isActionEnabled
                                ? "bg-blue-500 text-white hover:bg-blue-600"
                                : "bg-gray-300 text-gray-500 cursor-not-allowed"
                                }`}
                            disabled={reviewComment.trim() === "" || !isActionEnabled} // Enable only if reviewComment is entered and action is enabled
                        >
                            Request Changes
                        </button>
                        <button
                            onClick={() => handleActionClick("Approve")}
                            className={`px-4 py-2 rounded-md ${reviewComment.trim() === "" && isActionEnabled
                                ? "bg-blue-500 text-white hover:bg-blue-600"
                                : "bg-gray-300 text-gray-500 cursor-not-allowed"
                                }`}
                            disabled={reviewComment.trim() !== "" || !isActionEnabled} // Enable only if reviewComment is empty and action is enabled
                        >
                            Approve
                        </button>
                    </div>
                </div>
            )}
            {rowData?.status?.toLowerCase() === "approved".toLowerCase() && (
                <div className="space-y-4 mb-1">
                    {/* Assigned To Dropdown */}
                    <div className="grid grid-cols-3 gap-4">
                        {/* Assigned To Dropdown */}
                        <div>
                            <SmartDropdown
                                options={assignedToOptions || []}
                                value={assignedTo}
                                onChange={(value: string) => setAssignedTo(value)}
                                placeholder="Select a person"
                                label="Assigned To"
                                required={true}
                                baseButtonClassName="px-2 py-2 text-left text-sm overflow-hidden bg-[#F9FAFB] rounded-md"
                            />
                        </div>

                        {/* Due Date Selector */}
                        <div>
                            <SmartDaySelector
                                buttonClassName="border-none rounded-md px-2 py-2 bg-[#F9FAFB]"
                                value={dueDate || null}
                                onChange={(selectedDate: Date | null) => {
                                    setdueDate(selectedDate || undefined);
                                }}
                                showApplyButton={false}
                                label="Due Date"
                                required={true}
                            />
                        </div>

                        {/* Review Required Toggle */}
                        <div>
                            <label className="text-sm font-sm">
                                Review Required <span className="text-red-500">*</span>
                            </label>
                            <div className="mt-1" />
                            <SmartToggleSwitch
                                checked={isReviewRequired}
                                onChange={(checked: boolean) => setIsReviewRequired(checked)}
                                label="Yes"
                            />
                        </div>

                    </div>

                    {/* Add Checklist */}
                    <div className="flex flex-col">
                        <div className="flex items-center space-x-1">
                            <h3 className="text-sm font-sm">Checklists</h3>
                            <span className="text-red-500">*</span>
                        </div>
                        <div className="mt-1">
                            <AddChecklist
                                onAdd={(newChecklistNames: string) => {
                                    console.log("🆕 New Checklist Names Received:", newChecklistNames);
                                    // Delay the state update to avoid triggering it during rendering
                                    setTimeout(() => {
                                        setChecklistNames(newChecklistNames);
                                    }, 0);
                                }}
                            />
                        </div>
                    </div>

                    {/* Create Task Button */}
                    <button
                        onClick={() => handleSubmit()}
                        className={`px-4 py-2 rounded-md ${isActionEnabled && assignedTo && dueDate && checklistNames
                            ? "bg-blue-500 text-white hover:bg-blue-600"
                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                            }`}
                        disabled={!isActionEnabled || !assignedTo || !dueDate || !checklistNames} // Enable only if all fields are valid
                    >
                        Create Task
                    </button>
                </div>
            )}
        </div>
    );
};

export default TakeActions;
