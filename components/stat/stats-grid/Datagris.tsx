"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef, forwardRef, useImperativeHandle } from "react";
import { AgGridReact } from "ag-grid-react";
import { ModuleRegistry, type ColDef } from "ag-grid-community";
import {
  ClientSideRowModelModule,
  TextFilterModule,
  NumberFilterModule,
  CsvExportModule,
  ClientSideRowModelApiModule,
  RenderApiModule,
} from "ag-grid-community";
import { themeQuartz } from "ag-grid-community";
import {
  isUserTaskData,
  isContentData,
  extractUsersData,
  extractContentData,
  mapToUserTaskRows,
  mapToContentRows,
  generateUserTaskColumnDefs,
  generateContentColumnDefs,
  type UserTaskRow,
  type ContentRow,
} from "./Columnutiles";

// Register AG-Grid modules
ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  TextFilterModule,
  NumberFilterModule,
  CsvExportModule,
  ClientSideRowModelApiModule,
  RenderApiModule,
]);

const myTheme = themeQuartz.withParams({
  browserColorScheme: "light",
  headerFontSize: 14,
});

// Styles for the grid
const gridStyles = `
  .ag-theme-quartz .ag-header,
  .ag-theme-quartz .ag-header-cell-label {
    font-size: 12px !important;
  }
`;

type TaskDataGridProps = {
  rawData: any;
  onUserClick?: (userData: UserTaskRow) => void;
  onContentClick?: (contentData: ContentRow) => void;
};

const TaskDataGrid = forwardRef<any, TaskDataGridProps>(function TaskDataGrid(
  { rawData, onUserClick, onContentClick },
  ref
) {
  const [filteredRowData, setFilteredRowData] = useState<any[]>([]);
  const [isDataDetected, setIsDataDetected] = useState(false);
  const [dataType, setDataType] = useState<'user' | 'content' | 'none'>('none');
  const gridRef = useRef<AgGridReact<any>>(null);

  // Process and validate the incoming data
  const rowData = useMemo(() => {
    // Try to extract users from the JSON structure
    const users = extractUsersData(rawData);
    const content = extractContentData(rawData);
    
    // Check if this is user task data
    if (isUserTaskData(users)) {
      setIsDataDetected(true);
      setDataType('user');
      return mapToUserTaskRows(users);
    }
    
    // Check if this is content data
    if (isContentData(content)) {
      setIsDataDetected(true);
      setDataType('content');
      return mapToContentRows(content);
    }
    
    // No recognized data format
    setIsDataDetected(false);
    setDataType('none');
    return [];
  }, [rawData]);

  // Column definitions
  const columnDefs = useMemo(() => {
    if (!isDataDetected) return [];
    
    if (dataType === 'user') {
      return generateUserTaskColumnDefs();
    } else if (dataType === 'content') {
      // Check if any content item has a category to determine if we should show the column
      const hasCategory = rowData.some((item: any) => item.category !== undefined);
      return generateContentColumnDefs(hasCategory);
    }
    
    return [];
  }, [isDataDetected, dataType, rowData]);

  // Get filtered data from grid
  const getFilteredData = useCallback((): any[] => {
    let filtered: any[] = [];
    try {
      if (gridRef.current?.api) {
        const hasFilters = gridRef.current.api.isAnyFilterPresent();
        if (!hasFilters) {
          return [...rowData];
        }
        gridRef.current.api.forEachNodeAfterFilterAndSort((node) => {
          if (node.data) {
            filtered.push(node.data);
          }
        });
      }
    } catch (err) {
      console.error("Error fetching filtered data:", err);
      return rowData;
    }
    return filtered;
  }, [rowData]);

  // Update filtered data when filters change
  const onFilterChanged = useCallback(() => {
    const filtered = getFilteredData();
    setFilteredRowData(filtered);
  }, [getFilteredData]);

  // Initialize filtered data
  useEffect(() => {
    const timer = setTimeout(() => {
      const filtered = getFilteredData();
      setFilteredRowData(filtered);
    }, 100);
    return () => clearTimeout(timer);
  }, [rowData, getFilteredData]);

  // Export functionality
  const exportCsv = useCallback(() => {
    if (gridRef.current?.api) {
      const fileName = dataType === 'user' 
        ? `user_tasks_${new Date().toISOString().slice(0, 10)}.csv`
        : `content_data_${new Date().toISOString().slice(0, 10)}.csv`;
      
      gridRef.current.api.exportDataAsCsv({
        fileName,
        allColumns: true,
      });
    }
  }, [dataType]);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    getFilteredData: () => filteredRowData,
    exportCsv,
  }), [filteredRowData, exportCsv]);

  // Handle cell clicks
  const onCellClicked = useCallback((event: any) => {
    if (event.data) {
      if (dataType === 'user' && onUserClick) {
        onUserClick(event.data);
      } else if (dataType === 'content' && onContentClick) {
        onContentClick(event.data);
      }
    }
  }, [dataType, onUserClick, onContentClick]);

  // If data is not detected, show message
  if (!isDataDetected) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h3>No Data Available</h3>
      </div>
    );
  }

  return (
    <div style={{ width: "100%" }}>
      <style dangerouslySetInnerHTML={{ __html: gridStyles }} />
      
      {/* Export Button */}
      {/* <div style={{ marginBottom: "10px", textAlign: "right" }}>
        <button
          onClick={exportCsv}
          style={{
            padding: "8px 16px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "12px",
            fontWeight: "600",
          }}
        >
          Export CSV
        </button>
      </div> */}

      {/* AG-Grid */}
      <div className="ag-theme-quartz" style={{ height: 500, width: "100%" }}>
        <AgGridReact<any>
          ref={gridRef}
          rowData={rowData}
          columnDefs={columnDefs as any}
          animateRows={true}
          defaultColDef={{
            flex: 1,
            minWidth: 100,
            filter: true,
            sortable: true,
            resizable: true,
            filterParams: {
              buttons: ['apply', 'reset'],
              closeOnApply: true,
              newRowsAction: 'keep',
            }
          }}
          theme={myTheme}
          onFilterChanged={onFilterChanged}
          onCellClicked={onCellClicked}
        />
      </div>
    </div>
  );
});

export default TaskDataGrid;
