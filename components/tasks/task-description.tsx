import { useUser } from "@/hooks/usercontext"; // Import UserContext
import { useState, useEffect } from "react";
import { updateTaskDetails } from "@/lib/tasks/task"; // Import the API function
import SmartInputBox from "@/components/custom-ui/input-box"; // Import SmartInputBox component

export default function TaskDescription({
  description,
  task,
  setTask,
}: {
  description: string;
  task: any;
  setTask: React.Dispatch<React.SetStateAction<any>>;
}) {
  const { user } = useUser(); // Load user data from UserContext
  const [newDescription, setNewDescription] = useState(description); // State for the updated description

  // Update local state when the prop changes
  useEffect(() => {
    setNewDescription(description);
  }, [description]);

  // Check if the task type is "Review"
  const isReviewTask = task.task_type === "Review";

  // Check if the logged-in user can edit the description
  // If it's a review task, don't allow editing regardless of user permissions
  const canEditFields = 
    !isReviewTask && 
    user?.employee_id === task.created_by;

  const handleSave = async () => {
    try {
      const payload = { task_id: task.task_id, description: newDescription };
      const updatedTask = await updateTaskDetails(payload); // Update the description via API
      setTask((prevTask: any) => ({ ...prevTask, description: updatedTask.updated_fields.description })); // Update the task state
    } catch (err) {
      console.error("Failed to update description:", err);
    }
  };

  return (
    <div>
      {/* <h3 className="text-lg font-semibold mb-2">Description</h3> */}
      {canEditFields ? (
        // If the user has permission to edit, show the SmartInputBox
        <SmartInputBox
          value={newDescription}
          onChange={(value: string) => setNewDescription(value)} // Update the description
          onChangeComplete={handleSave} // Save when editing is complete
          required={true}
          rows={3} // Use multiple rows for the description
          isTextarea={true}
          enableLink={true}
          autoExpand={true}
          maxHeight="7 rows"
          overflowBehavior="scroll"
          placeholder="Edit task description"
          textareaClassName="bg-transparent border p-4 w-full resize-none rounded-md min-h-[60px] border-[#dfdfdf] focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      ) : (
        // If the user does not have permission or it's a review task, display the description as plain text
        <SmartInputBox
          value={task.description || "No Description provided."} // Display output or fallback text
          onChange={() => {}} // No-op for read-only mode
          rows={3} // Set the number of rows
          enableLink={true}
          readOnly={true} // Make the input read-only
          maxHeight="3 rows" // Optional: Set a max height
          isTextarea={true} // Use textarea for multi-line input
          overflowBehavior="toggle" // Toggle overflow behavior
          autoExpand={true} // Enable auto-expansion
        />
        // <p>
        //   {description || "No description available."}
        // </p>
      )}
      
    </div>
  );
}