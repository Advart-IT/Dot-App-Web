import React, { useState, useRef } from "react";
import AddChecklist from "@/components/tasks/addchecklist";
import { addChecklist, sendForReview, updateTaskDetails } from "@/lib/tasks/task";
import { AppModal } from "@/components/custom-ui/app-modal"; // Import AppModal
import SmartDropdown from "@/components/custom-ui/dropdown";
import { useUser } from "@/hooks/usercontext"; // Import user context



interface TaskReviewProps {
    task: any; // Replace `any` with the appropriate type for task details if available
    setTask: (updatedTask: any) => void; // Callback to update the task in the parent component
}


const TaskReview: React.FC<TaskReviewProps> = ({ task, setTask }) => {
    const [checklistNames, setChecklistNames] = useState<string>(""); // State to store checklist names
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false); // State to control modal visibility
    const [assignedTo, setAssignedTo] = useState<string>(""); // State for assigned person
    const addChecklistRef = useRef<{ reset: () => void } | null>(null); // Create a ref for AddChecklist with proper type
    const [isReviewRequired, setIsReviewRequired] = useState(task?.is_reviewed || false); // State for review requirement
    // Fetch user context
    const { user } = useUser(); // Get the user object from the hook

    // Map people to dropdown options
    const assignedToOptions = user?.people.map((person: { employee_id: number; username: string }) => ({
        value: person.employee_id.toString(), // Use employee_id as the value
        label: person.username, // Use username as the label
    }));

    const sendChecklistToAPI = async () => {
        try {
            const checklistArray = checklistNames.split(",").map((name) => name.trim()); // Convert to an array
            const taskId = task?.task_id || null; // Include task ID if available

            if (!taskId) {
                console.error("Task ID is required to add checklists.");
                return;
            }

            const payload = {
                task_id: taskId,
                checklist_names: checklistArray, // Pass the array of checklist names
            };

            console.log("Payload to send:", payload);

            // Call the addChecklist API
            const response = await addChecklist(payload);

            if (response) {
                console.log("Checklists successfully added.");
                console.log("Response:", response);

                setTask((prevTask: any) => ({
                    ...prevTask, // Spread the previous task object to retain other properties
                    is_reviewed: response.is_reviewed, // Update the is_reviewed field
                    status: response.status, // Update the status field
                    checklist_progress: response.checklist_progress, // Update the checklist_progress field
                }));

                // Reset checklistNames in TaskReview
                setChecklistNames("");

                // Reset the view in AddChecklist
                if (addChecklistRef.current) {
                    console.log("🔄 Resetting AddChecklist component...");
                    addChecklistRef.current.reset();
                }

            } else {
                console.error("Failed to add checklists.");
            }
        } catch (error) {
            console.error("Error sending checklist to the API:", error);
        }
    };


    const handleSendForApproval = async () => {
        try {
            if (!task?.task_id || !assignedTo) {
                console.error("Task ID and Assigned To are required to send for approval.");
                return;
            }

            const payload = {
                task_id: task.task_id,
                assigned_to: Number(assignedTo), // Convert assignedTo to a number
            };

            console.log("Sending for approval with payload:", payload);

            // Call the sendForReview API
            const response = await sendForReview(payload);

            if (response) {
                console.log("✅ Task successfully sent for approval.");
                setIsModalOpen(false); // Close the modal on success
            } else {
                console.error("❌ Failed to send task for approval.");
            }
        } catch (error) {
            console.error("Error sending task for approval:", error);
        }
    };

    const handleToggleReview = async () => {
        try {
            const payload = {
                task_id: task.task_id,
                is_reviewed: !isReviewRequired, // Toggle the review status
            };

            console.log("Updating review status with payload:", payload);

            // Call the updateTaskDetails API
            const response = await updateTaskDetails(payload);

            if (response && response.updated_fields?.is_reviewed !== undefined) {
                console.log("✅ Review status updated successfully.");
                const updatedReviewStatus = response.updated_fields.is_reviewed; // Get the updated review status from the response
                const updatedStatus = response.status; // Get the updated status from the response

                setIsReviewRequired(updatedReviewStatus); // Update the local state based on the response
                // Update the task state
                setTask((prevTask: any) => ({
                    ...prevTask,
                    is_reviewed: updatedReviewStatus, // Update the is_reviewed field in the task state
                    status: updatedStatus, // Update the status field in the task state
                }));
            } else {
                console.error("❌ Failed to update review status. Reverting to the previous state.");
                // Optionally, show an error message to the user
            }
        } catch (error) {
            console.error("Error updating review status:", error);
            // Optionally, show an error message to the user
        }
    };



    return (
        <div className={`${(task.status === "To_Do" && task.is_ongoing) || !(task.status == "To_Do") ? "" : "pointer-events-none opacity-50"}`}>
            <div className={!(task.status === "In_Review") ? "" : "pointer-events-none opacity-50"}>
                <div className="space-y-4">
                    {/* Add Checklist Component */}
                    {(task.status === "To_Do" || task.status === "In_Progress" || task.status === "In_ReEdit") && ( // Render AddChecklist only if task.is_reviewed is false
                        <div className="w-full p-4 border rounded-md">
                            <AddChecklist
                                ref={addChecklistRef} // Pass the ref to AddChecklist
                                onAdd={(newChecklistNames: string) => {
                                    console.log("🆕 New Checklist Names Received:", newChecklistNames);
                                    setTimeout(() => {
                                        setChecklistNames(newChecklistNames);
                                    }, 0);
                                }}
                            />

                            {/* Tip for adding checklists */}
                            <p className="mt-3 text-sm text-[#707070]">
                                Pro Tip: Don’t just drop a checklist – paint a picture! Be clear, be specific, and cover all the bases. Fewer follow-ups = happier teammates. 😉
                            </p>
                        </div>
                    )}

                    {/* Show message based on task.is_reviewed */}
                    {task.is_reviewed ? (
                        <p className="text-[#707070] text-sm">
                            Reminder: To add checklists or make changes, unapprove this task first.
                        </p>
                    ) : (
                        !checklistNames &&
                        (task.status === "To_Do" || task.status === "In_Progress" || task.status === "In_ReEdit") && (
                            <p className="text-[#707070] text-sm">
                                To request changes, make sure you've added at least one checklist to guide the task owner.
                            </p>
                        )
                    )}

                    {/* Buttons Row */}
                    <div className="flex space-x-4">
                        {/* Request Changes Button */}
                        <button
                            onClick={sendChecklistToAPI}
                            disabled={!checklistNames || task.status === "In_Review" || task.status === "Completed"} // Disable if no checklist is added, task.is_reviewed is true, or task.status is "In_ReEdit"
                            className={`flex px-4 py-2 rounded-md text-white ${!checklistNames || task.status === "In_Review" || task.status === "Completed"
                                ? "bg-gray-300 cursor-not-allowed"
                                : "bg-[#303030] hover:bg-gray-600"
                                }`}
                        >
                            Request Changes
                        </button>

                        {/* Conditional Rendering for Send for Approval and Approve/Revoke Buttons */}
                        {task.last_review && (
                            <>
                                {/* Send for Approval Button */}
                                <button
                                    onClick={() => setIsModalOpen(true)} // Open the modal on button click
                                    disabled={!!checklistNames || !!task.is_reviewed || task.status === "In_ReEdit"} // Disable if checklistNames exist, task.is_reviewed is true, or task.status is "In_ReEdit"
                                    className={`flex px-4 py-2 bg-blue-500 text-white rounded-md ${!!checklistNames || !!task.is_reviewed || task.status === "In_ReEdit"
                                        ? "bg-gray-300 cursor-not-allowed"
                                        : "hover:bg-blue-600"
                                        }`}
                                >
                                    Send for Approval
                                </button>

                                {/* Approve/Revoke Button */}
                                <button
                                    onClick={handleToggleReview} // Call the toggle function
                                    disabled={!!checklistNames || task.status === "In_ReEdit"} // Disable if checklistNames exist or task.status is "In_ReEdit"
                                    className={`flex px-4 py-2 rounded-md text-white ${isReviewRequired
                                        ? !!checklistNames || task.status === "In_ReEdit"
                                            ? "bg-gray-300 cursor-not-allowed"
                                            : "bg-red-500 hover:bg-red-600"
                                        : !!checklistNames || task.status === "In_ReEdit"
                                            ? "bg-gray-300 cursor-not-allowed"
                                            : "bg-green-500 hover:bg-green-600"
                                        }`}
                                >
                                    {isReviewRequired ? "Revoke Approval" : "Approve"} {/* Toggle button text */}
                                </button>
                            </>
                        )}
                    </div>

                    {/* Approval Modal */}
                    {isModalOpen && (
                        <AppModal
                            open={isModalOpen}
                            title="Send for Approval"
                            onClose={() => setIsModalOpen(false)} // Close the modal
                        >
                            <div className="space-y-4">
                                <p>🚫 Heads Up: Once you send this for approval, you won’t be able to mark it as completed – only the approver can close this task.</p>

                                {/* Assigned To Dropdown */}
                                <SmartDropdown
                                    options={assignedToOptions || []} // Pass the dropdown options
                                    value={assignedTo} // Pass the current assignedTo state
                                    onChange={(value: string) => setAssignedTo(value)} // Update assignedTo state
                                    placeholder="Select a person"
                                    label="Assigned To"
                                    required={true}
                                />

                                {/* Send for Approval Button */}
                                <button
                                    onClick={handleSendForApproval} // Call the API on button click
                                    disabled={!assignedTo} // Disable if no person is selected
                                    className={`mt-4 w-full py-2 px-4 rounded-md text-white ${assignedTo
                                        ? "bg-blue-500 hover:bg-blue-600"
                                        : "bg-gray-300 cursor-not-allowed"
                                        }`}
                                >
                                    Confirm and Send for Approval
                                </button>
                            </div>
                        </AppModal>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TaskReview;