import { API_URL } from './apiurl';


export async function fetchCollections(brand: string): Promise<any> {
	try {
		const response = await fetch(
			`${API_URL}/api/google_analytics/collections?brand=${encodeURIComponent(brand)}`,
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
			throw new Error(`Failed to fetch collections: ${response.status}`);
		}
	} catch (error) {
		console.error("Error fetching collections:", error);
		throw new Error("An error occurred while fetching collections");
	}
}

export interface IndexCheckParams {
	site: string;
	page_urls: string[];
}

export async function checkGoogleAnalyticsIndex(params: IndexCheckParams): Promise<any> {
	try {
		const response = await fetch(
			`${API_URL}/api/google_analytics/index/index/check`,
			{
				method: "POST",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
					"Accept": "application/json",
				},
				body: JSON.stringify(params)
			}
		);
		if (response.ok) {
			return await response.json();
		} else {
			throw new Error(`Failed to check Google Analytics index: ${response.status}`);
		}
	} catch (error) {
		console.error("Error checking Google Analytics index:", error);
		throw new Error("An error occurred while checking Google Analytics index");
	}
}
