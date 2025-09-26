import { useState, useEffect } from "react";
import { AppModal } from "@/components/custom-ui/app-modal"; // Import AppModal
import SmartInputBox from "../custom-ui/input-box";
import SmartDropdown from "../custom-ui/dropdown"; // Import SmartDropdown
import SmartDaySelector from "../custom-ui/dayselectcalendar"; // Correct import for SmartDaySelector
import SmartToggleSwitch from "../custom-ui/toggleswitch"; // Import SmartToggleSwitch
import { useUser } from "@/hooks/usercontext"; // Import user context
import AddChecklist from "../tasks/addchecklist"; // Import AddChecklist component
import { createTask } from "@/lib/tasks/task";


interface TaskCreateProps {
    checklistId?: number; // Optional checklist ID for subtasks
    onClose: () => void; // Function to close the modal
    onSubmit: (payload: any) => Promise<void>; // Function to handle API submission
}

const TaskCreate: React.FC<TaskCreateProps> = ({ checklistId, onClose, onSubmit }) => {
    const [taskName, setTaskName] = useState("");
    const [dueDate, setDueDate] = useState<Date | null>(null); // State for due date
    const [assignedTo, setAssignedTo] = useState("");
    const [isReviewRequired, setIsReviewRequired] = useState(false); // State for toggle switch
    const [description, setDescription] = useState("");
    const [checklistNames, setChecklistNames] = useState<string>(""); // State to store checklist names
    const [isFormValid, setIsFormValid] = useState(false);

    console.log("✅ Checklist ID:", checklistId);
    // Fetch user context
    const { user } = useUser(); // Get the user object from the hook

    // Map people to dropdown options
    const assignedToOptions = user?.people.map((person: { employee_id: number; username: string }) => ({
        value: person.employee_id.toString(), // Use employee_id as the value
        label: person.username, // Use username as the label
    }));

    const handleSubmit = async () => {
        const payload = {
            task_name: taskName,
            due_date: dueDate ? dueDate.toISOString().split("T")[0] : "", // Format Date to YYYY-MM-DD
            assigned_to: parseInt(assignedTo, 10), // Convert assignedTo to a number
            is_review_required: isReviewRequired,
            description: description,
            checklist_names: checklistNames.split(",").map(name => name.trim()), // Convert checklistNames to an array
            ...(checklistId && checklistId > 0 && { checklist_id: checklistId }), // Include checklist_id only if it's greater than 0
        };

        try {
            console.log("final payload:", payload);
            const response = await createTask(payload); // Call the API submission function
            console.log("✅ Task successfully created."); // Log success message
            await onSubmit(response);
            onClose(); // Close the modal after submission
        } catch (error) {
            console.error("❌ Failed to create task:", error); // Log the error
        }
    };

    const validateForm = () => {
        const isTaskNameValid = taskName.trim().length > 0;
        const isDescriptionValid = description.trim().length > 0;
        const isChecklistNamesValid = checklistNames.split(",").filter(name => name.trim().length > 0).length > 0;
        const isDueDateValid = dueDate instanceof Date && !isNaN(dueDate.getTime());
        const isAssignedToValid = assignedTo.trim().length > 0;
        const isChecklistIdValid = checklistId ? checklistId > 0 : true; // Only validate if it's a subtask


        const isValid = isTaskNameValid && isDescriptionValid && isChecklistNamesValid && isDueDateValid && isAssignedToValid && isChecklistIdValid;
        setIsFormValid(isValid);
    };

    useEffect(() => {
        validateForm();
    }, [taskName, description, checklistNames, dueDate, assignedTo, checklistId]);

    return (
        <AppModal
            open={true}
            title={checklistId ? "Create Subtask" : "Create Task"} // Dynamic title
            onClose={onClose}
        >
            <div className="space-y-4">
                {/* Task Name */}
                <SmartInputBox
                    value={taskName}
                    onChange={(value: string) => setTaskName(value)}
                    label="Task Name"
                    required={true}
                    charLimit={60}
                    isTextarea={true}
                    autoExpand={true}
                    rows={1}
                    placeholder="Enter task name"
                />

                {/* Due Date */}
                <SmartDaySelector
                    value={dueDate} // Pass the current dueDate state
                    onChange={(value: Date | null) => setDueDate(value)} // Update dueDate state
                    label="Due Date"
                    required={true}
                    showApplyButton={false}
                />

                {/* Assigned To */}
                <SmartDropdown
                    options={assignedToOptions || []}
                    value={assignedTo}
                    onChange={(value: string) => setAssignedTo(value)}
                    placeholder="Select a person"
                    label="Assigned To"
                    required={true}
                />

                {/* Review Required Toggle */}
                <SmartToggleSwitch
                    checked={isReviewRequired} // Pass the current toggle state
                    onChange={(checked: boolean) => setIsReviewRequired(checked)} // Update toggle state
                    label="Review Required"
                />

                {/* Description */}
                <SmartInputBox
                    value={description}
                    onChange={(value: string) => setDescription(value)}
                    label="Description"
                    required={true}
                    rows={1}
                    placeholder="Enter task description"
                    autoExpand={true}
                    maxHeight="4 rows"
                    isTextarea={true}
                    overflowBehavior="toggle"
                />

                {/* Add Checklist */}
                <div className="flex flex-col">
                    <div className="flex items-center space-x-1">
                        <h3 className="text-sm font-semibold">Checklists</h3>
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


                {/* Submit Button */}
                <button
                    onClick={handleSubmit}
                    disabled={!isFormValid} // Disable button if form is not valid
                    className={`w-full py-2 px-4 rounded-md text-white ${isFormValid ? "bg-blue-500 hover:bg-blue-600" : "bg-gray-400 cursor-not-allowed"
                        }`}                >
                    Submit
                </button>
            </div>
        </AppModal>
    );
};

export default TaskCreate;