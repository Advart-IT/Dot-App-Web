import { useState } from 'react';
import SmartDropdown from '@/components/custom-ui/dropdown2';
import SmartInputBox from '@/components/custom-ui/input-box';
import { Button } from '@/components/custom-ui/button2';
import { CollectionInsightsParams, fetchCollectionInsights } from '@/lib/data/ga4';
import DataGridSEO from '../DataGridSEO';

const AGGREGATION_OPTIONS = [
    { label: 'Summary', value: 'summary' },
    { label: 'Daily', value: 'daily' },
    { label: 'Compare', value: 'compare' },
];

export default function CustomPageSection({ brandName }: { brandName: string }) {
    const [customData, setCustomData] = useState<any[]>([]);
    const [customUrls, setCustomUrls] = useState<string>('');
    const [aggregation, setAggregation] = useState<string>('summary');
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [compareStartDate2, setCompareStartDate2] = useState<Date | null>(null);
    const [compareEndDate2, setCompareEndDate2] = useState<Date | null>(null);
    const [isFetching, setIsFetching] = useState(false);
    const [showNewVsReturning, setShowNewVsReturning] = useState<boolean>(false);
    const [resultType, setResultType] = useState<'total' | 'page_wise'>('page_wise');

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

    // Validation: no entry should contain a domain
    const validateCustomUrls = (val: string) => {
        if (!val.trim()) return null;
        const entries = val.split(',').map(u => u.trim()).filter(u => u.length > 0);
        const domainPattern = /https?:\/\/|www\.|[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/;
        for (const entry of entries) {
            if (domainPattern.test(entry)) {
                return { message: 'Please enter only the path or keyword, not the full domain.', type: 'error' as const };
            }
        }
        return null;
    };

    const isCustomUrlsValid = !validateCustomUrls(customUrls);
    const isFetchEnabled = (
        customUrls.trim().length > 0 &&
        isCustomUrlsValid &&
        (
            (aggregation === 'summary' && startDate && endDate) ||
            (aggregation === 'compare' && startDate && endDate && compareStartDate2 && compareEndDate2) ||
            (aggregation === 'daily' && startDate)
        )
    );

    const handleFetch = async () => {
        try {
            setIsFetching(true);
            let urls: string[] = [];
            if (customUrls && customUrls.trim().length > 0) {
                urls = customUrls.split(',')
                    .map(u => u.trim())
                    .filter(u => u.length > 0)
                    .map(u => u.startsWith('/') ? u : '/' + u);
            }
            const params: CollectionInsightsParams = {
                brand: brandName,
                urls,
                match_type: 'CONTAINS',
                current_start: startDate ? startDate.toISOString().slice(0, 10) : '',
                current_end: endDate ? endDate.toISOString().slice(0, 10) : '',
                aggregation,
                show_new_vs_returning: showNewVsReturning,
                result_type: resultType
            };
            if (aggregation === 'compare') {
                params.compare = true;
                params.previous_start = compareStartDate2 ? compareStartDate2.toISOString().slice(0, 10) : '';
                params.previous_end = compareEndDate2 ? compareEndDate2.toISOString().slice(0, 10) : '';
            }
            const result = await fetchCollectionInsights(params);
            setCustomData(result || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setIsFetching(false);
        }
    };

    return (
        <div className="flex-1 min-h-0 overflow-auto">
            <div className="bg-white flex flex-col flex-1 min-h-0 h-full">
                <div className="flex flex-col">
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
                        {/* SmartInputBox for URLs */}
                        <div className="mt-4 mb-4 flex gap-3">
                            <SmartInputBox
                                value={customUrls}
                                onChange={setCustomUrls}
                                validate={validateCustomUrls}
                                placeholder="Enter URLs or keywords (without domain, e.g. /about, /contact, product-name)"
                                label="Enter URLs or keywords (without domain)"
                                className="w-[400px]"
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

                            <SmartDropdown
                                options={[
                                    { label: 'Total', value: 'total' },
                                    { label: 'Page Wise', value: 'page_wise' }
                                ]}
                                value={resultType}
                                onChange={val => setResultType(val as 'total' | 'page_wise')}
                                placeholder="Select Result Type"
                                className="w-[200px]"
                                label='Result Type'
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
                        <DataGridSEO rawData={customData} />
                    </div>
                </div>
            </div>
        </div>
    );
}