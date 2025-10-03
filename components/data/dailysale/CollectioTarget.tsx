// CollectionTargetList.tsx (Updated to filter for dual_filter targets)
import { useState, useEffect } from "react";
import { setDualFilterTargets, updateDualFilterTargetEntry, UpdateDualFilterTargetEntryPayload, DualFilterTargetPayload } from "@/lib/data/dataapi"; // Import setDualFilterTargets and updateDualFilterTargetEntry
import { useUser } from '@/hooks/usercontext';
import { fetchFieldValues, fetchColumnsAndFields } from "@/lib/data/dataapi"; // Assuming these utilities exist
import SmartDropdown from "@/components/custom-ui/dropdown2";

interface CollectionTarget {
  Business_Name: string;
  Start_Date: string;
  Primary_Target_Column: string;
  Primary_Target_Key: string;
  Secondary_Target_Column: string;
  Secondary_Target_Key: string;
  Target_Value?: number;
  Uploaded_At?: string;
  Status_History?: { status: boolean; timestamp: string }[];
  Status?: boolean;
  is_deleted?: boolean; // Added for potential deletion handling
  id?: string; // Add a unique ID for React key
  target_type?: string; // Add this field to the interface
  target_filter_type?: string; // Add this field to match the object literal
}

interface CollectionTargetListProps {
  targets: CollectionTarget[]; // Changed type - this list may contain mixed filter types
  businessName: string;
  onTargetsChange?: (updatedTargets: CollectionTarget[]) => void; // Changed type
}

// AddCollectionTargetForm Component
interface AddCollectionTargetFormProps {
  businessName: string;
  onTargetAdded: (newTarget: CollectionTarget) => void;
  onCancel: () => void;
}

interface SchemaData {
  groupby: Record<string, any>;
  field_names: string[];
  agg?: string[];
  columns?: string[]; // Sometimes API might return 'columns' instead of 'field_names'
}

