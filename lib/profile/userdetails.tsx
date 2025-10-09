// lib/profile/userdetails.tsx (Corrected API functions)
import { API_URL } from './apiurl'; // Ensure API_URL is correctly defined

export interface UpdateUserParams {
  employee_id: number;
  new_username?: string;
  new_password?: string;
  current_password?: string;
}

export interface UpdateUserResponse {
  message: string;
  employee_id: number;
  username: string;
  updates: string[];
}

export async function updateUser(params: UpdateUserParams): Promise<UpdateUserResponse> {
  try {
    // Validate required parameters
    if (!params.employee_id) {
      throw new Error('Employee ID is required');
    }
    // Validate at least one field is provided
    if (!params.new_username && !params.new_password) {
      throw new Error('At least username or password must be provided');
    }
    // If updating password, current password is required
    if (params.new_password && !params.current_password) {
      throw new Error('Current password is required when updating password');
    }

    console.log('Updating user with params:', {
      employee_id: params.employee_id,
      new_username: params.new_username,
      has_new_password: !!params.new_password,
      has_current_password: !!params.current_password
    });

    // Build query parameters - all fields as query parameters since server expects them there
    const queryParams = new URLSearchParams();
    queryParams.append('employee_id', params.employee_id.toString());
    
    if (params.new_username) {
      queryParams.append('new_username', params.new_username);
    }
    if (params.new_password) {
      queryParams.append('new_password', params.new_password);
    }
    if (params.current_password) {
      queryParams.append('current_password', params.current_password);
    }

    console.log('Request URL:', `${API_URL}/api/v1/auth/update-user?${queryParams.toString()}`);

    // Send a POST request with all data as query parameters and empty body
    const response = await fetch(`${API_URL}/api/v1/auth/update-user?${queryParams.toString()}`, {
      method: "POST",
      credentials: "include", // Include cookies for authentication
      headers: {
        "Accept": "application/json",
      },
    });

    console.log('Update user response status:', response.status);
    console.log('Update user response ok:', response.ok);

    if (response.ok) {
      const data: UpdateUserResponse = await response.json();
      console.log('User updated successfully:', data);
      return data;
    } else {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);

      // Try to parse error message from response
      let errorMessage = `Failed to update user: ${response.status}`;
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.detail) {
          errorMessage = errorData.detail;
        }
      } catch {
        // If not JSON, use the text as is
        errorMessage = errorText || errorMessage;
      }

      throw new Error(errorMessage);
    }
  } catch (error) {
    console.error("Error updating user:", error);

    // More specific error handling
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('Network error: Unable to connect to the server. Please check if the server is running.');
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error("An unknown error occurred while updating user");
  }
}

// Keep the helper functions as they are, they call the corrected updateUser function
export async function updateUsername(
  employee_id: number,
  new_username: string
): Promise<UpdateUserResponse> {
  return updateUser({
    employee_id,
    new_username
  });
}

export async function updatePassword(
  employee_id: number,
  current_password: string,
  new_password: string
): Promise<UpdateUserResponse> {
  return updateUser({
    employee_id,
    current_password,
    new_password
  });
}

export async function updateUsernameAndPassword(
  employee_id: number,
  new_username: string,
  current_password: string,
  new_password: string
): Promise<UpdateUserResponse> {
  return updateUser({
    employee_id,
    new_username,
    current_password,
    new_password
  });
}