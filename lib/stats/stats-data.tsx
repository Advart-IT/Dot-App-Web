const API_URL = process.env.API_URL || "https://tasks.advartit.in"; // Fallback to localhost if not defined

// Monthly Stats Request Types
interface MonthlyStatsRequest {
  month: number; // Month number (1-12)
  year?: number; // Year (optional, defaults to current year)
}

interface UserMonthlyStats {
  user_id: string;
  username: string;
  designation?: string;
  department?: string;
  month_name: string;
  total_target_count?: number;
  total_completed?: number;
  total_in_progress?: number;
  overall_completion_percentage?: number;
}

interface AllUsersMonthlyStatsResponse {
  users: UserMonthlyStats[];
}

// Content Monthly Stats Request Types
interface ContentMonthlyStatsRequest {
  month: number; // Month number (1-12)
  year?: number; // Year (optional, defaults to current year)
  content_type: 'social_media' | 'ads'; // Content type
}

interface ContentMonthlyStats {
  content_id?: string;
  content_title?: string;
  content_type?: string;
  month_name: string;
  total_target_count?: number;
  total_completed?: number;
  total_in_progress?: number;
  overall_completion_percentage?: number;
  created_by?: string;
  assigned_to?: string;
}

interface ContentMonthlyStatsResponse {
  content: ContentMonthlyStats[];
}

// Fetch all users monthly stats
export async function fetchAllUsersMonthlyStats(payload: MonthlyStatsRequest): Promise<AllUsersMonthlyStatsResponse> {
  try {
    const response = await fetch(`${API_URL}/api/v1/stats/all-users-monthly`, {
      method: "POST",
      credentials: "include", // Include cookies for authentication
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload), // Convert payload to JSON string
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch all users monthly stats: ${response.status}`);
    }

    const result = await response.json();
    return result; // Return the response from the API
  } catch (error) {
    console.error("❌ Error fetching all users monthly stats:", error); // Log the error
    throw new Error("An error occurred while fetching all users monthly stats");
  }
}

// Fetch content monthly stats
export async function fetchContentMonthlyStats(payload: ContentMonthlyStatsRequest): Promise<ContentMonthlyStatsResponse> {
  try {
    const response = await fetch(`${API_URL}/api/v1/stats/content/monthly-stats`, {
      method: "POST",
      credentials: "include", // Include cookies for authentication
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload), // Convert payload to JSON string
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch content monthly stats: ${response.status}`);
    }

    const result = await response.json();
    return result; // Return the response from the API
  } catch (error) {
    console.error("❌ Error fetching content monthly stats:", error); // Log the error
    throw new Error("An error occurred while fetching content monthly stats");
  }
}