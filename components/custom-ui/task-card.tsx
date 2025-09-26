"use client"

import { Calendar, User, Trash2 } from "lucide-react"
import { useUser } from "@/hooks/usercontext"

interface TaskCardProps {
  task: {
    task_id: number
    task_name: string
    status: string
    due_date: string
    progress: string
    assigned_to_name: string
    created_by_name: string
  }
  onClick: () => void
  onDelete?: (taskId: number) => void // Added delete handler prop
  showDeleteButton?: boolean
}

const CustomProgress = ({ value = 0 }) => {
  return (
    <div className="relative w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
      <div 
        className="absolute top-0 left-0 h-full bg-amber-500 rounded-full" 
        style={{ width: `${value}%` }}
      />
    </div>
  )
}

export default function TaskCard({ task, onClick, onDelete, showDeleteButton = true }: TaskCardProps) {
  const { user } = useUser()
  const [done, total] = task.progress.split("/").map(Number)
  const progressPercent = total ? Math.round((done / total) * 100) : 0
  
  const formattedDate = task.due_date !== "N/A" 
    ? new Date(task.due_date).toLocaleDateString("en-US", { month: "long", day: "numeric" }) 
    : "N/A"
    
  const monthName = formattedDate !== "N/A" ? formattedDate.split(" ")[0] : ""
  const dayNumber = formattedDate !== "N/A" ? formattedDate.split(" ")[1] : ""
  
  const handleTrashClick = (e: React.MouseEvent) => {
    e.stopPropagation()
      if (onDelete) {
    onDelete(task.task_id)
  }
  }
  
  
  return (
    <>
      <div className="task-card" onClick={onClick}>
        <div className="task-card-body">
          <div className="space-y-4">
            <div className="task-card-header">
              <h3 className="task-card-title">{task.task_name}</h3>
              {showDeleteButton && user?.username === task.created_by_name && (
                <button className="task-card-menu-button" onClick={handleTrashClick}> 
                  <Trash2 className="h-5 w-5 text-gray-500" />
                </button>
              )}
            </div>
            <div className="task-card-info-row">
              <span className="task-card-pill">{task.status}</span>
              <div className="task-card-info-item">
                <Calendar className="h-4 w-4" />
                <span>{monthName} {dayNumber}</span>
              </div>
              <div className="task-card-info-item">
                <User className="h-4 w-4" />
                <span>Assigned to {task.assigned_to_name}</span>
              </div>
              <div className="task-card-info-item">
                <User className="h-4 w-4" />
                <span>Created by {task.created_by_name}</span>
              </div>
              <div className="task-card-progress-wrapper">
                <CustomProgress value={progressPercent} />
                <span className="task-card-progress-text">{progressPercent}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </>
  )
}