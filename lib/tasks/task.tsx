const API_URL = process.env.API_URL || "https://tasks.advartit.in" ; // Fallback to localhost if not defined

// Function to update task details
interface TaskUpdatePayload {
  task_id: number;
  assigned_to?: number;
  task_name?: string;
  description?: string;
  due_date?: string;
  output?: string;
  is_review_required?: boolean;
  is_reviewed?: boolean;
}

export interface CreateTaskPayload {
  checklist_id?: number; // Optional checklist ID
  task_name: string;
  description: string;
  due_date: string;
  assigned_to: number;
  checklist_names: string[];
  is_review_required: boolean;
}


interface ChatMessage {
  message_id: number;
  message: string;
  sender_id: number;
  sender_name: string;
  timestamp: string; // Use string if the timestamp is in ISO format
}

interface ChatHistoryResponse {
  messages: ChatMessage[];
  has_more: boolean; // Indicates if there are more messages to fetch
  page: number; // Current page number
  limit: number; // Number of messages per page
}

export async function fetchTaskDetails(taskId: string): Promise<any> {
  try {
    const response = await fetch(`${API_URL}/api/v1/tasks/task/task_id?task_id=${taskId}`, {
      method: "GET",
      credentials: "include", // Ensures cookies are sent with the request
    });

    if (response.ok) {
      const taskData = await response.json();
      return taskData; // Return the fetched task details
    } else {
      throw new Error(`Failed to fetch task details: ${response.status}`);
    }
  } catch (error) {
    console.error("Error fetching task details:", error);
    throw new Error("An error occurred while fetching task details");
  }
}



export async function updateTaskDetails(payload: TaskUpdatePayload): Promise<any> {
  try {
    const response = await fetch(`${API_URL}/api/v1/tasks/update_task`, {
      method: "POST", // Using POST as per your requirement
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Failed to update task: ${response.status}`);
    }

    const updatedTask = await response.json();
    return updatedTask;
  } catch (error) {
    console.error("Error updating task:", error);
    throw new Error("An error occurred while updating task details");
  }
}

export async function updateChecklist(payload: { checklist_id: number; checklist_name: string }): Promise<any> {
  try {
    const response = await fetch(`${API_URL}/api/v1/checklist/update_checklist`, {
      method: "POST", // Use POST as specified in the curl command
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload), // Convert payload to JSON string
    });

    if (!response.ok) {
      throw new Error(`Failed to update checklist: ${response.status}`);
    }

    const updatedChecklist = await response.json();
    return updatedChecklist; // Return the updated checklist data
  } catch (error) {
    console.error("Error updating checklist:", error);
    throw new Error("An error occurred while updating the checklist");
  }
}

export async function deleteTaskOrChecklist(payload: { task_id?: number; checklist_id?: number }): Promise<any> {
  try {
    const response = await fetch(`${API_URL}/api/v1/delete/delete`, {
      method: "POST", // Use POST as specified
      credentials: "include", // Include cookies if required
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload), // Convert payload to JSON string
    });

    if (!response.ok) {
      throw new Error(`Failed to delete: ${response.status}`);
    }

    const result = await response.json();
    return result; // Return the response from the API
  } catch (error) {
    console.error("Error deleting:", error);
    throw new Error("An error occurred while deleting");
  }
}

export async function markChecklistComplete(payload: { checklist_id: number; is_completed: boolean }): Promise<any> {
  try {
    const response = await fetch(`${API_URL}/api/v1/checklist/mark_checklist_complete`, {
      method: "POST", // Use POST as specified
      credentials: "include", // Include cookies if required
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload), // Convert payload to JSON string
    });

    if (!response.ok) {
      throw new Error(`Failed to mark checklist complete: ${response.status}`);
    }

    const result = await response.json();
    return result; // Return the response from the API
  } catch (error) {
    console.error("Error marking checklist complete:", error);
    throw new Error("An error occurred while marking the checklist complete");
  }
}

export async function addChecklist(payload: { task_id: number; checklist_names: string[] }): Promise<any> {
  try {
    const response = await fetch(`${API_URL}/api/v1/checklist/add_checklist`, {
      method: "POST", // Use POST as specified
      credentials: "include", // Include cookies if required
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload), // Convert payload to JSON string
    });

    if (!response.ok) {
      throw new Error(`Failed to add checklist: ${response.status}`);
    }

    const result = await response.json();
    return result; // Return the response from the API
  } catch (error) {
    console.error("❌ Error adding checklist:", error); // Log the error
    throw new Error("An error occurred while adding the checklist");
  }
}

export async function createTask(payload: CreateTaskPayload): Promise<any> {
  try {
    const response = await fetch(`${API_URL}/api/v1/tasks/Create_Task`, {
      method: "POST", // Use POST as specified
      credentials: "include", // Include cookies if required
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload), // Convert payload to JSON string
    });

    if (!response.ok) {
      throw new Error(`Failed to create task: ${response.status}`);
    }

    const result = await response.json();
    return result; // Return the response from the API
  } catch (error) {
    console.error("❌ Error creating task:", error); // Log the error
    throw new Error("An error occurred while creating the task");
  }
}

export async function sendForReview(payload: { task_id: number; assigned_to: number }): Promise<any> {
  try {
    const response = await fetch(`${API_URL}/api/v1/tasks/send_for_review`, {
      method: "POST", // Use POST as specified
      credentials: "include", // Include cookies if required
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload), // Convert payload to JSON string
    });

    if (!response.ok) {
      throw new Error(`Failed to create task: ${response.status}`);
    }

    const result = await response.json();
    return result; // Return the response from the API
  } catch (error) {
    console.error("❌ Error creating task:", error); // Log the error
    throw new Error("An error occurred while creating the task");
  }
}



export async function fetchLogSummary(taskId: number): Promise<any> {
  try {
    const response = await fetch(`${API_URL}/api/v1/logs/log_summary?task_id=${taskId}`, {
      method: "GET", // Use GET as specified
      credentials: "include", // Include cookies if required
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch log summary: ${response.status}`);
    }

    const logSummary = await response.json();
    return logSummary; // Return the log summary from the API
  } catch (error) {
    console.error("Error fetching log summary:", error); // Log the error
    throw new Error("An error occurred while fetching the log summary");
  }
}