const AddCollectionTargetForm: React.FC<AddCollectionTargetFormProps> = ({ businessName, onTargetAdded, onCancel }) => {
  const [primaryColumn, setPrimaryColumn] = useState<string>("");
  const [primaryKey, setPrimaryKey] = useState<string>("");
  const [secondaryColumn, setSecondaryColumn] = useState<string>("");
  const [secondaryKey, setSecondaryKey] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [targetValue, setTargetValue] = useState<number | undefined>(undefined);
  const [columns, setColumns] = useState<{ label: string; value: string }[]>([]);
  const [primaryKeys, setPrimaryKeys] = useState<{ label: string; value: string }[]>([]);
  const [secondaryKeys, setSecondaryKeys] = useState<{ label: string; value: string }[]>([]); // For secondary key dropdown
  const [columnOptionsLoading, setColumnOptionsLoading] = useState<boolean>(true);
  const [primaryOptionsLoading, setPrimaryOptionsLoading] = useState<boolean>(false);
  const [secondaryOptionsLoading, setSecondaryOptionsLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldHasMore, setFieldHasMore] = useState<Record<string, boolean>>({});
  const [fieldOffset, setFieldOffset] = useState<Record<string, number>>({});
  const { user } = useUser();

  // Fetch available columns on mount using fetchColumnsAndFields
  useEffect(() => {
    const fetchSchema = async () => {
      setColumnOptionsLoading(true);
      setError(null);
      try {
        console.log("AddCollectionTargetForm: Fetching schema for business:", businessName);
        const schemaData: SchemaData = await fetchColumnsAndFields(businessName);
        console.log("AddCollectionTargetForm: Received schema ", schemaData);

        // Prefer 'field_names', fallback to 'columns' if necessary
        const columnNames: string[] = schemaData.field_names || schemaData.columns || [];
        console.log("AddCollectionTargetForm: Extracted column names:", columnNames);

        const formattedColumns = columnNames.map(col => ({
          label: col.replace(/_/g, " "), // Replace underscores with spaces for display
          value: col,
        }));
        console.log("AddCollectionTargetForm: Formatted columns for dropdown:", formattedColumns);
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

  // Fetch primary keys when Primary Column changes
  useEffect(() => {
    const fetchPrimaryKeys = async () => {
      if (!primaryColumn || !businessName) return;
      setPrimaryOptionsLoading(true);
      setError(null);
      setPrimaryKeys([]); // Reset keys when column changes
      setFieldHasMore(prev => ({ ...prev, [primaryColumn]: true }));
      setFieldOffset(prev => ({ ...prev, [primaryColumn]: 0 }));

      try {
        const isNumericColumn = ["sale_price", "sale_discount", "current_stock", "item_id", "target_value", "mrp", "price", "stock", "quantity"].includes(primaryColumn.toLowerCase());
        const isBigColumn = ["item_name", "item_code"].includes(primaryColumn.toLowerCase());
        const limit = isNumericColumn ? 500 : (isBigColumn ? 1000 : 100);

        let offset = 0;
        let allValues: string[] = [];
        let hasMore = true;
        let totalFetched = 0;

        while (hasMore) {
          if (isNumericColumn && totalFetched >= 500) {
            break;
          }
          const res = await fetchFieldValues({
            fieldName: primaryColumn,
            business: businessName,
            search: "",
            offset,
            limit,
          });

          const values: string[] = res.values || res.data || [];
          allValues = [...allValues, ...values];
          totalFetched += values.length;

          hasMore = !!res.has_more && (!isNumericColumn || totalFetched < 500);
          offset += limit;
        }

        const fetchedKeys = Array.from(new Set(allValues)).map(val => ({
          label: val,
          value: val,
        }));
        setPrimaryKeys(fetchedKeys);
        setFieldHasMore(prev => ({ ...prev, [primaryColumn]: false }));
        setFieldOffset(prev => ({ ...prev, [primaryColumn]: offset }));
      } catch (err) {
        console.error("Error fetching primary keys:", err);
        setError("Failed to load keys for the selected primary column.");
        setPrimaryKeys([]);
      } finally {
        setPrimaryOptionsLoading(false);
      }
    };

    fetchPrimaryKeys();
  }, [primaryColumn, businessName]);

  // Fetch secondary keys when Secondary Column changes, excluding selected primary key
  useEffect(() => {
    const fetchSecondaryKeys = async () => {
      if (!secondaryColumn || !businessName || !primaryKey) return; // Require primary key to filter
      setSecondaryOptionsLoading(true);
      setError(null);
      setSecondaryKeys([]); // Reset keys when column changes
      setFieldHasMore(prev => ({ ...prev, [secondaryColumn]: true }));
      setFieldOffset(prev => ({ ...prev, [secondaryColumn]: 0 }));

      try {
        const isNumericColumn = ["sale_price", "sale_discount", "current_stock", "item_id", "target_value", "mrp", "price", "stock", "quantity"].includes(secondaryColumn.toLowerCase());
        const isBigColumn = ["item_name", "item_code"].includes(secondaryColumn.toLowerCase());
        const limit = isNumericColumn ? 500 : (isBigColumn ? 1000 : 100);

        let offset = 0;
        let allValues: string[] = [];
        let hasMore = true;
        let totalFetched = 0;

        while (hasMore) {
          if (isNumericColumn && totalFetched >= 500) {
            break;
          }
          const res = await fetchFieldValues({
            fieldName: secondaryColumn,
            business: businessName,
            search: "",
            offset,
            limit,
          });

          let values: string[] = res.values || res.data || [];

          // Filter out the selected primary key if columns are the same
          if (primaryColumn === secondaryColumn) {
             values = values.filter(val => val !== primaryKey);
          }

          allValues = [...allValues, ...values];
          totalFetched += values.length;

          hasMore = !!res.has_more && (!isNumericColumn || totalFetched < 500);
          offset += limit;
        }

        const fetchedKeys = Array.from(new Set(allValues)).map(val => ({
          label: val,
          value: val,
        }));
        setSecondaryKeys(fetchedKeys);
        setFieldHasMore(prev => ({ ...prev, [secondaryColumn]: false }));
        setFieldOffset(prev => ({ ...prev, [secondaryColumn]: offset }));
      } catch (err) {
        console.error("Error fetching secondary keys:", err);
        setError("Failed to load keys for the selected secondary column.");
        setSecondaryKeys([]);
      } finally {
        setSecondaryOptionsLoading(false);
      }
    };

    fetchSecondaryKeys();
  }, [secondaryColumn, businessName, primaryKey, primaryColumn]); // Depend on primaryKey and primaryColumn


  const handleSave = async () => {
    if (!primaryColumn || !primaryKey || !secondaryColumn || !secondaryKey || !startDate || targetValue === undefined || targetValue === null) {
      setError("All fields are required.");
      return;
    }
    setSaving(true);
    setError(null);

    try {
      const newTargetPayload: DualFilterTargetPayload = { // Use the specific payload type
        Business_Name: businessName,
        Start_Date: startDate,
        Primary_Target_Column: primaryColumn,
        Primary_Target_Key: primaryKey,
        Secondary_Target_Column: secondaryColumn,
        Secondary_Target_Key: secondaryKey,
        Target_Value: targetValue,
        target_filter_type: "dual_filter",
      };

      // Use the setDualFilterTargets API function
      await setDualFilterTargets([newTargetPayload]);

      const createdTarget: CollectionTarget = {
        ...newTargetPayload,
        Status: true, // Default to active
        Uploaded_At: new Date().toISOString(),
        Status_History: [{ status: true, timestamp: new Date().toISOString() }],
        id: `collection-target-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Generate a unique ID
        target_filter_type: "dual_filter" // Explicitly set for new targets
      };

      onTargetAdded(createdTarget);
    } catch (err) {
      console.error("Error adding collection target:", err);
      setError("Failed to add the collection target. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    // Match DailyTargetList's styling for the container
    <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-300">
      {/* Match AddTargetForm's heading style */}
      {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
      {/* Match AddTargetForm's grid layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3 mb-3">
        {/* Primary Column Dropdown */}
        <div className="flex flex-col">
          <label className="text-12 font-normal text-gray-500 mb-1">Primary Column<span className="text-dng">*</span></label>
          <div className="relative w-full">
            <SmartDropdown
              options={columns}
              value={primaryColumn}
              onChange={(val) => {
                console.log("AddCollectionTargetForm: Primary Column dropdown onChange called with value:", val);
                setPrimaryColumn(Array.isArray(val) ? val[0] : val);
                 setPrimaryKey(""); // Reset primary key when column changes
                 setSecondaryColumn(""); // Reset secondary column
                 setSecondaryKey(""); // Reset secondary key
              }}
              placeholder="Select Column"
              className="border rounded-lg w-full"
              enableSearch
              disabled={columnOptionsLoading || saving || !(user?.permissions?.admin)}
            />
          </div>
        </div>

        {/* Primary Key Dropdown */}
        <div className="flex flex-col">
          <label className="text-12 font-normal text-gray-500 mb-1">Primary Key<span className="text-dng">*</span></label>
          <div className="relative w-full">
            <SmartDropdown
              options={primaryKeys}
              value={primaryKey}
              onChange={(val) => {
                 setPrimaryKey(Array.isArray(val) ? val[0] : val);
                 setSecondaryKey(""); // Reset secondary key when primary key changes
              }}
              placeholder="Select Key"
              className="border rounded-lg w-full"
              enableSearch
              disabled={!primaryColumn || primaryOptionsLoading || saving || !(user?.permissions?.admin)}
            />
          </div>
        </div>

        {/* Secondary Column Dropdown */}
        <div className="flex flex-col">
          <label className="text-12 font-normal text-gray-500 mb-1">Secondary Column<span className="text-dng">*</span></label>
          <div className="relative w-full">
            <SmartDropdown
              options={columns.filter(col => col.value !== primaryColumn)} // Exclude primary column
              value={secondaryColumn}
              onChange={(val) => {
                console.log("AddCollectionTargetForm: Secondary Column dropdown onChange called with value:", val);
                setSecondaryColumn(Array.isArray(val) ? val[0] : val);
                 setSecondaryKey(""); // Reset secondary key when column changes
              }}
              placeholder="Select Column"
              className="border rounded-lg w-full"
              enableSearch
              disabled={columnOptionsLoading || saving || !(user?.permissions?.admin)}
            />
          </div>
        </div>

        {/* Secondary Key Dropdown */}
        <div className="flex flex-col">
          <label className="text-12 font-normal text-gray-500 mb-1">Secondary Key<span className="text-dng">*</span></label>
          <div className="relative w-full">
            <SmartDropdown
              options={secondaryKeys}
              value={secondaryKey}
              onChange={(val) => setSecondaryKey(Array.isArray(val) ? val[0] : val)}
              placeholder="Select Key"
              className="border rounded-lg w-full"
              enableSearch
              disabled={!secondaryColumn || secondaryOptionsLoading || saving || !(user?.permissions?.admin)}
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
            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={saving || !(user?.permissions?.admin)}
          />
        </div>

         {/* Target Value Input */}
         <div className="flex flex-col">
          <label className="text-12 font-normal text-gray-500 mb-1">Target Value<span className="text-dng">*</span></label>
          <input
            type="number"
            value={targetValue ?? ""}
            onChange={(e) => setTargetValue(e.target.value ? parseFloat(e.target.value) : undefined)}
            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="0"
            disabled={saving || !(user?.permissions?.admin)}
          />
        </div>

      </div>

      {/* Match AddTargetForm's button layout and styling */}
      <div className="flex items-end justify-end gap-2">
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
  );
};

export default function CollectionTargetList({ targets: initialTargets, businessName, onTargetsChange }: CollectionTargetListProps) {
  const [targets, setTargets] = useState<CollectionTarget[]>(initialTargets);
  const [updatingId, setUpdatingId] = useState<string | null>(null); // Track the ID of the target being updated
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const { user } = useUser(); // Assuming useUser hook provides user permissions

  // Update local state when prop changes (e.g., after fetching new data from parent)
  useEffect(() => {
     setTargets(initialTargets);
  }, [initialTargets]);

  // Filter targets to show only those with target_filter_type "dual_filter" or secondary column
  const filteredTargets = targets.filter(target => 
    target.target_type === "dual_filter" || 
    target.target_filter_type === "dual_filter" || 
    target.Secondary_Target_Column
  );

  const handleValueChange = (idx: number, value: number) => {
    // Update the original list state, not the filtered one
    const updated = targets.map((t, i) => (i === idx ? { ...t, Target_Value: value } : t));
    setTargets(updated);
    onTargetsChange?.(updated);
  };

  function buildUpdatePayload(target: CollectionTarget, options?: { status?: boolean; value?: number; is_deleted?: boolean }) {
    const payload: UpdateDualFilterTargetEntryPayload = { // Use the specific payload type
      Business_Name: target.Business_Name,
      Primary_Target_Column: target.Primary_Target_Column,
      Primary_Target_Key: target.Primary_Target_Key,
      Secondary_Target_Column: target.Secondary_Target_Column,
      Secondary_Target_Key: target.Secondary_Target_Key,
      Start_Date: target.Start_Date,
    };
    if (options?.status !== undefined) {
      payload.status = options.status;
    }
    if (options?.value !== undefined) {
      payload.Target_Value = options.value;
    }
    if (options?.is_deleted !== undefined) {
      payload.is_deleted = options.is_deleted;
    }
    return payload;
  }

  const handleDeactivate = async (target: CollectionTarget) => {
    const targetId = target.id || `${target.Primary_Target_Column}-${target.Primary_Target_Key}-${target.Secondary_Target_Column}-${target.Secondary_Target_Key}-${target.Start_Date}`;
    setUpdatingId(targetId); // Set updating ID
    try {
      await updateDualFilterTargetEntry(buildUpdatePayload(target, { status: false })); // Use the specific update function
      const updated = targets.map(t =>
        (t.Primary_Target_Column === target.Primary_Target_Column &&
         t.Primary_Target_Key === target.Primary_Target_Key &&
         t.Secondary_Target_Column === target.Secondary_Target_Column &&
         t.Secondary_Target_Key === target.Secondary_Target_Key &&
         t.Start_Date === target.Start_Date)
          ? { ...t, Status: false }
          : t
      );
      setTargets(updated);
      onTargetsChange?.(updated);
    } catch {
      alert("Failed to deactivate collection target");
    } finally {
      setUpdatingId(null); // Clear updating ID
    }
  };

  const handleActivate = async (target: CollectionTarget) => {
    const targetId = target.id || `${target.Primary_Target_Column}-${target.Primary_Target_Key}-${target.Secondary_Target_Column}-${target.Secondary_Target_Key}-${target.Start_Date}`;
    setUpdatingId(targetId); // Set updating ID
    try {
      await updateDualFilterTargetEntry(buildUpdatePayload(target, { status: true })); // Use the specific update function
      const updated = targets.map(t =>
        (t.Primary_Target_Column === target.Primary_Target_Column &&
         t.Primary_Target_Key === target.Primary_Target_Key &&
         t.Secondary_Target_Column === target.Secondary_Target_Column &&
         t.Secondary_Target_Key === target.Secondary_Target_Key &&
         t.Start_Date === target.Start_Date)
          ? { ...t, Status: true }
          : t
      );
      setTargets(updated);
      onTargetsChange?.(updated);
    } catch {
      alert("Failed to activate collection target");
    } finally {
      setUpdatingId(null); // Clear updating ID
    }
  };

  const handleValueUpdate = async (target: CollectionTarget) => {
    const targetId = target.id || `${target.Primary_Target_Column}-${target.Primary_Target_Key}-${target.Secondary_Target_Column}-${target.Secondary_Target_Key}-${target.Start_Date}`;
    setUpdatingId(targetId); // Set updating ID
    try {
      if (target.Target_Value !== undefined) {
        await updateDualFilterTargetEntry(buildUpdatePayload(target, { value: target.Target_Value })); // Use the specific update function
      }
    } catch {
      alert("Failed to update collection target value");
    } finally {
      setUpdatingId(null); // Clear updating ID
    }
  };

  const handleDelete = async (target: CollectionTarget) => {
    const targetId = target.id || `${target.Primary_Target_Column}-${target.Primary_Target_Key}-${target.Secondary_Target_Column}-${target.Secondary_Target_Key}-${target.Start_Date}`;
    const firstConfirm = window.confirm("Are you sure you want to delete this collection target?");
    if (firstConfirm) {
      const secondConfirm = window.confirm("This action cannot be undone. Are you absolutely sure?");
      if (secondConfirm) {
        setUpdatingId(targetId);

        // Optimistically update the UI
        setTargets(prevTargets => {
          const updated = prevTargets.filter(t => 
            !(t.Primary_Target_Column === target.Primary_Target_Column &&
              t.Primary_Target_Key === target.Primary_Target_Key &&
              t.Secondary_Target_Column === target.Secondary_Target_Column &&
              t.Secondary_Target_Key === target.Secondary_Target_Key &&
              t.Start_Date === target.Start_Date)
          );
          onTargetsChange?.(updated);
          return updated;
        });

        try {
          // Make API call after UI update
          await updateDualFilterTargetEntry(buildUpdatePayload(target, { is_deleted: true }));
        } catch (error) {
          console.error('Delete error:', error);
          // Revert the optimistic update on error
          setTargets(prevTargets => {
            const restored = [...prevTargets, target];
            onTargetsChange?.(restored);
            return restored;
          });
          alert("Failed to delete collection target");
        } finally {
          setUpdatingId(null);
        }
      }
    }
  };

  const handleTargetAdded = (newTarget: CollectionTarget) => {
    // Use functional update to ensure state is immediately updated
    setTargets(prevTargets => {
      const updated = [...prevTargets, { ...newTarget, target_type: "dual_filter" }];
      // Notify parent of changes
      onTargetsChange?.(updated);
      return updated;
    });
    setShowAddForm(false);
  };

  const toggleAddForm = () => {
    setShowAddForm(!showAddForm);
  };

  // Helper function to get target identifier for updating state
  const getTargetId = (target: CollectionTarget) => {
    return target.id || `${target.Primary_Target_Column}-${target.Primary_Target_Key}-${target.Secondary_Target_Column}-${target.Secondary_Target_Key}-${target.Start_Date}`;
  };

  return (
    // Match DailyTargetList's container styling
    <div className="pb-x20 px-x20 bg-white w-[100%]">
      {/* Match DailyTargetList's header and button styling */}

       {showAddForm && (
        <AddCollectionTargetForm
          businessName={businessName}
          onTargetAdded={handleTargetAdded}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      <div className="flex justify-end items-center mb-4">
        <button
          onClick={toggleAddForm}
          disabled={!(user?.permissions?.admin)}
          className={`px-4 py-1 rounded-md ${!(user?.permissions?.admin) ? 'bg-gray-300' : 'bg-gray-800 hover:bg-gray-700'} text-sm text-white`}
        >
          Add Target
        </button>
      </div>

      {/* Match DailyTargetList's table styling */}
      <div className="flex flex-col gap-2 mt-4">
        <div className="flex text-12 font-normal text-ltxt border-b pb-3 gap-4">
          <div className="w-[19%]">Primary Column</div>
          <div className="w-[19%]">Primary Key</div>
          <div className="w-[19%]">Secondary Column</div>
          <div className="w-[19%]">Secondary Key</div>
          <div className="w-[12%]">Start Date</div>
          <div className="w-[12%]">Target Value</div>
          <div className="w-[10%]">Status</div>
          <div className="w-[20%]">Action</div>
        </div>
        {filteredTargets.map((target) => {
          const currentTargetId = getTargetId(target);
          const isUpdating = updatingId === currentTargetId;
          
          return (
            <div
              key={currentTargetId}
              className="flex items-center gap-4 border-b py-3 hover:bg-gray-50 transition-colors text-sm text-gray-800"
            >
              <div className="w-[19%] truncate">{target.Primary_Target_Column}</div>
              <div className="w-[19%] truncate">{target.Primary_Target_Key}</div>
              <div className="w-[19%] truncate">{target.Secondary_Target_Column}</div>
              <div className="w-[19%] truncate">{target.Secondary_Target_Key}</div>
              <div className="w-[12%]">{target.Start_Date ?? "-"}</div>
              <div className="w-[12%]">
                <input
                  type="number"
                  className="border rounded-lg px-2 py-1 w-full text-right focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  value={target.Target_Value ?? ""}
                  min="0"
                  onChange={(e) => {
                       const originalIndex = targets.findIndex(origT => origT.id === target.id);
                       if (originalIndex !== -1) {
                           handleValueChange(originalIndex, parseFloat(e.target.value));
                       }
                  }}
                  onBlur={() => handleValueUpdate(target)}
                  disabled={
                    isUpdating || // Check against specific target ID
                    !(user?.permissions?.admin)
                  }
                />
              </div>
              <div className="w-[10%]">
                <span
                  className={
                    target.Status === undefined
                      ? "text-gray-400"
                      : target.Status
                        ? "text-green-600 font-medium"
                        : "text-gray-400"
                  }
                >
                  {target.Status === undefined ? "-" : target.Status ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="w-[20%]">
                {target.Status === true && (
                  <button
                    className="px-3 py-1 rounded-lg bg-newsecondary hover:bg-newsecondary/70 text-white text-xs disabled:opacity-50"
                    onClick={() => handleDeactivate(target)}
                    disabled={
                      isUpdating || // Check against specific target ID
                      !(user?.permissions?.admin)
                    }
                  >
                    {isUpdating ? "Updating..." : "Deactivate"}
                  </button>
                )}
                {target.Status === false && (
                  <button
                    className="px-3 py-1 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs disabled:opacity-50"
                    onClick={() => handleActivate(target)}
                    disabled={
                      isUpdating || // Check against specific target ID
                      !(user?.permissions?.admin)
                    }
                  >
                    {isUpdating ? "Updating..." : "Activate"}
                  </button>
                )}
                <button
                  className="ml-2 px-3 py-1 rounded-lg bg-gray-300 hover:bg-gray-400 text-gray-800 text-xs disabled:opacity-50"
                  onClick={() => handleDelete(target)}
                  disabled={
                    isUpdating || // Check against specific target ID
                    !(user?.permissions?.admin)
                  }
                >
                  {isUpdating ? "Updating..." : "Delete"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}