"use client"

import type React from "react"
import { useUser } from "@/hooks/usercontext"
import { useEffect, useState } from "react"
import { updateTaskDetails } from "@/lib/tasks/task"
import { CalendarIcon, CalendarIcon as Calendar1, CheckSquare, CheckCircle, Clipboard } from "lucide-react"
import { format } from "date-fns"
import { User, Edit } from "lucide-react"
import SmartDropdown from "../custom-ui/dropdown"
import SmartToggleSwitch from "../custom-ui/toggleswitch"
import SmartDaySelector from "../custom-ui/dayselectcalendar"

interface UpdatedTaskResponse {
  message: string
  updated_fields: {
    [key: string]: any
  }
}

export function TaskMeta({ task, setTask }: { task: any; setTask: React.Dispatch<React.SetStateAction<any>> }) {
  const { user } = useUser()
  const [date, setDate] = useState<Date | undefined>(task?.due_date ? new Date(task.due_date + "T00:00:00") : undefined)
  const [isReviewRequired, setIsReviewRequired] = useState(task?.is_review_required || false)
  const [assignedTo, setAssignedTo] = useState(task?.assigned_to?.toString() || "")

  useEffect(() => {
    setIsReviewRequired(task?.is_review_required || false)
    // Update assigned_to whenever the task changes
    if (task?.assigned_to) {
      setAssignedTo(task.assigned_to.toString())
    }
  }, [task?.is_review_required, task?.assigned_to])

  if (!task) {
    return (
      <div className="w-full flex flex-col gap-4">
        <div className="text-slate-400 text-sm">No task details available.</div>
      </div>
    )
  }

  const canEditFields = user?.employee_id === task.created_by
  // Map people to dropdown options
  const assignedToOptions = user?.people.map((person: { employee_id: number; username: string }) => ({
    value: person.employee_id.toString(), // Use employee_id as the value
    label: person.username, // Use username as the label
  }))
  const handleUpdate = async (field: string, value: any) => {
    const previousValue = task[field]
    try {
      console.log(`Updating field: ${field}, with value: ${value}`)

      // Optimistically update the UI
      setTask((prevTask: any) => ({ ...prevTask, [field]: value }))

      // Make the API call
      const payload = { task_id: task.task_id, [field]: value }
      const updatedTask: UpdatedTaskResponse = await updateTaskDetails(payload)
      console.log("API response for updated task:", updatedTask)

      // Extract the updated field from the API response
      const updatedFieldValue = updatedTask.updated_fields[field]
      console.log(`Syncing state with API response for field: ${field}, value: ${updatedFieldValue}`)

      // Ensure the state is in sync with the API response
      setTask((prevTask: any) => ({ ...prevTask, [field]: updatedFieldValue }))
    } catch (err) {
      console.error("Error updating task:", err)

      // Revert the optimistic update
      setTask((prevTask: any) => ({ ...prevTask, [field]: previousValue }))
    }
  }

  const calculateProgress = () => {
    const [done, total] = task.checklist_progress.split("/").map(Number)
    if (!total || isNaN(done) || isNaN(total)) return 0
    return Math.round((done / total) * 100)
  }

  const progressPercent = calculateProgress()

  return (
    <div className="task-meta-grid">
  {/* Left Side */}
  <div className="space-y-2">
    {/* Status Row */}
    <div className="meta-row">
      <CheckCircle className="h-4 w-4 text-gray-500" />
      <div className="meta-label">Status</div>
      <div className="flex-grow">
        <div
          className="status-badge"
          style={{
            backgroundColor: (() => {
              switch (task.status) {
                case "To_Do":
                  return "#FFF4E5";
                case "In_Progress":
                  return "#EFF6FF";
                case "In_Review":
                  return "#FFFBEB";
                case "In_ReEdit":
                  return "#F5F3FF";
                case "Completed":
                  return "#F0FDF4";
                default:
                  return "#F9FAFB";
              }
            })(),
          }}
        >
          <span className="text-xs">{task.status === "OPEN" ? "OPEN" : task.status.replace("_", " ")}</span>
        </div>
      </div>
    </div>

    {/* Assignees Row */}
    <div className="meta-row w-[80%]">
      <Edit className="h-4 w-4 text-gray-500" />
      <div className="meta-label">Assigned</div>
      <div className="flex-grow">
        {canEditFields ? (
          <SmartDropdown
            options={assignedToOptions || []}
            value={assignedTo}
            onChange={(value: string) => setAssignedTo(value)}
            placeholder="Select an Assignee"
            onChangeComplete={(value: string) => handleUpdate("assigned_to", value)}
            baseButtonClassName=" px-2 py-2 text-left text-sm overflow-hidden bg-[#F9FAFB] rounded-md"
          />
        ) : (
          <div className="truncated-box">{task.assigned_to_name || "Empty"}</div>
        )}
      </div>
    </div>

    {/* Dates Row */}
    <div className="meta-row">
      <Calendar1 className="h-4 w-4 text-gray-500" />
      <div className="meta-label">Dates</div>
      <div className="flex-grow flex items-center gap-1">
        <div className="text-sm">
          {canEditFields ? (
            <SmartDaySelector
              buttonClassName="border-none rounded-md px-2 py-2 bg-[#F9FAFB]"
              value={date || null}
              onChange={(selectedDate: Date | null) => {
                setDate(selectedDate || undefined);
                if (selectedDate) {
                  const localDate = new Date(selectedDate.getTime() - selectedDate.getTimezoneOffset() * 60000);
                  handleUpdate("due_date", localDate.toISOString().split("T")[0]);
                }
              }}
              showApplyButton={false}
            />
          ) : (
            <span className="truncated-box pr-[120px]">
              <CalendarIcon className="inline-block h-3 w-3 mr-1 text-gray-500" />
              {task.due_date ? format(new Date(task.due_date + "T00:00:00"), "MMM d, yyyy") : "Due"}
            </span>
          )}
        </div>
      </div>
    </div>
  </div>

  {/* Right Side */}
  <div className="space-y-2">
    {/* Progress Row */}
    <div className="meta-row">
      <CheckSquare className="h-4 w-4 text-gray-500" />
      <div className="meta-label">Progress</div>
      <div className="flex-grow flex items-center gap-2">
        <div className="progress-bar-container">
          <div
            className="progress-bar-fill"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
        <span className="meta-value text-xs">{progressPercent}%</span>
      </div>
    </div>

    {/* Review Toggle Row */}
    {!(task.task_type?.toLowerCase() === "review" ||
      task.status?.toLowerCase() === "in_review" ||
      task.status?.toLowerCase() === "in_reedit") && (
      <div className="meta-row">
        <Clipboard className="h-4 w-4 text-gray-500" />
        <div className="meta-label">Review</div>
        <div className="flex-grow">
          <div className="review-toggle">
            <span>{isReviewRequired ? "Yes" : "No"}</span>
            <SmartToggleSwitch
              checked={isReviewRequired}
              onChange={(checked) => {
                if (canEditFields) {
                  handleUpdate("is_review_required", checked);
                  setIsReviewRequired(checked);
                }
              }}
              disabled={!canEditFields}
              switchClassName={`relative w-12 h-6 bg-gray-300 rounded-full transition-all ${
                canEditFields ? "" : "cursor-not-allowed"
              }`}
            />
          </div>
        </div>
      </div>
    )}

    {/* Creator Row */}
    <div className="meta-row">
      <User className="h-4 w-4 text-gray-500" />
      <div className="meta-label">Creator</div>
      <div className="truncated-box pr-[120px]">
        {task.created_by_name || "Unknown"}
      </div>
    </div>
  </div>
</div>

  )
}
