"use client";
import {
  NumberFilterModule,
  CsvExportModule,
  ClientSideRowModelModule,
  TextFilterModule,
  ClientSideRowModelApiModule,
  RenderApiModule,
  themeQuartz,
  ModuleRegistry,
  DateFilterModule,
} from "ag-grid-community";

// Helper to format date as dd/mm/yyyy
function formatDate(dateStr?: string) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  if (!y || !m || !d) return dateStr;
  return `${d}/${m}/${y}`;
}
import "ag-grid-community/styles/ag-theme-quartz.css";
import { AgGridReact } from "ag-grid-react";
import { useRef, useMemo, useCallback, useState, useEffect } from "react";
import { Button } from '@/components/custom-ui/button2';
import SmartDropdown from '@/components/custom-ui/dropdown2'; // Ensure this path is correct

import {
  mapGSCToRows,
  generateSeoColumnDefs,
  mapQueriesToRows,
  generateSeoQueryColumnDefs,
  mapSummaryToRows,
  generateSeoSummaryColumnDefs,
  mapDailySummaryToRows,
  generateDailySummaryColumnDefs,
  mapQueryTotalsToRows,
  generateQueryTotalsColumnDefs,
  mapIndexedPagesToRows,
  generateIndexedPagesColumnDefs,
} from "./columnutils-seo";

// Detects query_totals format (array of objects with query, current_period.query_totals, comparison_period.query_totals)
function looksLikeQueryTotalsFormat(x: any): boolean {
  return x && typeof x === "object" && x.query && (
    (x.current_period && x.current_period.query_totals) ||
    (x.comparison_period && x.comparison_period.query_totals)
  );
}

// Detects indexed pages format (array of objects with s_no, page_url, optional issue_type/issue_count)
function looksLikeIndexedPagesFormat(x: any): boolean {
  return x && typeof x === "object" && typeof x.s_no === "number" && typeof x.page_url === "string";
}

ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  TextFilterModule,
  NumberFilterModule,
  CsvExportModule,
  ClientSideRowModelApiModule,
  RenderApiModule,
  DateFilterModule,
]);

const myTheme = themeQuartz.withParams({ browserColorScheme: "light" });

// Add styles for the copy column values dropdown
const dropdownStyles = `
  .column-dropdown {
    position: relative;
    display: inline-block;
  }
  .column-dropdown-content {
    position: absolute;
    top: 100%;
    left: 0;
    background-color: white;
    border: 1px solid #ccc;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    max-height: 300px;
    overflow-y: auto;
    z-index: 1000;
    min-width: 200px;
  }
  .column-dropdown-item {
    padding: 8px 12px;
    cursor: pointer;
    font-size: 12px;
    border-bottom: 1px solid #eee;
  }
  .column-dropdown-item:hover {
    background-color: #f8f9fa;
  }
  .column-dropdown-item:last-child {
    border-bottom: none;
  }
  .copy-notification {
    position: fixed;
    top: 20px;
    right: 20px;
    background-color: #28a745;
    color: white;
    padding: 10px 15px;
    border-radius: 4px;
    font-size: 12px;
    z-index: 1001;
    animation: fadeInOut 2s ease-in-out;
  }
  @keyframes fadeInOut {
    0% { opacity: 0; transform: translateY(-10px); }
    20% { opacity: 1; transform: translateY(0); }
    80% { opacity: 1; transform: translateY(0); }
    100% { opacity: 0; transform: translateY(-10px); }
  }
`;

type Props = {
  /** Page-level array OR Query-wise object OR array of query-wise objects OR indexed pages array */
  rawData: any[] | Record<string, any>;
  /** Optional override. If omitted, we auto-detect. */
  mode?: "page" | "query";
  /** For indexed pages, specify the tab type to determine column visibility */
  tabType?: 'no_issues' | 'with_issues' | 'not_indexed';
};

function looksLikeQueryWise(x: any): boolean {
  if (!x || typeof x !== "object") return false;
  // any of these flags means query-wise
  return Boolean(
    x?.mode === "query_wise" ||
    x?.current_period?.query_rows ||
    x?.comparison_period?.query_rows
  );
}

