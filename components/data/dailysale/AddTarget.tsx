// AddTargetForm.tsx (Updated to handle new API response format)
import { useState, useEffect } from "react";
import { fetchFieldValues, setDailyTargets, fetchColumnsAndFields } from "@/lib/data/dataapi";
import { useUser } from '@/hooks/usercontext';
import SmartDropdown from '@/components/custom-ui/dropdown2';

interface DailyTargetPayload {
  Business_Name: string;
  Target_Column: string;
  Target_Key: string;
  Start_Date: string;
  Target_Value: number;
}

interface AddTargetFormProps {
  businessName: string;
  onTargetAdded: (newTarget: any) => void;
  onCancel: () => void;
}

interface SchemaData {
  groupby: Record<string, any>;
  field_names: string[];
  agg?: string[];
  columns?: string[];
}

const AddTargetForm: React.FC<AddTargetFormProps> = ({ businessName, onTargetAdded, onCancel }) => {
  const [targetColumn, setTargetColumn] = useState<string>("");
  const [targetKey, setTargetKey] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [targetValue, setTargetValue] = useState<number | undefined>(undefined);
  const [columns, setColumns] = useState<{ label: string; value: string }[]>([]);
  const [columnOptionsLoading, setColumnOptionsLoading] = useState<boolean>(true);
  const [keys, setKeys] = useState<{ label: string; value: string }[]>([]);
  const [keyOptionsLoading, setKeyOptionsLoading] = useState<boolean>(false);
  const [fieldHasMore, setFieldHasMore] = useState<{ [column: string]: boolean }>({});
  const [fieldOffset, setFieldOffset] = useState<{ [column: string]: number }>({});
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();

  // Fetch available columns when component mounts
  useEffect(() => {
    console.log("AddTargetForm: Component mounted or businessName changed:", businessName);
    const fetchSchema = async () => {
      setColumnOptionsLoading(true);
      setError(null);
      try {
        console.log("AddTargetForm: Fetching schema for business:", businessName);
        const schemaData: SchemaData = await fetchColumnsAndFields(businessName);
        console.log("AddTargetForm: Received schema data:", schemaData);
        
        // Use field_names instead of columns
        const columnNames: string[] = schemaData.field_names || [];
        console.log("AddTargetForm: Extracted column names from field_names:", columnNames);
        
        const formattedColumns = columnNames.map(col => ({
          label: col.replace(/_/g, " "),
          value: col,
        }));
        console.log("AddTargetForm: Formatted columns for dropdown:", formattedColumns);
        setColumns(formattedColumns);
      } catch (err) {
        console.error("Error fetching columns:", err);
        setError("Failed to load target columns. Please try again.");
        setColumns([]);
      } finally {
        setColumnOptionsLoading(false);
      }
    };

    fetchSchema();
  }, [businessName]);

  // Fetch available keys when Target_Column changes
  useEffect(() => {
    const fetchKeys = async () => {
      if (!targetColumn || !businessName) return;
      setKeyOptionsLoading(true);
      setError(null);

      // Reset state for the new column
      setKeys([]);
      setFieldHasMore(prev => ({ ...prev, [targetColumn]: true }));
      setFieldOffset(prev => ({ ...prev, [targetColumn]: 0 }));

      try {
        // Check if the column is a number type
        const isNumericColumn = [
          "sale_price",
          "sale_discount",
          "current_stock",
          "item_id",
          "target_value",
          "mrp",
          "price",
          "stock",
          "quantity"
        ].includes(targetColumn.toLowerCase());

        console.log("AddTargetForm: Column type check - Is numeric:", isNumericColumn, "for column:", targetColumn);

        // Use different limits based on column type
        const isBigColumn = ["item_name", "item_code"].includes(targetColumn.toLowerCase());
        const limit = isNumericColumn ? 500 : (isBigColumn ? 1000 : 100);
        
        console.log("AddTargetForm: Using fetch limit:", limit, "for column:", targetColumn);
        
        let offset = 0;
        let allValues: string[] = [];
        let hasMore = true;
        let totalFetched = 0;

        while (hasMore) {
          // For numeric columns, break if we've reached 500 values
          if (isNumericColumn && totalFetched >= 500) {
            console.log("AddTargetForm: Reached 500 limit for numeric column, stopping fetch");
            break;
          }
          const res = await fetchFieldValues({
            fieldName: targetColumn,
            business: businessName,
            search: "",
            offset,
            limit,
          });
          const values: string[] = res.values || res.data || [];
          allValues = [...allValues, ...values];
          totalFetched += values.length;
          
          // For numeric columns, only continue if we haven't reached 500
          hasMore = !!res.has_more && (!isNumericColumn || totalFetched < 500);
          offset += limit;
          
          console.log("AddTargetForm: Fetched values batch. Total so far:", totalFetched);
        }

        const fetchedKeys = Array.from(new Set(allValues)).map(val => ({
          label: val,
          value: val,
        }));

        setKeys(fetchedKeys);
        setFieldHasMore(prev => ({ ...prev, [targetColumn]: false }));
        setFieldOffset(prev => ({ ...prev, [targetColumn]: offset }));
      } catch (err) {
        console.error("Error fetching target keys:", err);
        setError("Failed to load target keys for the selected column.");
        setKeys([]);
      } finally {
        setKeyOptionsLoading(false);
      }
    };

    fetchKeys();
  }, [targetColumn, businessName]);

  const handleSave = async () => {
    if (!targetColumn || !targetKey || !startDate || targetValue === undefined || targetValue === null) {
      setError("All fields are required.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const newTargetPayload: DailyTargetPayload = {
        Business_Name: businessName,
        Target_Column: targetColumn,
        Target_Key: targetKey,
        Start_Date: startDate,
        Target_Value: targetValue,
      };

      // First update backend
      await setDailyTargets([newTargetPayload]);

      // Create the new target with all required fields
      const createdTarget = {
        ...newTargetPayload,
        Status: true,
        Uploaded_At: new Date().toISOString(),
        Status_History: [{ status: true, timestamp: new Date().toISOString() }],
        target_type: "single_filter", // Set the target type explicitly
        id: `${targetColumn}-${targetKey}-${startDate}-${Date.now()}`, // Generate a unique ID
      };

      // Add to parent's state first
      onTargetAdded(createdTarget);
      
      // Then clear the form and close it
      setTargetColumn("");
      setTargetKey("");
      setStartDate("");
      setTargetValue(undefined);
      
      // Call onCancel to close the form
      onCancel();
    } catch (err) {
      console.error("Error adding target:", err);
      setError("Failed to add the target. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-300">
      {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 mb-3">
        {/* Target Column Dropdown */}
        <div className="flex flex-col">
          <label className="text-12 font-normal text-gray-500 mb-1">Target Column<span className="text-dng">*</span></label>
          <div className="relative w-full">
            <SmartDropdown
              options={columns}
              value={targetColumn}
              onChange={val => {
                console.log("AddTargetForm: Column dropdown onChange called with value:", val);
                setTargetColumn(Array.isArray(val) ? val[0] : val);
              }}
              placeholder="Select Column"
              className="border rounded-lg w-full"
              enableSearch
              disabled={columnOptionsLoading || saving || !(user?.permissions?.admin)}
            />
          </div>
        </div>

        {/* Target Key Dropdown */}
        <div className="flex flex-col">
          <label className="text-12 font-normal text-gray-500 mb-1">Target Key<span className="text-dng">*</span></label>
          <div className="relative w-full">
            <SmartDropdown
              options={keys}
              value={targetKey}
              onChange={val => setTargetKey(Array.isArray(val) ? val[0] : val)}
              placeholder="Select Key"
              className="border rounded-lg w-full"
              enableSearch
              disabled={!targetColumn || keyOptionsLoading || saving || !(user?.permissions?.admin)}
            />
          </div>
        </div>

        {/* Start Date Input */}
        <div className="flex flex-col">
          <label className="text-12 font-normal text-gray-500 mb-1">Start Date<span className="text-dng">*</span></label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border rounded-lg px-3 py-2 placeholder:text-gray-400 placeholder:font-normal placeholder:text-12 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={saving || !(user?.permissions?.admin)}
          />
        </div>

        {/* Target Value Input */}
        <div className="flex flex-col">
          <label className="text-12 font-normal text-gray-500 mb-1">Target Value<span className="text-dng">*</span></label>
          <input
           type="number"
            value={targetValue ?? ""}
            onChange={(e) => setTargetValue(e.target.value ? Number(e.target.value) : undefined)}
            className="border rounded-lg px-3 py-2 text-gray-400 font-normal text-12 focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="0"
            disabled={saving || !(user?.permissions?.admin)}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-end justify-end mb-2 gap-2">
          <button
            onClick={handleSave}
            className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-1 rounded-md text-sm"
            disabled={saving || !(user?.permissions?.admin)}
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            onClick={onCancel}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-1 rounded-md text-sm"
            disabled={saving}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddTargetForm;