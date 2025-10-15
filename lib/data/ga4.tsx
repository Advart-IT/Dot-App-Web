import { API_URL } from './apiurl';

export interface GA4MetricsParams {
  brand: string;
  current_start: string;
  current_end: string;
  compare?: boolean;
  previous_start?: string;
  previous_end?: string;
  aggregation: string;
  show_new_vs_returning?: boolean;
}

export async function fetchGA4Metrics(params: GA4MetricsParams): Promise<any> {
  try {
    // Ensure show_new_vs_returning is always present, defaulting to false
    const payload = {
      ...params,
      show_new_vs_returning: typeof params.show_new_vs_returning === 'boolean' ? params.show_new_vs_returning : false,
    };
    const response = await fetch(
      `${API_URL}/api/google_analytics/collection/ga4-metrics`,
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
      throw new Error(`Failed to fetch GA4 metrics: ${response.status}`);
    }
  } catch (error) {
    console.error("Error fetching GA4 metrics:", error);
    throw new Error("An error occurred while fetching GA4 metrics");
  }
}


export interface CollectionInsightsParams {
  brand: string;
  urls: string[];
  match_type: string;
  current_start: string;
  current_end: string;
  compare?: boolean;
  previous_start?: string;
  previous_end?: string;
  aggregation: string;
  show_new_vs_returning?: boolean;
  result_type?: string;
}

export async function fetchCollectionInsights(params: CollectionInsightsParams): Promise<any> {
  try {
    // Ensure show_new_vs_returning is always present, defaulting to false
    const payload = {
      ...params,
      show_new_vs_returning: typeof params.show_new_vs_returning === 'boolean' ? params.show_new_vs_returning : false,
    };
    const response = await fetch(
      `${API_URL}/api/google_analytics/collection/collection-insights`,
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
      throw new Error(`Failed to fetch collection insights: ${response.status}`);
    }
  } catch (error) {
    console.error("Error fetching collection insights:", error);
    throw new Error("An error occurred while fetching collection insights");
  }
}