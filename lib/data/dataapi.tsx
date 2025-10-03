// dataapi.ts (with new API function)
import { API_URL } from './apiurl';

export async function fetchColumnsAndFields(business: string): Promise<any> {
  try {
    const response = await fetch(
      `${API_URL}/api/get_columns_and_fields?business=${encodeURIComponent(business)}`,
      {
        method: "GET",
        credentials: "include",
        headers: {
          "Accept": "application/json",
        },
      }
    );
    if (response.ok) {
      return await response.json();
    } else {
      throw new Error(`Failed to fetch columns and fields: ${response.status}`);
    }
  } catch (error) {
    console.error("Error fetching columns and fields:", error);
    throw new Error("An error occurred while fetching columns and fields");
  }
}

export async function fetchFieldValues({
  fieldName,
  business,
  search = "",
  offset = 0,
  limit = 100,
}: {
  fieldName: string;
  business: string;
  search?: string;
  offset?: number;
  limit?: number;
}): Promise<any> {
  try {
    const params = new URLSearchParams({
      field_name: fieldName,
      business,
      search,
      offset: offset.toString(),
      limit: limit.toString(),
    });

    const response = await fetch(
      `${API_URL}/api/filter/field-values?${params.toString()}`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      }
    );

    if (response.ok) {
      return await response.json();
    } else {
      throw new Error(`Failed to fetch field values: ${response.status}`);
    }
  } catch (error) {
    console.error("Error fetching field values:", error);
    throw new Error("An error occurred while fetching field values");
  }
}

export interface LaunchSummaryParams {
  days: number;
  group_by: string;
  item_filter: Record<string, any>;
  variation_columns: string[];
  launch_date_filter: string | null;
  calculate_first_period: boolean;
  calculate_second_period: boolean;
}

export async function fetchLaunchSummary(
  business: string,
  params: LaunchSummaryParams
): Promise<any> {
  try {
    const response = await fetch(
      `${API_URL}/api/launch-summary?business=${encodeURIComponent(business)}`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      }
    );

    if (response.ok) {
      return await response.json();
    } else {
      throw new Error(`Failed to fetch launch summary: ${response.status}`);
    }
  } catch (error) {
    console.error("Error fetching launch summary:", error);
    throw new Error("An error occurred while fetching launch summary");
  }
}


export interface SaleReportParams {
  Start_Date: string;
  End_Date?: string;
  aggregation: string;
  business: string;
  item_filter?: Record<string, any>;
  compare_with?: {
    start_date: string;
    end_date: string;
  };
  target_filter_type?: 'single_filter' | 'dual_filter';
}

export async function fetchSaleReport(params: SaleReportParams): Promise<any> {
  try {
    const query = new URLSearchParams({
      Start_Date: params.Start_Date,
      aggregation: params.aggregation,
      business: params.business,
    });

    if (params.End_Date) {
      query.append("End_Date", params.End_Date);
    }
    if (params.item_filter) {
      query.append("item_filter", JSON.stringify(params.item_filter));
    }
    if (params.compare_with) {
      query.append("compare_with", JSON.stringify(params.compare_with));
    }
    if (params.target_filter_type) {
      query.append("target_filter_type", params.target_filter_type);
    }

    const response = await fetch(
      `${API_URL}/api/Sale-report?${query.toString()}`,
      {
        method: "GET",
        credentials: "include",
        headers: {
          "Accept": "application/json",
        },
      }
    );

    if (response.ok) {
      return await response.json();
    } else {
      throw new Error(`Failed to fetch sale report: ${response.status}`);
    }
  } catch (error) {
    console.error("Error fetching sale report:", error);
    throw new Error("An error occurred while fetching sale report");
  }
}


export interface GroupBySummaryParams {
  Start_Date: string;
  End_Date: string;
  data_fields: string[];
  groupby: string[];
  item_filter: Record<string, any>;
  aggregation_type:string;
}

export async function fetchGroupBySummary(
  business: string,
  params: GroupBySummaryParams
): Promise<any> {
  try {
    const query = new URLSearchParams({
      Start_Date: params.Start_Date,
      End_Date: params.End_Date,
      data_fields: JSON.stringify(params.data_fields),
      groupby: JSON.stringify(params.groupby),
      item_filter: JSON.stringify(params.item_filter),
      aggregation_type:params.aggregation_type
    });

    const response = await fetch(
      `${API_URL}/api/groupby-summary?business=${encodeURIComponent(business)}&${query.toString()}`,
      {
        method: "GET",
        credentials: "include",
        headers: {
          "Accept": "application/json",
        },
      }
    );

    if (response.ok) {
      return await response.json();
    } else {
      throw new Error(`Failed to fetch groupby summary: ${response.status}`);
    }
  } catch (error) {
    console.error("Error fetching groupby summary:", error);
    throw new Error("An error occurred while fetching groupby summary");
  }
}


export interface ExportToSheetParams {
  brand: string;
  sheet: string;
  data: any[]; // Adjust type if your data is more specific
}

export async function exportToSheet(params: ExportToSheetParams): Promise<any> {
  try {
    const response = await fetch(
      `${API_URL}/api/export-to-sheet`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      }
    );

    if (response.ok) {
      return await response.json();
    } else {
      throw new Error(`Failed to export to sheet: ${response.status}`);
    }
  } catch (error) {
    console.error("Error exporting to sheet:", error);
    throw new Error("An error occurred while exporting to sheet");
  }
}


