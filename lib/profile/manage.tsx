import { API_URL } from './apiurl';

interface InviteUserRequest {
  department: string;
  designation: string;
  email: string;
}

interface ToggleUserStatusRequest {
  employee_id: number;
  is_active: boolean;
}

// Updated interface to include influencer permissions
export interface UpdatePermissionsRequest {
  filter_type: 'admin' | 'invite_level' | 'stats' | 'profile' | 'shoot' | 'content' | 'data' | 'all'; // Added 'all', 'content', 'data'
  admin?: boolean;
  invite_level?: 'own_brand' | 'any_brand';
  profile?: boolean;
  shoot?: boolean;
  stats?: {
    people?: boolean;
    content?: string[];
  };
  // Added fields for other filter types that might be needed
  brands?: Record<string, Record<string, string[]>>; // For 'content' filter
  brand_admin?: boolean; // For 'content' filter
  reportrix?: Record<string, string[]>; // For 'data' filter (Note: API expects list of brands, this is object)
  reportrix_admin?: boolean; // For 'data' filter
  influencer?: string[]; // For 'all', 'content', 'data', 'stats', 'profile', 'shoot' filters
}

interface UserPermissions {
  admin: boolean;
  settings: boolean;
  invite_level: string;
  brand_admin: boolean;
  reportrix_admin: boolean;
  brands: Record<string, Record<string, string[]>>;
  reportrix: Record<string, string[]>; // Note: API returns list of brands, this is object
  Stats: {
    people: boolean;
    content: string[];
  };
  influencer: string[]; // Added influencer permissions
  profile?: boolean;
  shoot?: boolean;
}

interface UserPermissionsResponse {
  employee_id: number;
  username: string;
  permissions: UserPermissions;
}

interface InviteUserResponse {
  message: string;
  employee_id: number;
  expires_in: string;
}

interface ToggleUserStatusResponse {
  message: string;
  employee_id: number;
  username: string;
  is_active: boolean;
  previous_status: boolean;
}

// Invite user to join the platform
export async function inviteUser(email: string, department: string, designation: string): Promise<InviteUserResponse> {
  try {
    console.log('=== inviteUser Debug ===');
    console.log('Email:', email, typeof email);
    console.log('Department:', department, typeof department);
    console.log('Designation:', designation, typeof designation);
    console.log('API_URL:', API_URL);
    
    // Ensure parameters are strings
    const emailStr = String(email || '').trim();
    const departmentStr = String(department || '').trim();
    const designationStr = String(designation || '').trim();
    
    console.log('Email string:', emailStr);
    console.log('Department string:', departmentStr);
    console.log('Designation string:', designationStr);
    
    if (!emailStr) {
      throw new Error('Email is required');
    }
    
    if (!departmentStr) {
      throw new Error('Department is required');
    }
    
    if (!designationStr) {
      throw new Error('Designation is required');
    }
    
    // Create URL with query parameters as FastAPI expects them
    const params = new URLSearchParams();
    params.append('department', departmentStr);
    params.append('designation', designationStr);
    params.append('email', emailStr);
    
    const url = `${API_URL}/api/v1/auth/invite-user?${params.toString()}`;
    console.log('Request URL with params:', url);
    console.log('Query parameters:', params.toString());
    
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);

    if (!response.ok) {
      let errorMessage = `Failed to send invite: ${response.status}`;
      try {
        const errorData = await response.json();
        console.error('Error response data:', errorData);
        errorMessage = errorData.detail || errorMessage;
      } catch (parseError) {
        console.error('Failed to parse error response:', parseError);
        errorMessage = `Failed to send invite: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log('Success response:', result);
    return result;
  } catch (error) {
    console.error('Error sending invite:', error);
    
    // Ensure we always throw a proper Error with a string message
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('An unknown error occurred while sending invite');
    }
  }
}

// Toggle user active/inactive status
export async function toggleUserStatus(employee_id: number, is_active: boolean): Promise<ToggleUserStatusResponse> {
  try {
    console.log('=== toggleUserStatus Debug ===');
    console.log('Employee ID:', employee_id, typeof employee_id);
    console.log('Is Active:', is_active, typeof is_active);
    console.log('API_URL:', API_URL);
    
    // Ensure parameters are properly converted
    const employeeIdNum = Number(employee_id);
    const isActiveBool = Boolean(is_active);
    
    console.log('Employee ID number:', employeeIdNum);
    console.log('Is Active boolean:', isActiveBool);
    
    if (isNaN(employeeIdNum) || employeeIdNum <= 0) {
      throw new Error('Valid employee ID is required');
    }
    
    // Create URL with query parameters as FastAPI expects them
    const params = new URLSearchParams();
    params.append('employee_id', String(employeeIdNum));
    params.append('is_active', String(isActiveBool));
    
    const url = `${API_URL}/api/v1/auth/toggle-user-status?${params.toString()}`;
    console.log('Request URL with params:', url);
    console.log('Query parameters:', params.toString());
    
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);

    if (!response.ok) {
      let errorMessage = `Failed to update user status: ${response.status}`;
      try {
        const errorData = await response.json();
        console.error('Error response data:', errorData);
        errorMessage = errorData.detail || errorMessage;
      } catch (parseError) {
        console.error('Failed to parse error response:', parseError);
        errorMessage = `Failed to update user status: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log('Success response:', result);
    return result;
  } catch (error) {
    console.error('Error updating user status:', error);
    
    // Ensure we always throw a proper Error with a string message
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('An unknown error occurred while updating user status');
    }
  }
}

