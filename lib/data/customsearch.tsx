import { API_URL } from './apiurl';

export async function fetchGoogleSearchApi({ query, num_results = 10 }: { query: string; num_results?: number }) {
  try {
    const url = `${API_URL}/api/google_search_api`;
    const params = new URLSearchParams();
    params.append('query', query);
    params.append('num_results', String(num_results));
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });
    if (response.ok) {
      return await response.json();
    } else {
      throw new Error(`Failed to fetch Google Search API: ${response.status}`);
    }
  } catch (error) {
    console.error('Error in fetchGoogleSearchApi:', error);
    throw new Error('An error occurred while fetching Google Search API');
  }
}