export interface DailyTargetPayload {
  Business_Name: string;
  Target_Column: string;
  Target_Key: string;
  Start_Date: string;
  Target_Value: number;
}

export async function setDailyTargets(
  targets: DailyTargetPayload[]
): Promise<any> {
  try {
    const response = await fetch(
      `${API_URL}/api/target/set-daily-targets`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(targets),
      }
    );

    if (response.ok) {
      return await response.json();
    } else {
      throw new Error(`Failed to set daily targets: ${response.status}`);
    }
  } catch (error) {
    console.error("Error setting daily targets:", error);
    throw new Error("An error occurred while setting daily targets");
  }
}

export interface DualFilterTargetPayload {
  Business_Name: string;
  Start_Date: string;
  Primary_Target_Column: string;
  Primary_Target_Key: string;
  Secondary_Target_Column: string;
  Secondary_Target_Key: string;
  Target_Value: number;
  target_filter_type: "dual_filter";
}

export async function setDualFilterTargets(
  targets: DualFilterTargetPayload[]
): Promise<any> {
  try {
    const response = await fetch(
      `${API_URL}/api/target/set-dual-filter-targets`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(targets),
      }
    );

    if (response.ok) {
      return await response.json();
    } else {
      throw new Error(`Failed to set dual filter targets: ${response.status}`);
    }
  } catch (error) {
    console.error("Error setting dual filter targets:", error);
    throw new Error("An error occurred while setting dual filter targets");
  }
}


export async function listTargetsWithStatus(businessName: string): Promise<any> {
  try {
    const response = await fetch(
      `${API_URL}/api/target/list-targets-with-status?business_name=${encodeURIComponent(businessName)}`,
      {
        method: "GET",
        credentials: "include",
        headers: {
          "Accept": "application/json",
        },
      }
    );

    if (response.ok) {
      return await response.json();
    } else {
      throw new Error(`Failed to list targets with status: ${response.status}`);
    }
  } catch (error) {
    console.error("Error listing targets with status:", error);
    throw new Error("An error occurred while listing targets with status");
  }
}


export interface SaleReportDetailedParams {
  Start_Date: string;
  End_Date?: string;
  business: string;
  aggregation?: string;
  col: string;
  group_by?: string;
  item_filter?: Record<string, any>;
  target_filter_type?: 'single_filter' | 'dual_filter';
}

export async function fetchSaleReportDetailed(params: SaleReportDetailedParams): Promise<any> {
  try {
    const query = new URLSearchParams({
      Start_Date: params.Start_Date,
      business: params.business,
      col: params.col,
    });

    if (params.End_Date) {
      query.append("End_Date", params.End_Date);
    }
    if (params.aggregation) {
      query.append("aggregation", params.aggregation);
    }
    if (params.group_by) {
      query.append("group_by", params.group_by);
    }
    if (params.item_filter) {
      query.append("item_filter", JSON.stringify(params.item_filter));
    }
    if (params.target_filter_type) {
      query.append("target_filter_type", params.target_filter_type);
    }

    const response = await fetch(
      `${API_URL}/api/Sale-Report/Detiled?${query.toString()}`,
      {
        method: "GET",
        credentials: "include",
        headers: {
          "Accept": "application/json",
        },
      }
    );

    if (response.ok) {
      return await response.json();
    } else {
      throw new Error(`Failed to fetch detailed sale report: ${response.status}`);
    }
  } catch (error) {
    console.error("Error fetching detailed sale report:", error);
    throw new Error("An error occurred while fetching detailed sale report");
  }
}

export interface UpdateDualFilterTargetEntryPayload {
  Business_Name: string;
  Primary_Target_Column: string;
  Primary_Target_Key: string;
  Secondary_Target_Column: string;
  Secondary_Target_Key: string;
  Start_Date: string;
  status?: boolean;
  Target_Value?: number;
  is_deleted?: boolean;
  target_filter_type?: "dual_filter";
}

export async function updateDualFilterTargetEntry(
  payload: UpdateDualFilterTargetEntryPayload
): Promise<any> {
  try {
    const response = await fetch(
      `${API_URL}/api/target/update-dual-filter-target-entry`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    if (response.ok) {
      return await response.json();
    } else {
      throw new Error(`Failed to update dual filter target entry: ${response.status}`);
    }
  } catch (error) {
    console.error("Error updating dual filter target entry:", error);
    throw new Error("An error occurred while updating dual filter target entry");
  }
}

export interface UpdateTargetEntryPayload {
  Business_Name: string;
  Target_Column: string;
  Target_Key: string;
  Start_Date: string;
  Target_Value?: number;
  status?: boolean;
  is_deleted?: boolean; // Added property
  target_filter_type?: "single_filter"; // Added for clarity if needed by backend
}

export async function updateTargetEntry(
  payload: UpdateTargetEntryPayload
): Promise<any> {
  try {
    const response = await fetch(
      `${API_URL}/api/target/update-target-entry`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    if (response.ok) {
      return await response.json();
    } else {
      throw new Error(`Failed to update target entry: ${response.status}`);
    }
  } catch (error) {
    console.error("Error updating target entry:", error);
    throw new Error("An error occurred while updating target entry");
  }
}
