
"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchTaskDetails, updateTaskDetails, startTaskTimer, deleteTaskOrChecklist } from "@/lib/tasks/task";
import { ArrowLeft, Trash2 } from "lucide-react";
import { TaskMeta } from "@/components/tasks/task-meta";
import TaskDescription from "@/components/tasks/task-description";
import { Button } from "@/components/ui/button";
import SmartInputBox from "@/components/custom-ui/input-box";
import { useUser } from "@/hooks/usercontext";
import TaskTabSwitch from "@/components/tasks/normaltabswitch/task-switch";
import ReviewTaskTabSwitch from "@/components/tasks/reviewtabswitch/reviewtab-switch";
import { TaskChatActivity } from "@/components/tasks/chat-activityswitch/TaskChatActivity";
import { AppModal } from "@/components/custom-ui/app-modal";


interface UpdatedTaskResponse {
  message: string;
  updated_fields: {
    [key: string]: any;
  };
}

export default function TaskDetailsPage() {
  const { id: taskId } = useParams();
  const router = useRouter();
  const { user } = useUser();
  const [task, setTask] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [taskTitle, setTaskTitle] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const canEditFields = user?.employee_id === task?.created_by;
  const lastFetchedTaskIdRef = useRef<number | null>(null); // Track the last fetched taskId

  useEffect(() => {
    if (lastFetchedTaskIdRef.current === Number(taskId)) {
      console.log("⚠️ Skipping fetch: Already fetched for taskId:", taskId);
      return;
    }
    lastFetchedTaskIdRef.current = taskId ? Number(taskId) : null; // Update the last fetched taskId


    const getTaskDetails = async () => {
      try {
        if (typeof taskId === "string") {
          const taskData = await fetchTaskDetails(taskId); // Fetch task details
          setTask(taskData); // Set the full task object
          setTaskTitle(taskData.task_name); // Set the task title
        } else {
          throw new Error("Invalid task ID");
        }
      } catch (err) {
        console.error("Error fetching task details:", err);
        setError("Failed to fetch task details. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    if (taskId) {
      getTaskDetails();
    }
  }, [taskId]);

  const handleUpdate = async (field: string, value: any) => {
    const previousValue = task[field];
    try {
      console.log(`Updating field: ${field}, with value: ${value}`);

      setTask((prevTask: any) => ({ ...prevTask, [field]: value }));

      const payload = { task_id: task.task_id, [field]: value };
      const updatedTask: UpdatedTaskResponse = await updateTaskDetails(payload);

      const updatedFieldValue = updatedTask.updated_fields[field];
      console.log(`Syncing state with API response for field: ${field}, value: ${updatedFieldValue}`);

      setTask((prevTask: any) => ({ ...prevTask, [field]: updatedFieldValue }));
    } catch (err) {
      console.error("Error updating task:", err);

      setTask((prevTask: any) => ({ ...prevTask, [field]: previousValue }));
    }
  };

  const handleDeleteTask = async () => {
    try {
      await deleteTaskOrChecklist({ task_id: task.task_id });
      router.push("/tasks"); // Navigate back to tasks page after deletion
    } catch (error) {
      console.error("Error deleting task:", error);
      setError("Failed to delete task. Please try again.");
    }
  };

  if (isLoading) {
    return <p className="flex justify-center items-center h-screen">Loading...</p>;
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  return (
    <div className="flex flex-col h-screen bg-[#FDFCFF]">
      <header className="sticky top-0 z-20 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2 sm:space-x-4 w-full">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          {canEditFields ? (
            <SmartInputBox
              value={taskTitle}
              onChange={(value: string) => setTaskTitle(value)}
              onChangeComplete={(value: string) => handleUpdate("task_name", value)}
              inputClassName="p-2 bg-transparent outline-none border-none font-semibold text-xl focus:ring-none w-full resize-none"
              showCharLimit={false}
              charLimit={60}
              isTextarea={false}
            />
          ) : (
            <h1 className="p-2 w-full font-semibold text-xl">{taskTitle}</h1>
          )}

          {task.status === "To_Do" && !task.is_ongoing && (
            <Button
              size="sm"
              onClick={async () => {
                try {
                  await startTaskTimer(task.task_id); // Trigger API call
                  setTask((prevTask: any) => ({ ...prevTask, is_ongoing: true })); // Update state
                  console.log("✅ Timer started for task:", task.task_id);
                } catch (error) {
                  console.error("❌ Failed to start task timer:", error);
                }
              }}
              className={`ml-auto ${!(user?.employee_id === task?.created_by || user?.employee_id === task?.assigned_to) ? "cursor-not-allowed opacity-50" : ""}`}
              disabled={!(user?.employee_id === task?.created_by || user?.employee_id === task?.assigned_to)} // Disable button if the user is not allowed
            >
              Start
            </Button>
          )}

          {/* Delete button in header */}
          {task?.delete_allow && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDeleteModal(true)}
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-5 w-5" />
            </Button>
          )}

        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] flex-1 overflow-hidden">
        {/* left side */}
        <div className="overflow-y-auto p-4">
          <div className="flex flex-col sm:flex-row gap-4 p-4">
            <TaskMeta task={task} setTask={setTask} />
          </div>

          <div className="p-4">
            <TaskDescription task={task} description={task.description} setTask={setTask} />
          </div>

          <div className="p-4">
            <TaskTabSwitch task={task} setTask={setTask} />
          </div>

          {/* Review Management Section */}
          {task?.task_type?.toLowerCase() === "review" && (
            <div className="p-4">
              <h2 className="text-lg font-semibold">Review Management</h2>
              <ReviewTaskTabSwitch task={task} setTask={setTask} />
            </div>
          )}
        </div>


        <div className="border-l border-gray-200 overflow-y-auto h-[calc(100vh-5rem)] bg-[#fcfcfc]">
          <TaskChatActivity taskId={task?.task_id} userId={user?.employee_id ?? 0} />
        </div>
      </div>
      {/* Delete Confirmation Modal */}
      <AppModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Task"
        size="md"
        onConfirm={handleDeleteTask}
        confirmText="Delete"
      >
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <Trash2 className="h-5 w-5 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-900">
                Permanently delete this task?
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                This action cannot be undone. The task and all associated data will be permanently removed.
              </p>
            </div>
          </div>
          
          {task?.marketing_content?.id && (
            <div className="bg-amber-50 border-l-4 border-amber-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-amber-700">
                    <strong>Content Calendar Impact:</strong> This task is linked to content calendar.
                  </p>
                  <p className="text-sm text-amber-600 mt-1">
                    Deleting this task will also remove the associated content from your planned Calendar
                  </p>
                </div>
              </div>
            </div>
          )}
          
        </div>
      </AppModal>
    </div>
  );
}
