import { useState, useEffect } from 'react';
import SmartDropdown from '@/components/custom-ui/dropdown2';
import { fetchFieldValues } from '@/lib/data/dataapi';
import { Button } from '@/components/custom-ui/button2';


// List of number/date columns
export const NUMBER_OR_DATE_COLUMNS = [
    "Sale_Price",
    "Sale_Discount",
    "Current_Stock",
    "__Launch_Date",
    "__Offer_Date",
    "__Relist_Date",
    "Item_Id"
];

// Utility to check if a column is number/date
export function isNumberOrDateColumn(column: string): boolean {
    return NUMBER_OR_DATE_COLUMNS.map(c => c.toLowerCase()).includes(column.toLowerCase());
}

// Utility to check if a column is a date column
export function isDateColumn(column: string): boolean {
    return column.toLowerCase().includes('date');
}

// Operator lists
export const NUMBER_DATE_OPERATORS = [
    "less_than_or_equal", "greater_than_or_equal", "between", "equal", "not_equal", "greater_than", "less_than"
];

export const STRING_OPERATORS = [
    "in", "not_in", "equal", "not_equal"
];

// Get operators for a column
export function getOperatorsForColumn(column: string): string[] {
    const col = column.toLowerCase();
    if (col === "is_public") {
        return ["equal", "not_equal"];
    }
    if (col === "item_id") {
        // Special case: show in, not_in instead of equal/not_equal
        return ["in", "not_in", "less_than_or_equal", "greater_than_or_equal", "between",  "greater_than", "less_than"];
    }
    return isNumberOrDateColumn(column) ? NUMBER_DATE_OPERATORS : STRING_OPERATORS;
}


interface ColumnMultiSelectProps {
    columns: string[];
    brand: string;
    onChange?: (selected: { [column: string]: { operator: string; value: any }[] }) => void;
    initialFilters?: { [column: string]: { operator: string; value: any }[] };
}

