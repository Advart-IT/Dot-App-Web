import { API_URL } from './apiurl';

export interface UserPermissionsResponse {
  employee_id: number;
  username: string;
  permissions: {
    admin?: boolean;
    brands?: Record<string, Record<string, string[]>>;
    settings?: boolean;
    reportrix?: string[] | Record<string, string[]>;  // Can be array or object based on filter
    brand_admin?: boolean;
    invite_level?: string;
    reportrix_admin?: boolean;
    profile?: boolean;
    shoot?: boolean;
    Stats?: {
      people?: boolean;
      content?: string[];
    };
  };
}

export async function fetchUserPermissions(
  employee_id: number,
  filterType: string
): Promise<UserPermissionsResponse> {
  try {
    const params = new URLSearchParams({
      filter_type: filterType  // Backend expects 'filter_type', not 'filter'
    });

    const url = `${API_URL}/api/v1/auth/Print_permissions/${employee_id}?${params.toString()}`;
    console.log('Fetching user permissions from URL:', url);
    console.log('API_URL:', API_URL);
    console.log('Employee ID:', employee_id);
    console.log('Filter Type:', filterType);
    console.log('Full URL being called:', url);

    const response = await fetch(
      url,
      {
        method: "GET",
        credentials: "include",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
      }
    );

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);

    if (response.ok) {
      const data = await response.json();
      console.log('Received data:', data);
      return data;
    } else {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      throw new Error(`Failed to fetch user permissions: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    console.error("Error fetching user permissions:", error);
    
    // More specific error handling
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      console.error('Network error - check if API server is running and accessible');
      throw new Error('Network error: Unable to connect to the API server. Please check if the server is running.');
    }
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error("An unknown error occurred while fetching user permissions");
  }
}

export interface GranularPermissionUpdate {
  filter_type: string;  // "content", "data", "invite_level", "admin"
  brands?: Record<string, Record<string, string[]>>;
  brand_admin?: boolean;
  reportrix?: Record<string, string[]>;
  reportrix_admin?: boolean;
  invite_level?: string;
  admin?: boolean;
}

export async function updateGranularPermissions(
  employee_id: number,
  updateData: GranularPermissionUpdate
): Promise<UserPermissionsResponse> {
  try {
    const response = await fetch(
      `${API_URL}/api/v1/auth/update_permissions/${employee_id}`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData)
      }
    );

    if (response.ok) {
      const result = await response.json();
      return result;
    } else {
      const errorText = await response.text();
      throw new Error(`Failed to update user permissions: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    console.error("Error updating user permissions:", error);
    throw new Error("An error occurred while updating user permissions");
  }
}
