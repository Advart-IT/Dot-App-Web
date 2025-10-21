'use client';

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { fetchTasks, startTaskTimer, fetchMonthlyTargetOverview } from "@/lib/tasks/task";
import TaskCreate from "@/components/tasks/task-create";
import { useUser } from "@/hooks/usercontext";
import SmartDropdown from "@/components/custom-ui/dropdown";

const FILTERS_TEMPLATE = [
  { label: "My Tasks", value: "assigned_to", count: 0 },
  { label: "Created By Me", value: "created_by", count: 0 },
];

// Define types
interface Task {
  task_id: string;
  task_name: string;
  due_date: string;
  checklist_progress: string;
  is_ongoing: boolean;
  assigned_to: Number;
  status: string;
}

interface DueStatus {
  text: string;
  color: string;
}

interface TasksResponse {
  tasks: Task[];
  has_more: boolean;
}

interface MonthlyTargetResponse {
  month_name: string;
  total_target_count?: number;
  total_completed?: number;
  total_pending?: number;
  total_in_review?: number;
<<<<<<< HEAD
=======
  total_in_progress?: number;
>>>>>>> d1f1957aff3147d004b00f2c960ea84cc38f4cb7
  overall_completion_percentage?: number;
}

export default function DashboardPage() {
  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([]);
  const [delayedTasks, setDelayedTasks] = useState<Task[]>([]);
  const [ongoingTasks, setOngoingTasks] = useState<Task[]>([]);
  const [showCreateTask, setShowCreateTask] = useState<boolean>(false);
  const router = useRouter();
  const { user } = useUser();
  const lastParamsRefUpcomingDelayed = useRef<string | null>(null);
  const lastParamsRefOngoing = useRef<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>("assigned_to");
  
  // Target overview states
  const [targetData, setTargetData] = useState<MonthlyTargetResponse | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  });
  const [targetLoading, setTargetLoading] = useState<boolean>(false);

  const fetchTargetOverview = async () => {
    try {
      setTargetLoading(true);
      const [year, month] = selectedDate.split('-').map(Number);
      const data = await fetchMonthlyTargetOverview({
        month: month,
        year: year
      });
      setTargetData(data);
    } catch (error) {
      console.error("Failed to fetch target overview:", error);
    } finally {
      setTargetLoading(false);
    }
  };

  const fetchAllTasks = async (type: string) => {
    console.log(`[fetchAllTasks] Called with type: ${type}`);
    let page = 1;
    let hasMore = true;
    const allTasks: Task[] = [];

    try {
      const currentParams = `${type}-${page}-${selectedFilter}`;
      console.log(`[fetchAllTasks] Current params: ${currentParams}`);

      if (
        (type === "upcoming_delayed" && lastParamsRefUpcomingDelayed.current === currentParams) ||
        (type === "ongoing" && lastParamsRefOngoing.current === currentParams)
      ) {
        console.log(`[fetchAllTasks] Skipping duplicate call for params: ${currentParams}`);
        return;
      }

      if (type === "upcoming_delayed") {
        lastParamsRefUpcomingDelayed.current = currentParams;
      } else if (type === "ongoing") {
        lastParamsRefOngoing.current = currentParams;
      }

      while (hasMore) {
        console.log(`[fetchAllTasks] Fetching page: ${page} for type: ${type}`);
        const params: Record<string, string> = {
          page: page.toString(),
          sort_by: "due_date",
          sort_order: "desc",
          filter_by: selectedFilter,
        };

        if (type === "upcoming_delayed") {
          params.status = "To_Do";
        }

        if (type === "ongoing") {
          params.is_ongoing = "true";
        }

        const data: TasksResponse = await fetchTasks(new URLSearchParams(params));
        console.log(`[fetchAllTasks] Fetched data for page ${page}:`, data);

        allTasks.push(...(data.tasks || []));
        hasMore = data.has_more;
        page += 1;
      }

      if (type === "upcoming_delayed") {
        console.log(`[fetchAllTasks] Processing upcoming and delayed tasks`);
        const now = new Date();
        const nonOngoing = allTasks.filter((task) => !task.is_ongoing);
        const upcoming = nonOngoing.filter((task) => new Date(task.due_date) >= now);
        const delayed = nonOngoing.filter((task) => new Date(task.due_date) < now);

        setUpcomingTasks(upcoming);
        setDelayedTasks(delayed);
      } else if (type === "ongoing") {
        console.log(`[fetchAllTasks] Processing ongoing tasks`);
        const ongoing = allTasks.filter((task) => task.is_ongoing);
        setOngoingTasks(ongoing);
      }
    } catch (error) {
      console.error(`[fetchAllTasks] Failed to fetch tasks:`, error);
    }
  };

  const handleStartTask = async (task: Task, from: string) => {
    try {
      await startTaskTimer(Number(task.task_id));
      setOngoingTasks((prev) => [...prev, { ...task, is_ongoing: true }]);

      if (from === "upcoming") {
        setUpcomingTasks((prev) => prev.filter((t) => t.task_id !== task.task_id));
      } else if (from === "delayed") {
        setDelayedTasks((prev) => prev.filter((t) => t.task_id !== task.task_id));
      }
    } catch (error) {
      console.error("Failed to start task timer:", error);
    }
  };

  const handleTaskCreated = async (newTask: Task) => {
    const now = new Date();
    console.log("[handleTaskCreated] New task received:", newTask);
    console.log("[handleTaskCreated] Current user:", user?.employee_id);

    if (newTask.assigned_to === (user?.employee_id)) {
      console.log("[handleTaskCreated] Task is assigned to current user.");
      console.log("[handleTaskCreated] Task due date:", newTask.due_date, "Now:", now.toISOString());

      if (new Date(newTask.due_date) >= now) {
        console.log("[handleTaskCreated] Adding to upcomingTasks.");
        setUpcomingTasks((prev) => {
          const updated = [...prev, newTask];
          console.log("[handleTaskCreated] Upcoming tasks after add:", updated.map(t => t.task_id));
          return updated;
        });
      } else {
        console.log("[handleTaskCreated] Adding to delayedTasks.");
        setDelayedTasks((prev) => {
          const updated = [...prev, newTask];
          console.log("[handleTaskCreated] Delayed tasks after add:", updated.map(t => t.task_id));
          return updated;
        });
      }
    } else {
      console.log("[handleTaskCreated] Task is NOT assigned to current user.");
    }

    setShowCreateTask(false);
    console.log("[handleTaskCreated] Task create modal closed.");
  };

  useEffect(() => {
    console.log(`[useEffect] Selected filter changed: ${selectedFilter}`);
    fetchAllTasks("upcoming_delayed");
    fetchAllTasks("ongoing");
  }, [selectedFilter]);

  useEffect(() => {
    fetchTargetOverview();
  }, [selectedDate]);

  // Initial load of target data
  useEffect(() => {
    fetchTargetOverview();
  }, []);

  const renderProgress = (value: string | undefined) => {
    const [done, total] = value?.split("/").map(Number) || [0, 0];
    if (!total || isNaN(done) || isNaN(total)) {
      return (
        <div className="flex items-center">
          <div className="bg-gray-200 rounded-full h-2.5 w-20">
            <div className="bg-gray-400 h-2.5 rounded-full w-0"></div>
          </div>
          <span className="ml-2 text-xs text-gray-500">Nil</span>
        </div>
      );
    }

    const percent = Math.round((done / total) * 100);
    let progressColor = "";

    if (percent <= 25) {
      progressColor = "bg-red-500";
    } else if (percent <= 50) {
      progressColor = "bg-yellow-500";
    } else if (percent <= 75) {
      progressColor = "bg-blue-500";
    } else {
      progressColor = "bg-green-500";
    }

    return (
      <div className="flex items-center">
        <div className="bg-gray-200 rounded-full h-2.5 w-20">
          <div
            className={`${progressColor} h-2.5 rounded-full`}
            style={{ width: `${percent}%` }}
          ></div>
        </div>
        <span className="ml-2 text-xs font-medium">{percent}%</span>
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDueStatus = (dueDate: string): DueStatus => {
    const days = getDaysUntilDue(dueDate);

    if (days < 0) {
      return { text: `${Math.abs(days)} days overdue`, color: "text-red-600 bg-red-100" };
    }
    if (days === 0) {
      return { text: "Due today", color: "text-orange-600 bg-orange-100" };
    }
    if (days === 1) {
      return { text: "Due tomorrow", color: "text-yellow-600 bg-yellow-100" };
    }
    if (days <= 3) {
      return { text: `Due in ${days} days`, color: "text-blue-600 bg-blue-100" };
    }
    return { text: `Due in ${days} days`, color: "text-green-600 bg-green-100" };
  };

  const handleRowClick = (taskId: string) => {
    router.push(`/tasks/${taskId}`);
  };

  const renderTaskCard = (task: Task, type: string | null = null) => {
    const dueStatus = getDueStatus(task.due_date);

    return (
      <div
        key={task.task_id}
        className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 mb-3 hover:shadow-md transition-shadow cursor-pointer"
        onClick={(e) => {
          // Only navigate if we didn't click the start button
          if (!(e.target as HTMLElement).closest('button')) {
            handleRowClick(task.task_id);
          }
        }}
      >
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-medium text-gray-800">{task.task_name}</h3>
          <span className={`text-xs px-2 py-1 rounded-full ${dueStatus.color}`}>
            {dueStatus.text}
          </span>
        </div>

        <div className="flex justify-between items-center text-xs text-gray-500 mb-3">
          <div className="flex items-center">
            <span>Due: {formatDate(task.due_date)}</span>
            <div className="ml-4">{renderProgress(task.checklist_progress)}</div>
            <span className="ml-4">{task.status.replace("_", " ")}</span>
          </div>

          {type && (selectedFilter === "assigned_to") && (
            <button
              className="ml-2 px-4 py-1.5 bg-blue-500 text-white text-xs font-medium rounded-md hover:bg-blue-600 transition"
              onClick={(e) => {
                e.stopPropagation();
                handleStartTask(task, type);
              }}
            >
              Start Task
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-800 mr-4">
            My Dashboard
          </h1>

          {/* Dropdown */}
          <div className="w-[200px]">
            <SmartDropdown
              options={FILTERS_TEMPLATE.map((filter) => ({
                label: filter.label,
                value: filter.value,
              }))}
              value={selectedFilter}
              onChange={(value: string | null) => setSelectedFilter(value || "assigned_to")}
              placeholder="Select Filter"
              className="w-[200px]"
            />
          </div>
        </div>

        {/* New Task Button */}
        <button
          className="px-5 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition shadow-sm"
          onClick={() => setShowCreateTask(true)}
        >
          + New Task
        </button>
      </div>




      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ongoing Tasks Section */}
        <div className="bg-white rounded-xl shadow p-5 border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Ongoing Tasks</h2>
            {/* <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
              {ongoingTasks.length} Tasks
            </span> */}
          </div>
          <div className="overflow-y-auto max-h-80">
            {ongoingTasks.filter(task => 
              task.status.toLowerCase() === "to_do".toLowerCase() || 
              task.status.toLowerCase() === "in_progress".toLowerCase()
            ).length > 0 ? (
              ongoingTasks
                .filter(task => 
                  task.status.toLowerCase() === "to_do".toLowerCase() || 
                  task.status.toLowerCase() === "in_progress".toLowerCase()
                ) // Filter tasks by status (case-insensitive)
                .map((task) => renderTaskCard(task))
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="text-gray-400 mb-2">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                  </svg>
                </div>
                <p className="text-gray-500">No ongoing tasks available</p>
                <p className="text-gray-400 text-sm">Start a task from your Upcoming or Delayed lists</p>
              </div>
            )}
          </div>
        </div>

        {/* Target Overview + Stats Section */}
        <div className="grid grid-cols-1 gap-6">
          {/* Target Overview Card */}
          <div className="bg-white rounded-xl shadow p-5 border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Target Overview
              </h2>
              
              {/* Month/Year Date Picker */}
              <div>
                <input
                  type="month"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                />
              </div>
            </div>

            {targetLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-blue-600 font-medium text-sm">Target</div>
                  <div className="text-xl font-bold">{targetData?.total_target_count || 0}</div>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="text-green-600 font-medium text-sm">Completed</div>
                  <div className="text-xl font-bold">{targetData?.total_completed || 0}</div>
                </div>
                <div className="bg-yellow-50 rounded-lg p-3">
                  <div className="text-yellow-600 font-medium text-sm">Pending</div>
                  <div className="text-xl font-bold">{targetData?.total_pending || 0}</div>
                </div>
<<<<<<< HEAD
                <div className="bg-purple-50 rounded-lg p-3">
                  <div className="text-purple-600 font-medium text-sm">In Review</div>
                  <div className="text-xl font-bold">{targetData?.total_in_review || 0}</div>
                </div>
=======
                  <div className="bg-purple-50 rounded-lg p-3">
                    <div className="text-purple-600 font-medium text-sm">In Review</div>
                    <div className="text-xl font-bold">{targetData?.total_in_review || 0}</div>
                  </div>
                  {/* <div className="bg-orange-50 rounded-lg p-3">
                    <div className="text-orange-600 font-medium text-sm">In Progress</div>
                    <div className="text-xl font-bold">{targetData?.total_in_progress || 0}</div>
                  </div> */}
>>>>>>> d1f1957aff3147d004b00f2c960ea84cc38f4cb7
              </div>
            )}

            {/* {targetData?.overall_completion_percentage !== null && targetData?.overall_completion_percentage !== undefined && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Overall Completion</span>
                  <span className="font-medium">{targetData.overall_completion_percentage}%</span>
                </div>
                <div className="mt-2 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(targetData.overall_completion_percentage, 100)}%` }}
                  ></div>
                </div>
              </div>
            )} */}
          </div>

          {/* Commented out Create Task Card */}
          {/* <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow p-5 text-white">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-semibold mb-2">Create New Task</h2>
                <p className="text-blue-100 mb-4">Organize and track your work efficiently</p>

                <button
                  className="px-5 py-2 bg-white text-blue-600 font-medium rounded-md hover:bg-blue-50 transition shadow-sm"
                  onClick={() => setShowCreateTask(true)}
                >
                  + New Task
                </button>
              </div>
            </div>
          </div> */}

          {/* Stats Overview Card */}
          <div className="bg-white rounded-xl shadow p-5 border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Task Overview</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-green-600 font-medium">Upcoming</div>
                <div className="text-2xl font-bold">{upcomingTasks.length}</div>
              </div>
              <div className="bg-red-50 rounded-lg p-4">
                <div className="text-red-600 font-medium">Delayed</div>
                <div className="text-2xl font-bold">{delayedTasks.length}</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-blue-600 font-medium">Ongoing</div>
                <div className="text-2xl font-bold">{ongoingTasks.length}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming & Delayed Tasks Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Upcoming Tasks */}
        <div className="bg-white rounded-xl shadow p-5 border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Upcoming Tasks</h2>
            {/* <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
              {upcomingTasks.length} Tasks
            </span> */}
          </div>
          <div className="overflow-y-auto max-h-80">
            {upcomingTasks.length > 0 ? (
              upcomingTasks.map((task) => renderTaskCard(task, "upcoming"))
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="text-gray-400 mb-2">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                </div>
                <p className="text-gray-500">No upcoming tasks</p>
                <p className="text-gray-400 text-sm">Create new tasks to see them here</p>
              </div>
            )}
          </div>
        </div>

        {/* Delayed Tasks */}
        <div className="bg-white rounded-xl shadow p-5 border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Delayed Tasks</h2>
            {/* <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded">
              {delayedTasks.length} Tasks
            </span> */}
          </div>
          <div className="overflow-y-auto max-h-80">
            {delayedTasks.length > 0 ? (
              delayedTasks.map((task) => renderTaskCard(task, "delayed"))
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="text-gray-400 mb-2">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <p className="text-gray-500">No delayed tasks</p>
                <p className="text-gray-400 text-sm">Great job staying on schedule!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* TaskCreate Modal */}
      {showCreateTask && (
        <TaskCreate
          onClose={() => setShowCreateTask(false)}
          onSubmit={handleTaskCreated}
        />
      )}
    </div>
  );
}
