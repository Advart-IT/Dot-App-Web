import { useUser } from "@/hooks/usercontext";
import React, { useState, useEffect } from "react";
import { updateTaskDetails } from "@/lib/tasks/task";
import { LinkifiedInputBox, LinkifiedTextSafe } from "@/lib/utils/linkify";

interface TaskOutputProps {
  task: any;
  setTask: React.Dispatch<React.SetStateAction<any>>;
}

export default function TaskOutput({ task, setTask }: TaskOutputProps) {
  const { user } = useUser();
  const [newOutput, setNewOutput] = useState(task.output || "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync newOutput with task.output when task changes
  useEffect(() => {
    setNewOutput(task.output || "");
  }, [task.output]);

  const canEditFields =
    task.task_type?.toLowerCase() === "normal" &&
    user?.employee_id === task.assigned_to;

  const handleSave = async () => {
    // Don't save if nothing changed
    if (newOutput === task.output) return;

    setIsSaving(true);
    setError(null);

    try {
      const payload = { task_id: task.task_id, output: newOutput };
      const updatedTask = await updateTaskDetails(payload);
      
      setTask((prevTask: any) => ({
        ...prevTask,
        output: updatedTask.updated_fields.output,
      }));
    } catch (err) {
      console.error("Failed to update output:", err);
      setError("Failed to save changes. Please try again.");
      // Revert to original value on error
      setNewOutput(task.output || "");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-2">
      {canEditFields ? (
        <>
          <LinkifiedInputBox
            value={newOutput}
            onChange={setNewOutput}
            onChangeComplete={handleSave}
            placeholder="Enter output details..."
            minHeight="80px"
            className="transition-opacity"
          />
          {isSaving && (
            <p className="text-sm text-gray-500 italic">Saving...</p>
          )}
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
        </>
      ) : (
        <div className="border rounded-md p-3 bg-gray-50 min-h-[80px]">
          {task.output ? (
            <LinkifiedTextSafe text={task.output} />
          ) : (
            <span className="text-gray-400">No output provided.</span>
          )}
        </div>
      )}
    </div>
  );
}