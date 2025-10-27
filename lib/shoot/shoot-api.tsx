// Types for Shoot Target Print API
export interface ShootTargetBrandResult {
  brand: string;
  target: string;
  target_achieved: number;
  start_date: string; // ISO date string (YYYY-MM-DD)
  end_date: string;   // ISO date string (YYYY-MM-DD)
}
export interface ShootTargetPrintResponse {
  results: ShootTargetBrandResult[];
}
export interface ShootTargetPrint {
  start_date: string; // ISO date string (YYYY-MM-DD)
  end_date: string;   // ISO date string (YYYY-MM-DD)
}
/**
 * Print active targets for brands within a date range, and show achieved count.
 * @param printData - { start_date, end_date }
 * @returns Promise<ShootTargetPrintResponse>
 */
export const printShootTargets = async (
  printData: ShootTargetPrint
): Promise<ShootTargetPrintResponse> => {
  try {
    const response = await fetch(`${API_URL}/api/v1/shoot/target/print`, getFetchOptions('POST', printData));
    if (!response.ok) {
      let errorMessage = `Failed to fetch shoot targets: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorMessage;
      } catch {}
      throw new Error(errorMessage);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching shoot targets:', error);
    throw error;
  }
};
import { API_URL } from "../profile/apiurl";
// Types based on Python Pydantic models
export interface ShootCreate {
  date: string; // ISO date string (YYYY-MM-DD)
  brand?: string;
  photographer?: number; // Profile s_no of the photographer
  model?: number[]; // Profile s_no(s) of the model(s)
  products_covered?: string;
  total_hrs?: string; // Total hours in decimal format (e.g., '8.50')
  shoot_charges?: Record<string, any>; // JSON object for shoot charges
  expenses?: Record<string, any>; // JSON object for expenses (e.g., {'travel': 500, 'food': 300})
  media_assest?: string; // Note: Python uses 'media_assest' (with typo)
  product_link?: string[][]; // Product links as nested array
}
export interface ShootUpdate {
  shoot_id: number; // ID of the shoot to update or delete
  date?: string; // ISO date string (YYYY-MM-DD)
  brand?: string;
  photographer?: number; // Profile s_no of the photographer
  model?: number[]; // Profile s_no(s) of the model(s)
  products_covered?: string;
  total_hrs?: string; // Total hours in decimal format (e.g., '8.50')
  shoot_charges?: Record<string, any>; // JSON object for shoot charges
  expenses?: Record<string, any>; // JSON object for expenses (e.g., {'travel': 500, 'food': 300})
  media_assest?: string; // Note: Python uses 'media_assest' (with typo)
  product_link?: string[][]; // Product links as nested array
  is_delete?: boolean; // Set to true to delete the shoot (soft delete)
}

export interface ShootPrint {
  // For single shoot retrieval
  shoot_id?: number; // ID of specific shoot to retrieve
  
  // For filtering multiple shoots
  date_filter?: 'lt' | 'gt' | 'eq' | 'between'; // Date filter type: lt (less than), gt (greater than), eq (equal to), between
  target_date?: string; // Target date for lt, gt, eq filters (ISO date string)
  start_date?: string; // Start date for between filter (ISO date string)
  end_date?: string; // End date for between filter (ISO date string)
  brand?: string; // Filter by brand name (case-insensitive partial match)
  photographer?: string; // Filter by photographer name (case-insensitive partial match)
  page?: number; // Page number for pagination (default: 1, min: 1)
  limit?: number; // Number of records per page (default: 50, min: 1, max: 500)
}

export interface ShootResponse {
  id: number;
  date: string; // ISO date string
  brand?: string;
  photographer?: number;
  photographer_name?: string; // Name of the photographer from profile
  model?: number[];
  model_names?: string[]; // Names of the models from profile
  products_covered?: string;
  total_hrs?: string;
  shoot_charges?: Record<string, any>;
  total_shoot_charges?: number; // Calculated total from shoot_charges JSON
  expenses?: Record<string, any>;
  total_expenses?: number; // Calculated total from expenses JSON
  media_assest?: string; // Note: Python uses 'media_assest' (with typo)
  product_link?: string[][]; // Product links as nested array
  created_by?: number;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface ShootPrintResponse {
  // For single shoot response
  shoot?: ShootResponse;
  
  // For multiple shoots response
  shoots?: ShootResponse[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    has_more: boolean;
    total_pages: number;
  };
  filter_applied?: {
    date_filter?: string;
    target_date?: string;
    start_date?: string;
    end_date?: string;
    brand?: string;
    photographer?: string;
  };
  summary?: {
    total_shoots: number;
    shoots_on_page: number;
    unique_brands: number;
    unique_photographers: number;
    unique_media_statuses: number;
    total_expenses: number;
    average_expenses: number;
    total_hours: number;
    average_hours: number;
    total_shoot_charges: number;
    brands_list: string[];
    photographers_list: number[];
    media_statuses_list: string[];
  };
}

// Utility function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
};

// Utility function to get fetch options with credentials
const getFetchOptions = (method: string, body?: any) => {
  const options: RequestInit = {
    method,
    headers: getAuthHeaders(),
    credentials: 'include', // Include cookies like user.tsx
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  return options;
};

// API Functions

/**
 * Create a new shoot entry
 * @param shootData - Shoot creation data
 * @returns Promise<ShootResponse>
 */
export const createShoot = async (shootData: ShootCreate): Promise<ShootResponse> => {
  try {
    console.log('=== createShoot Debug ===');
    console.log('Request data:', shootData);
    console.log('API_URL:', API_URL);
    
    const response = await fetch(`${API_URL}/api/v1/shoot/shoot/create`, getFetchOptions('POST', shootData));

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);

    if (!response.ok) {
      let errorMessage = `Failed to create shoot: ${response.status}`;
      try {
        const errorData = await response.json();
        console.error('Error response data:', errorData);
        errorMessage = errorData.detail || errorMessage;
      } catch (parseError) {
        console.error('Failed to parse error response:', parseError);
        errorMessage = `Failed to create shoot: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log('Create shoot success response:', result);
    return result;
  } catch (error) {
    console.error('Error creating shoot:', error);
    
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('An unknown error occurred while creating shoot');
    }
  }
};

/**
 * Update or delete an existing shoot entry
 * @param shootData - Shoot update data (includes shoot_id and optional is_delete flag)
 * @returns Promise<ShootResponse | { message: string }>
 */
export const updateShoot = async (shootData: ShootUpdate): Promise<ShootResponse | { message: string }> => {
  try {
    console.log('=== updateShoot Debug ===');
    console.log('Request data:', shootData);
    console.log('API_URL:', API_URL);
    
    const response = await fetch(`${API_URL}/api/v1/shoot/shoot/update`, getFetchOptions('POST', shootData));

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);

    if (!response.ok) {
      let errorMessage = `Failed to update shoot: ${response.status}`;
      try {
        const errorData = await response.json();
        console.error('Error response data:', errorData);
        errorMessage = errorData.detail || errorMessage;
      } catch (parseError) {
        console.error('Failed to parse error response:', parseError);
        errorMessage = `Failed to update shoot: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log('Update shoot success response:', result);
    return result;
  } catch (error) {
    console.error('Error updating shoot:', error);
    
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('An unknown error occurred while updating shoot');
    }
  }
};

/**
 * Get shoot details - either single shoot by ID or filtered list of shoots
 * @param printData - Filter and pagination parameters
 * @returns Promise<ShootPrintResponse>
 */
export const printShoots = async (printData: ShootPrint = {}): Promise<ShootPrintResponse> => {
  try {
    console.log('=== printShoots Debug ===');
    console.log('Request data:', printData);
    console.log('API_URL:', API_URL);
    
    const response = await fetch(`${API_URL}/api/v1/shoot/shoot/print`, getFetchOptions('POST', printData));

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);

    if (!response.ok) {
      let errorMessage = `Failed to fetch shoots: ${response.status}`;
      try {
        const errorData = await response.json();
        console.error('Error response data:', errorData);
        errorMessage = errorData.detail || errorMessage;
      } catch (parseError) {
        console.error('Failed to parse error response:', parseError);
        errorMessage = `Failed to fetch shoots: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log('Print shoots success response:', result);
    return result;
  } catch (error) {
    console.error('Error fetching shoots:', error);
    
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('An unknown error occurred while fetching shoots');
    }
  }
};

