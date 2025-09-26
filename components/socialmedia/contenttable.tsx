import React, { useState, useEffect } from "react";
import SmartTable from "../custom-ui/table";
import ContentView from "./contentview"; // Import the ContentView component
import { baseColumns, contentColumns, getColumns2 } from "./getColumns2";
import { upsertContent } from "@/lib/content/contentapi";
import { getDropdownColumns } from "./dropdowncolumns";

interface ContentTableProps {
    data: any[];
    format: string; // Format type passed from the parent
    status: string; // Status type passed from the parent
}

const ContentTable: React.FC<ContentTableProps> = ({ data, format, status }: ContentTableProps) => {
    const [selectedRow, setSelectedRow] = useState<any>(null); // State to track the selected row
    const [columns, setColumns] = useState<any[]>([]); // State to store dynamically generated columns
    const [tableData, setTableData] = useState<any[]>(data); // State to manage table data

    // const dropdownColumns = getDropdownColumns();

    console.log("ContentTable initialized with data:", tableData); // Log initial data for debugging

    useEffect(() => {
        // Sync tableData with the data prop whenever it changes
        console.log("Data prop changed, updating tableData...");
        console.log("table data before update:", tableData);
        console.log("New data prop:", data);
        setTableData(data);
    }, [data]); // Re-run whenever the data prop changes


    
    console.log("ContentTable initialized with data:", tableData); // Log initial data for debugging


const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    }).format(date);
};

    useEffect(() => {
        const populateColumns = () => {
            console.log("Populating columns...");
    
            // Combine baseColumns and contentColumns
            const staticColumns = [...baseColumns, ...contentColumns];
            console.log("Static columns:", staticColumns);
    
            console.log("Selected format:", format);
            console.log("Selected status:", status);
    
            // Get dynamic columns based on the selected format and status
            const dynamicColumns = getColumns2(format, status);
            console.log("Dynamic columns based on format and status:", dynamicColumns);
    
            // Combine static and dynamic columns
            const combinedColumns = [...contentColumns, ...dynamicColumns, ...baseColumns];
            console.log("Combined columns before filtering:", combinedColumns);
    
            // Keys to filter out
            const excludedKeys = [
                "created_by_name",
                "id",
                "brand_name",
                "status",
                "review_comment",
                "review_comment_log",
                "format_type",
                "is_delete",
            ];
    
            // Filter out columns with the specified keys
            const filteredColumns = combinedColumns.filter(
                (column) => !excludedKeys.includes(column.accessor)
            );
    
            const formattedColumns = filteredColumns.map((column) => {
                if (column.accessor === "updated_at" || column.accessor === "created_at") {
                    return {
                        ...column,
                        customRender: (value: string) => <span>{formatDateTime(value)}</span>,
                    };
                }
                return column;
            });

            // Define required columns for each format and status
            const requiredColumnsForStage = (() => {
                // Extract required columns from filteredColumns
                return filteredColumns.map((column) => ({
                    accessor: column.accessor,
                    label: column.label,
                }));
            })();
    


            const actionColumn = {
                id: "action",
                label: "Progress",
                accessor: "action",
                width: "100px",
                customRender: (value: any, row: any) => {
                    console.log("Row data in customRender:", row);
            
                    // Check how many required columns are filled for this row
                    const filledFieldsCount = requiredColumnsForStage.filter(
                        (column) =>
                            row[column.accessor] !== null &&
                            row[column.accessor] !== undefined &&
                            row[column.accessor] !== ""
                    ).length;
            
                    // Calculate progress as a percentage
                    const progressPercentage = Math.round(
                        (filledFieldsCount / requiredColumnsForStage.length) * 100
                    );
            
                    // Determine the color based on progress
                    const progressColor = progressPercentage === 100 ? "text-green-500" : "text-gray-500";
            
                    return (
                        <div>
                            {/* Display progress percentage */}
                            <div className={`text-sm ${progressColor}`}>
                                 {progressPercentage}% 
                            </div>
                        </div>
                    );
                },
            };
            
            
    
            // Conditionally add the action column only if status is "Working"
            const finalColumns =
                status === "Working" ? [actionColumn, ...formattedColumns] : formattedColumns;
    
            console.log("Final columns:", finalColumns);
    
            // Update the columns state
            setColumns(finalColumns);
        };
    
        populateColumns(); // Call the function to populate columns
    }, [format, status]); // Re-run when format or status changes


    const handleRowClick = (row: any) => {
        console.log("Row clicked:", row);
        setSelectedRow(row);
    };

    const handleCloseModal = () => {
        console.log("Closing modal...");
        setSelectedRow(null);
    };

    const handleUpdateRow = (updatedRow: any) => {
        console.log("Updated row data from modal:", updatedRow);
        console.log("Current selected row before update:", selectedRow);
    
        // Check if the item was deleted
        if (updatedRow.is_delete === true) {
            console.log(`Row with ID ${updatedRow.id} removed as it was deleted`);
            // Remove the row from the table data
            const filteredData = tableData.filter((row) => row.id !== updatedRow.id);
            setTableData(filteredData); // Update the table data state
            setSelectedRow(null); // Close the modal
            return;
        }
    
        // Check if the updated row's status matches the current table status
        if (typeof updatedRow.status === "string" && updatedRow.status !== status) {
            console.log(`Row with ID ${updatedRow.id} removed as its status changed to ${updatedRow.status}`);
            // Remove the row from the table data
            const filteredData = tableData.filter((row) => row.id !== updatedRow.id);
            setTableData(filteredData); // Update the table data state
            // setSelectedRow(null); // Close the modal
            return;
        }
    
        // Update only the specific fields in the selected row
        setSelectedRow((prevRow: any) => ({
            ...prevRow, // Keep the existing fields
            ...updatedRow, // Overwrite only the fields that are present in updatedRow
        }));
        console.log("Selected row after update:", { ...selectedRow, ...updatedRow });
    
        // Update the data array to reflect the changes in the table
        const updatedData = tableData.map((row) =>
            row.id === updatedRow.id ? { ...row, ...updatedRow } : row
        );
        setTableData(updatedData); // Update the state for the table data
        console.log("Updated data array:", updatedData);
    };

    return (
        <div className="table-container">
            <div className="table-wrapper overflow-x-auto">
                {columns.length > 0 && (
                    <SmartTable
                        columns={columns} // Dynamically generated columns
                        data={tableData} // Pass the updated table data
                        onRowClick={handleRowClick} // Open the modal with the clicked row's data
                        tableClassName="overflow-x-auto" // Add overflow for horizontal scrolling
                    />
                )}
            </div>

            {/* Render the modal if a row is selected */}
            {selectedRow && (
                <>
                    <ContentView
                        rowData={selectedRow}
                        onClose={handleCloseModal} // Close the modal
                        onUpdate={handleUpdateRow} // Handle updates from the modal
                    />
                    {console.log("Modal rendered with rowData:", selectedRow)}
                </>
            )}
        </div>
    );
};

export default ContentTable;