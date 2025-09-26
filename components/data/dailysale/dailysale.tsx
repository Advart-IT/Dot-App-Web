import { useState, useEffect, useMemo, useRef } from 'react'; // Removed useLayoutEffect
import SmartDropdown from '@/components/custom-ui/dropdown2';
import { Button } from '@/components/custom-ui/button2';
import ColumnMultiSelect from '@/components/data/advancedfilter';
import { AppModal } from '@/components/custom-ui/app-modal';
import { fetchSaleReport, exportToSheet, listTargetsWithStatus, fetchSaleReportDetailed } from '@/lib/data/dataapi';
import DailyTargetList from '@/components/data/dailysale/dailytarget';
import DataGrid from '../DataGrid';
import SalesChart from '../SalesChart';

const AGGREGATION_OPTIONS = [
    { label: 'Daily', value: 'daily' },
    { label: 'Weekly', value: 'weekly' },
    { label: 'Monthly', value: 'monthly' },
    { label: 'Custom', value: 'custom' },
    { label: 'Compare', value: 'compare' },
];

const TAB_OPTIONS = [
    { label: 'Overall', value: 'overall' },
    { label: 'Detailed', value: 'detailed' },
];

const GROUP_BY_OPTIONS = [
    { label: 'Category/Product_Type', value: 'Category/Product_Type' },
    { label: 'Item_Type', value: 'Item_Type' },
    { label: 'Item_Name', value: 'Item_Name' },
    { label: 'Target_Column', value: 'Target_Column' },
];

interface DailySaleFiltersProps {
    brandName: string;
    columnsAndFields?: any;
    containerClass?: string;
}