function looksLikeSummaryFormat(x: any): boolean {
  return x && typeof x === "object" && x.current_total && x.ranges;
}

function looksLikeDailyFormat(x: any): boolean {
  // Detect daily format by presence of current_total/current with date field
  if (!x || typeof x !== "object") return false;
  const hasDate = (arr: any[]) => Array.isArray(arr) && arr.some(row => row.date);
  return hasDate(x.current_total) || hasDate(x.current);
}

// Add color mapping for user types
const userTypeColors: Record<string, string> = {
  total: '#e3f2fd',      // light blue
  new: '#e8f5e9',        // light green
  returning: '#fffde7',  // light yellow
  '(not set)': '#f3e5f5' // light purple
};

function getAvailableUserTypes(rawData: any[]): string[] {
  const types = new Set<string>();
  let hasTotal = false;
  rawData.forEach(item => {
    // For daily format, user types are in current array
    if (item.current && Array.isArray(item.current)) {
      item.current.forEach((row: any) => {
        if (row.newVsReturning) types.add(row.newVsReturning);
      });
    }
    // For summary format, user types are in current_total array
    if (item.current_total && Array.isArray(item.current_total)) {
      item.current_total.forEach((row: any) => {
        if (row.newVsReturning) types.add(row.newVsReturning);
        if (!row.newVsReturning) hasTotal = true;
      });
    }
  });
  if (hasTotal) types.add('Total');
  // Capitalize for dropdown
  return Array.from(types).map(type => {
    if (type === '(not set)') return '(Not Set)';
    return type.charAt(0).toUpperCase() + type.slice(1);
  });
}

