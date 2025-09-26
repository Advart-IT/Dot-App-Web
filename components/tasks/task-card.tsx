"use client"

import { useRouter } from "next/navigation"
import TaskCard from "../custom-ui/task-card"
import { deleteTaskOrChecklist } from "@/lib/tasks/task"
import { AppModal } from "@/components/custom-ui/app-modal"
import { useState } from "react"

type TaskRow = {
  task_id: number
  task_name: string
  status: string
  due_date: string
  progress: string
  assigned_to_name: string
  created_by_name: string
  
}

interface TaskCardGridProps {
  taskList: any[];
  onSort?: (column: string, direction: "asc" | "desc") => void;
  onTaskDelete?: (taskId: number, apiResponse?: any) => void; // Updated to optionally pass the API response
  showDeleteButton?: boolean;
}

export default function TaskCardGrid({
  taskList,
  onSort,
  onTaskDelete,
  showDeleteButton = true,
}: TaskCardGridProps) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskRow | null>(null);

  const tableData: TaskRow[] = taskList.map((task) => ({
    task_id: task.task_id,
    task_name: task.task_name,
    status: task.status,
    due_date: task.due_date || "N/A",
    progress: task.checklist_progress,
    assigned_to_name: task.assigned_to_name || "Unassigned",
    created_by_name: task.created_by_name || "Unknown",
  }));

  const handleCardClick = (task: TaskRow) => {
    if (task.task_id) {
      router.push(`/tasks/${task.task_id}`);
    }
  };

  const handleTaskDelete = (task: TaskRow) => {
    setSelectedTask(task);
    setShowModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedTask) return;
    try {
      const apiResponse = await deleteTaskOrChecklist({ task_id: selectedTask.task_id });
      console.log("📝 API Response:", apiResponse); // Log the API response for debugging
      setShowModal(false);
      if (onTaskDelete) {
        onTaskDelete(selectedTask.task_id, apiResponse); // Pass the task ID and API response back to the parent
      }
      setSelectedTask(null);
    } catch (err) {
      console.error("Failed to delete task:", err);
      // Optionally show error feedback here
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-col space-y-4">
        {tableData.map((task, index) => (
          <TaskCard
            key={task.task_id || index}
            task={task}
            onClick={() => handleCardClick(task)}
            onDelete={() => handleTaskDelete(task)} // Pass the delete handler to TaskCard
            showDeleteButton={showDeleteButton} // Pass the showDeleteButton prop
          />
        ))}
      </div>
      <AppModal
        open={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedTask(null);
        }}
        title="Delete Task"
        onConfirm={handleDeleteConfirm}
        confirmText="Delete"
      >
        <p>
          Are you sure you want to delete the task "<strong>{selectedTask?.task_name}</strong>"?
        </p>
      </AppModal>
    </div>
  );
}