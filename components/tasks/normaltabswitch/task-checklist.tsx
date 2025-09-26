import { useUser } from "@/hooks/usercontext"; // Import UserContext
import { useState, useRef, useEffect } from "react";
import { updateChecklist, deleteTaskOrChecklist, markChecklistComplete } from "@/lib/tasks/task"; // Import the API functions
import { Trash2, Plus } from "lucide-react"; // Import icons
import { AppModal } from "@/components/custom-ui/app-modal"; // Import AppModal
import TaskCreate from "@/components/tasks/task-create"; // Import TaskCreate component as a default export
import SmartCheckbox from "@/components/custom-ui/checkbox"; // Import SmartCheckbox
import SmartInputBox from "@/components/custom-ui/input-box"; // Import SmartInputBox
import AddChecklist from "@/components/tasks/addchecklist";
import TaskCardGrid from "@/components/tasks/task-card";


// Define a type for subtasks if not already defined
interface Subtask {
    task_id: string;
    task_name: string;
    due_date: string;
    status: string;
    assigned_to_name: string;
    created_by_name: string;
}

export default function TaskChecklist({
    checklists,
    task,
    setTask,
}: {
    checklists: any[];
    task: any;
    setTask: React.Dispatch<React.SetStateAction<any>>;
}) {
    const { user } = useUser(); // Load user data from UserContext
    const [isEditing, setIsEditing] = useState<number | null>(null); // Track which checklist is being edited
    const [newChecklistName, setNewChecklistName] = useState(""); // State for the updated checklist name
    const [showModal, setShowModal] = useState(false); // State to control modal visibility
    const [selectedChecklistId, setSelectedChecklistId] = useState<number | null>(null); // Track the checklist to delete
    const [cannotDeleteMessage, setCannotDeleteMessage] = useState<string | null>(null); // Message for when deletion is not allowed
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
    const [showTaskCreateModal, setShowTaskCreateModal] = useState(false); // State to control TaskCreate modal
    const [selectedChecklistIdForTask, setSelectedChecklistIdForTask] = useState<number | null>(null);
    const [showConfirmationModal, setShowConfirmationModal] = useState(false); // State to control the confirmation modal
    const [confirmationChecklistId, setConfirmationChecklistId] = useState<number | null>(null); // Track the checklist ID for confirmation
    const [confirmationIsCompleted, setConfirmationIsCompleted] = useState<boolean>(false); // Track the completion status for confirmation


    // Check if the user can edit or delete a checklist
    const canEditFields = (checklist: any) => {
        return (
            user?.employee_id === task.created_by || // Task creator can edit/delete all checklists
            (user?.employee_id === task.assigned_to && user?.employee_id === checklist.created_by) // Task assignee can edit/delete their own checklists
        );
    };

    const canAddSubTasks = () => {
        return (
            user?.employee_id === task.created_by || // Task creator can edit/delete all checklists
            user?.employee_id === task.assigned_to   // Task assignee can edit/delete their own checklists
        );
    };


    const handleSave = async (checklistId: number) => {
        try {
            // Check if the new checklist name is empty
            if (!newChecklistName.trim()) {
                console.warn("⚠️ Checklist name is empty. Retaining the previous value.");
                setNewChecklistName(
                    checklists.find((checklist) => checklist.checklist_id === checklistId)?.checklist_name || ""
                ); // Reset to the original value
                setIsEditing(null); // Exit edit mode without making changes
                return;
            }

            const payload = { checklist_id: checklistId, checklist_name: newChecklistName };
            const updatedChecklist = await updateChecklist(payload); // Update the checklist via API

            // Update the checklist in the task state
            setTask((prevTask: any) => ({
                ...prevTask,
                checklists: prevTask.checklists.map((checklist: any) =>
                    checklist.checklist_id === checklistId
                        ? { ...checklist, checklist_name: updatedChecklist.checklist_name } // Use updated_checklist_name from API response
                        : checklist
                ),
            }));

            setIsEditing(null); // Exit edit mode
        } catch (err) {
            console.error("Failed to update checklist:", err);
        }
    };

    const handleDelete = async () => {
        if (selectedChecklistId === null) return;

        try {
            const payload = { checklist_id: selectedChecklistId };
            await deleteTaskOrChecklist(payload); // Trigger the delete API

            // Remove the deleted checklist from the task state
            setTask((prevTask: any) => ({
                ...prevTask,
                checklists: prevTask.checklists.filter(
                    (checklist: any) => checklist.checklist_id !== selectedChecklistId
                ),
            }));

            setShowModal(false); // Close the modal
            setSelectedChecklistId(null); // Reset the selected checklist ID
        } catch (err) {
            console.error("Failed to delete checklist:", err);
        }
    };

    const handleDeleteClick = (checklistId: number) => {
        if (checklists.length === 1) {
            // If only one checklist is left, show a message
            setCannotDeleteMessage("A task needs at least one checklist. Please add another checklist before deleting this one.");
            setShowModal(true); // Show the modal with the message
        } else {
            // Allow deletion
            setSelectedChecklistId(checklistId); // Set the checklist ID to delete
            setCannotDeleteMessage(null); // Clear any previous message
            setShowModal(true); // Show the confirmation modal
        }
    };


    const handleChecklistStatusChange = async (checklistId: number, isCompleted: boolean) => {
        try {
            // Filter editable checklists
            const editableChecklists = task.checklists.filter((item: any) => item.checkbox_status);

            // Check if the current checklist is the only incomplete one
            const incompleteChecklists = editableChecklists.filter((item: any) => !item.is_completed);
            const isLastStatusChangeChecklist = incompleteChecklists.length === 1 && incompleteChecklists[0].checklist_id === checklistId;

            // If the task is going to be complete and this is the last status change checklist, show the confirmation modal
            if (isLastStatusChangeChecklist && isCompleted) {
                setConfirmationChecklistId(checklistId); // Set the checklist ID for confirmation
                setConfirmationIsCompleted(isCompleted); // Set the completion status for confirmation
                setShowConfirmationModal(true); // Show the confirmation modal
                return; // Exit the function until the user confirms
            }

            // Proceed with marking the checklist as complete
            await updateChecklistStatus(checklistId, isCompleted);
        } catch (err) {
            console.error("Failed to update checklist status:", err);
        }
    };

    const updateChecklistStatus = async (checklistId: number, isCompleted: boolean) => {
        try {
            const payload = { checklist_id: checklistId, is_completed: isCompleted };
            const response = await markChecklistComplete(payload); // Call the API to update the status

            // Update the task state with the new status, checklist progress, and checklist completion
            setTask((prevTask: any) => ({
                ...prevTask,
                status: response.status, // Update the task status
                checklist_progress: response.checklist_progress, // Update the checklist progress
                checklists: prevTask.checklists.map((item: any) =>
                    item.checklist_id === checklistId
                        ? { ...item, is_completed: isCompleted } // Update the specific checklist's completion status
                        : item
                ),
            }));
        } catch (err) {
            console.error("Failed to update checklist status:", err);
        }
    };


    const handleAddChecklist = (newChecklist: any) => {
        console.log("➡️ Adding New Checklist...");
        console.log("📝 Incoming API Response:", newChecklist);

        setTask((prevTask: any) => {
            console.log("🔄 Previous Task State:", prevTask);

            // Extract the new checklists from the API response
            const newChecklists = newChecklist.checklists.map((checklist: any) => ({
                ...checklist,
                is_completed: checklist.is_completed || false, // Ensure is_completed is set
                checkbox_status: true, // Ensure checkbox is enabled by default
                created_by_name: newChecklist.checklist_created_by_name || user?.username, // Use the name of the current user if not provided
            }));

            // Create a new array for checklists by appending the new ones
            const updatedChecklists = [...prevTask.checklists, ...newChecklists];

            // Update the task state with the new checklists, status, and checklist progress
            const updatedTask = {
                ...prevTask,
                checklists: updatedChecklists, // Use the new array reference
                status: newChecklist.status, // Update the task status from the API response
                checklist_progress: newChecklist.checklist_progress, // Update the checklist progress from the API response
            };

            console.log("✅ Updated Task State:", updatedTask);
            return updatedTask;
        });

        console.log("✅ Checklist Addition Complete.");
    };

    const handleFocusInput = (e: React.MouseEvent<HTMLDivElement>) => {
        if (inputRef.current) {
            console.log("✅ Focusing on the input/textarea");
            inputRef.current.focus();
        } else {
            console.log("⚠️ Click ignored due to exempt element");
        }
    };

    const handleAddSubtaskToChecklist = (checklistId: number | null, subtask: any) => {
        if (!checklistId) {
            console.warn("⚠️ No valid checklist ID provided. Aborting subtask addition.");
            return; // Ensure a valid checklist ID is provided
        }

        console.log(`➡️ Attempting to add subtask to checklist with ID: ${checklistId}`);
        console.log("📝 Subtask details received:", subtask);

        setTask((prevTask: any) => {
            console.log("🔄 Previous Task State before adding subtask:", prevTask);

            const updatedTask = {
                ...prevTask,
                checklists: prevTask.checklists.map((checklist: any) =>
                    checklist.checklist_id === checklistId
                        ? {
                            ...checklist,
                            is_completed: subtask.is_completed || false, // Reset the checklist completion status
                            checkbox_status: subtask.checkbox_status, // Update the checkbox status from the subtask
                            subtasks: [...(checklist.subtasks || []), subtask], // Add the new subtask to the subtasks array
                        }
                        : checklist
                ),
                status: subtask.parent_task_status, // Update the task status from the subtask
                checklist_progress: subtask.parent_checklist_progress, // Update the checklist progress from the subtask
            };

            console.log("✅ Updated Task State after adding subtask:", updatedTask);
            return updatedTask;
        });

        console.log(`✅ Subtask successfully added to checklist with ID: ${checklistId}`);
    };

    const handleSubtaskDelete = (subtaskId: number, apiResponse: any) => {


        // Find the checklist ID for which this subtask exists by mapping subtaskId to task_id
        const checklistId = task.checklists.find((checklist: any) => {
            console.log(`🔍 Checking checklist ID: ${checklist.checklist_id}`);
            const subtaskExists = checklist.subtasks.some((subtask: any) => {
                console.log(`   🔍 Checking subtask task_id: ${subtask.task_id} against incoming subtaskId: ${subtaskId}`);
                return subtask.task_id === subtaskId; // Match subtaskId with task_id
            });
            console.log(`   ✅ Subtask exists in checklist: ${subtaskExists}`);
            return subtaskExists;
        })?.checklist_id;

        if (!checklistId) {
            console.warn(`⚠️ Subtask with ID: ${subtaskId} not found in any checklist.`);
            return;
        }

        console.log(`✅ Found checklist ID: ${checklistId} for subtask ID: ${subtaskId}`);

        // Now, update the task state based on the API response
        setTask((prevTask: any) => {
            console.log("🔄 Previous Task State before deleting subtask:", prevTask);

            const updatedTask = {
                ...prevTask,
                checklists: prevTask.checklists.map((checklist: any) =>
                    checklist.checklist_id === checklistId
                        ? {
                            ...checklist,
                            is_completed: false, // Reset the checklist completion status as subtask is deleted
                            checkbox_status: apiResponse.checkbox_status, // Update checkbox status from API response
                            subtasks: checklist.subtasks.filter((subtask: any) => subtask.task_id !== subtaskId), // Remove the deleted subtask from the subtasks array
                        }
                        : checklist
                ),
            };

            console.log("✅ Updated Task State after deleting subtask:", updatedTask);
            return updatedTask;
        });

        console.log(`✅ Subtask with ID: ${subtaskId} successfully deleted from checklist with ID: ${checklistId}`);
    };



    return (
        <div className={`${(task.status === "To_Do" && task.is_ongoing) || !(task.status == "To_Do") || user?.employee_id === task.created_by ? "" : "pointer-events-none opacity-50"}`}>
            <div className={!(task.status === "In_Review" || task.status === "Completed") ? "" : "pointer-events-none opacity-50"}>
                <ul className="space-y-4">
                    {checklists.map((checklist) => (
                        <li
                            key={checklist.checklist_id}
                            className="border-b pb-4"
                        >
                            <div className="flex justify-between">
                                {/* Left: Checkbox */}
                                <div className="flex-shrink-0" >
                                    <SmartCheckbox
                                        //label="Checklist Status"
                                        checked={checklist.is_completed}
                                        disabled={
                                            !checklist.checkbox_status || // Disable if checkbox_status is false
                                            (
                                                (task.status === "To_Do") && // Task is "To_Do" 
                                                (
                                                    !task.is_ongoing || // Disable if task is not ongoing
                                                    !(user?.employee_id === task.created_by || user?.employee_id === task.assigned_to) // Disable if the user is not the creator or assignee
                                                )
                                            )
                                        }

                                        className="h-5 w-5"
                                        onChange={(checked) => handleChecklistStatusChange(checklist.checklist_id, checked)} // Call the new function
                                    />
                                </div>

                                <div
                                    className={`flex-grow px-4 ${canEditFields(checklist) ? "cursor-pointer" : ""}`}
                                    onClick={(e) => {
                                        handleFocusInput(e);

                                        // Prevent focus stealing from child elements
                                        const target = e.target as HTMLElement;
                                        if (target.tagName.toLowerCase() === 'textarea' || target.tagName.toLowerCase() === 'input') {
                                            return; // Don't interfere with internal focus logic
                                        }

                                        if (canEditFields(checklist)) {
                                            setIsEditing(checklist.checklist_id);
                                            setNewChecklistName(checklist.checklist_name);

                                            // Ensure the textarea/input is focused and the cursor is at the last position
                                            setTimeout(() => {
                                                if (inputRef.current) {
                                                    const textarea = inputRef.current as HTMLTextAreaElement;

                                                    // Focus the textarea/input element
                                                    textarea.focus();

                                                    // Set the cursor to the end of the text in the input/textarea
                                                    const length = textarea.value.length;
                                                    textarea.setSelectionRange(length, length); // Place the cursor at the end
                                                }
                                            }, 0);
                                        }
                                    }}
                                >



                                    {canEditFields(checklist) && isEditing === checklist.checklist_id ? (
                                        <SmartInputBox
                                            ref={inputRef}
                                            value={newChecklistName}
                                            onChange={(value: string) => setNewChecklistName(value)} // Update the checklist name
                                            required={true}
                                            rows={1}
                                            isTextarea={true}
                                            //className="border border-gray-300 rounded-md p-2 w-full"
                                            placeholder="Edit checklist name"
                                            onChangeComplete={() => {
                                                handleSave(checklist.checklist_id);
                                            }}
                                            //inputClassName="w-full focus:outline-none"
                                            textareaClassName="w-full focus:outline-none resize-none"

                                        />
                                    ) : (
                                        <span className="text-gray-700 break-words">{checklist.checklist_name}</span>
                                    )}
                                </div>

                                {/* Right: Creator Name, Plus Icon, and Delete Icon */}
                                <div className="flex space-x-4">
                                    {/* Created By */}
                                    <span className="text-sm text-gray-500">({checklist.created_by_name})</span>

                                    <button
                                        className={`h-5 w-5 ${canAddSubTasks() && ((task.status == "To_Do" && task.is_ongoing) || !(task.status == "To_Do"))
                                            ? "text-blue-500 hover:text-blue-700"
                                            : "text-gray-300 cursor-not-allowed"
                                            }`}
                                        onClick={() => {
                                            if (canAddSubTasks()) {
                                                setSelectedChecklistIdForTask(checklist.checklist_id); // Set the checklist_id
                                                setShowTaskCreateModal(true); // Open the TaskCreate modal
                                            }
                                        }}
                                        disabled={!canAddSubTasks() || (task.status == "To_Do" && !task.is_ongoing)} // Disable the button for unauthorized users
                                    >
                                        <Plus className="h-5 w-5" />
                                    </button>

                                    {/* Delete Icon */}
                                    <button
                                        className={`h-5 w-5 ${canEditFields(checklist) && checklists.length > 1
                                            ? "text-red-500 hover:text-red-700"
                                            : "text-gray-300 cursor-not-allowed"
                                            }`}
                                        onClick={() => {
                                            if (canEditFields(checklist) && checklists.length > 1) {
                                                handleDeleteClick(checklist.checklist_id); // Trigger delete logic if allowed
                                            }
                                        }}
                                        disabled={!canEditFields(checklist) || checklists.length === 1} // Disable the button if the user has no permission or only one checklist exists
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Subtasks Section */}
                            {checklist.subtasks && checklist.subtasks.length > 0 && (
                                <div className="mt-2 bg-[#fbfbfb] p-4 rounded-md">
                                    <h3 className="text-sm font-semibold text-gray-600 mb-2">Subtasks:</h3>
                                    <TaskCardGrid taskList={checklist.subtasks} onTaskDelete={handleSubtaskDelete} />
                                </div>
                            )}
                        </li>
                    ))}
                </ul>

                {/* AddChecklist Component */}
                {task.task_type?.toLowerCase() === "normal" && (
                    <div className="mt-4">
                        <AddChecklist
                            task_id={task.task_id} // Pass the task_id to AddChecklist
                            onAdd={(newChecklist) => {
                                console.log("🆕 New Checklist Received from AddChecklist:", newChecklist); // Log the new checklist received
                                handleAddChecklist(newChecklist); // Handle the output from AddChecklist
                                console.log("✅ handleAddChecklist executed successfully."); // Log after handleAddChecklist is executed
                            }}
                        />
                    </div>
                )}

                {/* Confirmation Modal */}
                {showModal && (
                    <AppModal
                        open={showModal} // Pass the open prop
                        title={cannotDeleteMessage ? "Cannot Delete Checklist" : "Confirm Deletion"}
                        onClose={() => setShowModal(false)} // Close the modal
                        onConfirm={cannotDeleteMessage ? undefined : handleDelete} // Confirm deletion only if allowed
                    >
                        <p>
                            {cannotDeleteMessage
                                ? cannotDeleteMessage
                                : "Are you sure you want to delete this checklist?"}
                        </p>
                    </AppModal>
                )}

                {showTaskCreateModal && (
                    <AppModal
                        open={showTaskCreateModal} // Pass the open state
                        title="Create Task" // Modal title
                        onClose={() => setShowTaskCreateModal(false)} // Close the modal
                    >
                        <TaskCreate
                            checklistId={selectedChecklistIdForTask ?? undefined} // Pass the selected checklist_id or undefined
                            onClose={() => setShowTaskCreateModal(false)}
                            onSubmit={async (taskData: { task_id: string; task_name: string; due_date: string; status: string; assigned_to_name: string; created_by_name: string; }) => {
                                console.log("Task submitted:", taskData);
                                // Add your async logic here if needed
                                handleAddSubtaskToChecklist(selectedChecklistIdForTask, taskData); // Pass the subtask to the handler
                                setShowTaskCreateModal(false);
                            }}
                        />
                    </AppModal>
                )}

                {showConfirmationModal && (
                    <AppModal
                        open={showConfirmationModal}
                        title="Confirm Completion"
                        onClose={() => setShowConfirmationModal(false)} // Close the modal without proceeding
                        onConfirm={async () => {
                            if (confirmationChecklistId !== null) {
                                await updateChecklistStatus(confirmationChecklistId, confirmationIsCompleted); // Proceed with the update
                            }
                            setShowConfirmationModal(false); // Close the modal after confirmation
                        }}
                    >
                        <p>
                            {(() => {
                                const allCheckboxStatusTrue = task.checklists.every((checklist: any) => checklist.checkbox_status);
                                const someCheckboxStatusFalse = task.checklists.some((checklist: any) => !checklist.checkbox_status);

                                if (allCheckboxStatusTrue) {
                                    return (
                                        "This is the last editable checklist that you have marked as complete. If you confirm, the status will move to the next stage, and you will not be able to edit further during this stage."
                                    );
                                } else if (someCheckboxStatusFalse) {
                                    return (
                                        "This is your last editable checklist. Once the rest of the subtasks are complete, the task will automatically move to the next stage."
                                    );
                                } else {
                                    return "Are you sure you want to proceed?";
                                }
                            })()}
                        </p>
                    </AppModal>
                )}

            </div>
        </div>
    );
}