export default function ColumnMultiSelect({ columns, brand, onChange, initialFilters }: ColumnMultiSelectProps) {
    // Each entry: { column, operator, value }
    const [selected, setSelected] = useState<{ column: string; operator: string; value: any }[]>([
        { column: '', operator: '', value: '' },
    ]);
    const [lastEmitted, setLastEmitted] = useState<{ [column: string]: { operator: string; value: any }[] }>({});
    const [fieldOptions, setFieldOptions] = useState<{ [column: string]: { label: string; value: string }[] }>({});
    const [fieldHasMore, setFieldHasMore] = useState<{ [column: string]: boolean }>({});
    const [fieldOffset, setFieldOffset] = useState<{ [column: string]: number }>({});
    const [editingIdx, setEditingIdx] = useState<number>(0); // Track which row is being edited


    console.log("brand", brand);

    useEffect(() => {
        if (initialFilters && Object.keys(initialFilters).length > 0) {
            const filled = Object.entries(initialFilters).map(([column, arr]) => ({
                column,
                operator: arr[0]?.operator ?? '',
                value: arr[0]?.value ?? undefined,
            }));
            setSelected(filled);
            // Also update lastEmitted so Apply button works immediately
            const obj: { [column: string]: { operator: string; value: any }[] } = {};
            filled.forEach(({ column, operator, value }) => {
                if (column && operator) obj[column] = [{ operator, value }];
            });
            setLastEmitted(obj);
        }
    }, [initialFilters]);

    // Fetch field values for string columns when a column is selected
    useEffect(() => {
        selected.forEach(async (sel) => {
            if (
                sel.column &&
                !isNumberOrDateColumn(sel.column) &&
                !fieldOptions[sel.column]
            ) {
                await fetchAllFieldValues(sel.column, brand);
            }
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selected.map(s => s.column).join(','), brand]);




    // ...rest of your code...

    // Helper to fetch all values for a column (with pagination)
    const fetchAllFieldValues = async (column: string, brand: string) => {
        // Use 500 for Item_Name or Item_Code, else 100
        const isBigColumn = ["item_name", "item_code"].includes(column.toLowerCase());
        const limit = isBigColumn ? 1000 : 100;
        let offset = 0;
        let allValues: string[] = [];
        let hasMore = true;
        setFieldHasMore(prev => ({ ...prev, [column]: true }));
        while (hasMore) {
            const res = await fetchFieldValues({
                fieldName: column,
                business: brand,
                search: "",
                offset,
                limit,
            });
            const values: string[] = res.values || res.data || [];
            allValues = [...allValues, ...values];
            hasMore = !!res.has_more;
            offset += limit;
        }
        setFieldOptions(prev => ({
            ...prev,
            [column]: allValues.map(v => ({ label: v, value: v })),
        }));
        setFieldHasMore(prev => ({ ...prev, [column]: false }));
        setFieldOffset(prev => ({ ...prev, [column]: offset }));
    };




    // Compute available options for each dropdown
    const getColumnOptions = (exclude: string[]) =>
        columns
            .filter(col => !exclude.includes(col))
            .map(col => ({ label: col.replace(/_/g, ' '), value: col }));

    // Handle column dropdown change
    const handleColumnChange = (idx: number, value: string) => {
        const updated = [...selected];
        updated[idx].column = value;
        updated[idx].operator = '';
        updated[idx].value = undefined;
        setSelected(updated);
        emitChange(updated);
    };

    // Handle operator dropdown change
    const handleOperatorChange = (idx: number, value: string) => {
        const updated = [...selected];
        updated[idx].operator = value;
        updated[idx].value = undefined;
        setSelected(updated);
        emitChange(updated);
    };

    // Handle value change (single value)
    const handleValueChange = (idx: number, value: any) => {
        const updated = [...selected];
        updated[idx].value = value;
        setSelected(updated);
        emitChange(updated);
    };

    // Handle value change for "between" (range)
    const handleRangeChange = (idx: number, value: [string, string]) => {
        const updated = [...selected];
        updated[idx].value = value;
        setSelected(updated);
        emitChange(updated);
    };

    // Add new dropdown
    const handleAdd = () => {
        setSelected([...selected, { column: '', operator: '', value: undefined }]);
    };

    // Emit in the required format
    const emitChange = (arr: { column: string; operator: string; value: any }[]) => {
    const obj: { [column: string]: { operator: string; value: any }[] } = {};
    arr.forEach(({ column, operator, value }) => {
        if (column && operator) {
            let finalValue = value;
            if (column.toLowerCase() === "item_id" && ["in", "not_in"].includes(operator)) {
                if (typeof value === "string") {
                    finalValue = value.split(/[\s,]+/)
                        .map(v => v.trim())
                        .filter(v => v !== "");
                }
            }
            obj[column] = [{ operator, value: finalValue }];
        }
    });
    setLastEmitted(obj);
    console.log("Emitted:", obj);
};


    // Helper to render value input
    // Validation function for a single row
const getRowValidation = (row: { column: string; operator: string; value: any }) => {
    if (!row.column || !row.operator) {
        return { valid: false, error: "Please select column and operator." };
    }
    if (row.operator === "between") {
        const [from, to] = Array.isArray(row.value) ? row.value : ["", ""];
        if (from === "" || to === "") {
            return { valid: false, error: "Both 'From' and 'To' values are required." };
        }
        if (isDateColumn(row.column)) {
            if (new Date(from) > new Date(to)) {
                return { valid: false, error: "'To' date should be after or equal to 'From' date." };
            }
        } else if (!isNaN(Number(from)) && !isNaN(Number(to))) {
            if (Number(from) > Number(to)) {
                return { valid: false, error: "'To' number should be greater than or equal to 'From' number." };
            }
        }
        return { valid: true, error: "" };
    }
    
    // Special handling for item_id with "in" or "not_in"
    if (row.column.toLowerCase() === "item_id" && ["in", "not_in"].includes(row.operator)) {
        if (Array.isArray(row.value)) {
            if (row.value.length === 0) {
                return { valid: false, error: "Please enter at least one item ID." };
            }
            // Check if all values are valid numbers
            const invalidValues = row.value.filter(v => isNaN(Number(v)));
            if (invalidValues.length > 0) {
                return { valid: false, error: "All item IDs must be valid numbers." };
            }
            return { valid: true, error: "" };
        }
        if (typeof row.value === "string" && row.value.trim() !== "") {
            // Check if it's a valid comma-separated list of numbers
            const values = row.value.split(/[\s,]+/).map(v => v.trim()).filter(v => v !== '');

            if (values.length === 0) {
                return { valid: false, error: "Please enter at least one item ID." };
            }
            const invalidValues = values.filter(v => isNaN(Number(v)));
            if (invalidValues.length > 0) {
                return { valid: false, error: "All item IDs must be valid numbers." };
            }
            return { valid: true, error: "" };
        }
        return { valid: false, error: "Please enter at least one item ID." };
    }
    
    if (["in", "not_in"].includes(row.operator)) {
        if (
            (!Array.isArray(row.value) || row.value.length === 0) &&
            !(typeof row.value === "string" && row.value !== "")
        ) {
            return { valid: false, error: "Please select at least one value." };
        }
        return { valid: true, error: "" };
    }
    if (row.value === undefined || row.value === null || row.value === "") {
        return { valid: false, error: "Please enter a value." };
    }
    return { valid: true, error: "" };
};

// Helper to render value input
const renderValueInput = (sel: { column: string; operator: string; value: any }, idx: number) => {
    if (!sel.column || !sel.operator) return null;

    // If operator is "between", show two inputs
    if (sel.operator === "between") {
        return (
            <div className="w-full flex gap-1">
                <input
                    type={isDateColumn(sel.column) ? "date" : "text"}
                    placeholder={isDateColumn(sel.column) ? "YYYY-MM-DD" : "From"}
                    value={Array.isArray(sel.value) ? sel.value[0] : ""}
                    onChange={e => {
                        const v = Array.isArray(sel.value) ? [...sel.value] : ["", ""];
                        v[0] = e.target.value;
                        handleRangeChange(idx, v as [string, string]);
                    }}
                    className="border px-x15 py-x8 rounded w-full "
                />
                <span className="mx-1">to</span>
                <input
                    type={isDateColumn(sel.column) ? "date" : "text"}
                    placeholder={isDateColumn(sel.column) ? "YYYY-MM-DD" : "To"}
                    value={Array.isArray(sel.value) ? sel.value[1] : ""}
                    onChange={e => {
                        const v = Array.isArray(sel.value) ? [...sel.value] : ["", ""];
                        v[1] = e.target.value;
                        handleRangeChange(idx, v as [string, string]);
                    }}
                    className="border px-x15 py-x8 rounded w-full "
                />
            </div>
        );
    }

    // Special handling for item_id with "in" or "not_in" operators
    if (sel.column.toLowerCase() === "item_id" && ["in", "not_in"].includes(sel.operator)) {
        const displayValue = Array.isArray(sel.value) ? sel.value.join(', ') : (sel.value || '');
        
        return (
            <input
                type="text"
                placeholder="Enter item IDs separated by spaces or commas (e.g., 123 456,789)"

                value={displayValue}
                onChange={e => {
                    const inputValue = e.target.value;
                    // Store the raw input value first
                    handleValueChange(idx, inputValue);
                }}
                className="border px-x15 py-x8 rounded w-full"
            />
        );
    }

    // For number/date columns, show input (date picker for date columns)
    if (isNumberOrDateColumn(sel.column)) {
        // If it's a date column, use type="date", else use type="number"
        const isDate = isDateColumn(sel.column);
        return (
            <input
                type={isDate ? "date" : "number"}
                placeholder={isDate ? "YYYY-MM-DD" : "Enter value"}
                value={sel.value ?? ""}
                onChange={e => handleValueChange(idx, e.target.value)}
                className="border px-x15 py-x8 rounded w-full "
                // Optional: prevent typing 'e', '+', '-', etc. for number input
                onKeyDown={isDate ? undefined : (e) => {
                    // Allow: backspace, tab, delete, arrows, etc.
                    if (
                        !/[0-9]/.test(e.key) &&
                        !["Backspace", "Tab", "Delete", "ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)
                    ) {
                        e.preventDefault();
                    }
                }}
            />
        );
    }

    // For string columns, show dropdown
    return (
        <SmartDropdown
            options={fieldOptions[sel.column] || []}
            value={sel.value}
            onChange={val => handleValueChange(idx, ["in", "not_in"].includes(sel.operator) ? val : (Array.isArray(val) ? val[0] : val))}
            placeholder="Select value"
            className="w-full"
            multiSelector={["in", "not_in"].includes(sel.operator)}
            enableSearch
        />
    );
};

    // Check if all rows are valid
    const areAllRowsFilled = () => selected.every(row => getRowValidation(row).valid);

    return (
        <div className="w-full flex flex-col gap-2 relative pb-x20 px-x20">
            {selected.map((sel, idx) => {
                const { valid, error } = getRowValidation(sel);
                const isEditing = editingIdx === idx;

                return (
                    <div
                        key={idx}
                        className={`flex flex-col gap-1 rounded-lg px-3 py-2 w-[100%] transition-colors border 
                            ${!valid ? 'border-red-400 bg-red-50' : isEditing ? 'border-blue-300 bg-white' : 'border-gray-200 bg-gray-100 opacity-80'}`}
                        onClick={() => editingIdx !== idx && setEditingIdx(idx)}
                        style={{ cursor: editingIdx !== idx ? 'pointer' : 'default' }}
                    >
                        <div className="flex items-center gap-3 w-full">
                            {/* Column */}
                            <SmartDropdown
                                options={getColumnOptions(selected.map((s, i) => i !== idx ? s.column : '').filter(Boolean))}
                                value={sel.column}
                                onChange={val => handleColumnChange(idx, Array.isArray(val) ? val[0] : val)}
                                placeholder="Column"
                                className="w-[20%]"
                                enableSearch
                            />

                            {/* Operator */}
                            {sel.column && (
                                <SmartDropdown
                                    options={getOperatorsForColumn(sel.column).map(op => ({ label: op.replace(/_/g, ' '), value: op }))}
                                    value={sel.operator}
                                    onChange={val => handleOperatorChange(idx, Array.isArray(val) ? val[0] : val)}
                                    placeholder="Operator"
                                    className="w-[20%]"
                                />
                            )}

                            {/* Value */}
                            {sel.column && sel.operator && (
                                <div className="flex items-center gap-2 w-[50%] text-14">
                                    {renderValueInput(sel, idx)}
                                    {!isNumberOrDateColumn(sel.column) && fieldHasMore[sel.column] && (
                                        <span className="text-sm text-blue-500 animate-pulse">Loading...</span>
                                    )}
                                </div>
                            )}

                            {/* Delete Button pushed to right */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const updated = selected.filter((_, i) => i !== idx);
                                    setSelected(updated);
                                    emitChange(updated);
                                }}
                                className="ml-auto text-red-500 hover:text-red-700"
                                title="Delete filter"
                            >
                                ✕
                            </button>
                        </div>
                        {/* Error message always on next line if invalid */}
                        {!valid && (
                            <div className="text-xs text-red-600 mt-1">{error}</div>
                        )}
                    </div>
                );
            })}

            {/* Add Button */}
            <div className="flex justify mt-2 mb-2">
                <Button
                    variant="secondary"
                    onClick={() => {
                        if (areAllRowsFilled() && selected.length < columns.length) {
                            handleAdd();
                            setEditingIdx(selected.length);
                        }
                    }}
                    disabled={!areAllRowsFilled() || selected.length >= columns.length}
                >
                    Add Condition
                </Button>
            </div>

            {/* Fixed Footer for Apply Button */}
            <div className="w-full bg-white border-t border-gray-200 flex justify-end px-6 py-4 rounded-b-md mt-auto">
                <Button
                    variant="primary"
                    onClick={() => areAllRowsFilled() && onChange?.(lastEmitted)}
                    disabled={!areAllRowsFilled()}
                >
                    Apply Filters
                </Button>
            </div>

        </div>
    );
}