export async function addNewAdditionalDetailType(newAdditionalDetailType: string): Promise<AddDropdownItemResponse> {
  try {
    console.log('=== addNewAdditionalDetailType Debug ===');
    console.log('New additional detail type:', newAdditionalDetailType);
    console.log('API_URL:', API_URL);
    const response = await fetch(`${API_URL}/api/v1/Content/dropdown`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        column: "additional_details",
        value: newAdditionalDetailType,
        is_active: true
      }),
    });
    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);
    if (!response.ok) {
      let errorMessage = `Failed to add new additional detail type: ${response.status}`;
      try {
        const errorData = await response.json();
        console.error('Error response data:', errorData);
        errorMessage = errorData.detail || errorMessage;
      } catch (parseError) {
        console.error('Failed to parse error response:', parseError);
        errorMessage = `Failed to add new additional detail type: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }
    const result = await response.json();
    console.log('Add additional detail type success response:', result);
    return result;
  } catch (error) {
    console.error('Error adding new additional detail type:', error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('An unknown error occurred while adding new additional detail type');
    }
  }
}
import { API_URL } from '../profile/apiurl';

// Interface definitions matching the FastAPI models
export interface CreateProfileRequest {
  name: string;
  contact?: any;
  details?: any;
  address?: any;
  profile?: any;
  tag?: any;
}

export interface CreateProfileResponse {
  message: string;
  profile_id: number;
  name: string;
  created_fields: string[];
}

export interface UpdateProfileRequest {
  name?: string;
  contact?: any;
  details?: any;
  address?: any;
  profile?: any;
  tag?: any;
  is_delete?: boolean;
}

export interface UpdateProfileResponse {
  message: string;
  profile_id: number;
  updated_fields: string[];
}

export interface ProfileListItem {
  s_no: number;
  name: string;
  tag?: string[];
}

export interface ProfileListResponse {
  message: string;
  total_profiles: number;
  profiles: ProfileListItem[];
}

export interface ProfileDetailResponse {
  profile_id: number;
  name: string;
  contact?: any;
  details?: any;
  address?: any;
  profile?: any;
  tag?: any;
  created_by: number;
  created_by_name: string;
  created_at?: string;
  updated_at?: string;
}

export interface AddDropdownItemRequest {
  column: string;
  value: string;
  is_active: boolean;
}

export interface AddDropdownItemResponse {
  message: string;
  id: number;
}

/**
 * Create a new profile
 * POST /api/v1/Profile/profile/create
 */
export async function createProfile(data: CreateProfileRequest): Promise<CreateProfileResponse> {
  try {
    console.log('=== createProfile Debug ===');
    console.log('Request data:', data);
    console.log('API_URL:', API_URL);

    const response = await fetch(`${API_URL}/api/v1/profile/profile/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);

    if (!response.ok) {
      let errorMessage = `Failed to create profile: ${response.status}`;
      try {
        const errorData = await response.json();
        console.error('Error response data:', errorData);
        errorMessage = errorData.detail || errorMessage;
      } catch (parseError) {
        console.error('Failed to parse error response:', parseError);
        errorMessage = `Failed to create profile: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log('Create profile success response:', result);
    return result;
  } catch (error) {
    console.error('Error creating profile:', error);

    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('An unknown error occurred while creating profile');
    }
  }
}

/**
 * Get list of all active profiles
 * POST /api/v1/Profile/profiles/list
 */
export async function getProfilesList(): Promise<ProfileListResponse> {
  try {
    console.log('=== getProfilesList Debug ===');
    console.log('API_URL:', API_URL);

    const response = await fetch(`${API_URL}/api/v1/profile/profiles/list`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);

    if (!response.ok) {
      let errorMessage = `Failed to fetch profiles list: ${response.status}`;
      try {
        const errorData = await response.json();
        console.error('Error response data:', errorData);
        errorMessage = errorData.detail || errorMessage;
      } catch (parseError) {
        console.error('Failed to parse error response:', parseError);
        errorMessage = `Failed to fetch profiles list: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log('Get profiles list success response:', result);
    return result;
  } catch (error) {
    console.error('Error fetching profiles list:', error);

    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('An unknown error occurred while fetching profiles list');
    }
  }
}

/**
 * Get specific profile by ID with full details
 * POST /api/v1/Profile/profile/{profile_id}
 */
export async function getProfileById(profileId: number): Promise<ProfileDetailResponse> {
  try {
    console.log('=== getProfileById Debug ===');
    console.log('Profile ID:', profileId);
    console.log('API_URL:', API_URL);

    const response = await fetch(`${API_URL}/api/v1/profile/profile/${profileId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);

    if (!response.ok) {
      let errorMessage = `Failed to fetch profile: ${response.status}`;
      try {
        const errorData = await response.json();
        console.error('Error response data:', errorData);
        errorMessage = errorData.detail || errorMessage;
      } catch (parseError) {
        console.error('Failed to parse error response:', parseError);
        errorMessage = `Failed to fetch profile: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log('Get profile success response:', result);
    return result;
  } catch (error) {
    console.error('Error fetching profile:', error);

    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('An unknown error occurred while fetching profile');
    }
  }
}

/**
 * Update an existing profile or soft delete it
 * POST /api/v1/Profile/profile/update/{profile_id}
 */
export async function updateProfile(profileId: number, data: UpdateProfileRequest): Promise<UpdateProfileResponse> {
  try {
    console.log('=== updateProfile Debug ===');
    console.log('Profile ID:', profileId);
    console.log('Update data:', data);
    console.log('API_URL:', API_URL);

    const response = await fetch(`${API_URL}/api/v1/profile/profile/update/${profileId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);

    if (!response.ok) {
      let errorMessage = `Failed to update profile: ${response.status}`;
      try {
        const errorData = await response.json();
        console.error('Error response data:', errorData);
        errorMessage = errorData.detail || errorMessage;
      } catch (parseError) {
        console.error('Failed to parse error response:', parseError);
        errorMessage = `Failed to update profile: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log('Update profile success response:', result);
    return result;
  } catch (error) {
    console.error('Error updating profile:', error);

    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('An unknown error occurred while updating profile');
    }
  }
}

/**
 * Soft delete a profile
 * This is a convenience function that calls updateProfile with is_delete: true
 */
export async function deleteProfile(profileId: number): Promise<UpdateProfileResponse> {
  try {
    console.log('=== deleteProfile Debug ===');
    console.log('Profile ID:', profileId);

    return await updateProfile(profileId, { is_delete: true });
  } catch (error) {
    console.error('Error deleting profile:', error);

    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('An unknown error occurred while deleting profile');
    }
  }
}

/**
 * Add new tag using the content/dropdown API
 * POST /api/v1/Content/dropdown
 */
export async function addNewTag(newTag: string): Promise<AddDropdownItemResponse> {
  try {
    console.log('=== addNewTag Debug ===');
    console.log('New tag:', newTag);
    console.log('API_URL:', API_URL);

    const response = await fetch(`${API_URL}/api/v1/Content/dropdown`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        column: "tags",
        value: newTag,
        is_active: true
      }),
    });

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);

    if (!response.ok) {
      let errorMessage = `Failed to add new tag: ${response.status}`;
      try {
        const errorData = await response.json();
        console.error('Error response data:', errorData);
        errorMessage = errorData.detail || errorMessage;
      } catch (parseError) {
        console.error('Failed to parse error response:', parseError);
        errorMessage = `Failed to add new tag: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log('Add tag success response:', result);
    return result;
  } catch (error) {
    console.error('Error adding new tag:', error);

    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('An unknown error occurred while adding new tag');
    }
  }
}

/**
 * Add new contact type using the content/dropdown API
 * POST /api/v1/Content/dropdown
 */
export async function addNewContactType(newContactType: string): Promise<AddDropdownItemResponse> {
  try {
    console.log('=== addNewContactType Debug ===');
    console.log('New contact type:', newContactType);
    console.log('API_URL:', API_URL);

    const response = await fetch(`${API_URL}/api/v1/Content/dropdown`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        column: "contact",
        value: newContactType,
        is_active: true
      }),
    });

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);

    if (!response.ok) {
      let errorMessage = `Failed to add new contact type: ${response.status}`;
      try {
        const errorData = await response.json();
        console.error('Error response data:', errorData);
        errorMessage = errorData.detail || errorMessage;
      } catch (parseError) {
        console.error('Failed to parse error response:', parseError);
        errorMessage = `Failed to add new contact type: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log('Add contact type success response:', result);
    return result;
  } catch (error) {
    console.error('Error adding new contact type:', error);

    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('An unknown error occurred while adding new contact type');
    }
  }
}
