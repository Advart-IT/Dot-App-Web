"use client";

import { useState, useEffect, useRef } from "react";
import { fetchTasks } from "@/lib/tasks/task";
import FilterGroup from "@/components/tasks/task-filter";
import TaskCreate from "@/components/tasks/task-create";
import { AppModal } from "@/components/custom-ui/app-modal";
import TaskCardGrid from "@/components/tasks/task-card";

const FILTERS_TEMPLATE = [
  { label: "My Tasks", value: "assigned_to", count: 0 },
  { label: "Created By Me", value: "created_by", count: 0 },
];

const STATUS_FILTERS_TEMPLATE = [
  { label: "To Do", value: "To_Do", count: 0 },
  { label: "In Progress", value: "In_Progress", count: 0 },
  { label: "In Re-Edit", value: "In_ReEdit", count: 0 },
  { label: "In Review", value: "In_Review", count: 0 },
  { label: "Completed", value: "Completed", count: 0 },
];

export default function TasksPage() {
  const [isLoading, setLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [filterBy, setFilterBy] = useState("assigned_to");
  const [statusFilter, setStatusFilter] = useState("To_Do");
  type Task = {
    task_id: number;
    status: string;
    // add other properties as needed
    [key: string]: any;
  };
  const [taskList, setTaskList] = useState<Task[]>([]);
  const [statusFilters, setStatusFilters] = useState(STATUS_FILTERS_TEMPLATE);
  const [filters, setFilters] = useState(FILTERS_TEMPLATE);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showTaskCreateModal, setShowTaskCreateModal] = useState(false);
  const [sortBy, setSortBy] = useState("due_date");
  const [sortOrder, setSortOrder] = useState("desc");
  const lastParamsRef = useRef<string | null>(null);
  const forceRefreshRef = useRef(0);

  useEffect(() => {
    const fetchTasksData = async (isLoadMore = false) => {
      try {
        if (isLoadMore) setIsLoadingMore(true);
        else setLoading(true);

        const queryParams = {
          page: currentPage.toString(),
          sort_by: sortBy,
          sort_order: sortOrder,
          filter_by: filterBy,
          status: statusFilter,
          task_name: "",
        };

        const paramsString = new URLSearchParams(
          Object.entries(queryParams).filter(([_, value]) => value)
        ).toString();

        // Include forceRefreshRef in the check to force API call when filters are clicked
        const currentParamsWithRefresh = `${paramsString}_refresh_${forceRefreshRef.current}`;

        if (lastParamsRef.current === currentParamsWithRefresh && !isLoadMore) {
          console.log("🟠 Skipping API Call (Same Params)", paramsString);
          return;
        }

        lastParamsRef.current = currentParamsWithRefresh;
        console.log("🔵 Making API call with params:", queryParams);
        const data = await fetchTasks(new URLSearchParams(paramsString));
        console.log("✅ API response:", data);

        setTaskList((prevTasks) =>
          isLoadMore ? [...prevTasks, ...data.tasks] : data.tasks || []
        );

        const summary = data.summary[filterBy === "assigned_to" ? "assigned_to_me" : "created_by_me"];

        setStatusFilters(
          STATUS_FILTERS_TEMPLATE.map((filter) => ({
            ...filter,
            count: summary.status_counts[filter.value] || 0,
          }))
        );

        setFilters(
          FILTERS_TEMPLATE.map((filter) => ({
            ...filter,
            count: data.summary[filter.value === "assigned_to" ? "assigned_to_me" : "created_by_me"].total || 0,
          }))
        );

        setHasMore(data.has_more);
      } catch (err) {
        console.error("❌ Error fetching tasks:", err);
      } finally {
        setLoading(false);
        setIsLoadingMore(false);
      }
    };

    fetchTasksData(currentPage > 1);
  }, [filterBy, statusFilter, currentPage, sortBy, sortOrder, forceRefreshRef.current]);

  const loadMoreTasks = () => {
    if (hasMore && !isLoadingMore) {
      console.log("Loading more tasks...");
      setCurrentPage((prevPage) => prevPage + 1);
    }
  };

  const handleSort = (column: string, direction: string) => {
    console.log("Sorting by:", { column, direction });
    setSortBy(column);
    setSortOrder(direction);
    setCurrentPage(1);
    setTaskList([]);
  };

  // Handle Filter Change
  const handleFilterChange = (newFilter: string) => {
    if (newFilter === filterBy) {
      // Force refresh when clicking the same filter
      forceRefreshRef.current += 1;
    }
    setFilterBy(newFilter);
    setCurrentPage(1);
    setTaskList([]); // Reset task list when filter changes
  };

  // Handle Status Filter Change
  const handleStatusFilterChange = (newStatus: string) => {
    if (newStatus === statusFilter) {
      // Force refresh when clicking the same status filter
      forceRefreshRef.current += 1;
    }
    setStatusFilter(newStatus);
    setCurrentPage(1);
    setTaskList([]); // Reset task list when status changes
  };

  // Handle task deletion
  const handleTaskDelete = (taskId: number) => {

    setTaskList((prevTasks) => {
      const filtered = prevTasks.filter(task => task.task_id !== taskId);
      return filtered;
    });

    // Find the task that was deleted to update the correct status counter
    const deletedTask = taskList.find(task => task.task_id === taskId);

    if (deletedTask) {
      // Update the status counts
      setStatusFilters((prevStatusFilters) =>
        prevStatusFilters.map((filter) => {
          if (deletedTask.status === filter.value) {
            return {
              ...filter,
              count: Math.max(0, filter.count - 1)
            };
          }
          return filter;
        })
      );

      // Update the total counts in the main filters
      setFilters((prevFilters) =>
        prevFilters.map((filter) => ({
          ...filter,
          count: Math.max(0, filter.count - 1)
        }))
      );
    }
  };

  return (
    <div className="p-4 space-y-4 h-screen overflow-hidden flex flex-col">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-800">Tasks</h1>
        <button
          onClick={() => setShowTaskCreateModal(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-all"
        >
          + Create Task
        </button>
      </div>

      {/* TaskCreate Modal */}
      {showTaskCreateModal && (
        <AppModal
          open={showTaskCreateModal}
          title="Create Task"
          onClose={() => setShowTaskCreateModal(false)}
        >
          <TaskCreate
            onClose={() => setShowTaskCreateModal(false)}
            onSubmit={async (taskData) => {
              console.log("Task submitted:", taskData);
              setShowTaskCreateModal(false);

              // Refresh the task list by resetting params and page
              setCurrentPage(1);
              forceRefreshRef.current += 1; // Force a refresh
            }}
          />
        </AppModal>
      )}

      <div className="flex-1 flex flex-col gap-4 bg-white h-screen overflow-hidden rounded-[10px] shadow-sm border border-[#E0E0E0] py-4">
        <div className="px-4">
          <FilterGroup
            filters={filters}
            activeFilter={filterBy}
            onFilterChange={handleFilterChange}
            className="flex flex-wrap gap-3"
            activeClass="min-w-[190px] px-4 py-2 rounded-md font-medium bg-blue-500 text-[#fff] border border-blue-500 hover:bg-blue-600"
            inactiveClass="min-w-[190px] px-4 py-2 rounded-md font-medium bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200"
            defaultActiveBadgeClass="flex items-center justify-center px-2 h-[20px] text-xs font-semibold rounded-full bg-white text-gray-500"
            defaultInactiveBadgeClass="flex items-center justify-center px-2 h-[20px] text-xs font-semibold rounded-full bg-gray-200 text-gray-800"
          />
        </div>
        <div className="px-4">
          <FilterGroup
            filters={statusFilters}
            activeFilter={statusFilter}
            onFilterChange={handleStatusFilterChange}
            className="flex flex-wrap gap-3"
            activeClass="min-w-[120px] px-4 py-2 rounded-md font-medium bg-gray-500 text-[#fff] border border-gray-500 hover:bg-gray-600"
            inactiveClass="min-w-[120px] px-4 py-2 rounded-md font-medium bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200"
            defaultActiveBadgeClass="flex items-center justify-center px-2 h-[20px] text-xs rounded-full bg-white text-gray-500"
            defaultInactiveBadgeClass="flex items-center justify-center px-2 h-[20px] text-xs rounded-full bg-gray-300 text-gray-800"
          />
        </div>
        <div className="flex-1 h-full px-4 overflow-y-auto scrollbar-[2px] scrollbar-thumb-gray-200 scrollbar-track-gray-50">
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <p className="text-gray-500">Loading tasks...</p>
            </div>
          ) : taskList.length === 0 ? (
            <div className="flex justify-center items-center h-32">
              <p className="text-gray-500">No tasks found</p>
            </div>
          ) : (
            <TaskCardGrid
              taskList={taskList}
              onSort={handleSort}
              onTaskDelete={handleTaskDelete}
            />
          )}
          <div className="flex justify-center py-4">
            {hasMore && (
              <button
                onClick={loadMoreTasks}
                disabled={isLoadingMore}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-all disabled:bg-gray-300"
              >
                {isLoadingMore ? "Loading..." : "Load More"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
