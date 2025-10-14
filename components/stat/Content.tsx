'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/custom-ui/button2';
import { fetchContentMonthlyStats } from '@/lib/stats/stats-data';
import TaskDataGrid from './stats-grid/Datagris';

interface ContentProps {
  selectedDate: string;
  dataCache: {
    [dateKey: string]: {
      people?: any;
      socialMedia?: any;
      ads?: any;
    }
  };
  setDataCache: React.Dispatch<React.SetStateAction<{
    [dateKey: string]: {
      people?: any;
      socialMedia?: any;
      ads?: any;
    }
  }>>;
}

export default function Content({ selectedDate, dataCache, setDataCache }: ContentProps) {
  const [selectedContentType, setSelectedContentType] = useState<'social_media' | 'ads'>('social_media');
  
  // Separate states for each content type
  const [socialMediaState, setSocialMediaState] = useState({
    contentData: null as any,
    loading: false,
    error: null as string | null
  });

  const [adsState, setAdsState] = useState({
    contentData: null as any,
    loading: false,
    error: null as string | null
  });

  // Get current state based on selected content type
  const currentState = selectedContentType === 'social_media' ? socialMediaState : adsState;
  const setCurrentState = selectedContentType === 'social_media' ? setSocialMediaState : setAdsState;

  const contentTypes = [
    { key: 'social_media', label: 'Social Media' },
    { key: 'ads', label: 'Ads' }
  ];

  // Auto-fetch data when selectedDate or selectedContentType changes, with caching
  useEffect(() => {
    const fetchData = async () => {
      if (!selectedDate) return;

      // Check if data already exists in cache for this date and content type
      const cacheKey = selectedContentType === 'social_media' ? 'socialMedia' : 'ads';
      const cachedData = dataCache[selectedDate]?.[cacheKey];
      
      if (cachedData) {
        setCurrentState(prev => ({ ...prev, contentData: cachedData, loading: false, error: null }));
        return;
      }

      try {
        setCurrentState(prev => ({ ...prev, loading: true, error: null }));
        
        const [year, month] = selectedDate.split('-').map(Number);
        
        const data = await fetchContentMonthlyStats({
          month: month,
          year: year,
          content_type: selectedContentType
        });
        
        setCurrentState(prev => ({ ...prev, contentData: data, loading: false }));
        
        // Cache the fetched data
        setDataCache(prev => ({
          ...prev,
          [selectedDate]: {
            ...prev[selectedDate],
            [cacheKey]: data
          }
        }));
      } catch (error) {
        console.error('Failed to fetch content stats data:', error);
        setCurrentState(prev => ({ 
          ...prev, 
          error: 'Failed to fetch content stats data. Please try again.',
          loading: false 
        }));
      }
    };

    fetchData();
  }, [selectedDate, selectedContentType, dataCache, setDataCache]);

  const handleContentClick = (contentData: any) => {
    console.log('Content clicked:', contentData);
    // You can add navigation or modal logic here
  };

  return (
    <div className="w-full p-6 bg-white rounded-lg shadow-sm">
      <div className="mb-6">
        {/* Header with Content Type Buttons */}
        <div className="flex items-center justify-start mb-6">
          {/* Content Type Buttons - Top Left */}
          <div className="flex gap-2">
            {contentTypes.map(type => (
              <Button
                key={type.key}
                onClick={() => setSelectedContentType(type.key as 'social_media' | 'ads')}
                variant='outline'
                size="m"
                className={selectedContentType === type.key ? '!bg-newsecondary !text-themeBase' : ''}
              >
                {type.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {currentState.error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700 text-sm">{currentState.error}</p>
          </div>
        )}

        {/* Loading State */}
        {currentState.loading && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>

      {/* Data Grid */}
      {currentState.contentData && !currentState.loading && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <TaskDataGrid
            rawData={currentState.contentData}
            onUserClick={handleContentClick}
          />
        </div>
      )}
    </div>
  );
}