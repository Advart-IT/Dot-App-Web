// components/IndexedPages.tsx
import { useState } from 'react';
import SmartDropdown from '@/components/custom-ui/dropdown2';
import { Button } from '@/components/custom-ui/button2';
import { useCollections } from '@/hooks/collections';
import { checkGoogleAnalyticsIndex } from '@/lib/data/collection';
import DataGridSEO from '@/components/data/DataGridSEO';

interface IndexedPage {
  page_url: string;
  indexed: boolean;
  status: string;
  issues?: Array<{
    type: string;
    message: string;
    severity: string;
    count: number;
  }>;
}

interface ApiResponse {
  site: string;
  total_urls: number;
  summary: {
    indexed_no_major_issues: number;
    indexed_with_issues: number;
    not_indexed: number;
    errors: number;
  };
  indexed_pages_no_major_issues: IndexedPage[];
  indexed_pages_with_issues: IndexedPage[];
  not_indexed_pages: IndexedPage[];
  error_pages: IndexedPage[];
}

export default function IndexedPages({ brandName }: { brandName: string }) {
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [apiData, setApiData] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'no_issues' | 'with_issues' | 'not_indexed'>('no_issues');

  const { collections } = useCollections();

  const collectionOptions = collections.map(col => ({
    label: col,
    value: col,
  }));

  // Handle tab switching
  const handleTabSwitch = (tab: 'no_issues' | 'with_issues' | 'not_indexed') => {
    setActiveTab(tab);
  };

  const handleFetch = async () => {
    if (selectedCollections.length === 0) {
      setError('Please select at least one collection');
      return;
    }

    setIsFetching(true);
    setError(null);
    setApiData(null);

    try {
      const pageUrls = selectedCollections;
      const params = {
        site: `${brandName}`,
        page_urls: pageUrls,
      };

      const response = await checkGoogleAnalyticsIndex(params);
      console.log('API Response:', response);
      setApiData(response);
      
      if (response.indexed_pages_no_major_issues?.length > 0) {
        setActiveTab('no_issues');
      } else if (response.indexed_pages_with_issues?.length > 0) {
        setActiveTab('with_issues');
      } else if (response.not_indexed_pages?.length > 0) {
        setActiveTab('not_indexed');
      }
    } catch (err) {
      console.error('Error fetching index data:', err);
      setError('Failed to fetch index data. Please try again.');
    } finally {
      setIsFetching(false);
    }
  };

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-lg">
        <p>{error}</p>
        <button
          onClick={() => setError(null)}
          className="mt-2 px-3 py-1 bg-red-500 text-white rounded"
        >
          Dismiss
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="bg-white rounded-xl shadow flex flex-col flex-1 min-h-0 h-full">
        {/* Collections Selection */}
        <div className="p-x20 pt-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col">
              <label className="text-12 font-normal text-ltxt mb-1">Select Collections</label>
              <div className="flex flex-row justify-between">
                <div>
                  <SmartDropdown
                    options={collectionOptions}
                    value={selectedCollections}
                    onChange={(val) => {
                      if (Array.isArray(val)) {
                        setSelectedCollections(val as string[]);
                      } else if (val) {
                        setSelectedCollections([val as string]);
                      } else {
                        setSelectedCollections([]);
                      }
                    }}
                    placeholder="Select collections"
                    className="w-[350px]"
                    multiSelector
                    enableSearch
                  />
                </div>
                <div className="mt-1">
                  <Button
                    onClick={handleFetch}
                    disabled={isFetching || selectedCollections.length === 0}
                    variant="primary"
                  >
                    {isFetching ? 'Fetching...' : 'Fetch Data'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Data Display */}
        {apiData && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Summary Cards */}
            <div className="flex flex-wrap gap-x20 w-full px-x20 pt-x20 pb-x10">
              <div className=" w-[200px] bg-themeBase border border-themeBase-l2 rounded-xl p-x15">
                <p className="text-12 text-ltxt mb-x2">Total URLs</p>
                <p className="text-20 font-bold text-dtxt">{apiData.total_urls?.toLocaleString?.() ?? 0}</p>
              </div>
              <div className=" w-[200px] bg-themeBase border border-themeBase-l2 rounded-xl p-x15">
                <p className="text-12 text-ltxt mb-x2">No Major Issues</p>
                <p className="text-20 font-bold text-dtxt">{(apiData.summary?.indexed_no_major_issues || 0)?.toLocaleString?.() ?? 0}</p>
              </div>
              <div className="w-[200px] bg-themeBase border border-themeBase-l2 rounded-xl p-x15">
                <p className="text-12 text-ltxt mb-x2">Indexed With Issues</p>
                <p className="text-20 font-bold text-dtxt">{(apiData.summary?.indexed_with_issues || 0)?.toLocaleString?.() ?? 0}</p>
              </div>
              <div className="w-[200px] bg-themeBase border border-themeBase-l2 rounded-xl p-x15">
                <p className="text-12 text-ltxt mb-x2">Not Indexed</p>
                <p className="text-20 font-bold text-dtxt">{(apiData.summary?.not_indexed || 0)?.toLocaleString?.() ?? 0}</p>
              </div>
            </div>

            {/* Tab Selector */}
            <div className="p-x20 flex ">
              <div className="flex space-x-4 mb-4">
                <button
                  className={`px-4 py-1 rounded-md text-[15px] ${
                    activeTab === 'no_issues'
                      ? 'bg-gray-800 text-white'
                      : 'bg-white border border-gray-300 text-gray-900 hover:border-gray-800'
                  }`}
                  onClick={() => handleTabSwitch('no_issues')}
                >
                  No Major Issues ({apiData.summary?.indexed_no_major_issues || 0})
                </button>
                <button
                  className={`px-4 py-1 rounded-md text-[15px] ${
                    activeTab === 'with_issues'
                      ? 'bg-gray-800 text-white'
                      : 'bg-white border border-gray-300 text-gray-900 hover:border-gray-800'
                  }`}
                  onClick={() => handleTabSwitch('with_issues')}
                >
                  Indexed With Issues ({apiData.summary?.indexed_with_issues || 0})
                </button>
                <button
                  className={`px-4 py-1 rounded-md text-[15px] ${
                    activeTab === 'not_indexed'
                      ? 'bg-gray-800 text-white'
                      : 'bg-white border border-gray-300 text-gray-900 hover:border-gray-800'
                  }`}
                  onClick={() => handleTabSwitch('not_indexed')}
                >
                  Not Indexed ({apiData.summary?.not_indexed || 0})
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-x20 flex-1 overflow-auto">
              {(() => {
                const pages = activeTab === 'no_issues'
                  ? apiData.indexed_pages_no_major_issues
                  : activeTab === 'with_issues'
                  ? apiData.indexed_pages_with_issues
                  : apiData.not_indexed_pages;

                if (!pages || pages.length === 0) {
                  return <div className="text-center py-8 text-gray-500">No pages found</div>;
                }

                // Transform the data based on active tab
                const gridData = pages.map((page, index) => {
                  const baseData = {
                    s_no: index + 1,
                    page_url: page.page_url,
                  };

                  // For 'with_issues' tab, add issue columns
                  if (activeTab === 'with_issues') {
                    return {
                      ...baseData,
                      issue_type: page.issues?.[0]?.type || 'N/A',
                      issue_count: page.issues?.[0]?.count || 0,
                    };
                  }

                  // For 'no_issues' and 'not_indexed', only show s_no and page_url
                  return baseData;
                });

                return (
                  <DataGridSEO
                    rawData={gridData}
                    mode="page"
                    tabType={activeTab}
                  />
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
