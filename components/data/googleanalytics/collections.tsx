import { useState } from 'react';
import SmartDropdown from '@/components/custom-ui/dropdown2';
import { Button } from '@/components/custom-ui/button2';
import { useCollections } from '@/hooks/collections';
import { CollectionInsightsParams, fetchCollectionInsights } from '@/lib/data/ga4';
import DataGridSEO from '../DataGridSEO';

const AGGREGATION_OPTIONS = [
    { label: 'Summary', value: 'summary' },
    { label: 'Daily', value: 'daily' },
    { label: 'Compare', value: 'compare' },
];


export default function CollectionPageSection({ brandName }: { brandName: string }) {
    const [collectionPageData, setCollectionPageData] = useState<any[]>([]);
    const { collections } = useCollections();
    const [selectedCollection, setSelectedCollection] = useState<string[]>([]);
    const [aggregation, setAggregation] = useState<string>('summary');
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [compareStartDate2, setCompareStartDate2] = useState<Date | null>(null);
    const [compareEndDate2, setCompareEndDate2] = useState<Date | null>(null);
    const [isFetching, setIsFetching] = useState(false);
    const [showNewVsReturning, setShowNewVsReturning] = useState<boolean>(false);



    function renderDateFilters() {
        if (aggregation === 'daily' || aggregation === 'summary') {
            return (
                <>
                    <div className="flex flex-col w-[16%] min-w-[150px]">
                        <label className="text-12 font-normal text-ltxt mb-x2">
                            Start Date <span className="text-dng">*</span>
                        </label>
                        <input
                            type="date"
                            value={startDate ? startDate.toISOString().slice(0, 10) : ''}
                            onChange={e => setStartDate(e.target.value ? new Date(e.target.value) : null)}
                            className="w-full border text-sm rounded px-3 py-2"
                        />
                    </div>
                    <div className="flex flex-col w-[16%] min-w-[150px]">
                        <label className="text-12 font-normal text-ltxt mb-x2">
                            End Date{aggregation === 'summary' && <span className="text-dng">*</span>}
                        </label>
                        <input
                            type="date"
                            value={endDate ? endDate.toISOString().slice(0, 10) : ''}
                            onChange={e => setEndDate(e.target.value ? new Date(e.target.value) : null)}
                            className="w-full border text-sm rounded px-3 py-2"
                        />
                    </div>
                </>
            );
        }
        if (aggregation === 'compare') {
            return (
                <>
                    <div className="flex flex-col w-[16%] min-w-[150px]">
                        <label className="text-12 font-normal text-ltxt mb-x2">
                            Start Date <span className="text-dng">*</span>
                        </label>
                        <input
                            type="date"
                            value={startDate ? startDate.toISOString().slice(0, 10) : ''}
                            onChange={e => setStartDate(e.target.value ? new Date(e.target.value) : null)}
                            className="w-full border text-sm rounded px-3 py-2"
                        />
                    </div>
                    <div className="flex flex-col w-[16%] min-w-[150px]">
                        <label className="text-12 font-normal text-ltxt mb-x2">
                            End Date <span className="text-dng">*</span>
                        </label>
                        <input
                            type="date"
                            value={endDate ? endDate.toISOString().slice(0, 10) : ''}
                            onChange={e => setEndDate(e.target.value ? new Date(e.target.value) : null)}
                            className="w-full border text-sm rounded px-3 py-2"
                        />
                    </div>
                    <div className="flex flex-col w-[16%] min-w-[150px]">
                        <label className="text-12 font-normal text-ltxt mb-x2">
                            Start Date 2 <span className="text-dng">*</span>
                        </label>
                        <input
                            type="date"
                            value={compareStartDate2 ? compareStartDate2.toISOString().slice(0, 10) : ''}
                            onChange={e => setCompareStartDate2(e.target.value ? new Date(e.target.value) : null)}
                            className="w-full border text-sm rounded px-3 py-2"
                        />
                    </div>
                    <div className="flex flex-col w-[16%] min-w-[150px]">
                        <label className="text-12 font-normal text-ltxt mb-x2">
                            End Date 2 <span className="text-dng">*</span>
                        </label>
                        <input
                            type="date"
                            value={compareEndDate2 ? compareEndDate2.toISOString().slice(0, 10) : ''}
                            onChange={e => setCompareEndDate2(e.target.value ? new Date(e.target.value) : null)}
                            className="w-full border text-sm rounded px-3 py-2"
                        />
                    </div>
                </>
            );
        }
        return null;
    }

    const isFetchEnabled = (
        (aggregation === 'summary' && startDate && endDate) ||
        (aggregation === 'compare' && startDate && endDate && compareStartDate2 && compareEndDate2) ||
        (aggregation === 'daily' && startDate)
    );

    const handleFetch = async () => {
        try {
            setIsFetching(true);
            let urls: string[] = [];
            if (selectedCollection && selectedCollection.length > 0) {
                urls = selectedCollection.map(val => `/store/collections/${val}`);
            }
            const params: CollectionInsightsParams = {
                brand: brandName,
                urls,
                match_type: 'EXACT',
                current_start: startDate ? startDate.toISOString().slice(0, 10) : '',
                current_end: endDate ? endDate.toISOString().slice(0, 10) : '',
                aggregation,
                show_new_vs_returning: showNewVsReturning,
                result_type: 'page_wise'
            };
            if (aggregation === 'compare') {
                params.compare = true;
                params.previous_start = compareStartDate2 ? compareStartDate2.toISOString().slice(0, 10) : '';
                params.previous_end = compareEndDate2 ? compareEndDate2.toISOString().slice(0, 10) : '';
            }
            const result = await fetchCollectionInsights(params);
            setCollectionPageData(result || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setIsFetching(false);
        }
    };

    return (
        <div className="flex-1 min-h-0 overflow-auto">
            <div className="bg-white flex flex-col flex-1 min-h-0 h-full">
                <div className="flex flex-col ">
                    <div className="border-b border-themeBase-l2 p-x20">
                        {/* Aggregation and Date Filters */}
                        <div className="flex flex-wrap items-end gap-x-4 gap-y-4">
                            <div className="flex flex-col w-[12%] min-w-[140px]">
                                <label className="text-12 font-normal text-ltxt mb-x2">
                                    Aggregation <span className="text-dng">*</span>
                                </label>
                                <SmartDropdown
                                    options={AGGREGATION_OPTIONS}
                                    value={aggregation}
                                    onChange={val => setAggregation(val as string)}
                                    placeholder="Select"
                                />
                            </div>
                            {renderDateFilters()}
                        </div>
                        {/* Collection Dropdown */}
                        <div className="mt-4 mb-4 flex gap-3">
                            <SmartDropdown
                                options={collections.map((col: any) => ({ label: col, value: col }))}
                                value={selectedCollection}
                                onChange={val => setSelectedCollection(Array.isArray(val) ? val : [val])}
                                placeholder="Select/Filter Collection"
                                className="w-[400px]"
                                enableSearch
                                multiSelector
                                label='Collection'
                            />

                            <SmartDropdown
                                options={[
                                    { label: 'Hide - New/Returning Users', value: 'false' },
                                    { label: 'Show - New/Returning Users', value: 'true' }
                                ]}
                                value={showNewVsReturning ? 'true' : 'false'}
                                onChange={val => setShowNewVsReturning(val === 'true')}
                                placeholder="Show/Hide New/Returning Users"
                                className="w-[300px]"
                                label='Users'
                            />
                        </div>

                        {/* Fetch Button */}
                        <div className="flex justify-end gap-3">
                            <Button
                                className="!w-[115px]"
                                onClick={handleFetch}
                                disabled={!isFetchEnabled || isFetching}
                                variant='primary'
                            >
                                {isFetching ? 'Fetching...' : 'Fetch Data'}
                            </Button>
                        </div>
                    </div>

                    <div className='p-x20'>
                        {/* DataGridSEO */}
                        <DataGridSEO rawData={collectionPageData} />
                    </div>
                </div>
            </div>
        </div>
    );
}