// Convenience functions for common operations

/**
 * Get a single shoot by ID
 * @param shootId - The shoot ID to retrieve
 * @returns Promise<ShootResponse | null>
 */
export const getShootById = async (shootId: number): Promise<ShootResponse | null> => {
  try {
    const response = await printShoots({ shoot_id: shootId });
    return response.shoot || null;
  } catch (error) {
    console.error('Error fetching shoot by ID:', error);
    throw error;
  }
};

/**
 * Get shoots filtered by date range
 * @param startDate - Start date (ISO string)
 * @param endDate - End date (ISO string)
 * @param page - Page number (default: 1)
 * @param limit - Records per page (default: 50)
 * @returns Promise<ShootPrintResponse>
 */
export const getShootsByDateRange = async (
  startDate: string,
  endDate: string,
  page: number = 1,
  limit: number = 50
): Promise<ShootPrintResponse> => {
  return await printShoots({
    date_filter: 'between',
    start_date: startDate,
    end_date: endDate,
    page,
    limit,
  });
};

/**
 * Get shoots filtered by brand
 * @param brand - Brand name to filter by
 * @param page - Page number (default: 1)
 * @param limit - Records per page (default: 50)
 * @returns Promise<ShootPrintResponse>
 */
export const getShootsByBrand = async (
  brand: string,
  page: number = 1,
  limit: number = 50
): Promise<ShootPrintResponse> => {
  return await printShoots({
    brand,
    page,
    limit,
  });
};

/**
 * Get shoots filtered by photographer name
 * @param photographerName - Photographer name to filter by
 * @param page - Page number (default: 1)
 * @param limit - Records per page (default: 50)
 * @returns Promise<ShootPrintResponse>
 */
export const getShootsByPhotographer = async (
  photographerName: string,
  page: number = 1,
  limit: number = 50
): Promise<ShootPrintResponse> => {
  return await printShoots({
    photographer: photographerName,
    page,
    limit,
  });
};

/**
 * Delete a shoot by ID (soft delete)
 * @param shootId - The shoot ID to delete
 * @returns Promise<{ message: string }>
 */
export const deleteShoot = async (shootId: number): Promise<{ message: string }> => {
  try {
    const response = await updateShoot({
      shoot_id: shootId,
      is_delete: true,
    });
    
    if ('message' in response) {
      return response as { message: string };
    } else {
      throw new Error('Unexpected response format for delete operation');
    }
  } catch (error) {
    console.error('Error deleting shoot:', error);
    throw error;
  }
};

/**
 * Get recent shoots (last 30 days)
 * @param page - Page number (default: 1)
 * @param limit - Records per page (default: 50)
 * @returns Promise<ShootPrintResponse>
 */
export const getRecentShoots = async (
  page: number = 1,
  limit: number = 50
): Promise<ShootPrintResponse> => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  return await printShoots({
    date_filter: 'gt',
    target_date: thirtyDaysAgo.toISOString().split('T')[0], // Convert to YYYY-MM-DD format
    page,
    limit,
  });
};

/**
 * Get all shoots with pagination (no filters)
 * @param page - Page number (default: 1)
 * @param limit - Records per page (default: 50)
 * @returns Promise<ShootPrintResponse>
 */
export const getAllShoots = async (
  page: number = 1,
  limit: number = 50
): Promise<ShootPrintResponse> => {
  return await printShoots({
    page,
    limit,
  });
};

// Export all functions as default
export default {
  createShoot,
  updateShoot,
  printShoots,
  getShootById,
  getShootsByDateRange,
  getShootsByBrand,
  getShootsByPhotographer,
  deleteShoot,
  getRecentShoots,
  getAllShoots,
  printShootTargets,
};
