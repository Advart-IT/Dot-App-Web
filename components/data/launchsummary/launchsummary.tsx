import { useState, useEffect, useMemo } from 'react';
import SmartDropdown from '@/components/custom-ui/dropdown2';
import { Button } from '@/components/custom-ui/button2';
import ColumnMultiSelect from '@/components/data/advancedfilter';
import { AppModal } from '@/components/custom-ui/app-modal';
import { fetchLaunchSummary, exportToSheet } from '@/lib/data/dataapi';
import DataGrid from "@/components/data/DataGrid"; // <-- Add this import at the top



const GROUP_BY_OPTIONS = [
    { label: 'Item Name', value: 'item_name' },
    { label: 'Item Id', value: 'item_id' },
];

const DAYS_OPTIONS = [
    { label: '30 Days', value: '30' },
    { label: '60 Days', value: '60' },
    { label: '90 Days', value: '90' },
    { label: '120 Days', value: '120' },
];

const PERIODS_OPTIONS = [
    { label: 'First Period', value: 'first period' },
    { label: 'Second Period', value: 'second period' },
];

const EXCLUDED_COLUMNS = [
    'item_id', 'item_name', 'item_type', 'product_type', 'current_stock', 'category', 'sale_discount', 'sale_price'
];

interface LaunchSummaryFiltersProps {
    brandName: string;
    columnsAndFields?: any;
    containerClass?: string; // <-- add this
}

const getFirstDayOfMonth = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
};


