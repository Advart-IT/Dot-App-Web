// "use client"

// import type React from "react"
// import { useEffect, useRef } from "react"
// import { useRouter } from "next/navigation"
// import SmartTable from "../custom-ui/table"

// type Column<T> = {
//   accessor: keyof T & string
//   label: string
//   customRender?: (...args: any[]) => React.ReactNode
//   noTruncate?: boolean
//   width?: string // Optional width property
// }

// type TableRow = {
//   task_id: number
//   task_name: string
//   status: string
//   due_date: string
//   progress: string
//   assigned_to_name: string
//   created_by_name: string
// }

// interface TaskTableProps {
//   taskList: any[]
//   onSort?: (column: string, direction: "asc" | "desc") => void; // Add onSort prop
// }

// const TaskTable = ({ taskList, onSort }: TaskTableProps) => {
//   const router = useRouter()


//   const handleSort = (column: string, direction: "asc" | "desc") => {
//     console.log(`Sorting by ${column} in ${direction} order`);
//     // Pass sorting information back to the parent
//     if (onSort) {
//       onSort(column, direction);
//     }
//   };



//   const tableData: TableRow[] = taskList.map((task) => ({
//     task_id: task.task_id,
//     task_name: task.task_name,
//     status: task.status,
//     due_date: task.due_date || "N/A",
//     progress: task.checklist_progress,
//     assigned_to_name: task.assigned_to_name || "Unassigned",
//     created_by_name: task.created_by_name || "Unknown",
//   }))

//   const columns: Array<Column<TableRow>> = [
//     { accessor: "task_name" as keyof TableRow & string, label: "Task Name", width: "40%" },
//     {
//       accessor: "status" as keyof TableRow & string,
//       label: "Status",
//       width: "12%",
//       noTruncate: true,
//       customRender: (value: string) => {
//         const displayValue = value.replace(/_/g, " ")
//         const statusClasses: Record<string, string> = {
//           "To Do": "bg-gray-200 text-[#303030]",
//           "In Progress": "bg-gray-200 text-[#303030]",
//           "In Review": "bg-gray-200 text-[#303030]",
//           "In Re-Edit": "bg-gray-200 text-[#303030]",
//           Complete: "bg-gray-200 text-[#303030]",
//         }
//         const statusClass = statusClasses[displayValue] || "bg-gray-200 text-[#303030]"
//         return <span className={`px-3 py-1.5 rounded-full text-s ${statusClass}`}>{displayValue}</span>
//       },
//     },
//     {
//       accessor: "due_date" as keyof TableRow & string,
//       label: "Due Date",
//       width: "12%",
//       noTruncate: true,
//       customRender: (value: string, row: TableRow) => {
//         if (value === "N/A") return <span className="text-gray-500">N/A</span>

//         const today = new Date()
//         const dueDate = new Date(value)
//         const diffInDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) // Difference in days

//         let displayText = ""
//         let dateClass = "" // Default color

//         if (row.status !== "Complete") {
//           // Task is not complete
//           if (diffInDays >= 0) {
//             // Due date is in the future or today
//             if (diffInDays < 5) {
//               displayText = `${diffInDays} days left`
//               dateClass = "text-red-600" // Red for less than 5 days
//             } else {
//               displayText = dueDate.toLocaleDateString("en-US", {
//                 day: "numeric",
//                 month: "short",
//               }) // Format as "5th Mar"
//               dateClass = "text-[#303030]" // Default gray color
//             }
//           } else {
//             // Due date is in the past
//             if (Math.abs(diffInDays) < 5) {
//               displayText = `${Math.abs(diffInDays)} days ago`
//               dateClass = "text-red-600" // Red for less than 5 days
//             } else {
//               displayText = dueDate.toLocaleDateString("en-US", {
//                 day: "numeric",
//                 month: "short",
//               }) // Format as "5th Mar"
//               dateClass = "text-red-600" // Red for past dates
//             }
//           }
//         } else {
//           // Task is complete
//           displayText = dueDate.toLocaleDateString("en-US", {
//             day: "numeric",
//             month: "short",
//           }) // Format as "5th Mar"
//           dateClass = "text-green-600" // Green for complete tasks
//         }

//         return <span className={`text-s ${dateClass}`}>{displayText}</span>
//       },
//     },
//     {
//       accessor: "progress" as keyof TableRow & string,
//       label: "Progress",
//       width: "12%",
//       noTruncate: true,
//       customRender: (value: string) => {
//         const [done, total] = value.split("/").map(Number)
//         if (!total || isNaN(done) || isNaN(total))
//           return <span className="px-3 py-1.5 rounded-full text-s bg-gray-100  text-[#707070]">Nil</span>

//         const percent = Math.round((done / total) * 100)

//         let progressClass = ""
//         if (percent <= 25) {
//           progressClass = "bg-red-100 text-red-600"
//         } else if (percent <= 50) {
//           progressClass = "bg-yellow-100 text-yellow-600"
//         } else if (percent <= 75) {
//           progressClass = "bg-blue-100 text-blue-600"
//         } else {
//           progressClass = "bg-green-100 text-green-600"
//         }

//         return <span className={`px-3 py-1.5 rounded-full text-s ${progressClass}`}>{percent}%</span>
//       },
//     },
//     { accessor: "assigned_to_name" as keyof TableRow & string, label: "Assigned To", width: "12%" },
//     { accessor: "created_by_name" as keyof TableRow & string, label: "Created By", width: "12%" },
//   ]

//   const handleRowClick = (row: TableRow) => {
//     if (row.task_id) {
//       router.push(`/tasks/${row.task_id}`)
//     }
//   }

//   return (
//     <div className="w-full ">
//       <SmartTable data={tableData} columns={columns} onSort={handleSort} onRowClick={handleRowClick} />
//     </div>
//   )
// }

// export default TaskTable