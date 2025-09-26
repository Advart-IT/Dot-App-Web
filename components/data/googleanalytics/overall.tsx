import React, { useState } from 'react';
import SmartDropdown from '@/components/custom-ui/dropdown2';
import { Button } from '@/components/custom-ui/button2';
import { fetchGA4Metrics } from '@/lib/data/ga4';


const AGGREGATION_OPTIONS = [
    { label: 'Summary', value: 'summary' },
    { label: 'Compare', value: 'compare' },
];

export default function OverallSection({ brandName }: { brandName: string }) {
    const [overallData, setOverallData] = useState<any[]>([]);
    const [aggregation, setAggregation] = useState<string>('summary');
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [compareStartDate2, setCompareStartDate2] = useState<Date | null>(null);
    const [compareEndDate2, setCompareEndDate2] = useState<Date | null>(null);
    const [showNewVsReturning, setShowNewVsReturning] = useState<boolean>(false);
    const [isFetching, setIsFetching] = useState(false);

    function renderDateFilters() {
        if (aggregation === 'summary') {
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
        (aggregation === 'compare' && startDate && endDate && compareStartDate2 && compareEndDate2)
    );

    const handleFetch = async () => {
        try {
            setIsFetching(true);
            const params: any = {
                brand: brandName,
                current_start: startDate ? startDate.toISOString().slice(0, 10) : '',
                current_end: endDate ? endDate.toISOString().slice(0, 10) : '',
                aggregation,
                show_new_vs_returning: showNewVsReturning,
            };
            if (aggregation === 'compare') {
                params.compare = true;
                params.previous_start = compareStartDate2 ? compareStartDate2.toISOString().slice(0, 10) : '';
                params.previous_end = compareEndDate2 ? compareEndDate2.toISOString().slice(0, 10) : '';
            }
            const result = await fetchGA4Metrics(params);
            if (result && !Array.isArray(result)) {
                setOverallData([result]);
            } else {
                setOverallData(result || []);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setIsFetching(false);
        }
    };

    return (
        <div className="flex-1 min-h-0 overflow-auto">
            <div className="flex flex-col flex-1 min-h-0 h-full">
                <div className="flex flex-col gap-4">
                    {/* Aggregation and Date Filters */}
                    <div className="border-b border-themeBase-l2 p-x20">
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
                        {/* Show/Hide New/Returning Users Dropdown */}
                        <div className="mt-4 mb-4 flex gap-3">
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
                        {/* Date ranges display */}
                        {overallData[0]?.ranges && (
                            <div className="flex gap-6 mb-6">
                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-1 rounded bg-blue-100 text-blue-700 font-semibold">Current</span>
                                    <span className="text-sm">{overallData[0].ranges.current?.start ?? 'N/A'} - {overallData[0].ranges.current?.end ?? 'N/A'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-1 rounded bg-gray-200 text-gray-700 font-semibold">Previous</span>
                                    <span className="text-sm">{overallData[0].ranges.previous?.start ?? 'N/A'} - {overallData[0].ranges.previous?.end ?? 'N/A'}</span>
                                </div>
                            </div>
                        )}
                        {/* Metric cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {(() => {
                                const currentTotal = overallData[0]?.current_total?.[0] || {};
                                const previousTotal = overallData[0]?.previous_total?.[0] || {};
                                const currentGroups = overallData[0]?.current || [];
                                const previousGroups = overallData[0]?.previous || [];
                                const isCompare = overallData[0]?.aggregation === 'compare';
                                const showNewVsReturningData = overallData[0]?.showNewVsReturning ?? showNewVsReturning;
                                return Object.keys(currentTotal).map((metric) => {
                                    const currentNew = currentGroups.find((x: any) => x.newVsReturning === 'new')?.[metric] ?? 'N/A';
                                    const currentReturning = currentGroups.find((x: any) => x.newVsReturning === 'returning')?.[metric] ?? 'N/A';
                                    const currentNotSet = currentGroups.find((x: any) => x.newVsReturning === '(not set)')?.[metric] ?? 'N/A';
                                    const previousNew = previousGroups.find((x: any) => x.newVsReturning === 'new')?.[metric] ?? 'N/A';
                                    const previousReturning = previousGroups.find((x: any) => x.newVsReturning === 'returning')?.[metric] ?? 'N/A';
                                    const previousNotSet = previousGroups.find((x: any) => x.newVsReturning === '(not set)')?.[metric] ?? 'N/A';
                                    // Calculate deviation %
                                    let deviation = null;
                                    if (isCompare && previousTotal[metric] !== undefined && previousTotal[metric] !== null && !isNaN(Number(previousTotal[metric])) && !isNaN(Number(currentTotal[metric]))) {
                                        const prev = Number(previousTotal[metric]);
                                        const curr = Number(currentTotal[metric]);
                                        if (prev !== 0) {
                                            deviation = ((curr - prev) / prev) * 100;
                                        } else if (curr !== 0) {
                                            deviation = 100;
                                        } else {
                                            deviation = 0;
                                        }
                                    }
                                    return (
                                        <div key={metric} className="rounded shadow p-4 flex flex-col items-center">
                                            <div className="text-xs font-semibold mb-2 text-gray-500">{metric}</div>
                                            <div className="w-full">
                                                <div className="text-xs font-bold text-blue-700 mb-1">Current</div>
                                                <div className="text-xs">Total: <span className="font-bold">{currentTotal[metric]}</span>
                                                    {isCompare && deviation !== null && (
                                                        <span className={"ml-2 font-bold " + (deviation > 0 ? "text-green-600" : deviation < 0 ? "text-red-600" : "text-gray-600")}>({deviation > 0 ? '+' : ''}{deviation.toFixed(2)}%)</span>
                                                    )}
                                                </div>
                                                {showNewVsReturningData && (
                                                    <>
                                                        <div className="text-xs">New: <span className="font-bold">{currentNew}</span></div>
                                                        <div className="text-xs">Returning: <span className="font-bold">{currentReturning}</span></div>
                                                        <div className="text-xs">Not Set: <span className="font-bold">{currentNotSet}</span></div>
                                                    </>
                                                )}
                                            </div>
                                            {isCompare && (
                                                <div className="w-full mt-2">
                                                    <div className="text-xs font-bold text-gray-700 mb-1">Previous</div>
                                                    <div className="text-xs">Total: <span className="font-bold">{previousTotal[metric] ?? 'N/A'}</span></div>
                                                    {showNewVsReturningData && (
                                                        <>
                                                            <div className="text-xs">New: <span className="font-bold">{previousNew}</span></div>
                                                            <div className="text-xs">Returning: <span className="font-bold">{previousReturning}</span></div>
                                                            <div className="text-xs">Not Set: <span className="font-bold">{previousNotSet}</span></div>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
