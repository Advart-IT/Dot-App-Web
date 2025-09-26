const API_URL = process.env.API_URL ||  "https://tasks.advartit.in"; // Fallback to localhost if not defined

export async function signupUser(
  username: string,
  password: string,
  email: string,
  designation: string
): Promise<any> {
  try {
    const response = await fetch(`${API_URL}/api/v1/auth/signup`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        username,
        password,
        email,
        designation,
      }),
    });

    if (response.ok) {
      const signupData = await response.json();
      return signupData;
    } else {
      throw new Error(`Failed to sign up: ${response.status}`);
    }
  } catch (error) {
    console.error("Error signing up:", error);
    throw new Error("An error occurred during signup");
  }
}

export async function loginUser(username: string, password: string): Promise<any> {
  try {
    const formData = new FormData();
    formData.append("username", username);
    formData.append("password", password);

    const response = await fetch(`${API_URL}/api/v1/auth/login`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    if (response.ok) {
      const loginData = await response.json();
      return loginData;
    } else {
      throw new Error(`Failed to log in: ${response.status}`);
    }
  } catch (error) {
    console.error("Error logging in:", error);
    throw new Error("An error occurred while logging in");
  }
}

export async function forgotPassword(email: string): Promise<any> {
  try {
    const response = await fetch(`${API_URL}/api/v1/auth/forgot-password`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    if (response.ok) {
      const responseData = await response.json();
      return responseData;
    } else {
      throw new Error(`Failed to process forgot password request: ${response.status}`);
    }
  } catch (error) {
    console.error("Error in forgot password request:", error);
    throw new Error("An error occurred while processing the forgot password request");
  }
}

export async function resetPassword(email: string, otp: string, newPassword: string, token: string): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/api/v1/auth/reset-password`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          otp,
          new_password: newPassword, // updated key name
          token, // Ensure you send the token
        }),
      });

      if (response.ok) {
        const responseData = await response.json();
        return responseData;
      } else {
        throw new Error(`Failed to reset password: ${response.status}`);
      }
    } catch (error) {
      console.error("Error resetting password:", error);
      throw new Error("An error occurred while resetting the password");
    }
  }


export async function logoutUser(): Promise<void> {
  try {
    const response = await fetch(`${API_URL}/api/v1/auth/logout`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      if (typeof window !== "undefined") {
        localStorage.clear();
      }
    } else {
      throw new Error(`Failed to log out: ${response.status}`);
    }
  } catch (error) {
    console.error("Error logging out:", error);
    throw new Error("An error occurred while logging out");
  }
}

export async function fetchUserData(): Promise<any> {
  try {
    const response = await fetch(`${API_URL}/api/v1/auth/users`, {
      method: "GET",
      credentials: "include",
    });

    if (response.ok) {
      const userData = await response.json();
      return userData;
    } else {
      throw new Error(`Failed to fetch user data: ${response.status}`);
    }
  } catch (error) {
    console.error("Error fetching user data:", error);
    throw new Error("An error occurred while fetching user data");
  }
}


export async function fetchTasks(params: URLSearchParams): Promise<any> {
  try {
    const response = await fetch(`${API_URL}/api/v1/tasks/tasks?${params.toString()}`, {
      method: "GET",
      credentials: "include",
    });

    if (response.ok) {
      const tasks = await response.json();
      return tasks; // Return the fetched tasks
    } else {
      throw new Error(`Failed to fetch tasks: ${response.status}`);
    }
  } catch (error) {
    console.error("Error fetching tasks:", error);
    throw new Error("An error occurred while fetching tasks");
  }
}


interface FetchContentParams {
  brand_name: string;
  status?: string;
  format_type?: string;
  sort_by?: string;
  sort_order?: string;
  offset: number;
  limit: number;
  live_month_year?: string; // Optional parameter for live month/year
}

interface UpsertContentParams {
  id?: number; // Required
  marketing_funnel?: string;
  top_pointers?: string;
  post_type?: string;
  format_type?: string;
  ads_type?: string;
  detailed_concept?: string;
  copy?: string;
  description?: string;
  reference?: string;
  media_links?: string;
  hashtags?: string;
  seo_keywords?: string;
  brand_name?: string;
  status?: string;
  review_comment?: string;
  live_date?: string;
  task_id?: number;
  is_delete?: boolean;
}

export async function fetchContent(params: FetchContentParams): Promise<any> {
  try {
    // Construct the query parameters
    const queryParams = new URLSearchParams(
      Object.entries({
        brand_name: params.brand_name,
        status: params.status,
        format_type: params.format_type,
        sort_by: params.sort_by,
        sort_order: params.sort_order,
        offset: params.offset.toString(),
        limit: params.limit.toString(),
        live_month_year: params.live_month_year || "",
      })
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([key, value]) => [key, String(value)])
    );

    // Make the GET request
    const response = await fetch(`${API_URL}/api/v1/Content/print_content?${queryParams.toString()}`, {
      method: "GET",
      credentials: "include", // Ensures cookies are sent with the request
      headers: {
        "Accept": "application/json", // Specify the expected response type
      },
    });

    // Handle the response
    if (response.ok) {
      const contentData = await response.json();
      return contentData; // Return the fetched content data
    } else {
      throw new Error(`Failed to fetch content: ${response.status}`);
    }
  } catch (error) {
    console.error("Error fetching content:", error);
    throw new Error("An error occurred while fetching content");
  }
}

export async function upsertContent(params: UpsertContentParams): Promise<any> {
  try {
    // Make the POST request
    const response = await fetch(`${API_URL}/api/v1/Content/upsert_content`, {
      method: "POST",
      credentials: "include", // Ensures cookies are sent with the request
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params), // Send the data as JSON
    });

    // Handle the response
    if (response.ok) {
      const result = await response.json();
      return result; // Return the result of the upsert operation
    } else {
      throw new Error(`Failed to upsert content: ${response.status}`);
    }
  } catch (error) {
    console.error("Error upserting content:", error);
    throw new Error("An error occurred while upserting content");
  }
}
