"use client";
import React, { useMemo, useState, useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from "react";
import { AgGridReact } from "ag-grid-react";
import {
  ModuleRegistry,
  ClientSideRowModelModule,
  themeQuartz,
  TextFilterModule,
  NumberFilterModule,
  DateFilterModule,
  ValidationModule,
  CellStyleModule,
  RowStyleModule,
  RowSelectionModule,
  CsvExportModule,
  ClientSideRowModelApiModule,
  RenderApiModule
} from "ag-grid-community";
import "ag-grid-community/styles/ag-theme-quartz.css";
import ImageView from "./imageView";
import { AppModal } from '@/components/custom-ui/app-modal';
import ImageCellRenderer from "./ImageCellRenderer";
import { Button } from '@/components/custom-ui/button2'
import {
  generateColumnDefs,
  calculateStockAnalysis,
  type StockAnalysis,
} from "./columnutils";
// 1. Import the SmartDropdown component
import SmartDropdown from "@/components/custom-ui/dropdown2"; // Adjust path as needed

const filterButtonStyles = `
  .ag-theme-quartz .ag-header,
  .ag-theme-quartz .ag-header-cell-label {
    font-size: 12px !important;
  }
  .ag-theme-quartz .ag-filter {
    position: relative;
    padding-top: 35px; /* creates space at top */
  }
  .ag-theme-quartz .ag-filter-apply-panel {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    padding: 6px 10px !important;
    justify-content: flex-start;
  }
  .ag-theme-quartz .ag-filter-apply-panel-button {
    font-size: 11px !important;
    padding: 4px 8px !important;
    height: 24px !important;
    min-width: 50px !important;
    margin: 2px !important;
  }
  .ag-theme-quartz .ag-standard-button {
    font-size: 10px !important;
    padding: 4px 8px !important;
    height: 24px !important;
    min-height: 24px !important;
  }
  .ag-theme-quartz .ag-filter-apply-panel .ag-standard-button {
    font-size: 10px !important;
    padding: 3px 6px !important;
    height: 22px !important;
    min-height: 22px !important;
    min-width: 45px !important;
  }
  .column-dropdown {
    position: relative;
    display: inline-block;
  }
  .column-dropdown-button {
    padding: 8px 16px;
    background-color: #28a745;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 11px;
    font-weight: 600;
    margin-right: 10px;
    min-width: 120px;
  }
  .column-dropdown-button:hover {
    background-color: #218838;
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
}`;

ModuleRegistry.registerModules([
  ClientSideRowModelModule, TextFilterModule, NumberFilterModule, DateFilterModule,
  ValidationModule, CellStyleModule, RowStyleModule, RowSelectionModule,
  CsvExportModule, ClientSideRowModelApiModule, RenderApiModule
]);

const myTheme = themeQuartz.withParams({
  browserColorScheme: "light",
  headerFontSize: 14,
});

const DataGrid = forwardRef(function DataGrid(
  props: {
    rowData: any[];
    brandName: string;
    onTargetClick?: (params: { type: any; value: any }) => void;
    selloutThreshold?: number;
    projectedQtyThreshold?: number;
  },
  ref
) {
  const {
    rowData,
    brandName,
    onTargetClick,
    selloutThreshold = 220,
    projectedQtyThreshold = 500,
  } = props;
  const [filteredRowData, setFilteredRowData] = useState<any[]>(rowData);
  const [isFiltered, setIsFiltered] = useState(false);
  // State for the original dropdown
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);
  // 2. State for selected columns in the new SmartDropdown
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [copyNotification, setCopyNotification] = useState<string | null>(null);
  const gridRef = useRef<AgGridReact>(null);
  const dropdownRef = useRef<HTMLDivElement>(null); // Ref for the copy dropdown
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageModalData, setImageModalData] = useState<any[]>([]);

  const hasItemId = rowData.length > 0 && Object.keys(rowData[0]).some(key => key.toLowerCase() === "item_id");
  const itemIdField = hasItemId ? Object.keys(rowData[0]).find(key => key.toLowerCase() === "item_id") : "";

  const baseColumnDefs = useMemo(() => {
    let cols = generateColumnDefs(rowData, selloutThreshold, onTargetClick, projectedQtyThreshold);
    if (hasItemId && itemIdField) {
      cols = [
        {
          headerName: "Image",
          field: itemIdField,
          cellRenderer: ImageCellRenderer,
          cellRendererParams: { brandName },
          width: 50,
          flex: 1,
          sortable: false,
          filter: false,
          pinned: 'left',
        },
        ...cols,
      ];
    }
    return cols;
  }, [rowData, selloutThreshold, projectedQtyThreshold, onTargetClick, brandName, hasItemId, itemIdField]);

  // Get column names for dropdowns (ensure label/value are strings for SmartDropdown)
  const columnNames = useMemo(() => {
    return baseColumnDefs
      .filter(col => col.field)
      .map(col => ({
        label: col.headerName || col.field || '',
        value: col.field || '',
      }));
  }, [baseColumnDefs]);

  // 3. Memoized column definitions based on selected columns
  const visibleColumnDefs = useMemo(() => {
    if (selectedColumns.length === 0) {
      return baseColumnDefs; // Show all columns if none selected
    }
    return baseColumnDefs.filter(col => col.field && selectedColumns.includes(col.field));
  }, [baseColumnDefs, selectedColumns]);

  const getFilteredData = useCallback((): any[] => {
    let filteredData: any[] = [];
    try {
      if (gridRef.current?.api) {
        const hasFilters = gridRef.current.api.isAnyFilterPresent();
        setIsFiltered(hasFilters);
        if (!hasFilters) {
          return [...rowData];
        }
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

  const onFilterChanged = useCallback(() => {
    const filtered = getFilteredData();
    setFilteredRowData(filtered);
  }, [getFilteredData]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const filtered = getFilteredData();
      setFilteredRowData(filtered);
    }, 100);
    return () => clearTimeout(timer);
  }, [rowData, getFilteredData]);

  useEffect(() => {
    if (gridRef.current?.api) {
      gridRef.current.api.refreshCells({ force: true });
    }
  }, [selloutThreshold, projectedQtyThreshold]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Close the copy dropdown if click is outside of it
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowColumnDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const exportFilteredData = useCallback(() => {
    if (gridRef.current?.api) {
      gridRef.current.api.exportDataAsCsv({
        fileName: `filtered_data_${new Date().toISOString().split('T')[0]}.csv`,
        allColumns: true
      });
    }
  }, []);

  const copyColumnValues = useCallback(async (columnField: string, columnHeaderName: string) => {
    try {
      const columnDef = baseColumnDefs.find(col => col.field === columnField);
      let uniqueValues: any[] = [];
      if (columnDef?.valueGetter) {
        uniqueValues = Array.from(new Set(
          filteredRowData
            .map(row => {
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
              const value = typeof columnDef.valueGetter === 'function'
                ? columnDef.valueGetter(params as any)
                : row[columnField];
              return value;
            })
            .filter(value => value !== null && value !== undefined && value !== '')
        )).sort((a, b) => {
          if (typeof a === 'number' && typeof b === 'number') {
            return a - b;
          }
          return String(a).localeCompare(String(b));
        });
      } else {
        uniqueValues = Array.from(new Set(
          filteredRowData
            .map(row => row[columnField])
            .filter(value => value !== null && value !== undefined && value !== '')
        )).sort((a, b) => {
          if (typeof a === 'number' && typeof b === 'number') {
            return a - b;
          }
          return String(a).localeCompare(String(b));
        });
      }
      const valuesText = uniqueValues.join('\n');
      await navigator.clipboard.writeText(valuesText);
      setCopyNotification(`Copied ${uniqueValues.length} unique values from "${columnHeaderName}"`);
      setTimeout(() => setCopyNotification(null), 2000);
      setShowColumnDropdown(false); // Close dropdown after copy
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      setCopyNotification('Failed to copy to clipboard');
      setTimeout(() => setCopyNotification(null), 2000);
    }
  }, [filteredRowData, baseColumnDefs]);

  function getAugmentedRows(rows: any[]) {
    const calculatedColumns = baseColumnDefs.filter(col => col.valueGetter && col.field);
    return rows.map(row => {
      const augmented = { ...row };
      calculatedColumns.forEach(col => {
        const params = {
          data: row,
          node: null,
          colDef: col,
          column: null,
          api: null,
          columnApi: null,
          context: null,
          getValue: (field: string) => row[field]
        };
        if (col.field) {
          augmented[col.field] = typeof col.valueGetter === 'function'
            ? col.valueGetter(params as any)
            : row[col.field];
        }
      });
      return augmented;
    });
  }

  useImperativeHandle(ref, () => ({
    getFilteredData: () => filteredRowData,
    exportFilteredData,
  }), [filteredRowData, exportFilteredData]);

  const handleShowImageModal = () => {
    let gridData: any[] = [];
    if (gridRef.current?.api) {
      gridRef.current.api.forEachNodeAfterFilterAndSort((node) => {
        if (node.data) gridData.push(node.data);
      });
    } else {
      gridData = [...rowData];
    }
    const validRows = hasItemId && itemIdField
      ? gridData.filter(row => !!row[itemIdField])
      : gridData;
    setImageModalData(getAugmentedRows(validRows));
    setShowImageModal(true);
  };

  return (
    <div style={{ height: 500, width: "100%" }} className="ag-theme-quartz">
      <style dangerouslySetInnerHTML={{ __html: filterButtonStyles }} />
      {copyNotification && (
        <div className="copy-notification">
          {copyNotification}
        </div>
      )}
      {baseColumnDefs.some((col) => col.field === "Days_to_Sellout") && (
        <StockSummary
          rowData={filteredRowData}
          selloutThreshold={selloutThreshold}
          projectedQtyThreshold={projectedQtyThreshold}
          isFiltered={isFiltered}
          totalRowCount={rowData.length}
        />
      )}
      {showImageModal && (
        <AppModal size="3xl" open={showImageModal} onClose={() => setShowImageModal(false)} title="Item Images">
          <ImageView data={imageModalData} brandName={brandName} selloutThreshold={selloutThreshold} />
        </AppModal>
      )}
      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginBottom: "10px", gap: "10px" }}>
        {hasItemId && (
          <Button
            variant="outline"
            onClick={handleShowImageModal}
          >
            View Images
          </Button>
        )}

        {/* 4. Integrated SmartDropdown for column selection */}
        <SmartDropdown
          options={columnNames}
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
          className="w-[200px]" // Fixed width of 200px
          baseButtonClassName="text-left justify-between" // Match width
        />

        {/* 5. Existing Column Values Dropdown */}
        <div className="column-dropdown" ref={dropdownRef}>
          <Button
            variant="gray"
            onClick={() => setShowColumnDropdown(!showColumnDropdown)}
            // className="w-[200px] h-[40px]"
          >
            Copy Column Values ▼
          </Button>
          {showColumnDropdown && (
            <div className="column-dropdown-content">
              {columnNames.map((column) => {
                // Use baseColumnDefs for calculations
                const columnDef = baseColumnDefs.find(col => col.field === column.value);
                let uniqueValuesCount = 0;
                if (columnDef?.valueGetter) {
                  const calculatedValues = filteredRowData.map(row => {
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
                      : (column.value ? row[column.value] : undefined);
                  });
                  uniqueValuesCount = Array.from(new Set(
                    calculatedValues.filter(v => v !== null && v !== undefined && v !== '')
                  )).length;
                } else {
                  uniqueValuesCount = Array.from(new Set(
                    typeof column.value === "string"
                      ? filteredRowData.map(row => row[column.value]).filter(v => v !== null && v !== undefined && v !== '')
                      : []
                  )).length;
                }
                return (
                  <div
                    key={column.value}
                    className="column-dropdown-item"
                    onClick={() =>
                      column.value && copyColumnValues(column.value, column.label)
                    }
                  >
                    {column.label}
                    <div style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>
                      ({uniqueValuesCount} unique values)
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <Button
          variant="secondary"
          onClick={exportFilteredData}
          // className="w-[200px] h-[40px]"
        >
          Export Filtered Data
        </Button>
      </div>

      <AgGridReact
        ref={gridRef}
        rowData={rowData}
        // 6. Use visibleColumnDefs which reacts to selectedColumns
        columnDefs={visibleColumnDefs}
        animateRows={true}
        defaultColDef={{
          flex: 1,
          minWidth: 150,
          filter: true,
          sortable: true,
          filterParams: {
            buttons: ['apply', 'reset'],
            closeOnApply: true,
            newRowsAction: 'keep',
          }
        }}
        theme={myTheme}
        rowSelection="multiple"
        onFilterChanged={onFilterChanged}
      />
    </div>
  );
});

interface StockSummaryProps {
  rowData: any[];
  selloutThreshold: number;
  projectedQtyThreshold: number;
  isFiltered: boolean;
  totalRowCount: number;
}

const StockSummary: React.FC<StockSummaryProps> = ({
  rowData,
  selloutThreshold,
  projectedQtyThreshold,
  isFiltered,
  totalRowCount
}) => {
  const analysis = useMemo(() => {
    return calculateStockAnalysis(rowData, selloutThreshold, projectedQtyThreshold);
  }, [rowData, selloutThreshold, projectedQtyThreshold]);

  const totalItems = analysis.redCount + analysis.greenCount;
  const redPercentage = totalItems > 0 ? ((analysis.redCount / totalItems) * 100).toFixed(2) : "0.00";
  const greenPercentage = totalItems > 0 ? ((analysis.greenCount / totalItems) * 100).toFixed(2) : "0.00";

  const renderItem = (label: string, value: number) => (
    <div style={{
      backgroundColor: "#fff", padding: "4px 6px", border: "1px solid #e5e7eb",
      borderRadius: "3px", flexGrow: 1, textAlign: "center", fontSize: "11px", flexShrink: 0,
    }}>
      <div style={{ fontWeight: "600", color: "#374151", fontSize: "10px" }}>{label}</div>
      <div style={{ color: "#111827" }}>{value.toLocaleString()}</div>
    </div>
  );

  return (
    <div style={{
      marginBottom: "15px", padding: "12px", backgroundColor: "#fff",
      borderRadius: "6px", fontSize: "13px", border: "1px solid #e0e0e0"
    }}>
      <strong style={{ color: "#343434", fontSize: "14px", marginBottom: "8px", display: "block" }}>
        Stock Analysis ({totalItems} Total Items)
        {isFiltered && (
          <span style={{ color: "#666", fontWeight: "normal", fontSize: "12px", marginLeft: "8px" }}>
            (Filtered from {totalRowCount} total items)
          </span>
        )}
      </strong>
      {isFiltered && rowData.length === 0 ? (
        <div style={{ color: "#666", marginTop: "8px", fontStyle: "italic" }}>
          No items match the current filter criteria
        </div>
      ) : (
        <>
          <div style={{ marginBottom: "12px" }}>
            <div style={{
              backgroundColor: "#fef2f2", padding: "6px 8px", borderRadius: "4px",
              fontSize: "12px", marginBottom: "6px", color: "#dc2626",
              fontWeight: "600", display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <span> Red Items ({analysis.redCount} items, {redPercentage}%)</span>
            </div>
            <div style={{ display: "flex", flexWrap: "nowrap", gap: "4px", overflowX: "auto", paddingBottom: "2px" }}>
              {renderItem("Total Stock", analysis.redTotalStock)}
              {renderItem("Current Stock", analysis.redStockSum)}
              {renderItem("Total Qty Sold", analysis.redAlltimeTotalQuantity)}
              {renderItem("Projected Qty", analysis.redProjectedQtySum)}
              {renderItem("Projected Qty (Within Stock)", analysis.redExpectedQtySum)}
              {renderItem("Views", analysis.redTotalViews)}
              {renderItem("Atc", analysis.redTotalAddedToCart)}
            </div>
          </div>
          <div>
            <div style={{
              backgroundColor: "#f0fdf4", padding: "6px 8px", borderRadius: "4px",
              fontSize: "12px", marginBottom: "6px", color: "#16a34a",
              fontWeight: "600", display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <span> Green Items ({analysis.greenCount} items, {greenPercentage}%)</span>
            </div>
            <div style={{ display: "flex", flexWrap: "nowrap", gap: "4px", overflowX: "auto", paddingBottom: "2px" }}>
              {renderItem("Total Stock", analysis.greenTotalStock)}
              {renderItem("Current Stock", analysis.greenStockSum)}
              {renderItem("Total Qty Sold", analysis.greenAlltimeTotalQuantity)}
              {renderItem("Projected Qty", analysis.greenProjectedQtySum)}
              {renderItem("Projected Qty (Within Stock)", analysis.greenExpectedQtySum)}
              {renderItem("Views", analysis.greenTotalViews)}
              {renderItem("Atc", analysis.greenTotalAddedToCart)}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DataGrid;