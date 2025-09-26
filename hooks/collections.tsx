"use client";

import { fetchCollections } from '@/lib/data/collection';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

/**
 * Fetch and cache collections for a brand. Returns cached data unless brand changes or page is refreshed.
 * @param brandName Brand name to fetch collections for
 */
// Fetch collections for a brand and format as options
export async function getCollections(brandName: string): Promise<string[]> {
	const result = await fetchCollections(brandName);
	if (result?.names) {
		return result.names;
	} else if (Array.isArray(result?.data)) {
		return result.data;
	}
	return [];
}


// Context type
interface CollectionsContextType {
	collections: string[];
	setBrand: (brand: string) => void;
	brand: string;
}

const CollectionsContext = createContext<CollectionsContextType | undefined>(undefined);

type CollectionsProviderProps = {
	children: ReactNode;
};

export const CollectionsProvider = ({ children }: CollectionsProviderProps) => {
	const [collections, setCollections] = useState<string[]>([]);
	const [brand, setBrand] = useState<string>('');

	const getSessionKey = (brand: string) => `dot-collections-${brand}`;

	useEffect(() => {
		if (!brand) return;

		getCollections(brand)
			.then(data => {
				setCollections(data);
				if (typeof window !== 'undefined') {
					sessionStorage.setItem(getSessionKey(brand), JSON.stringify(data));
				}
			})
			.catch(() => setCollections([]));
	}, [brand]);

	return (
		<CollectionsContext.Provider value={{ collections, setBrand, brand }}>
			{children}
		</CollectionsContext.Provider>
	);
};

export const useCollections = (): CollectionsContextType => {
	const context = useContext(CollectionsContext);
	if (!context) {
		throw new Error('useCollections must be used within a CollectionsProvider');
	}
	return context;
};