export default function DailySaleFilters({
    brandName,
    columnsAndFields,
    containerClass = "flex-1 min-h-0 flex flex-col",
}: DailySaleFiltersProps) {
    const [activeTab, setActiveTab] = useState<'overall' | 'detailed'>('overall');
    const [advancedModalOpen, setAdvancedModalOpen] = useState(false);
    const [isFetching, setIsFetching] = useState(false);
    const [fetchedData, setFetchedData] = useState<any[]>([]);
    const [detailedData, setDetailedData] = useState<any[]>([]);
    const [isExporting, setIsExporting] = useState(false);
    const [isExportingToSheet, setIsExportingToSheet] = useState(false);
    const [targetModalOpen, setTargetModalOpen] = useState(false);
    const [targetList, setTargetList] = useState<any[]>([]);
    const [isTargetLoading, setIsTargetLoading] = useState(false);
    const [targetError, setTargetError] = useState<string | null>(null);
    const [PopupModalOpen, setPopupModalOpen] = useState(false);
    const [PopupModalData, setPopupModalData] = useState<any>(null);
    const [title, setTitle] = useState<any>(null);
    const [summaryData, setSummaryData] = useState<any>({});
    const [stats, setStats] = useState({
        Total_Sale_Value: 0,
        Total_Quantity_Sold: 0,
        Total_Items_Viewed: 0,
        Total_Items_Added_To_Cart: 0,
        Total_Target_Value: 0,
        Total_Target_Sales: 0,
        Total_Target_Percentage_Deviation: 0,
    });
    const [isFromDateClick, setIsFromDateClick] = useState(false);


    // Overall tab state
    const [overallState, setOverallState] = useState({
        aggregation: "daily",
        startDate: null as Date | null,
        endDate: null as Date | null,
        compareStartDate1: null as Date | null,
        compareEndDate1: null as Date | null,
        compareStartDate2: null as Date | null,
        compareEndDate2: null as Date | null,
        monthFrom: "",
        monthTo: "",
        weekFrom: "",
        weekTo: "",
        advancedFilters: {} as { [column: string]: { operator: string; value: string | [string, string]; } },
        GroupBy: "Target_Column",
    });

    // Detailed tab state
    const [detailedState, setDetailedState] = useState({
        aggregation: "daily",
        startDate: null as Date | null,
        endDate: null as Date | null,
        compareStartDate1: null as Date | null,
        compareEndDate1: null as Date | null,
        compareStartDate2: null as Date | null,
        compareEndDate2: null as Date | null,
        monthFrom: "",
        monthTo: "",
        weekFrom: "",
        weekTo: "",
        advancedFilters: {} as { [column: string]: { operator: string; value: string | [string, string]; } },
        GroupBy: "Target_Column",
    });

    // Use current tab state
    const currentState = activeTab === 'overall' ? overallState : detailedState;
    const setCurrentState = activeTab === 'overall' ? setOverallState : setDetailedState;

    // Update current state helper
    const updateCurrentState = (updates: Partial<typeof overallState>) => {
        setCurrentState(prev => ({ ...prev, ...updates }));
    };


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

    function buildItemFilter(advancedFilters: { [column: string]: { operator: string; value: any } }) {
        return Object.fromEntries(
            Object.entries(advancedFilters)
                .filter(([_, v]) => v && v.value !== null && v.value !== "" && v.value !== undefined)
                .map(([k, v]) => [k, [v]])
        );
    }

    function getDateFromWeek(weekValue: string) {
        const [year, week] = weekValue.split('-W').map(Number);
        const simple = new Date(Date.UTC(year, 0, 1 + (week - 1) * 7));
        const dayOfWeek = simple.getUTCDay();
        const ISOweekStart = new Date(simple);
        if (dayOfWeek <= 4) {
            ISOweekStart.setUTCDate(simple.getUTCDate() - simple.getUTCDay() + 1);
        } else {
            ISOweekStart.setUTCDate(simple.getUTCDate() + 8 - simple.getUTCDay());
        }
        return ISOweekStart.toISOString().slice(0, 10);
    }

    function getEndDateFromWeek(weekValue: string) {
        const start = new Date(getDateFromWeek(weekValue));
        start.setDate(start.getDate() + 6);
        return start.toISOString().slice(0, 10);
    }

 // Update the handleFetch function to properly handle weekly and monthly data
const handleFetch = async () => {
    try {
        setIsFetching(true);
        const item_filter = buildItemFilter(currentState.advancedFilters);

        let compare_with;
        if (currentState.aggregation === "compare" && currentState.compareStartDate2 && currentState.compareEndDate2) {
            compare_with = {
                start_date: currentState.compareStartDate2.toISOString().slice(0, 10),
                end_date: currentState.compareEndDate2.toISOString().slice(0, 10),
            };
        }

        let Start_Date = "";
        let End_Date = "";

        // Updated date handling for different aggregation types
        switch (currentState.aggregation) {
            case "daily":
            case "custom":
                Start_Date = currentState.startDate ? currentState.startDate.toISOString().slice(0, 10) : "";
                End_Date = currentState.endDate ? currentState.endDate.toISOString().slice(0, 10) : "";
                break;

            case "weekly":
                if (currentState.weekFrom) {
                    Start_Date = getDateFromWeek(currentState.weekFrom);
                    // If weekTo is not set, use weekFrom + 6 days
                    End_Date = currentState.weekTo 
                        ? getEndDateFromWeek(currentState.weekTo)
                        : new Date(new Date(Start_Date).getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
                }
                break;

            case "monthly":
                if (currentState.monthFrom) {
                    Start_Date = `${currentState.monthFrom}-01`;
                    if (currentState.monthTo) {
                        // Get the last day of the selected month
                        const endDate = new Date(currentState.monthTo);
                        endDate.setMonth(endDate.getMonth() + 1);
                        endDate.setDate(0);
                        End_Date = endDate.toISOString().slice(0, 10);
                    } else {
                        // If monthTo is not set, use the last day of monthFrom
                        const endDate = new Date(currentState.monthFrom);
                        endDate.setMonth(endDate.getMonth() + 1);
                        endDate.setDate(0);
                        End_Date = endDate.toISOString().slice(0, 10);
                    }
                }
                break;

            case "compare":
                Start_Date = currentState.compareStartDate1 ? currentState.compareStartDate1.toISOString().slice(0, 10) : "";
                End_Date = currentState.compareEndDate1 ? currentState.compareEndDate1.toISOString().slice(0, 10) : "";
                break;
        }

        const payload = {
            Start_Date,
            End_Date,
            aggregation: currentState.aggregation,
            business: brandName,
            item_filter: Object.keys(item_filter).length > 0 ? item_filter : undefined,
            compare_with,
        };

        console.log("Fetch Payload:", payload);

        if (activeTab === 'overall') {
            const result = await fetchSaleReport(payload);
            if (result?.data) {
                const details = result.data.details || [];
                const summary = result.data.summary || {};

                // Format graph data based on aggregation type for old graph component
                const formatGraphData = (graphData: any[], aggregation: string) => {
                    if (!Array.isArray(graphData)) return [];
                    
                    return graphData.map(item => {
                        // Format x-axis labels based on aggregation type
                        if (aggregation === 'weekly' && item.week) {
                            // Format week as "Week 1", "Week 2", etc.
                            const weekNum = item.week.split('-W')[1];
                            return { ...item, x: `Week ${weekNum}` };
                        } else if (aggregation === 'monthly' && item.month) {
                            // Format month as "Jan", "Feb", etc.
                            const monthNum = parseInt(item.month.split('-')[1]);
                            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                                               'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                            return { ...item, x: monthNames[monthNum - 1] || item.month };
                        } else if (item.date) {
                            // For daily aggregation, show just the date (e.g., "01 Jan")
                            const date = new Date(item.date);
                            const day = date.getDate();
                            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                                               'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                            const month = monthNames[date.getMonth()];
                            return { ...item, x: `${day} ${month}` };
                        }
                        return item;
                    });
                };

                // Ensure graph data is properly formatted
                const graphData = {
                    sales_graph_data: formatGraphData(Array.isArray(summary.growth_graph_data) 
                        ? summary.growth_graph_data 
                        : [], currentState.aggregation),
                    target_sales_graph_data: formatGraphData(Array.isArray(summary.target_sales_graph_data)
                        ? summary.target_sales_graph_data
                        : [], currentState.aggregation),
                    target_value_graph_data: formatGraphData(Array.isArray(summary.target_value_graph_data)
                        ? summary.target_value_graph_data
                        : [], currentState.aggregation),
                };

                setFetchedData(details);
                setSummaryData(graphData);
                setStats({
                    Total_Sale_Value: summary.Total_Sale_Value || 0,
                    Total_Quantity_Sold: summary.Total_Quantity_Sold || 0,
                    Total_Items_Viewed: summary.Total_Items_Viewed || 0,
                    Total_Items_Added_To_Cart: summary.Total_Items_Added_To_Cart || 0,
                    Total_Target_Value: summary.Total_Target_Value || 0,
                    Total_Target_Sales: summary.Total_Target_Sales || 0,
                    Total_Target_Percentage_Deviation: summary.Total_Target_Percentage_Deviation || 0,
                });
            }
        } else {
            const result = await fetchSaleReportDetailed({
                Start_Date,
                End_Date,
                business: brandName,
                aggregation: currentState.aggregation,
                col: "total",
                group_by: currentState.GroupBy,
                item_filter: Object.keys(item_filter).length > 0 ? item_filter : undefined,
            });
            setDetailedData(result?.data || []);
        }
    } catch (error) {
        console.error("Error fetching sale report:", error);
    } finally {
        setIsFetching(false);
    }
};

    const handleOpenTargetModal = async () => {
        setIsTargetLoading(true);
        setTargetError(null);
        try {
            const result = await listTargetsWithStatus(brandName);
            setTargetList(result || []);
            setTargetModalOpen(true);
        } catch (err) {
            setTargetError("Failed to fetch targets");
        } finally {
            setIsTargetLoading(false);
        }
    };

const handleTargetClick = async (params: { type: any; value: any }) => {
    console.log("Target Clicked:", params);
    const type = String(params.type).toLowerCase();
    if (type === "stock_by_age" || type === "sales_by_age") {
        setPopupModalData(params.value);
        setPopupModalOpen(true);
        setTitle(type === "stock_by_age" ? "Stock By Age" : "Sales By Age");
    } else if (type === "date") {
        const dateValue = params.value;
        let startDate, endDate;

        if (typeof dateValue === "string" && dateValue.includes(" to ")) {
            const [start, end] = dateValue.split(" to ").map(s => s.trim());
            startDate = new Date(start);
            endDate = new Date(end);
        } else {
            startDate = new Date(dateValue);
            endDate = new Date(dateValue);
        }

        // Set the flag to true when switching from date click
        setIsFromDateClick(true);

        // Update detailed state with the date
        setDetailedState(prev => ({
            ...prev,
            aggregation: overallState.aggregation,
            startDate,
            endDate,
            compareStartDate1: overallState.compareStartDate1,
            compareEndDate1: overallState.compareEndDate1,
            compareStartDate2: overallState.compareStartDate2,
            compareEndDate2: overallState.compareEndDate2,
            monthFrom: overallState.monthFrom,
            monthTo: overallState.monthTo,
            weekFrom: overallState.weekFrom,
            weekTo: overallState.weekTo,
            advancedFilters: overallState.advancedFilters,
            GroupBy: overallState.GroupBy,
        }));

        // Switch to detailed tab
        setActiveTab("detailed");
    }
};

// Add useEffect to handle automatic fetching
useEffect(() => {
    if (activeTab === 'detailed' && isFromDateClick) {
        handleFetch();
        // Reset the flag after fetch
        setIsFromDateClick(false);
    }
}, [activeTab, isFromDateClick]);

// Update the tab switch handler
const handleTabSwitch = (tabValue: 'overall' | 'detailed') => {
    setActiveTab(tabValue);
    // Reset the flag when manually switching tabs
    setIsFromDateClick(false);
};


    function renderDateFilters() {
        if (currentState.aggregation === "daily" || currentState.aggregation === "custom") {
            return (
                <>
                    <div className="flex flex-col w-[16%] min-w-[150px]">
                        <label className="text-12 font-normal text-ltxt mb-1">
                            Start Date <span className="text-dng">*</span>
                        </label>
                        <input
                            type="date"
                            value={currentState.startDate ? currentState.startDate.toISOString().slice(0, 10) : ""}
                            onChange={e => updateCurrentState({ startDate: e.target.value ? new Date(e.target.value) : null })}
                            className="w-full border text-sm rounded px-3 py-2"
                        />
                    </div>
                    <div className="flex flex-col w-[16%] min-w-[150px]">
                        <label className="text-12 font-normal text-ltxt mb-1">
                            End Date
                            {currentState.aggregation === "custom" && <span className="text-dng">*</span>}
                        </label>
                        <input
                            type="date"
                            value={currentState.endDate ? currentState.endDate.toISOString().slice(0, 10) : ""}
                            onChange={e => updateCurrentState({ endDate: e.target.value ? new Date(e.target.value) : null })}
                            className="w-full border text-sm rounded px-3 py-2"
                        />
                    </div>
                </>
            );
        }
        if (currentState.aggregation === "compare") {
            return (
                <>
                    <div className="flex flex-col w-[16%] min-w-[150px]">
                        <label className="text-12 font-normal text-ltxt mb-1">
                            Start Date <span className="text-dng">*</span>
                        </label>
                        <input
                            type="date"
                            value={currentState.compareStartDate1 ? currentState.compareStartDate1.toISOString().slice(0, 10) : ""}
                            onChange={e => updateCurrentState({ compareStartDate1: e.target.value ? new Date(e.target.value) : null })}
                            className="w-full border text-sm rounded px-3 py-2"
                        />
                    </div>
                    <div className="flex flex-col w-[16%] min-w-[150px]">
                        <label className="text-12 font-normal text-ltxt mb-1">
                            End Date <span className="text-dng">*</span>
                        </label>
                        <input
                            type="date"
                            value={currentState.compareEndDate1 ? currentState.compareEndDate1.toISOString().slice(0, 10) : ""}
                            onChange={e => updateCurrentState({ compareEndDate1: e.target.value ? new Date(e.target.value) : null })}
                            className="w-full border text-sm rounded px-3 py-2"
                        />
                    </div>
                    <div className="flex flex-col w-[16%] min-w-[150px]">
                        <label className="text-12 font-normal text-ltxt mb-1">
                            Start Date 2 <span className="text-dng">*</span>
                        </label>
                        <input
                            type="date"
                            value={currentState.compareStartDate2 ? currentState.compareStartDate2.toISOString().slice(0, 10) : ""}
                            onChange={e => updateCurrentState({ compareStartDate2: e.target.value ? new Date(e.target.value) : null })}
                            className="w-full border text-sm rounded px-3 py-2"
                        />
                    </div>
                    <div className="flex flex-col w-[16%] min-w-[150px]">
                        <label className="text-12 font-normal text-ltxt mb-1">
                            End Date 2 <span className="text-dng">*</span>
                        </label>
                        <input
                            type="date"
                            value={currentState.compareEndDate2 ? currentState.compareEndDate2.toISOString().slice(0, 10) : ""}
                            onChange={e => updateCurrentState({ compareEndDate2: e.target.value ? new Date(e.target.value) : null })}
                            className="w-full border text-sm rounded px-3 py-2"
                        />
                    </div>
                </>
            );
        }
        if (currentState.aggregation === "monthly") {
            return (
                <>
                    <div className="flex flex-col w-[16%] min-w-[150px]">
                        <label className="text-12 font-normal text-ltxt mb-1">
                            From Month <span className="text-dng">*</span>
                        </label>
                        <input
                            type="month"
                            value={currentState.monthFrom}
                            onChange={e => updateCurrentState({ monthFrom: e.target.value })}
                            className="w-full border text-sm rounded px-3 py-2"
                        />
                    </div>
                    <div className="flex flex-col w-[16%] min-w-[150px]">
                        <label className="text-12 font-normal text-ltxt mb-1">To Month</label>
                        <input
                            type="month"
                            value={currentState.monthTo}
                            onChange={e => updateCurrentState({ monthTo: e.target.value })}
                            className="w-full border text-sm rounded px-3 py-2"
                        />
                    </div>
                </>
            );
        }
        if (currentState.aggregation === "weekly") {
            return (
                <>
                    <div className="flex flex-col w-[16%] min-w-[150px]">
                        <label className="text-12 font-normal text-ltxt mb-1">
                            From Week <span className="text-dng">*</span>
                        </label>
                        <input
                            type="week"
                            value={currentState.weekFrom}
                            onChange={e => updateCurrentState({ weekFrom: e.target.value })}
                            className="w-full border text-sm rounded px-3 py-2"
                        />
                    </div>
                    <div className="flex flex-col w-[16%] min-w-[150px]">
                        <label className="text-12 font-normal text-ltxt mb-1">To Week</label>
                        <input
                            type="week"
                            value={currentState.weekTo}
                            onChange={e => updateCurrentState({ weekTo: e.target.value })}
                            className="w-full border text-sm rounded px-3 py-2"
                        />
                    </div>
                </>
            );
        }
        return null;
    }

    const isFetchEnabled =
        !!brandName &&
        currentState.aggregation.length > 0 &&
        (
            (currentState.aggregation === "custom" && currentState.startDate && currentState.endDate) ||
            (currentState.aggregation === "compare" && currentState.compareStartDate1 && currentState.compareEndDate1 && currentState.compareStartDate2 && currentState.compareEndDate2) ||
            (currentState.aggregation === "monthly" && currentState.monthFrom) ||
            (currentState.aggregation === "weekly" && currentState.weekFrom) ||
            (currentState.aggregation === "daily" && currentState.startDate)
        );

    const filterCount = Object.keys(currentState.advancedFilters).length;

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
        updateCurrentState({ advancedFilters: filters });
        setAdvancedModalOpen(false);
        console.log("Advanced Filter Applied:", filters);
    };

    const filteredDetailedData = detailedData.map(({ Date, ...rest }) => rest);

    const shouldBlurDetailedGrid = activeTab === 'detailed' &&
        isFetching &&
        detailedData.length > 0;

    return (
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <div className={`${containerClass}`}>
            <h2 className="text-16 font-semibold mb-2">Daily Sale Report</h2>
            <div className="flex flex-col flex-1 border border-themeBase-l2 rounded-xl bg-white">
                <div className="border-b border-themeBase-l2 p-x20 flex flex-col gap-4">
                    {/* Tab Selector */}
                   <div className="flex space-x-4 mb-4">
                        {TAB_OPTIONS.map((tab) => (
                            <button
                                key={tab.value}
                                className={`px-4 py-1 rounded-md text-[15px] ${
                                    activeTab === tab.value
                                        ? 'bg-gray-800 text-white'
                                        : 'bg-white border border-gray-300 text-gray-900 hover:border-gray-800'
                                }`}
                                onClick={() => handleTabSwitch(tab.value as 'overall' | 'detailed')}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>


                    {/* First Row: Inputs and Advanced Filters */}
                    <div className="flex items-end gap-x-4 gap-y-4 ">
                        <div className="flex flex-col w-[12%] min-w-[140px]">
                            <label className="text-12 font-normal text-ltxt mb-1">
                                Aggregation <span className="text-dng">*</span>
                            </label>
                            <SmartDropdown
                                options={AGGREGATION_OPTIONS}
                                value={currentState.aggregation}
                                onChange={(val) => updateCurrentState({ aggregation: val as string })}
                                placeholder="Select"
                            />
                        </div>
                        {renderDateFilters()}
                        {activeTab === 'detailed' && (
                            <div className="flex flex-col w-[16%] min-w-[140px]">
                                <label className="text-12 font-normal text-ltxt mb-1">
                                    Group By <span className="text-dng">*</span>
                                </label>
                                <SmartDropdown
                                    options={GROUP_BY_OPTIONS}
                                    value={currentState.GroupBy}
                                    onChange={(val) => updateCurrentState({ GroupBy: val as string })}
                                    placeholder="Select"
                                    multiSelector
                                />
                            </div>
                        )}
                        <div className="flex items-center w-[12%] min-w-[180px] mt-auto ">
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
                        <Button
                            variant='secondary'
                            disabled={isExportingToSheet}
                            onClick={handleOpenTargetModal}
                        >
                            Targets
                        </Button>
                    </div>
                </div>

                {/* Stats Section - Only for Overall Tab */}
             {activeTab === 'overall' && (
                    <div className="flex flex-wrap gap-x20 w-full px-x20 pt-x20 pb-x10 border-b border-themeBase-l2">
                        {[
                            { label: "Total Sale Value", value: stats.Total_Sale_Value },
                            { label: "Quantity Sold", value: stats.Total_Quantity_Sold },
                            { label: "Items Viewed", value: stats.Total_Items_Viewed },
                            { label: "Items Added To Cart", value: stats.Total_Items_Added_To_Cart },
                        ].map((stat, idx) => (
                            <div
                                key={idx}
                                className="flex-1 min-w-[150px] bg-themeBase border border-themeBase-l2 rounded-xl p-x15"
                            >
                                <p className="text-12 text-ltxt mb-x2">{stat.label}</p>
                                <p className="text-20 font-bold text-dtxt">
                                    {stat.value?.toLocaleString?.() ?? 0}
                                </p>
                            </div>
                        ))}
                        <div className="flex-1 min-w-[150px] bg-themeBase border border-themeBase-l2 rounded-xl p-x15">
                            <p className="text-12 text-ltxt mb-x2">
                                Target: <span className="font-bold">{`${stats.Total_Target_Value?.toLocaleString?.() ?? 0}`}</span>
                            </p>
                            <p className="text-20 font-bold text-dtxt">
                                {`${stats.Total_Target_Sales?.toLocaleString?.() ?? 0}`}{" "}
                                <span
                                    className={
                                        stats.Total_Target_Percentage_Deviation < 0
                                            ? "text-dng font-semibold"
                                            : "text-scs font-semibold"
                                    }
                                >
                                    ({(stats.Total_Target_Percentage_Deviation ?? 0).toFixed(2)}%)
                                </span>
                            </p>
                        </div>
                    </div>
                )}

{/* Content Area */}
<div className="flex-1 min-h-0 flex flex-col ">
    {activeTab === 'overall' ? (
        <>
            {/* Chart Section */}
            <div className="flex-shrink-0 px-x20 pt-x20">
                <h3 className="text-16 font-semibold mb-2">Sales Chart</h3>
                <SalesChart
                    chartData={summaryData}
                />
            </div>

            {/* Grid Section - Single Scrollable Container */}
            <div className="flex-1 min-h-0 p-x20 mb-x20">
                <h3 className="text-16 font-semibold mb-2">Data</h3>
                <div className="h-full overflow-auto">
                    <DataGrid
                        rowData={fetchedData}
                        onTargetClick={handleTargetClick}
                        brandName={brandName}
                    />
                </div>
            </div>
        </>
    ) : (
        // Detailed tab remains the same
        <div className="h-full overflow-auto px-x20 pt-x20">
            <h3 className="text-16 font-semibold mb-2">Detailed Data</h3>
            <div className={`relative ${shouldBlurDetailedGrid ? 'opacity-50 pointer-events-none' : ''}`}>
                {shouldBlurDetailedGrid && (
                    <div className="absolute inset-0 bg-white bg-opacity-70 z-10 flex items-center justify-center">
                        <div className="text-lg font-semibold text-gray-700">Loading...</div>
                    </div>
                )}
                <DataGrid
                    rowData={filteredDetailedData}
                    onTargetClick={handleTargetClick}
                    brandName={brandName}
                />
            </div>
        </div>
    )}
</div>
        </div>

            {/* Modals */}
            <AppModal
                open={advancedModalOpen}
                onClose={() => setAdvancedModalOpen(false)}
                title="Advanced Filters"
                size="3xl"
            >
<div className="p-6 flex flex-col items-center min-h-0 max-h-[400px] overflow-y-auto">
                    <ColumnMultiSelect
                        columns={columnsAndFields?.field_names || []}
                        brand={brandName}
                        onChange={handleAdvancedFilterChange}
                        initialFilters={Object.fromEntries(
                            Object.entries(currentState.advancedFilters).map(([col, filter]) => [col, [filter]])
                        )}
                    />
                </div>
            </AppModal>

            <AppModal
                open={targetModalOpen}
                onClose={() => setTargetModalOpen(false)}
                title="Manage Daily Targets"
                size="3xl"
            >
                <div className="flex flex-col items-center h-full min-h-[400px] overflow-y-auto">
                    {isTargetLoading ? (
                        <div>Loading targets...</div>
                    ) : targetError ? (
                        <div className="text-red-500">{targetError}</div>
                    ) : (
                        <DailyTargetList
                            targets={targetList}
                            businessName={brandName} />
                    )}
                </div>
            </AppModal>

            <AppModal
                open={PopupModalOpen}
                onClose={() => setPopupModalOpen(false)}
                title={title}
                size="2xl"
            >
<div className="flex flex-col items-center min-h-0 max-h-[300px] overflow-y-auto w-full">
                    <DataGrid
                        rowData={PopupModalData}
                        onTargetClick={handleTargetClick}
                        brandName={brandName}
                    />
                </div>
            </AppModal>
        </div>
    </div>

    );
}