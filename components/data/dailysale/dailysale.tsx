// DailySaleFilters.tsx (Updated to add blur screen during date click navigation)
import { useState, useEffect, useMemo, useRef } from 'react';
import SmartDropdown from '@/components/custom-ui/dropdown2';
import { Button } from '@/components/custom-ui/button2';
import ColumnMultiSelect from '@/components/data/advancedfilter';
import { AppModal } from '@/components/custom-ui/app-modal';
import { fetchSaleReport, exportToSheet, listTargetsWithStatus, fetchSaleReportDetailed, SaleReportDetailedParams, SaleReportParams } from '@/lib/data/dataapi';
import DailyTargetList from '@/components/data/dailysale/dailytarget';
import CollectionTargetList from '@/components/data/dailysale/CollectioTarget';
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
    { label: 'Collection', value: 'collection' }, // Added Collection tab
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
    const [activeTab, setActiveTab] = useState<'overall' | 'detailed' | 'collection'>('overall'); // Added 'collection' type
    const [advancedModalOpen, setAdvancedModalOpen] = useState(false);
    const [isFetching, setIsFetching] = useState(false);
    const [fetchedData, setFetchedData] = useState<any[]>([]);
    const [detailedData, setDetailedData] = useState<any[]>([]);
    const [collectionData, setCollectionData] = useState<any[]>([]); // Added collection data state
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
    const [isFromDateClick, setIsFromDateClick] = useState(false); // Tracks if navigation was triggered by date click

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

    // Collection tab state
    const [collectionState, setCollectionState] = useState({
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
    const currentState = activeTab === 'overall' 
        ? overallState 
        : activeTab === 'detailed' 
            ? detailedState 
            : collectionState; // Added collection state
    const setCurrentState = activeTab === 'overall' 
        ? setOverallState 
        : activeTab === 'detailed' 
            ? setDetailedState 
            : setCollectionState; // Added collection state setter

    // Update current state helper
    const updateCurrentState = (updates: Partial<typeof overallState>) => {
        setCurrentState(prev => ({ ...prev, ...updates }));
    };

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

            switch (currentState.aggregation) {
                case "daily":
                case "custom":
                    Start_Date = currentState.startDate ? currentState.startDate.toISOString().slice(0, 10) : "";
                    End_Date = currentState.endDate ? currentState.endDate.toISOString().slice(0, 10) : "";
                    break;

                case "weekly":
                    if (currentState.weekFrom) {
                        Start_Date = getDateFromWeek(currentState.weekFrom);
                        End_Date = currentState.weekTo 
                            ? getEndDateFromWeek(currentState.weekTo)
                            : new Date(new Date(Start_Date).getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
                    }
                    break;

                case "monthly":
                    if (currentState.monthFrom) {
                        Start_Date = `${currentState.monthFrom}-01`;
                        if (currentState.monthTo) {
                            const endDate = new Date(currentState.monthTo);
                            endDate.setMonth(endDate.getMonth() + 1);
                            endDate.setDate(0);
                            End_Date = endDate.toISOString().slice(0, 10);
                        } else {
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

            const payload: SaleReportParams = {
                Start_Date,
                End_Date,
                aggregation: currentState.aggregation,
                business: brandName,
                item_filter: Object.keys(item_filter).length > 0 ? item_filter : undefined,
                compare_with,
                target_filter_type: 'single_filter'
            };

            console.log("Fetch Payload:", payload);

            if (activeTab === 'overall') {
                console.log('Overall Payload:', payload);
                const result = await fetchSaleReport(payload);
                if (result?.data) {
                    const details = result.data.details || [];
                    const summary = result.data.summary || {};

                    const formatGraphData = (graphData: any[], aggregation: string) => {
                        if (!Array.isArray(graphData)) return [];
                        
                        return graphData.map(item => {
                            if (aggregation === 'weekly' && item.week) {
                                const weekNum = item.week.split('-W')[1];
                                return { ...item, x: `Week ${weekNum}` };
                            } else if (aggregation === 'monthly' && item.month) {
                                const monthNum = parseInt(item.month.split('-')[1]);
                                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                                                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                                return { ...item, x: monthNames[monthNum - 1] || item.month };
                            } else if (item.date) {
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
                // For both 'detailed' and 'collection' tabs
                const detailedPayload: SaleReportDetailedParams = {
                    Start_Date,
                    End_Date,
                    business: brandName,
                    aggregation: currentState.aggregation,
                    col: "total",
                    group_by: currentState.GroupBy,
                    item_filter: Object.keys(item_filter).length > 0 ? item_filter : undefined,
                    target_filter_type: activeTab === 'collection' ? 'dual_filter' as const : 'single_filter' as const
                };
                console.log(`${activeTab === 'collection' ? 'Collection' : 'Detailed'} Payload:`, detailedPayload);
                const result = await fetchSaleReportDetailed(detailedPayload);
                
                if (activeTab === 'detailed') {
                    setDetailedData(result?.data || []);
                } else if (activeTab === 'collection') {
                    setCollectionData(result?.data || []);
                }
            }
        } catch (error) {
            console.error("Error fetching sale report:", error);
        } finally {
            setIsFetching(false);
            // Ensure isFromDateClick is reset after fetching completes, whether successful or not
            if (isFromDateClick) {
                 setIsFromDateClick(false);
            }
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

            setIsFromDateClick(true); // Set flag when navigating from Overall to Detailed via date click

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
            // Note: handleFetch will be triggered by the useEffect below
        }
    };

    useEffect(() => {
        // This effect runs when activeTab or isFromDateClick changes.
        // It triggers the fetch when switching to 'detailed' tab due to a date click.
        if (activeTab === 'detailed' && isFromDateClick) {
            handleFetch();
            // setIsFromDateClick(false) is now handled inside handleFetch's finally block
        }
    }, [activeTab, isFromDateClick]); // Depend on both activeTab and isFromDateClick

    const handleTabSwitch = (tabValue: 'overall' | 'detailed' | 'collection') => {
        setActiveTab(tabValue);
        // Reset the navigation flag when manually switching tabs
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

    // Pass complete data including Date field
    const filteredDetailedData = detailedData;
    const filteredCollectionData = collectionData;

    const shouldBlurDetailedGrid = activeTab === 'detailed' &&
        isFetching &&
        detailedData.length > 0;

    const shouldBlurCollectionGrid = activeTab === 'collection' &&
        isFetching &&
        collectionData.length > 0; // Added blur condition for collection

    // Determine if the main content area should be blurred (during date click navigation)
    const shouldBlurMainContent = isFromDateClick && isFetching && activeTab === 'detailed';

    return (
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <div className={`${containerClass}`}>
            <h2 className="text-16 font-semibold mb-2">Daily Sale Report</h2>
            {/* Main container for the report content with relative positioning for blur overlay */}
            <div className="flex flex-col flex-1 border border-themeBase-l2 rounded-xl bg-white relative">
                {/* Blur Overlay - Shown only during date click navigation to Detailed view */}
                {shouldBlurMainContent && (
                    <div className="absolute inset-0 bg-white bg-opacity-70 z-20 flex items-center justify-center rounded-xl">
                        <div className="text-lg font-semibold text-gray-700">Loading...</div>
                    </div>
                )}

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
                                onClick={() => handleTabSwitch(tab.value as 'overall' | 'detailed' | 'collection')}
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
                        {(activeTab === 'detailed' || activeTab === 'collection') && ( // Show Group By for both detailed and collection
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
                        // Detailed and Collection tabs
                        <div className="h-full overflow-auto px-x20 pt-x20">
                            <h3 className="text-16 font-semibold mb-2">{activeTab === 'collection' ? 'Collection Data' : 'Detailed Data'}</h3>
                            <div className={`relative ${activeTab === 'detailed' ? shouldBlurDetailedGrid : shouldBlurCollectionGrid ? 'opacity-50 pointer-events-none' : ''}`}>
                                {(activeTab === 'detailed' && shouldBlurDetailedGrid) || 
                                 (activeTab === 'collection' && shouldBlurCollectionGrid) && (
                                    <div className="absolute inset-0 bg-white bg-opacity-70 z-10 flex items-center justify-center">
                                        <div className="text-lg font-semibold text-gray-700">Loading...</div>
                                    </div>
                                )}
                                <DataGrid
                                    rowData={activeTab === 'detailed' ? filteredDetailedData : filteredCollectionData}
                                    onTargetClick={activeTab === 'detailed' ? undefined : handleTargetClick}
                                    brandName={brandName}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div> {/* End of main content container with relative positioning */}

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
    title={activeTab === 'collection' ? "Manage Collection Targets" : "Manage Daily Targets"}
    size="3xl"
>
    <div className="flex flex-col items-center h-full min-h-[400px] overflow-y-auto">
        {isTargetLoading ? (
            <div>Loading targets...</div>
        ) : targetError ? (
            <div className="text-red-500">{targetError}</div>
        ) : activeTab === 'collection' ? (
            <CollectionTargetList
                targets={targetList}
                businessName={brandName}
                onTargetsChange={(updatedTargets) => {
                    setTargetList(updatedTargets);
                }}
            />
        ) : (
            <DailyTargetList
                targets={targetList}
                businessName={brandName}
                onTargetsChange={(updatedTargets) => {
                    setTargetList(updatedTargets);
                }}
            />
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