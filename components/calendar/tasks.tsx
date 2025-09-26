// "use client";

// import React, { useState } from "react";
// import Calendar from "./calendar";

// interface Task {
//   id: string;
//   text: string;
//   completed: boolean;
// }

// interface TasksData {
//   [dateKey: string]: Task[];
// }

// interface TasksCalendarProps {
//   brandName?: string;
// }

// const TasksCalendar: React.FC<TasksCalendarProps> = ({ brandName }) => {
//   const [tasksData, setTasksData] = useState<TasksData>({});

//   const addTask = (day: number, month: number, year: number, taskText: string) => {
//     const dateKey = `${year}-${month}-${day}`;
//     const newTask: Task = {
//       id: Date.now().toString(),
//       text: taskText,
//       completed: false
//     };
    
//     setTasksData(prev => ({
//       ...prev,
//       [dateKey]: [...(prev[dateKey] || []), newTask]
//     }));
//   };

//   const toggleTask = (day: number, month: number, year: number, taskId: string) => {
//     const dateKey = `${year}-${month}-${day}`;
//     setTasksData(prev => ({
//       ...prev,
//       [dateKey]: prev[dateKey]?.map(task => 
//         task.id === taskId ? { ...task, completed: !task.completed } : task
//       ) || []
//     }));
//   };

//   const getTasksForDay = (day: number, month: number, year: number) => {
//     const dateKey = `${year}-${month}-${day}`;
//     return tasksData[dateKey] || [];
//   };

//   const renderDayContent = (day: number, month: number, year: number) => {
//     const tasks = getTasksForDay(day, month, year);
    
//     return (
//       <div className="w-full h-full flex flex-col">
//         <div className="flex-1 overflow-y-auto">
//           {tasks.map(task => (
//             <div key={task.id} className="flex items-center gap-1 mb-1">
//               <input
//                 type="checkbox"
//                 checked={task.completed}
//                 onChange={() => toggleTask(day, month, year, task.id)}
//                 className="w-3 h-3"
//               />
//               <span className={`text-xs ${task.completed ? 'line-through text-gray-400' : ''}`}>
//                 {task.text}
//               </span>
//             </div>
//           ))}
//         </div>
//         <input
//           type="text"
//           placeholder="Add task..."
//           className="w-full text-xs border-none outline-none bg-transparent placeholder-gray-400 mt-1"
//           onKeyPress={(e) => {
//             if (e.key === 'Enter' && e.currentTarget.value.trim()) {
//               addTask(day, month, year, e.currentTarget.value);
//               e.currentTarget.value = '';
//             }
//           }}
//         />
//       </div>
//     );
//   };

//   return (
//     <Calendar 
//       renderDayContent={renderDayContent} 
//       title={brandName ? `Tasks Calendar - ${brandName}` : "Tasks Calendar"}
//     />
//   );
// };

// export default TasksCalendar;