// Get user permissions
export async function getUserPermissions(employeeId: number): Promise<UserPermissionsResponse> {
  try {
    const response = await fetch(`${API_URL}/api/v1/auth/Print_permissions/${employeeId}`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      let errorMessage = `Failed to fetch user permissions: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorMessage;
      } catch {
        errorMessage = `Failed to fetch user permissions: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('An unknown error occurred while fetching user permissions');
    }
  }
}

// Update user permissions (admin or invite_level)
export async function updateUserPermissions(
  employeeId: number, 
  data: UpdatePermissionsRequest
): Promise<any> {
  try {
    console.log('=== updateUserPermissions Debug ===');
    console.log('Employee ID:', employeeId);
    console.log('Request data:', data);

    // Validate required fields based on filter_type
    if (data.filter_type === 'admin' && data.admin === undefined) {
      throw new Error('Admin status must be provided for admin filter');
    }
    if (data.filter_type === 'content' && data.brands === undefined) {
      throw new Error('Brands must be provided for content filter');
    }
    if (data.filter_type === 'data' && data.reportrix === undefined) {
      throw new Error('Reportrix must be provided for data filter');
    }
    if (data.filter_type === 'invite_level' && data.invite_level === undefined) {
      throw new Error('Invite level must be provided for invite_level filter');
    }
    if (data.filter_type === 'stats' && data.stats === undefined) {
      throw new Error('Stats must be provided for stats filter');
    }
    if (data.filter_type === 'profile' && data.profile === undefined && data.shoot === undefined) {
      throw new Error('Profile or shoot status must be provided for profile filter');
    }
    if (data.filter_type === 'shoot' && data.shoot === undefined) {
      throw new Error('Shoot status must be provided for shoot filter');
    }
    // Note: 'all' filter might not require other specific fields if influencer is the only one being updated

    const response = await fetch(`${API_URL}/api/v1/auth/update_permissions/${employeeId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    console.log('Response status:', response.status);
    if (!response.ok) {
      let errorMessage = `Failed to update permissions: ${response.status}`;
      try {
        const errorData = await response.json();
        console.error('Error response data:', errorData);
        errorMessage = errorData.detail || errorMessage;
      } catch (parseError) {
        console.error('Failed to parse error response:', parseError);
        errorMessage = `Failed to update permissions: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log('Success response:', result);
    return result;
  } catch (error) {
    console.error('Error updating permissions:', error);
    
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('An unknown error occurred while updating permissions');
    }
  }
}

// Create new brand
export async function createNewBrand(brandName: string): Promise<any> {
  try {
    console.log('=== createNewBrand Debug ===');
    console.log('Brand Name:', brandName, typeof brandName);
    console.log('API_URL:', API_URL);
    
    // Ensure parameter is string
    const brandNameStr = String(brandName || '').trim();
    
    console.log('Brand Name string:', brandNameStr);
    
    if (!brandNameStr) {
      throw new Error('Brand name is required');
    }
    
    const requestBody = {
      column: "brand_name",
      value: brandNameStr,
      is_active: true
    };
    
    console.log('Request body:', requestBody);
    
    const response = await fetch(`${API_URL}/api/v1/Content/dropdown`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(requestBody),
    });

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);

    if (!response.ok) {
      let errorMessage = `Failed to create brand: ${response.status}`;
      try {
        const errorData = await response.json();
        console.error('Error response data:', errorData);
        errorMessage = errorData.detail || errorMessage;
      } catch (parseError) {
        console.error('Failed to parse error response:', parseError);
        errorMessage = `Failed to create brand: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log('Success response:', result);
    return result;
  } catch (error) {
    console.error('Error creating brand:', error);
    
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('An unknown error occurred while creating brand');
    }
  }
}

// Create new designation using the same API endpoint with column="designation"
export async function createNewDesignation(designationName: string): Promise<any> {
  try {
    console.log('=== createNewDesignation Debug ===');
    console.log('Designation Name:', designationName, typeof designationName);
    console.log('API_URL:', API_URL);
    
    // Ensure parameter is string
    const designationNameStr = String(designationName || '').trim();
    
    console.log('Designation Name string:', designationNameStr);
    
    if (!designationNameStr) {
      throw new Error('Designation name is required');
    }
    
    const requestBody = {
      column: "Designation",
      value: designationNameStr,
      is_active: true
    };
    
    console.log('Request body:', requestBody);
    
    const response = await fetch(`${API_URL}/api/v1/Content/dropdown`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(requestBody),
    });

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);

    if (!response.ok) {
      let errorMessage = `Failed to create designation: ${response.status}`;
      try {
        const errorData = await response.json();
        console.error('Error response data:', errorData);
        errorMessage = errorData.detail || errorMessage;
      } catch (parseError) {
        console.error('Failed to parse error response:', parseError);
        errorMessage = `Failed to create designation: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log('Success response:', result);
    return result;
  } catch (error) {
    console.error('Error creating designation:', error);
    
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('An unknown error occurred while creating designation');
    }
  }
}