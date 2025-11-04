import { useUser } from "@/hooks/usercontext"; // Import UserContext
import { useState } from "react";
import { updateTaskDetails } from "@/lib/tasks/task"; // Import the API function
import SmartInputBox from "@/components/custom-ui/input-box"; // Import SmartInputBox

export default function TaskOutput({ task, setTask }: { task: any; setTask: React.Dispatch<React.SetStateAction<any>> }) {
  const { user } = useUser(); // Load user data from UserContext
  const [newOutput, setNewOutput] = useState(task.output || ""); // State for the updated output

  const canEditFields = 
    task.task_type?.toLowerCase() === "normal" && user?.employee_id === task.assigned_to; // Check if the user can edit

  const handleSave = async () => {
    try {
      const payload = { task_id: task.task_id, output: newOutput }; // Send output as payload
      const updatedTask = await updateTaskDetails(payload); // Update the output via API
      setTask((prevTask: any) => ({ ...prevTask, output: updatedTask.updated_fields.output })); // Update the task state
    } catch (err) {
      console.error("Failed to update output:", err);
    }
  };

  return (
     <div >
      
      {canEditFields  ? (
        <SmartInputBox
          value={newOutput}
          onChange={(value: string) => setNewOutput(value)} // Update the new output
          onChangeComplete={handleSave} // Save on blur or Enter
          placeholder="Enter output here..."
          enableLink={true}
          rows={3} // Set the number of rows
          maxHeight="4 rows" // Optional: Set a max height
          isTextarea={true} // Use textarea for multi-line input
          overflowBehavior="toggle" // Toggle overflow behavior
          autoExpand={true} // Enable auto-expansion
        />
      ) : (
        <SmartInputBox
          value={task.output || "No output provided."} // Display output or fallback text
          onChange={() => {}} // No-op for read-only mode
          rows={3} // Set the number of rows
          readOnly={true} // Make the input read-only
          enableLink={true}
          maxHeight="4 rows" // Optional: Set a max height
          isTextarea={true} // Use textarea for multi-line input
          overflowBehavior="scroll" // Toggle overflow behavior
          autoExpand={true} // Enable auto-expansion
        />
      )}
    </div>
  );
}