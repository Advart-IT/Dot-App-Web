import DataGridSEO from '../DataGridSEO';
import { useState } from 'react';
import { Button } from '@/components/custom-ui/button2';
import SmartInputBox from '@/components/custom-ui/input-box';
import { fetchGoogleSearchConsoleData, GoogleSearchConsoleParams } from '@/lib/data/seo';
import SmartDropdown from '@/components/custom-ui/dropdown2';
import { useCollections } from '@/hooks/collections';

const AGGREGATION_OPTIONS = [
    { label: 'Custom', value: 'custom' },
    { label: 'Compare', value: 'compare' },
];


export default function SearchConsole({ brandName }: { brandName: string }) {
    const [site, setSite] = useState(brandName || '');
    // Decoupled state for custom input and collection dropdown
    const [customUrl, setCustomUrl] = useState('');
    const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
    const [pageMatch, setPageMatch] = useState<'exact' | 'contains'>('contains');
    const [queryMatch, setQueryMatch] = useState<'exact' | 'contains'>('contains');
    const [rowLimit, setRowLimit] = useState(10000);
    const [selectedTab, setSelectedTab] = useState<'page_wise' | 'query_wise'>('page_wise');
    const [query, setQuery] = useState('');
    const [isFetchingPageWise, setIsFetchingPageWise] = useState(false);
    const [isFetchingQueryWise, setIsFetchingQueryWise] = useState(false);
    const [resultPageWise, setResultPageWise] = useState<any>(null);
    const [resultQueryWise, setResultQueryWise] = useState<any>(null);
    const [aggregation, setAggregation] = useState<string>('custom');
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [compareStartDate2, setCompareStartDate2] = useState<Date | null>(null);
    const [compareEndDate2, setCompareEndDate2] = useState<Date | null>(null);
    // Add state for pageUrlMode: 'custom' (SmartInputBox) or 'collection' (SmartDropdown)
    const [pageUrlMode, setPageUrlMode] = useState<'custom' | 'collection'>('collection');

    // Validation for page URL input
    const validatePageUrl = (val: string) => {
        if (!val.trim()) return null;
        // Disallow full domain URLs, only allow relative paths or slugs
        const forbiddenPattern = /^(https?:\/\/|www\.)/i;
        if (forbiddenPattern.test(val.trim())) {
            return { message: 'Please enter only the collection path or slug, not the full domain.', type: 'error' };
        }
        // Optionally, allow only valid path/slug characters
        // const allowedPattern = /^[a-zA-Z0-9\-_/]+$/;
        // if (!allowedPattern.test(val.trim())) {
        //     return { message: 'Only letters, numbers, dashes, underscores, and slashes are allowed.', type: 'error' };
        // }
        return null;
    };

    let isPageUrlValid = true;
    if (pageUrlMode === 'custom') {
        isPageUrlValid = customUrl.trim() === '' || !validatePageUrl(customUrl);
    }

    // Date validation based on aggregation type
    const isDateValid = (
        (aggregation === 'custom' && startDate && endDate) ||
        (aggregation === 'compare' && startDate && endDate && compareStartDate2 && compareEndDate2)
    );

    const isFetchEnabled = site.trim().length > 0 && isPageUrlValid && isDateValid;

    // Compute pageUrls to use for fetch based on mode
    const computedPageUrls = pageUrlMode === 'custom'
        ? (customUrl.trim() ? [customUrl.trim()] : [])
        : selectedCollections.map(v => `/store/collections/${v}`);

    function renderDateFilters() {
        if (aggregation === 'custom') {
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
                            End Date{aggregation === 'custom' && <span className="text-dng">*</span>}
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


    const handleFetchPageWise = async () => {
        setIsFetchingPageWise(true);
        setResultPageWise(null);
        try {
            const params: GoogleSearchConsoleParams = {
                site: brandName || site,
                page_url: computedPageUrls,
                page_match: pageMatch,
                start_date: startDate ? startDate.toISOString().slice(0, 10) : undefined,
                end_date: endDate ? endDate.toISOString().slice(0, 10) : undefined,
                row_limit: rowLimit,
                report_type: 'page_wise',
                query_match: queryMatch,
                query,
                ...(aggregation === 'compare' && {
                    compare_start_date: compareStartDate2 ? compareStartDate2.toISOString().slice(0, 10) : undefined,
                    compare_end_date: compareEndDate2 ? compareEndDate2.toISOString().slice(0, 10) : undefined,
                })
            };
            const apiResult = await fetchGoogleSearchConsoleData(params);
            setResultPageWise(apiResult);
        } catch (err) {
            setResultPageWise({ error: String(err) });
        } finally {
            setIsFetchingPageWise(false);
        }
    };

    const handleFetchQueryWise = async () => {
        setIsFetchingQueryWise(true);
        setResultQueryWise(null);
        try {
            const params: GoogleSearchConsoleParams = {
                site: brandName || site,
                page_match: pageMatch,
                page_url: computedPageUrls,
                query_match: queryMatch,
                start_date: startDate ? startDate.toISOString().slice(0, 10) : undefined,
                end_date: endDate ? endDate.toISOString().slice(0, 10) : undefined,
                row_limit: rowLimit,
                report_type: 'query_wise',
                query,
                ...(aggregation === 'compare' && {
                    compare_start_date: compareStartDate2 ? compareStartDate2.toISOString().slice(0, 10) : undefined,
                    compare_end_date: compareEndDate2 ? compareEndDate2.toISOString().slice(0, 10) : undefined,
                })
            };
            const apiResult = await fetchGoogleSearchConsoleData(params);
            setResultQueryWise(apiResult);
        } catch (err) {
            setResultQueryWise({ error: String(err) });
        } finally {
            setIsFetchingQueryWise(false);
        }
    };

    return (
        <div className="flex flex-col">
            {/* Inputs for site, page URLs, match, dates, etc. */}
            <div className='border-b border-themeBase-l2 p-x20'>

                <div className="flex gap-3 mb-4 w-full">
                    <div className="flex flex-col" style={{ minWidth: '100px' }}>
                        <label htmlFor="rowLimit" className="text-12 text-ltxt mb-x2">Row Limit</label>
                        <input
                            id="rowLimit"
                            type="number"
                            min={1}
                            max={25000}
                            value={rowLimit}
                            onChange={e => {
                                let val = Number(e.target.value);
                                if (val > 25000) val = 25000;
                                setRowLimit(val ? val : 1);
                            }}
                            className="border rounded-md px-2 py-2 no-spinner w-[100px] text-14"
                        />
                    </div>
                    <style jsx>{`
                    input.no-spinner::-webkit-outer-spin-button,
                    input.no-spinner::-webkit-inner-spin-button {
                        -webkit-appearance: none;
                        margin: 0;
                    }
                    input.no-spinner[type=number] {
                        -moz-appearance: textfield;
                    }
                `}</style>

                    {/* Aggregation and Date Filters take the rest of the row */}
                    <div className="flex-1 flex items-end gap-x-4 gap-y-4">
                        <div className="flex flex-col min-w-[140px] w-[16%]">
                            <SmartDropdown
                                options={AGGREGATION_OPTIONS}
                                value={aggregation}
                                onChange={val => setAggregation(val as string)}
                                placeholder="Select"
                                label='Aggregation'
                            />
                        </div>
                        {/* Render date filters inline */}
                        <div className="flex items-end gap-x-4 flex-1">
                            {renderDateFilters()}
                        </div>
                    </div>
                </div>

                {/* New row for page match, page url mode, and their input together */}
                <div className="flex gap-3 mb-4 items-start">
                    {/* Page URL Section Title and Inputs */}
                    <div className="flex flex-col flex-1 min-w-[500px]">
                        <div className="text-12 mb-x2 text-ltxt">Page Filter</div>
                        <div className='p-x10 bg-themeBase-l1 flex gap-2 items-center rounded'>
                            {/* Page Match Dropdown */}
                            <div className="w-[140px]">
                                <SmartDropdown
                                    options={[{ label: 'Exact', value: 'exact' }, { label: 'Contains', value: 'contains' }]}
                                    value={pageMatch}
                                    onChange={val => setPageMatch(val as 'exact' | 'contains')}
                                    placeholder="Page Match Type"
                                    label="Page Match"
                                />
                            </div>
                            {/* Page URL Mode Dropdown */}
                            <div className="w-[140px]">
                                <SmartDropdown
                                    options={[{ label: 'Collection', value: 'collection' }, { label: 'Custom', value: 'custom' }]}
                                    value={pageUrlMode}
                                    onChange={val => setPageUrlMode(val as 'custom' | 'collection')}
                                    placeholder="URL Mode"
                                    label="URL Mode"
                                />
                            </div>
                            {/* Page URLs input logic */}
                            {pageUrlMode === 'custom' ? (
                                <SmartInputBox
                                    value={customUrl}
                                    onChange={val => setCustomUrl(val)}
                                    validate={val => {
                                        if (!val.trim()) return null;
                                        // Disallow full domain URLs, only allow relative paths or slugs
                                        const forbiddenPattern = /^(https?:\/\/|www\.)/i;
                                        if (forbiddenPattern.test(val.trim())) {
                                            return { message: 'Please enter only the collection path or slug, not the full domain.', type: 'error' };
                                        }
                                        // Optionally, allow only valid path/slug characters
                                        // const allowedPattern = /^[a-zA-Z0-9\-_/]+$/;
                                        // if (!allowedPattern.test(val.trim())) {
                                        //     return { message: 'Only letters, numbers, dashes, underscores, and slashes are allowed.', type: 'error' };
                                        // }
                                        return null;
                                    }}
                                    placeholder="Enter collection path or slug (e.g. /store/collections/sale)"
                                    className="w-[300px] max-w-[300px] min-w-[200px]"
                                    label="Ex: /store/collections/sale or sale-slug"
                                />
                            ) : (
                                <SmartDropdown
                                    options={useCollections().collections.map(col => ({ label: col, value: col }))}
                                    value={selectedCollections}
                                    onChange={val => {
                                        let values: string[] = [];
                                        if (Array.isArray(val)) {
                                            values = val as string[];
                                        } else if (val) {
                                            values = [val as string];
                                        }
                                        setSelectedCollections(values);
                                    }}
                                    placeholder="Select Collection"
                                    label="Collections"
                                    className="w-[300px] max-w-[300px] min-w-[200px]"
                                    multiSelector
                                    enableSearch
                                />
                            )}
                        </div>
                    </div>
                    {/* Query Filter Section Title and Inputs */}
                    <div className="flex flex-col flex-1 min-w-[350px]">
                        <div className="text-12 mb-x2 text-ltxt">Query Filter</div>
                        <div className="flex gap-2 items-center p-x10 bg-themeBase-l1 rounded">
                            <div className="w-[140px]">
                                <SmartDropdown
                                    options={[{ label: 'Exact', value: 'exact' }, { label: 'Contains', value: 'contains' }]}
                                    value={queryMatch}
                                    onChange={val => setQueryMatch(val as 'exact' | 'contains')}
                                    placeholder="Query Match Type"
                                    label="Query Match"
                                />
                            </div>
                            <div className="w-[200px]">
                                <SmartInputBox
                                    value={query}
                                    onChange={setQuery}
                                    placeholder="Query filter (optional)"
                                    label='Query'
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tab Buttons for Page Wise / Query Wise */}
                <div className="flex gap-2 items-center mb-4">
                    <Button
                        variant={selectedTab === 'page_wise' ? 'primary' : 'outline'}
                        onClick={() => setSelectedTab('page_wise')}
                    >
                        Page Wise
                    </Button>
                    <Button
                        variant={selectedTab === 'query_wise' ? 'primary' : 'outline'}
                        onClick={() => setSelectedTab('query_wise')}
                    >
                        Query Wise
                    </Button>
                </div>

                {/* Fetch Button for each tab */}
                {selectedTab === 'page_wise' && (
                    <div className="flex justify-end">
                        <Button
                            onClick={handleFetchPageWise}
                            disabled={!isFetchEnabled || isFetchingPageWise}
                            variant="primary"
                        >
                            {isFetchingPageWise ? 'Fetching...' : 'Fetch Page Wise Data'}
                        </Button>
                    </div>
                )}
                {selectedTab === 'query_wise' && (
                    <div className="flex justify-end">
                        <Button
                            onClick={handleFetchQueryWise}
                            disabled={!isFetchEnabled || isFetchingQueryWise}
                            variant="primary"
                        >
                            {isFetchingQueryWise ? 'Fetching...' : 'Fetch Query Wise Data'}
                        </Button>
                    </div>
                )}


            </div>
            <div className="p-x20">
                {/* Output for each tab as DataGridSEO table */}
                {selectedTab === 'page_wise' && resultPageWise && (
                    <DataGridSEO rawData={resultPageWise} mode="page" />
                )}
                {selectedTab === 'query_wise' && resultQueryWise && (
                    <DataGridSEO rawData={resultQueryWise} mode="query" />
                )}
            </div>
        </div>
    );
}