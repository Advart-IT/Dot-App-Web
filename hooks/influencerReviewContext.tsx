'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface InfluencerReviewContextType {
    hasInReviewItems: boolean;
    setHasInReviewItems: (value: boolean) => void;
}

const InfluencerReviewContext = createContext<InfluencerReviewContextType | undefined>(undefined);

export function InfluencerReviewProvider({ children }: { children: React.ReactNode }) {
    const [hasInReviewItems, setHasInReviewItems] = useState(false);

    return (
        <InfluencerReviewContext.Provider value={{ hasInReviewItems, setHasInReviewItems }}>
            {children}
        </InfluencerReviewContext.Provider>
    );
}

export function useInfluencerReview() {
    const context = useContext(InfluencerReviewContext);
    if (context === undefined) {
        throw new Error('useInfluencerReview must be used within a InfluencerReviewProvider');
    }
    return context;
}