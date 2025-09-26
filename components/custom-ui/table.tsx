import React, { useState } from "react";

interface Column<T> {
    label: string;
    accessor: keyof T & string;
    customRender?: (value: any, row: T) => React.ReactNode;
    noTruncate?: boolean; // Add this property
    width?: string; // Optional width property
}

interface SmartTableProps<T> {
    data: T[];
    columns: Column<T>[];
    onRowClick?: (item: T) => void;
    tableClassName?: string;
    headerClassName?: string;
    rowClassName?: string;
    cellClassName?: string;
    sortable?: boolean;
    stickyHeader?: boolean;
    onSort?: (column: keyof T, direction: "asc" | "desc") => void; // New prop for sorting
}

const SmartTable = <T,>({
    data,
    columns,
    onRowClick,
    tableClassName = "",
    headerClassName = "",
    rowClassName = "",
    cellClassName = "",
    sortable = true,
    stickyHeader = true,
    onSort,
}: SmartTableProps<T>) => {
    const [sortConfig, setSortConfig] = useState<{ key: keyof T; direction: "asc" | "desc" } | null>(null);

    const handleSort = (accessor: keyof T) => {
        if (!sortable) return;

        let direction: "asc" | "desc" = "asc";
        if (sortConfig && sortConfig.key === accessor) {
            direction = sortConfig.direction === "asc" ? "desc" : "asc";
        }

        setSortConfig({ key: accessor, direction });

        if (onSort) {
            onSort(accessor, direction);
        }
    };

    const sortedData = React.useMemo(() => {
        if (!sortConfig) return data;
        return [...data].sort((a, b) => {
            if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === "asc" ? -1 : 1;
            if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === "asc" ? 1 : -1;
            return 0;
        });
    }, [data, sortConfig]);

    const handleRowClick = (event: React.MouseEvent, row: T) => {
        // Check if the click originated from a button or link
        const target = event.target as HTMLElement;
        if (target.tagName === "BUTTON" || target.tagName === "A") {
            console.log("Click originated from a button or link. Skipping row click.");
            return;
        }

        // Call the onRowClick handler if provided
        onRowClick?.(row);
    };

    return (
        <div className={`w-full overflow-x-auto ${tableClassName}`}>
            {/* Header */}
            <div className="grid w-full">
                <div
                    className={`grid text-sm font-semibold bg-[#f5f5f5] text-gray-700 px-6 py-4 z-10 gap-x-4 ${
                        stickyHeader ? "sticky top-0 backdrop-blur bg-opacity-90" : ""
                    } ${headerClassName}`}
                    style={{
                        gridTemplateColumns: columns
                            .map((col) => (col.width ? `calc(${col.width} - 1rem)` : "minmax(0, 1fr)"))
                            .join(" "),
                    }}
                >
                    {columns.map((col, idx) => (
                        <div
                            key={idx}
                            className="truncate cursor-pointer"
                            onClick={() => handleSort(col.accessor)}
                        >
                            {col.label}
                            {sortable &&
                                col.accessor &&
                                sortConfig?.key === col.accessor &&
                                (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                        </div>
                    ))}
                </div>

                {/* Rows */}
                {sortedData.map((row, rowIndex) => (
                    <div
                        key={rowIndex}
                        onClick={(event) => handleRowClick(event, row)}
                        className={`grid px-6 py-4 text-sm items-center hover:bg-gray-100 transition duration-150 gap-x-4 border-b border-[#E0E0E0] ${rowClassName}`}
                        style={{
                            gridTemplateColumns: columns
                                .map((col) => (col.width ? `calc(${col.width} - 1rem)` : "minmax(0, 1fr)"))
                                .join(" "),
                        }}
                    >
                        {columns.map((col, colIndex) => {
                            const cellData = row[col.accessor];
                            return (
                                <div
                                    key={colIndex}
                                    className={`${cellClassName} ${
                                        col.noTruncate ? "overflow-visible" : "truncate"
                                    }`}
                                >
                                    {col.customRender ? (
                                        col.customRender(cellData, row)
                                    ) : (
                                        cellData as React.ReactNode
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SmartTable;

