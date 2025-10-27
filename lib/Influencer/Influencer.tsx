import { API_URL } from "../profile/apiurl";

export interface InfluencerCreate {
  influencer_id?: number;
  status?: string;
  workflow_status?: string;
  post_due_date?: string; // ISO string or YYYY-MM-DD
  deliverable_details?: string;
  feedback?: string;
  comments?: string;
  payment_json?: {
    amount: number;
    paid: boolean;
  };
  colab_type?: string;
  product_details?: string[];
  size?: string;
  concept?: string;
  contract_link?: string;
  product_status?: string;
  brad?: string;
  return_received?: {
    received: boolean;
    date: string | null;
  };
}

export interface InfluencerUpdate extends InfluencerCreate {
  s_no: number;
  is_delete?: boolean;
}

export interface InfluencerResponse {
  s_no: number;
  influencer_id?: number;
  influencer_name?: string;
  status?: string;
  deliverable_details?: string;
  payment_json?: any; // Or define a more specific type
  colab_type?: string;
  product_details?: any; // Or define a more specific type
  size?: string;
  concept?: string;
  contract_link?: string;
  product_status?: string;
  return_received?: any; // Or define a more specific type
  is_delete: boolean;
  created_at?: string;
  created_by?: number;
}

export interface InfluencerPrint {
  s_no?: number;
  influencer_id?: number;
  status?: string;
  workflow_status?: string;
  brad?: string;
  post_due_date_from?: string;
  post_due_date_to?: string;
  post_due_date_lt?: string;
  post_due_date_gt?: string;
  created_at_from?: string;
  created_at_to?: string;
  created_at_lt?: string;
  created_at_gt?: string;
  is_delete?: boolean;
  page?: number;
  limit?: number;
}

export interface InfluencerPrintResponse {
  influencers: InfluencerResponse[];
  total: number;
  page: number;
  limit: number;
}

export async function insertInfluencer(data: InfluencerCreate): Promise<InfluencerResponse> {
  try {
    // Only send fields that are defined (avoid sending undefined)
    const cleanData = Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== undefined));
    const response = await fetch(`${API_URL}/api/v1/influencer/influencer/insert`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(cleanData),
    });
    const responseText = await response.text();
    if (response.ok) {
      return JSON.parse(responseText);
    } else {
      throw new Error(`Failed to insert influencer: ${response.status} - ${responseText}`);
    }
  } catch (error) {
    console.error("Error inserting influencer:", error);
    throw error;
  }
}

export async function updateInfluencer(data: InfluencerUpdate): Promise<InfluencerResponse> {
  try {
    const cleanData = Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== undefined));
    const response = await fetch(`${API_URL}/api/v1/influencer/influencer/update`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(cleanData),
    });
    if (response.ok) {
      return await response.json();
    } else {
      const errorText = await response.text();
      throw new Error(`Failed to update influencer: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    console.error("Error updating influencer:", error);
    throw error;
  }
}

export async function printInfluencers(data: InfluencerPrint): Promise<InfluencerPrintResponse> {
  try {
    const cleanData = Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== undefined));
    const response = await fetch(`${API_URL}/api/v1/influencer/influencer/print`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(cleanData),
    });
    if (response.ok) {
      return await response.json();
    } else {
      const errorText = await response.text();
      throw new Error(`Failed to print influencers: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    console.error("Error printing influencers:", error);
    throw error;
  }
}

export async function hasInfluencerInReview(): Promise<boolean> {
  try {
    // Backend exposes this route as /influencer/has_in_review under the same router
    // (other client calls use the pattern /api/v1/influencer/influencer/<action>),
    // so call the matching path and expect a boolean response.
    const response = await fetch(`${API_URL}/api/v1/influencer/influencer/has_in_review`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Accept": "application/json",
      },
    });
    if (response.ok) {
      // The API returns a plain boolean (response_model=bool), so parse directly
      const data = await response.json();
      return Boolean(data);
    } else {
      const errorText = await response.text();
      throw new Error(`Failed to check influencers in review: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    console.error("Error checking influencers in review:", error);
    throw error;
  }
}