export async function fetchTasks(params: URLSearchParams): Promise<any> {
  const url = `${API_URL}/api/v1/tasks/tasks?${params.toString()}`;
  console.log("🌐 Fetching tasks from URL:", url); // Log the full API URL

  try {
    const response = await fetch(url, {
      method: "GET",
      credentials: "include",
    });

    console.log("📥 Response status:", response.status); // Log the response status

    if (response.ok) {
      const tasks = await response.json();
      console.log("✅ Successfully fetched tasks:", tasks); // Log the fetched tasks
      return tasks; // Return the fetched tasks
    } else {
      console.error("❌ Failed to fetch tasks. Status:", response.status); // Log failure status
      throw new Error(`Failed to fetch tasks: ${response.status}`);
    }
  } catch (error) {
    console.error("❌ Error fetching tasks:", error); // Log the error
    throw new Error("An error occurred while fetching tasks");
  }
}


export async function startTaskTimer(taskId: number): Promise<any> {
  try {
    const response = await fetch(`${API_URL}/api/v1/tasks/start_timer?task_id=${taskId}`, {
      method: "POST", // Use POST as specified
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Include cookies if required
    });

    if (!response.ok) {
      throw new Error(`Failed to start timer for task: ${response.status}`);
    }

    const result = await response.json();
    return result; // Return the response from the API
  } catch (error) {
    console.error("Error starting task timer:", error); // Log the error
    throw new Error("An error occurred while starting the task timer");
  }
}


// Fetch chat history
export async function fetchChatHistory(taskId: number, userId: number, page: number, limit: number): Promise<ChatHistoryResponse> {
  try {
    const response = await fetch(`${API_URL}/api/v1/chat/chat_history?task_id=${taskId}&user_id=${userId}&page=${page}&limit=${limit}`,
      { method: "GET" }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch chat history: ${response.status}`);
    }

    return await response.json(); // Return chat history
  } catch (error) {
    console.error("Error fetching chat history:", error);
    throw error;
  }
}

// Monthly Target Overview Types
interface MonthlyTargetRequest {
  month: number; // Month number (1-12)
  year?: number; // Year (optional, defaults to current year)
}

interface MonthlyTargetResponse {
  month_name: string;
  total_target_count?: number;
  total_completed?: number;
  total_in_progress?: number;
  overall_completion_percentage?: number;
}

// Fetch monthly target overview
export async function fetchMonthlyTargetOverview(payload: MonthlyTargetRequest): Promise<MonthlyTargetResponse> {
  try {
    const response = await fetch(`${API_URL}/api/v1/dashboard/target/monthly-overview`, {
      method: "POST",
      credentials: "include", // Include cookies for authentication
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload), // Convert payload to JSON string
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch monthly target overview: ${response.status}`);
    }

    const result = await response.json();
    return result; // Return the response from the API
  } catch (error) {
    console.error("❌ Error fetching monthly target overview:", error); // Log the error
    throw new Error("An error occurred while fetching monthly target overview");
  }
}