export default function LaunchSummaryFilters({ brandName, columnsAndFields, containerClass = "flex-1 min-h-0 flex flex-col", }: LaunchSummaryFiltersProps) {
    const [groupBy, setGroupBy] = useState<string>("item_name"); // default to 'item_name'
    const [days, setDays] = useState<string>("");
    const [launchDate, setLaunchDate] = useState<Date | null>(getFirstDayOfMonth());
    const [periods, setPeriods] = useState<string[]>([]);
    const [extraColumns, setExtraColumns] = useState<string[]>([]);
    const [advancedModalOpen, setAdvancedModalOpen] = useState(false);
    const [advancedFilters, setAdvancedFilters] = useState<{ [column: string]: { operator: string; value: string | [string, string]; } }>({});
    const [isFetching, setIsFetching] = useState(false);
    const [fetchedData, setFetchedData] = useState<any[]>([]);
    const [isExporting, setIsExporting] = useState(false);
    const [isExportingToSheet, setIsExportingToSheet] = useState(false);
    const [selloutThreshold, setSelloutThreshold] = useState<string>("120");
    const [projectedQtyThreshold, setProjectedQtyThreshold] = useState<string>("120");
    const [showImageModal, setShowImageModal] = useState(false);


    console.log("LaunchDate:", launchDate?.toString()); // Log the launch date


    const adjustDateToLocal = (date: Date) => {
        const localDate = new Date(date);
        localDate.setMinutes(date.getMinutes() - date.getTimezoneOffset());
        return localDate;
    };

    // Set the launch date correctly, accounting for local time
    const localLaunchDate = launchDate ? adjustDateToLocal(launchDate) : null;

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

    const extraColumnOptions = useMemo(() => {
        if (!columnsAndFields?.groupby?.columns) return [];
        return columnsAndFields.groupby.columns
            .filter(
                (col: string) =>
                    !EXCLUDED_COLUMNS.map(c => c.toLowerCase()).includes(col.toLowerCase())
            )
            .map((col: string) => ({
                label: col.replace(/_/g, ' '), // Optional: prettify label
                value: col,
            }));
    }, [columnsAndFields]);

    const handleFetch = async () => {
        try {
            setIsFetching(true);
            const payload = {
                days: days ? Number(days) : 0,
                group_by: groupBy || "",
                item_filter: Object.fromEntries(
                    Object.entries(advancedFilters).filter(([_, v]) => v && v.value !== null && v.value !== "" && v.value !== undefined)
                        .map(([k, v]) => [k, [v]])
                ),
                variation_columns: extraColumns,
                launch_date_filter: launchDate ? launchDate.toISOString().slice(0, 10) : null,
                calculate_first_period: periods.includes("first period"),
                calculate_second_period: periods.includes("second period"),
            };
            console.log("Fetch Payload:", payload);
            const result = await fetchLaunchSummary(brandName, payload);
            setFetchedData(result?.data || []); // Store data for export
            console.log("Launch Summary Result:", result);
            // You can set this result to state to display in your UI
        } catch (error) {
            console.error("Error fetching launch summary:", error);
        } finally {
            setIsFetching(false);
        }
    };

    // const handleExportCSV = () => {
    //     if (!fetchedData || fetchedData.length === 0) return;
    //     setIsExporting(true);
    //     const keys = Object.keys(fetchedData[0]);
    //     const csvRows = [
    //         keys.join(","), // header
    //         ...fetchedData.map(row =>
    //             keys.map(k => {
    //                 const val = row[k];
    //                 // Escape quotes and commas
    //                 if (typeof val === "string" && (val.includes(",") || val.includes('"'))) {
    //                     return `"${val.replace(/"/g, '""')}"`;
    //                 }
    //                 return val;
    //             }).join(",")
    //         ),
    //     ];
    //     const csvContent = csvRows.join("\n");
    //     const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

    //     // For most browsers
    //     const url = URL.createObjectURL(blob);
    //     const link = document.createElement("a");
    //     link.href = url;
    //     link.setAttribute("download", "launch-summary.csv");
    //     document.body.appendChild(link);
    //     link.click();
    //     document.body.removeChild(link);
    //     setIsExporting(false);

    // };


    // const handleExportToSheet = async (sheetName: string) => {
    //     if (!fetchedData || fetchedData.length === 0) {
    //         return;
    //     }
    //     try {
    //         setIsExportingToSheet(true);
    //         const payload = {
    //             brand: brandName,
    //             sheet: sheetName,
    //             data: fetchedData, // assuming fetchedData is an array of objects
    //         };
    //         const result = await exportToSheet(payload);
    //         console.log("Export to Sheet Result:", result);
    //         alert("Exported to Google Sheet successfully!");
    //     } catch (error) {
    //         console.error("Error exporting to sheet:", error);
    //         alert("Failed to export to Google Sheet.");
    //     } finally {
    //         setIsExportingToSheet(false);
    //     }
    // };



    const isFetchEnabled =
        !!brandName &&
        groupBy.length > 0 &&
        (periods.length === 0 || days.length > 0);

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
        setAdvancedModalOpen(false); // <-- Close the modal on change
        console.log("Advanced Filter Applied:", filters);
    };

    return (
        <div className={containerClass}>
            <h2 className="text-16 font-semibold mb-2">Launch Summary</h2>
            <div className="bg-white rounded-xl shadow flex flex-col flex-1 min-h-0 h-full">
                <div className="border-b border-themeBase-l2 p-x20 flex flex-col gap-4">
                    {/* First Row: Inputs and Advanced Filters */}
                    <div className="flex flex-wrap items-end gap-x-4 gap-y-4">
                        {/* Group By */}
                        <div className="flex flex-col w-[12%] min-w-[140px]">
                            <label className="text-12 font-normal text-ltxt mb-1">
                                Group By <span className="text-dng">*</span>
                            </label>
                            <SmartDropdown
                                options={GROUP_BY_OPTIONS}
                                value={groupBy}
                                onChange={(val) => setGroupBy(val as string)}
                                placeholder="Select"
                            />
                        </div>

                        

                        {/* Launch Date */}
                        <div className="flex flex-col w-[17%] min-w-[150px]">
                            <label className="text-12 font-normal text-ltxt mb-1">Launch Date (From)</label>
                            <input
                                type="date"
                                value={localLaunchDate ? localLaunchDate.toISOString().slice(0, 10) : ""}
                                onChange={e => {
                                    setLaunchDate(e.target.value ? new Date(e.target.value) : null);
                                }}
                                className="w-full border text-sm rounded px-3 py-2"
                            />
                        </div>

                        {/* Period Selection */}
                        <div className="flex flex-col w-[14%] min-w-[150px]">
                            <label className="text-12 font-normal text-ltxt mb-1">Period Selection</label>
                            <SmartDropdown
                                options={PERIODS_OPTIONS}
                                value={periods}
                                onChange={(val) => setPeriods(val as string[])}
                                placeholder="Select"
                                multiSelector
                            />
                        </div>
                        {/* Days - only show if a period is selected */}
                            {periods.length > 0 && (
                            <div className="flex flex-col w-[10%] min-w-[120px]">
                                <label className="text-12 font-normal text-ltxt mb-1">
                                    Days <span className="text-dng">*</span>
                                </label>
                                <SmartDropdown
                                    options={DAYS_OPTIONS}
                                    value={days}
                                    onChange={(val) => setDays(val as string)}
                                    placeholder="Select"
                                />
                            </div>
                            )}
                        {/* Extra Columns */}
                        <div className="flex flex-col w-[20%] min-w-[160px]">
                            <label className="text-12 font-normal text-ltxt mb-1">Choose Extra Columns</label>
                            <SmartDropdown
                                options={extraColumnOptions}
                                value={extraColumns}
                                onChange={(val) => setExtraColumns(val as string[])}
                                multiSelector
                                enableSearch
                                placeholder="Select Columns"
                            />
                        </div>

                        {/* Advanced Filters Button */}
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
                        
                        {/* <Button
                            //className="bg-gray-100 text-gray-700 px-5 py-2 rounded border hover:bg-gray-200"
                            variant='gray'
                            disabled={fetchedData.length === 0 || isExporting}
                            onClick={handleExportCSV}
                        >
                            {isExporting ? 'Exporting...' : '↓ Export CSV'}
                        </Button> */}
                        {/* <Button
                            //className="bg-gray-100 text-gray-700 px-5 py-2 rounded border hover:bg-gray-200"
                            variant='gray'
                            disabled={fetchedData.length === 0 || isExportingToSheet}
                            onClick={() => handleExportToSheet("Launch Summary")}
                        >
                            {isExportingToSheet ? 'Exporting...' : '🧾 Export to Google Sheet'}
                        </Button> */}
                    </div>
                </div>

                <div className="flex-1 min-h-0 overflow-auto p-x20">
                    <h3 className="text-16 font-semibold mb-2">Data</h3>
                    {/* Add input boxes for thresholds in your first row, after "Extra Columns" and before "Advanced Filters" */}
                    {/* ...inside your component's render, replace the two threshold inputs with this... */}

                    <div className="flex gap-x-4 mb-4">
                        {/* Sellout Threshold */}
                        <div className="flex flex-col w-[15%] min-w-[120px]">
                            <label className="text-12 font-normal text-ltxt mb-1">
                                Days to Sellout X Days
                            </label>
                            <input
                                type="number"
                                className="w-full border text-sm rounded px-3 py-2"
                                value={selloutThreshold}
                                onChange={e => {
                                    // Remove leading zeros, but allow empty string for controlled input
                                    let value = e.target.value.replace(/^0+/, "");
                                    if (value === "") value = "";
                                    setSelloutThreshold(value);
                                }}
                            />
                        </div>
                        {/* Projected Qty Threshold */}
                        <div className="flex flex-col w-[17%] min-w-[120px]">
                            <label className="text-12 font-normal text-ltxt mb-1">
                                Projected Sales for Next X Days
                            </label>
                            <input
                                type="number"
                                className="w-full border text-sm rounded px-3 py-2"
                                value={projectedQtyThreshold}
                                max={selloutThreshold || "1"}
                                onChange={e => {
                                    // Remove leading zeros, but allow empty string for controlled input
                                    let value = e.target.value.replace(/^0+/, "");
                                    if (value === "") value = "";
                                    setProjectedQtyThreshold(value);
                                }}
                            />
                        </div>
                    </div>

                    {/* Pass these as props to DataGrid */}
                    <DataGrid
                        rowData={fetchedData}
                        brandName={brandName}
                        selloutThreshold={Number(selloutThreshold)}
                        projectedQtyThreshold={Number(projectedQtyThreshold)}
                    />
                </div>
            </div>



            <AppModal
                open={advancedModalOpen}
                onClose={() => setAdvancedModalOpen(false)}
                title="Advanced Filters"
                size="3xl"
            >
                <div className="flex flex-col items-center h-full min-h-[400px] overflow-y-auto">
                    {/* Render ColumnMultiSelect here */}
                    <ColumnMultiSelect
                        columns={columnsAndFields?.field_names || []}
                        brand={brandName}
                        onChange={handleAdvancedFilterChange}
                        initialFilters={Object.fromEntries(
                            Object.entries(advancedFilters).map(([col, filter]) => [col, [filter]])
                        )} // pass your existing filters here
                    />
                </div>
            </AppModal>

        </div>
    );
}