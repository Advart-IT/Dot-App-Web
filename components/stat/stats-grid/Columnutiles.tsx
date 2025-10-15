import type { ColDef } from "ag-grid-community";

// Define the user task data structure
export type UserTaskData = {
  user_id: string;
  username: string;
  designation: string;
  department: string;
  month_name: string;
  total_target_count: number | null;
  total_completed: number;
  total_in_progress: number;
  overall_completion_percentage: number | null;
};

// Define the filtered row data structure (only columns we want to show)
export type UserTaskRow = {
  username: string;
  designation: string;
  total_target_count: number | null;
  total_completed: number;
  total_in_progress: number;
};

// Define the content data structure
export type ContentData = {
  month_name: string;
  brand_name: string;
  format: string;
  category?: string; // Optional field
  target_count: number;
  posted_count: number;
  pending_count: number;
};

// Define the filtered content row data structure (excluding month_name)
export type ContentRow = {
  brand_name: string;
  format: string;
  category?: string;
  target_count: number;
  posted_count: number;
  pending_count: number;
};

// Function to detect if the incoming data is user task data
export const isUserTaskData = (data: any[]): boolean => {
  if (!Array.isArray(data) || data.length === 0) return false;
  
  const sample = data[0];
  const requiredFields = ['username', 'designation', 'total_target_count', 'total_completed', 'total_in_progress'];
  
  return requiredFields.every(field => field in sample);
};

// Function to detect if the incoming data is content data
export const isContentData = (data: any[]): boolean => {
  if (!Array.isArray(data) || data.length === 0) return false;
  
  const sample = data[0];
  const requiredFields = ['brand_name', 'format', 'target_count', 'posted_count', 'pending_count'];
  
  return requiredFields.every(field => field in sample);
};

// Function to extract users array from the JSON structure
export const extractUsersData = (rawData: any): UserTaskData[] => {
  if (rawData && rawData.users && Array.isArray(rawData.users)) {
    return rawData.users;
  }
  return [];
};

// Function to extract content data from the JSON structure
export const extractContentData = (rawData: any): ContentData[] => {
  if (rawData && rawData.data && Array.isArray(rawData.data)) {
    return rawData.data;
  }
  return [];
};

// Function to map full user data to filtered row data
export const mapToUserTaskRows = (users: UserTaskData[]): UserTaskRow[] => {
  return users.map(user => ({
    username: user.username,
    designation: user.designation,
    total_target_count: user.total_target_count,
    total_completed: user.total_completed,
    total_in_progress: user.total_in_progress,
  }));
};

// Function to map content data to filtered row data (excluding month_name)
export const mapToContentRows = (content: ContentData[]): ContentRow[] => {
  return content.map(item => ({
    brand_name: item.brand_name,
    format: item.format,
    category: item.category, // Can be undefined
    target_count: item.target_count,
    posted_count: item.posted_count,
    pending_count: item.pending_count,
  }));
};

// Generate column definitions for user task data
export const generateUserTaskColumnDefs = (): ColDef<UserTaskRow>[] => {
  return [
    {
      headerName: "Username",
      field: "username",
      filter: "agTextColumnFilter",
      sortable: true,
      resizable: true,
      minWidth: 150,
    },
    {
      headerName: "Designation",
      field: "designation",
      filter: "agTextColumnFilter",
      sortable: true,
      resizable: true,
      minWidth: 180,
      valueFormatter: (params) => {
        // Handle empty designations
        return params.value || "Not Assigned";
      },
    },
    {
      headerName: "Target Count",
      field: "total_target_count",
      filter: "agNumberColumnFilter",
      sortable: true,
      resizable: true,
      minWidth: 120,
      valueFormatter: (params) => {
        return params.value !== null ? params.value.toString() : "N/A";
      },
    },
    {
      headerName: "Completed",
      field: "total_completed",
      filter: "agNumberColumnFilter",
      sortable: true,
      resizable: true,
      minWidth: 100,
    },
    {
      headerName: "In Progress",
      field: "total_in_progress",
      filter: "agNumberColumnFilter",
      sortable: true,
      resizable: true,
      minWidth: 110,
    },
  ];
};

// Generate column definitions for content data (excluding month_name)
export const generateContentColumnDefs = (hasCategory: boolean = true): ColDef<ContentRow>[] => {
  const columns: ColDef<ContentRow>[] = [
    {
      headerName: "Brand Name",
      field: "brand_name",
      filter: "agTextColumnFilter",
      sortable: true,
      resizable: true,
      minWidth: 150,
    },
    {
      headerName: "Format",
      field: "format",
      filter: "agTextColumnFilter",
      sortable: true,
      resizable: true,
      minWidth: 120,
    },
  ];

  // Only add category column if it exists in the data
  if (hasCategory) {
    columns.push({
      headerName: "Category",
      field: "category",
      filter: "agTextColumnFilter",
      sortable: true,
      resizable: true,
      minWidth: 130,
      valueFormatter: (params) => {
        return params.value || "N/A";
      },
    });
  }

  // Add the remaining columns
  columns.push(
    {
      headerName: "Target Count",
      field: "target_count",
      filter: "agNumberColumnFilter",
      sortable: true,
      resizable: true,
      minWidth: 120,
    },
    {
      headerName: "Posted Count",
      field: "posted_count",
      filter: "agNumberColumnFilter",
      sortable: true,
      resizable: true,
      minWidth: 120,
    },
    {
      headerName: "Pending Count",
      field: "pending_count",
      filter: "agNumberColumnFilter",
      sortable: true,
      resizable: true,
      minWidth: 130,
    }
  );

  return columns;
};



