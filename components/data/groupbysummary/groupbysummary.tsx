import { useState, useEffect, useMemo } from 'react';
import SmartDropdown from '@/components/custom-ui/dropdown2';
import { Button } from '@/components/custom-ui/button2';
import ColumnMultiSelect from '@/components/data/advancedfilter';
import { AppModal } from '@/components/custom-ui/app-modal';
import { fetchGroupBySummary, exportToSheet } from '@/lib/data/dataapi';
import DataGrid from '../DataGrid';


interface GroupBySummaryFiltersProps {
    brandName: string;
    columnsAndFields?: any;
    containerClass?: string;
}

const AGGREGATION_TYPE_OPTIONS = [
    { label: 'Daily', value: 'Daily' },
    { label: 'Weekly', value: 'Weekly' },
    { label: 'Monthly', value: 'Monthly' },
    { label: 'Custom', value: 'Custom' }
];

export default function GroupBySummaryFilters({ brandName, columnsAndFields, containerClass = "flex-1 min-h-0 flex flex-col", }: GroupBySummaryFiltersProps) {
    // Date states for different aggregation types
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [monthFrom, setMonthFrom] = useState<string>("");
    const [monthTo, setMonthTo] = useState<string>("");
    const [weekFrom, setWeekFrom] = useState<string>("");
    const [weekTo, setWeekTo] = useState<string>("");
    
    const [advancedModalOpen, setAdvancedModalOpen] = useState(false);
    const [advancedFilters, setAdvancedFilters] = useState<{ [column: string]: { operator: string; value: string | [string, string]; } }>({});
    const [isFetching, setIsFetching] = useState(false);
    const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
    const [selectedAggs, setSelectedAggs] = useState<string[]>([]);
    const [groupByColumns, setGroupByColumns] = useState<string[] | null>(null);
    const [fetchedData, setFetchedData] = useState<any[]>([]);
    const [isExporting, setIsExporting] = useState(false);
    const [isExportingToSheet, setIsExportingToSheet] = useState(false);
    const [aggregationType, setAggregationType] = useState<'Daily' | 'Weekly' | 'Monthly' | 'Custom'>('Custom');

    // Log brand name and columnsAndFields when they change
    useEffect(() => {
        if (brandName) {
            console.log("Selected Brand:", brandName);
        }
    }, [brandName]);

    useEffect(() => {
        if (columnsAndFields) {
            console.log("Columns and Fields:", columnsAndFields);
        }
    }, [columnsAndFields]);
    useEffect(() => {
    if (groupByColumns) {
        const validGroupBy = groupByColumns.filter(col => selectedColumns.includes(col));
        if (validGroupBy.length !== groupByColumns.length) {
            setGroupByColumns(validGroupBy);
        }
    }
}, [selectedColumns, groupByColumns]);

    const groupByColumnOptions = useMemo(() => {
        if (!columnsAndFields?.groupby?.columns) return [];
        return columnsAndFields.groupby.columns.map((col: string) => ({
            label: col.replace(/_/g, ' '),
            value: col,
        }));
    }, [columnsAndFields]);

    const groupByAggOptions = useMemo(() => {
        if (!columnsAndFields?.groupby?.agg) return [];
        return columnsAndFields.groupby.agg.map((agg: string) => ({
            label: agg.replace(/_/g, ' '),
            value: agg,
        }));
    }, [columnsAndFields]);

    const selectedColumnOptions = useMemo(() => {
        return selectedColumns.map((col) => ({
            label: col.replace(/_/g, ' '),
            value: col,
        }));
    }, [selectedColumns]);

    // Helper function to get date from week input
    function getDateFromWeek(weekValue: string): string {
    const [year, week] = weekValue.split("-W").map(Number);
    const simple = new Date(Date.UTC(year, 0, 1 + (week - 1) * 7));
    const dayOfWeek = simple.getUTCDay();
    const ISOweekStart = new Date(simple);
    if (dayOfWeek <= 4) {
        ISOweekStart.setUTCDate(simple.getUTCDate() - dayOfWeek + 1);
    } else {
        ISOweekStart.setUTCDate(simple.getUTCDate() + 8 - dayOfWeek);
    }
    return ISOweekStart.toISOString().slice(0, 10);
}


    const handleFetch = async () => {
        try {
            setIsFetching(true);
            const dataFields = [...selectedColumns, ...selectedAggs];

            // Set Start_Date and End_Date based on aggregation type
            let Start_Date = "";
            let End_Date = "";

            if (aggregationType === "Custom" || aggregationType === "Daily") {
                Start_Date = startDate ? startDate.toISOString().slice(0, 10) : "";
                End_Date = endDate ? endDate.toISOString().slice(0, 10) : "";
            } else if (aggregationType === "Monthly") {
    Start_Date = monthFrom ? `${monthFrom}-01` : "";
    if (monthTo) {
        const endDateObj = new Date(`${monthTo}-01`);
        endDateObj.setMonth(endDateObj.getMonth() + 1);
        endDateObj.setDate(0); // last day of previous month
        End_Date = endDateObj.toISOString().slice(0, 10);
    }
}
else if (aggregationType === "Weekly") {
    Start_Date = weekFrom ? getDateFromWeek(weekFrom) : "";
    if (weekTo) {
        const startOfEndWeek = new Date(getDateFromWeek(weekTo));
        startOfEndWeek.setDate(startOfEndWeek.getDate() + 6); // Sunday
        End_Date = startOfEndWeek.toISOString().slice(0, 10);
    }
}

            const params = {
                Start_Date,
                End_Date,
                data_fields: dataFields,
                groupby: groupByColumns ?? [],
                aggregation_type: aggregationType.toLowerCase(),
                item_filter: Object.fromEntries(
                    Object.entries(advancedFilters).filter(([_, v]) => v && v.value !== null && v.value !== "" && v.value !== undefined)
                        .map(([k, v]) => [k, [v]])
                ),
            };
            console.log("Fetch Payload:", params);
            const result = await fetchGroupBySummary(brandName, params);
            setFetchedData(result.data || []);
            console.log("GroupBy Summary Result:", result);
        } catch (error) {
            console.error("Error fetching groupby summary:", error);
        } finally {
            setIsFetching(false);
        }
    };

    // Function to render date inputs based on aggregation type
    function renderDateFilters() {
        if (aggregationType === "Daily" || aggregationType === "Custom") {
            return (
                <>
                    <div className="flex flex-col w-[15%] min-w-[150px]">
                        <label className="text-12 font-normal text-ltxt mb-1">
                            Start Date <span className="text-dng">*</span>
                        </label>
                        <input
                            type="date"
                            value={startDate ? startDate.toISOString().slice(0, 10) : ""}
                            onChange={e => setStartDate(e.target.value ? new Date(e.target.value) : null)}
                            className="w-full border text-sm rounded px-3 py-2"
                        />
                    </div>
                    <div className="flex flex-col w-[15%] min-w-[150px]">
                        <label className="text-12 font-normal text-ltxt mb-1">
                            End Date <span className="text-dng">*</span>
                        </label>
                        <input
                            type="date"
                            value={endDate ? endDate.toISOString().slice(0, 10) : ""}
                            onChange={e => setEndDate(e.target.value ? new Date(e.target.value) : null)}
                            className="w-full border text-sm rounded px-3 py-2"
                        />
                    </div>
                </>
            );
        }
        
        if (aggregationType === "Monthly") {
            return (
                <>
                    <div className="flex flex-col w-[15%] min-w-[150px]">
                        <label className="text-12 font-normal text-ltxt mb-1">
                            From Month <span className="text-dng">*</span>
                        </label>
                        <input
                            type="month"
                            value={monthFrom}
                            onChange={e => setMonthFrom(e.target.value)}
                            className="w-full border text-sm rounded px-3 py-2"
                        />
                    </div>
                    <div className="flex flex-col w-[15%] min-w-[150px]">
                        <label className="text-12 font-normal text-ltxt mb-1">To Month</label>
                        <input
                            type="month"
                            value={monthTo}
                            onChange={e => setMonthTo(e.target.value)}
                            className="w-full border text-sm rounded px-3 py-2"
                        />
                    </div>
                </>
            );
        }
        
        if (aggregationType === "Weekly") {
            return (
                <>
                    <div className="flex flex-col w-[15%] min-w-[150px]">
                        <label className="text-12 font-normal text-ltxt mb-1">
                            From Week <span className="text-dng">*</span>
                        </label>
                        <input
                            type="week"
                            value={weekFrom}
                            onChange={e => setWeekFrom(e.target.value)}
                            className="w-full border text-sm rounded px-3 py-2"
                        />
                    </div>
                    <div className="flex flex-col w-[15%] min-w-[150px]">
                        <label className="text-12 font-normal text-ltxt mb-1">To Week</label>
                        <input
                            type="week"
                            value={weekTo}
                            onChange={e => setWeekTo(e.target.value)}
                            className="w-full border text-sm rounded px-3 py-2"
                        />
                    </div>
                </>
            );
        }
        
        return null;
    }

    // Updated validation logic
    const isFetchEnabled = useMemo(() => {
        const baseConditions = !!brandName && 
            selectedColumns.length > 0 &&
            selectedAggs.length > 0 &&
            groupByColumns !== null &&
            groupByColumns.length > 0;

        if (!baseConditions) return false;

        // Check date conditions based on aggregation type
        if (aggregationType === "Custom" || aggregationType === "Daily") {
            return startDate !== null && endDate !== null;
        } else if (aggregationType === "Monthly") {
            return monthFrom !== "";
        } else if (aggregationType === "Weekly") {
            return weekFrom !== "";
        }

        return false;
    }, [brandName, selectedColumns, selectedAggs, groupByColumns, aggregationType, startDate, endDate, monthFrom, weekFrom]);

    const filterCount = Object.keys(advancedFilters).length;

    const handleAdvancedFilterChange = (selected: { [column: string]: { operator: string; value: any }[] }) => {
        const filters: { [column: string]: { operator: string; value: string | [string, string]; } } = {};
        Object.entries(selected).forEach(([column, arr]) => {
            if (Array.isArray(arr) && arr.length > 0) {
                filters[column] = {
                    operator: arr[0].operator,
                    value: arr[0].value,
                };
            }
        });
        setAdvancedFilters(filters);
        setAdvancedModalOpen(false);
        console.log("Advanced Filter Applied:", filters);
    };

    return (
        <div className={containerClass}>
            <h2 className="text-16 font-semibold mb-2">Group By Summary</h2>
            <div className="bg-white rounded-xl shadow flex flex-col flex-1 min-h-0 h-full">
                <div className="border-b border-themeBase-l2 p-x20 flex flex-col gap-[6px]">
                    <div>
                        <p className="text-12 text-wrn">
                            Note: As you select Columns dropdown, GroupBy dropdown will be populated.
                        </p>
                    </div>

                    <div className="flex flex-col gap-4">
                        {/* First Row: Inputs and Advanced Filters */}
                        <div className="flex flex-wrap items-end gap-x-4 gap-y-4">
                            {/* Aggregation Type */}
                            <div className="flex flex-col w-[15%] min-w-[160px]">
                                <label className="text-12 font-normal text-ltxt mb-1">
                                    Aggregation Type <span className="text-dng">*</span>
                                </label>
                                <SmartDropdown
                                    options={AGGREGATION_TYPE_OPTIONS}
                                    value={aggregationType}
                                    onChange={val => setAggregationType(val as 'Daily' | 'Weekly' | 'Monthly' | 'Custom')}
                                    placeholder="Select Aggregation Type"
                                />
                            </div>

                            {/* Dynamic Date Inputs */}
                            {renderDateFilters()}

                            {/* Dimension Columns */}
                            <div className="flex flex-col w-[15%] min-w-[160px]">
                                <label className="text-12 font-normal text-ltxt mb-1">
                                    Columns <span className="text-dng">*</span>
                                </label>
                                <SmartDropdown
                                    options={groupByColumnOptions}
                                    value={selectedColumns}
                                    onChange={(val) => setSelectedColumns(val as string[])}
                                    multiSelector
                                    enableSearch
                                    placeholder="Select Columns"
                                />
                            </div>

                            {/* Aggregation Columns */}
                            <div className="flex flex-col w-[15%] min-w-[160px]">
                                <label className="text-12 font-normal text-ltxt mb-1">
                                    Aggregations <span className="text-dng">*</span>
                                </label>
                                <SmartDropdown
                                    options={groupByAggOptions}
                                    value={selectedAggs}
                                    onChange={(val) => setSelectedAggs(val as string[])}
                                    multiSelector
                                    enableSearch
                                    placeholder="Select Aggregations"
                                />
                            </div>

                            {/* GroupBy Columns */}
                            <div className="flex flex-col w-[15%] min-w-[160px]">
                                <label className="text-12 font-normal text-ltxt mb-1">
                                    GroupBy <span className="text-dng">*</span>
                                </label>
                                <SmartDropdown
                                    options={selectedColumnOptions}
                                    value={groupByColumns ?? ""}
                                    onChange={(val) => setGroupByColumns(val as string[])}
                                    multiSelector
                                    enableSearch
                                    placeholder="Select GroupBy Columns"
                                />
                            </div>

                            {/* Advanced Filters Button */}
                            <div className="flex items-center w-[12%] min-w-[180px] mt-auto">
                                <Button
                                    className="!py-[9px] relative"
                                    onClick={() => setAdvancedModalOpen(true)}
                                    disabled={!brandName}
                                    variant="outline"
                                    size="m"
                                >
                                    ⚙️ Advanced Filters
                                    {filterCount > 0 && (
                                        <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full px-2 py-0.5">
                                            {filterCount}
                                        </span>
                                    )}
                                </Button>
                            </div>
                        </div>

                        {/* Second Row: Action Buttons */}
                        <div className="flex justify-end gap-3">
                            <Button
                                className={`!w-[115px]`}
                                onClick={handleFetch}
                                disabled={!isFetchEnabled || isFetching}
                                variant='primary'
                            >
                                {isFetching ? 'Fetching...' : 'Fetch Data'}
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="flex-1 min-h-0 overflow-auto p-x20">
                    <h3 className="text-16 font-semibold mb-2">Data</h3>
                    <DataGrid rowData={fetchedData}
                        brandName={brandName} />
                </div>
            </div>

            <AppModal
                open={advancedModalOpen}
                onClose={() => setAdvancedModalOpen(false)}
                title="Advanced Filters"
                size="3xl"
            >
                <div className="flex flex-col items-center h-full min-h-[400px] overflow-y-auto">
                    <ColumnMultiSelect
                        columns={columnsAndFields?.field_names || []}
                        brand={brandName}
                        onChange={handleAdvancedFilterChange}
                        initialFilters={Object.fromEntries(
                            Object.entries(advancedFilters).map(([col, filter]) => [col, [filter]])
                        )}
                    />
                </div>
            </AppModal>
        </div>
    );
}