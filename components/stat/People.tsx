'use client';

import { useState, useEffect, useRef } from 'react';
import { fetchAllUsersMonthlyStats } from '@/lib/stats/stats-data';
import TaskDataGrid from './stats-grid/Datagris';

interface PeopleProps {
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

export default function People({ selectedDate, dataCache, setDataCache }: PeopleProps) {
  const [statsData, setStatsData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const fetchingRef = useRef<string | null>(null); // Track which date is currently being fetched
  const hasFetchedRef = useRef<Set<string>>(new Set()); // Track which dates have been fetched

  // Auto-fetch data when selectedDate changes, with caching
  useEffect(() => {
    const fetchData = async () => {
      if (!selectedDate) return;

      // Check if data already exists in cache
      const cachedData = dataCache[selectedDate]?.people;
      if (cachedData) {
        setStatsData(cachedData);
        setLoading(false);
        setError(null);
        return;
      }

      // Prevent multiple fetches for the same date
      if (fetchingRef.current === selectedDate || hasFetchedRef.current.has(selectedDate)) {
        return;
      }

      try {
        fetchingRef.current = selectedDate; // Mark as currently fetching
        hasFetchedRef.current.add(selectedDate); // Mark as attempted
        setLoading(true);
        setError(null);
        
        const [year, month] = selectedDate.split('-').map(Number);
        
        const data = await fetchAllUsersMonthlyStats({
          month: month,
          year: year
        });
        
        setStatsData(data);
        
        // Cache the fetched data
        setDataCache(prev => ({
          ...prev,
          [selectedDate]: {
            ...prev[selectedDate],
            people: data
          }
        }));
      } catch (error) {
        console.error('Failed to fetch stats data:', error);
        setError('Failed to fetch stats data. Please try again.');
        hasFetchedRef.current.delete(selectedDate); // Remove from attempted on error to allow retry
      } finally {
        setLoading(false);
        fetchingRef.current = null; // Clear fetching flag
      }
    };

    fetchData();
  }, [selectedDate]); // Only depend on selectedDate

  const handleUserClick = (userData: any) => {
    console.log('User clicked:', userData);
    // You can add navigation or modal logic here
  };

  return (
    <div className="w-full p-6 bg-white rounded-lg shadow-sm">
      <div className="mb-6">

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>

      {/* Data Grid */}
      {statsData && !loading && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <TaskDataGrid
            rawData={statsData}
            onUserClick={handleUserClick}
          />
        </div>
      )}

      {/* No Data Message */}
      {!statsData && !loading && !error && (
        <div className="text-center py-8 text-gray-500">
          <p>Select a month and click "Fetch" to view people statistics.</p>
        </div>
      )}
    </div>
  );
}