export default function DataGridSEO({ rawData, mode, tabType = 'no_issues' }: Props) {

  // Detect format
  const formatType = useMemo(() => {
    if (Array.isArray(rawData)) {
      const first = rawData[0];
      if (looksLikeIndexedPagesFormat(first)) return "indexed_pages";
      if (looksLikeDailyFormat(first)) return "daily";
      if (looksLikeSummaryFormat(first)) return "summary";
      if (looksLikeQueryTotalsFormat(first)) return "query_totals";
      if (looksLikeQueryWise(first)) return "query";
      return "page";
    }
    if (looksLikeDailyFormat(rawData)) return "daily";
    if (looksLikeSummaryFormat(rawData)) return "summary";
    if (looksLikeQueryTotalsFormat(rawData)) return "query_totals";
    if (looksLikeQueryWise(rawData)) return "query";
    return "page";
  }, [rawData, mode]);

  // Extract period info for card (for all formats)
  let periods: { current?: { start: string, end: string }, previous?: { start: string, end: string } } = {};
  const getPeriods = (data: any) => {
    if (!data) return {};
    if (data.ranges) return { current: data.ranges.current, previous: data.ranges.previous };
    if (data.current_period && data.current_period.date_range) {
      return {
        current: data.current_period.date_range,
        previous: data.comparison_period?.date_range
      };
    }
    if (data.current && data.current.length && data.current[0].date) {
      // daily format: infer from dates
      const dates = data.current.map((row: any) => row.date);
      const min = dates.length ? dates.reduce((a: string, b: string) => a < b ? a : b) : null;
      const max = dates.length ? dates.reduce((a: string, b: string) => a > b ? a : b) : null;
      return { current: { start: min, end: max } };
    }
    // For query_totals format, use first object's periods
    if (looksLikeQueryTotalsFormat(data)) {
      return {
        current: data.current_period?.date_range,
        previous: data.comparison_period?.date_range
      };
    }
    return {};
  };
  if (Array.isArray(rawData)) {
    // For query_totals, use first item with periods
    const firstWithPeriods = rawData.find(looksLikeQueryTotalsFormat) || rawData[0];
    periods = getPeriods(firstWithPeriods);
  } else {
    periods = getPeriods(rawData);
  }

  // Robust detection (supports single object OR array of objects)
  const isQueryWise = useMemo(() => {
    if (mode === "query") return true;
    if (mode === "page") return false;

    if (Array.isArray(rawData)) {
      const first = rawData[0];
      return looksLikeQueryWise(first);
    }
    return looksLikeQueryWise(rawData);
  }, [rawData, mode]);


  const availableUserTypes = useMemo(() => {
    if (formatType === "summary" || formatType === "daily") {
      return getAvailableUserTypes(Array.isArray(rawData) ? rawData : [rawData]);
    }
    return [];
  }, [rawData, formatType]);

  // Always select only 'Total' if that's the only available type
  const [selectedUserTypes, setSelectedUserTypes] = useState(() =>
    availableUserTypes.length === 1 ? availableUserTypes : ["Total"]
  );

  // New state for copy column values feature
  const [filteredRowData, setFilteredRowData] = useState<any[]>([]);
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);
  const [copyNotification, setCopyNotification] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // --- New State for SmartDropdown Column Visibility ---
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  // --- End New State ---

  // Keep selection in sync if availableUserTypes changes
  // If only 'Total', always select it
  if (availableUserTypes.length === 1 && selectedUserTypes[0] !== availableUserTypes[0]) {
    setSelectedUserTypes([availableUserTypes[0]]);
  }

  // If only 'Total' is present, always select it and hide the dropdown
  // Show dropdown for daily and summary formats if more than one user type
  const showDropdown = (formatType === "summary" || formatType === "daily") && availableUserTypes.length > 1;

  // Build rows
  const rowData = useMemo(() => {
    if (formatType === "indexed_pages") {
      return mapIndexedPagesToRows(Array.isArray(rawData) ? rawData : [rawData]);
    }
    if (formatType === "daily") {
      return mapDailySummaryToRows(Array.isArray(rawData) ? rawData : [rawData], selectedUserTypes);
    }
    if (formatType === "summary") {
      // Filter summary rows by selected user types
      return mapSummaryToRows(Array.isArray(rawData) ? rawData : [rawData], selectedUserTypes);
    }
    if (formatType === "query_totals") {
      return mapQueryTotalsToRows(Array.isArray(rawData) ? rawData : [rawData]);
    }
    if (formatType === "query") {
      const items = Array.isArray(rawData) ? rawData : [rawData];
      return items.flatMap((obj) => mapQueriesToRows(obj));
    }
    // Page-level expects an array; handle single-object site-level JSON
    if (Array.isArray(rawData)) {
      return mapGSCToRows(rawData);
    } else if (rawData && typeof rawData === "object") {
      return mapGSCToRows([rawData]);
    } else {
      return [];
    }
  }, [rawData, formatType, selectedUserTypes]);

  // Pick columns, add period column if both periods are present for all formats
  const columnDefs = useMemo(() => {
    let cols;
    const hasBothPeriods = periods.current && periods.previous;
    if (formatType === "indexed_pages") cols = generateIndexedPagesColumnDefs(tabType);
    else if (formatType === "daily") cols = generateDailySummaryColumnDefs(selectedUserTypes);
    else if (formatType === "summary") cols = generateSeoSummaryColumnDefs(selectedUserTypes);
    else if (formatType === "query_totals") cols = generateQueryTotalsColumnDefs();
    else if (formatType === "query") {
      const first = Array.isArray(rawData) ? rawData[0] : rawData;
      const showDateCols = Boolean(first?.current_period && first?.comparison_period);
      cols = generateSeoQueryColumnDefs(showDateCols);
    } else cols = generateSeoColumnDefs();

    // Add period column if both periods are present and not already present (not needed for query_totals, already present)
    if (hasBothPeriods && !cols.some(col => col.field === "period") && formatType !== "query_totals") {
      cols.unshift({
        headerName: "Period",
        field: "period" as any, // allow period as a field
        filter: "agTextColumnFilter",
        sortable: true,
        resizable: true,
        minWidth: 100,
        valueFormatter: (params: any) => {
          const value = params.value;
          if (typeof value === "string") {
            if (value.toLowerCase() === "current") return "Current";
            if (value.toLowerCase() === "previous" || value.toLowerCase() === "comparison") return "Previous";
          }
          return value || "";
        },
      });
    }
    // Hide date columns in the grid if the date is shown in the card (i.e., if periods.current exists)
    if (periods.current) {
      cols = cols.filter(col => !["date_start", "date_end"].includes(col.field as string));
    }
    // For summary, if only current, hide period column as well
    if (formatType === "summary" && !hasBothPeriods) {
      cols = cols.filter(col => col.field !== "period");
    }
    return cols;
  }, [formatType, selectedUserTypes, periods, rawData, tabType]);

  // --- Memoized Visible Columns ---
  const visibleColumnDefs = useMemo(() => {
    if (selectedColumns.length === 0) {
      return columnDefs; // Show all columns if none selected
    }
    // Ensure col.field is a string and exists before checking inclusion
    return columnDefs.filter(col => col.field && typeof col.field === 'string' && selectedColumns.includes(col.field));
  }, [columnDefs, selectedColumns]);
  // --- End Memoized Visible Columns ---

  // --- Options for SmartDropdown ---
  const columnOptions = useMemo(() => {
    return columnDefs
      .filter(col => col.field && typeof col.field === 'string') // Ensure field is a string
      .map(col => ({
        // Ensure label and value are strings
        label: (col.headerName || col.field) as string,
        value: col.field as string,
      }));
  }, [columnDefs]);
  // --- End Options for SmartDropdown ---

  // --- Debugging: Log options to check structure ---
  // console.log("columnOptions for SmartDropdown:", columnOptions);
  // --- End Debugging ---

  const gridRef = useRef<AgGridReact<any>>(null);

  // Function to get filtered data from ag-Grid
  const getFilteredData = useCallback((): any[] => {
    let filteredData: any[] = [];
    try {
      if (gridRef.current?.api) {
        const hasFilters = gridRef.current.api.isAnyFilterPresent();

        if (!hasFilters) {
          return [...rowData];
        }

        // Use forEachNodeAfterFilterAndSort to get data in grid display order
        gridRef.current.api.forEachNodeAfterFilterAndSort((node) => {
          if (node.data) {
            filteredData.push(node.data);
          }
        });
      }
    } catch (err) {
      console.error("Error fetching filtered data:", err);
      return rowData;
    }
    return filteredData;
  }, [rowData]);

  // Update filtered data when filters change
  const onFilterChanged = useCallback(() => {
    const filtered = getFilteredData();
    setFilteredRowData(filtered);
  }, [getFilteredData]);

  // Update filtered data when rowData changes
  useEffect(() => {
    const timer = setTimeout(() => {
      const filtered = getFilteredData();
      setFilteredRowData(filtered);
    }, 100);

    return () => clearTimeout(timer);
  }, [rowData, getFilteredData]);

  // Get column names for dropdown (used by Copy Column Values)
  const columnNames = useMemo(() => {
    return columnDefs
      .filter(col => col.field) // Only include columns with field property
      .map(col => ({
        field: col.field,
        headerName: col.headerName || col.field
      }));
  }, [columnDefs]); // Depend on columnDefs, not visibleColumnDefs

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowColumnDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Copy column values function
  const copyColumnValues = useCallback(async (columnField: string, columnHeaderName: string) => {
    try {
      // Find the column definition to check if it has a valueGetter or valueFormatter
      const columnDef = columnDefs.find(col => col.field === columnField); // Use columnDefs for calculations
      const dataToUse = filteredRowData.length > 0 ? filteredRowData : rowData;

      let uniqueValues: any[] = [];

      if (columnDef?.valueGetter) {
        // For calculated columns, use the valueGetter function
        uniqueValues = Array.from(new Set(
          dataToUse
            .map(row => {
              // Create a params object similar to what ag-Grid provides
              const params = {
                data: row,
                node: null,
                colDef: columnDef,
                column: null,
                api: null,
                columnApi: null,
                context: null,
                getValue: (field: string) => row[field]
              };

              // Call the valueGetter with the params
              const value = typeof columnDef.valueGetter === 'function'
                ? columnDef.valueGetter(params as any)
                : row[columnField];

              return value;
            })
            .filter(value => value !== null && value !== undefined && value !== '')
        )).sort((a, b) => {
          // Sort numbers numerically, strings alphabetically
          if (typeof a === 'number' && typeof b === 'number') {
            return a - b;
          }
          return String(a).localeCompare(String(b));
        });
      } else {
        // For regular columns, use the field value directly
        uniqueValues = Array.from(new Set(
          dataToUse
            .map(row => row[columnField])
            .filter(value => value !== null && value !== undefined && value !== '')
        )).sort((a, b) => {
          // Sort numbers numerically, strings alphabetically
          if (typeof a === 'number' && typeof b === 'number') {
            return a - b;
          }
          return String(a).localeCompare(String(b));
        });
      }

      // Apply value formatter if present
      if (columnDef?.valueFormatter) {
        uniqueValues = uniqueValues.map(value => {
          const params = {
            value,
            data: null,
            node: null,
            colDef: columnDef,
            column: null,
            api: null,
            columnApi: null,
            context: null,
          };
          return typeof columnDef.valueFormatter === 'function'
            ? columnDef.valueFormatter(params as any)
            : value;
        });
      }

      // Convert to string format for copying
      const valuesText = uniqueValues.join('\n');

      // Copy to clipboard
      await navigator.clipboard.writeText(valuesText);

      // Show notification
      setCopyNotification(`Copied ${uniqueValues.length} unique values from "${columnHeaderName}"`);
      setTimeout(() => setCopyNotification(null), 2000);

      // Close dropdown
      setShowColumnDropdown(false);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      setCopyNotification('Failed to copy to clipboard');
      setTimeout(() => setCopyNotification(null), 2000);
    }
  }, [filteredRowData, rowData, columnDefs]); // Depend on columnDefs

  // Export filename per mode
  const exportCsv = useCallback(() => {
    const prefix = isQueryWise ? "seo_queries" : formatType === "summary" ? "seo_summary" : "seo_pages";
    gridRef.current?.api?.exportDataAsCsv({
      fileName: `${prefix}_${new Date().toISOString().slice(0, 10)}.csv`,
      allColumns: true,
    });
  }, [isQueryWise, formatType]);

  return (
    <div className="ag-theme-quartz" style={{ width: "100%", height: 480 }}>
      <style dangerouslySetInnerHTML={{ __html: dropdownStyles }} />

      {/* Copy notification */}
      {copyNotification && (
        <div className="copy-notification">
          {copyNotification}
        </div>
      )}


      {/* Controls row: date card left, dropdown + export right */}
      {/* CHANGED: Added flexWrap: 'nowrap' and alignItems: 'flex-start' to keep items on one line */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16, gap: 10, padding: '0 8px' }}>
        {/* Period Info (left) */}
        {periods.current ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'none',
              border: 'none',
              boxShadow: 'none',
              fontSize: 14,
              fontWeight: 400,
              minWidth: 320, // Consider reducing or making dynamic if needed
              marginLeft: 0,
              marginTop: 11,
              marginBottom: 0,
              whiteSpace: 'nowrap',
              flexWrap: 'wrap',
              flex: 1, // Allow it to take remaining space
            }}
          >
            <span style={{ fontWeight: 600, color: '#1976d2' }}>Current Period:</span>
            <span style={{ color: '#222', marginRight: 15 }}>
              {formatDate(periods.current.start)} - {formatDate(periods.current.end)}
            </span>
            {periods.previous && (
              <>
                <span style={{ fontWeight: 600, color: '#888' }}>Previous Period:</span>
                <span style={{ color: '#444' }}>
                  {formatDate(periods.previous.start)} - {formatDate(periods.previous.end)}
                </span>
              </>
            )}
          </div>
        ) : <div style={{ flex: 1 }} />}

        {/* Button Group (right) */}
        {/* CHANGED: Added flexWrap: 'nowrap', alignItems: 'center', flexShrink: 0 */}
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexShrink: 0, minWidth: 'fit-content', flexWrap: 'nowrap' }}>
          {showDropdown && (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <SmartDropdown
                options={availableUserTypes.map(type => ({ label: type, value: type }))}
                value={selectedUserTypes}
                onChange={val => setSelectedUserTypes(Array.isArray(val) ? val : [val])}
                placeholder="Select User Types"
                multiSelector
                // className="min-w-[160px]"
              />
            </div>
          )}

          {/* SmartDropdown for Visible Columns */}
          {/* CHANGED: Added consistent height */}
          <SmartDropdown
            options={columnOptions}
            value={selectedColumns}
            onChange={(newValues) => {
              // Ensure newValues is always an array of strings for multiSelector
              if (Array.isArray(newValues)) {
                setSelectedColumns(newValues);
              } else {
                // Handle potential single string value (though multiSelector should prevent this)
                setSelectedColumns(newValues ? [newValues] : []);
              }
            }}
            multiSelector={true}
            className="w-[200px]"
            baseButtonClassName="text-left justify-between w-[200px]" // Added h-[40px]
          />

          {/* Copy Column Values Dropdown */}
          {/* CHANGED: Wrapped in a div for consistent height and added height to Button */}
          <div className="column-dropdown" ref={dropdownRef} style={{ height: '40px' }}>
            <Button
              variant="gray"
              size="m"
              onClick={() => setShowColumnDropdown(!showColumnDropdown)}
              className="mt-[5px]" // Match width and height
            >
              Copy Column Values ▼
            </Button>
            {showColumnDropdown && (
              <div className="column-dropdown-content">
                {columnNames.map((column) => {
                  // Calculate unique values count for display
                  const columnDef = columnDefs.find(col => col.field === column.field); // Use columnDefs
                  const dataToUse = filteredRowData.length > 0 ? filteredRowData : rowData;
                  let uniqueValuesCount = 0;

                  if (columnDef?.valueGetter) {
                    // For calculated columns, use the valueGetter function
                    const calculatedValues = dataToUse.map(row => {
                      const params = {
                        data: row,
                        node: null,
                        colDef: columnDef,
                        column: null,
                        api: null,
                        columnApi: null,
                        context: null,
                        getValue: (field: string) => row[field]
                      };

                      return typeof columnDef.valueGetter === 'function'
                        ? columnDef.valueGetter(params as any)
                        : (column.field ? row[column.field] : undefined);
                    });

                    uniqueValuesCount = Array.from(new Set(
                      calculatedValues.filter(v => v !== null && v !== undefined && v !== '')
                    )).length;
                  } else {
                    // For regular columns
                    uniqueValuesCount = Array.from(new Set(
                      typeof column.field === "string"
                        ? dataToUse.map(row => row[column.field as string]).filter(v => v !== null && v !== undefined && v !== '')
                        : []
                    )).length;
                  }

                  return (
                    <div
                      key={column.field}
                      className="column-dropdown-item"
                      onClick={() =>
                        column.field && copyColumnValues(column.field, column.headerName ?? column.field)
                      }
                    >
                      {column.headerName}
                      <div style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>
                        ({uniqueValuesCount} unique values)
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Export CSV Button */}
          {/* CHANGED: Added consistent height */}
          <Button
            variant="secondary"
            onClick={exportCsv}
            // className="w-[200px] h-[40px]" // Match width and height
          >
            Export CSV
          </Button>
        </div>
      </div>


      {/* User Type Color Row and Circles Row: Only show when showDropdown, and only for selectedUserTypes */}
      {showDropdown && selectedUserTypes.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '0 0 16px 0' }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#444', whiteSpace: 'nowrap' }}>Colour reference:</span>
          {selectedUserTypes.map(type => {
            // Normalize type for color lookup
            let key = type.toLowerCase();
            if (key === '(not set)' || key === '(not set)') key = '(not set)';
            if (key === 'total') key = 'total';
            if (key === 'new') key = 'new';
            if (key === 'returning') key = 'returning';
            const color = userTypeColors[key] || '#eee';
            return (
              <div key={type} style={{ background: color, color: '#111', padding: '4px 14px', borderRadius: 6, fontSize: 13, fontWeight: 500, border: '1px solid #e0e0e0', minWidth: 60, textAlign: 'center' }}>
                {type}
              </div>
            );
          })}
        </div>
      )}

      <AgGridReact<any>
        ref={gridRef}
        rowData={rowData}
        // Use visibleColumnDefs which reacts to selectedColumns
        columnDefs={visibleColumnDefs}
        animateRows
        defaultColDef={{
          flex: 1,
          minWidth: 120,
          filter: true,
          sortable: true,
          resizable: true,
          filterParams: {
            buttons: ["apply", "reset"],
            closeOnApply: true,
            newRowsAction: "keep",
          },
        }}
        rowSelection="multiple"
        theme={myTheme}
        onFilterChanged={onFilterChanged}
      />
    </div>
  );
}