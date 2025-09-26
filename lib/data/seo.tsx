import { API_URL } from './apiurl';

export interface GoogleSearchConsoleParams {
  site: string;
  page_url?: string[];
  page_match?: 'exact' | 'contains';
  query_match?: 'exact' | 'contains';
  start_date?: string;
  end_date?: string;
  compare_start_date?: string;
  compare_end_date?: string;
  row_limit?: number;
  report_type?: 'page_wise' | 'query_wise';
  query?: string;
}

export async function fetchGoogleSearchConsoleData(params: GoogleSearchConsoleParams) {
  const url = new URL(`${API_URL}/api/Google_Search_Console`);

  url.searchParams.append('site', params.site);
  if (params.page_url && Array.isArray(params.page_url)) {
    params.page_url.forEach((u: string) => url.searchParams.append('page_url', u));
  }
  if (params.page_match) url.searchParams.append('page_match', params.page_match);
  if (params.query_match) url.searchParams.append('query_match', params.query_match);
  if (params.start_date) url.searchParams.append('start_date', params.start_date);
  if (params.end_date) url.searchParams.append('end_date', params.end_date);
  if (params.compare_start_date) url.searchParams.append('compare_start_date', params.compare_start_date);
  if (params.compare_end_date) url.searchParams.append('compare_end_date', params.compare_end_date);
  if (params.row_limit) url.searchParams.append('row_limit', String(params.row_limit));
  if (params.report_type) url.searchParams.append('report_type', params.report_type);
  if (params.query) url.searchParams.append('query', params.query);

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch Google Search Console data: ${response.status}`);
  }
  return await response.json();
}