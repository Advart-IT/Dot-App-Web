const API_URL = process.env.API_URL ||  "https://tasks.advartit.in" ; // Fallback to localhost if not defined

export async function signupUser(
  username: string,
  password: string,
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
    const response = await fetch(`https://tasks.advartit.in/api/v1/tasks/tasks?${params.toString()}`, {
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
